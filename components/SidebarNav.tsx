"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICONS, IconLogo } from "@/components/icons";
import { LogoutButton } from "@/components/LogoutButton";

export type NavItem = { href: string; label: string; icon: string };
type NavGroup = { title: string; items: NavItem[] };

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

export function SidebarNav({ groups, user }: { groups: NavGroup[]; user: { name: string; role: string } }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white md:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-[0_6px_16px_-4px_rgb(108_74_236/0.5)]">
          <IconLogo width={22} height={22} />
        </span>
        <div className="min-w-0">
          <div className="text-[15px] leading-tight font-extrabold tracking-tight text-slate-900">FreightDesk</div>
          <div className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">Transport Suite</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pb-4">
        {groups.map((g) => (
          <div key={g.title} className="mb-5">
            {g.items.length === 0 ? null : (
              <>
                <div className="mb-1.5 px-7 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">{g.title}</div>
                <div className="space-y-0.5 px-3">
                  {g.items.map((item) => {
                    const Icon = ICONS[item.icon];
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 ${
                          active
                            ? "bg-brand-50 font-bold text-brand-700"
                            : "font-medium text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                        }`}
                      >
                        {active && (
                          <span className="absolute top-1/2 -left-3 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600" />
                        )}
                        {Icon && (
                          <Icon
                            width={19}
                            height={19}
                            className={active ? "text-brand-600" : "text-slate-400 transition-colors group-hover:text-slate-600"}
                          />
                        )}
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-[11px] font-bold text-white">
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
  );
}
