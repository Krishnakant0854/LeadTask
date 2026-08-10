"use client";

import { ArrowLeft, Camera, CreditCard, WalletCards } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";

import { AppNavbar } from "@/components/AppNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { csrfFetch } from "@/lib/client/csrf";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BankDetails, SessionUser, WithdrawalRow } from "@/types/app";

type IncomeSummary = {
  salesIncome: number;
  bonusIncome: number;
  totalIncome: number;
  withdrawn: number;
  available: number;
};

export function ProfilePanel({
  user,
  customerSupportUrl,
  groupUrl,
  bank,
  income,
  withdrawals
}: {
  user: SessionUser;
  customerSupportUrl: string | null;
  groupUrl: string | null;
  bank: BankDetails;
  income: IncomeSummary;
  withdrawals: WithdrawalRow[];
}) {
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl);
  const [bankMessage, setBankMessage] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [withdrawalRows, setWithdrawalRows] = useState(withdrawals);
  const [busy, setBusy] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const returnHref = user.role === "ADMIN" ? "/admin/dashboard" : "/home";
  const returnLabel = user.role === "ADMIN" ? "Back to Dashboard" : "Back to Home";

  async function uploadPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("photo");
    setPhotoMessage("");
    const form = new FormData(event.currentTarget);

    const response = await csrfFetch("/api/profile/photo", {
      method: "POST",
      body: form
    }).catch(() => null);
    setBusy("");

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setPhotoMessage(data?.error ?? "Unable to upload photo");
      return;
    }

    const data = (await response.json()) as { photoUrl: string };
    setPhotoUrl(data.photoUrl);
    setPhotoMessage("Photo updated");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function saveBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("bank");
    setBankMessage("");
    const form = new FormData(event.currentTarget);

    const response = await csrfFetch("/api/bank", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        holderName: form.get("holderName"),
        accountNumber: form.get("accountNumber"),
        ifsc: form.get("ifsc"),
        bankName: form.get("bankName")
      })
    }).catch(() => null);
    setBusy("");

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setBankMessage(data?.error ?? "Unable to save bank details");
      return;
    }
    setBankMessage("Bank details saved");
  }

  async function requestWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("withdraw");
    const form = new FormData(event.currentTarget);

    const response = await csrfFetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(form.get("amount")) })
    }).catch(() => null);
    setBusy("");

    if (!response || !response.ok) return;
    const data = (await response.json()) as { withdrawal: WithdrawalRow };
    setWithdrawalRows((current) => [data.withdrawal, ...current]);
    event.currentTarget.reset();
  }

  return (
    <div className="min-h-screen bg-calm-50">
      <AppNavbar customerSupportUrl={customerSupportUrl} groupUrl={groupUrl} user={user} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          className="focus-ring mb-5 inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-bold text-calm-700 hover:bg-calm-100 hover:text-calm-900"
          href={returnHref}
        >
          <ArrowLeft size={18} />
          {returnLabel}
        </Link>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-6">
          <Card>
            <CardHeader title="Profile Photo" />
            <form className="space-y-4 p-5" onSubmit={uploadPhoto}>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-brand-50">
                  {photoUrl ? (
                    <Image alt={user.name} className="object-cover" fill src={photoUrl} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-black text-brand-600">
                      {user.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-calm-900">{user.name}</p>
                  <p className="text-sm font-medium text-calm-500">{user.employeeId}</p>
                </div>
              </div>
              <Input ref={fileRef} accept="image/*" name="photo" required type="file" />
              {photoMessage ? <p className="text-sm font-semibold text-brand-700">{photoMessage}</p> : null}
              <Button disabled={busy === "photo"} type="submit">
                <Camera size={17} />
                {busy === "photo" ? "Uploading..." : "Change Photo"}
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader title="Personal Information" />
            <div className="grid gap-4 p-5">
              <ReadOnly label="Name" value={user.name} />
              <ReadOnly label="Mobile" value={user.mobile ?? "-"} />
              <ReadOnly label="Email" value={user.email ?? "-"} />
              <ReadOnly label="State" value={user.state ?? "-"} />
            </div>
          </Card>
        </div>

          <div className="space-y-6">
          <Card>
            <CardHeader title="Bank Details" />
            <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={saveBank}>
              <Field label="Account Holder">
                <Input defaultValue={bank?.holderName ?? ""} name="holderName" required />
              </Field>
              <Field label="Account Number">
                <Input defaultValue={bank?.accountNumber ?? ""} inputMode="numeric" name="accountNumber" required />
              </Field>
              <Field label="IFSC">
                <Input defaultValue={bank?.ifsc ?? ""} name="ifsc" required />
              </Field>
              <Field label="Bank Name">
                <Input defaultValue={bank?.bankName ?? ""} name="bankName" required />
              </Field>
              <div className="flex items-end gap-3 md:col-span-2">
                <Button disabled={busy === "bank"} type="submit">
                  <CreditCard size={17} />
                  {busy === "bank" ? "Saving..." : "Save Bank Details"}
                </Button>
                {bankMessage ? <span className="text-sm font-semibold text-brand-700">{bankMessage}</span> : null}
              </div>
            </form>
          </Card>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <IncomeCard label="Lead Income" value={income.salesIncome} />
            <IncomeCard label="Bonus Income" value={income.bonusIncome} />
            <IncomeCard label="Total Income" value={income.totalIncome} />
            <IncomeCard label="Withdrawn" value={income.withdrawn} />
            <IncomeCard label="Available Balance" value={income.available} />
          </section>

          <Card>
            <CardHeader title="Withdrawal History" />
            <form className="grid gap-3 border-b border-calm-200 p-5 md:grid-cols-[1fr_auto]" onSubmit={requestWithdrawal}>
              <Input max={income.available} min="1" name="amount" placeholder="Withdrawal amount" step="1" type="number" />
              <Button disabled={busy === "withdraw"} type="submit">
                <WalletCards size={17} />
                Request
              </Button>
            </form>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRows.length ? (
                    withdrawalRows.map((item) => (
                      <tr key={item.id}>
                        <td className="font-semibold text-calm-900">{formatCurrency(item.amount)}</td>
                        <td className="text-calm-600">{formatDate(item.date)}</td>
                        <td>
                          <Badge value={item.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="text-sm text-calm-500" colSpan={3}>
                        No withdrawal requests yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-calm-500">{label}</p>
      <p className="mt-1 rounded-md border border-calm-200 bg-calm-50 px-3 py-2 text-sm font-semibold text-calm-800">
        {value}
      </p>
    </div>
  );
}

function IncomeCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-bold text-calm-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-calm-900">{formatCurrency(value)}</p>
    </Card>
  );
}
