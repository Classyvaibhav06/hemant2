import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";
import { nextStatuses } from "@/lib/bilty";

type P = { params: Promise<{ biltyNo: string }> };

export async function GET(req: NextRequest, { params }: P) {
  const g = requireApi(req, "view");
  if ("error" in g) return g.error;
  const no = (await params).biltyNo;
  const b = db.prepare(`
    SELECT b.*, c.name customer_name, c.code customer_code, c.mobile customer_mobile, c.credit_limit,
           v.name vendor_name, v.code vendor_code
    FROM bilty b JOIN customers c ON c.id=b.customer_id JOIN vendors v ON v.id=b.vendor_id
    WHERE b.bilty_no = ?`).get(no) as any;
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const statusHistory = db.prepare("SELECT * FROM bilty_status_history WHERE bilty_id = ? ORDER BY at").all(b.id);
  const dispatch = db.prepare("SELECT * FROM dispatches WHERE bilty_id = ?").get(b.id) || null;
  const audit = db.prepare("SELECT * FROM audit_logs WHERE entity = 'bilty' AND entity_id = ? ORDER BY at DESC").all(no);

  return NextResponse.json({
    bilty: b,
    statusHistory,
    dispatch,
    audit,
    allowedTransitions: nextStatuses(b.status),
  });
}
