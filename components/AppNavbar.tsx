"use client";

import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/client/csrf";
import type { SessionUser } from "@/types/app";

export function AppNavbar({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await csrfFetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-calm-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" href={user.role === "ADMIN" ? "/admin/dashboard" : "/home"}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-600 text-sm font-black text-white shadow-sm">
            LT
          </span>
          <span>
            <span className="block text-base font-black text-calm-900">LeadTask</span>
            <span className="block text-xs font-medium text-calm-500">{user.employeeId}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            aria-label="Profile"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-md text-calm-700 hover:bg-calm-100"
            href="/profile"
            title="Profile"
          >
            <UserRound size={20} />
          </Link>
          <Button
            aria-label="Logout"
            className="h-11 w-11 px-0"
            disabled={busy}
            type="button"
            variant="ghost"
            title="Logout"
            onClick={logout}
          >
            <LogOut size={20} />
          </Button>
        </div>
      </div>
    </header>
  );
}
