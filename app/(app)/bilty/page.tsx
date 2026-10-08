import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getSessionUser, can } from "@/lib/types";
import { Plus, MagnifyingGlass, CaretRight, Package, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  BOOKED: { bg: "bg-zinc-800/80", text: "text-zinc-300", border: "border-zinc-700/60", dot: "bg-zinc-400" },
  DISPATCHED: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", dot: "bg-sky-400" },
  IN_TRANSIT: { bg: "bg-accent-500/10", text: "text-accent-400", border: "border-accent-500/20", dot: "bg-accent-400" },
  AT_DESTINATION: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", dot: "bg-purple-400" },
  OUT_FOR_DELIVERY: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  DELIVERED: { bg: "bg-[#00ba7c]/10", text: "text-[#00ba7c]", border: "border-[#00ba7c]/20", dot: "bg-[#00ba7c]" },
  UNDELIVERED: { bg: "bg-[#f4212e]/10", text: "text-[#f4212e]", border: "border-[#f4212e]/20", dot: "bg-[#f4212e]" },
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
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#71767b]">Consignments</span>
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-[#e7e9ea] sm:text-2xl">Bilties & Bookings</h1>
          <p className="mt-0.5 text-xs text-[#71767b]">
            {rows.length} {rows.length === 1 ? "consignment" : "consignments"}
            {sp.status ? ` · ${sp.status.replaceAll("_", " ")}` : ""}
          </p>
        </div>
        {can(user.role, "add") && (
          <Link href="/bilty/new" className="btn-primary shrink-0 text-sm">
            <Plus size={16} weight="bold" />
            New Bilty
          </Link>
        )}
      </div>

      {/* Search + filters (X & Armandev style) */}
      <div className="card animate-fade-up space-y-3 p-3.5" style={{ animationDelay: "40ms" }}>
        <form className="flex flex-col gap-2 sm:flex-row" action="/bilty">
          <div className="relative flex-1">
            <MagnifyingGlass size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#71767b]" />
            <input
              name="q"
              defaultValue={sp.q}
              className="input pl-10 text-sm"
              placeholder="Search bilty no / customer / receiver / phone..."
            />
          </div>
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <select
            name="status"
            defaultValue={sp.status || ""}
            className="input sm:w-44 text-sm"
          >
            <option value="" className="bg-[#111111] text-[#e7e9ea]">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-[#111111] text-[#e7e9ea]">{s.replaceAll("_", " ")}</option>
            ))}
          </select>
          <button className="btn-primary shrink-0 text-sm">Filter</button>
        </form>
        <div className="no-scrollbar -mx-3.5 flex gap-1.5 overflow-x-auto px-3.5 pt-1">
          <Link
            href="/bilty"
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              !sp.status
                ? "bg-accent-500 text-white shadow-[0_0_12px_rgba(29,155,240,0.4)]"
                : "border border-white/[0.08] bg-white/[0.03] text-[#71767b] hover:bg-white/[0.07] hover:text-[#e7e9ea]"
            }`}
          >
            All Bilties
          </Link>
          {STATUSES.map((s) => {
            const tone = STATUS_TONE[s];
            const active = sp.status === s;
            return (
              <Link
                key={s}
                href={`/bilty?status=${s}`}
                className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-accent-500 text-white shadow-[0_0_12px_rgba(29,155,240,0.4)]"
                    : "border border-white/[0.08] bg-white/[0.03] text-[#71767b] hover:bg-white/[0.07] hover:text-[#e7e9ea]"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                {s.replaceAll("_", " ")}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop table (X dark theme) */}
      <div className="card animate-fade-up overflow-x-auto hidden sm:block" style={{ animationDelay: "80ms" }}>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="th">Bilty No</th>
              <th className="th">Date</th>
              <th className="th">Customer</th>
              <th className="th">From → To</th>
              <th className="th">Receiver</th>
              <th className="th text-right">Parcels</th>
              <th className="th text-right">Amount</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((b) => {
              const tone = STATUS_TONE[b.status] || STATUS_TONE.BOOKED;
              return (
                <tr key={b.id} className="transition-colors hover:bg-white/[0.03] group">
                  <td className="td">
                    <Link
                      className="font-mono text-xs font-bold text-accent-400 hover:text-accent-300 flex items-center gap-1 group-hover:underline"
                      href={`/bilty/${b.bilty_no}`}
                    >
                      {b.bilty_no}
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                  <td className="td whitespace-nowrap font-mono text-xs text-[#71767b]">{b.booking_date}</td>
                  <td className="td font-medium text-[#e7e9ea]">{b.customer_name}</td>
                  <td className="td">
                    <span className="text-xs text-[#71767b]">
                      <span className="text-[#e7e9ea]">{b.from_city}</span> <span className="text-[#525252]">→</span> <span className="text-[#e7e9ea]">{b.to_city}</span>
                    </span>
                  </td>
                  <td className="td text-[#e7e9ea] text-xs">{b.receiver_name}</td>
                  <td className="td text-right font-mono text-xs text-[#71767b]">{b.parcel_count}</td>
                  <td className="td text-right font-mono text-xs font-bold text-[#e7e9ea]">₹{b.total_charges}</td>
                  <td className="td">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${tone.bg} ${tone.text} ${tone.border}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                      {b.status.replaceAll("_", " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="td py-12 text-center text-sm font-medium text-[#71767b]" colSpan={8}>
                  No bilties found matching the criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list (X Feed style) */}
      <div className="space-y-2.5 sm:hidden">
        {rows.length === 0 && (
          <div className="card p-8 text-center text-sm font-medium text-[#71767b]">
            No bilties found
          </div>
        )}
        {rows.map((b, i) => {
          const tone = STATUS_TONE[b.status] || STATUS_TONE.BOOKED;
          return (
            <Link
              key={b.id}
              href={`/bilty/${b.bilty_no}`}
              className="card animate-fade-up block p-4 transition-all active:scale-[0.98] hover:border-white/[0.12]"
              style={{ animationDelay: `${Math.min(i * 30, 200)}ms` }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-accent-400">{b.bilty_no}</span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tone.bg} ${tone.text} ${tone.border}`}>
                  <span className={`h-1 w-1 rounded-full ${tone.dot}`} />
                  {b.status.replaceAll("_", " ")}
                </span>
              </div>
              <div className="text-sm font-bold text-[#e7e9ea]">{b.receiver_name}</div>
              <div className="mt-0.5 text-xs text-[#71767b]">
                {b.customer_name} · <span className="text-[#a3a3a3]">{b.from_city} → {b.to_city}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-xs">
                <span className="font-mono text-[#71767b]">{b.booking_date}</span>
                <span className="flex items-center gap-1.5 font-bold text-[#e7e9ea]">
                  ₹{b.total_charges} · {b.parcel_count} pcs
                  <CaretRight size={14} className="text-[#71767b]" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
