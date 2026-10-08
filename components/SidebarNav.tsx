"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House, PlusCircle, Package, PaperPlaneTilt, Crosshair,
  Users, Truck, Tag, Clock, SignOut, Truck as LogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { LogoutButton } from "@/components/LogoutButton";

export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { title: string; items: NavItem[] };

const ICON_MAP: Record<string, React.ElementType> = {
  home: House,
  plusCircle: PlusCircle,
  box: Package,
  send: PaperPlaneTilt,
  radar: Crosshair,
  users: Users,
  truck: Truck,
  tag: Tag,
  clock: Clock,
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/bilty/new") return pathname === "/bilty/new";
  if (href === "/bilty") return pathname.startsWith("/bilty");
  return pathname.startsWith(href);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function SidebarNav({
  groups,
  user,
}: {
  groups: NavGroup[];
  user: { name: string; role: string };
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] flex-col border-r border-white/[0.07] bg-[#0a0a0a] md:flex">
      {/* ── Brand mark ── */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-6 border-b border-white/[0.06]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-500 text-white">
          <LogoIcon weight="fill" size={20} />
        </span>
        <div className="min-w-0">
          <div className="text-[15px] font-bold tracking-tight text-[#e7e9ea] leading-tight">FreightDesk</div>
          <div className="text-[10px] font-medium text-[#71767b] tracking-wider uppercase mt-0.5">Transport Suite</div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        {groups.map((g) => {
          if (g.items.length === 0) return null;
          return (
            <div key={g.title} className="mb-6 last:mb-2">
              <div className="mb-2 px-3 text-[10px] font-bold tracking-[0.12em] text-[#3a3a3a] uppercase select-none">
                {g.title}
              </div>
              <div className="space-y-0.5">
                {g.items.map((item) => {
                  const Icon = ICON_MAP[item.icon];
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-150 ${
                        active
                          ? "bg-white/[0.07] text-[#e7e9ea] font-semibold"
                          : "text-[#71767b] hover:bg-white/[0.04] hover:text-[#e7e9ea]"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent-500" />
                      )}
                      {Icon && (
                        <Icon
                          size={18}
                          weight={active ? "fill" : "regular"}
                          className={active ? "text-accent-500" : "text-[#525252] group-hover:text-[#71767b] transition-colors"}
                        />
                      )}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User footer ── */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.04]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[11px] font-bold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-[#e7e9ea] leading-tight">{user.name}</div>
            <div className="truncate text-[11px] text-[#71767b]">{user.role.replaceAll("_", " ")}</div>
          </div>
          <LogoutButton className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-[#525252] transition hover:bg-white/[0.06] hover:text-[#f4212e]" />
        </div>
      </div>
    </aside>
  );
}
