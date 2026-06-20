"use client";

import { useWallet } from "@/hooks/useWallet";
import { useEffect, useState } from "react";
import { WalletModal } from "@/components/WalletModal";

const EXPLORER_BASE = "https://stellar.expert/explorer/testnet/account";

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function DashboardPage() {
  const { address, isConnected, balance, network, refreshBalance } = useWallet();
  const [showWallet, setShowWallet] = useState(false);
  const [friendbotLoading, setFriendbotLoading] = useState(false);
  const [friendbotMsg, setFriendbotMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isConnected) refreshBalance();
  }, [isConnected]);

  async function requestFriendbot() {
    if (!address) return;
    setFriendbotLoading(true);
    setFriendbotMsg("");
    try {
      const res = await fetch(`https://friendbot.stellar.org/?addr=${address}`);
      if (res.ok) {
        setFriendbotMsg("✅ 10,000 XLM funded to your account!");
        await refreshBalance();
      } else {
        const err = await res.text();
        if (err.includes("already funded") || err.includes("createAccountAlreadyExist")) {
          setFriendbotMsg("ℹ️ Account already funded by Friendbot.");
        } else {
          setFriendbotMsg("❌ Friendbot failed. Try again later.");
        }
      }
    } catch {
      setFriendbotMsg("❌ Network error. Check your connection.");
    } finally {
      setFriendbotLoading(false);
    }
  }

  function handleCopy() {
    if (!address) return;
    copy(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="glass-panel max-w-md mx-auto p-8 text-center mt-20">
          <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
            No Wallet Connected
          </h2>
          <p className="text-gray-400 text-sm mb-6">Connect a Stellar wallet to view your dashboard.</p>
          <button
            id="dashboard-connect-btn"
            onClick={() => setShowWallet(true)}
            className="px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 transition-all duration-200"
          >
            Connect Wallet
          </button>
        </div>
        {showWallet && <WalletModal onClose={() => setShowWallet(false)} />}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Wallet Dashboard
        </h1>
        <p className="text-gray-400 mt-1">Your connected Stellar account details</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main account card */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Connected Account</p>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium text-emerald-400">{network}</span>
              </div>
            </div>
            <button
              onClick={refreshBalance}
              id="refresh-balance-btn"
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>

          {/* Address */}
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2">Public Key</p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm text-white break-all">{address}</span>
              <button onClick={handleCopy} className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-all text-gray-400 hover:text-white">
                {copied ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2">XLM Balance</p>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              {balance ?? <span className="text-gray-500 text-xl">Loading...</span>}
              {balance && <span className="text-lg text-gray-400 ml-2">XLM</span>}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <a
              href={`${EXPLORER_BASE}/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              id="explorer-link"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
            >
              Explorer
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Friendbot panel */}
        <div className="glass-panel p-6">
          <h2 className="text-base font-semibold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>
            🤖 Testnet Faucet
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            Get free XLM for testing on Stellar Testnet using Friendbot.
          </p>
          <button
            id="friendbot-btn"
            onClick={requestFriendbot}
            disabled={friendbotLoading}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {friendbotLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Requesting...
              </span>
            ) : (
              "Request 10,000 XLM"
            )}
          </button>
          {friendbotMsg && (
            <p className="mt-3 text-sm text-gray-300 text-center">{friendbotMsg}</p>
          )}

          {/* Network info */}
          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Network Info</p>
            {[
              { label: "Network", value: "Testnet" },
              { label: "RPC", value: "soroban-testnet.stellar.org" },
              { label: "Horizon", value: "horizon-testnet.stellar.org" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{item.label}</span>
                <span className="text-xs text-gray-300 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
