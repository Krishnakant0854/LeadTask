import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { withdrawalUpdateSchema } from "@/lib/validation";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    assertCsrf(request);

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const body = withdrawalUpdateSchema.parse(await request.json());
    const withdrawal = await prisma.withdrawal.update({
      where: { id: params.id },
      data: { status: body.status }
    });

    return ok({
      withdrawal: {
        id: withdrawal.id,
        amount: toNumber(withdrawal.amount),
        date: withdrawal.date.toISOString(),
        status: withdrawal.status
      }
    });
  } catch (error) {
    return routeError(error);
  }
}
