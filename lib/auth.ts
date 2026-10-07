import crypto from "crypto";
import { getDbInstance } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

/** sha256 hash hex — demo app, not login-critical security */
function hash(pwd: string): string {
  return crypto.createHash("sha256").update("fd$" + pwd).digest("hex");
}

export function verifyCredentials(username: string, password: string): SessionUser | null {
  const db = getDbInstance();
  const row = db.prepare("SELECT id, username, password_hash, name, role, active FROM users WHERE username = ?").get(username) as
    | { id: number; username: string; password_hash: string; name: string; role: SessionUser["role"]; active: number }
    | undefined;
  if (!row || !row.active) return null;
  if (row.password_hash !== hash(password)) return null;
  return { id: row.id, username: row.username, name: row.name, role: row.role };
}

export function ensureDefaultAdmin() {
  const db = getDbInstance();
  const admin = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
  if (!admin) {
    db.prepare("INSERT INTO users (username,password_hash,name,role) VALUES (?,?,?,?)").run(
      "admin", hash("admin123"), "Administrator", "SUPER_ADMIN"
    );
  }
}

export function createSession(userId: number): string {
  ensureDefaultAdmin();
  const db = getDbInstance();
  const token = crypto.randomBytes(24).toString("hex");
  db.prepare("INSERT INTO session_tokens (token, user_id, created_at) VALUES (?,?,?)").run(
    token, userId, new Date().toISOString()
  );
  return token;
}

export function destroySession(token: string) {
  if (!token) return;
  getDbInstance().prepare("DELETE FROM session_tokens WHERE token = ?").run(token);
}

export function changePassword(userId: number, newPassword: string) {
  getDbInstance().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash(newPassword), userId);
}

export function recordAudit(opts: {
  user?: SessionUser | null;
  action: string;
  entity: string;
  entityId?: string | number;
  details?: string;
  req?: Request;
}) {
  const db = getDbInstance();
  const at = new Date().toISOString();
  const username = opts.user?.username || "system";
  let ip = "";
  if (opts.req) {
    const fwd = opts.req.headers.get("x-forwarded-for");
    ip = fwd || opts.req.headers.get("x-real-ip") || "";
  }
  db.prepare("INSERT INTO audit_logs (at,username,action,entity,entity_id,details) VALUES (?,?,?,?,?,?)").run(
    at, username, opts.action, opts.entity, opts.entityId != null ? String(opts.entityId) : null,
    [opts.details, ip ? `ip=${ip}` : ""].filter(Boolean).join(" ") || null
  );
}

export { hash };
