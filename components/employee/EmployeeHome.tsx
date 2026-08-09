"use client";

import {
  CheckCircle2,
  CircleDotDashed,
  ListChecks,
  Plus,
  Search,
  TrendingUp,
  type LucideIcon
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { AppNavbar } from "@/components/AppNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { csrfFetch } from "@/lib/client/csrf";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CustomerRow, SessionUser } from "@/types/app";

export function EmployeeHome({
  user,
  posterUrl,
  customers
}: {
  user: SessionUser;
  posterUrl: string;
  customers: CustomerRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState(customers);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRows(customers);
  }, [customers]);

  const newLeads = rows.filter((customer) => customer.leadProcess.status === "NEW_LEAD").length;
  const inProgress = rows.filter((customer) => customer.leadProcess.status === "IN_PROGRESS").length;
  const completed = rows.filter((customer) => customer.leadProcess.status === "COMPLETED").length;
  const completedIncome = rows
    .filter((customer) => customer.leadProcess.status === "COMPLETED")
    .reduce((total, customer) => total + customer.leadProcess.income, 0);

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["name", "product", "date"]) {
      const value = String(form.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    router.push(`/home${params.toString() ? `?${params}` : ""}`);
  }

  async function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await csrfFetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.get("customerName"),
        mobile: form.get("mobile"),
        product: form.get("product"),
        date: form.get("date")
      })
    }).catch(() => null);

    setBusy(false);

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setError(data?.error ?? "Unable to add customer");
      return;
    }

    const data = (await response.json()) as { customer: CustomerRow };
    setRows((current) => [data.customer, ...current]);
    setModalOpen(false);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-calm-50">
      <AppNavbar user={user} />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <LeadMetric icon={ListChecks} label="Total Leads" value={rows.length} />
          <LeadMetric icon={CircleDotDashed} label="Open Leads" value={inProgress + newLeads} />
          <LeadMetric icon={CheckCircle2} label="Completed" value={completed} />
          <LeadMetric icon={TrendingUp} label="Completed Income" value={formatCurrency(completedIncome)} />
        </section>

        <section className="relative overflow-hidden rounded-lg border border-brand-100 bg-white shadow-panel">
          <Image
            alt="Active company poster"
            className="h-44 w-full object-cover sm:h-64 lg:h-72"
            height={420}
            priority
            src={posterUrl}
            width={1400}
          />
        </section>

        <Card>
          <CardHeader title="Search Filters" />
          <form className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_1fr_220px_auto]" onSubmit={submitFilters}>
            <Field label="Customer Name">
              <Input
                defaultValue={searchParams.get("name") ?? ""}
                name="name"
                placeholder="Rahul"
              />
            </Field>
            <Field label="Product">
              <Input
                defaultValue={searchParams.get("product") ?? ""}
                name="product"
                placeholder="Insurance"
              />
            </Field>
            <Field label="Date">
              <Input defaultValue={searchParams.get("date") ?? ""} name="date" type="date" />
            </Field>
            <div className="flex items-end gap-2">
              <Button className="w-full md:w-auto" type="submit">
                <Search size={17} />
                Search
              </Button>
            </div>
          </form>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)] xl:gap-6">
          <Card>
            <CardHeader title={`Customers (${rows.length})`} />
            <div className="divide-y divide-calm-200 md:hidden">
              {rows.length ? (
                rows.map((customer) => (
                  <article className="space-y-3 p-4" key={customer.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-calm-900">{customer.customerName}</p>
                        <p className="mt-1 text-sm font-medium text-calm-500">{customer.mobile}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                        {customer.product}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-calm-600">Added {formatDate(customer.date)}</p>
                  </article>
                ))
              ) : (
                <EmptyMobile message="No customers match the selected filters." />
              )}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Product</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((customer) => (
                      <tr key={customer.id}>
                        <td className="font-semibold text-calm-900">{customer.customerName}</td>
                        <td className="text-calm-600">{customer.mobile}</td>
                        <td className="text-calm-600">{customer.product}</td>
                        <td className="text-calm-600">{formatDate(customer.date)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="text-sm text-calm-500" colSpan={4}>
                        No customers match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Work Process" />
            <div className="divide-y divide-calm-200 md:hidden">
              {rows.length ? (
                rows.map((customer) => (
                  <article className="space-y-3 p-4" key={customer.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate font-bold text-calm-900">{customer.customerName}</p>
                      <Badge value={customer.leadProcess.status} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-calm-500">
                        <span>Progress</span>
                        <span>{customer.leadProcess.progress}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-calm-100">
                        <div
                          className="h-2 rounded-full bg-brand-500 transition-[width] duration-300"
                          style={{ width: `${customer.leadProcess.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-bold uppercase text-calm-500">Income</p>
                        <p className="mt-1 font-bold text-calm-900">{formatCurrency(customer.leadProcess.income)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-calm-500">Complete</p>
                        <p className="mt-1 font-bold text-calm-900">
                          {customer.leadProcess.status === "COMPLETED" ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                    {customer.leadProcess.rejectionReason ? (
                      <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                        {customer.leadProcess.rejectionReason}
                      </p>
                    ) : null}
                  </article>
                ))
              ) : (
                <EmptyMobile message="Work status appears after a customer is added." />
              )}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table>
                <thead>
                  <tr>
                    <th>Lead Status</th>
                    <th>Progress</th>
                    <th>Complete</th>
                    <th>Income</th>
                    <th>Rejection Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <Badge value={customer.leadProcess.status} />
                        </td>
                        <td className="min-w-32">
                          <div className="h-2 rounded-full bg-calm-100">
                            <div
                              className="h-2 rounded-full bg-brand-500"
                              style={{ width: `${customer.leadProcess.progress}%` }}
                            />
                          </div>
                          <span className="mt-1 block text-xs font-semibold text-calm-500">
                            {customer.leadProcess.progress}%
                          </span>
                        </td>
                        <td className="text-sm font-semibold text-calm-700">
                          {customer.leadProcess.status === "COMPLETED" ? "Yes" : "No"}
                        </td>
                        <td className="text-sm font-semibold text-calm-900">
                          {formatCurrency(customer.leadProcess.income)}
                        </td>
                        <td className="min-w-48 text-sm text-calm-600">
                          {customer.leadProcess.rejectionReason ?? "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="text-sm text-calm-500" colSpan={5}>
                        Work status appears after a customer is added.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>

      <Button
        aria-label="Add customer"
        className="fixed bottom-5 right-5 h-14 w-14 rounded-full px-0 shadow-soft sm:bottom-6 sm:right-6"
        type="button"
        onClick={() => setModalOpen(true)}
      >
        <Plus size={25} />
      </Button>

      <Modal open={modalOpen} title="Add Customer" onClose={() => setModalOpen(false)}>
        <form className="space-y-4" onSubmit={addCustomer}>
          <Field label="Customer Name">
            <Input name="customerName" required />
          </Field>
          <Field label="Mobile Number">
            <Input inputMode="tel" name="mobile" required />
          </Field>
          <Field label="Product">
            <Input name="product" required />
          </Field>
          <Field label="Date">
            <Input name="date" required type="date" />
          </Field>

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} type="submit">
              {busy ? "Saving..." : "Submit"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function LeadMetric({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-h-24 items-center gap-3 rounded-lg border border-calm-200 bg-white p-4 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold uppercase text-calm-500">{label}</p>
        <p className="mt-1 truncate text-xl font-black text-calm-900">{value}</p>
      </div>
    </div>
  );
}

function EmptyMobile({ message }: { message: string }) {
  return <p className="p-4 text-sm font-medium text-calm-500">{message}</p>;
}
