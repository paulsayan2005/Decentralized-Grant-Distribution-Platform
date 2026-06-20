"use client";

import { useEventFeed, GrantEvent } from "@/hooks/useEventFeed";
import { CONTRACT_ID } from "@/lib/contract";

const eventConfig: Record<GrantEvent["type"], { icon: string; color: string; label: string }> = {
  grant_created: { icon: "🌱", color: "text-emerald-400", label: "Grant Created" },
  donation_received: { icon: "💜", color: "text-purple-400", label: "Donation Received" },
  grant_approved: { icon: "✅", color: "text-cyan-400", label: "Milestone Approved" },
  funds_released: { icon: "🚀", color: "text-amber-400", label: "Funds Released" },
  refund_claimed: { icon: "↵", color: "text-red-400", label: "Refund Claimed" },
  unknown: { icon: "📡", color: "text-gray-400", label: "Contract Event" },
};

function EventCard({ event }: { event: GrantEvent }) {
  const cfg = eventConfig[event.type];
  return (
    <div className="glass-panel p-4 hover:border-purple-500/20 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
            <span className="text-xs text-gray-500 flex-shrink-0">{event.timestamp}</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{event.details}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-600">Ledger #{event.ledger}</span>
            {event.amount && (
              <span className="text-xs text-gray-500">Amount: <span className="text-purple-400">{event.amount}</span></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonEvent() {
  return (
    <div className="glass-panel p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
          <div className="h-3 bg-white/5 rounded w-full mb-1" />
          <div className="h-3 bg-white/5 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const contractNotDeployed = CONTRACT_ID === "CONTRACT_ADDRESS_HERE";
  const { data: events = [], isLoading, isFetching } = useEventFeed(contractNotDeployed ? null : CONTRACT_ID);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Activity Feed
          </h1>
          <p className="text-gray-400 mt-1">Real-time contract events from the Stellar network</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          {isFetching && <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />}
          <span>Updates every 5 seconds</span>
        </div>
      </div>

      {contractNotDeployed && (
        <div className="glass-panel p-6 border-amber-500/20 bg-amber-500/5 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-base font-semibold text-amber-400 mb-1">Contract Not Deployed</h3>
              <p className="text-sm text-gray-400">
                Deploy the smart contract first to see live events here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Event type legend */}
      <div className="flex flex-wrap gap-3 mb-8">
        {Object.entries(eventConfig).filter(([k]) => k !== "unknown").map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span>{cfg.icon}</span>
            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Events */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonEvent key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="glass-panel p-16 text-center">
          <div className="text-5xl mb-4">📡</div>
          <h2 className="text-xl font-semibold text-white mb-2">No Events Yet</h2>
          <p className="text-gray-400 text-sm">
            Create grants or make donations to see real-time activity here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
