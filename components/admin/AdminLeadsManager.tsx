"use client";

import { Pencil, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { csrfFetch } from "@/lib/client/csrf";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CustomerRow } from "@/types/app";

export function AdminLeadsManager({ initialCustomers }: { initialCustomers: CustomerRow[] }) {
  const [rows, setRows] = useState(initialCustomers);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["name", "product", "date", "employeeId"]) {
      const value = String(form.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    router.push(`/admin/leads${params.toString() ? `?${params}` : ""}`);
  }

  async function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await csrfFetch(`/api/admin/leads/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.get("status"),
        progress: form.get("progress"),
        income: form.get("income"),
        rejectionReason: form.get("rejectionReason")
      })
    }).catch(() => null);
    setBusy(false);

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setError(data?.error ?? "Unable to update lead");
      return;
    }

    const data = (await response.json()) as { leadProcess: CustomerRow["leadProcess"] };
    setRows((current) =>
      current.map((item) => (item.id === editing.id ? { ...item, leadProcess: data.leadProcess } : item))
    );
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Lead Search" />
        <form className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_180px_180px_auto]" onSubmit={submitFilters}>
          <Field label="Customer Name">
            <Input defaultValue={searchParams.get("name") ?? ""} name="name" />
          </Field>
          <Field label="Product">
            <Input defaultValue={searchParams.get("product") ?? ""} name="product" />
          </Field>
          <Field label="Date">
            <Input defaultValue={searchParams.get("date") ?? ""} name="date" type="date" />
          </Field>
          <Field label="Employee ID">
            <Input defaultValue={searchParams.get("employeeId") ?? ""} name="employeeId" />
          </Field>
          <div className="flex items-end">
            <Button className="w-full md:w-auto" type="submit">
              <Search size={17} />
              Search
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Lead Management" />
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Employee</th>
                <th>Product</th>
                <th>Date</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Income</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <p className="font-bold text-calm-900">{customer.customerName}</p>
                      <p className="text-xs font-semibold text-calm-500">{customer.mobile}</p>
                    </td>
                    <td>
                      <p className="font-semibold text-calm-900">{customer.employee?.name}</p>
                      <p className="text-xs font-semibold text-calm-500">{customer.employee?.employeeId}</p>
                    </td>
                    <td className="text-calm-600">{customer.product}</td>
                    <td className="text-calm-600">{formatDate(customer.date)}</td>
                    <td>
                      <Badge value={customer.leadProcess.status} />
                    </td>
                    <td className="font-semibold text-calm-700">{customer.leadProcess.progress}%</td>
                    <td className="font-semibold text-calm-900">{formatCurrency(customer.leadProcess.income)}</td>
                    <td className="max-w-64 text-sm text-calm-600">
                      {customer.leadProcess.rejectionReason ?? "-"}
                    </td>
                    <td>
                      <Button
                        aria-label="Edit lead"
                        className="h-9 w-9 px-0"
                        type="button"
                        variant="secondary"
                        onClick={() => setEditing(customer)}
                      >
                        <Pencil size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="text-sm text-calm-500" colSpan={9}>
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={Boolean(editing)} title="Update Work Status" onClose={() => setEditing(null)}>
        {editing ? (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={saveLead}>
            <Field label="Lead Status">
              <Select defaultValue={editing.leadProcess.status} name="status">
                <option value="NEW_LEAD">New Lead</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </Select>
            </Field>
            <Field label="Progress">
              <Input
                defaultValue={editing.leadProcess.progress}
                max="100"
                min="0"
                name="progress"
                type="number"
              />
            </Field>
            <Field label="Income">
              <Input defaultValue={editing.leadProcess.income} min="0" name="income" step="1" type="number" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Rejection Reason">
                <Textarea defaultValue={editing.leadProcess.rejectionReason ?? ""} name="rejectionReason" />
              </Field>
            </div>
            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 md:col-span-2">
                {error}
              </div>
            ) : null}
            <div className="flex justify-end gap-3 md:col-span-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button disabled={busy} type="submit">
                {busy ? "Saving..." : "Save Status"}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
