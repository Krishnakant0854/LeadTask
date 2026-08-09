import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { customerWhereFromSearch } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const url = new URL(request.url);
    const where = customerWhereFromSearch(url.searchParams);

    const customers = await prisma.customer.findMany({
      where,
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

    return ok({
      customers: customers.map((customer) => ({
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
      }))
    });
  } catch (error) {
    return routeError(error);
  }
}
