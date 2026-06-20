"use client";

import { useTransactionTracker } from "@/hooks/useTransactionTracker";

const EXPLORER_BASE = "https://stellar.expert/explorer/testnet/tx";

function formatAddress(hash: string) {
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

export default function TransactionsPage() {
  const { transactions, clearTransactions } = useTransactionTracker();

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Transaction History
          </h1>
          <p className="text-gray-400 mt-1">
            Track all Soroban smart contract interactions initiated from this browser session.
          </p>
        </div>
        {transactions.length > 0 && (
          <button
            id="clear-tx-history-btn"
            onClick={clearTransactions}
            className="px-4 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all cursor-pointer"
          >
            Clear History
          </button>
        )}
      </div>

      <div className="glass-panel overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-600/10 flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">No Transactions Yet</h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Transactions will appear here once you initiate operations like creating a grant or making a donation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Description</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Transaction Hash</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Timestamp</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      {tx.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                          Pending
                        </span>
                      )}
                      {tx.status === "success" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Success
                        </span>
                      )}
                      {tx.status === "failed" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-white">{tx.description}</p>
                        {tx.error && <p className="text-xs text-red-400 mt-1 max-w-xs truncate" title={tx.error}>{tx.error}</p>}
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap font-mono text-xs text-gray-300">
                      {formatAddress(tx.hash)}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <a
                        id={`explorer-link-${tx.hash}`}
                        href={`${EXPLORER_BASE}/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 hover:underline transition-all"
                      >
                        View Details
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
