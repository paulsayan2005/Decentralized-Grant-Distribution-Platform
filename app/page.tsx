"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useState } from "react";
import { WalletModal } from "@/components/WalletModal";

const features = [
  {
    icon: "🔐",
    title: "Trustless Smart Contracts",
    desc: "Grant logic is enforced by Soroban smart contracts on Stellar — no middlemen, no bureaucracy.",
  },
  {
    icon: "⚡",
    title: "Instant XLM Donations",
    desc: "Contribute directly in XLM with near-zero fees and 5-second settlement times.",
  },
  {
    icon: "✅",
    title: "Milestone-Based Release",
    desc: "Funds are released only when milestones are approved, ensuring accountability.",
  },
  {
    icon: "🔄",
    title: "Automatic Refunds",
    desc: "If a grant doesn't meet its target by the deadline, donors can claim refunds instantly.",
  },
  {
    icon: "📡",
    title: "Real-Time Events",
    desc: "Live event feed powered by Soroban contract events — no page refresh needed.",
  },
  {
    icon: "🌐",
    title: "Multi-Wallet Support",
    desc: "Connect with Freighter, xBull, LOBSTR, Rabet, or Hana wallet seamlessly.",
  },
];

const stats = [
  { label: "Protocol", value: "Stellar Soroban" },
  { label: "Network", value: "Testnet" },
  { label: "Avg Settlement", value: "~5 sec" },
  { label: "Avg Fee", value: "~0.001 XLM" },
];

export default function HomePage() {
  const { isConnected } = useWallet();
  const [showWallet, setShowWallet] = useState(false);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center py-16 lg:py-24 relative">
          {/* Glow effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[300px] rounded-full bg-purple-600/10 blur-3xl" />
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-sm text-purple-300 mb-8">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Built on Stellar Soroban
            </div>

            <h1
              className="text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Decentralized
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400">
                Grant Distribution
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Create, fund, and distribute grants transparently on the Stellar blockchain.
              Milestone-based releases ensure accountability — powered by Soroban smart contracts.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isConnected ? (
                <Link
                  href="/grants"
                  id="explore-grants-btn"
                  className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 active:scale-95"
                >
                  Explore Grants →
                </Link>
              ) : (
                <button
                  id="get-started-btn"
                  onClick={() => setShowWallet(true)}
                  className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 active:scale-95"
                >
                  Get Started
                </button>
              )}
              <Link
                href="/activity"
                id="view-activity-btn"
                className="px-8 py-3.5 rounded-xl font-semibold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                View Activity
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="glass-panel p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                {s.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="mb-16">
          <h2
            className="text-3xl font-bold text-white text-center mb-10"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Why GrantFlow?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="glass-panel p-6 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-300 group"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
                  {f.icon}
                </div>
                <h3
                  className="text-base font-semibold text-white mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {f.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="glass-panel p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-cyan-900/20 pointer-events-none" />
          <div className="relative">
            <h2
              className="text-3xl font-bold text-white mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ready to fund something great?
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Connect your Stellar wallet and start contributing to decentralized grants today.
            </p>
            <Link
              href="/grants"
              id="browse-grants-cta"
              className="inline-flex px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/25 transition-all duration-200 active:scale-95"
            >
              Browse Grants
            </Link>
          </div>
        </div>
      </div>

      {showWallet && <WalletModal onClose={() => setShowWallet(false)} />}
    </>
  );
}
