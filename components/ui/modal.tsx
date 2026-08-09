"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Modal({
  title,
  open,
  onClose,
  children
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3 sm:p-5">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-soft sm:max-h-[calc(100dvh-2.5rem)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-calm-200 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-base font-bold text-calm-900">{title}</h2>
          <Button
            aria-label="Close"
            className="h-10 w-10 px-0"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>
        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
