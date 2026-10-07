import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";
import { recordAudit } from "@/lib/auth";

type P = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: P) {
  const g = requireApi(req, "edit");
  if ("error" in g) return g.error;
  const id = (await params).id;
  const old = db.prepare("SELECT * FROM rate_configs WHERE id = ?").get(id) as any;
  if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const today = new Date().toISOString().slice(0, 10);
  const newType = b.commission_type || old.commission_type;
  const newVal = b.commission_value != null ? Number(b.commission_value) : old.commission_value;
  const newMin = b.min_weight != null ? Number(b.min_weight) : old.min_weight;
  const newMax = b.max_weight != null ? Number(b.max_weight) : old.max_weight;

  const valueChanged = newType !== old.commission_type || newVal !== old.commission_value || newMin !== old.min_weight || newMax !== old.max_weight;

  if (valueChanged) {
    // Close old history row, insert new history row — history preserved.
    db.prepare("UPDATE rate_history SET valid_to = ? WHERE rate_id = ? AND valid_to IS NULL").run(today, id);
    db.prepare(`INSERT INTO rate_history (rate_id,commission_type,commission_value,min_weight,max_weight,valid_from,source,created_by)
      VALUES (?,?,?,?,?,?,?,?)`).run(id, newType, newVal, newMin, newMax, today, "AMENDED", g.user.username);
  }
  db.prepare(`UPDATE rate_configs SET commission_type=?, commission_value=?, min_weight=?, max_weight=?, name=?, active=?
    WHERE id=?`).run(
    newType, newVal, newMin, newMax,
    b.name || old.name,
    b.active != null ? (b.active ? 1 : 0) : old.active,
    id
  );
  recordAudit({ user: g.user, action: valueChanged ? "RATE_AMEND" : "RATE_UPDATE", entity: "rate", entityId: id, details: `${old.name}: ${old.commission_type} ${old.commission_value} → ${newType} ${newVal}` });
  return NextResponse.json(db.prepare("SELECT * FROM rate_configs WHERE id = ?").get(id));
}

export async function DELETE(req: NextRequest, { params }: P) {
  const g = requireApi(req, "delete");
  if ("error" in g) return g.error;
  const id = (await params).id;
  const used = db.prepare("SELECT COUNT(*) c FROM bilty WHERE rate_config_id = ?").get(id) as any;
  if (used.c > 0) {
    // Soft-deactivate instead of delete to preserve history
    db.prepare("UPDATE rate_configs SET active = 0 WHERE id = ?").run(id);
    recordAudit({ user: g.user, action: "RATE_DEACTIVATE", entity: "rate", entityId: id, details: "In use by bilties; deactivated instead of deleted" });
    return NextResponse.json({ ok: true, deactivated: true });
  }
  const row = db.prepare("SELECT name FROM rate_configs WHERE id = ?").get(id) as any;
  db.prepare("DELETE FROM rate_history WHERE rate_id = ?").run(id);
  db.prepare("DELETE FROM rate_configs WHERE id = ?").run(id);
  recordAudit({ user: g.user, action: "RATE_DELETE", entity: "rate", entityId: id, details: row?.name });
  return NextResponse.json({ ok: true });
}
