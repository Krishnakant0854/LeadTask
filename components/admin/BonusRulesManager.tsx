"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { csrfFetch } from "@/lib/client/csrf";
import { formatCurrency } from "@/lib/utils";

export type BonusRuleRow = {
  id: string;
  product: string;
  bonusAmount: number;
  thresholdCount: number;
  windowDays: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type ModalState = { type: "closed" } | { type: "create" } | { type: "edit"; rule: BonusRuleRow };

export function BonusRulesManager({ initialRules }: { initialRules: BonusRuleRow[] }) {
  const [rules, setRules] = useState(initialRules);
  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function submitRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal.type !== "create" && modal.type !== "edit") return;

    setBusy("save");
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      product: form.get("product"),
      bonusAmount: Number(form.get("bonusAmount")),
      thresholdCount: Number(form.get("thresholdCount")),
      windowDays: Number(form.get("windowDays")),
      active: form.get("active") === "on"
    };
    const endpoint = modal.type === "create" ? "/api/admin/bonus-rules" : `/api/admin/bonus-rules/${modal.rule.id}`;
    const response = await csrfFetch(endpoint, {
      method: modal.type === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => null);
    setBusy("");

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setError(data?.error ?? "Unable to save bonus rule");
      return;
    }

    const data = (await response.json()) as { rule: BonusRuleRow };
    setRules((current) =>
      modal.type === "create"
        ? [...current, data.rule].sort((left, right) => left.product.localeCompare(right.product))
        : current.map((item) => (item.id === data.rule.id ? data.rule : item))
    );
    closeModal();
  }

  async function deleteRule(rule: BonusRuleRow) {
    if (!window.confirm(`Delete the bonus rule for ${rule.product}?`)) return;

    setBusy(rule.id);
    setError("");
    const response = await csrfFetch(`/api/admin/bonus-rules/${rule.id}`, { method: "DELETE" }).catch(() => null);
    setBusy("");

    if (!response?.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setError(data?.error ?? "Unable to delete bonus rule");
      return;
    }

    setRules((current) => current.filter((item) => item.id !== rule.id));
  }

  function closeModal() {
    setError("");
    setModal({ type: "closed" });
  }

  const editingRule = modal.type === "edit" ? modal.rule : null;

  return (
    <>
      <section className="space-y-2">
        <h1 className="text-2xl font-black text-calm-900">Bonus Rules</h1>
        <p className="text-sm font-medium text-calm-500">
          Customers use their add date. After the threshold is crossed, each extra completed lead earns the product bonus.
        </p>
      </section>

      <Card className="mt-6">
        <CardHeader
          action={
            <Button type="button" onClick={() => setModal({ type: "create" })}>
              <Plus size={17} />
              Add Product Rule
            </Button>
          }
          title="Product Bonus Settings"
        />
        {error && modal.type === "closed" ? (
          <div className="mx-5 mt-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Bonus Per Extra Lead</th>
                <th>Threshold</th>
                <th>Window</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length ? (
                rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="font-bold text-calm-900">{rule.product}</td>
                    <td className="font-semibold text-calm-900">{formatCurrency(rule.bonusAmount)}</td>
                    <td className="text-calm-600">After {rule.thresholdCount} completed</td>
                    <td className="text-calm-600">{rule.windowDays} days</td>
                    <td>
                      <Badge value={rule.active ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td>
                      <div className="flex min-w-20 gap-2">
                        <Button
                          aria-label={`Edit ${rule.product} bonus rule`}
                          className="h-9 w-9 px-0"
                          type="button"
                          variant="secondary"
                          onClick={() => setModal({ type: "edit", rule })}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          aria-label={`Delete ${rule.product} bonus rule`}
                          className="h-9 w-9 px-0"
                          disabled={busy === rule.id}
                          type="button"
                          variant="danger"
                          onClick={() => deleteRule(rule)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="text-sm text-calm-500" colSpan={6}>
                    No product bonus rules yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modal.type === "create" || modal.type === "edit"}
        title={modal.type === "edit" ? `Edit Rule: ${modal.rule.product}` : "Add Product Bonus Rule"}
        onClose={closeModal}
      >
        <form key={editingRule?.id ?? "create"} className="grid gap-4 md:grid-cols-2" onSubmit={submitRule}>
          <Field label="Product">
            <Input defaultValue={editingRule?.product ?? ""} name="product" placeholder="Insurance" required />
          </Field>
          <Field label="Bonus Per Extra Completed Lead">
            <Input defaultValue={editingRule?.bonusAmount ?? ""} min="0" name="bonusAmount" required step="1" type="number" />
          </Field>
          <Field label="Completed Lead Threshold">
            <Input defaultValue={editingRule?.thresholdCount ?? 10} min="1" name="thresholdCount" required type="number" />
          </Field>
          <Field label="Customer Add Date Window (days)">
            <Input defaultValue={editingRule?.windowDays ?? 2} min="1" name="windowDays" required type="number" />
          </Field>
          <label className="flex items-center gap-3 text-sm font-semibold text-calm-700 md:col-span-2">
            <input defaultChecked={editingRule?.active ?? true} name="active" type="checkbox" />
            Use this rule in bonus calculations
          </label>
          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 md:col-span-2">
              {error}
            </div>
          ) : null}
          <div className="flex justify-end gap-3 md:col-span-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button disabled={busy === "save"} type="submit">
              {busy === "save" ? "Saving..." : "Save Rule"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
