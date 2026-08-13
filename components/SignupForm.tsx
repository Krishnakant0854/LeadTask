"use client";

import { CheckCircle2, Eye, EyeOff, Headset, LockKeyhole, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { csrfFetch } from "@/lib/client/csrf";

export function SignupForm({ customerSupportUrl = null }: { customerSupportUrl?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [issuedEmployeeId, setIssuedEmployeeId] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);
    const response = await csrfFetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        mobile: form.get("mobile"),
        email: form.get("email"),
        state: form.get("state"),
        password
      })
    }).catch(() => null);

    setBusy(false);

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setError(data?.error ?? "Unable to create account");
      return;
    }

    const data = (await response.json()) as { user: { employeeId: string } };
    setIssuedEmployeeId(data.user.employeeId);
  }

  if (issuedEmployeeId) {
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 size={18} />
            Registration complete
          </div>
          {customerSupportUrl ? (
            <a
              aria-label="Customer Support"
              className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-calm-700 hover:bg-calm-100"
              href={customerSupportUrl}
              rel="noopener noreferrer"
              target="_blank"
              title="Customer Support"
            >
              <Headset size={20} />
            </a>
          ) : null}
        </div>
        <div>
          <h1 className="text-2xl font-black text-calm-900">Your Employee ID</h1>
          <p className="mt-2 text-sm leading-6 text-calm-500">Use this ID with your name and password whenever you log in.</p>
        </div>
        <div className="rounded-md border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="text-xs font-bold uppercase text-brand-700">System-issued Employee ID</p>
          <p className="mt-1 break-all text-xl font-black text-brand-900">{issuedEmployeeId}</p>
        </div>
        <Button className="w-full" type="button" onClick={() => router.push("/home")}>
          Continue to Home
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-brand-700">
            <UserPlus size={18} />
            Employee registration
          </div>
          <h1 className="text-2xl font-black text-calm-900">Create account</h1>
          <p className="text-sm leading-6 text-calm-500">Your Employee ID is generated securely by the system.</p>
        </div>
        {customerSupportUrl ? (
          <a
            aria-label="Customer Support"
            className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-calm-700 hover:bg-calm-100"
            href={customerSupportUrl}
            rel="noopener noreferrer"
            target="_blank"
            title="Customer Support"
          >
            <Headset size={20} />
          </a>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Employee ID">
          <Input disabled value="Issued automatically after signup" />
        </Field>
        <Field label="Full Name">
          <Input autoComplete="name" name="name" placeholder="Rahul Sharma" required />
        </Field>
      </div>
      <Field label="Mobile Number">
        <Input autoComplete="tel" inputMode="tel" name="mobile" placeholder="9876543210" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email (optional)">
          <Input autoComplete="email" name="email" placeholder="name@example.com" type="email" />
        </Field>
        <Field label="State (optional)">
          <Input autoComplete="address-level1" name="state" placeholder="Maharashtra" />
        </Field>
      </div>
      <Field label="Password">
        <PasswordInput
          name="password"
          placeholder="Create a strong password"
          visible={passwordVisible}
          onToggle={() => setPasswordVisible((current) => !current)}
        />
      </Field>
      <Field label="Confirm Password">
        <PasswordInput
          name="confirmPassword"
          placeholder="Re-enter password"
          visible={passwordVisible}
          onToggle={() => setPasswordVisible((current) => !current)}
        />
      </Field>
      <p className="text-xs font-medium leading-5 text-calm-500">
        Use at least 12 characters with uppercase, lowercase, number, and special character.
      </p>

      <Button className="w-full" disabled={busy} type="submit">
        <LockKeyhole size={18} />
        {busy ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm font-medium text-calm-500">
        Already have an account?{" "}
        <Link className="font-bold text-brand-700 hover:text-brand-800" href="/login">
          Login
        </Link>
      </p>
    </form>
  );
}

function PasswordInput({
  name,
  placeholder,
  visible,
  onToggle
}: {
  name: string;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        autoComplete="new-password"
        className="pr-12"
        name={name}
        placeholder={placeholder}
        required
        type={visible ? "text" : "password"}
      />
      <Button
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-0 top-0 h-11 w-11 px-0"
        title={visible ? "Hide password" : "Show password"}
        type="button"
        variant="ghost"
        onClick={onToggle}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </Button>
    </div>
  );
}
