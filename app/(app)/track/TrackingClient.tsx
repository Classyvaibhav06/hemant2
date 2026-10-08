"use client";

import { useState } from "react";
import { MagnifyingGlass, Crosshair, Warning, CheckCircle, ArrowRight, Clock, MapPin, User, Package } from "@phosphor-icons/react";

const STATUS_TONE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  BOOKED: { bg: "bg-zinc-800/80", text: "text-zinc-300", border: "border-zinc-700/60", dot: "bg-zinc-400" },
  DISPATCHED: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", dot: "bg-sky-400" },
  IN_TRANSIT: { bg: "bg-accent-500/10", text: "text-accent-400", border: "border-accent-500/20", dot: "bg-accent-400" },
  AT_DESTINATION: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", dot: "bg-purple-400" },
  OUT_FOR_DELIVERY: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  DELIVERED: { bg: "bg-[#00ba7c]/10", text: "text-[#00ba7c]", border: "border-[#00ba7c]/20", dot: "bg-[#00ba7c]" },
  UNDELIVERED: { bg: "bg-[#f4212e]/10", text: "text-[#f4212e]", border: "border-[#f4212e]/20", dot: "bg-[#f4212e]" },
};

export function TrackingClient({ role }: { role: string }) {
  const [no, setNo] = useState("");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const canUpdate = ["SUPER_ADMIN", "ADMIN", "MANAGER", "DISPATCH_STAFF", "DELIVERY_STAFF"].includes(role);

  async function track() {
    if (!no.trim()) return;
    setErr("");
    setData(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/bilty/${encodeURIComponent(no.trim())}`);
      if (!res.ok) {
        setErr("Bilty not found — check the consignment number and try again");
        return;
      }
      setData(await res.json());
    } catch {
      setErr("Failed to fetch tracking details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function move(status: string) {
    const note = prompt(`Note for "${status.replaceAll("_", " ")}" (optional):`) || "";
    const res = await fetch(`/api/bilty/${data.bilty.bilty_no}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Failed");
      return;
    }
    setNo(data.bilty.bilty_no);
    track();
  }

  return (
    <div className="space-y-4">
      <div className="animate-fade-up">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-wider text-[#71767b]">Live Radar</span>
        </div>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-[#e7e9ea] sm:text-2xl">Consignment Tracking</h1>
        <p className="mt-0.5 text-xs text-[#71767b]">Track shipments across Indian transit corridors in real-time</p>
      </div>

      <div className="card-p animate-fade-up" style={{ animationDelay: "40ms" }}>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlass size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#71767b]" />
            <input
              className="input pl-10 font-mono text-sm tracking-wider uppercase placeholder:normal-case placeholder:font-sans"
              placeholder="Enter Bilty Number (e.g. BLT-2026-0001)"
              value={no}
              onChange={(e) => setNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && track()}
            />
          </div>
          <button className="btn-primary shrink-0 text-sm gap-2" onClick={track} disabled={loading}>
            <Crosshair size={16} weight="bold" className={loading ? "animate-spin" : ""} />
            {loading ? "Tracking..." : "Track Consignment"}
          </button>
        </div>
        {err && (
          <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-[#f4212e]/20 bg-[#f4212e]/10 px-4 py-3 text-xs font-semibold text-[#f4212e]">
            <Warning size={16} weight="fill" className="shrink-0" />
            {err}
          </div>
        )}
      </div>

      {data && (() => {
        const b = data.bilty;
        const tone = STATUS_TONE[b.status] || STATUS_TONE.BOOKED;
        return (
          <div className="space-y-4">
            {/* Shipment Card */}
            <div className="card-p animate-fade-up" style={{ animationDelay: "60ms" }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-lg font-bold text-accent-400">{b.bilty_no}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tone.bg} ${tone.text} ${tone.border}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                      {b.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#71767b]">
                    <span className="flex items-center gap-1.5 text-[#e7e9ea]">
                      <MapPin size={14} className="text-accent-400" />
                      <span>{b.from_city}</span> <span className="text-[#525252]">→</span> <span>{b.to_city}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[#71767b]">
                      <Package size={14} />
                      {b.parcel_count} parcel(s) · {b.chargeable_weight} kg
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#71767b]">
                    <User size={14} />
                    <span>Receiver: <b className="font-semibold text-[#e7e9ea]">{b.receiver_name}</b> {b.receiver_mobile ? `(${b.receiver_mobile})` : ""}</span>
                  </div>
                </div>
              </div>

              {canUpdate && data.allowedTransitions.length > 0 && (
                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#71767b]">Update Transit Status:</div>
                  <div className="flex flex-wrap gap-2">
                    {data.allowedTransitions.map((s: string) => {
                      const sTone = STATUS_TONE[s] || STATUS_TONE.BOOKED;
                      return (
                        <button
                          key={s}
                          className="btn-secondary text-xs px-3.5 py-1.5"
                          onClick={() => move(s)}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${sTone.dot}`} />
                          Mark {s.replaceAll("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="card-p animate-fade-up" style={{ animationDelay: "100ms" }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-tight text-[#e7e9ea]">Journey Milestones</h2>
                <span className="font-mono text-xs text-[#71767b]">{data.statusHistory.length} event(s)</span>
              </div>
              <div className="relative pl-1">
                {data.statusHistory.map((h: any, i: number) => {
                  const isLatest = i === data.statusHistory.length - 1;
                  const hTone = STATUS_TONE[h.status] || STATUS_TONE.BOOKED;
                  return (
                    <div key={h.id} className="relative flex gap-4 pb-6 last:pb-1">
                      {/* Vertical line */}
                      {i < data.statusHistory.length - 1 && (
                        <div className="absolute top-4 left-[9px] h-full w-[2px] bg-white/[0.08]" />
                      )}
                      {/* Node point */}
                      <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                        {isLatest ? (
                          <span className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-accent-500 shadow-[0_0_10px_#1d9bf0]" />
                          </span>
                        ) : (
                          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isLatest ? "text-[#e7e9ea]" : "text-[#71767b]"}`}>
                            {h.status.replaceAll("_", " ")}
                          </span>
                          {isLatest && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-accent-500/10 text-accent-400 border border-accent-500/20">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-[#71767b]">
                          {new Date(h.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          {" · "}
                          <span className="text-[#a3a3a3]">by {h.by}</span>
                          {h.note ? <span className="text-zinc-400"> — {h.note}</span> : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
