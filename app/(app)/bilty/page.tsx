import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getSessionUser, can } from "@/lib/types";
import { IconChevronRight, IconPlus, IconSearch } from "@/components/icons";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  BOOKED: "bg-slate-100 text-slate-600",
  DISPATCHED: "bg-sky-50 text-sky-700",
  IN_TRANSIT: "bg-brand-50 text-brand-700",
  AT_DESTINATION: "bg-violet-50 text-violet-700",
  OUT_FOR_DELIVERY: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  UNDELIVERED: "bg-rose-50 text-rose-700",
};

const STATUSES = ["BOOKED", "DISPATCHED", "IN_TRANSIT", "AT_DESTINATION", "OUT_FOR_DELIVERY", "DELIVERED", "UNDELIVERED"];

export default async function BiltyListPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const user = getSessionUser(await cookies())!;
  const wh: string[] = [], args: any[] = [];
  if (sp.status) { wh.push("b.status = ?"); args.push(sp.status); }
  if (sp.q) { wh.push("(b.bilty_no LIKE ? OR c.name LIKE ? OR b.receiver_name LIKE ? OR b.receiver_mobile LIKE ?)"); args.push(`%${sp.q}%`, `%${sp.q}%`, `%${sp.q}%`, `%${sp.q}%`); }
  let sql = `SELECT b.*, c.name customer_name, v.name vendor_name FROM bilty b
    JOIN customers c ON c.id=b.customer_id JOIN vendors v ON v.id=b.vendor_id`;
  if (wh.length) sql += " WHERE " + wh.join(" AND ");
  sql += " ORDER BY b.id DESC LIMIT 200";
  const rows = db.prepare(sql).all(...args) as any[];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="animate-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Bilties</h1>
          <p className="mt-0.5 text-sm font-medium text-slate-400">
            {rows.length} {rows.length === 1 ? "consignment" : "consignments"}
            {sp.status ? ` · ${sp.status.replaceAll("_", " ")}` : ""}
          </p>
        </div>
        {can(user.role, "add") && (
          <Link href="/bilty/new" className="btn-primary shrink-0">
            <IconPlus width={16} height={16} strokeWidth={2.4} />
            New Bilty
          </Link>
        )}
      </div>

      {/* Search + filters */}
      <div className="card animate-fade-up space-y-3 p-3.5" style={{ animationDelay: "40ms" }}>
        <form className="flex flex-col gap-2 sm:flex-row" action="/bilty">
          <div className="relative flex-1">
            <IconSearch width={17} height={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={sp.q} className="input pl-10" placeholder="Search bilty no / customer / receiver" />
          </div>
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <select name="status" defaultValue={sp.status || ""} className="input sm:w-44">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
          </select>
          <button className="btn-primary shrink-0">Search</button>
        </form>
        <div className="no-scrollbar -mx-3.5 flex gap-1.5 overflow-x-auto px-3.5">
          <Link
            href="/bilty"
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
              !sp.status ? "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            All
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/bilty?status=${s}`}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                sp.status === s ? "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {s.replaceAll("_", " ")}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="card animate-fade-up overflow-x-auto hidden sm:block" style={{ animationDelay: "80ms" }}>
        <table className="w-full">
          <thead><tr>
            <th className="th">Bilty No</th><th className="th">Date</th><th className="th">Customer</th><th className="th">From → To</th>
            <th className="th">Receiver</th><th className="th">Parcels</th><th className="th">Amount</th><th className="th">Status</th>
          </tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="transition-colors hover:bg-brand-50/40">
                <td className="td"><Link className="font-mono text-[13px] font-bold text-brand-600 hover:text-brand-700 hover:underline" href={`/bilty/${b.bilty_no}`}>{b.bilty_no}</Link></td>
                <td className="td whitespace-nowrap text-slate-500">{b.booking_date}</td>
                <td className="td font-medium text-slate-800">{b.customer_name}</td>
                <td className="td"><span className="text-slate-600">{b.from_city} <span className="text-slate-300">→</span> {b.to_city}</span></td>
                <td className="td">{b.receiver_name}</td>
                <td className="td">{b.parcel_count}</td>
                <td className="td font-semibold text-slate-800">₹{b.total_charges}</td>
                <td className="td"><span className={`badge ${STATUS_TONE[b.status]}`}>{b.status.replaceAll("_", " ")}</span></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td py-10 text-center font-medium text-slate-400" colSpan={8}>No bilties found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 sm:hidden">
        {rows.length === 0 && <div className="card-p py-10 text-center text-sm font-medium text-slate-400">No bilties found</div>}
        {rows.map((b, i) => (
          <Link
            key={b.id}
            href={`/bilty/${b.bilty_no}`}
            className="card animate-fade-up block p-4 transition active:scale-[0.99]"
            style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="font-mono text-[13px] font-bold text-brand-600">{b.bilty_no}</span>
              <span className={`badge shrink-0 ${STATUS_TONE[b.status]}`}>{b.status.replaceAll("_", " ")}</span>
            </div>
            <div className="text-[15px] font-bold text-slate-800">{b.receiver_name}</div>
            <div className="mt-0.5 text-xs font-medium text-slate-500">{b.customer_name} · {b.from_city} → {b.to_city}</div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
              <span className="font-medium text-slate-400">{b.booking_date}</span>
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                ₹{b.total_charges} · {b.parcel_count} pcs
                <IconChevronRight width={14} height={14} className="text-slate-300" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
