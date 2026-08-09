import { AdminLeadsManager } from "@/components/admin/AdminLeadsManager";
import { customerWhereFromSearch } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import type { CustomerRow } from "@/types/app";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = paramsFromSearch(searchParams);
  const customers = await prisma.customer.findMany({
    where: customerWhereFromSearch(params),
    include: {
      leadProcess: true,
      user: {
        select: {
          id: true,
          employeeId: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const rows: CustomerRow[] = customers.map((customer) => ({
    id: customer.id,
    customerName: customer.customerName,
    mobile: customer.mobile,
    product: customer.product,
    date: customer.date.toISOString(),
    employee: customer.user,
    leadProcess: {
      status: customer.leadProcess?.status ?? "NEW_LEAD",
      progress: customer.leadProcess?.progress ?? 0,
      income: toNumber(customer.leadProcess?.income),
      rejectionReason: customer.leadProcess?.rejectionReason ?? null
    }
  }));

  return <AdminLeadsManager initialCustomers={rows} />;
}

function paramsFromSearch(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const key of ["name", "product", "date", "employeeId"]) {
    const value = searchParams[key];
    if (typeof value === "string") params.set(key, value);
  }
  return params;
}
