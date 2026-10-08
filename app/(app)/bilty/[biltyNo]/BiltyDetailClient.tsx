"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Printer, Check, ArrowRight, Warning, Package, User, Clock, FileText, CurrencyInr } from "@phosphor-icons/react";

const STATUS_TONE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  BOOKED: { bg: "bg-zinc-800/80", text: "text-zinc-300", border: "border-zinc-700/60", dot: "bg-zinc-400" },
  DISPATCHED: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", dot: "bg-sky-400" },
  IN_TRANSIT: { bg: "bg-accent-500/10", text: "text-accent-400", border: "border-accent-500/20", dot: "bg-accent-400" },
  AT_DESTINATION: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", dot: "bg-purple-400" },
  OUT_FOR_DELIVERY: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  DELIVERED: { bg: "bg-[#00ba7c]/10", text: "text-[#00ba7c]", border: "border-[#00ba7c]/20", dot: "bg-[#00ba7c]" },
  UNDELIVERED: { bg: "bg-[#f4212e]/10", text: "text-[#f4212e]", border: "border-[#f4212e]/20", dot: "bg-[#f4212e]" },
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

  if (err) return <div className="card-p text-[#f4212e] border border-[#f4212e]/20 bg-[#f4212e]/10">{err}</div>;
  if (!data) return <div className="text-[#71767b] py-12 text-center text-sm">Loading consignment details…</div>;

  const b = data.bilty;
  const tone = STATUS_TONE[b.status] || STATUS_TONE.BOOKED;
  const reached = FLOW.indexOf(b.status) === -1 ? 4 : FLOW.indexOf(b.status);
  const tabs = [
    ["overview", "Overview"], ["booking", "Booking"], ["dispatch", "Dispatch"],
    ["tracking", "Tracking"], ["ledger", "Ledgers"], ["payments", "Payments"],
    ["audit", "Audit History"],
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card-p animate-fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[#e7e9ea]">{b.bilty_no}</h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tone.bg} ${tone.text} ${tone.border}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              {b.status.replaceAll("_", " ")}
            </span>
          </div>
          <div className="text-xs text-[#71767b] mt-1.5 flex flex-wrap items-center gap-2">
            <span className="font-mono">{b.booking_date}</span>
            <span>·</span>
            <span className="text-[#e7e9ea] font-medium">{b.customer_name}</span>
            <span>·</span>
            <span className="text-zinc-300">{b.from_city} → {b.to_city}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            className="btn-secondary text-xs gap-1.5"
            href={`/bilty/${b.bilty_no}/print`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Printer size={15} />
            Print Bilty
          </a>
          {canEdit && data.allowedTransitions.map((s: string) => (
            <button key={s} disabled={busy} className="btn-primary text-xs gap-1" onClick={() => transition(s)}>
              <ArrowRight size={14} weight="bold" />
              {s.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stepper */}
      <div className="card-p animate-fade-up" style={{ animationDelay: "40ms" }}>
        <div className="flex items-center overflow-x-auto no-scrollbar py-2">
          {FLOW.map((s, i) => {
            const isCompleted = i < reached;
            const isCurrent = i === reached;
            return (
              <div key={s} className="flex-1 flex items-center min-w-[90px] last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? "bg-accent-500 text-white shadow-[0_0_10px_rgba(29,155,240,0.5)]"
                        : isCurrent
                        ? "bg-[#121214] border-2 border-accent-400 text-accent-400 shadow-[0_0_12px_rgba(29,155,240,0.4)]"
                        : "bg-white/[0.04] border border-white/[0.1] text-[#71767b]"
                    }`}
                  >
                    {isCompleted ? <Check size={14} weight="bold" /> : i + 1}
                  </div>
                  <div
                    className={`text-[10px] mt-1.5 text-center whitespace-nowrap font-medium ${
                      isCurrent ? "text-accent-400 font-bold" : isCompleted ? "text-[#e7e9ea]" : "text-[#71767b]"
                    }`}
                  >
                    {s.replaceAll("_", " ")}
                  </div>
                </div>
                {i < FLOW.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-2 ${
                      i < reached ? "bg-accent-500/80" : "bg-white/[0.08]"
                    }`}
                    style={{ minWidth: 16 }}
                  />
                )}
              </div>
            );
          })}
        </div>
        {b.status === "UNDELIVERED" && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#f4212e]/20 bg-[#f4212e]/10 px-3.5 py-2 text-xs font-semibold text-[#f4212e]">
            <Warning size={16} weight="fill" />
            Delivery attempt failed — consignment marked undelivered
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.08] overflow-x-auto no-scrollbar">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-xs font-semibold -mb-px border-b-2 whitespace-nowrap transition-colors ${
              tab === id
                ? "border-accent-500 text-accent-400"
                : "border-transparent text-[#71767b] hover:text-[#e7e9ea]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
        {tab === "overview" && <Overview b={b} />}
        {tab === "booking" && <BookingTab b={b} />}
        {tab === "dispatch" && <DispatchTab dispatch={data.dispatch} />}
        {tab === "tracking" && <TrackingTab history={data.statusHistory} />}
        {tab === "ledger" && <LedgerTab b={b} />}
        {tab === "payments" && <PaymentsTab b={b} />}
        {tab === "audit" && <AuditTab rows={data.audit} />}
      </div>
    </div>
  );
}

function Overview({ b }: { b: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card-p">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-3">Party Information</h3>
        <KV k="Customer" v={`${b.customer_name} (${b.customer_code})`} />
        <KV k="Vendor / Transporter" v={`${b.vendor_name} (${b.vendor_code})`} />
        <KV k="Sender" v={`${b.sender_name}${b.sender_mobile ? " · " + b.sender_mobile : ""}`} />
        <KV k="Receiver" v={`${b.receiver_name}${b.receiver_mobile ? " · " + b.receiver_mobile : ""}`} />
        <KV k="Transit Corridor" v={`${b.from_city} → ${b.to_city}`} />
      </div>
      <div className="card-p">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-3">Financial Settlement</h3>
        <KV k="Base Customer Freight" v={money(b.customer_amount)} />
        <KV k="Loading / Unloading / Other" v={`${money(b.loading_charge)} / ${money(b.unloading_charge)} / ${money(b.other_charges)}`} />
        <KV k="Discount Deducted" v={money(b.discount)} />
        <KV k="Total Customer Charge" v={money(b.total_charges)} bold highlight="blue" />
        <KV k="Total Vendor Cost" v={money(b.vendor_cost)} bold />
        <KV k="Agency Commission" v={money(b.commission)} />
        <KV k="Gross Margin" v={money(b.gross_margin)} bold />
        <KV k="Net Profit" v={money(b.net_amount)} bold highlight="green" />
      </div>
    </div>
  );
}

function BookingTab({ b }: { b: any }) {
  return (
    <div className="card-p grid md:grid-cols-3 gap-x-6 gap-y-1">
      <KV k="Bilty No" v={b.bilty_no} />
      <KV k="Booking Date" v={b.booking_date} />
      <KV k="Booking Time" v={b.booking_time} />
      <KV k="Parcel Commodity" v={b.parcel_type} />
      <KV k="Number of Parcels" v={String(b.parcel_count)} />
      <KV k="Actual Weight" v={`${b.actual_weight} kg`} />
      <KV k="Chargeable Weight" v={`${b.chargeable_weight} kg`} />
      <KV k="Customer Unit Rate" v={`${money(b.company_rate)}/kg`} />
      <KV k="Vendor Unit Rate" v={`${money(b.vendor_rate)}/kg`} />
      <KV k="Freight Amount" v={money(b.freight)} />
      <KV k="Payment Mode" v={b.payment_mode || "—"} />
      <KV k="COD Amount" v={money(b.cod_amount)} />
      <KV k="Internal Remarks" v={b.remarks || "—"} />
      <KV k="Booked By" v={b.created_by || "—"} />
    </div>
  );
}

function DispatchTab({ dispatch }: { dispatch: any }) {
  if (!dispatch) return <div className="card-p text-[#71767b] text-xs py-8 text-center">Consignment has not been dispatched yet.</div>;
  return (
    <div className="card-p grid md:grid-cols-3 gap-x-6 gap-y-1">
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
      <h3 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-4">Milestone Log</h3>
      <div className="relative pl-1">
        {history.map((h, i) => {
          const isLatest = i === history.length - 1;
          const tone = STATUS_TONE[h.status] || STATUS_TONE.BOOKED;
          return (
            <div key={h.id} className="relative flex gap-4 pb-6 last:pb-1">
              {i < history.length - 1 && (
                <div className="absolute top-4 left-[9px] h-full w-[2px] bg-white/[0.08]" />
              )}
              <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                {isLatest ? (
                  <span className="relative flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-accent-500 shadow-[0_0_10px_#1d9bf0]" />
                  </span>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isLatest ? "text-[#e7e9ea]" : "text-[#71767b]"}`}>
                    {h.status.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-[#71767b]">
                  {new Date(h.at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}
                  {" · "}
                  <span className="text-[#a3a3a3]">by {h.by}</span>
                  {h.note ? <span className="text-zinc-400"> — {h.note}</span> : ""}
                </div>
              </div>
            </div>
          );
        })}
        {history.length === 0 && <div className="text-[#71767b] text-xs py-4">No tracking history recorded</div>}
      </div>
    </div>
  );
}

function LedgerTab({ b }: { b: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card-p">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-3">Customer Ledger Entry</h3>
        <table className="w-full text-xs text-left">
          <thead>
            <tr>
              <th className="th">Particulars</th>
              <th className="th text-right">Debit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            <tr>
              <td className="td">Bilty {b.bilty_no} ({b.from_city} → {b.to_city})</td>
              <td className="td text-right font-mono font-bold text-[#f4212e]">{money(b.total_charges)}</td>
            </tr>
          </tbody>
        </table>
        <Link href="/customers" className="text-accent-400 hover:text-accent-300 text-xs mt-3 inline-flex items-center gap-1 font-semibold">
          Open customer ledger <ArrowRight size={12} />
        </Link>
      </div>
      <div className="card-p">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-3">Vendor Ledger Entry</h3>
        <table className="w-full text-xs text-left">
          <thead>
            <tr>
              <th className="th">Particulars</th>
              <th className="th text-right">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            <tr>
              <td className="td">Bilty {b.bilty_no} vendor cost</td>
              <td className="td text-right font-mono font-bold text-[#00ba7c]">{money(b.vendor_cost)}</td>
            </tr>
          </tbody>
        </table>
        <Link href="/vendors" className="text-accent-400 hover:text-accent-300 text-xs mt-3 inline-flex items-center gap-1 font-semibold">
          Open vendor ledger <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function PaymentsTab({ b }: { b: any }) {
  return (
    <div className="card-p">
      <h3 className="font-bold text-xs uppercase tracking-wider text-[#71767b] mb-3">Settlement Status</h3>
      <KV k="Payment Mode" v={b.payment_mode || "—"} />
      <KV k="COD Amount" v={money(b.cod_amount)} />
      <KV k="Total Customer Charge" v={money(b.total_charges)} bold />
      <p className="text-[11px] text-[#71767b] mt-3">Payment receipts against bilties are balanced directly from the customer accounts ledger.</p>
    </div>
  );
}

function AuditTab({ rows }: { rows: any[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="th">Timestamp</th>
            <th className="th">User</th>
            <th className="th">Action</th>
            <th className="th">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-white/[0.02]">
              <td className="td font-mono text-xs text-[#71767b]">{new Date(a.at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}</td>
              <td className="td text-xs font-semibold text-[#e7e9ea]">{a.username}</td>
              <td className="td font-mono text-xs text-accent-400">{a.action}</td>
              <td className="td text-xs text-[#71767b] font-mono">{a.details || "—"}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td className="td text-[#71767b] text-center py-6" colSpan={4}>No audit entries recorded</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function KV({ k, v, bold, highlight }: { k: string; v: string; bold?: boolean; highlight?: "blue" | "green" }) {
  return (
    <div className={`flex justify-between py-1.5 text-xs border-b border-white/[0.05] ${bold ? "font-semibold" : ""}`}>
      <span className="text-[#71767b]">{k}</span>
      <span className={`text-right font-mono ${
        highlight === "blue" ? "text-accent-400 font-bold" :
        highlight === "green" ? "text-[#00ba7c] font-bold" :
        "text-[#e7e9ea]"
      }`}>
        {v}
      </span>
    </div>
  );
}
