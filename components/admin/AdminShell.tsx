"use client";

import {
  BarChart3,
  ClipboardList,
  ContactRound,
  Gift,
  ImagePlus,
  LogOut,
  UsersRound,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/client/csrf";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/app";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/users", label: "Employees", icon: UsersRound },
  { href: "/admin/customers", label: "Customers", icon: ContactRound },
  { href: "/admin/leads", label: "Leads", icon: ClipboardList },
  { href: "/admin/bonus", label: "Bonus Rules", icon: Gift },
  { href: "/admin/posters", label: "Posters", icon: ImagePlus },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: WalletCards }
];

export function AdminShell({
  user,
  children
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await csrfFetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-calm-50 lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="border-b border-calm-200 bg-white shadow-sm lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:shadow-none">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 lg:px-5 lg:pt-5">
          <Link className="flex items-center gap-3" href="/admin/dashboard">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 text-sm font-black text-white shadow-sm">
              LT
            </span>
            <span>
              <span className="block text-base font-black text-calm-900">LeadTask Admin</span>
              <span className="block text-xs font-medium text-calm-500">{user.employeeId}</span>
            </span>
          </Link>
          <Button
            aria-label="Logout"
            className="h-11 w-11 px-0 lg:hidden"
            disabled={busy}
            type="button"
            variant="ghost"
            onClick={logout}
          >
            <LogOut size={20} />
          </Button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3 lg:mt-5 lg:block lg:space-y-1 lg:px-3 lg:pb-5">
          {links.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                className={cn(
                  "focus-ring flex min-w-max items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-bold transition duration-150 lg:mx-1",
                  active
                    ? "bg-brand-50 text-brand-700 shadow-sm"
                    : "text-calm-600 hover:bg-calm-100 hover:text-calm-900"
                )}
                href={item.href}
              >
                <Icon size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 hidden border-b border-calm-200 bg-white/95 px-8 py-3.5 backdrop-blur lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black text-calm-900">{user.name}</p>
            <p className="text-xs font-medium text-calm-500">Administration workspace</p>
          </div>
          <Button disabled={busy} type="button" variant="ghost" onClick={logout}>
            <LogOut size={18} />
            Logout
          </Button>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
