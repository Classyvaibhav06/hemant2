"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal, Field } from "@/app/(app)/customers/CustomersClient";
import { Plus, Tag, ClockCounterClockwise, Check } from "@phosphor-icons/react";

type R = any;

const TYPES = [
  ["SLAB", "Per KG (slab rate)"],
  ["PER_KG", "Per KG (flat)"],
  ["PER_PARCEL", "Per Parcel"],
  ["FIXED", "Fixed"],
  ["PERCENT", "Percentage"],
];

export function RatesClient({ role }: { role: string }) {
  const [rows, setRows] = useState<R[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [editing, setEditing] = useState<R | null>(null);
  const [historyOf, setHistoryOf] = useState<R | null>(null);
  const [error, setError] = useState("");
  const canEdit = !["VIEWER", "DELIVERY_STAFF", "BOOKING_STAFF"].includes(role);
  const canDelete = ["SUPER_ADMIN", "ADMIN"].includes(role);

  const load = useCallback(async () => {
    const [rs, vs] = await Promise.all([fetch("/api/rates").then((r) => r.json()), fetch("/api/vendors").then((r) => r.json())]);
    setRows(rs);
    setVendors(vs.filter((v: any) => v.status === "ACTIVE"));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const raw = Object.fromEntries(new FormData(e.currentTarget).entries()) as any;
    const body = {
      ...raw,
      vendor_id: editing?.id ? editing.vendor_id : Number(raw.vendor_id),
      commission_value: Number(raw.commission_value),
      min_weight: Number(raw.min_weight) || 0,
      max_weight: Number(raw.max_weight) || 0,
      active: raw.active ? 1 : 0,
    };
    const res = await fetch(editing?.id ? `/api/rates/${editing.id}` : "/api/rates", {
      method: editing?.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Save failed");
      return;
    }
    setEditing(null);
    load();
  }

  async function remove(r: R) {
    if (!confirm(`Delete rate "${r.name}"? If used by bilties it will be deactivated instead.`)) return;
    await fetch(`/api/rates/${r.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-accent-400" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#71767b]">Tariff Schedules</span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-[#e7e9ea]">Rate Master</h1>
          <p className="mt-0.5 text-xs text-[#71767b]">Version-controlled weight brackets & commission tariff rules</p>
        </div>
        {canEdit && (
          <button className="btn-primary text-sm shrink-0 gap-1.5" onClick={() => setEditing({} as R)}>
            <Plus size={16} weight="bold" />
            Add Rate Slab
          </button>
        )}
      </div>

      <div className="card overflow-x-auto animate-fade-up" style={{ animationDelay: "40ms" }}>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="th">Vendor</th>
              <th className="th">Slab Name</th>
              <th className="th">Commission Type</th>
              <th className="th text-right">₹ Value</th>
              <th className="th">Weight Slab (kg)</th>
              <th className="th">Valid From</th>
              <th className="th">Status</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="td text-xs font-semibold text-[#e7e9ea]">{r.vendor_name}</td>
                <td className="td text-xs text-zinc-300 font-medium">{r.name}</td>
                <td className="td text-xs text-[#71767b]">{r.commission_type}</td>
                <td className="td text-right font-mono text-xs font-bold text-[#00ba7c]">₹{r.commission_value}</td>
                <td className="td font-mono text-xs text-zinc-400">{r.min_weight} – {r.max_weight || "∞"}</td>
                <td className="td font-mono text-xs text-[#71767b]">{r.valid_from}</td>
                <td className="td">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    r.active
                      ? "bg-[#00ba7c]/10 text-[#00ba7c] border-[#00ba7c]/20"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700/60"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${r.active ? "bg-[#00ba7c]" : "bg-zinc-400"}`} />
                    {r.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="td text-right whitespace-nowrap text-xs">
                  <button className="text-accent-400 hover:text-accent-300 font-semibold mr-3 transition" onClick={() => setHistoryOf(r)}>
                    History
                  </button>
                  {canEdit && (
                    <button className="text-[#71767b] hover:text-[#e7e9ea] font-medium mr-3 transition" onClick={() => setEditing(r)}>
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button className="text-[#f4212e] hover:text-rose-400 font-medium transition" onClick={() => remove(r)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="td py-12 text-center text-sm font-medium text-[#71767b]" colSpan={8}>
                  No rates configured yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? `Edit Rate — ${editing.name}` : "Add Rate Configuration"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="grid grid-cols-2 gap-3 text-sm">
            {!editing.id && (
              <div className="col-span-2">
                <label className="label">Vendor Transporter *</label>
                <select name="vendor_id" required className="input text-sm">
                  <option value="" className="bg-[#111111]">Select vendor partner…</option>
                  {vendors.map((v) => <option key={v.id} value={v.id} className="bg-[#111111]">{v.code} — {v.name}</option>)}
                </select>
              </div>
            )}
            <Field name="name" label="Slab / Rate Name *" defaultValue={editing.name} required className="col-span-2" />
            <div>
              <label className="label">Commission Calculation Type *</label>
              <select name="commission_type" defaultValue={editing.commission_type || "SLAB"} className="input text-sm">
                {TYPES.map(([v, l]) => <option key={v} value={v} className="bg-[#111111]">{l}</option>)}
              </select>
            </div>
            <Field name="commission_value" label="Rate Value (₹) *" defaultValue={editing.commission_value} type="number" step="0.01" required />
            <Field name="min_weight" label="Min Weight (kg, 0 = start)" defaultValue={editing.min_weight ?? 0} type="number" step="0.01" />
            <Field name="max_weight" label="Max Weight (kg, 0 = unlimited)" defaultValue={editing.max_weight ?? 0} type="number" step="0.01" />
            <div className="col-span-2 flex items-center gap-2 mt-1">
              <input type="checkbox" id="active" name="active" defaultChecked={editing.id ? !!editing.active : true} className="h-4 w-4 rounded accent-accent-500" />
              <label htmlFor="active" className="text-xs text-[#e7e9ea] font-medium cursor-pointer">Active and selectable in bookings</label>
            </div>
            {error && <div className="col-span-2 text-xs font-semibold text-[#f4212e]">{error}</div>}
            <div className="col-span-2 flex justify-end gap-2 mt-3 pt-3 border-t border-white/[0.08]">
              <button type="button" className="btn-secondary text-xs" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary text-xs">Save Rate</button>
            </div>
          </form>
        </Modal>
      )}

      {historyOf && <RateHistory rate={historyOf} onClose={() => setHistoryOf(null)} />}
    </div>
  );
}

function RateHistory({ rate, onClose }: { rate: R; onClose: () => void }) {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    fetch(`/api/rates/${rate.id}/history`).then((r) => r.json()).then(setRows);
  }, [rate.id]);

  return (
    <Modal title={`Rate Audit Timeline — ${rate.name}`} onClose={onClose}>
      {!rows ? (
        <div className="text-[#71767b] text-sm py-10 text-center">Loading version history…</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="th">Valid From</th>
                <th className="th">Valid To</th>
                <th className="th">Type</th>
                <th className="th text-right">Value</th>
                <th className="th">Slab</th>
                <th className="th">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {rows.map((h) => (
                <tr key={h.id} className="hover:bg-white/[0.02]">
                  <td className="td font-mono text-xs text-[#71767b]">{h.valid_from}</td>
                  <td className="td font-mono text-xs text-[#71767b]">{h.valid_to || "Current"}</td>
                  <td className="td text-xs text-zinc-300">{h.commission_type}</td>
                  <td className="td text-right font-mono text-xs font-bold text-[#00ba7c]">₹{h.commission_value}</td>
                  <td className="td font-mono text-xs text-zinc-400">{h.min_weight}–{h.max_weight || "∞"}</td>
                  <td className="td text-xs text-[#71767b] font-mono">{h.source}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="td text-[#71767b] text-center py-6" colSpan={6}>No history records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
