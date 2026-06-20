"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";

const WALLETS = [
  {
    id: "freighter",
    name: "Freighter",
    description: "Browser extension wallet by SDF",
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#3E1BDB" />
        <path d="M8 20L20 8L32 20L20 32L8 20Z" fill="white" opacity="0.9" />
      </svg>
    ),
  },
  {
    id: "xbull",
    name: "xBull Wallet",
    description: "Multi-purpose Stellar wallet",
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#0D1421" />
        <circle cx="20" cy="20" r="12" fill="none" stroke="#3366FF" strokeWidth="2.5" />
        <path d="M14 20L20 14L26 20" fill="none" stroke="#3366FF" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "lobstr",
    name: "LOBSTR",
    description: "Simple & secure Stellar wallet",
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#4B1ED0" />
        <circle cx="20" cy="20" r="10" fill="white" opacity="0.2" />
        <circle cx="20" cy="20" r="5" fill="white" />
      </svg>
    ),
  },
  {
    id: "rabet",
    name: "Rabet",
    description: "Stellar browser extension wallet",
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#1A1A2E" />
        <path d="M10 30V10L22 10C28 10 30 14 30 18C30 24 24 26 20 26L28 30" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id: "hana",
    name: "Hana Wallet",
    description: "Modern Web3 multi-chain wallet",
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#FF6B6B" />
        <path d="M20 10C20 10 12 16 12 22C12 26.4183 15.5817 30 20 30C24.4183 30 28 26.4183 28 22C28 16 20 10 20 10Z" fill="white" opacity="0.9" />
      </svg>
    ),
  },
];

interface WalletModalProps {
  onClose: () => void;
}

export function WalletModal({ onClose }: WalletModalProps) {
  const { connectWallet, isLoading, error, setError } = useWallet();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (walletId: string) => {
    setConnecting(walletId);
    setError(null);
    try {
      await connectWallet(walletId);
      onClose();
    } catch {
      // error is set in the store
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Connect Wallet"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-panel p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              Connect Wallet
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Choose a Stellar wallet to connect</p>
          </div>
          <button
            onClick={onClose}
            id="close-wallet-modal"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Wallet List */}
        <div className="space-y-2">
          {WALLETS.map((wallet) => {
            const isConnecting = connecting === wallet.id;
            return (
              <button
                key={wallet.id}
                id={`wallet-${wallet.id}`}
                onClick={() => handleConnect(wallet.id)}
                disabled={isLoading || !!connecting}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 transition-all duration-200 text-left group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex-shrink-0 rounded-lg overflow-hidden">
                  {wallet.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                    {wallet.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{wallet.description}</p>
                </div>
                <div className="flex-shrink-0">
                  {isConnecting ? (
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-600 group-hover:text-purple-400 transition-colors"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          By connecting, you agree to use this app on Stellar Testnet only.
        </p>
      </div>
    </div>
  );
}
