"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const empty = {
  customer_id: "", vendor_id: "",
  sender_name: "", sender_mobile: "", sender_address: "",
  receiver_name: "", receiver_mobile: "", receiver_address: "",
  from_city: "", to_city: "", parcel_type: "PARCEL",
  parcel_count: "1", actual_weight: "", chargeable_weight: "",
  freight: "0", loading_charge: "0", unloading_charge: "0", other_charges: "0",
  discount: "0", cod_amount: "0", payment_mode: "CREDIT", remarks: "",
  manual_rate: false, company_rate: "0", vendor_rate: "0", commission: "0",
};

export function BiltyNewClient() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [quote, setQuote] = useState<any>(null);
  const [quoteErr, setQuoteErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<any>(null);

  useEffect(() => {
    Promise.all([fetch("/api/customers").then((r) => r.json()), fetch("/api/vendors").then((r) => r.json())])
      .then(([cs, vs]) => { setCustomers(cs); setVendors(vs.filter((v: any) => v.status === "ACTIVE")); });
  }, []);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const refreshQuote = useCallback(async (f: any) => {
    setQuoteErr("");
    if (!f.vendor_id || !(Number(f.chargeable_weight) > 0)) { setQuote(null); return; }
    const p = new URLSearchParams({
      vendor_id: f.vendor_id, weight: f.chargeable_weight, parcels: f.parcel_count || "1",
      freight: f.freight, loading_charge: f.loading_charge, unloading_charge: f.unloading_charge,
      other_charges: f.other_charges, discount: f.discount, cod_amount: f.cod_amount,
    });
    if (f.manual_rate) {
      p.set("manual", "1");
      p.set("company_rate", f.company_rate);
      p.set("vendor_rate", f.vendor_rate);
      p.set("commission", f.commission);
    }
    const res = await fetch(`/api/bilty/quote?${p}`);
    const j = await res.json();
    if (j.error) { setQuote(null); setQuoteErr(j.error); return; }
    setQuote(j);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => refreshQuote(form), 300);
    return () => clearTimeout(t);
  }, [form, refreshQuote]);

  async function save(print: boolean) {
    setSaving(true);
    setError("");
    const body: any = { ...form, customer_id: Number(form.customer_id), vendor_id: Number(form.vendor_id) };
    for (const k of ["parcel_count", "actual_weight", "chargeable_weight", "freight", "loading_charge", "unloading_charge", "other_charges", "discount", "cod_amount"]) body[k] = Number(body[k]) || 0;
    if (form.manual_rate) for (const k of ["company_rate", "vendor_rate", "commission"]) body[k] = Number(body[k]) || 0;
    const res = await fetch("/api/bilty", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setError(j.error || "Save failed"); return; }
    if (print) window.open(`/bilty/${j.bilty_no}/print`, "_blank");
    setSaved(j);
  }

  const ch = quote?.charges;
  const money = (n: any) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (saved) {
    return (
      <div className="max-w-lg mx-auto card-p text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-bold">Bilty {saved.bilty_no} saved</h1>
        <div className="text-sm text-slate-500 space-y-1">
          <div>Status: <b>{saved.status}</b></div>
          <div>Customer charges: <b>{money(saved.total_charges)}</b></div>
          <div>Vendor cost: <b>{money(saved.vendor_cost)}</b></div>
          <div>Margin: <b>{money(saved.gross_margin)}</b></div>
        </div>
        <div className="flex justify-center gap-2">
          <a className="btn-secondary" href={`/bilty/${saved.bilty_no}`}>Open Bilty</a>
          <button className="btn-primary" onClick={() => { setForm(empty); setQuote(null); setSaved(null); }}>Book Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Bilty / Booking</h1>
        <div className="text-xs text-slate-500">Bilty number is auto-generated on save</div>
      </div>

      <div className="card-p grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="label">Customer *</label>
          <select className="input" value={form.customer_id} onChange={(e) => set("customer_id", e.target.value)}>
            <option value="">Select…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Vendor *</label>
          <select className="input" value={form.vendor_id} onChange={(e) => set("vendor_id", e.target.value)}>
            <option value="">Select…</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.code} — {v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">From *</label>
          <input className="input" value={form.from_city} onChange={(e) => set("from_city", e.target.value)} placeholder="Origin city" />
        </div>
        <div>
          <label className="label">To *</label>
          <input className="input" value={form.to_city} onChange={(e) => set("to_city", e.target.value)} placeholder="Destination city" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-p">
            <h2 className="font-semibold mb-3">Sender</h2>
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Sender Name *" value={form.sender_name} onChange={(v) => set("sender_name", v)} />
              <Inp label="Sender Mobile" value={form.sender_mobile} onChange={(v) => set("sender_mobile", v)} />
              <Inp label="Sender Address" value={form.sender_address} onChange={(v) => set("sender_address", v)} className="col-span-2" />
            </div>
          </div>
          <div className="card-p">
            <h2 className="font-semibold mb-3">Receiver</h2>
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Receiver Name *" value={form.receiver_name} onChange={(v) => set("receiver_name", v)} />
              <Inp label="Receiver Mobile" value={form.receiver_mobile} onChange={(v) => set("receiver_mobile", v)} />
              <Inp label="Receiver Address" value={form.receiver_address} onChange={(v) => set("receiver_address", v)} className="col-span-2" />
            </div>
          </div>
          <div className="card-p">
            <h2 className="font-semibold mb-3">Consignment</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="label">Parcel Type</label>
                <select className="input" value={form.parcel_type} onChange={(e) => set("parcel_type", e.target.value)}>
                  <option>PARCEL</option><option>DOCUMENT</option><option>FREIGHT</option><option>COD</option><option>FRAGILE</option>
                </select>
              </div>
              <Inp label="Number of Parcels *" type="number" value={form.parcel_count} onChange={(v) => set("parcel_count", v)} />
              <Inp label="Actual Weight (kg) *" type="number" value={form.actual_weight} onChange={(v) => set("actual_weight", v)} />
              <Inp label="Chargeable Weight (kg) *" type="number" value={form.chargeable_weight} onChange={(v) => set("chargeable_weight", v)} />
              <div>
                <label className="label">Payment Mode</label>
                <select className="input" value={form.payment_mode} onChange={(e) => set("payment_mode", e.target.value)}>
                  <option>CREDIT</option><option>PAID</option><option>TO_PAY</option><option>COD</option>
                </select>
              </div>
              <Inp label="COD Amount" type="number" value={form.cod_amount} onChange={(v) => set("cod_amount", v)} />
            </div>
          </div>
          <div className="card-p">
            <h2 className="font-semibold mb-3">Charges</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Inp label="Freight" type="number" value={form.freight} onChange={(v) => set("freight", v)} />
              <Inp label="Loading Charge" type="number" value={form.loading_charge} onChange={(v) => set("loading_charge", v)} />
              <Inp label="Unloading Charge" type="number" value={form.unloading_charge} onChange={(v) => set("unloading_charge", v)} />
              <Inp label="Other Charges" type="number" value={form.other_charges} onChange={(v) => set("other_charges", v)} />
              <Inp label="Discount" type="number" value={form.discount} onChange={(v) => set("discount", v)} />
              <Inp label="Remarks" value={form.remarks} onChange={(v) => set("remarks", v)} />
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm">
              <input type="checkbox" checked={form.manual_rate} onChange={(e) => set("manual_rate", e.target.checked)} className="h-4 w-4" />
              Override rates manually
            </label>
            {form.manual_rate && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                <Inp label="Company Rate ₹/kg" type="number" value={form.company_rate} onChange={(v) => set("company_rate", v)} />
                <Inp label="Vendor Rate ₹/kg" type="number" value={form.vendor_rate} onChange={(v) => set("vendor_rate", v)} />
                <Inp label="Commission ₹" type="number" value={form.commission} onChange={(v) => set("commission", v)} />
              </div>
            )}
          </div>
        </div>

        {/* Live calculation panel */}
        <div className="space-y-4">
          <div className="card-p sticky top-4">
            <h2 className="font-semibold mb-3">Live Calculation</h2>
            {quoteErr && <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">{quoteErr}</div>}
            {!quote && !quoteErr && <div className="text-sm text-slate-400">Select vendor and enter chargeable weight to auto-load rates.</div>}
            {quote && (
              <div className="space-y-2 text-sm">
                <Row l="Rate config" v={quote.rates.rate_config_id ? `#${quote.rates.rate_config_id}` : "—"} />
                <Row l="Company rate" v={`${money(quote.rates.company_rate)}/kg`} />
                <Row l="Vendor rate" v={`${money(quote.rates.vendor_rate)}/kg`} />
                {quote.rates.commission > 0 && <Row l="Commission" v={money(quote.rates.commission)} />}
                <hr />
                <Row l="Customer amount" v={money(ch.customer_amount)} bold />
                <Row l="+ Loading" v={money(form.loading_charge)} />
                <Row l="+ Unloading" v={money(form.unloading_charge)} />
                <Row l="+ Other" v={money(form.other_charges)} />
                <Row l="− Discount" v={money(form.discount)} />
                <Row l="Total Customer Charge" v={money(ch.total_charges)} bold />
                <hr />
                <Row l="Vendor amount" v={money(ch.vendor_amount)} />
                <Row l="Total Vendor Cost" v={money(ch.vendor_cost)} bold />
                <Row l="Gross Margin" v={money(ch.gross_margin)} bold />
                <div className={`rounded-lg px-3 py-2 font-bold ${ch.net_amount >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  Net Amount: {money(ch.net_amount)}
                </div>
              </div>
            )}
            {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
            <div className="mt-4 space-y-2">
              <button className="btn-primary w-full" disabled={saving || !quote} onClick={() => save(false)}>
                {saving ? "Saving…" : "Save Bilty"}
              </button>
              <button className="btn-secondary w-full" disabled={saving || !quote} onClick={() => save(true)}>
                Save & Print
              </button>
              <button className="btn-secondary w-full" onClick={() => { setForm(empty); setQuote(null); }}>Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Inp({ label, value, onChange, type = "text", className }: { label: string; value: any; onChange: (v: string) => void; type?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <input className="input" type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Row({ l, v, bold }: { l: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className="text-slate-500">{l}</span>
      <span>{v}</span>
    </div>
  );
}
