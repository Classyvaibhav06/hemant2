import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser, can } from "@/lib/types";
import type { Action } from "@/lib/types";
import { db } from "@/lib/db";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileSidebar } from "@/components/MobileSidebar";

const NAV: { href: string; label: string; action?: Action; icon: string }[] = [
  { href: "/", label: "Dashboard", icon: "▤" },
  { href: "/bilty/new", label: "New Bilty", action: "add", icon: "＋" },
  { href: "/bilty", label: "Bilties", icon: "❐" },
  { href: "/dispatch", label: "Dispatch", action: "dispatch", icon: "→" },
  { href: "/track", label: "Tracking", action: "track", icon: "◉" },
  { href: "/customers", label: "Customers", icon: "👤" },
  { href: "/vendors", label: "Vendors", icon: "🚛" },
  { href: "/rates", label: "Rate Master", action: "edit", icon: "₹" },
  { href: "/audit", label: "Audit Log", action: "reports", icon: "🕘" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const user = getSessionUser(cookieStore);
  if (!user) redirect("/login");

  // Filter nav items by role
  const visibleNav = NAV.filter((item) => !item.action || can(user.role, item.action));

  return (
    <div className="min-h-screen flex">
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex w-56 shrink-0 bg-slate-900 text-slate-300 flex-col">
        <div className="px-4 py-5 border-b border-slate-800">
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm">F</span>
            FreightDesk
          </div>
          <div className="text-xs text-slate-500 mt-1">Transport Management</div>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-800 hover:text-white transition"
            >
              <span className="w-5 text-center opacity-70">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">{user.name}</div>
              <div className="text-slate-500">{user.role.replaceAll("_", " ")}</div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ── Mobile sidebar (client component with drawer) ── */}
      <MobileSidebar
        nav={visibleNav}
        userName={user.name}
        userRole={user.role}
      />

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 p-4 md:p-6 overflow-x-hidden pt-14 md:pt-6">
        {children}
      </main>
    </div>
  );
}
