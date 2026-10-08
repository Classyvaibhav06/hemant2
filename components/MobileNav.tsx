"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICONS, IconLogo, IconMenu, IconX } from "@/components/icons";
import { initials } from "@/components/SidebarNav";
import { LogoutButton } from "@/components/LogoutButton";

export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { title: string; items: NavItem[] };

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
  const [open, setOpen] = useState(false);

  // Close drawer whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* ── Top Bar (Mobile Only) ── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/60 bg-white/90 px-3.5 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2.5">
          {/* Hamburger button */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
            aria-label="Open navigation menu"
          >
            <IconMenu width={20} height={20} strokeWidth={2} />
          </button>

          {/* Logo & title */}
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-[0_4px_12px_-2px_rgb(108_74_236/0.5)]">
              <IconLogo width={17} height={17} />
            </span>
            <span className="text-[15px] font-extrabold tracking-tight text-slate-900">FreightDesk</span>
          </Link>
        </div>

        {/* User avatar on right */}
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-[10px] font-bold text-white shadow-sm">
            {initials(user.name)}
          </span>
        </div>
      </header>

      {/* ── Mobile Hamburger Drawer (Slide-in) ── */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="animate-fade-in absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            className="animate-fade-up absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-slate-200/80 bg-white shadow-lift"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 pt-5 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-[0_4px_12px_-2px_rgb(108_74_236/0.5)]">
                  <IconLogo width={19} height={19} />
                </span>
                <div className="min-w-0">
                  <div className="text-[15px] leading-tight font-extrabold tracking-tight text-slate-900">FreightDesk</div>
                  <div className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">Transport Suite</div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close menu"
              >
                <IconX width={18} height={18} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {groups.map((g) => {
                if (g.items.length === 0) return null;
                return (
                  <div key={g.title} className="mb-5 last:mb-2">
                    <div className="mb-1.5 px-3.5 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                      {g.title}
                    </div>
                    <div className="space-y-0.5">
                      {g.items.map((item) => {
                        const Icon = ICONS[item.icon];
                        const active = isActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                              active
                                ? "bg-brand-50 font-bold text-brand-700"
                                : "font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                            }`}
                          >
                            {active && (
                              <span className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600" />
                            )}
                            {Icon && (
                              <Icon
                                width={18}
                                height={18}
                                className={active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"}
                              />
                            )}
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Drawer User Footer */}
            <div className="border-t border-slate-100 bg-slate-50/60 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-[11px] font-bold text-white shadow-sm">
                  {initials(user.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-slate-800">{user.name}</div>
                  <div className="truncate text-[11px] font-medium text-slate-400">{user.role.replaceAll("_", " ")}</div>
                </div>
                <LogoutButton />
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
