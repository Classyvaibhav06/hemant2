"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white shadow-lg rounded-xl p-6 sm:p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mb-2">F</div>
          <h1 className="text-2xl font-bold text-slate-800">FreightDesk</h1>
          <p className="text-slate-500 text-sm">Transport Management System</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username / Mobile</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username} onChange={(e) => setUsername(e.target.value)}
              autoComplete="username" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" required
            />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <button
            type="submit" disabled={busy}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5"
          >
            {busy ? "Signing in..." : "Login"}
          </button>
        </form>
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500 text-center mb-2 font-medium">Quick Fill Demo Accounts:</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPreset("admin", "admin123")}
              className="flex-1 py-1 px-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-medium"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setPreset("booking", "booking123")}
              className="flex-1 py-1 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 font-medium"
            >
              Booking
            </button>
            <button
              type="button"
              onClick={() => setPreset("viewer", "viewer123")}
              className="flex-1 py-1 px-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-medium"
            >
              Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
