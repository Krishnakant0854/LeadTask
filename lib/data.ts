import type { Prisma } from "@prisma/client";

import { filterSchema } from "@/lib/validation";

export function customerWhereFromSearch(
  params: URLSearchParams,
  options?: { userId?: string }
): Prisma.CustomerWhereInput {
  const filters = filterSchema.parse({
    name: params.get("name") ?? "",
    product: params.get("product") ?? "",
    date: params.get("date") ?? "",
    employeeId: params.get("employeeId") ?? ""
  });

  const where: Prisma.CustomerWhereInput = {};

  if (options?.userId) {
    where.userId = options.userId;
  }

  if (filters.name) {
    where.customerName = { contains: filters.name, mode: "insensitive" };
  }

  if (filters.product) {
    where.product = { contains: filters.product, mode: "insensitive" };
  }

  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    where.date = { gte: start, lt: end };
  }

  if (filters.employeeId) {
    where.user = { employeeId: { contains: filters.employeeId, mode: "insensitive" } };
  }

  return where;
}
