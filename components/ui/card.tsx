import { cn } from "@/lib/utils";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("overflow-hidden rounded-lg border border-calm-200 bg-white shadow-panel", className)}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  action
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-calm-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <h2 className="text-base font-bold text-calm-900">{title}</h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
