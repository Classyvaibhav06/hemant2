import { NextRequest, NextResponse } from "next/server";
import { destroySession, recordAudit } from "@/lib/auth";
import { getAuth } from "@/lib/api-guard";

export async function POST(req: NextRequest) {
  const user = getAuth(req);
  const token = req.cookies.get("fd_session")?.value;
  if (token) destroySession(token);
  if (user) recordAudit({ user, action: "LOGOUT", entity: "auth", entityId: user.id });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("fd_session", "", { path: "/", maxAge: 0 });
  return res;
}
