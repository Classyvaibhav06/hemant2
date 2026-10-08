"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const STATUS_TONE: Record<string, string> = {
  BOOKED: "bg-slate-100 text-slate-600",
  DISPATCHED: "bg-sky-50 text-sky-700",
  IN_TRANSIT: "bg-brand-50 text-brand-700",
  AT_DESTINATION: "bg-violet-50 text-violet-700",
  OUT_FOR_DELIVERY: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  UNDELIVERED: "bg-rose-50 text-rose-700",
};
const FLOW = ["BOOKED", "DISPATCHED", "IN_TRANSIT", "AT_DESTINATION", "OUT_FOR_DELIVERY", "DELIVERED"];
const money = (n: any) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function BiltyDetailClient({ biltyNo, role }: { biltyNo: string; role: string }) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const canEdit = !["VIEWER"].includes(role);

  const load = useCallback(async () => {
    const res = await fetch(`/api/bilty/${biltyNo}`);
    if (!res.ok) { setErr("Bilty not found"); return; }
    setData(await res.json());
  }, [biltyNo]);

  useEffect(() => { load(); }, [load]);

  async function transition(status: string) {
    const note = prompt(`Note for status change to ${status} (optional):`) || "";
    setBusy(true);
    const res = await fetch(`/api/bilty/${biltyNo}/status`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    setBusy(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); alert(j.error || "Failed"); return; }
    load();
  }

  if (err) return <div className="card-p text-red-600">{err}</div>;
  if (!data) return <div className="text-slate-400 py-10 text-center">Loading…</div>;

  const b = data.bilty;
  const reached = FLOW.indexOf(b.status) === -1 ? 4 : FLOW.indexOf(b.status); // UNDELIVERED shown at OFD stage
  const tabs = [
    ["overview", "Overview"], ["booking", "Booking"], ["dispatch", "Dispatch"],
    ["tracking", "Tracking"], ["ledger", "Ledgers"], ["payments", "Payments"],
    ["audit", "Audit History"],
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card-p flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{b.bilty_no}</h1>
            <span className={`badge ${STATUS_TONE[b.status]}`}>{b.status.replaceAll("_", " ")}</span>
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {b.booking_date} · {b.customer_name} · {b.from_city} → {b.to_city}
          </div>
        </div>
        <div className="flex gap-2">
          <a className="btn-secondary" href={`/bilty/${b.bilty_no}/print`} target="_blank">Print</a>
          {canEdit && data.allowedTransitions.map((s: string) => (
            <button key={s} disabled={busy} className="btn-primary" onClick={() => transition(s)}>
              → {s.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="card-p">
        <div className="flex items-center">
          {FLOW.map((s, i) => (
            <div key={s} className="flex-1 flex items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i <= reached ? "bg-gradient-to-b from-brand-500 to-brand-600 border-brand-600 text-white shadow-[0_4px_10px_-2px_rgb(108_74_236/0.5)]" : "bg-white border-slate-200 text-slate-400"}`}>
                  {i < reached ? "✓" : i + 1}
                </div>
                <div className={`text-[10px] mt-1 text-center ${i <= reached ? "text-slate-800 font-semibold" : "text-slate-400"}`}>
                  {s.replaceAll("_", " ")}
                </div>
              </div>
              {i < FLOW.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${i < reached ? "bg-brand-500" : "bg-slate-200"}`} style={{ minWidth: 12 }} />
              )}
            </div>
          ))}
        </div>
        {b.status === "UNDELIVERED" && (
          <div className="mt-2 text-sm text-red-600">⚠ Delivery attempt failed — bilty marked undelivered</div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${tab === id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview b={b} />}
      {tab === "booking" && <BookingTab b={b} />}
      {tab === "dispatch" && <DispatchTab dispatch={data.dispatch} />}
      {tab === "tracking" && <TrackingTab history={data.statusHistory} />}
      {tab === "ledger" && <LedgerTab b={b} />}
      {tab === "payments" && <PaymentsTab b={b} />}
      {tab === "audit" && <AuditTab rows={data.audit} />}
    </div>
  );
}

function Overview({ b }: { b: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card-p">
        <h3 className="font-semibold mb-3">Parties</h3>
        <KV k="Customer" v={`${b.customer_name} (${b.customer_code})`} />
        <KV k="Vendor" v={`${b.vendor_name} (${b.vendor_code})`} />
        <KV k="Sender" v={`${b.sender_name}${b.sender_mobile ? " · " + b.sender_mobile : ""}`} />
        <KV k="Receiver" v={`${b.receiver_name}${b.receiver_mobile ? " · " + b.receiver_mobile : ""}`} />
        <KV k="Route" v={`${b.from_city} → ${b.to_city}`} />
      </div>
      <div className="card-p">
        <h3 className="font-semibold mb-3">Charges Summary</h3>
        <KV k="Customer amount" v={money(b.customer_amount)} />
        <KV k="Loading/Unloading/Other" v={`${money(b.loading_charge)} / ${money(b.unloading_charge)} / ${money(b.other_charges)}`} />
        <KV k="Discount" v={money(b.discount)} />
        <KV k="Total Customer Charge" v={money(b.total_charges)} bold />
        <KV k="Total Vendor Cost" v={money(b.vendor_cost)} bold />
        <KV k="Commission" v={money(b.commission)} />
        <KV k="Gross Margin" v={money(b.gross_margin)} bold />
        <KV k="Net Amount (profit)" v={money(b.net_amount)} bold />
      </div>
    </div>
  );
}

function BookingTab({ b }: { b: any }) {
  return (
    <div className="card-p grid md:grid-cols-3 gap-x-6">
      <KV k="Bilty No" v={b.bilty_no} />
      <KV k="Booking Date" v={b.booking_date} />
      <KV k="Booking Time" v={b.booking_time} />
      <KV k="Parcel Type" v={b.parcel_type} />
      <KV k="Number of Parcels" v={String(b.parcel_count)} />
      <KV k="Actual Weight" v={`${b.actual_weight} kg`} />
      <KV k="Chargeable Weight" v={`${b.chargeable_weight} kg`} />
      <KV k="Company Rate" v={`${money(b.company_rate)}/kg`} />
      <KV k="Vendor Rate" v={`${money(b.vendor_rate)}/kg`} />
      <KV k="Freight" v={money(b.freight)} />
      <KV k="Payment Mode" v={b.payment_mode || "—"} />
      <KV k="COD Amount" v={money(b.cod_amount)} />
      <KV k="Remarks" v={b.remarks || "—"} />
      <KV k="Booked By" v={b.created_by || "—"} />
    </div>
  );
}

function DispatchTab({ dispatch }: { dispatch: any }) {
  if (!dispatch) return <div className="card-p text-slate-400 text-sm">Not dispatched yet.</div>;
  return (
    <div className="card-p grid md:grid-cols-3 gap-x-6">
      <KV k="Dispatch Date" v={dispatch.dispatch_date} />
      <KV k="Vehicle Number" v={dispatch.vehicle_no} />
      <KV k="Driver" v={dispatch.driver} />
      <KV k="Manifest Number" v={dispatch.manifest_no} />
      <KV k="Route" v={dispatch.route || "—"} />
      <KV k="Dispatch Branch" v={dispatch.dispatch_branch || "—"} />
      <KV k="Remarks" v={dispatch.remarks || "—"} />
      <KV k="Dispatched By" v={dispatch.dispatched_by || "—"} />
    </div>
  );
}

function TrackingTab({ history }: { history: any[] }) {
  return (
    <div className="card-p">
      <div className="space-y-0">
        {history.map((h, i) => (
          <div key={h.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-blue-600 mt-1.5" />
              {i < history.length - 1 && <div className="w-0.5 flex-1 bg-blue-200" />}
            </div>
            <div className="pb-4">
              <div className="font-semibold text-sm">{h.status.replaceAll("_", " ")}</div>
              <div className="text-xs text-slate-500">{new Date(h.at).toLocaleString()} · by {h.by}{h.note ? ` · ${h.note}` : ""}</div>
            </div>
          </div>
        ))}
        {history.length === 0 && <div className="text-slate-400 text-sm">No history</div>}
      </div>
    </div>
  );
}

function LedgerTab({ b }: { b: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card-p">
        <h3 className="font-semibold mb-2">Customer Ledger Entry</h3>
        <table className="w-full text-sm">
          <thead><tr><th className="th">Particulars</th><th className="th">Debit</th></tr></thead>
          <tbody>
            <tr><td className="td">Bilty {b.bilty_no} ({b.from_city}→{b.to_city})</td><td className="td text-red-600">{money(b.total_charges)}</td></tr>
          </tbody>
        </table>
        <Link href="/customers" className="text-blue-600 text-sm mt-2 inline-block">Open customer ledger →</Link>
      </div>
      <div className="card-p">
        <h3 className="font-semibold mb-2">Vendor Ledger Entry</h3>
        <table className="w-full text-sm">
          <thead><tr><th className="th">Particulars</th><th className="th">Credit</th></tr></thead>
          <tbody>
            <tr><td className="td">Bilty {b.bilty_no} vendor cost</td><td className="td text-emerald-600">{money(b.vendor_cost)}</td></tr>
          </tbody>
        </table>
        <Link href="/vendors" className="text-blue-600 text-sm mt-2 inline-block">Open vendor ledger →</Link>
      </div>
    </div>
  );
}

function PaymentsTab({ b }: { b: any }) {
  return (
    <div className="card-p">
      <KV k="Payment Mode" v={b.payment_mode || "—"} />
      <KV k="COD Amount" v={money(b.cod_amount)} />
      <KV k="Total Customer Charge" v={money(b.total_charges)} />
      <p className="text-xs text-slate-400 mt-3">Payment receipts against bilties are not yet modeled; ledger activity is derived from bookings.</p>
    </div>
  );
}

function AuditTab({ rows }: { rows: any[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead><tr><th className="th">When</th><th className="th">User</th><th className="th">Action</th><th className="th">Details</th></tr></thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td className="td text-xs">{new Date(a.at).toLocaleString()}</td>
              <td className="td">{a.username}</td>
              <td className="td font-mono text-xs">{a.action}</td>
              <td className="td text-xs text-slate-600">{a.details || "—"}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="td text-slate-400" colSpan={4}>No audit entries</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function KV({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-1 text-sm border-b border-slate-50 ${bold ? "font-semibold" : ""}`}>
      <span className="text-slate-500">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
