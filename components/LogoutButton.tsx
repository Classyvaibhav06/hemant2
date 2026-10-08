"use client";

import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";

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
        "grid h-9 w-9 cursor-pointer place-items-center rounded-full text-[#525252] transition hover:bg-white/[0.06] hover:text-[#f4212e]"
      }
    >
      <SignOut size={18} />
    </button>
  );
}
