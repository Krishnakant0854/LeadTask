import { redirect } from "next/navigation";

import { EmployeeHome } from "@/components/employee/EmployeeHome";
import { requireUser } from "@/lib/auth";
import { customerWhereFromSearch } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import type { CustomerRow, SessionUser } from "@/types/app";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin/dashboard");

  const params = new URLSearchParams();
  for (const key of ["name", "product", "date"]) {
    const value = searchParams[key];
    if (typeof value === "string") params.set(key, value);
  }

  const [poster, customers] = await Promise.all([
    prisma.poster.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    prisma.customer.findMany({
      where: customerWhereFromSearch(params, { userId: user.id }),
      include: { leadProcess: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const sessionUser: SessionUser = {
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    role: user.role,
    mobile: user.mobile,
    email: user.email,
    state: user.state,
    photoUrl: user.photoUrl
  };

  const rows: CustomerRow[] = customers.map((customer) => ({
    id: customer.id,
    customerName: customer.customerName,
    mobile: customer.mobile,
    product: customer.product,
    date: customer.date.toISOString(),
    leadProcess: {
      status: customer.leadProcess?.status ?? "NEW_LEAD",
      progress: customer.leadProcess?.progress ?? 0,
      income: toNumber(customer.leadProcess?.income),
      rejectionReason: customer.leadProcess?.rejectionReason ?? null
    }
  }));

  return (
    <EmployeeHome
      customers={rows}
      posterLinkUrl={poster?.linkUrl ?? null}
      posterUrl={poster?.imageUrl ?? "/poster-placeholder.svg"}
      user={sessionUser}
    />
  );
}
