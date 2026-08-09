import { Prisma } from "@prisma/client";

import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { leadUpdateSchema } from "@/lib/validation";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = {
  params: { customerId: string };
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    assertCsrf(request);

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const body = leadUpdateSchema.parse(await request.json());
    if (body.status === "REJECTED" && !body.rejectionReason) {
      throw Object.assign(new Error("Rejection reason is required"), { status: 422 });
    }

    const progress = body.status === "COMPLETED" ? 100 : body.progress;
    const lead = await prisma.leadProcess.upsert({
      where: { customerId: params.customerId },
      update: {
        status: body.status,
        progress,
        income: new Prisma.Decimal(body.income),
        rejectionReason: body.status === "REJECTED" ? body.rejectionReason : null
      },
      create: {
        customerId: params.customerId,
        status: body.status,
        progress,
        income: new Prisma.Decimal(body.income),
        rejectionReason: body.status === "REJECTED" ? body.rejectionReason : null
      }
    });

    return ok({
      leadProcess: {
        status: lead.status,
        progress: lead.progress,
        income: toNumber(lead.income),
        rejectionReason: lead.rejectionReason
      }
    });
  } catch (error) {
    return routeError(error);
  }
}
