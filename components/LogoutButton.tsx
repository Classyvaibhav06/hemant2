"use client";

import { useRouter } from "next/navigation";
import { IconLogout } from "@/components/icons";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      title="Sign out"
      aria-label="Sign out"
      className={
        className ??
        "grid h-9 w-9 cursor-pointer place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
      }
    >
      <IconLogout width={18} height={18} />
    </button>
  );
}
