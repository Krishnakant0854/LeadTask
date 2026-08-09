import { Prisma } from "@prisma/client";

import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { customerWhereFromSearch } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { customerCreateSchema } from "@/lib/validation";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const url = new URL(request.url);
    const where = customerWhereFromSearch(url.searchParams, { userId: user.id });

    const customers = await prisma.customer.findMany({
      where,
      include: { leadProcess: true },
      orderBy: { createdAt: "desc" }
    });

    return ok({
      customers: customers.map((customer) => ({
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
      }))
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertCsrf(request);

    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = customerCreateSchema.parse(await request.json());
    const date = new Date(`${body.date}T00:00:00.000Z`);

    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        customerName: body.customerName,
        mobile: body.mobile,
        product: body.product,
        date,
        leadProcess: {
          create: {
            status: "NEW_LEAD",
            progress: 0,
            income: new Prisma.Decimal(0)
          }
        }
      },
      include: { leadProcess: true }
    });

    return ok({
      customer: {
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
      }
    });
  } catch (error) {
    return routeError(error);
  }
}
