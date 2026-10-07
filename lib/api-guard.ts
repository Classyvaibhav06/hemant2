import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, can } from "@/lib/types";
import type { SessionUser, Action } from "@/lib/types";

export function getAuth(req: NextRequest): SessionUser | null {
  return getSessionUser(req.cookies);
}

/** Guard API route. Returns 401/403 response or null to continue. */
export function requireApi(req: NextRequest, action: Action): { user: SessionUser } | { error: NextResponse } {
  const user = getAuth(req);
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  if (!can(user.role, action)) return { error: NextResponse.json({ error: "Forbidden for role " + user.role }, { status: 403 }) };
  return { user };
}
