import { create } from "zustand";

export interface TrackedTransaction {
  hash: string;
  description: string;
  status: "pending" | "success" | "failed";
  timestamp: number;
  error?: string;
}

interface TransactionTrackerState {
  transactions: TrackedTransaction[];
  addTransaction: (hash: string, description: string) => void;
  updateTransaction: (hash: string, status: "success" | "failed", error?: string) => void;
  clearTransactions: () => void;
}

export const useTransactionTracker = create<TransactionTrackerState>((set) => ({
  transactions: [],
  
  addTransaction: (hash, description) => set((state) => ({
    transactions: [
      {
        hash,
        description,
        status: "pending",
        timestamp: Date.now()
      },
      ...state.transactions
    ]
  })),

  updateTransaction: (hash, status, error) => set((state) => ({
    transactions: state.transactions.map((tx) =>
      tx.hash === hash ? { ...tx, status, error } : tx
    )
  })),

  clearTransactions: () => set({ transactions: [] })
}));
