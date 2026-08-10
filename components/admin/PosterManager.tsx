"use client";

import { ExternalLink, ImagePlus } from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { csrfFetch } from "@/lib/client/csrf";
import { formatDate } from "@/lib/utils";

type Poster = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  active: boolean;
  createdAt: string;
} | null;

export function PosterManager({ activePoster }: { activePoster: Poster }) {
  const [poster, setPoster] = useState(activePoster);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const response = await csrfFetch("/api/admin/poster", {
      method: "POST",
      body: form
    }).catch(() => null);
    setBusy(false);

    if (!response || !response.ok) {
      const data = response ? await response.json().catch(() => null) : null;
      setMessage(data?.error ?? "Unable to update poster");
      return;
    }

    const data = (await response.json()) as { poster: Poster };
    setPoster(data.poster);
    setMessage("Poster updated for all employees");
    event.currentTarget.reset();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader title="Active Poster" />
        <div className="p-5">
          <div className="relative overflow-hidden rounded-lg border border-calm-200 bg-calm-50">
            <Image
              alt="Active poster"
              className="h-64 w-full object-cover"
              height={420}
              src={poster?.imageUrl ?? "/poster-placeholder.svg"}
              width={1400}
            />
          </div>
          <p className="mt-3 text-sm font-semibold text-calm-500">
            {poster?.createdAt ? `Activated ${formatDate(poster.createdAt)}` : "Default poster is active"}
          </p>
          {poster?.linkUrl ? (
            <a
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800"
              href={poster.linkUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              View poster destination
              <ExternalLink size={15} />
            </a>
          ) : null}
        </div>
      </Card>

      <Card>
        <CardHeader title="Upload Poster" />
        <form className="space-y-4 p-5" onSubmit={submit}>
          <Field label="Poster Image">
            <Input accept="image/*" name="poster" type="file" />
          </Field>
          <Field label="Image URL">
            <Input name="imageUrl" placeholder="https://..." type="url" />
          </Field>
          <Field label="Poster Destination Link (optional)">
            <Input name="linkUrl" placeholder="https://example.com" type="url" />
          </Field>
          {message ? <p className="text-sm font-semibold text-brand-700">{message}</p> : null}
          <Button disabled={busy} type="submit">
            <ImagePlus size={17} />
            {busy ? "Uploading..." : "Set Active Poster"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
