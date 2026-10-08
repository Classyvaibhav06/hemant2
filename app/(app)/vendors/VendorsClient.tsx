"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal, Field } from "@/app/(app)/customers/CustomersClient";
import { Plus, MagnifyingGlass, Truck } from "@phosphor-icons/react";

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
    const res = await fetch(editing?.id ? `/api/vendors/${editing.id}` : "/api/vendors", {
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
      <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-accent-400" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#71767b]">Fleet & Carriers</span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-[#e7e9ea]">Transporters & Vendors</h1>
          <p className="mt-0.5 text-xs text-[#71767b]">{rows.length} active logistics partners</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <MagnifyingGlass size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#71767b]" />
            <input
              className="input pl-9 w-full sm:w-64 text-sm"
              placeholder="Search vendor / code"
              value={q}
              onChange={(e) => { setQ(e.target.value); load(e.target.value); }}
            />
          </div>
          {canEdit && (
            <button className="btn-primary text-sm shrink-0 gap-1.5" onClick={() => setEditing({})}>
              <Plus size={16} weight="bold" />
              Add Vendor
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto animate-fade-up" style={{ animationDelay: "40ms" }}>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="th">Code</th>
              <th className="th">Vendor Name</th>
              <th className="th">Company</th>
              <th className="th">Mobile</th>
              <th className="th">City</th>
              <th className="th">Status</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((v) => (
              <tr key={v.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="td font-mono text-xs text-accent-400">{v.code}</td>
                <td className="td font-semibold text-[#e7e9ea]">{v.name}</td>
                <td className="td text-xs text-[#71767b]">{v.company || "—"}</td>
                <td className="td font-mono text-xs text-[#71767b]">{v.mobile || "—"}</td>
                <td className="td text-xs text-zinc-300">{v.city || "—"}</td>
                <td className="td">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    v.status === "ACTIVE"
                      ? "bg-[#00ba7c]/10 text-[#00ba7c] border-[#00ba7c]/20"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700/60"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${v.status === "ACTIVE" ? "bg-[#00ba7c]" : "bg-zinc-400"}`} />
                    {v.status}
                  </span>
                </td>
                <td className="td text-right whitespace-nowrap text-xs">
                  <button className="text-accent-400 hover:text-accent-300 font-semibold mr-3 transition" onClick={() => setProfile(v)}>
                    Profile
                  </button>
                  {canEdit && (
                    <button className="text-[#71767b] hover:text-[#e7e9ea] font-medium mr-3 transition" onClick={() => setEditing(v)}>
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button className="text-[#f4212e] hover:text-rose-400 font-medium transition" onClick={() => remove(v)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="td py-12 text-center text-sm font-medium text-[#71767b]" colSpan={7}>
                  No vendors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : "Add Vendor"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="grid grid-cols-2 gap-3 text-sm">
            <Field name="name" label="Vendor Name *" defaultValue={editing.name} required />
            <Field name="company" label="Company Name" defaultValue={editing.company} />
            <Field name="mobile" label="Mobile" defaultValue={editing.mobile} />
            <Field name="address" label="Address" defaultValue={editing.address} className="col-span-2" />
            <Field name="city" label="City" defaultValue={editing.city} />
            <Field name="state" label="State" defaultValue={editing.state} />
            <Field name="pincode" label="Pincode" defaultValue={editing.pincode} />
            <Field name="gstin" label="GST" defaultValue={editing.gstin} />
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
            {error && <div className="col-span-2 text-xs font-semibold text-[#f4212e]">{error}</div>}
            <div className="col-span-2 flex justify-end gap-2 mt-3 pt-3 border-t border-white/[0.08]">
              <button type="button" className="btn-secondary text-xs" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary text-xs">Save Vendor</button>
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
      {!data ? (
        <div className="text-[#71767b] text-sm py-12 text-center">Loading vendor profile…</div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {[
              ["Total Bilty", data.stats.total_bilties],
              ["Total Parcels", data.stats.total_parcels],
              ["Commission Earned", "₹" + (data.stats.commission || 0).toLocaleString("en-IN")],
              ["Vendor Payable", "₹" + (data.stats.payable || 0).toLocaleString("en-IN")],
              ["Active Rates", data.rates.filter((r: any) => r.active).length],
            ].map(([l, val]) => (
              <div key={l as string} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#71767b]">{l as string}</div>
                <div className="mt-1 text-base font-bold text-[#e7e9ea]">{val as any}</div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-2">Configured Rate Slabs</h3>
            <div className="card overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="th">Slab Name</th>
                    <th className="th">Commission Type</th>
                    <th className="th text-right">Value</th>
                    <th className="th">Weight Bracket</th>
                    <th className="th">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {data.rates.map((r: any) => (
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="td text-xs font-semibold text-[#e7e9ea]">{r.name}</td>
                      <td className="td text-xs text-[#71767b]">{r.commission_type}</td>
                      <td className="td text-right font-mono text-xs text-[#00ba7c]">₹{r.commission_value}</td>
                      <td className="td font-mono text-xs text-zinc-400">{r.min_weight}–{r.max_weight || "∞"} kg</td>
                      <td className="td text-xs">{r.active ? <span className="text-[#00ba7c] font-bold">✓ Active</span> : <span className="text-zinc-500">Disabled</span>}</td>
                    </tr>
                  ))}
                  {data.rates.length === 0 && <tr><td className="td text-[#71767b] text-center py-6" colSpan={5}>No rates configured</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-2">Vendor Ledger</h3>
            <div className="card overflow-x-auto max-h-56 overflow-y-auto">
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
                  {data.ledger.map((r: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="td font-mono text-xs text-[#71767b]">{r.date}</td>
                      <td className="td text-xs text-[#e7e9ea]">{r.particulars}</td>
                      <td className="td text-right font-mono text-xs font-semibold text-[#f4212e]">{r.debit ? `₹${r.debit}` : "—"}</td>
                      <td className="td text-right font-mono text-xs font-semibold text-[#00ba7c]">{r.credit ? `₹${r.credit}` : "—"}</td>
                      <td className="td text-right font-mono text-xs font-bold text-[#e7e9ea]">₹{r.balance}</td>
                    </tr>
                  ))}
                  {data.ledger.length === 0 && <tr><td className="td text-[#71767b] text-center py-6" colSpan={5}>No ledger entries recorded</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
