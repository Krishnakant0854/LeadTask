import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-semibold text-calm-700">{children}</label>;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      className={cn(
        "focus-ring h-11 w-full rounded-md border border-calm-200 bg-white px-3 text-sm text-calm-900 placeholder:text-calm-500 transition hover:border-calm-300 focus:border-brand-500",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "focus-ring h-11 w-full rounded-md border border-calm-200 bg-white px-3 text-sm text-calm-900 transition placeholder:text-calm-500 hover:border-calm-300 focus:border-brand-500",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "focus-ring min-h-28 w-full rounded-md border border-calm-200 bg-white px-3 py-2.5 text-sm text-calm-900 placeholder:text-calm-500 transition hover:border-calm-300 focus:border-brand-500",
        className
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
