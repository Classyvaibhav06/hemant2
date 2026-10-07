import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PrintBilty({ params }: { params: Promise<{ biltyNo: string }> }) {
  const user = getSessionUser(await cookies());
  if (!user) redirect("/login");
  const { biltyNo } = await params;
  const b = db.prepare(`
    SELECT b.*, c.name customer_name, c.mobile customer_mobile, v.name vendor_name
    FROM bilty b JOIN customers c ON c.id=b.customer_id JOIN vendors v ON v.id=b.vendor_id
    WHERE b.bilty_no = ?`).get(biltyNo) as any;
  if (!b) return <div className="p-8 text-red-600">Bilty not found</div>;

  const money = (n: any) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="bg-white text-slate-900 p-8 max-w-3xl mx-auto print:shadow-none shadow-lg my-6 rounded-lg">
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
        <div>
          <div className="text-2xl font-black">FreightDesk Transport</div>
          <div className="text-xs text-slate-500">Consignment Note / Bilty</div>
        </div>
        <div className="text-right text-sm">
          <div className="font-mono font-bold text-lg">{b.bilty_no}</div>
          <div>{b.booking_date} {b.booking_time}</div>
          <div className="font-semibold">{b.status.replaceAll("_", " ")}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-4 text-sm">
        <div>
          <div className="font-semibold text-slate-500 text-xs uppercase mb-1">Sender</div>
          <div className="font-semibold">{b.sender_name}</div>
          <div>{b.sender_address || ""}</div>
          <div>{b.sender_mobile || ""}</div>
        </div>
        <div>
          <div className="font-semibold text-slate-500 text-xs uppercase mb-1">Receiver</div>
          <div className="font-semibold">{b.receiver_name}</div>
          <div>{b.receiver_address || ""}</div>
          <div>{b.receiver_mobile || ""}</div>
        </div>
      </div>

      <table className="w-full mt-5 text-sm border border-slate-300">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 px-2 py-1 text-left">From</th>
            <th className="border border-slate-300 px-2 py-1 text-left">To</th>
            <th className="border border-slate-300 px-2 py-1 text-left">Type</th>
            <th className="border border-slate-300 px-2 py-1 text-right">Parcels</th>
            <th className="border border-slate-300 px-2 py-1 text-right">Ch. Weight</th>
            <th className="border border-slate-300 px-2 py-1 text-right">Rate</th>
            <th className="border border-slate-300 px-2 py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 px-2 py-1">{b.from_city}</td>
            <td className="border border-slate-300 px-2 py-1">{b.to_city}</td>
            <td className="border border-slate-300 px-2 py-1">{b.parcel_type}</td>
            <td className="border border-slate-300 px-2 py-1 text-right">{b.parcel_count}</td>
            <td className="border border-slate-300 px-2 py-1 text-right">{b.chargeable_weight} kg</td>
            <td className="border border-slate-300 px-2 py-1 text-right">{money(b.company_rate)}</td>
            <td className="border border-slate-300 px-2 py-1 text-right">{money(b.customer_amount)}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-6 mt-4 text-sm">
        <div>
          <div className="font-semibold text-slate-500 text-xs uppercase mb-1">Charges</div>
          <Row l="Freight" v={money(b.freight)} />
          <Row l="Loading" v={money(b.loading_charge)} />
          <Row l="Unloading" v={money(b.unloading_charge)} />
          <Row l="Other" v={money(b.other_charges)} />
          <Row l="Discount" v={"−" + money(b.discount)} />
          <div className="border-t border-slate-800 mt-1 pt-1 flex justify-between font-bold">
            <span>Total</span><span>{money(b.total_charges)}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Payment Mode</span><span>{b.payment_mode || "—"}{b.cod_amount > 0 ? ` · COD ₹${b.cod_amount}` : ""}</span>
          </div>
        </div>
        <div>
          <div className="font-semibold text-slate-500 text-xs uppercase mb-1">Booking Party</div>
          <div className="font-semibold">{b.customer_name}</div>
          <div>{b.customer_mobile || ""}</div>
          <div className="mt-2 text-xs text-slate-500">Vendor: {b.vendor_name}</div>
        </div>
      </div>

      <div className="mt-6 flex justify-between text-xs text-slate-500">
        <div>Booked by: {b.created_by || "—"}{b.remarks ? ` · Remarks: ${b.remarks}` : ""}</div>
        <div>Receiver&apos;s Signature: ________________</div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: "window.print && setTimeout(() => window.print(), 400)" }} />
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return <div className="flex justify-between"><span>{l}</span><span>{v}</span></div>;
}
