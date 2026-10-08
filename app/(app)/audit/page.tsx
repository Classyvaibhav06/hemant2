import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/types";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const user = getSessionUser(await cookies())!;
  if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) redirect("/dashboard");
  const rows = db.prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 300").all() as any[];

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Audit Log</h1>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="th">When</th><th className="th">User</th><th className="th">Action</th>
            <th className="th">Entity</th><th className="th">Ref</th><th className="th">Details</th>
          </tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="td text-xs whitespace-nowrap">{new Date(a.at).toLocaleString()}</td>
                <td className="td">{a.username}</td>
                <td className="td font-mono text-xs">{a.action}</td>
                <td className="td">{a.entity}</td>
                <td className="td font-mono text-xs">{a.entity_id || "—"}</td>
                <td className="td text-xs text-slate-600">{a.details || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-slate-400" colSpan={6}>No audit entries</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
