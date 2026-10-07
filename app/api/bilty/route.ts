import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";
import { recordAudit } from "@/lib/auth";
import { computeCharges, generateBiltyNo, resolveRates } from "@/lib/bilty";

export async function GET(req: NextRequest) {
  const g = requireApi(req, "view");
  if ("error" in g) return g.error;
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const q = sp.get("q")?.trim();
  const limit = Math.min(Number(sp.get("limit")) || 100, 500);
  let sql = `SELECT b.*, c.name customer_name, v.name vendor_name FROM bilty b
    JOIN customers c ON c.id = b.customer_id JOIN vendors v ON v.id = b.vendor_id`;
  const wh: string[] = [], args: any[] = [];
  if (status) { wh.push("b.status = ?"); args.push(status); }
  if (q) { wh.push("(b.bilty_no LIKE ? OR c.name LIKE ? OR b.receiver_name LIKE ? OR b.receiver_mobile LIKE ?)"); args.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`); }
  if (wh.length) sql += " WHERE " + wh.join(" AND ");
  sql += " ORDER BY b.id DESC LIMIT ?";
  args.push(limit);
  return NextResponse.json(db.prepare(sql).all(...args));
}

export async function POST(req: NextRequest) {
  const g = requireApi(req, "add");
  if ("error" in g) return g.error;
  const b = await req.json().catch(() => ({}));

  const required = ["customer_id", "vendor_id", "sender_name", "receiver_name", "from_city", "to_city", "parcel_type", "parcel_count", "actual_weight", "chargeable_weight"];
  for (const k of required) {
    if (b[k] === undefined || b[k] === null || b[k] === "") {
      return NextResponse.json({ error: `${k} is required` }, { status: 400 });
    }
  }

  const customer = db.prepare("SELECT id, name FROM customers WHERE id = ?").get(b.customer_id);
  const vendor = db.prepare("SELECT id, name FROM vendors WHERE id = ?").get(b.vendor_id);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 400 });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 400 });

  const w = Number(b.chargeable_weight);
  if (!(w > 0)) return NextResponse.json({ error: "Chargeable weight must be > 0" }, { status: 400 });

  // Automatic rate resolution from Rate Master unless user overrides manually
  let company_rate = Number(b.company_rate) || 0;
  let vendor_rate = Number(b.vendor_rate) || 0;
  let commission = Number(b.commission) || 0;
  let rate_config_id: number | null = null;
  if (!b.manual_rate) {
    const rr = resolveRates(Number(b.vendor_id), w, Number(b.parcel_count));
    if (rr.error) return NextResponse.json({ error: rr.error }, { status: 400 });
    company_rate = rr.company_rate;
    vendor_rate = rr.vendor_rate;
    commission = rr.commission;
    rate_config_id = rr.rate_config_id;
  }

  const charges = computeCharges({
    chargeable_weight: w,
    parcel_count: Number(b.parcel_count),
    company_rate, vendor_rate, commission,
    freight: b.freight, loading_charge: b.loading_charge, unloading_charge: b.unloading_charge,
    other_charges: b.other_charges, discount: b.discount, cod_amount: b.cod_amount,
  });

  const now = new Date();
  const biltyNo = generateBiltyNo();
  const booking_date = b.booking_date || now.toISOString().slice(0, 10);
  const booking_time = b.booking_time || now.toTimeString().slice(0, 5);

  db.prepare(`INSERT INTO bilty (bilty_no, booking_date, booking_time, status, customer_id, vendor_id,
    sender_name, sender_mobile, sender_address, receiver_name, receiver_mobile, receiver_address,
    from_city, to_city, parcel_type, parcel_count, actual_weight, chargeable_weight, rate_config_id,
    company_rate, vendor_rate, freight, loading_charge, unloading_charge, other_charges, discount,
    cod_amount, payment_mode, remarks,
    customer_amount, vendor_amount, commission, total_charges, vendor_cost, gross_margin, net_amount,
    created_by, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    biltyNo, booking_date, booking_time, "BOOKED", b.customer_id, b.vendor_id,
    b.sender_name, b.sender_mobile || null, b.sender_address || null,
    b.receiver_name, b.receiver_mobile || null, b.receiver_address || null,
    b.from_city, b.to_city, b.parcel_type, Number(b.parcel_count),
    Number(b.actual_weight) || w, w, rate_config_id,
    company_rate, vendor_rate, Number(b.freight) || 0, Number(b.loading_charge) || 0, Number(b.unloading_charge) || 0,
    Number(b.other_charges) || 0, charges.discount, Number(b.cod_amount) || 0, b.payment_mode || null,
    b.remarks || null,
    charges.customer_amount, charges.vendor_amount, charges.commission, charges.total_charges,
    charges.vendor_cost, charges.gross_margin, charges.net_amount,
    g.user.username, now.toISOString()
  );

  db.prepare("INSERT INTO bilty_status_history (bilty_id, status, at, by, note) VALUES (?,?,?,?,?)").run(
    (db.prepare("SELECT id FROM bilty WHERE bilty_no = ?").get(biltyNo) as any).id,
    "BOOKED", now.toISOString(), g.user.username, "Bilty created"
  );

  recordAudit({ user: g.user, action: "BILTY_CREATE", entity: "bilty", entityId: biltyNo, details: `${b.from_city}→${b.to_city} ₹${charges.total_charges}` });
  const row = db.prepare("SELECT * FROM bilty WHERE bilty_no = ?").get(biltyNo);
  return NextResponse.json(row, { status: 201 });
}
