import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser, can } from "@/lib/types";
import { cookies } from "next/headers";
import { statusLabel } from "@/lib/bilty";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
  const trendRows = db.prepare(`
    SELECT booking_date d,
      COUNT(*) bilties,
      COALESCE(SUM(total_charges),0) revenue,
      COALESCE(SUM(vendor_cost),0) cost
    FROM bilty
    WHERE booking_date >= date('now','-6 days')
    GROUP BY booking_date ORDER BY booking_date`).all() as any[];
  const deliveredTrend = db.prepare(`
    SELECT booking_date d, COUNT(*) c FROM bilty
    WHERE status='DELIVERED' AND booking_date >= date('now','-6 days')
    GROUP BY booking_date`).all() as any[];

  // Alerts
  const alerts: { text: string; href: string; tone: string }[] = [];
  if (pendingDelivery > 0) alerts.push({ text: `${pendingDelivery} bilty(ies) pending delivery`, href: "/bilty?status=BOOKED", tone: "amber" });
  if (undelivered > 0) alerts.push({ text: `${undelivered} undelivered (failed attempt) bilties`, href: "/bilty?status=UNDELIVERED", tone: "red" });
  const creditExceeded = db.prepare(`
    SELECT c.name, SUM(b.total_charges) due FROM bilty b JOIN customers c ON c.id=b.customer_id
    WHERE b.status != 'DELIVERED' GROUP BY c.id HAVING due > c.credit_limit LIMIT 3`).all() as any[];
  for (const c of creditExceeded) alerts.push({ text: `Credit limit exceeded: ${c.name} (₹${c.due})`, href: "/customers", tone: "red" });
  const noRate = db.prepare(`
    SELECT v.name FROM vendors v WHERE v.status='ACTIVE' AND NOT EXISTS (
      SELECT 1 FROM rate_configs r WHERE r.vendor_id=v.id AND r.active=1) LIMIT 3`).all() as any[];
  for (const v of noRate) alerts.push({ text: `Vendor without active rates: ${v.name}`, href: "/rates", tone: "amber" });

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">{new Date().toDateString()} · {user.name}</p>
        </div>
        <div className="flex gap-2">
          {can(user.role, "add") && <Link href="/bilty/new" className="btn-primary">+ New Bilty</Link>}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {[
          ["/bilty/new", "New Bilty", "add"], ["/customers", "Customer", null], ["/vendors", "Vendor", null],
          ["/dispatch", "Dispatch", "dispatch"], ["/track", "Delivery", "track"],
        ].map(([href, label, action]) =>
          action && !can(user.role, action as any) ? null : (
            <Link key={href as string} href={href as string} className="btn-secondary">{label as string}</Link>
          )
        )}
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {[
          ["Today's Bookings", todayBilties, "blue"],
          ["Today's Parcels", todayParcels, "blue"],
          ["Today's Dispatch", todayDispatched, "indigo"],
          ["In Transit", inTransit, "indigo"],
          ["Out for Delivery", outForDelivery, "amber"],
          ["Delivered (today)", delivered, "emerald"],
          ["Pending Delivery", pendingDelivery, "amber"],
          ["Undelivered", undelivered, "red"],
          ["COD Collection (today)", fmt(codToday), "emerald"],
          ["Customer Receivable", fmt(receivable), "red"],
          ["Vendor Payable", fmt(vendorPayable), "red"],
          ["Today's Profit", fmt(todayProfit), todayProfit >= 0 ? "emerald" : "red"],
        ].map(([label, value, tone]) => (
          <div key={label as string} className="card-p !p-4">
            <div className="text-xs text-slate-500 font-medium">{label as string}</div>
            <div className={`text-xl font-bold mt-1 text-${tone}-600`}>{value as any}</div>
          </div>
        ))}
      </div>

      {/* Trends + alerts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card-p lg:col-span-2">
          <h2 className="font-semibold mb-3">Last 7 days — bookings, revenue vs cost</h2>
          <TrendChart rows={trendRows} />
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
            {trendRows.length === 0 && <div className="col-span-7 text-slate-400 py-4">No bookings in the last 7 days</div>}
            {trendRows.map((r: any) => (
              <div key={r.d}>
                <div className="font-semibold text-slate-700">{r.bilties}</div>
                <div>{r.d.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-p">
          <h2 className="font-semibold mb-3">Alerts</h2>
          {alerts.length === 0 && <div className="text-sm text-slate-400">No alerts 🎉</div>}
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <Link key={i} href={a.href}
                className={`block rounded-lg px-3 py-2 text-sm border ${
                  a.tone === "red" ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-800"
                } hover:opacity-80`}>
                ⚠ {a.text}
              </Link>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Today commission: <b>{fmt(todayCommission)}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendChart({ rows }: { rows: any[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.revenue, r.cost)));
  return (
    <div className="space-y-1.5">
      {rows.map((r: any) => (
        <div key={r.d} className="flex items-center gap-2 text-xs">
          <span className="w-12 text-slate-500">{r.d.slice(5)}</span>
          <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden flex">
            <div className="bg-blue-500 h-full" style={{ width: `${(r.revenue / max) * 100}%` }} title={`Revenue ₹${r.revenue}`} />
            <div className="bg-red-400 h-full" style={{ width: `${(r.cost / max) * 100}%` }} title={`Cost ₹${r.cost}`} />
          </div>
          <span className="w-16 text-right text-slate-600">₹{Math.round(r.revenue - r.cost)}</span>
        </div>
      ))}
    </div>
  );
}
