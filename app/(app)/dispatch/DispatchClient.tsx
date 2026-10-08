"use client";

import { useCallback, useEffect, useState } from "react";

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
    if (!res.ok) { setLookupErr(j.error || "Not found"); return; }
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
      <h1 className="text-xl sm:text-2xl font-bold">Dispatch</h1>

      {!canDispatch && <div className="card-p text-amber-700 bg-amber-50 border border-amber-200 text-sm">Your role can view dispatches but not create them.</div>}

      <div className="card-p">
        <h2 className="font-semibold mb-3">1. Find Bilty</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input font-mono" placeholder="e.g. 202610-00001"
            value={biltyNo} onChange={(e) => setBiltyNo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && find()} />
          <button className="btn-primary shrink-0" onClick={find}>Load Bilty</button>
        </div>
        {lookupErr && <div className="text-sm text-red-600 mt-2">{lookupErr}</div>}
      </div>

      {lookup && (
        <>
          <div className="card-p">
            <h2 className="font-semibold mb-3">2. Loaded Automatically (no re-entry)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Info l="Bilty No" v={lookup.bilty_no} />
              <Info l="Customer" v={lookup.customer_name} />
              <Info l="Sender" v={`${lookup.sender_name}${lookup.sender_mobile ? " · " + lookup.sender_mobile : ""}`} />
              <Info l="Receiver" v={`${lookup.receiver_name}${lookup.receiver_mobile ? " · " + lookup.receiver_mobile : ""}`} />
              <Info l="Route" v={`${lookup.from_city} → ${lookup.to_city}`} />
              <Info l="Vendor" v={lookup.vendor_name} />
              <Info l="Parcels" v={String(lookup.parcel_count)} />
              <Info l="Chargeable Weight" v={`${lookup.chargeable_weight} kg`} />
              <Info l="Customer Amount" v={money(lookup.total_charges)} />
              <Info l="Vendor Cost" v={money(lookup.vendor_cost)} />
            </div>
          </div>
          <div className="card-p">
            <h2 className="font-semibold mb-3">3. Dispatch Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Inp label="Dispatch Date *" type="date" value={form.dispatch_date} onChange={(v) => setForm({ ...form, dispatch_date: v })} />
              <Inp label="Vehicle Number *" value={form.vehicle_no} onChange={(v) => setForm({ ...form, vehicle_no: v })} />
              <Inp label="Driver *" value={form.driver} onChange={(v) => setForm({ ...form, driver: v })} />
              <Inp label="Manifest Number *" value={form.manifest_no} onChange={(v) => setForm({ ...form, manifest_no: v })} />
              <Inp label="Route" value={form.route} onChange={(v) => setForm({ ...form, route: v })} />
              <Inp label="Dispatch Branch" value={form.dispatch_branch} onChange={(v) => setForm({ ...form, dispatch_branch: v })} />
              <Inp label="Remarks" value={form.remarks} onChange={(v) => setForm({ ...form, remarks: v })} className="md:col-span-3" />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button className="btn-primary" disabled={saving} onClick={() => dispatchBilty(false)}>
                {saving ? "Dispatching…" : "Dispatch Bilty"}
              </button>
              <button className="btn-secondary" disabled={saving} onClick={() => dispatchBilty(true)}>Dispatch & Print Manifest</button>
              <button className="btn-secondary" onClick={() => setLookup(null)}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {done && (
        <div className="card-p bg-emerald-50 border border-emerald-200">
          ✅ Bilty <b className="font-mono">{done.bilty_no}</b> dispatched · manifest <b>{done.manifest_no}</b> · status is now <b>DISPATCHED</b>
        </div>
      )}

      <div className="card overflow-x-auto">
        <h2 className="font-semibold p-4 pb-2">Recent Dispatches</h2>
        <table className="w-full">
          <thead><tr><th className="th">Bilty</th><th className="th">Date</th><th className="th">Vehicle</th><th className="th">Driver</th><th className="th">Manifest</th><th className="th">Route</th><th className="th">By</th></tr></thead>
          <tbody>
            {recent.map((d) => (
              <tr key={d.id}>
                <td className="td font-mono text-xs">{d.bilty_no}</td>
                <td className="td">{d.dispatch_date}</td>
                <td className="td">{d.vehicle_no}</td>
                <td className="td">{d.driver}</td>
                <td className="td">{d.manifest_no}</td>
                <td className="td">{d.from_city} → {d.to_city}</td>
                <td className="td">{d.dispatched_by}</td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td className="td text-slate-400" colSpan={7}>No dispatches yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Info({ l, v }: { l: string; v: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5">
      <div className="text-xs text-slate-500">{l}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

function Inp({ label, value, onChange, type = "text", className }: { label: string; value: any; onChange: (v: string) => void; type?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
