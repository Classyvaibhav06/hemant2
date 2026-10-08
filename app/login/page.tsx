"use client";

import { useState } from "react";
import { Warning, Lock, User, Truck } from "@phosphor-icons/react";

const DEMO_ACCOUNTS: { label: string; desc: string; u: string; p: string; accent: boolean }[] = [
  { label: "Admin", desc: "Full access", u: "admin", p: "admin123", accent: true },
  { label: "Booking", desc: "Create bilties", u: "booking", p: "booking123", accent: false },
  { label: "Viewer", desc: "Read only", u: "viewer", p: "viewer123", accent: false },
];

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
    <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-[#0a0a0a] px-4 py-10">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-0 left-1/2 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-accent-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[400px] translate-x-1/4 translate-y-1/3 rounded-full bg-accent-700/8 blur-[100px]" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="animate-fade-up relative w-full max-w-[400px]">
        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-8 shadow-lift">
          {/* Brand */}
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-[18px] bg-accent-500 text-white shadow-glow">
              <Truck weight="fill" size={28} />
            </span>
            <h1 className="text-[22px] font-bold tracking-tight text-[#e7e9ea]">FreightDesk</h1>
            <p className="mt-1 text-sm text-[#71767b]">Transport Management System</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[#71767b] tracking-wide uppercase">
                Username
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#525252]"
                />
                <input
                  className="input pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[#71767b] tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#525252]"
                />
                <input
                  type="password"
                  className="input pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Enter password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-[#f4212e]/20 bg-[#f4212e]/10 px-3.5 py-2.5 text-[13px] font-medium text-[#f4212e]">
                <Warning size={16} weight="fill" className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full py-3 text-[15px] rounded-xl mt-2"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-7 border-t border-white/[0.06] pt-5">
            <div className="mb-3 text-center text-[10px] font-bold tracking-[0.12em] text-[#3a3a3a] uppercase">
              Demo accounts
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
                  className={`cursor-pointer rounded-xl border px-2 py-2.5 text-center transition-all duration-200 active:scale-95 ${
                    a.accent
                      ? "border-accent-500/30 bg-accent-500/10 hover:border-accent-500/50 hover:bg-accent-500/15"
                      : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.1] hover:bg-white/[0.06]"
                  }`}
                >
                  <span className={`block text-[12px] font-bold ${a.accent ? "text-accent-400" : "text-[#e7e9ea]"}`}>
                    {a.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[#525252]">{a.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#3a3a3a]">
          © {new Date().getFullYear()} FreightDesk
        </p>
      </div>
    </div>
  );
}
