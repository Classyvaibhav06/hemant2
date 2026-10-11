"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  House, PlusCircle, Package, PaperPlaneTilt, Crosshair,
  Users, Truck, Tag, Clock, MagnifyingGlass, SignOut, ArrowElbowDownRight,
} from "@phosphor-icons/react";

export type PaletteItem = { href: string; label: string; group: string; icon: string };

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

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform || "");

export function openPalette() {
  window.dispatchEvent(new Event("freightdesk:palette"));
}

export function CommandPalette({
  items,
}: {
  items: PaletteItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.label} ${i.group}`.toLowerCase().includes(q));
  }, [items, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }, []);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router]
  );

  /* Global keybinds: ⌘K / Ctrl+K toggles, custom event opens */
  useEffect(() => {
    const openPalette = () => setOpen(true);
    window.addEventListener("freightdesk:palette", openPalette);
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (open && e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("freightdesk:palette", openPalette);
    };
  }, [open, close]);

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && results[cursor]) {
      e.preventDefault();
      go(results[cursor].href);
    }
  }

  /* Focus input + lock scroll when open */
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  /* Keep cursor in view */
  useEffect(() => {
    listRef.current?.querySelector("[data-active='true']")?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
      {/* Backdrop */}
      <button
        aria-label="Close command palette"
        className="animate-fade-in absolute inset-0 cursor-default bg-black/85 backdrop-blur-sm"
        onClick={close}
      />

      {/* Panel */}
      <div className="animate-pop relative w-full max-w-[560px] border border-white/[0.12] bg-[#0a0a0a] shadow-[0_0_0_1px_rgb(255_77_0/0.25),0_40px_80px_-12px_rgb(0_0_0/0.9)]">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
          <MagnifyingGlass size={16} className="shrink-0 text-[#ff4d00]" weight="bold" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={onInputKey}
            placeholder="TYPE A COMMAND…"
            className="w-full bg-transparent font-mono text-[13px] tracking-[0.1em] text-[#ededed] uppercase placeholder:text-[#4a4a4a] outline-none"
          />
          <button
            onClick={close}
            className="kbd shrink-0 cursor-pointer hover:border-white/30 hover:text-white"
            aria-label="Close"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[46vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center font-mono text-[11px] tracking-[0.2em] text-[#4a4a4a] uppercase">
              NO MATCHING COMMANDS
            </div>
          ) : (
            results.map((item, i) => {
              const Icon = ICON_MAP[item.icon];
              const active = i === cursor;
              return (
                <button
                  key={item.href}
                  data-active={active}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(item.href)}
                  className={`group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    active ? "bg-[#ededed] text-black" : "text-[#a3a3a3] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] font-bold ${active ? "text-[#ff4d00]" : "text-[#3a3a3a]"}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {Icon && (
                    <Icon
                      size={16}
                      weight={active ? "fill" : "regular"}
                      className={active ? "text-black" : "text-[#5a5a5a]"}
                    />
                  )}
                  <span className="flex-1 font-mono text-[12px] font-bold tracking-[0.12em] uppercase">
                    {item.label}
                  </span>
                  <span
                    className={`font-mono text-[9px] tracking-[0.16em] uppercase ${
                      active ? "text-black/50" : "text-[#3a3a3a]"
                    }`}
                  >
                    {item.group}
                  </span>
                  {active && <ArrowElbowDownRight size={13} className="text-[#ff4d00]" weight="bold" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-2.5">
          <div className="flex items-center gap-3 font-mono text-[9px] tracking-[0.18em] text-[#4a4a4a] uppercase">
            <span>↑↓ NAVIGATE</span>
            <span>↵ OPEN</span>
          </div>
          <span className="font-mono text-[9px] tracking-[0.18em] text-[#4a4a4a] uppercase">
            FREIGHTDESK OS v2.0
          </span>
        </div>
      </div>
    </div>
  );
}

/* Small trigger chip used in sidebar / headers */
export function PaletteTrigger({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center justify-between border border-white/[0.08] bg-white/[0.02] px-3 py-2 transition hover:border-white/20 hover:bg-white/[0.05]"
      aria-label="Open command palette"
    >
      <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-[#6b6b6b] uppercase group-hover:text-white">
        <MagnifyingGlass size={12} weight="bold" />
        COMMAND
      </span>
      <span className="kbd">{IS_MAC ? "⌘K" : "CTRL K"}</span>
    </button>
  );
}
