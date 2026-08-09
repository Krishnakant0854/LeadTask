"use client";

import { Plus, Search } from "lucide-react";
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

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-lg border border-brand-100 bg-white shadow-sm">
          <Image
            alt="Active company poster"
            className="h-48 w-full object-cover sm:h-64"
            height={420}
            priority
            src={posterUrl}
            width={1400}
          />
        </section>

        <Card>
          <CardHeader title="Search Filters" />
          <form className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_220px_auto]" onSubmit={submitFilters}>
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]">
          <Card>
            <CardHeader title="Customers" />
            <div className="overflow-x-auto">
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
            <div className="overflow-x-auto">
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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full px-0 shadow-soft"
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
