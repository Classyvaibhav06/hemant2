"use client";

import { useState } from "react";
import { IconAlert, IconRadar, IconSearch } from "@/components/icons";

export function TrackingClient({ role }: { role: string }) {
  const [no, setNo] = useState("");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const canUpdate = ["SUPER_ADMIN", "ADMIN", "MANAGER", "DISPATCH_STAFF", "DELIVERY_STAFF"].includes(role);

  async function track() {
    if (!no.trim()) return;
    setErr(""); setData(null);
    const res = await fetch(`/api/bilty/${encodeURIComponent(no.trim())}`);
    if (!res.ok) { setErr("Bilty not found — check the number and try again"); return; }
    setData(await res.json());
  }

  async function move(status: string) {
    const note = prompt(`Note for "${status.replaceAll("_", " ")}" (optional):`) || "";
    const res = await fetch(`/api/bilty/${data.bilty.bilty_no}/status`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    if (!res.ok) { const j = await res.json().catch(() => ({})); alert(j.error || "Failed"); return; }
    setNo(data.bilty.bilty_no);
    track();
  }

  return (
    <div className="space-y-4">
      <div className="animate-fade-up">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Tracking</h1>
        <p className="mt-0.5 text-sm font-medium text-slate-400">Look up any consignment and follow its journey</p>
      </div>

      <div className="card-p animate-fade-up" style={{ animationDelay: "40ms" }}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <IconSearch width={17} height={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10 font-mono"
              placeholder="Enter Bilty Number"
              value={no}
              onChange={(e) => setNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && track()}
            />
          </div>
          <button className="btn-primary shrink-0" onClick={track}>
            <IconRadar width={16} height={16} />
            Track
          </button>
        </div>
        {err && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
            <IconAlert width={16} height={16} className="shrink-0" />
            {err}
          </div>
        )}
      </div>

      {data && (() => {
        const b = data.bilty;
        return (
          <>
            <div className="card-p animate-fade-up" style={{ animationDelay: "60ms" }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                <div className="min-w-0">
                  <div className="font-mono text-lg font-extrabold tracking-tight text-slate-900">{b.bilty_no}</div>
                  <div className="mt-1 text-sm font-medium text-slate-500">
                    {b.from_city} → {b.to_city} · {b.parcel_count} parcel(s) · {b.chargeable_weight} kg
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500">Receiver: <b className="font-semibold text-slate-700">{b.receiver_name}</b> {b.receiver_mobile}</div>
                </div>
                <span className="badge shrink-0 bg-brand-50 px-3.5 py-1.5 text-xs text-brand-700">{b.status.replaceAll("_", " ")}</span>
              </div>
              {canUpdate && data.allowedTransitions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {data.allowedTransitions.map((s: string) => (
                    <button key={s} className="btn-secondary text-xs" onClick={() => move(s)}>
                      Mark {s.replaceAll("_", " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card-p animate-fade-up" style={{ animationDelay: "100ms" }}>
              <h2 className="mb-4 text-[15px] font-bold tracking-tight text-slate-800">Status Timeline</h2>
              <div>
                {data.statusHistory.map((h: any, i: number) => (
                  <div key={h.id} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <div className={`mt-1 h-3 w-3 rounded-full ${i === data.statusHistory.length - 1 ? "bg-brand-600 ring-4 ring-brand-100" : "bg-brand-400"}`} />
                      {i < data.statusHistory.length - 1 && <div className="w-0.5 flex-1 bg-brand-100" />}
                    </div>
                    <div className="pb-5">
                      <div className="text-sm font-bold text-slate-800">{h.status.replaceAll("_", " ")}</div>
                      <div className="mt-0.5 text-xs font-medium text-slate-400">
                        {new Date(h.at).toLocaleString("en-IN")} · by {h.by}{h.note ? ` · ${h.note}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
