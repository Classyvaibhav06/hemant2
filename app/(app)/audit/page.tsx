import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/types";
import { redirect } from "next/navigation";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const user = getSessionUser(await cookies())!;
  if (!["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user.role)) redirect("/dashboard");
  const rows = db.prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 300").all() as any[];

  return (
    <div className="space-y-4">
      <div className="animate-fade-up">
        <div className="flex items-center gap-2">
          <ClockCounterClockwise size={16} className="text-accent-400" />
          <span className="font-mono text-xs uppercase tracking-wider text-[#71767b]">System Activity</span>
        </div>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-[#e7e9ea] sm:text-2xl">Audit Trails</h1>
        <p className="mt-0.5 text-xs text-[#71767b]">Last {rows.length} recorded system events and actor modifications</p>
      </div>

      <div className="card overflow-x-auto animate-fade-up">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="th">Timestamp</th>
              <th className="th">Actor</th>
              <th className="th">Action</th>
              <th className="th">Entity</th>
              <th className="th">Ref ID</th>
              <th className="th">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="td font-mono text-xs text-[#71767b] whitespace-nowrap">
                  {new Date(a.at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}
                </td>
                <td className="td text-xs font-semibold text-[#e7e9ea]">{a.username}</td>
                <td className="td">
                  <span className="inline-flex rounded-md bg-accent-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-accent-400 border border-accent-500/20">
                    {a.action}
                  </span>
                </td>
                <td className="td text-xs text-zinc-300">{a.entity}</td>
                <td className="td font-mono text-xs text-zinc-400">{a.entity_id || "—"}</td>
                <td className="td text-xs text-[#71767b] font-mono max-w-xs truncate">{a.details || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="td py-12 text-center text-sm font-medium text-[#71767b]" colSpan={6}>
                  No audit entries logged yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
