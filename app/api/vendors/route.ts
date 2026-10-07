import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";
import { recordAudit } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const g = requireApi(req, "view");
  if ("error" in g) return g.error;
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const rows = q
    ? db.prepare(`SELECT * FROM vendors WHERE name LIKE ? OR code LIKE ? OR mobile LIKE ? OR company LIKE ? ORDER BY name`).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
    : db.prepare("SELECT * FROM vendors ORDER BY name").all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const g = requireApi(req, "add");
  if ("error" in g) return g.error;
  const b = await req.json().catch(() => ({}));
  if (!b.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const count = (db.prepare("SELECT COUNT(*) c FROM vendors").get() as any).c;
  const code = "V" + String(count + 1).padStart(3, "0");
  let attempt = 0;
  while (db.prepare("SELECT 1 FROM vendors WHERE code = ?").get(code.replace(/(\d+)$/, (m: string) => String(Number(m) + attempt).padStart(3, "0")))) attempt++;
  const finalCode = code.replace(/(\d+)$/, (m: string) => String(Number(m) + attempt).padStart(3, "0"));
  db.prepare(`INSERT INTO vendors (code,name,company,mobile,address,city,state,pincode,gstin,opening_balance,payment_terms,status,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    finalCode, b.name, b.company || null, b.mobile || null, b.address || null,
    b.city || null, b.state || null, b.pincode || null, b.gstin || null,
    Number(b.opening_balance) || 0, b.payment_terms || null, b.status || "ACTIVE", new Date().toISOString()
  );
  const row = db.prepare("SELECT * FROM vendors WHERE code = ?").get(finalCode);
  recordAudit({ user: g.user, action: "VENDOR_CREATE", entity: "vendor", entityId: finalCode, details: b.name });
  return NextResponse.json(row, { status: 201 });
}
