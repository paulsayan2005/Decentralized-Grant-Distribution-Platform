"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { useTransactionTracker } from "@/hooks/useTransactionTracker";
import { WalletModal } from "@/components/WalletModal";
import { TransactionDrawer } from "@/components/TransactionDrawer";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/grants", label: "Grants" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/activity", label: "Activity" },
  { href: "/transactions", label: "Transactions" },
];

function formatAddress(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected, disconnectWallet } = useWallet();
  const { transactions } = useTransactionTracker();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showTxDrawer, setShowTxDrawer] = useState(false);
  const pendingCount = transactions.filter((t) => t.status === "pending").length;

  return (
    <>
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 h-16 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow duration-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Grant<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Flow</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Testnet Badge */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Testnet
            </span>

            {/* Transaction counter */}
            {transactions.length > 0 && (
              <button
                id="tx-drawer-btn"
                onClick={() => setShowTxDrawer(true)}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span className="text-xs text-gray-400">{transactions.length}</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-purple-600 text-white text-[10px] rounded-full animate-pulse font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {/* Wallet Button */}
            {isConnected && address ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/10 border border-purple-500/20 text-sm text-purple-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {formatAddress(address)}
                </div>
                <button
                  id="disconnect-btn"
                  onClick={disconnectWallet}
                  className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-all duration-200"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                id="connect-wallet-btn"
                onClick={() => setShowWalletModal(true)}
                className="relative px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 active:scale-95"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      {showWalletModal && <WalletModal onClose={() => setShowWalletModal(false)} />}
      {showTxDrawer && <TransactionDrawer onClose={() => setShowTxDrawer(false)} />}
    </>
  );
}
