"use client";

import { useTransactionTracker, TrackedTransaction } from "@/hooks/useTransactionTracker";

const EXPLORER_BASE = "https://stellar.expert/explorer/testnet/tx";

function TxStatusBadge({ status }: { status: TrackedTransaction["status"] }) {
  if (status === "pending") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Pending
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Success
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-red-400">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
      Failed
    </span>
  );
}

interface TransactionDrawerProps {
  onClose: () => void;
}

export function TransactionDrawer({ onClose }: TransactionDrawerProps) {
  const { transactions, clearTransactions } = useTransactionTracker();

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end p-4 pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-sm glass-panel p-5 z-10 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Transactions
          </h3>
          <div className="flex items-center gap-2">
            {transactions.length > 0 && (
              <button
                onClick={clearTransactions}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Transaction list */}
        <div className="overflow-y-auto flex-1 space-y-2">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No transactions yet
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.hash}
                className="p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-white">{tx.description}</p>
                  <TxStatusBadge status={tx.status} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-mono">
                    {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                  </p>
                  <a
                    href={`${EXPLORER_BASE}/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                  >
                    Explorer
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
                {tx.error && (
                  <p className="mt-1.5 text-xs text-red-400 break-all">{tx.error.slice(0, 100)}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
