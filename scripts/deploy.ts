import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";
import {
  rpc,
  Keypair,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Operation,
  xdr,
  Address,
  scValToNative,
  Horizon,
  Account,
  Contract,
} from "@stellar/stellar-sdk";

const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

const rpcServer = new rpc.Server(RPC_URL);
const horizonServer = new Horizon.Server(HORIZON_URL);

// Native XLM token contract address on Stellar Testnet
const NATIVE_TOKEN_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

async function run() {
  console.log("------------------------------------------------------");
  console.log("Stellar Soroban Contract Deployment Script");
  console.log("------------------------------------------------------");

  // Load or generate deployer keypair
  let deployerKeypair: Keypair;
  const envPath = path.join(process.cwd(), ".env.local");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  const existingSecret = envContent.match(/DEPLOYER_SECRET_KEY=([^\s]+)/)?.[1];

  if (existingSecret) {
    console.log("Loading existing deployer secret key from .env.local...");
    deployerKeypair = Keypair.fromSecret(existingSecret);
  } else {
    console.log("No existing deployer found. Generating fresh keypair...");
    deployerKeypair = Keypair.random();
    const newEnvLine = `DEPLOYER_SECRET_KEY=${deployerKeypair.secret()}\n`;
    fs.writeFileSync(envPath, envContent + "\n" + newEnvLine);
    console.log(`Generated deployer: ${deployerKeypair.publicKey()}`);
    console.log("Secret saved to .env.local");
  }

  const deployerAddress = deployerKeypair.publicKey();

  // Fund deployer via Friendbot if unfunded
  try {
    console.log(`Checking account status for: ${deployerAddress}`);
    await horizonServer.loadAccount(deployerAddress);
    console.log("Account already exists on Testnet.");
  } catch (err: any) {
    if (err.response?.status === 404) {
      console.log("Account not found. Requesting funds from Friendbot...");
      const friendbotUrl = `https://friendbot.stellar.org/?addr=${deployerAddress}`;
      const friendbotRes = await fetch(friendbotUrl);
      if (!friendbotRes.ok) {
        throw new Error(`Friendbot failed: ${await friendbotRes.text()}`);
      }
      console.log("Account successfully funded via Friendbot!");
      // Wait a brief moment for ledger close
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      throw err;
    }
  }

  // Read contract WASM file
  const wasmPath = path.join(
    process.cwd(),
    "contracts/grant_distribution.wasm"
  );
  if (!fs.existsSync(wasmPath)) {
    throw new Error(`WASM file not found at: ${wasmPath}. Please compile the contract first.`);
  }

  console.log("Reading WASM bytecode...");
  const wasmBytes = fs.readFileSync(wasmPath);

  // 1. Upload WASM bytes
  console.log("Uploading WASM bytecode to Testnet...");
  const txSource = await fetchAccount(deployerAddress);
  
  let uploadTx = new TransactionBuilder(txSource, {
    fee: "1000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.uploadContractWasm({ wasm: wasmBytes }))
    .setTimeout(120)
    .build();

  console.log("Simulating upload transaction...");
  let simResult = await rpcServer.simulateTransaction(uploadTx);
  if (!rpc.Api.isSimulationSuccess(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  uploadTx = rpc.assembleTransaction(uploadTx, simResult).build();
  uploadTx.sign(deployerKeypair);
  
  console.log("Submitting upload transaction...");
  const uploadResult = await submitTx(uploadTx);
  
  // Extract WASM ID
  const wasmId = uploadResult.wasmId;
  if (!wasmId) {
    throw new Error("Could not find WASM ID in transaction output");
  }
  console.log(`WASM Uploaded Successfully. WASM ID: ${wasmId}`);

  // 2. Create Contract Instance
  console.log("Instantiating contract...");
  const currentSource = await fetchAccount(deployerAddress);
  let createTx = new TransactionBuilder(currentSource, {
    fee: "1000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.createCustomContract({
        address: Address.fromString(deployerAddress),
        wasmHash: Buffer.from(wasmId, "hex"),
        salt: crypto.randomBytes(32),
      })
    )
    .setTimeout(120)
    .build();

  console.log("Simulating instantiation transaction...");
  simResult = await rpcServer.simulateTransaction(createTx);
  if (!rpc.Api.isSimulationSuccess(simResult)) {
    throw new Error(`Instantiation simulation failed: ${simResult.error}`);
  }

  createTx = rpc.assembleTransaction(createTx, simResult).build();
  createTx.sign(deployerKeypair);

  console.log("Submitting instantiation transaction...");
  const createResult = await submitTx(createTx);
  const contractId = createResult.contractId;
  if (!contractId) {
    throw new Error("Could not find Contract ID in transaction output");
  }
  console.log(`Contract Instantiated. Contract ID: ${contractId}`);

  // 3. Initialize Contract
  console.log("Initializing contract states...");
  const initSource = await fetchAccount(deployerAddress);
  const contract = new Contract(contractId);
  
  let initTx = new TransactionBuilder(initSource, {
    fee: "1000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "initialize",
        Address.fromString(deployerAddress).toScVal(),
        Address.fromString(NATIVE_TOKEN_SAC).toScVal()
      )
    )
    .setTimeout(120)
    .build();

  console.log("Simulating initialization...");
  simResult = await rpcServer.simulateTransaction(initTx);
  if (!rpc.Api.isSimulationSuccess(simResult)) {
    throw new Error(`Initialization simulation failed: ${simResult.error}`);
  }

  initTx = rpc.assembleTransaction(initTx, simResult).build();
  initTx.sign(deployerKeypair);

  console.log("Submitting initialization transaction...");
  await submitTx(initTx);
  console.log("Contract successfully initialized!");

  // Save Contract ID to environment config
  console.log("Saving configurations...");
  const configDir = path.join(process.cwd(), "lib");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
  }
  
  const configPath = path.join(configDir, "contract-config.json");
  const config = {
    contractId,
    tokenAddress: NATIVE_TOKEN_SAC,
    deployerAddress,
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`Saved configuration to: ${configPath}`);

  // Append/Update NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local
  let newEnv = "";
  if (fs.existsSync(envPath)) {
    newEnv = fs.readFileSync(envPath, "utf8");
  }
  // Remove existing entries if present
  newEnv = newEnv.replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/g, "");
  newEnv = newEnv.replace(/NEXT_PUBLIC_TOKEN_ADDRESS=.*/g, "");
  newEnv += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${contractId}\n`;
  newEnv += `NEXT_PUBLIC_TOKEN_ADDRESS=${NATIVE_TOKEN_SAC}\n`;
  fs.writeFileSync(envPath, newEnv.trim() + "\n");
  console.log("Updated .env.local with contract variables.");
  console.log("Deployment complete! Run 'npm run dev' to start the application.");
}

async function fetchAccount(address: string): Promise<Account> {
  const accountResponse = await horizonServer.loadAccount(address);
  return new Account(address, accountResponse.sequenceNumber());
}

interface TxResult {
  hash: string;
  wasmId?: string;
  contractId?: string;
}

async function submitTx(tx: any): Promise<TxResult> {
  const submitResponse = await rpcServer.sendTransaction(tx);
  if (submitResponse.status === "ERROR") {
    throw new Error(`Tx Error: ${submitResponse.errorResult || (submitResponse as any).errorResultXdr}`);
  }

  const hash = submitResponse.hash;
  
  // Poll transaction status
  for (let i = 0; i < 20; i++) {
    const txResponse = await rpcServer.getTransaction(hash);
    if (txResponse.status === "SUCCESS") {
      let wasmId: string | undefined;
      let contractId: string | undefined;

      // Use returnValue if available (newer SDK)
      const returnValue = (txResponse as any).returnValue;
      if (returnValue) {
        try {
          const native = scValToNative(returnValue);
          console.log("Return value (native):", native);
          // WASM upload returns bytes (the wasm hash)
          if (Buffer.isBuffer(native) || (native instanceof Uint8Array)) {
            wasmId = Buffer.from(native).toString("hex");
          }
          // Contract creation returns an Address string
          if (typeof native === "string" && native.startsWith("C")) {
            contractId = native;
          }
        } catch (err: any) {
          console.log("Return value parsing fallback:", err.message);
        }
      }

      // Fallback: parse resultMetaXdr for v3 sorobanMeta
      if (!wasmId && !contractId && txResponse.resultMetaXdr) {
        try {
          const meta = txResponse.resultMetaXdr;
          const v3 = meta.v3();
          const sorobanMeta = v3.sorobanMeta();
          if (sorobanMeta) {
            const retVal = sorobanMeta.returnValue();
            if (retVal) {
              const native = scValToNative(retVal);
              console.log("Meta return value (native):", native);
              if (Buffer.isBuffer(native) || (native instanceof Uint8Array)) {
                wasmId = Buffer.from(native).toString("hex");
              }
              if (typeof native === "string" && native.startsWith("C")) {
                contractId = native;
              }
            }
          }
        } catch (err: any) {
          console.log("Meta parsing fallback:", err.message);
        }
      }

      return { hash, wasmId, contractId };
    } else if (txResponse.status === "FAILED") {
      throw new Error(`Tx Failed: ${txResponse.resultXdr?.toXDR("base64")}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  
  throw new Error("Tx submission timed out");
}

run().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
