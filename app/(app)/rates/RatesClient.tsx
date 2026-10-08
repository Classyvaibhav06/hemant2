"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal, Field } from "@/app/(app)/customers/CustomersClient";

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Rate Master</h1>
          <p className="text-sm text-slate-500">Editing a rate keeps history — old bilties keep their original rate.</p>
        </div>
        {canEdit && <button className="btn-primary shrink-0" onClick={() => setEditing({} as R)}>+ Add Rate</button>}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="th">Vendor</th><th className="th">Name</th><th className="th">Type</th><th className="th">₹ Value</th>
            <th className="th">Weight Slab (kg)</th><th className="th">Valid From</th><th className="th">Active</th><th className="th"></th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-brand-50/40">
                <td className="td">{r.vendor_name}</td>
                <td className="td font-medium">{r.name}</td>
                <td className="td">{r.commission_type}</td>
                <td className="td">₹{r.commission_value}</td>
                <td className="td">{r.min_weight} – {r.max_weight || "∞"}</td>
                <td className="td">{r.valid_from}</td>
                <td className="td">{r.active ? <span className="badge bg-emerald-50 text-emerald-700">Active</span> : <span className="badge bg-slate-100 text-slate-600">Inactive</span>}</td>
                <td className="td text-right whitespace-nowrap">
                  <button className="text-blue-600 text-sm mr-2" onClick={() => setHistoryOf(r)}>History</button>
                  {canEdit && <button className="text-slate-600 text-sm mr-2" onClick={() => setEditing(r)}>Edit</button>}
                  {canDelete && <button className="text-red-600 text-sm" onClick={() => remove(r)}>Delete</button>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-slate-400" colSpan={8}>No rates configured</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? `Edit Rate — ${editing.name}` : "Add Rate"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            {!editing.id && (
              <div className="col-span-2">
                <label className="label">Vendor *</label>
                <select name="vendor_id" required className="input">
                  <option value="">Select vendor…</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.code} — {v.name}</option>)}
                </select>
              </div>
            )}
            <Field name="name" label="Rate Name *" defaultValue={editing.name} required className="col-span-2" />
            <div>
              <label className="label">Type *</label>
              <select name="commission_type" defaultValue={editing.commission_type || "SLAB"} className="input">
                {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <Field name="commission_value" label="₹ Value *" defaultValue={editing.commission_value} type="number" step="0.01" required />
            <Field name="min_weight" label="Min Weight (kg, 0 = none)" defaultValue={editing.min_weight ?? 0} type="number" step="0.01" />
            <Field name="max_weight" label="Max Weight (kg, 0 = none)" defaultValue={editing.max_weight ?? 0} type="number" step="0.01" />
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="active" name="active" defaultChecked={editing.id ? !!editing.active : true} className="h-4 w-4" />
              <label htmlFor="active" className="text-sm">Active</label>
            </div>
            {error && <div className="col-span-2 text-sm text-red-600">{error}</div>}
            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
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
    <Modal title={`Rate History — ${rate.name}`} onClose={onClose}>
      {!rows ? <div className="text-slate-400 text-sm py-8 text-center">Loading…</div> : (
        <table className="w-full">
          <thead><tr><th className="th">Valid From</th><th className="th">Valid To</th><th className="th">Type</th><th className="th">₹ Value</th><th className="th">Slab</th><th className="th">Source</th></tr></thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.id}>
                <td className="td">{h.valid_from}</td>
                <td className="td">{h.valid_to || "current"}</td>
                <td className="td">{h.commission_type}</td>
                <td className="td">₹{h.commission_value}</td>
                <td className="td">{h.min_weight}–{h.max_weight || "∞"}</td>
                <td className="td">{h.source}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-slate-400" colSpan={6}>No history</td></tr>}
          </tbody>
        </table>
      )}
    </Modal>
  );
}
