"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  House, PlusCircle, Package, PaperPlaneTilt, Crosshair,
  Users, Truck, Tag, Clock, Truck as LogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { LogoutButton } from "@/components/LogoutButton";
import { PaletteTrigger, openPalette } from "@/components/CommandPalette";

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

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[13px] font-bold tracking-[0.14em] text-white tabular-nums">
      {now
        ? now.toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" })
        : "--:--:--"}
      <span className="ml-1 text-[9px] font-bold text-[#ff4d00]">IST</span>
    </span>
  );
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-white/[0.08] bg-black md:flex">
      {/* ── Brand ── */}
      <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#ff4d00] text-black">
          <LogoIcon weight="fill" size={22} />
        </span>
        <div className="min-w-0">
          <div className="font-display text-[20px] leading-none tracking-wide text-white uppercase">
            Freight<span className="text-[#ff4d00]">Desk</span>
          </div>
          <div className="mt-1 font-mono text-[8px] tracking-[0.28em] text-[#5a5a5a] uppercase">
            Transport OS
          </div>
        </div>
      </div>

      {/* ── Live status strip ── */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3">
        <div>
          <div className="font-mono text-[8px] tracking-[0.26em] text-[#5a5a5a] uppercase">
            Local Time
          </div>
          <LiveClock />
        </div>
        <span className="flex items-center gap-1.5 border border-[#00e08c]/30 bg-[#00e08c]/[0.07] px-1.5 py-1 font-mono text-[8px] font-bold tracking-[0.14em] text-[#00e08c]">
          <span className="h-1.5 w-1.5 animate-blink bg-[#00e08c]" />
          LIVE
        </span>
      </div>

      {/* ── Navigation ── */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g, gi) => {
          if (g.items.length === 0) return null;
          return (
            <div key={g.title} className="mb-6 last:mb-2">
              <div className="mb-2 flex items-baseline gap-2 px-3 font-mono text-[9px] font-bold tracking-[0.24em] text-[#4a4a4a] uppercase select-none">
                <span className="text-[#ff4d00]">{String(gi + 1).padStart(2, "0")}</span>
                <span className="h-px flex-1 bg-white/[0.07]" />
                <span>{g.title}</span>
              </div>
              <div className="space-y-px">
                {g.items.map((item) => {
                  const Icon = ICON_MAP[item.icon];
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-3 py-2.5 pr-3 pl-4 font-mono text-[12px] font-bold tracking-[0.1em] uppercase transition-all duration-100 ${
                        active
                          ? "bg-white/[0.06] text-white"
                          : "text-[#7a7a7a] hover:bg-white/[0.03] hover:text-white"
                      }`}
                    >
                      <span
                        className={`absolute top-0 bottom-0 left-0 w-[3px] transition-colors ${
                          active ? "bg-[#ff4d00]" : "bg-transparent group-hover:bg-white/[0.12]"
                        }`}
                      />
                      {Icon && (
                        <Icon
                          size={16}
                          weight={active ? "fill" : "regular"}
                          className={`shrink-0 transition-colors ${
                            active ? "text-[#ff4d00]" : "text-[#4f4f4f] group-hover:text-[#9a9a9a]"
                          }`}
                        />
                      )}
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 animate-blink bg-[#ff4d00]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Command palette trigger ── */}
      <div className="border-t border-white/[0.08] p-3">
        <PaletteTrigger onClick={openPalette} />
      </div>

      {/* ── User footer ── */}
      <div className="border-t border-white/[0.08] p-3">
        <div className="flex items-center gap-3 px-1 py-1.5 transition hover:bg-white/[0.03]">
          <span className="grid h-9 w-9 shrink-0 place-items-center border border-white/[0.14] bg-white/[0.04] font-mono text-[11px] font-bold text-white">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-[11px] font-bold tracking-wide text-white uppercase">
              {user.name}
            </div>
            <div className="truncate font-mono text-[9px] tracking-[0.14em] text-[#ff7a3c] uppercase">
              {user.role.replaceAll("_", " ")}
            </div>
          </div>
          <LogoutButton className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center border border-transparent text-[#5a5a5a] transition hover:border-[#ff3355]/40 hover:bg-[#ff3355]/10 hover:text-[#ff3355]" />
        </div>
      </div>
    </aside>
  );
}
