import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser, can } from "@/lib/types";
import type { Action } from "@/lib/types";
import { SidebarNav } from "@/components/SidebarNav";
import { MobileNav } from "@/components/MobileNav";
import { CommandPalette } from "@/components/CommandPalette";

type NavItemDef = { href: string; label: string; action?: Action; icon: string };

const NAV_GROUPS: { title: string; items: NavItemDef[] }[] = [
  {
    title: "Operations",
    items: [
      { href: "/", label: "Dashboard", icon: "home" },
      { href: "/bilty/new", label: "New Bilty", action: "add", icon: "plusCircle" },
      { href: "/bilty", label: "Bilties", icon: "box" },
      { href: "/dispatch", label: "Dispatch", action: "dispatch", icon: "send" },
      { href: "/track", label: "Tracking", action: "track", icon: "radar" },
    ],
  },
  {
    title: "Partners & Rates",
    items: [
      { href: "/customers", label: "Customers", icon: "users" },
      { href: "/vendors", label: "Vendors", icon: "truck" },
      { href: "/rates", label: "Rate Master", action: "edit", icon: "tag" },
    ],
  },
  {
    title: "Administration",
    items: [{ href: "/audit", label: "Audit Log", action: "reports", icon: "clock" }],
  },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const user = getSessionUser(cookieStore);
  if (!user) redirect("/login");

  const visibleGroups = NAV_GROUPS.map((g) => ({
    title: g.title,
    items: g.items
      .filter((item) => !item.action || can(user.role, item.action))
      .map(({ href, label, icon }) => ({ href, label, icon })),
  }));

  const paletteItems = visibleGroups.flatMap((g) =>
    g.items.map((i) => ({ href: i.href, label: i.label, group: g.title, icon: i.icon }))
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Desktop sidebar */}
      <SidebarNav groups={visibleGroups} user={user} />

      {/* Mobile: top header + bottom tabs + fullscreen menu */}
      <MobileNav groups={visibleGroups} user={user} />

      {/* Global ⌘K command palette */}
      <CommandPalette items={paletteItems} />

      {/* Main content */}
      <main className="md:pl-[248px]">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 pb-24 md:px-8 md:pt-8 md:pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
