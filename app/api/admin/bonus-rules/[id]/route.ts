import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { assertBonusProductIsAvailable, serializeBonusRule } from "@/lib/bonus-rules";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { bonusRuleSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    assertCsrf(request);
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const body = bonusRuleSchema.parse(await request.json());
    await assertBonusProductIsAvailable(body.product, params.id);

    const rule = await prisma.bonusRule.update({
      where: { id: params.id },
      data: body
    });

    return ok({ rule: serializeBonusRule(rule) });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    assertCsrf(request);
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    await prisma.bonusRule.delete({ where: { id: params.id } });
    return ok({ success: true });
  } catch (error) {
    return routeError(error);
  }
}
