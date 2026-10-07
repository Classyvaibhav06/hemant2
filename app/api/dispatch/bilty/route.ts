import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";
import { recordAudit } from "@/lib/auth";
import { canTransition } from "@/lib/bilty";

export async function POST(req: NextRequest) {
  const g = requireApi(req, "dispatch");
  if ("error" in g) return g.error;
  const b = await req.json().catch(() => ({}));

  const required = ["bilty_no", "dispatch_date", "vehicle_no", "driver", "manifest_no"];
  for (const k of required) if (!b[k]) return NextResponse.json({ error: `${k} is required` }, { status: 400 });

  const blty = db.prepare("SELECT id, status, bilty_no FROM bilty WHERE bilty_no = ?").get(b.bilty_no) as any;
  if (!blty) return NextResponse.json({ error: "Bilty not found" }, { status: 404 });
  if (db.prepare("SELECT 1 FROM dispatches WHERE bilty_id = ?").get(blty.id)) {
    return NextResponse.json({ error: "Bilty already dispatched" }, { status: 409 });
  }
  // BOOKED -> DISPATCHED (-> IN_TRANSIT handled by subsequent movement updates)
  if (!canTransition(blty.status, "DISPATCHED")) {
    return NextResponse.json({ error: `Cannot dispatch a bilty in status ${blty.status}` }, { status: 400 });
  }

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO dispatches (bilty_id, dispatch_date, vehicle_no, driver, manifest_no, route, dispatch_branch, remarks, dispatched_by, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      blty.id, b.dispatch_date, b.vehicle_no, b.driver, b.manifest_no,
      b.route || null, b.dispatch_branch || null, b.remarks || null, g.user.username, now
    );
    db.prepare("UPDATE bilty SET status = 'DISPATCHED' WHERE id = ?").run(blty.id);
    db.prepare("INSERT INTO bilty_status_history (bilty_id, status, at, by, note) VALUES (?,?,?,?,?)").run(
      blty.id, "DISPATCHED", now, g.user.username, `Vehicle ${b.vehicle_no} · Manifest ${b.manifest_no}`
    );
    recordAudit({ user: g.user, action: "BILTY_DISPATCH", entity: "bilty", entityId: blty.bilty_no, details: `Vehicle ${b.vehicle_no}, driver ${b.driver}, manifest ${b.manifest_no}` });
  });
  tx();

  return NextResponse.json({ ok: true, bilty_no: blty.bilty_no, status: "DISPATCHED" }, { status: 201 });
}
