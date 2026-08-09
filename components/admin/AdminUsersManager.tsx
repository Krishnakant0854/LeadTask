"use client";

import { Eye, EyeOff, KeyRound, Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { csrfFetch } from "@/lib/client/csrf";
import { formatCurrency, formatDate } from "@/lib/utils";

export type AdminUserRow = {
  id: string;
  employeeId: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
  mobile: string | null;
  email: string | null;
  state: string | null;
  photoUrl: string | null;
  createdAt: string;
};

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; user: AdminUserRow }
  | { type: "password"; user: AdminUserRow };

type FinancialDetails = {
  employee: Pick<AdminUserRow, "id" | "employeeId" | "name">;
  bank: {
    holderName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
  } | null;
  income: {
    salesIncome: number;
    bonusIncome: number;
    totalIncome: number;
    withdrawn: number;
    available: number;
  };
  withdrawals: Array<{
    id: string;
    amount: number;
    date: string;
    status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  }>;
};

export function AdminUsersManager({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [financialUser, setFinancialUser] = useState<AdminUserRow | null>(null);
  const [financialDetails, setFinancialDetails] = useState<FinancialDetails | null>(null);
  const [financialError, setFinancialError] = useState("");
  const [financialLoading, setFinancialLoading] = useState(false);

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal.type !== "create" && modal.type !== "edit") return;
    setBusy(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      employeeId: form.get("employeeId"),
      name: form.get("name"),
      password: form.get("password"),
      mobile: form.get("mobile"),
      email: form.get("email"),
      state: form.get("state"),
      role: form.get("role")
    };

    const endpoint = modal.type === "create" ? "/api/admin/users" : `/api/admin/users/${modal.user.id}`;
    const response = await csrfFetch(endpoint, {
      method: modal.type === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => null);
    setBusy(false);

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setError(data?.error ?? "Unable to save employee");
      return;
    }

    const data = (await response.json()) as { user: AdminUserRow };
    setUsers((current) =>
      modal.type === "create"
        ? [data.user, ...current]
        : current.map((item) => (item.id === data.user.id ? data.user : item))
    );
    setModal({ type: "closed" });
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal.type !== "password") return;
    setBusy(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await csrfFetch(`/api/admin/users/${modal.user.id}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.get("password") })
    }).catch(() => null);
    setBusy(false);

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setError(data?.error ?? "Unable to change password");
      return;
    }

    setModal({ type: "closed" });
  }

  async function deleteUser(user: AdminUserRow) {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    const response = await csrfFetch(`/api/admin/users/${user.id}`, { method: "DELETE" }).catch(() => null);
    if (response?.ok) {
      setUsers((current) => current.filter((item) => item.id !== user.id));
    }
  }

  async function showFinancialDetails(user: AdminUserRow) {
    setFinancialUser(user);
    setFinancialDetails(null);
    setFinancialError("");
    setFinancialLoading(true);

    const response = await csrfFetch(`/api/admin/users/${user.id}/financials`).catch(() => null);
    setFinancialLoading(false);

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setFinancialError(data?.error ?? "Unable to load employee financial details");
      return;
    }

    const data = (await response.json()) as FinancialDetails;
    if (data.employee.id === user.id) setFinancialDetails(data);
  }

  function closeFinancialDetails() {
    setFinancialUser(null);
    setFinancialDetails(null);
    setFinancialError("");
  }

  const editingUser = modal.type === "edit" ? modal.user : null;

  return (
    <>
      <Card>
        <CardHeader
          action={
            <Button type="button" onClick={() => setModal({ type: "create" })}>
              <Plus size={17} />
              Create Employee
            </Button>
          }
          title="Employees"
        />
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>State</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <p className="font-bold text-calm-900">{user.name}</p>
                    <p className="text-xs font-semibold text-calm-500">{user.employeeId}</p>
                  </td>
                  <td>
                    <Badge value={user.role} />
                  </td>
                  <td className="text-calm-600">{user.mobile ?? "-"}</td>
                  <td className="text-calm-600">{user.email ?? "-"}</td>
                  <td className="text-calm-600">{user.state ?? "-"}</td>
                  <td className="text-calm-600">{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="flex min-w-48 gap-2">
                      {user.role === "EMPLOYEE" ? (
                        <Button
                          aria-label={`View ${user.name} bank and earnings`}
                          className="h-10 w-10 px-0"
                          type="button"
                          variant="secondary"
                          onClick={() => showFinancialDetails(user)}
                        >
                          <Landmark size={20} />
                        </Button>
                      ) : null}
                      <Button
                        aria-label="Edit employee"
                        className="h-10 w-10 px-0"
                        type="button"
                        variant="secondary"
                        onClick={() => setModal({ type: "edit", user })}
                      >
                        <Pencil size={20} />
                      </Button>
                      <Button
                        aria-label="Change password"
                        className="h-10 w-10 px-0"
                        type="button"
                        variant="secondary"
                        onClick={() => setModal({ type: "password", user })}
                      >
                        <KeyRound size={20} />
                      </Button>
                      <Button
                        aria-label="Delete employee"
                        className="h-10 w-10 px-0"
                        type="button"
                        variant="danger"
                        onClick={() => deleteUser(user)}
                      >
                        <Trash2 size={20} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modal.type === "create" || modal.type === "edit"}
        title={modal.type === "edit" ? "Edit Employee" : "Create Employee"}
        onClose={() => setModal({ type: "closed" })}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submitUser}>
          <Field label="Employee ID">
            <Input defaultValue={editingUser?.employeeId ?? ""} name="employeeId" required />
          </Field>
          <Field label="Name">
            <Input defaultValue={editingUser?.name ?? ""} name="name" required />
          </Field>
          {modal.type === "create" ? (
            <Field label="Password">
              <PasswordInput
                autoComplete="new-password"
                minLength={12}
                name="password"
                required
              />
            </Field>
          ) : null}
          <Field label="Role">
            <Select defaultValue={editingUser?.role ?? "EMPLOYEE"} name="role">
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>
          <Field label="Mobile">
            <Input defaultValue={editingUser?.mobile ?? ""} name="mobile" />
          </Field>
          <Field label="Email">
            <Input defaultValue={editingUser?.email ?? ""} name="email" type="email" />
          </Field>
          <Field label="State">
            <Input defaultValue={editingUser?.state ?? ""} name="state" />
          </Field>
          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 md:col-span-2">
              {error}
            </div>
          ) : null}
          <div className="flex justify-end gap-3 md:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setModal({ type: "closed" })}>
              Cancel
            </Button>
            <Button disabled={busy} type="submit">
              {busy ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modal.type === "password"}
        title={modal.type === "password" ? `Change Password: ${modal.user.name}` : "Change Password"}
        onClose={() => setModal({ type: "closed" })}
      >
        <form className="space-y-4" onSubmit={submitPassword}>
          <Field label="New Password">
            <PasswordInput autoComplete="new-password" minLength={12} name="password" required />
          </Field>
          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModal({ type: "closed" })}>
              Cancel
            </Button>
            <Button disabled={busy} type="submit">
              Change Password
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(financialUser)}
        title={financialUser ? `Bank & Earnings: ${financialUser.name}` : "Bank & Earnings"}
        onClose={closeFinancialDetails}
      >
        {financialLoading ? <p className="text-sm font-medium text-calm-500">Loading financial details...</p> : null}
        {financialError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {financialError}
          </p>
        ) : null}
        {financialDetails ? (
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-bold text-calm-900">Earnings Summary</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FinancialValue label="Lead Income" value={financialDetails.income.salesIncome} />
                <FinancialValue label="Bonus Income" value={financialDetails.income.bonusIncome} />
                <FinancialValue label="Total Income" value={financialDetails.income.totalIncome} />
                <FinancialValue label="Withdrawn" value={financialDetails.income.withdrawn} />
                <FinancialValue label="Available Balance" value={financialDetails.income.available} />
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-calm-900">Bank Details</h3>
              {financialDetails.bank ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <FinancialText label="Account Holder" value={financialDetails.bank.holderName} />
                  <FinancialText label="Bank Name" value={financialDetails.bank.bankName} />
                  <FinancialText label="Account Number" value={financialDetails.bank.accountNumber} />
                  <FinancialText label="IFSC" value={financialDetails.bank.ifsc} />
                </div>
              ) : (
                <p className="mt-2 text-sm font-medium text-calm-500">No bank details added by this employee.</p>
              )}
            </section>

            <section>
              <h3 className="text-sm font-bold text-calm-900">Recent Withdrawals</h3>
              <div className="mt-3 overflow-x-auto border-t border-calm-200">
                <table>
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialDetails.withdrawals.length ? (
                      financialDetails.withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id}>
                          <td className="font-semibold text-calm-900">{formatCurrency(withdrawal.amount)}</td>
                          <td className="text-calm-600">{formatDate(withdrawal.date)}</td>
                          <td>
                            <Badge value={withdrawal.status} />
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
            </section>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function FinancialValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b border-calm-200 pb-3">
      <p className="text-xs font-bold uppercase text-calm-500">{label}</p>
      <p className="mt-1 text-lg font-black text-calm-900">{formatCurrency(value)}</p>
    </div>
  );
}

function FinancialText({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-calm-200 pb-3">
      <p className="text-xs font-bold uppercase text-calm-500">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-calm-900">{value}</p>
    </div>
  );
}

function PasswordInput({
  name,
  required,
  autoComplete,
  minLength
}: {
  name: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        autoComplete={autoComplete}
        className="pr-11"
        minLength={minLength}
        name={name}
        required={required}
        type={visible ? "text" : "password"}
      />
      <Button
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-0 top-0 h-10 w-10 px-0"
        type="button"
        variant="ghost"
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </Button>
    </div>
  );
}
