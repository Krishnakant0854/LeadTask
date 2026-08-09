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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-calm-200 px-5 py-4">
          <h2 className="text-base font-bold text-calm-900">{title}</h2>
          <Button
            aria-label="Close"
            className="h-9 w-9 px-0"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
