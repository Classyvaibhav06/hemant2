import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";

type P = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: P) {
  const g = requireApi(req, "view");
  if ("error" in g) return g.error;
  const id = (await params).id;
  const c = db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as any;
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stats = {
    total_bilties: (db.prepare("SELECT COUNT(*) v FROM bilty WHERE customer_id = ?").get(id) as any).v,
    total_parcels: (db.prepare("SELECT COALESCE(SUM(parcel_count),0) v FROM bilty WHERE customer_id = ?").get(id) as any).v,
    delivered: (db.prepare("SELECT COUNT(*) v FROM bilty WHERE customer_id = ? AND status = 'DELIVERED'").get(id) as any).v,
    pending: (db.prepare("SELECT COUNT(*) v FROM bilty WHERE customer_id = ? AND status NOT IN ('DELIVERED')").get(id) as any).v,
    receivable: (db.prepare("SELECT COALESCE(SUM(total_charges),0) v FROM bilty WHERE customer_id = ? AND status != 'DELIVERED' AND payment_mode != 'PAID'").get(id) as any).v,
  };

  // Ledger: opening balance then per-bilty debits (bookings) — payments not yet modeled
  const ledger: any[] = [];
  let balance = c.opening_balance || 0;
  if (balance) ledger.push({ date: c.created_at?.slice(0, 10), particulars: "Opening Balance", debit: balance > 0 ? balance : 0, credit: balance < 0 ? -balance : 0, balance });
  const bilties = db.prepare("SELECT * FROM bilty WHERE customer_id = ? ORDER BY booking_date, id").all(id) as any[];
  for (const b of bilties) {
    balance = Math.round((balance + b.total_charges) * 100) / 100;
    ledger.push({ date: b.booking_date, particulars: `Bilty ${b.bilty_no} (${b.from_city}→${b.to_city})`, debit: b.total_charges, credit: 0, balance });
  }

  const hist = db.prepare("SELECT id, bilty_no, booking_date, from_city, to_city, total_charges, status FROM bilty WHERE customer_id = ? ORDER BY booking_date DESC, id DESC").all(id);

  return NextResponse.json({ customer: c, stats, ledger, bilties: hist });
}
