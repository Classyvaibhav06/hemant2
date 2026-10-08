"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, FloppyDisk, Printer, ArrowCounterClockwise, Calculator, Warning } from "@phosphor-icons/react";

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
      <div className="card-p mx-auto max-w-lg animate-fade-up space-y-5 text-center my-6">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#00ba7c]/15 text-[#00ba7c] shadow-[0_0_20px_rgba(0,186,124,0.3)]">
          <CheckCircle size={36} weight="fill" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-[#e7e9ea]">Bilty {saved.bilty_no} Created</h1>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between"><span className="text-[#71767b]">Status:</span> <span className="font-bold text-[#00ba7c]">{saved.status}</span></div>
          <div className="flex justify-between"><span className="text-[#71767b]">Customer Charges:</span> <span className="font-mono font-bold text-[#e7e9ea]">{money(saved.total_charges)}</span></div>
          <div className="flex justify-between"><span className="text-[#71767b]">Vendor Cost:</span> <span className="font-mono text-[#71767b]">{money(saved.vendor_cost)}</span></div>
          <div className="flex justify-between border-t border-white/[0.06] pt-1.5"><span className="text-[#71767b]">Gross Margin:</span> <span className="font-mono font-bold text-accent-400">{money(saved.gross_margin)}</span></div>
        </div>
        <div className="flex justify-center gap-3">
          <a className="btn-secondary text-xs" href={`/bilty/${saved.bilty_no}`}>Open Bilty</a>
          <button className="btn-primary text-xs" onClick={() => { setForm(empty); setQuote(null); setSaved(null); }}>Book Another Bilty</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#71767b]">Consignment Entry</span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-[#e7e9ea]">New Bilty Booking</h1>
        </div>
        <div className="font-mono text-xs text-[#71767b]">Auto-generated BLT sequence on submission</div>
      </div>

      <div className="card-p animate-fade-up grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="label">Customer *</label>
          <select className="input text-sm" value={form.customer_id} onChange={(e) => set("customer_id", e.target.value)}>
            <option value="" className="bg-[#111111]">Select Customer…</option>
            {customers.map((c) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.code} — {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Vendor / Transporter *</label>
          <select className="input text-sm" value={form.vendor_id} onChange={(e) => set("vendor_id", e.target.value)}>
            <option value="" className="bg-[#111111]">Select Transporter…</option>
            {vendors.map((v) => <option key={v.id} value={v.id} className="bg-[#111111]">{v.code} — {v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Origin City *</label>
          <input className="input text-sm" value={form.from_city} onChange={(e) => set("from_city", e.target.value)} placeholder="From city (e.g. Delhi)" />
        </div>
        <div>
          <label className="label">Destination City *</label>
          <input className="input text-sm" value={form.to_city} onChange={(e) => set("to_city", e.target.value)} placeholder="To city (e.g. Mumbai)" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-p">
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-3">Sender Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Sender Name *" value={form.sender_name} onChange={(v) => set("sender_name", v)} />
              <Inp label="Sender Mobile" value={form.sender_mobile} onChange={(v) => set("sender_mobile", v)} />
              <Inp label="Sender Address" value={form.sender_address} onChange={(v) => set("sender_address", v)} className="col-span-2" />
            </div>
          </div>
          <div className="card-p">
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-3">Receiver Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Receiver Name *" value={form.receiver_name} onChange={(v) => set("receiver_name", v)} />
              <Inp label="Receiver Mobile" value={form.receiver_mobile} onChange={(v) => set("receiver_mobile", v)} />
              <Inp label="Receiver Address" value={form.receiver_address} onChange={(v) => set("receiver_address", v)} className="col-span-2" />
            </div>
          </div>
          <div className="card-p">
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-3">Consignment Particulars</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="label">Commodity Type</label>
                <select className="input text-sm" value={form.parcel_type} onChange={(e) => set("parcel_type", e.target.value)}>
                  <option value="PARCEL" className="bg-[#111111]">PARCEL</option>
                  <option value="DOCUMENT" className="bg-[#111111]">DOCUMENT</option>
                  <option value="FREIGHT" className="bg-[#111111]">FREIGHT</option>
                  <option value="COD" className="bg-[#111111]">COD</option>
                  <option value="FRAGILE" className="bg-[#111111]">FRAGILE</option>
                </select>
              </div>
              <Inp label="Parcels Count *" type="number" value={form.parcel_count} onChange={(v) => set("parcel_count", v)} />
              <Inp label="Actual Weight (kg) *" type="number" value={form.actual_weight} onChange={(v) => set("actual_weight", v)} />
              <Inp label="Chargeable Weight (kg) *" type="number" value={form.chargeable_weight} onChange={(v) => set("chargeable_weight", v)} />
              <div>
                <label className="label">Payment Mode</label>
                <select className="input text-sm" value={form.payment_mode} onChange={(e) => set("payment_mode", e.target.value)}>
                  <option value="CREDIT" className="bg-[#111111]">CREDIT</option>
                  <option value="PAID" className="bg-[#111111]">PAID</option>
                  <option value="TO_PAY" className="bg-[#111111]">TO_PAY</option>
                  <option value="COD" className="bg-[#111111]">COD</option>
                </select>
              </div>
              <Inp label="COD Amount (₹)" type="number" value={form.cod_amount} onChange={(v) => set("cod_amount", v)} />
            </div>
          </div>
          <div className="card-p">
            <h2 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-3">Charges & Adjustments</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Inp label="Base Freight (₹)" type="number" value={form.freight} onChange={(v) => set("freight", v)} />
              <Inp label="Loading Charge (₹)" type="number" value={form.loading_charge} onChange={(v) => set("loading_charge", v)} />
              <Inp label="Unloading Charge (₹)" type="number" value={form.unloading_charge} onChange={(v) => set("unloading_charge", v)} />
              <Inp label="Other Surcharges (₹)" type="number" value={form.other_charges} onChange={(v) => set("other_charges", v)} />
              <Inp label="Discount (₹)" type="number" value={form.discount} onChange={(v) => set("discount", v)} />
              <Inp label="Remarks" value={form.remarks} onChange={(v) => set("remarks", v)} />
            </div>
            <label className="flex items-center gap-2.5 mt-3 text-xs text-[#e7e9ea] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.manual_rate}
                onChange={(e) => set("manual_rate", e.target.checked)}
                className="h-4 w-4 rounded accent-accent-500"
              />
              Override rates manually (Admin mode)
            </label>
            {form.manual_rate && (
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/[0.06]">
                <Inp label="Company Rate ₹/kg" type="number" value={form.company_rate} onChange={(v) => set("company_rate", v)} />
                <Inp label="Vendor Rate ₹/kg" type="number" value={form.vendor_rate} onChange={(v) => set("vendor_rate", v)} />
                <Inp label="Commission ₹" type="number" value={form.commission} onChange={(v) => set("commission", v)} />
              </div>
            )}
          </div>
        </div>

        {/* Live calculation panel */}
        <div className="space-y-4">
          <div className="card-p lg:sticky lg:top-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={18} className="text-accent-400" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-[#71767b]">Real-Time Quote</h2>
            </div>
            {quoteErr && (
              <div className="text-xs text-[#ffd400] bg-[#ffd400]/10 border border-[#ffd400]/20 rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2">
                <Warning size={14} weight="fill" className="shrink-0" />
                {quoteErr}
              </div>
            )}
            {!quote && !quoteErr && (
              <div className="text-xs text-[#71767b] py-6 text-center">
                Select transporter vendor & enter chargeable weight to generate quote.
              </div>
            )}
            {quote && (
              <div className="space-y-2 text-xs">
                <Row l="Rate config" v={quote.rates.rate_config_id ? `#${quote.rates.rate_config_id}` : "Manual"} />
                <Row l="Customer rate" v={`${money(quote.rates.company_rate)}/kg`} />
                <Row l="Vendor rate" v={`${money(quote.rates.vendor_rate)}/kg`} />
                {quote.rates.commission > 0 && <Row l="Commission" v={money(quote.rates.commission)} />}
                <div className="divider my-1" />
                <Row l="Base customer freight" v={money(ch.customer_amount)} bold />
                <Row l="+ Loading surcharge" v={money(form.loading_charge)} />
                <Row l="+ Unloading surcharge" v={money(form.unloading_charge)} />
                <Row l="+ Other charges" v={money(form.other_charges)} />
                <Row l="− Discount allowed" v={money(form.discount)} />
                <Row l="Total Customer Charge" v={money(ch.total_charges)} bold highlight="blue" />
                <div className="divider my-1" />
                <Row l="Vendor cost" v={money(ch.vendor_cost)} bold />
                <Row l="Gross margin" v={money(ch.gross_margin)} bold />
                <div className={`rounded-xl px-3 py-2 font-bold flex justify-between items-center ${
                  ch.net_amount >= 0 ? "bg-[#00ba7c]/10 text-[#00ba7c] border border-[#00ba7c]/20" : "bg-[#f4212e]/10 text-[#f4212e] border border-[#f4212e]/20"
                }`}>
                  <span>Net Estimated Margin:</span>
                  <span className="font-mono">{money(ch.net_amount)}</span>
                </div>
              </div>
            )}
            {error && <div className="text-xs font-semibold text-[#f4212e] mt-3">{error}</div>}
            <div className="mt-4 space-y-2">
              <button
                className="btn-primary w-full text-xs gap-1.5"
                disabled={saving || !quote}
                onClick={() => save(false)}
              >
                <FloppyDisk size={15} weight="bold" />
                {saving ? "Saving…" : "Save Bilty"}
              </button>
              <button
                className="btn-secondary w-full text-xs gap-1.5"
                disabled={saving || !quote}
                onClick={() => save(true)}
              >
                <Printer size={15} />
                Save & Print Bilty
              </button>
              <button
                className="btn-secondary w-full text-xs gap-1.5 opacity-70 hover:opacity-100"
                onClick={() => { setForm(empty); setQuote(null); }}
              >
                <ArrowCounterClockwise size={14} />
                Reset Form
              </button>
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
      <input className="input text-sm" type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Row({ l, v, bold, highlight }: { l: string; v: string; bold?: boolean; highlight?: "blue" | "green" }) {
  return (
    <div className={`flex justify-between py-0.5 ${bold ? "font-semibold" : ""}`}>
      <span className="text-[#71767b]">{l}</span>
      <span className={`font-mono ${
        highlight === "blue" ? "text-accent-400 font-bold" :
        highlight === "green" ? "text-[#00ba7c] font-bold" :
        "text-[#e7e9ea]"
      }`}>
        {v}
      </span>
    </div>
  );
}
