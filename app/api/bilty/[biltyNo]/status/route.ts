import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";
import { recordAudit } from "@/lib/auth";
import { canTransition } from "@/lib/bilty";
import type { BiltyStatus } from "@/lib/db";

type P = { params: Promise<{ biltyNo: string }> };

export async function POST(req: NextRequest, { params }: P) {
  const g = requireApi(req, "edit");
  if ("error" in g) return g.error;
  const no = (await params).biltyNo;
  const b = db.prepare("SELECT id, status, bilty_no FROM bilty WHERE bilty_no = ?").get(no) as any;
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status, note } = await req.json().catch(() => ({} as any));
  if (!canTransition(b.status, status as BiltyStatus)) {
    return NextResponse.json({ error: `Invalid transition ${b.status} → ${status}` }, { status: 400 });
  }
  const now = new Date().toISOString();
  db.prepare("UPDATE bilty SET status = ? WHERE id = ?").run(status, b.id);
  db.prepare("INSERT INTO bilty_status_history (bilty_id, status, at, by, note) VALUES (?,?,?,?,?)").run(
    b.id, status, now, g.user.username, note || null
  );
  recordAudit({ user: g.user, action: "BILTY_STATUS", entity: "bilty", entityId: no, details: `${b.status} → ${status}${note ? ` (${note})` : ""}` });
  return NextResponse.json({ ok: true, status });
}
