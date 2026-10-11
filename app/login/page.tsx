"use client";

import { useEffect, useState } from "react";
import { Warning, Lock, User, Truck, ArrowRight, SealCheck } from "@phosphor-icons/react";

const DEMO_ACCOUNTS: { label: string; desc: string; u: string; p: string; accent: boolean }[] = [
  { label: "Admin", desc: "Full access", u: "admin", p: "admin123", accent: true },
  { label: "Booking", desc: "Create bilties", u: "booking", p: "booking123", accent: false },
  { label: "Viewer", desc: "Read only", u: "viewer", p: "viewer123", accent: false },
];

const TICKER = [
  "BOOKINGS", "DISPATCH", "TRACKING", "FREIGHT RATES", "COD LEDGER",
  "VENDOR NETWORK", "AUDIT TRAIL", "LIVE OPS",
];

function Ticker() {
  const row = [...TICKER, ...TICKER];
  return (
    <div className="overflow-hidden border-t border-white/[0.08] py-3">
      <div className="marquee-mask flex w-max animate-marquee gap-0">
        {row.map((t, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-4 pr-4 font-mono text-[10px] font-bold tracking-[0.3em] text-[#5a5a5a] uppercase"
          >
            {t}
            <span className="h-1.5 w-1.5 bg-[#ff4d00]" />
          </span>
        ))}
      </div>
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#a3a3a3] tabular-nums">
      {now
        ? now.toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" })
        : "--:--:--"}{" "}
      IST
    </span>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Login failed");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="grid min-h-[100dvh] bg-black lg:grid-cols-[1.15fr_1fr]">
      {/* ══ LEFT: cinematic brand panel ══ */}
      <div className="bg-grid relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.08] p-10 lg:flex xl:p-14">
        {/* ambient glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-[#ff4d00]/[0.07] blur-[130px]" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-[#ff4d00]/[0.05] blur-[110px]" />
        {/* scanline */}
        <div className="animate-scan pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent" />

        {/* top row */}
        <div className="animate-fade-in relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center bg-[#ff4d00] text-black">
              <Truck weight="fill" size={20} />
            </span>
            <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-[#a3a3a3] uppercase">
              Freightdesk
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LiveClock />
            <span className="flex items-center gap-1.5 border border-[#00e08c]/30 bg-[#00e08c]/[0.07] px-2 py-1 font-mono text-[9px] font-bold tracking-[0.18em] text-[#00e08c]">
              <span className="h-1.5 w-1.5 animate-blink bg-[#00e08c]" />
              SYSTEMS NOMINAL
            </span>
          </div>
        </div>

        {/* hero type */}
        <div className="relative">
          <div className="animate-fade-up mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-[#ff4d00]" />
            <span className="font-mono text-[10px] font-bold tracking-[0.34em] text-[#8a8a8a] uppercase">
              Transport Management System
            </span>
          </div>
          <h1 className="font-display leading-[0.88] tracking-wide uppercase select-none">
            <span className="animate-fade-up block text-[clamp(4rem,9vw,8.5rem)] text-white">
              Move.
            </span>
            <span
              className="animate-fade-up block text-[clamp(4rem,9vw,8.5rem)] text-white"
              style={{ animationDelay: "120ms" }}
            >
              Track.
            </span>
            <span
              className="animate-fade-up block text-[clamp(4rem,9vw,8.5rem)] text-stroke-orange"
              style={{ animationDelay: "240ms" }}
            >
              Deliver.
            </span>
          </h1>
          <p
            className="animate-fade-up mt-7 max-w-md font-mono text-[12px] leading-relaxed tracking-[0.08em] text-[#8a8a8a] uppercase"
            style={{ animationDelay: "360ms" }}
          >
            One terminal for bookings, dispatch, live tracking and the ledger —{" "}
            <b className="font-bold text-white">built for speed on the ground.</b>
          </p>

          {/* stats */}
          <div
            className="animate-fade-up mt-10 grid max-w-md grid-cols-3 border border-white/[0.08]"
            style={{ animationDelay: "480ms" }}
          >
            {[
              ["bilty → delivered", "END TO END"],
              ["₹ ledger", "COD & CREDIT"],
              ["24×7", "OPS UPTIME"],
            ].map(([v, l], i) => (
              <div
                key={l}
                className={`px-4 py-4 ${i < 2 ? "border-r border-white/[0.08]" : ""}`}
              >
                <div className="font-display text-[22px] leading-none text-white uppercase">{v}</div>
                <div className="mt-1.5 font-mono text-[8px] tracking-[0.22em] text-[#5a5a5a] uppercase">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ticker */}
        <div className="animate-fade-in relative" style={{ animationDelay: "400ms" }}>
          <Ticker />
        </div>
      </div>

      {/* ══ RIGHT: auth terminal ══ */}
      <div className="relative flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
        {/* mobile brand band */}
        <div className="mb-10 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center bg-[#ff4d00] text-black">
              <Truck weight="fill" size={18} />
            </span>
            <span className="font-display text-[18px] leading-none tracking-wide text-white uppercase">
              Freight<span className="text-[#ff4d00]">Desk</span>
            </span>
          </div>
          <span className="flex items-center gap-1.5 border border-[#00e08c]/30 bg-[#00e08c]/[0.07] px-2 py-1 font-mono text-[8px] font-bold tracking-[0.16em] text-[#00e08c]">
            <span className="h-1.5 w-1.5 animate-blink bg-[#00e08c]" />
            ONLINE
          </span>
        </div>

        <div className="animate-fade-up mx-auto w-full max-w-[420px]">
          {/* panel header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.26em] text-[#5a5a5a] uppercase">
              <span className="text-[#ff4d00]">■</span> AUTH / TERMINAL 01
            </div>
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#3a3a3a]">SECURE</span>
          </div>

          <h2 className="font-display text-[42px] leading-[0.95] tracking-wide text-white uppercase">
            Sign in to <span className="text-stroke">dispatch</span>
          </h2>
          <p className="mt-3 font-mono text-[11px] tracking-[0.12em] text-[#7a7a7a] uppercase">
            Enter credentials to access the ops terminal
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="label" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <User
                  size={15}
                  weight="bold"
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#5a5a5a]"
                />
                <input
                  id="username"
                  className="input pl-10 font-mono tracking-wide"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  placeholder="OPERATOR ID"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  weight="bold"
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#5a5a5a]"
                />
                <input
                  id="password"
                  type="password"
                  className="input pl-10 font-mono tracking-wide"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 border border-[#ff3355]/30 bg-[#ff3355]/[0.08] px-3.5 py-2.5 font-mono text-[11px] font-bold tracking-[0.1em] text-[#ff3355] uppercase">
                <Warning size={15} weight="fill" className="shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3.5 text-[12px]">
              {busy ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  AUTHENTICATING…
                </span>
              ) : (
                <>
                  AUTHENTICATE
                  <ArrowRight size={14} weight="bold" />
                </>
              )}
            </button>
          </form>

          {/* demo accounts */}
          <div className="mt-8 border-t border-white/[0.08] pt-6">
            <div className="mb-3 flex items-center gap-2 font-mono text-[9px] font-bold tracking-[0.26em] text-[#4a4a4a] uppercase">
              <SealCheck size={12} className="text-[#ff4d00]" weight="fill" />
              Demo Access — one click
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.u}
                  type="button"
                  onClick={() => {
                    setUsername(a.u);
                    setPassword(a.p);
                    setError("");
                  }}
                  className={`cursor-pointer border px-2 py-3 text-center transition-all duration-150 active:scale-95 ${
                    a.accent
                      ? "border-[#ff4d00]/40 bg-[#ff4d00]/[0.08] hover:bg-[#ff4d00]/[0.16]"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <span
                    className={`block font-mono text-[11px] font-bold tracking-[0.12em] uppercase ${
                      a.accent ? "text-[#ff4d00]" : "text-white"
                    }`}
                  >
                    {a.label}
                  </span>
                  <span className="mt-0.5 block font-mono text-[8px] tracking-[0.1em] text-[#5a5a5a] uppercase">
                    {a.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-10 flex items-center justify-between font-mono text-[9px] tracking-[0.22em] text-[#3a3a3a] uppercase">
            <span>© {new Date().getFullYear()} Freightdesk</span>
            <span>v2.0 — Blackline</span>
          </p>
        </div>
      </div>
    </div>
  );
}
