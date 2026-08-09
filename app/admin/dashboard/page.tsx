import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { calculateBonusSummary } from "@/lib/bonus";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [employeeCount, customerCount, completedCount, rejectedCount, income, bonusSummary, pendingWithdrawals, recentCustomers] =
    await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.customer.count(),
      prisma.leadProcess.count({ where: { status: "COMPLETED" } }),
      prisma.leadProcess.count({ where: { status: "REJECTED" } }),
      prisma.leadProcess.aggregate({
        where: { status: "COMPLETED" },
        _sum: { income: true }
      }),
      calculateBonusSummary(),
      prisma.withdrawal.count({ where: { status: "PENDING" } }),
      prisma.customer.findMany({
        take: 8,
        include: {
          leadProcess: true,
          user: { select: { employeeId: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

  const stats = [
    { label: "Employees", value: employeeCount, href: "/admin/users" },
    { label: "Customers", value: customerCount, href: "/admin/customers" },
    { label: "Completed", value: completedCount, href: "/admin/leads" },
    { label: "Rejected", value: rejectedCount, href: "/admin/leads" },
    { label: "Total Income", value: formatCurrency(toNumber(income._sum.income)), href: "/admin/leads" },
    { label: "Bonus Earned", value: formatCurrency(bonusSummary.totalBonus), href: "/admin/bonus" },
    { label: "Pending Withdrawals", value: pendingWithdrawals, href: "/admin/withdrawals" }
  ];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-black text-calm-900">Dashboard</h1>
        <p className="mt-1 text-sm font-medium text-calm-500">Live overview of employees, customers, leads, and income.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {stats.map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="p-4 transition duration-150 hover:border-brand-100 hover:shadow-soft sm:p-5">
              <p className="text-sm font-bold text-calm-500">{item.label}</p>
              <p className="mt-2 truncate text-2xl font-black text-calm-900 sm:text-3xl">{item.value}</p>
            </Card>
          </Link>
        ))}
      </section>

      <Card>
        <CardHeader title="Recent Customers" />
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
