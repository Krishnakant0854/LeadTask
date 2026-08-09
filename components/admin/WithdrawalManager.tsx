"use client";

import { FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { csrfFetch } from "@/lib/client/csrf";
import { formatCurrency, formatDate } from "@/lib/utils";

type AdminWithdrawalRow = {
  id: string;
  amount: number;
  date: string;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  user: {
    employeeId: string;
    name: string;
  };
};

export function WithdrawalManager({ initialRows }: { initialRows: AdminWithdrawalRow[] }) {
  const [rows, setRows] = useState(initialRows);

  async function updateStatus(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await csrfFetch(`/api/admin/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: form.get("status") })
    }).catch(() => null);

    if (!response?.ok) return;
    const data = (await response.json()) as { withdrawal: Pick<AdminWithdrawalRow, "id" | "status"> };
    setRows((current) =>
      current.map((item) => (item.id === id ? { ...item, status: data.withdrawal.status } : item))
    );
  }

  return (
    <Card>
      <CardHeader title="Withdrawal Requests" />
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <p className="font-bold text-calm-900">{item.user.name}</p>
                    <p className="text-xs font-semibold text-calm-500">{item.user.employeeId}</p>
                  </td>
                  <td className="font-semibold text-calm-900">{formatCurrency(item.amount)}</td>
                  <td className="text-calm-600">{formatDate(item.date)}</td>
                  <td>
                    <Badge value={item.status} />
                  </td>
                  <td>
                    <form className="flex min-w-56 gap-2" onSubmit={(event) => updateStatus(event, item.id)}>
                      <Select defaultValue={item.status} name="status">
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="PAID">Paid</option>
                        <option value="REJECTED">Rejected</option>
                      </Select>
                      <Button type="submit" variant="secondary">
                        Save
                      </Button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-sm text-calm-500" colSpan={5}>
                  No withdrawal requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
