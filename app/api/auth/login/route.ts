import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials, createSession, recordAudit } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json().catch(() => ({}) as any);
    const user = verifyCredentials(String(username || ""), String(password || ""));
    if (!user) {
      recordAudit({ action: "LOGIN_FAILED", entity: "auth", details: `username=${username}` });
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }
    const token = createSession(user.id);
    recordAudit({ user, action: "LOGIN", entity: "auth", entityId: user.id });
    const res = NextResponse.json({ user });
    res.cookies.set("fd_session", token, {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({
      error: "Server exception",
      message: err?.message || String(err),
      stack: err?.stack,
    }, { status: 500 });
  }
}
