"use client";

import { useState } from "react";
import { IconAlert, IconLock, IconLogo, IconUser } from "@/components/icons";

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

  function setPreset(u: string, p: string) {
    setUsername(u);
    setPassword(p);
    setError("");
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-50 px-4 py-10">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-[460px] w-[460px] rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-100/60 blur-3xl" />
      </div>

      <div className="animate-fade-up relative w-full max-w-md">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-7 shadow-lift backdrop-blur-xl sm:p-9">
          {/* Brand */}
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="mb-4 grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-float">
              <IconLogo width={32} height={32} />
            </span>
            <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900">FreightDesk</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Transport Management System</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Username / Mobile</label>
              <div className="relative">
                <IconUser width={18} height={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-10.5"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Password</label>
              <div className="relative">
                <IconLock width={18} height={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  className="input pl-10.5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
                <IconAlert width={16} height={16} className="shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-[15px]">
              {busy ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-7 border-t border-slate-100 pt-5">
            <div className="mb-3 text-center text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Quick fill · demo accounts
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.u}
                  type="button"
                  onClick={() => setPreset(a.u, a.p)}
                  className={`cursor-pointer rounded-xl border px-2 py-2.5 text-center transition-all duration-200 active:scale-95 ${
                    a.accent
                      ? "border-brand-200 bg-brand-50/70 hover:border-brand-300 hover:bg-brand-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-[13px] font-bold text-slate-800">{a.label}</span>
                  <span className="mt-0.5 block text-[10px] font-medium text-slate-400">{a.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-slate-400">© {new Date().getFullYear()} FreightDesk</p>
      </div>
    </div>
  );
}
