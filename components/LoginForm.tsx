"use client";

import { LockKeyhole, UserCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { csrfFetch } from "@/lib/client/csrf";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const response = await csrfFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: form.get("employeeId"),
        name: form.get("name"),
        password: form.get("password")
      })
    }).catch(() => null);

    setBusy(false);

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setError(data?.error ?? "Login failed");
      return;
    }

    const data = (await response.json()) as { redirectTo: string };
    router.push(searchParams.get("next") ?? data.redirectTo);
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-bold text-brand-700">
          <UserCheck size={18} />
          Secure staff login
        </div>
        <h1 className="text-2xl font-black text-calm-900">LeadTask</h1>
        <p className="text-sm leading-6 text-calm-500">
          Sign in with the employee details created by the admin.
        </p>
      </div>

      <Field label="Employee ID">
        <Input autoComplete="username" name="employeeId" placeholder="EMP001" required />
      </Field>
      <Field label="Name">
        <Input autoComplete="name" name="name" placeholder="Rahul Sharma" required />
      </Field>
      <Field label="Password">
        <Input
          autoComplete="current-password"
          name="password"
          placeholder="Enter password"
          required
          type="password"
        />
      </Field>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <Button className="w-full" disabled={busy} type="submit">
        <LockKeyhole size={18} />
        {busy ? "Checking..." : "Login"}
      </Button>
    </form>
  );
}
