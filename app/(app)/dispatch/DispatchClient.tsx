"use client";

import { useCallback, useEffect, useState } from "react";
import { PaperPlaneTilt, MagnifyingGlass, CheckCircle, Warning, Printer, X, Truck } from "@phosphor-icons/react";

const money = (n: any) => "₹" + Number(n || 0).toLocaleString("en-IN");

export function DispatchClient({ role }: { role: string }) {
  const [recent, setRecent] = useState<any[]>([]);
  const [lookup, setLookup] = useState<any>(null);
  const [biltyNo, setBiltyNo] = useState("");
  const [lookupErr, setLookupErr] = useState("");
  const [form, setForm] = useState({
    dispatch_date: new Date().toISOString().slice(0, 10),
    vehicle_no: "", driver: "", manifest_no: "", route: "", dispatch_branch: "", remarks: "",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<any>(null);
  const canDispatch = ["SUPER_ADMIN", "ADMIN", "MANAGER", "DISPATCH_STAFF"].includes(role);

  const loadRecent = useCallback(async () => {
    setRecent(await fetch("/api/dispatch").then((r) => r.json()));
  }, []);
  useEffect(() => { loadRecent(); }, [loadRecent]);

  async function find() {
    setLookupErr(""); setLookup(null); setDone(null);
    const res = await fetch(`/api/dispatch/lookup?bilty_no=${encodeURIComponent(biltyNo.trim())}`);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setLookupErr(j.error || "Bilty not found in active records"); return; }
    if (j.already_dispatched) { setLookupErr(`Bilty ${j.bilty_no} is already dispatched`); return; }
    if (j.status !== "BOOKED") { setLookupErr(`Bilty is ${j.status} — only BOOKED bilties can be dispatched`); return; }
    setLookup(j);
  }

  async function dispatchBilty(withPrint: boolean) {
    setSaving(true);
    const res = await fetch("/api/dispatch/bilty", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, bilty_no: lookup.bilty_no }),
    });
    setSaving(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { alert(j.error || "Dispatch failed"); return; }
    setDone({ bilty_no: lookup.bilty_no, manifest_no: form.manifest_no });
    setLookup(null);
    setBiltyNo("");
    loadRecent();
    if (withPrint) window.open(`/bilty/${lookup.bilty_no}/print`, "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="animate-fade-up">
        <div className="flex items-center gap-2">
          <PaperPlaneTilt size={16} className="text-accent-400" />
          <span className="font-mono text-xs uppercase tracking-wider text-[#71767b]">Outward Logistics</span>
        </div>
        <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-[#e7e9ea]">Dispatch Manifests</h1>
        <p className="mt-0.5 text-xs text-[#71767b]">Assign vehicles, drivers, and print departure manifests</p>
      </div>

      {!canDispatch && (
        <div className="card-p border border-[#ffd400]/20 bg-[#ffd400]/10 text-xs text-[#ffd400] flex items-center gap-2">
          <Warning size={16} weight="fill" />
          Your account role permits viewing past dispatches but cannot issue vehicle departure manifests.
        </div>
      )}

      <div className="card-p animate-fade-up" style={{ animationDelay: "40ms" }}>
        <h2 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-3">1. Select Consignment</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#71767b]" />
            <input
              className="input pl-9 font-mono text-sm tracking-wider uppercase placeholder:normal-case placeholder:font-sans"
              placeholder="Enter booked bilty number (e.g. BLT-2026-0001)"
              value={biltyNo}
              onChange={(e) => setBiltyNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && find()}
            />
          </div>
          <button className="btn-primary text-xs shrink-0 gap-1.5" onClick={find}>
            <MagnifyingGlass size={15} weight="bold" />
            Load Bilty Details
          </button>
        </div>
        {lookupErr && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#f4212e]/20 bg-[#f4212e]/10 px-3.5 py-2 text-xs font-semibold text-[#f4212e]">
            <Warning size={15} weight="fill" />
            {lookupErr}
          </div>
        )}
      </div>

      {lookup && (
        <>
          <div className="card-p animate-fade-up">
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-3">2. Consignment Data (Auto-Verified)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              <Info l="Bilty No" v={lookup.bilty_no} highlight />
              <Info l="Customer" v={lookup.customer_name} />
              <Info l="Sender" v={`${lookup.sender_name}${lookup.sender_mobile ? " · " + lookup.sender_mobile : ""}`} />
              <Info l="Receiver" v={`${lookup.receiver_name}${lookup.receiver_mobile ? " · " + lookup.receiver_mobile : ""}`} />
              <Info l="Corridor" v={`${lookup.from_city} → ${lookup.to_city}`} />
              <Info l="Transporter" v={lookup.vendor_name} />
              <Info l="Parcels Count" v={String(lookup.parcel_count)} />
              <Info l="Chargeable Weight" v={`${lookup.chargeable_weight} kg`} />
              <Info l="Customer Freight" v={money(lookup.total_charges)} />
              <Info l="Vendor Payable" v={money(lookup.vendor_cost)} />
            </div>
          </div>
          <div className="card-p animate-fade-up">
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-3">3. Vehicle & Route Assignment</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Inp label="Dispatch Date *" type="date" value={form.dispatch_date} onChange={(v) => setForm({ ...form, dispatch_date: v })} />
              <Inp label="Vehicle Number *" value={form.vehicle_no} onChange={(v) => setForm({ ...form, vehicle_no: v })} placeholder="e.g. DL-01-AB-1234" />
              <Inp label="Driver Name *" value={form.driver} onChange={(v) => setForm({ ...form, driver: v })} placeholder="Driver's full name" />
              <Inp label="Manifest Number *" value={form.manifest_no} onChange={(v) => setForm({ ...form, manifest_no: v })} placeholder="e.g. MNF-8921" />
              <Inp label="Transit Route" value={form.route} onChange={(v) => setForm({ ...form, route: v })} placeholder="e.g. NH-48 Express Corridor" />
              <Inp label="Origin Branch" value={form.dispatch_branch} onChange={(v) => setForm({ ...form, dispatch_branch: v })} placeholder="Delhi Central Hub" />
              <Inp label="Driver / Trip Remarks" value={form.remarks} onChange={(v) => setForm({ ...form, remarks: v })} className="md:col-span-3" />
            </div>
            <div className="flex flex-wrap gap-2.5 mt-4 pt-3 border-t border-white/[0.08]">
              <button className="btn-primary text-xs gap-1.5" disabled={saving} onClick={() => dispatchBilty(false)}>
                <PaperPlaneTilt size={14} weight="bold" />
                {saving ? "Dispatching…" : "Confirm Dispatch"}
              </button>
              <button className="btn-secondary text-xs gap-1.5" disabled={saving} onClick={() => dispatchBilty(true)}>
                <Printer size={14} />
                Dispatch & Print Manifest
              </button>
              <button className="btn-secondary text-xs gap-1 opacity-70 hover:opacity-100" onClick={() => setLookup(null)}>
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {done && (
        <div className="card-p animate-fade-up border border-[#00ba7c]/20 bg-[#00ba7c]/10 text-xs text-[#00ba7c] flex items-center gap-2.5">
          <CheckCircle size={18} weight="fill" className="shrink-0" />
          <span>
            Bilty <b className="font-mono text-[#e7e9ea]">{done.bilty_no}</b> successfully dispatched · Manifest <b className="font-mono text-[#e7e9ea]">{done.manifest_no}</b> · Status updated to <b>DISPATCHED</b>
          </span>
        </div>
      )}

      <div className="card overflow-x-auto animate-fade-up" style={{ animationDelay: "60ms" }}>
        <div className="p-4 pb-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-[#71767b]">Recent Vehicle Dispatches</h2>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="th">Bilty No</th>
              <th className="th">Date</th>
              <th className="th">Vehicle</th>
              <th className="th">Driver</th>
              <th className="th">Manifest</th>
              <th className="th">Corridor</th>
              <th className="th">Operator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {recent.map((d) => (
              <tr key={d.id} className="hover:bg-white/[0.02]">
                <td className="td font-mono text-xs text-accent-400">{d.bilty_no}</td>
                <td className="td font-mono text-xs text-[#71767b]">{d.dispatch_date}</td>
                <td className="td text-xs font-semibold text-[#e7e9ea]">{d.vehicle_no}</td>
                <td className="td text-xs text-zinc-300">{d.driver}</td>
                <td className="td font-mono text-xs text-[#71767b]">{d.manifest_no}</td>
                <td className="td text-xs text-[#71767b]">{d.from_city} → {d.to_city}</td>
                <td className="td text-xs text-[#71767b]">{d.dispatched_by}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td className="td text-[#71767b] text-center py-6" colSpan={7}>No vehicle dispatches recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Info({ l, v, highlight }: { l: string; v: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#71767b]">{l}</div>
      <div className={`mt-0.5 font-medium ${highlight ? "font-mono font-bold text-accent-400" : "text-[#e7e9ea]"}`}>{v}</div>
    </div>
  );
}

function Inp({ label, value, onChange, type = "text", className, placeholder }: { label: string; value: any; onChange: (v: string) => void; type?: string; className?: string; placeholder?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <input className="input text-sm" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
