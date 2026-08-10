import type { LeadStatus } from "@prisma/client";
import {
  Activity,
  ArrowRight,
  BadgeIndianRupee,
  BarChart3,
  CheckCircle2,
  CircleDotDashed,
  Clock3,
  Percent,
  Target,
  TrendingUp,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { calculateBonusSummary } from "@/lib/bonus";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type DashboardLead = {
  status: LeadStatus;
  progress: number;
  income: unknown;
  updatedAt: Date;
  customer: {
    id: string;
    customerName: string;
    product: string;
    date: Date;
    createdAt: Date;
    user: {
      id: string;
      employeeId: string;
      name: string;
    };
  };
};

const statusOrder: LeadStatus[] = ["NEW_LEAD", "IN_PROGRESS", "COMPLETED", "REJECTED"];

const statusLabels: Record<LeadStatus, string> = {
  NEW_LEAD: "New Leads",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected"
};

const statusBars: Record<LeadStatus, string> = {
  NEW_LEAD: "bg-sky-500",
  IN_PROGRESS: "bg-amber-500",
  COMPLETED: "bg-emerald-500",
  REJECTED: "bg-rose-500"
};

export default async function AdminDashboardPage() {
  const [employeeCount, customerCount, bonusSummary, pendingWithdrawals, recentCustomers, leadRows] =
    await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.customer.count(),
      calculateBonusSummary(),
      prisma.withdrawal.count({ where: { status: "PENDING" } }),
      prisma.customer.findMany({
        take: 8,
        include: {
          leadProcess: true,
          user: { select: { employeeId: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.leadProcess.findMany({
        select: {
          status: true,
          progress: true,
          income: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              customerName: true,
              product: true,
              date: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  employeeId: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { updatedAt: "desc" }
      })
    ]);

  const statusCounts = countStatuses(leadRows);
  const completedCount = statusCounts.COMPLETED;
  const rejectedCount = statusCounts.REJECTED;
  const openCount = statusCounts.NEW_LEAD + statusCounts.IN_PROGRESS;
  const totalIncome = leadRows.reduce(
    (total, lead) => (lead.status === "COMPLETED" ? total + toNumber(lead.income) : total),
    0
  );
  const averageProgress = leadRows.length
    ? Math.round(leadRows.reduce((total, lead) => total + lead.progress, 0) / leadRows.length)
    : 0;
  const conversionRate = getRate(completedCount, customerCount);
  const rejectionRate = getRate(rejectedCount, customerCount);
  const productPerformance = buildProductPerformance(leadRows);
  const employeePerformance = buildEmployeePerformance(leadRows);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newThisWeek = leadRows.filter((lead) => lead.customer.createdAt >= sevenDaysAgo).length;
  const completedThisWeek = leadRows.filter(
    (lead) => lead.status === "COMPLETED" && lead.updatedAt >= sevenDaysAgo
  ).length;
  const incomeThisWeek = leadRows.reduce(
    (total, lead) =>
      lead.status === "COMPLETED" && lead.updatedAt >= sevenDaysAgo ? total + toNumber(lead.income) : total,
    0
  );

  const stats = [
    {
      label: "Employees",
      value: employeeCount,
      detail: `${employeePerformance.length} active in leaderboard`,
      href: "/admin/users",
      icon: UsersRound
    },
    {
      label: "Customers",
      value: customerCount,
      detail: `${newThisWeek} added in the last 7 days`,
      href: "/admin/customers",
      icon: Target
    },
    {
      label: "Open Pipeline",
      value: openCount,
      detail: `${averageProgress}% average progress`,
      href: "/admin/leads",
      icon: CircleDotDashed
    },
    {
      label: "Conversion",
      value: formatPercent(conversionRate),
      detail: `${completedCount} completed leads`,
      href: "/admin/leads",
      icon: Percent
    },
    {
      label: "Total Income",
      value: formatCurrency(totalIncome),
      detail: `${formatCurrency(incomeThisWeek)} in the last 7 days`,
      href: "/admin/leads",
      icon: BadgeIndianRupee
    },
    {
      label: "Bonus Earned",
      value: formatCurrency(bonusSummary.totalBonus),
      detail: `${bonusSummary.breakdown.length} active product rules`,
      href: "/admin/bonus",
      icon: TrendingUp
    },
    {
      label: "Pending Withdrawals",
      value: pendingWithdrawals,
      detail: "Awaiting admin action",
      href: "/admin/withdrawals",
      icon: Clock3
    },
    {
      label: "Rejected",
      value: rejectedCount,
      detail: `${formatPercent(rejectionRate)} rejection rate`,
      href: "/admin/leads",
      icon: Activity
    }
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-calm-900">Dashboard</h1>
          <p className="mt-1 text-sm font-medium text-calm-500">
            Live operations view for pipeline health, employee output, and revenue movement.
          </p>
        </div>
        <Link
          className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition duration-150 hover:bg-brand-700 hover:shadow-panel"
          href="/admin/leads"
        >
          Manage Leads
          <ArrowRight size={17} />
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card>
          <CardHeader
            action={
              <span className="text-xs font-bold uppercase text-calm-500">
                {leadRows.length} tracked leads
              </span>
            }
            title="Lead Status Funnel"
          />
          <div className="space-y-4 p-4 sm:p-5">
            {statusOrder.map((status) => (
              <StatusRow
                count={statusCounts[status]}
                key={status}
                label={statusLabels[status]}
                percent={getRate(statusCounts[status], customerCount)}
                status={status}
              />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Operations Health" />
          <div className="grid gap-4 p-4 sm:p-5">
            <HealthMeter label="Conversion Rate" value={conversionRate} />
            <HealthMeter label="Average Progress" value={averageProgress} />
            <HealthMeter inverse label="Rejection Rate" value={rejectionRate} />
            <div className="grid grid-cols-2 gap-3 border-t border-calm-200 pt-4">
              <MiniMetric label="New in 7 Days" value={newThisWeek} />
              <MiniMetric label="Won in 7 Days" value={completedThisWeek} />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            action={
              <Link className="text-sm font-bold text-brand-700 hover:text-brand-600" href="/admin/bonus">
                Bonus Rules
              </Link>
            }
            title="Product Performance"
          />
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Leads</th>
                  <th>Completed</th>
                  <th>Conversion</th>
                  <th>Income</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.length ? (
                  productPerformance.map((product) => (
                    <tr key={product.product}>
                      <td className="font-bold text-calm-900">{product.product}</td>
                      <td className="font-semibold text-calm-700">{product.leads}</td>
                      <td className="font-semibold text-calm-700">{product.completed}</td>
                      <td className="min-w-36">
                        <InlineMeter value={product.conversion} />
                      </td>
                      <td className="font-semibold text-calm-900">{formatCurrency(product.income)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-sm text-calm-500" colSpan={5}>
                      Product analytics will appear after leads are created.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            action={
              <Link className="text-sm font-bold text-brand-700 hover:text-brand-600" href="/admin/users">
                Employees
              </Link>
            }
            title="Top Employees"
          />
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leads</th>
                  <th>Completed</th>
                  <th>Conversion</th>
                  <th>Income</th>
                </tr>
              </thead>
              <tbody>
                {employeePerformance.length ? (
                  employeePerformance.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <p className="font-bold text-calm-900">{employee.name}</p>
                        <p className="text-xs font-semibold text-calm-500">{employee.employeeId}</p>
                      </td>
                      <td className="font-semibold text-calm-700">{employee.leads}</td>
                      <td className="font-semibold text-calm-700">{employee.completed}</td>
                      <td className="min-w-36">
                        <InlineMeter value={employee.conversion} />
                      </td>
                      <td className="font-semibold text-calm-900">{formatCurrency(employee.income)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="text-sm text-calm-500" colSpan={5}>
                      Employee performance will appear after leads are created.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader
          action={
            <Link className="text-sm font-bold text-brand-700 hover:text-brand-600" href="/admin/customers">
              View All
            </Link>
          }
          title="Recent Customers"
        />
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Employee</th>
                <th>Product</th>
                <th>Date</th>
                <th>Status</th>
                <th>Income</th>
              </tr>
            </thead>
            <tbody>
              {recentCustomers.length ? (
                recentCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="font-bold text-calm-900">{customer.customerName}</td>
                    <td>
                      <p className="font-semibold text-calm-900">{customer.user.name}</p>
                      <p className="text-xs font-semibold text-calm-500">{customer.user.employeeId}</p>
                    </td>
                    <td className="text-calm-600">{customer.product}</td>
                    <td className="text-calm-600">{formatDate(customer.date)}</td>
                    <td>
                      <Badge value={customer.leadProcess?.status ?? "NEW_LEAD"} />
                    </td>
                    <td className="font-semibold text-calm-900">
                      {formatCurrency(toNumber(customer.leadProcess?.income))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="text-sm text-calm-500" colSpan={6}>
                    No customer records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  href,
  icon: Icon
}: {
  label: string;
  value: string | number;
  detail: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link className="block h-full" href={href}>
      <Card className="flex h-full min-h-32 flex-col justify-between p-4 transition duration-150 hover:border-brand-100 hover:shadow-soft sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-calm-500">{label}</p>
            <p className="mt-2 truncate text-2xl font-black text-calm-900">{value}</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            <Icon size={20} />
          </span>
        </div>
        <p className="mt-4 line-clamp-2 text-xs font-semibold text-calm-500">{detail}</p>
      </Card>
    </Link>
  );
}

function StatusRow({
  status,
  label,
  count,
  percent
}: {
  status: LeadStatus;
  label: string;
  count: number;
  percent: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${statusBars[status]}`} />
          <p className="text-sm font-bold text-calm-900">{label}</p>
        </div>
        <p className="text-sm font-black text-calm-900">{count}</p>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-calm-100">
        <div
          className={`h-2.5 rounded-full transition-[width] duration-300 ${statusBars[status]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs font-semibold text-calm-500">{formatPercent(percent)} of all customers</p>
    </div>
  );
}

function HealthMeter({
  label,
  value,
  inverse = false
}: {
  label: string;
  value: number;
  inverse?: boolean;
}) {
  const tone = inverse ? (value <= 10 ? "bg-emerald-500" : value <= 25 ? "bg-amber-500" : "bg-rose-500") : "bg-brand-600";

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-calm-700">{label}</p>
        <p className="text-sm font-black text-calm-900">{formatPercent(value)}</p>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-calm-100">
        <div className={`h-2.5 rounded-full ${tone}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function InlineMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 shrink-0 rounded-full bg-calm-100">
        <div className="h-2 rounded-full bg-brand-600" style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs font-bold text-calm-600">{formatPercent(value)}</span>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-calm-200 bg-calm-50 p-3">
      <p className="text-xs font-bold uppercase text-calm-500">{label}</p>
      <p className="mt-1 text-xl font-black text-calm-900">{value}</p>
    </div>
  );
}

function countStatuses(leads: DashboardLead[]) {
  const counts: Record<LeadStatus, number> = {
    NEW_LEAD: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    REJECTED: 0
  };

  for (const lead of leads) {
    counts[lead.status] += 1;
  }

  return counts;
}

function buildProductPerformance(leads: DashboardLead[]) {
  const byProduct = new Map<
    string,
    {
      product: string;
      leads: number;
      completed: number;
      rejected: number;
      income: number;
    }
  >();

  for (const lead of leads) {
    const product = lead.customer.product.trim() || "Unspecified";
    const current = byProduct.get(product.toLowerCase()) ?? {
      product,
      leads: 0,
      completed: 0,
      rejected: 0,
      income: 0
    };

    current.leads += 1;
    if (lead.status === "COMPLETED") {
      current.completed += 1;
      current.income += toNumber(lead.income);
    }
    if (lead.status === "REJECTED") {
      current.rejected += 1;
    }

    byProduct.set(product.toLowerCase(), current);
  }

  return Array.from(byProduct.values())
    .map((item) => ({
      ...item,
      conversion: getRate(item.completed, item.leads)
    }))
    .sort((left, right) => right.income - left.income || right.completed - left.completed || right.leads - left.leads)
    .slice(0, 6);
}

function buildEmployeePerformance(leads: DashboardLead[]) {
  const byEmployee = new Map<
    string,
    {
      id: string;
      employeeId: string;
      name: string;
      leads: number;
      completed: number;
      income: number;
    }
  >();

  for (const lead of leads) {
    const employee = lead.customer.user;
    const current = byEmployee.get(employee.id) ?? {
      id: employee.id,
      employeeId: employee.employeeId,
      name: employee.name,
      leads: 0,
      completed: 0,
      income: 0
    };

    current.leads += 1;
    if (lead.status === "COMPLETED") {
      current.completed += 1;
      current.income += toNumber(lead.income);
    }

    byEmployee.set(employee.id, current);
  }

  return Array.from(byEmployee.values())
    .map((item) => ({
      ...item,
      conversion: getRate(item.completed, item.leads)
    }))
    .sort((left, right) => right.income - left.income || right.completed - left.completed || right.leads - left.leads)
    .slice(0, 6);
}

function getRate(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function formatPercent(value: number) {
  return `${value}%`;
}
