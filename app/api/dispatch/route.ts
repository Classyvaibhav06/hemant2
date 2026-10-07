import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  const g = requireApi(req, "view");
  if ("error" in g) return g.error;
  const rows = db.prepare(`
    SELECT d.*, b.bilty_no, b.from_city, b.to_city, c.name customer_name
    FROM dispatches d JOIN bilty b ON b.id = d.bilty_id JOIN customers c ON c.id = b.customer_id
    ORDER BY d.id DESC LIMIT 200`).all();
  return NextResponse.json(rows);
}
