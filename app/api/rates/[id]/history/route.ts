import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApi } from "@/lib/api-guard";

type P = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: P) {
  const g = requireApi(req, "view");
  if ("error" in g) return g.error;
  const rows = db.prepare("SELECT * FROM rate_history WHERE rate_id = ? ORDER BY valid_from DESC, id DESC").all((await params).id);
  return NextResponse.json(rows);
}
