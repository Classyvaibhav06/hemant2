"use client";

import { useState } from "react";

export function TrackingClient({ role }: { role: string }) {
  const [no, setNo] = useState("");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const canUpdate = ["SUPER_ADMIN", "ADMIN", "MANAGER", "DISPATCH_STAFF", "DELIVERY_STAFF"].includes(role);

  async function track() {
    setErr(""); setData(null);
    const res = await fetch(`/api/bilty/${encodeURIComponent(no.trim())}`);
    if (!res.ok) { setErr("Bilty not found"); return; }
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
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">Tracking</h1>
      <div className="card-p">
        <div className="flex gap-2">
          <input className="input w-72 font-mono" placeholder="Enter Bilty Number"
            value={no} onChange={(e) => setNo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && track()} />
          <button className="btn-primary" onClick={track}>Track</button>
        </div>
        {err && <div className="text-sm text-red-600 mt-2">{err}</div>}
      </div>

      {data && (() => {
        const b = data.bilty;
        return (
          <>
            <div className="card-p">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono font-bold text-lg">{b.bilty_no}</div>
                  <div className="text-sm text-slate-500">{b.from_city} → {b.to_city} · {b.parcel_count} parcel(s) · {b.chargeable_weight} kg</div>
                  <div className="text-sm text-slate-500">Receiver: {b.receiver_name} {b.receiver_mobile}</div>
                </div>
                <div className="text-sm text-slate-600">Status: <b>{b.status.replaceAll("_", " ")}</b></div>
              </div>
              {canUpdate && data.allowedTransitions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.allowedTransitions.map((s: string) => (
                    <button key={s} className="btn-secondary text-xs" onClick={() => move(s)}>Mark {s.replaceAll("_", " ")}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="card-p">
              <h2 className="font-semibold mb-3">Status Timeline</h2>
              <div className="space-y-0">
                {data.statusHistory.map((h: any, i: number) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-blue-600 mt-1.5" />
                      {i < data.statusHistory.length - 1 && <div className="w-0.5 flex-1 bg-blue-200" />}
                    </div>
                    <div className="pb-4">
                      <div className="font-semibold text-sm">{h.status.replaceAll("_", " ")}</div>
                      <div className="text-xs text-slate-500">{new Date(h.at).toLocaleString()} · by {h.by}{h.note ? ` · ${h.note}` : ""}</div>
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
