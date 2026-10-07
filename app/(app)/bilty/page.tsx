import Link from "next/link";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  BOOKED: "bg-slate-100 text-slate-700",
  DISPATCHED: "bg-blue-100 text-blue-700",
  IN_TRANSIT: "bg-indigo-100 text-indigo-700",
  AT_DESTINATION: "bg-purple-100 text-purple-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-800",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  UNDELIVERED: "bg-red-100 text-red-700",
};

export default async function BiltyListPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bilties</h1>
        <form className="flex gap-2" action="/bilty">
          <input name="q" defaultValue={sp.q} className="input w-64" placeholder="Search bilty no / customer / receiver" />
          <select name="status" defaultValue={sp.status || ""} className="input w-40">
            <option value="">All statuses</option>
            {["BOOKED", "DISPATCHED", "IN_TRANSIT", "AT_DESTINATION", "OUT_FOR_DELIVERY", "DELIVERED", "UNDELIVERED"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn-secondary">Search</button>
        </form>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="th">Bilty No</th><th className="th">Date</th><th className="th">Customer</th><th className="th">From → To</th>
            <th className="th">Receiver</th><th className="th">Parcels</th><th className="th">Amount</th><th className="th">Status</th>
          </tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="td"><Link className="font-mono text-blue-600 hover:underline" href={`/bilty/${b.bilty_no}`}>{b.bilty_no}</Link></td>
                <td className="td">{b.booking_date}</td>
                <td className="td">{b.customer_name}</td>
                <td className="td">{b.from_city} → {b.to_city}</td>
                <td className="td">{b.receiver_name}</td>
                <td className="td">{b.parcel_count}</td>
                <td className="td">₹{b.total_charges}</td>
                <td className="td"><span className={`badge ${STATUS_TONE[b.status]}`}>{b.status.replaceAll("_", " ")}</span></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-slate-400" colSpan={8}>No bilties found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
