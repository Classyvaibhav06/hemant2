import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";
import { recordAudit } from "@/lib/auth";

type P = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: P) {
  const g = requireApi(req, "view");
  if ("error" in g) return g.error;
  const row = db.prepare("SELECT * FROM customers WHERE id = ?").get((await params).id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: P) {
  const g = requireApi(req, "edit");
  if ("error" in g) return g.error;
  const id = (await params).id;
  const existing = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const fields = ["name","company","mobile","mobile2","address","city","state","pincode","gstin","email","payment_terms","notes","status"] as const;
  const sets: string[] = [], vals: any[] = [];
  for (const f of fields) if (f in b) { sets.push(`${f} = ?`); vals.push(b[f] || null); }
  for (const f of ["credit_limit","opening_balance"] as const) if (f in b) { sets.push(`${f} = ?`); vals.push(Number(b[f]) || 0); }
  if (sets.length) {
    vals.push(id);
    db.prepare(`UPDATE customers SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  }
  recordAudit({ user: g.user, action: "CUSTOMER_UPDATE", entity: "customer", entityId: id, details: b.name || "" });
  return NextResponse.json(db.prepare("SELECT * FROM customers WHERE id = ?").get(id));
}

export async function DELETE(req: NextRequest, { params }: P) {
  const g = requireApi(req, "delete");
  if ("error" in g) return g.error;
  const id = (await params).id;
  const used = db.prepare("SELECT COUNT(*) c FROM bilty WHERE customer_id = ?").get(id) as any;
  if (used.c > 0) return NextResponse.json({ error: `Cannot delete: ${used.c} bilty(ies) reference this customer` }, { status: 409 });
  const row = db.prepare("SELECT code, name FROM customers WHERE id = ?").get(id) as any;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.prepare("DELETE FROM customers WHERE id = ?").run(id);
  recordAudit({ user: g.user, action: "CUSTOMER_DELETE", entity: "customer", entityId: row.code, details: row.name });
  return NextResponse.json({ ok: true });
}
