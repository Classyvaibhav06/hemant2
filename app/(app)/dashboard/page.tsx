import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser, can } from "@/lib/types";
import { cookies } from "next/headers";
import {
  IconAlert,
  IconArrowRight,
  IconBox,
  IconCheckCircle,
  IconClock,
  IconPlus,
  IconRadar,
  IconRupee,
  IconSend,
  IconSparkles,
  IconTrend,
  IconTruck,
  IconWallet,
} from "@/components/icons";

export const dynamic = "force-dynamic";

const TINT: Record<string, string> = {
  brand: "bg-brand-50 text-brand-600",
  violet: "bg-violet-50 text-violet-600",
  sky: "bg-sky-50 text-sky-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-500",
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

    // 7-day trends
    const past7Days = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const trendRows = db.prepare(`
      SELECT booking_date d,
        COUNT(*) bilties,
        COALESCE(SUM(total_charges),0) revenue,
        COALESCE(SUM(vendor_cost),0) cost
      FROM bilty
      WHERE booking_date >= ?
      GROUP BY booking_date ORDER BY booking_date`).all(past7Days) as any[];

    // Alerts
    const alerts: { text: string; href: string; tone: string }[] = [];
    if (pendingDelivery > 0) alerts.push({ text: `${pendingDelivery} bilty(ies) pending delivery`, href: "/bilty?status=BOOKED", tone: "amber" });
    if (undelivered > 0) alerts.push({ text: `${undelivered} undelivered (failed attempt) bilties`, href: "/bilty?status=UNDELIVERED", tone: "red" });
    const creditExceeded = db.prepare(`
      SELECT c.name, SUM(b.total_charges) as due FROM bilty b JOIN customers c ON c.id=b.customer_id
      WHERE b.status != 'DELIVERED' GROUP BY c.id, c.name, c.credit_limit HAVING SUM(b.total_charges) > c.credit_limit LIMIT 3`).all() as any[];
    for (const c of creditExceeded) alerts.push({ text: `Credit limit exceeded: ${c.name} (₹${c.due})`, href: "/customers", tone: "red" });
    const noRate = db.prepare(`
      SELECT v.name FROM vendors v WHERE v.status='ACTIVE' AND NOT EXISTS (
        SELECT 1 FROM rate_configs r WHERE r.vendor_id=v.id AND r.active=1) LIMIT 3`).all() as any[];
    for (const v of noRate) alerts.push({ text: `Vendor without active rates: ${v.name}`, href: "/rates", tone: "amber" });

    const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    const kpis = [
      { label: "Today's Bookings", value: String(todayBilties), sub: `${todayParcels} parcels booked`, icon: IconBox, tint: "brand" },
      { label: "Today's Revenue", value: fmt(todayRevenue), sub: `Commission ${fmt(todayCommission)}`, icon: IconRupee, tint: "emerald" },
      { label: "Today's Profit", value: fmt(todayProfit), sub: `Cost ${fmt(todayCost)}`, icon: IconTrend, tint: todayProfit >= 0 ? "emerald" : "rose" },
      { label: "In Transit", value: String(inTransit), sub: `${outForDelivery} out for delivery`, icon: IconTruck, tint: "amber" },
    ];

    const stats = [
      { label: "Parcels Today", value: String(todayParcels), icon: IconBox, tint: "sky" },
      { label: "Dispatched Today", value: String(todayDispatched), icon: IconSend, tint: "brand" },
      { label: "Delivered Today", value: String(delivered), icon: IconCheckCircle, tint: "emerald" },
      { label: "Pending Delivery", value: String(pendingDelivery), icon: IconClock, tint: "amber" },
      { label: "Undelivered", value: String(undelivered), icon: IconAlert, tint: "rose" },
      { label: "COD Collection", value: fmt(codToday), icon: IconWallet, tint: "emerald" },
      { label: "Customer Receivable", value: fmt(receivable), icon: IconRupee, tint: "rose" },
      { label: "Vendor Payable", value: fmt(vendorPayable), icon: IconTruck, tint: "slate" },
    ];

    return (
      <div className="space-y-5 md:space-y-6">
        {/* Header */}
        <div className="animate-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-[28px]">
              {greeting}, {user.name.split(" ")[0]} 
            </h1>
            <p className="mt-0.5 text-sm font-medium text-slate-400">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {can(user.role, "add") && (
            <Link href="/bilty/new" className="btn-primary">
              <IconPlus width={16} height={16} strokeWidth={2.4} />
              New Bilty
            </Link>
          )}
        </div>

        {/* KPI hero cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
          {kpis.map((k, i) => (
            <div
              key={k.label}
              className="card-p animate-fade-up flex flex-col gap-3 !p-4 md:!p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-2.5">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${TINT[k.tint]}`}>
                  <k.icon width={18} height={18} />
                </span>
                <span className="text-[11px] leading-tight font-bold tracking-wide text-slate-500 uppercase">{k.label}</span>
              </div>
              <div>
                <div className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-[28px]">{k.value}</div>
                <div className="mt-0.5 text-xs font-medium text-slate-400">{k.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 md:gap-3">
          {stats.map((s, i) => (
            <div key={s.label} className="card animate-fade-up p-3.5" style={{ animationDelay: `${(i + 4) * 40}ms` }}>
              <span className={`mb-2 grid h-7 w-7 place-items-center rounded-lg ${TINT[s.tint]}`}>
                <s.icon width={14} height={14} />
              </span>
              <div className="text-base leading-tight font-extrabold tracking-tight text-slate-900">{s.value}</div>
              <div className="mt-0.5 text-[10.5px] leading-tight font-semibold text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Trends + alerts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card-p animate-fade-up lg:col-span-2" style={{ animationDelay: "80ms" }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold tracking-tight text-slate-800">Revenue vs Cost</h2>
                <p className="text-xs font-medium text-slate-400">Last 7 days</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" /> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-300" /> Cost
                </span>
              </div>
            </div>
            <TrendChart rows={trendRows} />
          </div>

          <div className="card-p animate-fade-up flex flex-col" style={{ animationDelay: "140ms" }}>
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
                <IconAlert width={16} height={16} />
              </span>
              <h2 className="text-[15px] font-bold tracking-tight text-slate-800">Alerts</h2>
            </div>
            {alerts.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <IconSparkles width={22} height={22} />
                </span>
                <div className="text-sm font-semibold text-slate-600">All clear — no alerts</div>
                <div className="text-xs text-slate-400">Operations are running smoothly</div>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <Link
                    key={i}
                    href={a.href}
                    className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition ${
                      a.tone === "red"
                        ? "border-rose-100 bg-rose-50/70 text-rose-700 hover:bg-rose-50"
                        : "border-amber-100 bg-amber-50/70 text-amber-800 hover:bg-amber-50"
                    }`}
                  >
                    <IconAlert width={15} height={15} className="shrink-0 opacity-70" />
                    <span className="flex-1 leading-snug">{a.text}</span>
                    <IconArrowRight width={14} height={14} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs">
              <span className="font-medium text-slate-500">Today's commission</span>
              <b className="font-bold text-slate-800">{fmt(todayCommission)}</b>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="card-p border-rose-200 bg-rose-50 text-rose-700">
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
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <IconRadar width={22} height={22} />
        </span>
        <div className="text-sm font-semibold text-slate-500">No bookings in the last 7 days</div>
      </div>
    );
  }
  return (
    <div className="space-y-3.5">
      {rows.map((r: any) => (
        <div key={r.d} className="flex items-center gap-3">
          <span className="w-11 shrink-0 text-[11px] font-bold text-slate-400">{r.d.slice(5)}</span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all"
                style={{ width: `${(r.revenue / max) * 100}%` }}
                title={`Revenue ₹${r.revenue}`}
              />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-rose-300/80 transition-all"
                style={{ width: `${(r.cost / max) * 100}%` }}
                title={`Cost ₹${r.cost}`}
              />
            </div>
          </div>
          <div className="w-16 shrink-0 text-right">
            <span className={`text-xs font-bold ${(r.revenue - r.cost) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              ₹{Math.round(r.revenue - r.cost)}
            </span>
            <span className="block text-[10px] font-medium text-slate-400">{r.bilties} bilty</span>
          </div>
        </div>
      ))}
    </div>
  );
}
