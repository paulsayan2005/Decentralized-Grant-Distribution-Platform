import { create } from "zustand";
import { getStellarWalletsKit } from "@/lib/wallet";
import { Horizon } from "@stellar/stellar-sdk";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  balance: string | null;
  network: string;
  selectedWallet: string | null;
  error: string | null;
  isLoading: boolean;
  connectWallet: (walletId: string) => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  setError: (error: string | null) => void;
}

const HORIZON_URL = "https://horizon-testnet.stellar.org";

export const useWallet = create<WalletState>((set, get) => ({
  address: null,
  isConnected: false,
  balance: null,
  network: "Testnet",
  selectedWallet: null,
  error: null,
  isLoading: false,

  setError: (error) => set({ error }),

  connectWallet: async (walletId: string) => {
    set({ isLoading: true, error: null });
    try {
      const kit = await getStellarWalletsKit();
      
      // Attempt to set active wallet
      try {
        await kit.setWallet(walletId);
      } catch (err: any) {
        console.warn("Wallet setup error:", err);
        throw new Error(`Wallet ${walletId} not found or failed to initialize. Please ensure it is installed.`);
      }

      // Fetch wallet address
      let addressRes;
      try {
        addressRes = await kit.fetchAddress();
      } catch (err: any) {
        console.warn("User rejected or failed to get address:", err);
        if (err?.message?.includes("reject") || err?.message?.includes("deny")) {
          throw new Error("User rejected connection request.");
        }
        throw new Error("Could not retrieve wallet address. Ensure your wallet is unlocked.");
      }

      const walletAddress = addressRes.address;
      set({ address: walletAddress, isConnected: true, selectedWallet: walletId });
      
      // Load balance
      await get().refreshBalance();
    } catch (err: any) {
      set({ error: err.message || "An unexpected error occurred during connection." });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  disconnectWallet: () => {
    set({
      address: null,
      isConnected: false,
      balance: null,
      selectedWallet: null,
      error: null
    });
  },

  refreshBalance: async () => {
    const { address } = get();
    if (!address) return;

    try {
      const server = new Horizon.Server(HORIZON_URL);
      const account = await server.loadAccount(address);
      const nativeBalance = account.balances.find(
        (b: any) => b.asset_type === "native"
      );
      set({ balance: nativeBalance ? nativeBalance.balance : "0.00" });
    } catch (err: any) {
      console.warn("Error loading account balance:", err);
      // If account is not found on network, it's unfunded
      if (err.response?.status === 404) {
        set({ balance: "0.00 (Unfunded)" });
      } else {
        set({ balance: "0.00" });
      }
    }
  }
}));
