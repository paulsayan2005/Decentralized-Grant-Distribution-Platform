import {
  rpc,
  Contract,
  Address,
  scValToNative,
  nativeToScVal,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Horizon,
  Transaction,
  Account,
} from "@stellar/stellar-sdk";

export const RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const rpcServer = new rpc.Server(RPC_URL);
export const horizonServer = new Horizon.Server(HORIZON_URL);

// Helper to convert standard JS types to ScVal (Soroban values)
export function parseArg(val: any, type: "u32" | "u64" | "i128" | "address" | "string" | "bool"): any {
  switch (type) {
    case "u32":
      return nativeToScVal(Number(val), { type: "u32" });
    case "u64":
      return nativeToScVal(BigInt(val), { type: "u64" });
    case "i128":
      return nativeToScVal(BigInt(val), { type: "i128" });
    case "address":
      return Address.fromString(val).toScVal();
    case "string":
      return nativeToScVal(String(val), { type: "string" });
    case "bool":
      return nativeToScVal(Boolean(val));
    default:
      return nativeToScVal(val);
  }
}

// Simulate a contract call (read state)
export async function simulateCall(
  contractId: string,
  functionName: string,
  args: any[] = []
): Promise<any> {
  const contract = new Contract(contractId);
  const dummySource = "GCT6V6M2U7JSDG7JCS67PNSXGNEO5KNDHJZ2CEXGNY7OVS54366A5M5E";
  
  try {
    const tx = new TransactionBuilder(
      new Account(dummySource, "0"),
      { fee: BASE_FEE.toString(), networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(contract.call(functionName, ...args))
      .setTimeout(30)
      .build();

    const simResult = await rpcServer.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationSuccess(simResult)) {
      if (simResult.result && simResult.result.retval) {
        return scValToNative(simResult.result.retval);
      }
      return null;
    } else {
      const errorMsg = simResult.error || "Simulation failed";
      throw new Error(errorMsg);
    }
  } catch (err: any) {
    console.error(`Simulation error for ${functionName}:`, err);
    throw err;
  }
}

// Build a transaction for a state-changing contract call (write state)
export async function buildTransaction(
  contractId: string,
  sourceAddress: string,
  functionName: string,
  args: any[] = []
): Promise<Transaction> {
  const contract = new Contract(contractId);
  
  // Fetch the latest sequence number from the network
  let account;
  try {
    account = await horizonServer.loadAccount(sourceAddress);
  } catch (err: any) {
    console.error("Error loading source account:", err);
    throw new Error("Source account does not exist or has no XLM balance. Use Friendbot to fund it first.");
  }

  // Construct the base transaction
  const tx = new TransactionBuilder(account, {
    fee: "500000", // Standard fee estimate, will be adjusted by simulation
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(180)
    .build();

  // Simulate the transaction to determine fee and resource footprints
  const simResult = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(simResult)) {
    // Assemble the transaction with simulation data (adds footprints, adjust fees, etc.)
    return rpc.assembleTransaction(tx, simResult).build() as Transaction;
  } else {
    throw new Error(simResult.error || `Simulation failed for transaction: ${functionName}`);
  }
}

// Submit a signed transaction and poll for completion
export async function submitTransaction(
  signedTxXdr: string,
  onProgress?: (status: "sending" | "pending" | "success" | "failed", progressData?: any) => void
): Promise<rpc.Api.GetTransactionResponse> {
  const tx = new Transaction(signedTxXdr, NETWORK_PASSPHRASE);
  const hash = tx.hash().toString("hex");

  if (onProgress) onProgress("sending", { hash });

  const sendResult = await rpcServer.sendTransaction(tx);
  if (sendResult.status === "ERROR") {
    const errorMsg = sendResult.errorResult || (sendResult as any).errorResultXdr || "Submission error";
    if (onProgress) onProgress("failed", { hash, error: errorMsg });
    throw new Error(`Failed to submit transaction: ${errorMsg}`);
  }

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 20;
  
  if (onProgress) onProgress("pending", { hash });

  while (attempts < maxAttempts) {
    const statusResult = await rpcServer.getTransaction(hash);
    
    if (statusResult.status === "SUCCESS") {
      if (onProgress) onProgress("success", { hash, ledger: statusResult.ledger });
      return statusResult;
    } else if (statusResult.status === "FAILED") {
      const errorDetail = statusResult.resultXdr?.toXDR("base64") || "Transaction failed execution";
      if (onProgress) onProgress("failed", { hash, error: errorDetail });
      throw new Error(`Transaction failed: ${errorDetail}`);
    }
    
    // Wait 2 seconds before polling again
    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts++;
  }

  if (onProgress) onProgress("failed", { hash, error: "Transaction timed out polling" });
  throw new Error("Transaction polling timed out");
}
