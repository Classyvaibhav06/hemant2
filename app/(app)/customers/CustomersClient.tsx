"use client";

import { useCallback, useEffect, useState } from "react";

type C = any;

export function CustomersClient({ role }: { role: string }) {
  const [rows, setRows] = useState<C[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<C | null>(null);
  const [profile, setProfile] = useState<C | null>(null);
  const [error, setError] = useState("");
  const canEdit = !["VIEWER", "DELIVERY_STAFF"].includes(role);
  const canDelete = ["SUPER_ADMIN", "ADMIN"].includes(role);

  const load = useCallback(async (query = "") => {
    const res = await fetch(`/api/customers${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    setRows(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch(editing ? `/api/customers/${editing.id}` : "/api/customers", {
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

  async function remove(c: C) {
    if (!confirm(`Delete customer ${c.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/customers/${c.id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Delete failed");
    }
    load(q);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Customers</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input w-full sm:w-64" placeholder="Search name / code / mobile"
            value={q} onChange={(e) => { setQ(e.target.value); load(e.target.value); }} />
          {canEdit && <button className="btn-primary" onClick={() => setEditing({})}>+ Add Customer</button>}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="th">Code</th><th className="th">Name</th><th className="th">Company</th>
            <th className="th">Mobile</th><th className="th">City</th><th className="th">Credit Limit</th>
            <th className="th">Status</th><th className="th"></th>
          </tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="td font-mono text-xs">{c.code}</td>
                <td className="td font-medium">{c.name}</td>
                <td className="td">{c.company || "—"}</td>
                <td className="td">{c.mobile || "—"}</td>
                <td className="td">{c.city || "—"}</td>
                <td className="td">₹{(c.credit_limit || 0).toLocaleString("en-IN")}</td>
                <td className="td"><span className={`badge ${c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{c.status}</span></td>
                <td className="td text-right whitespace-nowrap">
                  <button className="text-blue-600 text-sm mr-2" onClick={() => setProfile(c)}>Profile</button>
                  {canEdit && <button className="text-slate-600 text-sm mr-2" onClick={() => setEditing(c)}>Edit</button>}
                  {canDelete && <button className="text-red-600 text-sm" onClick={() => remove(c)}>Delete</button>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-slate-400" colSpan={8}>No customers</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : "Add Customer"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <Field name="name" label="Customer Name *" defaultValue={editing.name} required />
            <Field name="company" label="Company Name" defaultValue={editing.company} />
            <Field name="mobile" label="Mobile" defaultValue={editing.mobile} />
            <Field name="mobile2" label="Alternate Mobile" defaultValue={editing.mobile2} />
            <Field name="address" label="Address" defaultValue={editing.address} className="col-span-2" />
            <Field name="city" label="City" defaultValue={editing.city} />
            <Field name="state" label="State" defaultValue={editing.state} />
            <Field name="pincode" label="Pincode" defaultValue={editing.pincode} />
            <Field name="gstin" label="GST Number" defaultValue={editing.gstin} />
            <Field name="email" label="Email" defaultValue={editing.email} type="email" />
            <Field name="credit_limit" label="Credit Limit" defaultValue={editing.credit_limit ?? 0} type="number" step="0.01" />
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
            <Field name="notes" label="Notes" defaultValue={editing.notes} className="col-span-2" />
            {error && <div className="col-span-2 text-sm text-red-600">{error}</div>}
            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {profile && <CustomerProfile c={profile} onClose={() => setProfile(null)} />}
    </div>
  );
}

function CustomerProfile({ c, onClose }: { c: C; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/customers/${c.id}/profile`).then((r) => r.json()).then(setData);
  }, [c.id]);

  return (
    <Modal title={`Customer Profile — ${c.name} (${c.code})`} onClose={onClose} wide>
      {!data ? <div className="text-slate-400 text-sm py-8 text-center">Loading…</div> : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              ["Total Bookings", data.stats.total_bilties],
              ["Total Parcels", data.stats.total_parcels],
              ["Delivered", data.stats.delivered],
              ["Pending", data.stats.pending],
              ["Total Receivable", "₹" + (data.stats.receivable || 0).toLocaleString("en-IN")],
            ].map(([l, v]) => (
              <div key={l as string} className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">{l as string}</div>
                <div className="font-bold">{v as any}</div>
              </div>
            ))}
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Ledger</h3>
            <LedgerTable rows={data.ledger} />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">Bilty History</h3>
            <div className="card overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead><tr><th className="th">Bilty No</th><th className="th">Date</th><th className="th">From→To</th><th className="th">Amount</th><th className="th">Status</th></tr></thead>
                <tbody>
                  {data.bilties.map((b: any) => (
                    <tr key={b.id}>
                      <td className="td font-mono text-xs">{b.bilty_no}</td>
                      <td className="td">{b.booking_date}</td>
                      <td className="td">{b.from_city} → {b.to_city}</td>
                      <td className="td">₹{b.total_charges}</td>
                      <td className="td">{b.status}</td>
                    </tr>
                  ))}
                  {data.bilties.length === 0 && <tr><td className="td text-slate-400" colSpan={5}>No bilties yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function LedgerTable({ rows }: { rows: any[] }) {
  return (
    <div className="card overflow-x-auto max-h-64 overflow-y-auto">
      <table className="w-full">
        <thead><tr><th className="th">Date</th><th className="th">Particulars</th><th className="th">Debit</th><th className="th">Credit</th><th className="th">Balance</th></tr></thead>
        <tbody>
          {rows.map((r: any, i: number) => (
            <tr key={i}>
              <td className="td">{r.date}</td>
              <td className="td">{r.particulars}</td>
              <td className="td text-red-600">{r.debit ? `₹${r.debit}` : ""}</td>
              <td className="td text-emerald-600">{r.credit ? `₹${r.credit}` : ""}</td>
              <td className="td font-medium">₹{r.balance}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="td text-slate-400" colSpan={5}>No ledger entries</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? "max-w-4xl" : "max-w-2xl"} max-h-[90vh] overflow-y-auto p-6`}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ name, label, defaultValue, type = "text", required, className, step }: {
  name: string; label: string; defaultValue?: any; type?: string; required?: boolean; className?: string; step?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} step={step} className="input" />
    </div>
  );
}
