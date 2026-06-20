import { getStellarWalletsKit } from "@/lib/wallet";
import { buildTransaction, submitTransaction, simulateCall, parseArg } from "@/lib/stellar-rpc";
import { useTransactionTracker } from "@/hooks/useTransactionTracker";
import contractConfig from "@/lib/contract-config.json";
import { Grant } from "@/types";

export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || contractConfig.contractId;
export const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || contractConfig.tokenAddress;

// Convert raw Soroban i128 (usually 7-decimal XLM) to human-readable XLM
export function rawToXlm(raw: bigint | number): string {
  const val = Number(BigInt(raw)) / 10_000_000;
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
}

// Convert human-readable XLM to the raw i128 units expected by the contract
export function xlmToRaw(xlm: number): bigint {
  return BigInt(Math.round(xlm * 10_000_000));
}

// Map raw grant data (native types from XDR) to typed Grant object
function mapGrant(raw: any): Grant {
  return {
    id: Number(raw.id),
    creator: raw.creator?.toString() || "",
    recipient: raw.recipient?.toString() || "",
    target: rawToXlm(raw.target),
    balance: rawToXlm(raw.balance),
    deadline: Number(raw.deadline),
    released: Boolean(raw.released),
    approved: Boolean(raw.approved),
    description: raw.description?.toString() || "",
  };
}

// ─── Read Functions ──────────────────────────────────────────────────────────

export async function fetchGrantCount(): Promise<number> {
  const raw = await simulateCall(CONTRACT_ID, "get_grant_count");
  return Number(raw || 0);
}

export async function fetchGrant(id: number): Promise<Grant | null> {
  const raw = await simulateCall(CONTRACT_ID, "get_grant", [parseArg(id, "u32")]);
  if (!raw) return null;
  return mapGrant(raw);
}

export async function fetchAllGrants(): Promise<Grant[]> {
  const count = await fetchGrantCount();
  const promises = Array.from({ length: count }, (_, i) => fetchGrant(i + 1));
  const results = await Promise.all(promises);
  return results.filter(Boolean) as Grant[];
}

export async function fetchDonorAmount(grantId: number, donor: string): Promise<string> {
  const raw = await simulateCall(CONTRACT_ID, "get_donor_amount", [
    parseArg(grantId, "u32"),
    parseArg(donor, "address"),
  ]);
  return rawToXlm(raw || 0);
}

// ─── Write Functions ─────────────────────────────────────────────────────────

async function signAndSubmit(
  walletAddress: string,
  contractFn: string,
  args: any[],
  description: string
): Promise<string> {
  const { addTransaction, updateTransaction } = useTransactionTracker.getState();

  // Build transaction
  const tx = await buildTransaction(CONTRACT_ID, walletAddress, contractFn, args);

  // Sign with wallet kit
  const kit = await getStellarWalletsKit();
  let signedTxXdr: string;
  try {
    const result = await kit.signTransaction(tx.toXDR(), {
      address: walletAddress,
    });
    signedTxXdr = result.signedTxXdr;
  } catch (err: any) {
    if (err?.message?.includes("reject") || err?.code === 4001) {
      throw new Error("User rejected the transaction.");
    }
    throw new Error(`Signing failed: ${err?.message || "Unknown error"}`);
  }

  // Submit and track
  let txHash = "";
  await submitTransaction(signedTxXdr, (status, data) => {
    if (status === "sending") {
      txHash = data.hash;
      addTransaction(data.hash, description);
    } else if (status === "success") {
      updateTransaction(data.hash, "success");
    } else if (status === "failed") {
      updateTransaction(data.hash, "failed", data.error);
    }
  });

  return txHash;
}

export async function createGrant(
  walletAddress: string,
  recipient: string,
  targetXlm: number,
  deadlineTimestamp: number,
  description: string
): Promise<string> {
  return signAndSubmit(
    walletAddress,
    "create_grant",
    [
      parseArg(walletAddress, "address"),
      parseArg(recipient, "address"),
      parseArg(xlmToRaw(targetXlm), "i128"),
      parseArg(deadlineTimestamp, "u32"),
      parseArg(description, "string"),
    ],
    `Create Grant: ${description.slice(0, 30)}...`
  );
}

export async function donate(
  walletAddress: string,
  grantId: number,
  amountXlm: number
): Promise<string> {
  return signAndSubmit(
    walletAddress,
    "donate",
    [
      parseArg(walletAddress, "address"),
      parseArg(grantId, "u32"),
      parseArg(xlmToRaw(amountXlm), "i128"),
    ],
    `Donate ${amountXlm} XLM to Grant #${grantId}`
  );
}

export async function approveMilestone(walletAddress: string, grantId: number): Promise<string> {
  return signAndSubmit(
    walletAddress,
    "approve_milestone",
    [parseArg(grantId, "u32")],
    `Approve Milestone for Grant #${grantId}`
  );
}

export async function claimFunds(walletAddress: string, grantId: number): Promise<string> {
  return signAndSubmit(
    walletAddress,
    "claim_funds",
    [parseArg(grantId, "u32")],
    `Release Funds for Grant #${grantId}`
  );
}

export async function claimRefund(walletAddress: string, grantId: number): Promise<string> {
  return signAndSubmit(
    walletAddress,
    "claim_refund",
    [parseArg(grantId, "u32"), parseArg(walletAddress, "address")],
    `Claim Refund for Grant #${grantId}`
  );
}
