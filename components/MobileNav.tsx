"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House, Package, PlusCircle, PaperPlaneTilt, Crosshair,
  Users, Truck, Tag, Clock, DotsThree, List, X, Truck as LogoIcon,
} from "@phosphor-icons/react";
import { initials } from "@/components/SidebarNav";
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

export function MobileNav({
  groups,
  user,
}: {
  groups: NavGroup[];
  user: { name: string; role: string };
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Flatten nav items
  const allItems = groups.flatMap((g) => g.items);

  // Close on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // Build bottom bar slots: 4 primary + "More" button
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
      {/* ── Mobile Top Header (with Hamburger Menu Button) ── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.08] bg-[#0a0a0a]/90 px-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          {/* Hamburger button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#e7e9ea] transition active:scale-95 hover:bg-white/[0.08]"
            aria-label="Open navigation menu"
          >
            <List size={20} weight="bold" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-500 text-white shadow-[0_0_12px_rgba(29,155,240,0.5)]">
              <LogoIcon weight="fill" size={15} />
            </span>
            <span className="text-[15px] font-bold tracking-tight text-[#e7e9ea]">FreightDesk</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 cursor-pointer rounded-full p-1 transition hover:bg-white/[0.06]"
          aria-label="User profile options"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[11px] font-bold text-white shadow-[0_0_10px_rgba(29,155,240,0.3)]">
            {initials(user.name)}
          </span>
        </button>
      </header>

      {/* ── Mobile Bottom Tab Bar (X / Armandev Style) ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
        aria-label="Bottom navigation"
      >
        <div className="border-t border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-2xl">
          <div className="flex h-[62px] items-center justify-around px-2">
            {/* Left 2 tabs */}
            {barItems.slice(0, 2).map((item) => (
              <BottomTab key={item.href} item={item} pathname={pathname} />
            ))}

            {/* Middle FAB (New Bilty) */}
            {fab && (
              <Link
                href={fab.href}
                className="flex flex-col items-center justify-center -mt-2"
                aria-label={fab.label}
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-500 text-white shadow-[0_0_20px_rgba(29,155,240,0.5)] transition-all duration-200 active:scale-90 hover:bg-accent-600">
                  <PlusCircle weight="fill" size={28} />
                </span>
                <span className="text-[9px] font-bold tracking-wide text-accent-400 mt-0.5">New</span>
              </Link>
            )}

            {/* Right tab(s) */}
            {barItems.slice(2).map((item) => (
              <BottomTab key={item.href} item={item} pathname={pathname} />
            ))}

            {/* Overflow "More" tab */}
            {overflow.length > 0 && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex h-full flex-col items-center justify-center gap-0.5 px-3 text-[#71767b] transition hover:text-[#e7e9ea]"
                aria-label="More options"
              >
                <DotsThree size={24} weight="bold" />
                <span className="text-[9px] font-bold tracking-wide">More</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Full-screen Drawer (Hamburger Menu Sheet) ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="animate-fade-in absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer Sheet */}
          <div className="animate-sheet-up absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[28px] border-t border-white/[0.1] bg-[#111111] pb-[max(2rem,env(safe-area-inset-bottom))] shadow-2xl">
            {/* Grab handle */}
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1.5 w-12 rounded-full bg-white/20" />
            </div>

            {/* User profile row */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-xs font-bold text-white shadow-[0_0_12px_rgba(29,155,240,0.4)]">
                  {initials(user.name)}
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-[#e7e9ea] truncate">{user.name}</div>
                  <div className="text-[11px] font-mono text-accent-400 font-semibold">{user.role.replaceAll("_", " ")}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LogoutButton className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-[#71767b] transition hover:bg-white/[0.08] hover:text-[#f4212e]" />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-[#71767b] transition hover:bg-white/[0.08] hover:text-[#e7e9ea]"
                  aria-label="Close"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>

            {/* All navigation groups */}
            <div className="px-3 pt-3 pb-4">
              {groups.map((g) => {
                if (g.items.length === 0) return null;
                return (
                  <div key={g.title} className="mb-4">
                    <div className="mb-1.5 px-3 text-[10px] font-bold tracking-[0.14em] text-[#525252] uppercase select-none">
                      {g.title}
                    </div>
                    <div className="space-y-1">
                      {g.items.map((item) => {
                        const Icon = ICON_MAP[item.icon];
                        const active = isActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setDrawerOpen(false)}
                            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-[14px] font-medium transition-all ${
                              active
                                ? "bg-white/[0.08] text-[#e7e9ea] font-semibold border-l-2 border-accent-500"
                                : "text-[#71767b] hover:bg-white/[0.04] hover:text-[#e7e9ea]"
                            }`}
                          >
                            {Icon && (
                              <Icon
                                size={20}
                                weight={active ? "fill" : "regular"}
                                className={active ? "text-accent-400" : "text-[#71767b]"}
                              />
                            )}
                            <span className="flex-1">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BottomTab({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = ICON_MAP[item.icon];
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      className="flex flex-col items-center justify-center gap-0.5 h-full px-3 transition-all active:scale-95"
      aria-label={item.label}
    >
      <span className={`relative grid place-items-center transition-colors ${active ? "text-accent-400" : "text-[#71767b]"}`}>
        {Icon && <Icon size={24} weight={active ? "fill" : "regular"} />}
        {active && (
          <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-accent-400 shadow-[0_0_6px_#1d9bf0]" />
        )}
      </span>
      <span className={`text-[9px] font-bold tracking-wide transition-colors ${active ? "text-accent-400" : "text-[#525252]"}`}>
        {item.label}
      </span>
    </Link>
  );
}
