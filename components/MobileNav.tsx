"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House, Package, PlusCircle, PaperPlaneTilt, Crosshair,
  Users, Truck, Tag, Clock, DotsThree, List, X, MagnifyingGlass, Truck as LogoIcon,
} from "@phosphor-icons/react";
import { initials } from "@/components/SidebarNav";
import { LogoutButton } from "@/components/LogoutButton";
import { openPalette } from "@/components/CommandPalette";

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

export function MobileNav({
  groups,
  user,
}: {
  groups: NavGroup[];
  user: { name: string; role: string };
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const allItems = groups.flatMap((g) => g.items);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Bottom bar slots: 2 primary tabs + FAB + next tab + overflow
  const byHref = (h: string) => allItems.find((i) => i.href === h);
  const primary = [byHref("/"), byHref("/bilty")].filter(Boolean) as NavItem[];
  const fab = byHref("/bilty/new") ?? null;
  const secondary = allItems
    .filter((i) => !primary.find((p) => p.href === i.href) && i.href !== fab?.href)
    .slice(0, 1);
  const overflow = allItems.filter(
    (i) =>
      !primary.find((p) => p.href === i.href) &&
      i.href !== fab?.href &&
      !secondary.find((s) => s.href === i.href)
  );
  const barItems = [...primary, ...secondary];

  return (
    <>
      {/* ── Top header ── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.08] bg-black/90 px-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex cursor-pointer flex-col items-end gap-[5px] p-2 active:scale-95"
            aria-label="Open menu"
          >
            <span className="h-[2px] w-6 bg-white" />
            <span className="h-[2px] w-6 bg-white" />
            <span className="h-[2px] w-4 bg-[#ff4d00]" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center bg-[#ff4d00] text-black">
              <LogoIcon weight="fill" size={15} />
            </span>
            <span className="font-display text-[16px] leading-none tracking-wide text-white uppercase">
              Freight<span className="text-[#ff4d00]">Desk</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openPalette}
            className="grid h-8 w-8 cursor-pointer place-items-center border border-white/[0.1] text-[#8a8a8a] transition active:scale-95"
            aria-label="Open command palette"
          >
            <MagnifyingGlass size={15} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex cursor-pointer items-center gap-2 p-1"
            aria-label="Open profile menu"
          >
            <span className="grid h-8 w-8 place-items-center border border-white/[0.14] bg-white/[0.04] font-mono text-[10px] font-bold text-white">
              {initials(user.name)}
            </span>
          </button>
        </div>
      </header>

      {/* ── Bottom tab bar ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
        aria-label="Bottom navigation"
      >
        <div className="border-t border-white/[0.08] bg-black/95 backdrop-blur-2xl">
          <div className="flex h-[62px] items-stretch justify-around px-2">
            {barItems.slice(0, 2).map((item) => (
              <BottomTab key={item.href} item={item} pathname={pathname} />
            ))}

            {fab && (
              <Link
                href={fab.href}
                className="flex flex-col items-center justify-center -mt-2"
                aria-label={fab.label}
              >
                <span className="grid h-11 w-11 place-items-center bg-[#ff4d00] text-black transition-all duration-150 active:scale-90">
                  <PlusCircle weight="fill" size={26} />
                </span>
                <span className="mt-1 font-mono text-[8px] font-bold tracking-[0.18em] text-[#ff4d00] uppercase">
                  New
                </span>
              </Link>
            )}

            {barItems.slice(2).map((item) => (
              <BottomTab key={item.href} item={item} pathname={pathname} />
            ))}

            {overflow.length > 0 && (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="flex h-full cursor-pointer flex-col items-center justify-center gap-0.5 px-3 text-[#7a7a7a] transition active:scale-95"
                aria-label="More options"
              >
                <DotsThree size={24} weight="bold" />
                <span className="font-mono text-[8px] font-bold tracking-[0.18em] uppercase">More</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Fullscreen VANGUARD menu ── */}
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-black/98 backdrop-blur-sm transition-all duration-500 md:hidden ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center bg-[#ff4d00] text-black">
              <LogoIcon weight="fill" size={16} />
            </span>
            <span className="font-display text-[18px] leading-none tracking-wide text-white uppercase">
              Freight<span className="text-[#ff4d00]">Desk</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="cursor-pointer p-2 text-white transition active:scale-90"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" weight="bold" />
          </button>
        </div>

        {/* Staggered links */}
        <div className="no-scrollbar my-auto flex flex-col justify-center overflow-y-auto px-6 py-6">
          {groups.map((g, gi) => (
            <div key={g.title} className="mb-6 last:mb-0">
              <div
                className="mb-2 flex items-center gap-2 transition-all duration-500"
                style={{
                  transitionDelay: `${gi * 70 + 60}ms`,
                  transform: menuOpen ? "translateY(0)" : "translateY(14px)",
                  opacity: menuOpen ? 1 : 0,
                }}
              >
                <span className="font-mono text-[9px] font-bold tracking-[0.24em] text-[#ff4d00]">
                  {String(gi + 1).padStart(2, "0")}
                </span>
                <span className="h-px flex-1 bg-white/[0.08]" />
                <span className="font-mono text-[9px] font-bold tracking-[0.24em] text-[#5a5a5a] uppercase">
                  {g.title}
                </span>
              </div>
              {g.items.map((item, i) => {
                const Icon = ICON_MAP[item.icon];
                const active = isActive(pathname, item.href);
                const order = gi * 4 + i;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      transitionDelay: `${order * 55 + 100}ms`,
                      transform: menuOpen ? "translateY(0)" : "translateY(22px)",
                      opacity: menuOpen ? 1 : 0,
                    }}
                    className={`flex items-center gap-4 border-b border-white/[0.06] py-3.5 transition-all duration-500 ${
                      active ? "text-white" : "text-[#8a8a8a]"
                    }`}
                  >
                    {Icon && (
                      <Icon
                        size={22}
                        weight={active ? "fill" : "regular"}
                        className={active ? "text-[#ff4d00]" : "text-[#4a4a4a]"}
                      />
                    )}
                    <span className="font-display text-[30px] leading-none tracking-wide uppercase">
                      {item.label}
                    </span>
                    {active && <span className="ml-auto h-2 w-2 animate-blink bg-[#ff4d00]" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between border-t border-white/[0.08] px-5 py-4 transition-all duration-500"
          style={{
            transitionDelay: "420ms",
            transform: menuOpen ? "translateY(0)" : "translateY(14px)",
            opacity: menuOpen ? 1 : 0,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border border-white/[0.14] bg-white/[0.04] font-mono text-[11px] font-bold text-white">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <div className="truncate font-mono text-[11px] font-bold tracking-wide text-white uppercase">
                {user.name}
              </div>
              <div className="truncate font-mono text-[9px] tracking-[0.14em] text-[#ff7a3c] uppercase">
                {user.role.replaceAll("_", " ")}
              </div>
            </div>
          </div>
          <LogoutButton className="grid h-9 w-9 cursor-pointer place-items-center border border-white/[0.1] text-[#8a8a8a] transition hover:border-[#ff3355]/40 hover:text-[#ff3355]" />
        </div>
      </div>
    </>
  );
}

function BottomTab({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = ICON_MAP[item.icon];
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      className="flex h-full flex-col items-center justify-center gap-0.5 px-3 transition-all active:scale-95"
      aria-label={item.label}
    >
      <span className={`relative grid place-items-center transition-colors ${active ? "text-white" : "text-[#7a7a7a]"}`}>
        {Icon && <Icon size={23} weight={active ? "fill" : "regular"} />}
        {active && <span className="absolute -bottom-1.5 h-[3px] w-[3px] animate-blink bg-[#ff4d00]" />}
      </span>
      <span
        className={`font-mono text-[8px] font-bold tracking-[0.16em] uppercase transition-colors ${
          active ? "text-white" : "text-[#4f4f4f]"
        }`}
      >
        {item.label}
      </span>
    </Link>
  );
}
