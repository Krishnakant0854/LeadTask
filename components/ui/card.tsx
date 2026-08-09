import { cn } from "@/lib/utils";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border border-calm-200 bg-white shadow-sm", className)}>
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
    <div className="flex items-center justify-between gap-3 border-b border-calm-200 px-5 py-4">
      <h2 className="text-base font-bold text-calm-900">{title}</h2>
      {action}
    </div>
  );
}
