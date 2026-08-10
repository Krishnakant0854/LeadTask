"use client";

import { ExternalLink, Headset, Save, UsersRound } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { csrfFetch } from "@/lib/client/csrf";

type QuickLinks = {
  customerSupportUrl: string | null;
  groupUrl: string | null;
};

export function QuickLinksManager({ initialLinks }: { initialLinks: QuickLinks }) {
  const [links, setLinks] = useState(initialLinks);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const response = await csrfFetch("/api/admin/quick-links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerSupportUrl: form.get("customerSupportUrl"),
        groupUrl: form.get("groupUrl")
      })
    }).catch(() => null);

    setBusy(false);

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setError(data?.error ?? "Unable to save quick links");
      return;
    }

    const data = (await response.json()) as { links: QuickLinks };
    setLinks(data.links);
    setMessage("Quick links updated for employees");
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-black text-calm-900">Quick Links</h1>
        <p className="mt-1 text-sm font-medium text-calm-500">
          Set the destinations shown as support and group icons in the employee navigation.
        </p>
      </section>

      <Card className="max-w-3xl">
        <CardHeader title="Employee Navigation Links" />
        <form className="space-y-5 p-4 sm:p-5" onSubmit={submit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-calm-800">
                <Headset className="text-brand-700" size={19} />
                Customer Support
              </div>
              <Field label="Support Link">
                <Input
                  defaultValue={links.customerSupportUrl ?? ""}
                  name="customerSupportUrl"
                  placeholder="https://wa.me/..."
                  type="url"
                />
              </Field>
              <QuickLinkPreview label="Open support link" url={links.customerSupportUrl} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-calm-800">
                <UsersRound className="text-brand-700" size={19} />
                Group
              </div>
              <Field label="Group Link">
                <Input
                  defaultValue={links.groupUrl ?? ""}
                  name="groupUrl"
                  placeholder="https://chat.whatsapp.com/..."
                  type="url"
                />
              </Field>
              <QuickLinkPreview label="Open group link" url={links.groupUrl} />
            </div>
          </div>

          <p className="text-xs font-medium text-calm-500">Use HTTPS URLs. Leave a field blank to hide its icon from employees.</p>

          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>
          ) : null}
          {message ? <p className="text-sm font-semibold text-brand-700">{message}</p> : null}

          <Button disabled={busy} type="submit">
            <Save size={17} />
            {busy ? "Saving..." : "Save Quick Links"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function QuickLinkPreview({ label, url }: { label: string; url: string | null }) {
  if (!url) return null;

  return (
    <a
      className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800"
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      {label}
      <ExternalLink size={15} />
    </a>
  );
}
