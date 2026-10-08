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
  blue:    "bg-accent-500/15 text-accent-400",
  green:   "bg-[#00ba7c]/15 text-[#00ba7c]",
  amber:   "bg-[#ffd400]/10 text-[#ffd400]",
  red:     "bg-[#f4212e]/15 text-[#f4212e]",
  violet:  "bg-violet-500/15 text-violet-400",
  sky:     "bg-sky-500/15 text-sky-400",
  slate:   "bg-white/[0.06] text-[#71767b]",
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

    const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const kpis = [
      { label: "Today's Bookings", value: String(todayBilties), sub: `${todayParcels} parcels`, Icon: Package, tint: "blue" },
      { label: "Today's Revenue", value: fmt(todayRevenue), sub: `Commission ${fmt(todayCommission)}`, Icon: CurrencyInr, tint: "green" },
      { label: "Today's Profit", value: fmt(todayProfit), sub: `Cost ${fmt(todayCost)}`, Icon: TrendUp, tint: todayProfit >= 0 ? "green" : "red" },
      { label: "In Transit", value: String(inTransit), sub: `${outForDelivery} out for delivery`, Icon: Truck, tint: "amber" },
    ];

    const stats = [
      { label: "Parcels Today", value: String(todayParcels), Icon: Package, tint: "sky" },
      { label: "Dispatched", value: String(todayDispatched), Icon: PaperPlaneTilt, tint: "blue" },
      { label: "Delivered", value: String(delivered), Icon: CheckCircle, tint: "green" },
      { label: "Pending", value: String(pendingDelivery), Icon: Clock, tint: "amber" },
      { label: "Undelivered", value: String(undelivered), Icon: Warning, tint: "red" },
      { label: "COD Today", value: fmt(codToday), Icon: Wallet, tint: "green" },
      { label: "Receivable", value: fmt(receivable), Icon: CurrencyInr, tint: "red" },
      { label: "Vendor Payable", value: fmt(vendorPayable), Icon: Truck, tint: "slate" },
    ];

    return (
      <div className="space-y-5 md:space-y-6">
        {/* ── Header ── */}
        <div className="animate-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#e7e9ea] sm:text-[26px]">
              {greeting}, <span className="text-accent-400">{user.name.split(" ")[0]}</span>
            </h1>
            <p className="mt-0.5 text-sm text-[#71767b]">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {can(user.role, "add") && (
            <Link href="/bilty/new" className="btn-primary shrink-0 text-sm">
              <Plus size={16} weight="bold" />
              New Bilty
            </Link>
          )}
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
          {kpis.map((k, i) => (
            <div
              key={k.label}
              className="card animate-fade-up p-4 md:p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TINT[k.tint]}`}>
                  <k.Icon size={18} weight="fill" />
                </span>
                <span className="text-[10px] leading-tight font-bold tracking-wider text-[#525252] uppercase">{k.label}</span>
              </div>
              <div className="text-2xl font-bold tracking-tight text-[#e7e9ea] md:text-[26px]">{k.value}</div>
              <div className="mt-0.5 text-xs text-[#71767b]">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Secondary Stats ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="card animate-fade-up p-3.5"
              style={{ animationDelay: `${(i + 4) * 40}ms` }}
            >
              <span className={`mb-2 grid h-7 w-7 place-items-center rounded-lg ${TINT[s.tint]}`}>
                <s.Icon size={14} weight="fill" />
              </span>
              <div className="text-[15px] font-bold tracking-tight text-[#e7e9ea]">{s.value}</div>
              <div className="mt-0.5 text-[10px] font-semibold text-[#525252] leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Trends + Alerts ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Revenue vs Cost chart */}
          <div className="card animate-fade-up p-5 lg:col-span-2" style={{ animationDelay: "80ms" }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-bold tracking-tight text-[#e7e9ea]">Revenue vs Cost</h2>
                <p className="text-xs text-[#71767b]">Last 7 days</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-[#525252]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent-500" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#f4212e]/70" />
                  Cost
                </span>
              </div>
            </div>
            <TrendChart rows={trendRows} />
          </div>

          {/* Alerts panel */}
          <div className="card animate-fade-up flex flex-col p-5" style={{ animationDelay: "140ms" }}>
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#ffd400]/10 text-[#ffd400]">
                <Warning size={16} weight="fill" />
              </span>
              <h2 className="text-[14px] font-bold tracking-tight text-[#e7e9ea]">Alerts</h2>
            </div>
            {alerts.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#00ba7c]/10 text-[#00ba7c]">
                  <Sparkle size={22} weight="fill" />
                </span>
                <div className="text-sm font-semibold text-[#e7e9ea]">All clear</div>
                <div className="text-xs text-[#71767b]">Operations running smoothly</div>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <Link
                    key={i}
                    href={a.href}
                    className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[12px] font-medium transition ${
                      a.tone === "red"
                        ? "border-[#f4212e]/20 bg-[#f4212e]/8 text-[#f4212e] hover:bg-[#f4212e]/12"
                        : "border-[#ffd400]/20 bg-[#ffd400]/8 text-[#ffd400] hover:bg-[#ffd400]/12"
                    }`}
                  >
                    <Warning size={14} weight="fill" className="shrink-0 opacity-80" />
                    <span className="flex-1 leading-snug">{a.text}</span>
                    <ArrowRight size={13} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-xs">
              <span className="font-medium text-[#71767b]">Today's commission</span>
              <b className="font-bold text-accent-400">{fmt(todayCommission)}</b>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="card-p border border-[#f4212e]/20 bg-[#f4212e]/8 text-[#f4212e]">
        <h2 className="mb-2 text-lg font-bold">Dashboard Error</h2>
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
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-[#525252]">
          <Crosshair size={22} />
        </span>
        <div className="text-sm font-semibold text-[#71767b]">No bookings in the last 7 days</div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {rows.map((r: any) => (
        <div key={r.d} className="flex items-center gap-3">
          <span className="w-11 shrink-0 font-mono text-[10px] font-bold text-[#525252]">{r.d.slice(5)}</span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-accent-500 transition-all"
                style={{ width: `${(r.revenue / max) * 100}%` }}
                title={`Revenue ₹${r.revenue}`}
              />
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[#f4212e]/60 transition-all"
                style={{ width: `${(r.cost / max) * 100}%` }}
                title={`Cost ₹${r.cost}`}
              />
            </div>
          </div>
          <div className="w-14 shrink-0 text-right">
            <span className={`text-xs font-bold ${(r.revenue - r.cost) >= 0 ? "text-[#00ba7c]" : "text-[#f4212e]"}`}>
              ₹{Math.round(r.revenue - r.cost)}
            </span>
            <span className="block text-[9px] font-medium text-[#525252]">{r.bilties} bilty</span>
          </div>
        </div>
      ))}
    </div>
  );
}
