import { useQuery } from "@tanstack/react-query";
import { rpcServer } from "@/lib/stellar-rpc";
import { scValToNative } from "@stellar/stellar-sdk";

export interface GrantEvent {
  id: string;
  type: "grant_created" | "donation_received" | "grant_approved" | "funds_released" | "refund_claimed" | "unknown";
  grantId: number;
  actor: string;
  timestamp: string;
  ledger: number;
  details: string;
  amount?: string;
}

// Convert small/large numbers or bigints to nice string representation (with 7 decimals for XLM)
function formatXlmAmount(amount: any): string {
  try {
    const rawVal = BigInt(amount);
    // Soroban usually represents tokens in base units (e.g. 7 decimals for XLM standard SAC)
    const formatted = Number(rawVal) / 10000000;
    return `${formatted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })} XLM`;
  } catch {
    return `${amount}`;
  }
}

export function useEventFeed(contractId: string | null) {
  return useQuery<GrantEvent[]>({
    queryKey: ["contractEvents", contractId],
    queryFn: async () => {
      if (!contractId) return [];

      try {
        // Query the events for the contract
        const response = await rpcServer.getEvents({
          startLedger: 1, // Start from the beginning of ledger history on Testnet
          filters: [
            {
              type: "contract",
              contractIds: [contractId],
            },
          ],
          limit: 100,
        });

        const parsedEvents: GrantEvent[] = response.events.map((evt) => {
          const topics = evt.topic.map((t) => scValToNative(t));
          const value = scValToNative(evt.value);
          
          const eventTypeSymbol = topics[0];
          const grantId = Number(topics[1] || 0);
          const actor = topics[2] ? String(topics[2]) : "";
          const timestamp = evt.ledgerClosedAt 
            ? new Date(evt.ledgerClosedAt).toLocaleString() 
            : new Date().toLocaleString();

          let type: GrantEvent["type"] = "unknown";
          let details = "Contract event occurred";
          let amount: string | undefined;

          if (eventTypeSymbol === "grant_created") {
            type = "grant_created";
            const targetAmount = formatXlmAmount(value[1]);
            const deadline = new Date(Number(value[2]) * 1000).toLocaleDateString();
            details = `Grant #${grantId} created by ${actor.substring(0, 6)}...${actor.substring(actor.length - 4)} with a target of ${targetAmount} (deadline: ${deadline})`;
          } else if (eventTypeSymbol === "donation_received") {
            type = "donation_received";
            amount = formatXlmAmount(value);
            details = `Donor ${actor.substring(0, 6)}...${actor.substring(actor.length - 4)} contributed ${amount} to Grant #${grantId}`;
          } else if (eventTypeSymbol === "grant_approved") {
            type = "grant_approved";
            details = `Milestone for Grant #${grantId} was approved by the administrator`;
          } else if (eventTypeSymbol === "funds_released") {
            type = "funds_released";
            amount = formatXlmAmount(value);
            details = `Grant #${grantId} funding of ${amount} released to recipient ${actor.substring(0, 6)}...${actor.substring(actor.length - 4)}`;
          } else if (eventTypeSymbol === "refund_claimed") {
            type = "refund_claimed";
            amount = formatXlmAmount(value);
            details = `Donor ${actor.substring(0, 6)}...${actor.substring(actor.length - 4)} claimed a refund of ${amount} for Grant #${grantId}`;
          }

          return {
            id: evt.id,
            type,
            grantId,
            actor,
            timestamp,
            ledger: evt.ledger,
            details,
            amount,
          };
        });

        // Return sorted, newest first
        return parsedEvents.reverse();
      } catch (err) {
        console.error("Error fetching Soroban events:", err);
        return [];
      }
    },
    enabled: !!contractId,
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
  });
}
