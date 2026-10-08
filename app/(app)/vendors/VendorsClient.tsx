"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal, Field } from "@/app/(app)/customers/CustomersClient";

type V = any;

export function VendorsClient({ role }: { role: string }) {
  const [rows, setRows] = useState<V[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<V | null>(null);
  const [profile, setProfile] = useState<V | null>(null);
  const [error, setError] = useState("");
  const canEdit = !["VIEWER", "DELIVERY_STAFF"].includes(role);
  const canDelete = ["SUPER_ADMIN", "ADMIN"].includes(role);

  const load = useCallback(async (query = "") => {
    const res = await fetch(`/api/vendors${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    setRows(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch(editing ? `/api/vendors/${editing.id}` : "/api/vendors", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Save failed");
      return;
    }
    setEditing(null);
    load(q);
  }

  async function remove(v: V) {
    if (!confirm(`Delete vendor ${v.name}?`)) return;
    const res = await fetch(`/api/vendors/${v.id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Delete failed");
    }
    load(q);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Vendors</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input w-full sm:w-64" placeholder="Search"
            value={q} onChange={(e) => { setQ(e.target.value); load(e.target.value); }} />
          {canEdit && <button className="btn-primary" onClick={() => setEditing({})}>+ Add Vendor</button>}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="th">Code</th><th className="th">Name</th><th className="th">Company</th>
            <th className="th">Mobile</th><th className="th">City</th><th className="th">Status</th><th className="th"></th>
          </tr></thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="transition-colors hover:bg-brand-50/40">
                <td className="td font-mono text-xs">{v.code}</td>
                <td className="td font-medium">{v.name}</td>
                <td className="td">{v.company || "—"}</td>
                <td className="td">{v.mobile || "—"}</td>
                <td className="td">{v.city || "—"}</td>
                <td className="td"><span className={`badge ${v.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{v.status}</span></td>
                <td className="td text-right whitespace-nowrap">
                  <button className="text-blue-600 text-sm mr-2" onClick={() => setProfile(v)}>Profile</button>
                  {canEdit && <button className="text-slate-600 text-sm mr-2" onClick={() => setEditing(v)}>Edit</button>}
                  {canDelete && <button className="text-red-600 text-sm" onClick={() => remove(v)}>Delete</button>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-slate-400" colSpan={7}>No vendors</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : "Add Vendor"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <Field name="name" label="Vendor Name *" defaultValue={editing.name} required />
            <Field name="company" label="Company Name" defaultValue={editing.company} />
            <Field name="mobile" label="Mobile" defaultValue={editing.mobile} />
            <Field name="address" label="Address" defaultValue={editing.address} className="col-span-2" />
            <Field name="city" label="City" defaultValue={editing.city} />
            <Field name="state" label="State" defaultValue={editing.state} />
            <Field name="pincode" label="Pincode" defaultValue={editing.pincode} />
            <Field name="gstin" label="GST" defaultValue={editing.gstin} />
            <Field name="opening_balance" label="Opening Balance" defaultValue={editing.opening_balance ?? 0} type="number" step="0.01" />
            <Field name="payment_terms" label="Payment Terms" defaultValue={editing.payment_terms} />
            {editing.id && (
              <div>
                <label className="label">Status</label>
                <select name="status" defaultValue={editing.status} className="input">
                  <option>ACTIVE</option><option>INACTIVE</option>
                </select>
              </div>
            )}
            {error && <div className="col-span-2 text-sm text-red-600">{error}</div>}
            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {profile && <VendorProfile v={profile} onClose={() => setProfile(null)} />}
    </div>
  );
}

function VendorProfile({ v, onClose }: { v: V; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/vendors/${v.id}/profile`).then((r) => r.json()).then(setData);
  }, [v.id]);

  return (
    <Modal title={`Vendor Profile — ${v.name} (${v.code})`} onClose={onClose} wide>
      {!data ? <div className="text-slate-400 text-sm py-8 text-center">Loading…</div> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              ["Total Bilty", data.stats.total_bilties],
              ["Total Parcels", data.stats.total_parcels],
              ["Total Commission", "₹" + (data.stats.commission || 0).toLocaleString("en-IN")],
              ["Vendor Payable", "₹" + (data.stats.payable || 0).toLocaleString("en-IN")],
              ["Active Rates", data.rates.filter((r: any) => r.active).length],
            ].map(([l, val]) => (
              <div key={l as string} className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">{l as string}</div>
                <div className="font-bold">{val as any}</div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-1">Rates</h3>
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className="th">Name</th><th className="th">Type</th><th className="th">Value</th><th className="th">Weight Slab</th><th className="th">Active</th></tr></thead>
                <tbody>
                  {data.rates.map((r: any) => (
                    <tr key={r.id}>
                      <td className="td">{r.name}</td>
                      <td className="td">{r.commission_type}</td>
                      <td className="td">₹{r.commission_value}</td>
                      <td className="td">{r.min_weight}–{r.max_weight || "∞"} kg</td>
                      <td className="td">{r.active ? "✓" : "✗"}</td>
                    </tr>
                  ))}
                  {data.rates.length === 0 && <tr><td className="td text-slate-400" colSpan={5}>No rates configured</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-1">Ledger</h3>
            <div className="card overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full">
                <thead><tr><th className="th">Date</th><th className="th">Particulars</th><th className="th">Debit</th><th className="th">Credit</th><th className="th">Balance</th></tr></thead>
                <tbody>
                  {data.ledger.map((r: any, i: number) => (
                    <tr key={i}>
                      <td className="td">{r.date}</td>
                      <td className="td">{r.particulars}</td>
                      <td className="td text-red-600">{r.debit ? `₹${r.debit}` : ""}</td>
                      <td className="td text-emerald-600">{r.credit ? `₹${r.credit}` : ""}</td>
                      <td className="td font-medium">₹{r.balance}</td>
                    </tr>
                  ))}
                  {data.ledger.length === 0 && <tr><td className="td text-slate-400" colSpan={5}>No ledger entries</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
