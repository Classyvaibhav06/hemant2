import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser, can } from "@/lib/types";
import { cookies } from "next/headers";
import {
  Package, CurrencyInr, TrendUp, Truck, PaperPlaneTilt,
  CheckCircle, Clock, Warning, Sparkle, Crosshair, ArrowRight, Plus, Wallet,
} from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

const TINT: Record<string, string> = {
  orange: "bg-[#ff4d00]/[0.12] text-[#ff6a1f]",
  green:  "bg-[#00e08c]/[0.09] text-[#00e08c]",
  yellow: "bg-[#ffd400]/[0.08] text-[#ffd400]",
  red:    "bg-[#ff3355]/[0.09] text-[#ff3355]",
  slate:  "bg-white/[0.06] text-[#8a8a8a]",
};

export default async function DashboardPage() {
  try {
    const user = getSessionUser(await cookies())!;
    const today = new Date().toISOString().slice(0, 10);

    const one = (sql: string, ...args: any[]) => (db.prepare(sql).get(...args) as any)?.v ?? 0;
    const todayBilties = one("SELECT COUNT(*) v FROM bilty WHERE booking_date = ?", today);
    const todayParcels = one("SELECT COALESCE(SUM(parcel_count),0) v FROM bilty WHERE booking_date = ?", today);
    const todayDispatched = one("SELECT COUNT(*) v FROM bilty WHERE status IN ('DISPATCHED','IN_TRANSIT','AT_DESTINATION','OUT_FOR_DELIVERY','DELIVERED') AND booking_date = ?", today);
    const inTransit = one("SELECT COUNT(*) v FROM bilty WHERE status IN ('DISPATCHED','IN_TRANSIT','AT_DESTINATION')");
    const outForDelivery = one("SELECT COUNT(*) v FROM bilty WHERE status = 'OUT_FOR_DELIVERY'");
    const delivered = one("SELECT COUNT(*) v FROM bilty WHERE status = 'DELIVERED' AND booking_date = ?", today);
    const pendingDelivery = one("SELECT COUNT(*) v FROM bilty WHERE status NOT IN ('DELIVERED','UNDELIVERED')");
    const undelivered = one("SELECT COUNT(*) v FROM bilty WHERE status = 'UNDELIVERED'");
    const codToday = one("SELECT COALESCE(SUM(cod_amount),0) v FROM bilty WHERE booking_date = ?", today);
    const receivable = one("SELECT COALESCE(SUM(total_charges),0) v FROM bilty WHERE status != 'DELIVERED' AND payment_mode != 'PAID'");
    const vendorPayable = one("SELECT COALESCE(SUM(vendor_cost),0) v FROM bilty WHERE status != 'DELIVERED'");
    const todayCommission = one("SELECT COALESCE(SUM(commission),0) v FROM bilty WHERE booking_date = ?", today);
    const todayRevenue = one("SELECT COALESCE(SUM(total_charges),0) v FROM bilty WHERE booking_date = ?", today);
    const todayCost = one("SELECT COALESCE(SUM(vendor_cost),0) v FROM bilty WHERE booking_date = ?", today);
    const todayProfit = Math.round((todayRevenue - todayCost) * 100) / 100;

    const past7Days = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const trendRows = db.prepare(`
      SELECT booking_date d,
        COUNT(*) bilties,
        COALESCE(SUM(total_charges),0) revenue,
        COALESCE(SUM(vendor_cost),0) cost
      FROM bilty
      WHERE booking_date >= ?
      GROUP BY booking_date ORDER BY booking_date`).all(past7Days) as any[];

    const alerts: { text: string; href: string; tone: string }[] = [];
    if (pendingDelivery > 0) alerts.push({ text: `${pendingDelivery} bilty(ies) pending delivery`, href: "/bilty?status=BOOKED", tone: "amber" });
    if (undelivered > 0) alerts.push({ text: `${undelivered} undelivered bilties`, href: "/bilty?status=UNDELIVERED", tone: "red" });
    const creditExceeded = db.prepare(`
      SELECT c.name, SUM(b.total_charges) as due FROM bilty b JOIN customers c ON c.id=b.customer_id
      WHERE b.status != 'DELIVERED' GROUP BY c.id, c.name, c.credit_limit HAVING SUM(b.total_charges) > c.credit_limit LIMIT 3`).all() as any[];
    for (const c of creditExceeded) alerts.push({ text: `Credit limit exceeded: ${c.name} (₹${c.due})`, href: "/customers", tone: "red" });
    const noRate = db.prepare(`
      SELECT v.name FROM vendors v WHERE v.status='ACTIVE' AND NOT EXISTS (
        SELECT 1 FROM rate_configs r WHERE r.vendor_id=v.id AND r.active=1) LIMIT 3`).all() as any[];
    for (const v of noRate) alerts.push({ text: `No active rates: ${v.name}`, href: "/rates", tone: "amber" });

    const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "GOOD MORNING" : hour < 17 ? "GOOD AFTERNOON" : "GOOD EVENING";
    const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

    const kpis = [
      { label: "Bookings / Today", value: String(todayBilties), sub: `${todayParcels} parcels booked`, Icon: Package, tint: "orange" },
      { label: "Revenue / Today", value: fmt(todayRevenue), sub: `Commission ${fmt(todayCommission)}`, Icon: CurrencyInr, tint: "green" },
      { label: "Profit / Today", value: fmt(todayProfit), sub: `Cost ${fmt(todayCost)}`, Icon: TrendUp, tint: todayProfit >= 0 ? "green" : "red" },
      { label: "In Transit", value: String(inTransit), sub: `${outForDelivery} out for delivery`, Icon: Truck, tint: "yellow" },
    ];

    const stats = [
      { label: "Parcels Today", value: String(todayParcels), Icon: Package, tint: "slate" },
      { label: "Dispatched", value: String(todayDispatched), Icon: PaperPlaneTilt, tint: "orange" },
      { label: "Delivered", value: String(delivered), Icon: CheckCircle, tint: "green" },
      { label: "Pending", value: String(pendingDelivery), Icon: Clock, tint: "yellow" },
      { label: "Undelivered", value: String(undelivered), Icon: Warning, tint: "red" },
      { label: "COD Today", value: fmt(codToday), Icon: Wallet, tint: "green" },
      { label: "Receivable", value: fmt(receivable), Icon: CurrencyInr, tint: "red" },
      { label: "Vendor Payable", value: fmt(vendorPayable), Icon: Truck, tint: "slate" },
    ];

    const ticker = [
      `BOOKINGS ${todayBilties}`,
      `PARCELS ${todayParcels}`,
      `REVENUE ₹${fmt(todayRevenue)}`,
      `PROFIT ₹${fmt(todayProfit)}`,
      `IN TRANSIT ${inTransit}`,
      `DELIVERED ${delivered}`,
      `RECEIVABLE ₹${fmt(receivable)}`,
      `COMMISSION ₹${fmt(todayCommission)}`,
    ];

    return (
      <div className="space-y-5 md:space-y-6">
        {/* ── Header ── */}
        <div className="animate-fade-up flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2.5 font-mono text-[9px] font-bold tracking-[0.28em] text-[#5a5a5a] uppercase">
              <span className="h-1.5 w-1.5 bg-[#ff4d00]" />
              OPS / OVERVIEW
              <span className="h-px w-8 bg-white/[0.12]" />
              <span className="text-[#3f3f3f]">{dateStr}</span>
            </div>
            <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-[0.95] tracking-wide text-white uppercase">
              {greeting},{" "}
              <span className="text-[#ff4d00]">{user.name.split(" ")[0].toUpperCase()}</span>
            </h1>
          </div>
          {can(user.role, "add") && (
            <Link href="/bilty/new" className="btn-primary shrink-0">
              <Plus size={14} weight="bold" />
              New Bilty
            </Link>
          )}
        </div>

        {/* ── Live ops ticker ── */}
        <div className="animate-fade-up overflow-hidden border-y border-white/[0.08]" style={{ animationDelay: "60ms" }}>
          <div className="marquee-mask flex w-max animate-marquee py-2.5">
            {[...ticker, ...ticker].map((t, i) => (
              <span
                key={i}
                className="flex shrink-0 items-center gap-3 pr-3 font-mono text-[10px] font-bold tracking-[0.22em] text-[#8a8a8a] uppercase"
              >
                <span className="h-1.5 w-1.5 shrink-0 bg-[#ff4d00]" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── KPI cards: hairline grid ── */}
        <div className="grid grid-cols-2 gap-px border border-white/[0.08] bg-white/[0.08] lg:grid-cols-4">
          {kpis.map((k, i) => (
            <div
              key={k.label}
              className="animate-fade-up group relative bg-black p-4 transition-colors hover:bg-[#0d0d0d] md:p-5"
              style={{ animationDelay: `${120 + i * 60}ms` }}
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <span className="font-mono text-[9px] leading-tight font-bold tracking-[0.2em] text-[#5a5a5a] uppercase">
                  {k.label}
                </span>
                <span className={`grid h-7 w-7 shrink-0 place-items-center ${TINT[k.tint]}`}>
                  <k.Icon size={14} weight="fill" />
                </span>
              </div>
              <div className="font-display text-[clamp(1.7rem,3.2vw,2.4rem)] leading-none tracking-wide text-white">
                {k.value}
              </div>
              <div className="mt-2 font-mono text-[9px] tracking-[0.14em] text-[#5a5a5a] uppercase">
                {k.sub}
              </div>
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#ff4d00] transition-all duration-300 group-hover:w-full" />
            </div>
          ))}
        </div>

        {/* ── Secondary stats: hairline grid ── */}
        <div className="animate-fade-up grid grid-cols-2 gap-px border border-white/[0.08] bg-white/[0.08] sm:grid-cols-4 lg:grid-cols-8" style={{ animationDelay: "180ms" }}>
          {stats.map((s) => (
            <div key={s.label} className="bg-black p-3.5 transition-colors hover:bg-[#0d0d0d]">
              <span className={`mb-2.5 grid h-6 w-6 place-items-center ${TINT[s.tint]}`}>
                <s.Icon size={13} weight="fill" />
              </span>
              <div className="font-mono text-[14px] font-bold tracking-tight text-white tabular-nums">
                {s.value}
              </div>
              <div className="mt-0.5 font-mono text-[8px] leading-tight font-bold tracking-[0.16em] text-[#5a5a5a] uppercase">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Trends + Alerts ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Revenue vs Cost chart */}
          <div className="card animate-fade-up p-5 lg:col-span-2" style={{ animationDelay: "240ms" }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="panel-title">Revenue vs Cost</div>
                <p className="mt-1 font-mono text-[9px] tracking-[0.2em] text-[#5a5a5a] uppercase">
                  Last 7 days
                </p>
              </div>
              <div className="flex items-center gap-4 font-mono text-[9px] font-bold tracking-[0.16em] text-[#5a5a5a] uppercase">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-[#ff4d00]" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-white/25" />
                  Cost
                </span>
              </div>
            </div>
            <TrendChart rows={trendRows} />
          </div>

          {/* Alerts panel */}
          <div className="card animate-fade-up flex flex-col p-5" style={{ animationDelay: "300ms" }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="panel-title">Alerts</div>
              <span className="font-mono text-[9px] font-bold tracking-[0.2em] text-[#5a5a5a] uppercase">
                {alerts.length > 0 ? `${String(alerts.length).padStart(2, "0")} ACTIVE` : "CLEAR"}
              </span>
            </div>
            {alerts.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                <span className="grid h-12 w-12 place-items-center border border-[#00e08c]/30 bg-[#00e08c]/[0.07] text-[#00e08c]">
                  <Sparkle size={22} weight="fill" />
                </span>
                <div className="mt-1 font-mono text-[11px] font-bold tracking-[0.16em] text-white uppercase">
                  All clear
                </div>
                <div className="font-mono text-[9px] tracking-[0.14em] text-[#5a5a5a] uppercase">
                  Operations running smooth
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <Link
                    key={i}
                    href={a.href}
                    className={`group flex items-stretch border transition-colors ${
                      a.tone === "red"
                        ? "border-[#ff3355]/25 bg-[#ff3355]/[0.06] hover:bg-[#ff3355]/[0.12]"
                        : "border-[#ffd400]/25 bg-[#ffd400]/[0.05] hover:bg-[#ffd400]/[0.1]"
                    }`}
                  >
                    <span className={`w-[3px] shrink-0 ${a.tone === "red" ? "bg-[#ff3355]" : "bg-[#ffd400]"}`} />
                    <span className="flex flex-1 items-center gap-2.5 px-3 py-2.5 font-mono text-[11px] leading-snug font-medium tracking-wide text-[#d9d9d9]">
                      <Warning size={13} weight="fill" className={`shrink-0 ${a.tone === "red" ? "text-[#ff3355]" : "text-[#ffd400]"}`} />
                      <span className="flex-1">{a.text}</span>
                      <ArrowRight size={12} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5">
              <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-[#5a5a5a] uppercase">
                Today's commission
              </span>
              <b className="font-mono text-[13px] font-bold text-[#ff4d00] tabular-nums">₹{fmt(todayCommission)}</b>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="border border-[#ff3355]/30 bg-[#ff3355]/[0.06] p-5 text-[#ff3355]">
        <h2 className="mb-2 font-display text-xl tracking-wide uppercase">Dashboard Error</h2>
        <p className="font-mono text-sm whitespace-pre-wrap">{err?.message || String(err)}</p>
        <pre className="mt-4 overflow-auto text-xs opacity-70">{err?.stack}</pre>
      </div>
    );
  }
}

function TrendChart({ rows }: { rows: any[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.revenue, r.cost)));
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center border border-white/[0.1] text-[#4a4a4a]">
          <Crosshair size={22} />
        </span>
        <div className="mt-1 font-mono text-[11px] font-bold tracking-[0.16em] text-[#5a5a5a] uppercase">
          No bookings in the last 7 days
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {rows.map((r: any) => (
        <div key={r.d} className="group flex items-center gap-3">
          <span className="w-11 shrink-0 font-mono text-[10px] font-bold tracking-wider text-[#5a5a5a]">
            {r.d.slice(5)}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-1.5 w-full bg-white/[0.06]">
              <div
                className="h-full bg-[#ff4d00] transition-all duration-500 group-hover:bg-[#ff6a1f]"
                style={{ width: `${(r.revenue / max) * 100}%` }}
                title={`Revenue ₹${r.revenue}`}
              />
            </div>
            <div className="h-1.5 w-full bg-white/[0.06]">
              <div
                className="h-full bg-white/25 transition-all duration-500"
                style={{ width: `${(r.cost / max) * 100}%` }}
                title={`Cost ₹${r.cost}`}
              />
            </div>
          </div>
          <div className="w-14 shrink-0 text-right">
            <span
              className={`font-mono text-xs font-bold tabular-nums ${
                r.revenue - r.cost >= 0 ? "text-[#00e08c]" : "text-[#ff3355]"
              }`}
            >
              ₹{Math.round(r.revenue - r.cost)}
            </span>
            <span className="block font-mono text-[8px] font-bold tracking-[0.14em] text-[#4a4a4a] uppercase">
              {r.bilties} bilty
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
