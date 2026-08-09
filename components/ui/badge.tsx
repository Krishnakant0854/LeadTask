import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  NEW_LEAD: "bg-sky-50 text-sky-700 ring-sky-100",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-100",
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-100",
  EMPLOYEE: "bg-slate-50 text-slate-700 ring-slate-100",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-100",
  APPROVED: "bg-sky-50 text-sky-700 ring-sky-100",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  INACTIVE: "bg-calm-100 text-calm-700 ring-calm-200"
};

export function Badge({
  value,
  className
}: {
  value: string;
  className?: string;
}) {
  const label = value.replaceAll("_", " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        styles[value] ?? "bg-calm-100 text-calm-700 ring-calm-200",
        className
      )}
    >
      {label}
    </span>
  );
}
