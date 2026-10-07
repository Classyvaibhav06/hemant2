import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";
import { recordAudit } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const g = requireApi(req, "view");
  if ("error" in g) return g.error;
  const vendorId = req.nextUrl.searchParams.get("vendor_id");
  const rows = vendorId
    ? db.prepare(`
        SELECT r.*, v.name vendor_name FROM rate_configs r JOIN vendors v ON v.id = r.vendor_id
        WHERE r.vendor_id = ? ORDER BY r.id DESC`).all(vendorId)
    : db.prepare(`
        SELECT r.*, v.name vendor_name FROM rate_configs r JOIN vendors v ON v.id = r.vendor_id
        ORDER BY v.name, r.id DESC`).all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const g = requireApi(req, "add");
  if ("error" in g) return g.error;
  const b = await req.json().catch(() => ({}));
  const needed = ["vendor_id", "name", "commission_type", "commission_value"];
  for (const k of needed) if (!b[k]) return NextResponse.json({ error: `${k} is required` }, { status: 400 });
  const today = new Date().toISOString().slice(0, 10);
  const ins = db.prepare(`INSERT INTO rate_configs (vendor_id,name,commission_type,commission_value,min_weight,max_weight,valid_from,active,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
    b.vendor_id, b.name, b.commission_type, Number(b.commission_value),
    Number(b.min_weight) || 0, Number(b.max_weight) || 0, b.valid_from || today,
    b.active === 0 ? 0 : 1, new Date().toISOString()
  );
  db.prepare(`INSERT INTO rate_history (rate_id,commission_type,commission_value,min_weight,max_weight,valid_from,source,created_by)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    ins.lastInsertRowid, b.commission_type, Number(b.commission_value),
    Number(b.min_weight) || 0, Number(b.max_weight) || 0, b.valid_from || today, "INITIAL", g.user.username
  );
  recordAudit({ user: g.user, action: "RATE_CREATE", entity: "rate", entityId: String(ins.lastInsertRowid), details: `${b.name} (${b.commission_type} ${b.commission_value})` });
  return NextResponse.json(db.prepare("SELECT * FROM rate_configs WHERE id = ?").get(ins.lastInsertRowid), { status: 201 });
}
