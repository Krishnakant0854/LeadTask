"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CustomerRow } from "@/types/app";

export function AdminCustomersView({ customers }: { customers: CustomerRow[] }) {
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
    router.push(`/admin/customers${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Search Any Customer" />
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
        <CardHeader title="All Customers" />
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Product</th>
                <th>Date</th>
                <th>Employee</th>
                <th>Status</th>
                <th>Income</th>
              </tr>
            </thead>
            <tbody>
              {customers.length ? (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="font-bold text-calm-900">{customer.customerName}</td>
                    <td className="text-calm-600">{customer.mobile}</td>
                    <td className="text-calm-600">{customer.product}</td>
                    <td className="text-calm-600">{formatDate(customer.date)}</td>
                    <td>
                      <p className="font-semibold text-calm-900">{customer.employee?.name}</p>
                      <p className="text-xs font-semibold text-calm-500">{customer.employee?.employeeId}</p>
                    </td>
                    <td>
                      <Badge value={customer.leadProcess.status} />
                    </td>
                    <td className="font-semibold text-calm-900">
                      {formatCurrency(customer.leadProcess.income)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="text-sm text-calm-500" colSpan={7}>
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
