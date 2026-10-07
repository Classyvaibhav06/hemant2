import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";

type P = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: P) {
  const g = requireApi(req, "view");
  if ("error" in g) return g.error;
  const id = (await params).id;
  const v = db.prepare("SELECT * FROM vendors WHERE id = ?").get(id) as any;
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stats = {
    total_bilties: (db.prepare("SELECT COUNT(*) v FROM bilty WHERE vendor_id = ?").get(id) as any).v,
    total_parcels: (db.prepare("SELECT COALESCE(SUM(parcel_count),0) v FROM bilty WHERE vendor_id = ?").get(id) as any).v,
    commission: (db.prepare("SELECT COALESCE(SUM(commission),0) v FROM bilty WHERE vendor_id = ?").get(id) as any).v,
    payable: (db.prepare("SELECT COALESCE(SUM(vendor_cost),0) v FROM bilty WHERE vendor_id = ? AND status != 'DELIVERED'").get(id) as any).v,
  };
  const rates = db.prepare("SELECT * FROM rate_configs WHERE vendor_id = ? ORDER BY id").all(id);
  const ledger: any[] = [];
  let balance = v.opening_balance || 0;
  if (balance) ledger.push({ date: v.created_at?.slice(0, 10), particulars: "Opening Balance", debit: balance < 0 ? -balance : 0, credit: balance > 0 ? balance : 0, balance });
  const bilties = db.prepare("SELECT * FROM bilty WHERE vendor_id = ? ORDER BY booking_date, id").all(id) as any[];
  for (const b of bilties) {
    balance = Math.round((balance + b.vendor_cost) * 100) / 100;
    ledger.push({ date: b.booking_date, particulars: `Bilty ${b.bilty_no} vendor cost`, debit: 0, credit: b.vendor_cost, balance });
  }
  return NextResponse.json({ vendor: v, stats, rates, ledger });
}
