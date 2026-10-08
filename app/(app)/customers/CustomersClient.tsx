"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, MagnifyingGlass, User, X, CaretRight, Building, Phone, MapPin } from "@phosphor-icons/react";

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
    const res = await fetch(editing?.id ? `/api/customers/${editing.id}` : "/api/customers", {
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
      <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <User size={16} className="text-accent-400" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#71767b]">Directory</span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-[#e7e9ea]">Customers</h1>
          <p className="mt-0.5 text-xs text-[#71767b]">{rows.length} registered customer accounts</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <MagnifyingGlass size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#71767b]" />
            <input
              className="input pl-9 w-full sm:w-64 text-sm"
              placeholder="Search name / code / mobile"
              value={q}
              onChange={(e) => { setQ(e.target.value); load(e.target.value); }}
            />
          </div>
          {canEdit && (
            <button className="btn-primary text-sm shrink-0 gap-1.5" onClick={() => setEditing({})}>
              <Plus size={16} weight="bold" />
              Add Customer
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto animate-fade-up" style={{ animationDelay: "40ms" }}>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="th">Code</th>
              <th className="th">Customer Name</th>
              <th className="th">Company</th>
              <th className="th">Mobile</th>
              <th className="th">City</th>
              <th className="th text-right">Credit Limit</th>
              <th className="th">Status</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="td font-mono text-xs text-accent-400">{c.code}</td>
                <td className="td font-semibold text-[#e7e9ea]">{c.name}</td>
                <td className="td text-[#71767b] text-xs">{c.company || "—"}</td>
                <td className="td font-mono text-xs text-[#71767b]">{c.mobile || "—"}</td>
                <td className="td text-xs text-zinc-300">{c.city || "—"}</td>
                <td className="td text-right font-mono text-xs font-semibold text-[#e7e9ea]">
                  ₹{(c.credit_limit || 0).toLocaleString("en-IN")}
                </td>
                <td className="td">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    c.status === "ACTIVE"
                      ? "bg-[#00ba7c]/10 text-[#00ba7c] border-[#00ba7c]/20"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700/60"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${c.status === "ACTIVE" ? "bg-[#00ba7c]" : "bg-zinc-400"}`} />
                    {c.status}
                  </span>
                </td>
                <td className="td text-right whitespace-nowrap text-xs">
                  <button className="text-accent-400 hover:text-accent-300 font-semibold mr-3 transition" onClick={() => setProfile(c)}>
                    Profile
                  </button>
                  {canEdit && (
                    <button className="text-[#71767b] hover:text-[#e7e9ea] font-medium mr-3 transition" onClick={() => setEditing(c)}>
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button className="text-[#f4212e] hover:text-rose-400 font-medium transition" onClick={() => remove(c)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="td py-12 text-center text-sm font-medium text-[#71767b]" colSpan={8}>
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : "Add Customer"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="grid grid-cols-2 gap-3 text-sm">
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
            <Field name="credit_limit" label="Credit Limit (₹)" defaultValue={editing.credit_limit ?? 0} type="number" step="0.01" />
            <Field name="opening_balance" label="Opening Balance (₹)" defaultValue={editing.opening_balance ?? 0} type="number" step="0.01" />
            <Field name="payment_terms" label="Payment Terms" defaultValue={editing.payment_terms} />
            {editing.id && (
              <div>
                <label className="label">Status</label>
                <select name="status" defaultValue={editing.status} className="input">
                  <option value="ACTIVE" className="bg-[#111111]">ACTIVE</option>
                  <option value="INACTIVE" className="bg-[#111111]">INACTIVE</option>
                </select>
              </div>
            )}
            <Field name="notes" label="Notes" defaultValue={editing.notes} className="col-span-2" />
            {error && <div className="col-span-2 text-xs font-semibold text-[#f4212e]">{error}</div>}
            <div className="col-span-2 flex justify-end gap-2 mt-3 pt-3 border-t border-white/[0.08]">
              <button type="button" className="btn-secondary text-xs" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary text-xs">Save Customer</button>
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
      {!data ? (
        <div className="text-[#71767b] text-sm py-12 text-center">Loading customer profile…</div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {[
              ["Total Bookings", data.stats.total_bilties],
              ["Total Parcels", data.stats.total_parcels],
              ["Delivered", data.stats.delivered],
              ["Pending", data.stats.pending],
              ["Receivable", "₹" + (data.stats.receivable || 0).toLocaleString("en-IN")],
            ].map(([l, v]) => (
              <div key={l as string} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#71767b]">{l as string}</div>
                <div className="mt-1 text-base font-bold text-[#e7e9ea]">{v as any}</div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-2">Ledger Transactions</h3>
            <LedgerTable rows={data.ledger} />
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-2">Recent Consignments</h3>
            <div className="card overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="th">Bilty No</th>
                    <th className="th">Date</th>
                    <th className="th">Route</th>
                    <th className="th text-right">Amount</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {data.bilties.map((b: any) => (
                    <tr key={b.id} className="hover:bg-white/[0.02]">
                      <td className="td font-mono text-xs text-accent-400">{b.bilty_no}</td>
                      <td className="td font-mono text-xs text-[#71767b]">{b.booking_date}</td>
                      <td className="td text-xs text-zinc-300">{b.from_city} → {b.to_city}</td>
                      <td className="td text-right font-mono text-xs font-semibold text-[#e7e9ea]">₹{b.total_charges}</td>
                      <td className="td text-xs font-bold text-zinc-400">{b.status}</td>
                    </tr>
                  ))}
                  {data.bilties.length === 0 && (
                    <tr><td className="td text-[#71767b] text-center py-6" colSpan={5}>No bilties yet</td></tr>
                  )}
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
    <div className="card overflow-x-auto max-h-60 overflow-y-auto">
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="th">Date</th>
            <th className="th">Particulars</th>
            <th className="th text-right">Debit</th>
            <th className="th text-right">Credit</th>
            <th className="th text-right">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {rows.map((r: any, i: number) => (
            <tr key={i} className="hover:bg-white/[0.02]">
              <td className="td font-mono text-xs text-[#71767b]">{r.date}</td>
              <td className="td text-xs text-[#e7e9ea]">{r.particulars}</td>
              <td className="td text-right font-mono text-xs font-semibold text-[#f4212e]">{r.debit ? `₹${r.debit}` : "—"}</td>
              <td className="td text-right font-mono text-xs font-semibold text-[#00ba7c]">{r.credit ? `₹${r.credit}` : "—"}</td>
              <td className="td text-right font-mono text-xs font-bold text-[#e7e9ea]">₹{r.balance}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td className="td text-[#71767b] text-center py-6" colSpan={5}>No ledger entries recorded</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        className={`animate-pop max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#121214] shadow-2xl ${wide ? "max-w-4xl" : "max-w-2xl"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#121214]/95 px-6 py-4 backdrop-blur">
          <h2 className="text-sm font-bold tracking-tight text-[#e7e9ea]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-[#71767b] transition hover:bg-white/[0.08] hover:text-[#e7e9ea]"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
        <div className="p-6">{children}</div>
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
      <input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} step={step} className="input text-sm" />
    </div>
  );
}
