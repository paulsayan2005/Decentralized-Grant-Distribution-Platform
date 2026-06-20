"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllGrants, createGrant, donate, approveMilestone, claimFunds, claimRefund, CONTRACT_ID } from "@/lib/contract";
import { useWallet } from "@/hooks/useWallet";
import { Grant } from "@/types";
import { useState } from "react";
import { WalletModal } from "@/components/WalletModal";

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-panel p-5 animate-pulse">
      <div className="h-5 bg-white/10 rounded-lg w-2/3 mb-3" />
      <div className="h-3 bg-white/5 rounded w-full mb-2" />
      <div className="h-3 bg-white/5 rounded w-4/5 mb-5" />
      <div className="h-2 bg-white/10 rounded-full mb-2" />
      <div className="h-8 bg-white/5 rounded-lg mt-4" />
    </div>
  );
}

function StatusBadge({ grant }: { grant: Grant }) {
  const now = Math.floor(Date.now() / 1000);
  const expired = now > grant.deadline && !grant.released;
  const funded = parseFloat(grant.balance) >= parseFloat(grant.target);

  if (grant.released) return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      Released ✓
    </span>
  );
  if (grant.approved && funded) return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
      Approved
    </span>
  );
  if (expired) return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
      Expired
    </span>
  );
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
      Active
    </span>
  );
}

function GrantCard({ grant, walletAddress, onRefresh }: { grant: Grant; walletAddress: string | null; onRefresh: () => void }) {
  const [donateAmt, setDonateAmt] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const now = Math.floor(Date.now() / 1000);
  const expired = now > grant.deadline;
  const targetNum = parseFloat(grant.target);
  const balanceNum = parseFloat(grant.balance);
  const funded = balanceNum >= targetNum;
  const pct = targetNum > 0 ? Math.min(100, (balanceNum / targetNum) * 100) : 0;

  async function act(fn: () => Promise<string>, label: string) {
    setError("");
    setLoading(label);
    try {
      await fn();
      onRefresh();
    } catch (e: any) {
      setError(e?.message || "Transaction failed");
    } finally {
      setLoading(null);
    }
  }

  const deadlineDate = new Date(grant.deadline * 1000).toLocaleDateString();

  return (
    <div className="glass-panel p-5 hover:border-purple-500/20 transition-all duration-300">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Grant #{grant.id}</p>
          <h3 className="text-base font-semibold text-white line-clamp-2" style={{ fontFamily: "var(--font-display)" }}>
            {grant.description}
          </h3>
        </div>
        <StatusBadge grant={grant} />
      </div>

      <div className="text-xs text-gray-500 mb-4">
        Deadline: <span className="text-gray-300">{deadlineDate}</span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{balanceNum.toFixed(2)} XLM raised</span>
          <span className="text-purple-400 font-medium">{pct.toFixed(0)}%</span>
        </div>
        <ProgressBar value={balanceNum} max={targetNum} />
        <div className="text-right mt-1 text-xs text-gray-500">
          Target: {targetNum.toFixed(2)} XLM
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Actions */}
      {walletAddress && !grant.released && (
        <div className="space-y-2">
          {/* Donate form */}
          {!expired && (
            <div className="flex gap-2">
              <input
                type="number"
                min="0.0001"
                step="0.01"
                placeholder="XLM amount"
                value={donateAmt}
                onChange={(e) => setDonateAmt(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 transition-colors"
              />
              <button
                id={`donate-btn-${grant.id}`}
                onClick={() => act(() => donate(walletAddress, grant.id, parseFloat(donateAmt)), "donate")}
                disabled={!donateAmt || !!loading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {loading === "donate" ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : "Donate"}
              </button>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {/* Admin approve */}
            {!grant.approved && funded && (
              <button
                id={`approve-btn-${grant.id}`}
                onClick={() => act(() => approveMilestone(walletAddress, grant.id), "approve")}
                disabled={!!loading}
                className="flex-1 py-2 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 disabled:opacity-50 transition-all"
              >
                {loading === "approve" ? "..." : "✓ Approve Milestone"}
              </button>
            )}

            {/* Claim funds */}
            {grant.approved && funded && (
              <button
                id={`claim-btn-${grant.id}`}
                onClick={() => act(() => claimFunds(walletAddress, grant.id), "claim")}
                disabled={!!loading}
                className="flex-1 py-2 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 disabled:opacity-50 transition-all"
              >
                {loading === "claim" ? "..." : "↑ Release Funds"}
              </button>
            )}

            {/* Refund */}
            {expired && !funded && (
              <button
                id={`refund-btn-${grant.id}`}
                onClick={() => act(() => claimRefund(walletAddress, grant.id), "refund")}
                disabled={!!loading}
                className="flex-1 py-2 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 disabled:opacity-50 transition-all"
              >
                {loading === "refund" ? "..." : "↵ Claim Refund"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateGrantModal({ walletAddress, onClose, onSuccess }: { walletAddress: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ recipient: walletAddress, target: "", deadline: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const deadlineTs = Math.floor(new Date(form.deadline).getTime() / 1000);
      await createGrant(walletAddress, form.recipient, parseFloat(form.target), deadlineTs, form.description);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to create grant");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel p-6 z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Create New Grant</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          {[
            { label: "Recipient Address", key: "recipient", type: "text", placeholder: "G..." },
            { label: "Funding Target (XLM)", key: "target", type: "number", placeholder: "500" },
            { label: "Deadline", key: "deadline", type: "datetime-local", placeholder: "" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm text-gray-400 mb-1.5">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description</label>
            <textarea
              placeholder="What is this grant for?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/40 transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            id="submit-grant-btn"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : "Create Grant"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GrantsPage() {
  const { address, isConnected } = useWallet();
  const [showCreate, setShowCreate] = useState(false);
  const [showWallet, setShowWallet] = useState(false);

  const { data: grants = [], isLoading, refetch } = useQuery({
    queryKey: ["allGrants"],
    queryFn: fetchAllGrants,
    refetchInterval: 10000,
    enabled: CONTRACT_ID !== "CONTRACT_ADDRESS_HERE",
  });

  const contractNotDeployed = CONTRACT_ID === "CONTRACT_ADDRESS_HERE";

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Grants</h1>
          <p className="text-gray-400 mt-1">Browse and fund decentralized grants on Stellar</p>
        </div>
        {isConnected ? (
          <button
            id="create-grant-btn"
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 shadow-lg shadow-purple-500/25 transition-all active:scale-95"
          >
            + New Grant
          </button>
        ) : (
          <button
            id="grants-connect-btn"
            onClick={() => setShowWallet(true)}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all"
          >
            Connect to Create
          </button>
        )}
      </div>

      {contractNotDeployed && (
        <div className="glass-panel p-6 border-amber-500/20 bg-amber-500/5 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-base font-semibold text-amber-400 mb-1">Contract Not Deployed</h3>
              <p className="text-sm text-gray-400">
                Run <code className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">npx tsx scripts/deploy.ts</code> to deploy the grant contract to Stellar Testnet, then restart the dev server.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grant cards */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : grants.length === 0 ? (
        <div className="glass-panel p-16 text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h2 className="text-xl font-semibold text-white mb-2">No Grants Yet</h2>
          <p className="text-gray-400 text-sm mb-6">Be the first to create a grant on GrantFlow!</p>
          {isConnected && (
            <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-all">
              Create First Grant
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {grants.map((g) => (
            <GrantCard key={g.id} grant={g} walletAddress={address} onRefresh={refetch} />
          ))}
        </div>
      )}

      {showCreate && address && (
        <CreateGrantModal walletAddress={address} onClose={() => setShowCreate(false)} onSuccess={() => refetch()} />
      )}
      {showWallet && <WalletModal onClose={() => setShowWallet(false)} />}
    </div>
  );
}
