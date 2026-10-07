import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  const g = requireApi(req, "view");
  if ("error" in g) return g.error;
  const no = req.nextUrl.searchParams.get("bilty_no")?.trim();
  if (!no) return NextResponse.json({ error: "bilty_no required" }, { status: 400 });
  const b = db.prepare(`
    SELECT b.bilty_no, b.status, b.customer_id, c.name customer_name,
           b.sender_name, b.sender_mobile, b.receiver_name, b.receiver_mobile,
           b.from_city, b.to_city, b.vendor_id, v.name vendor_name,
           b.parcel_count, b.chargeable_weight, b.total_charges, b.vendor_cost,
           (SELECT 1 FROM dispatches d WHERE d.bilty_id = b.id) already_dispatched
    FROM bilty b JOIN customers c ON c.id = b.customer_id JOIN vendors v ON v.id = b.vendor_id
    WHERE b.bilty_no = ?`).get(no) as any;
  if (!b) return NextResponse.json({ error: "Bilty not found" }, { status: 404 });
  return NextResponse.json(b);
}
