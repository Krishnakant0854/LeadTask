import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { assertBonusProductIsAvailable, serializeBonusRule } from "@/lib/bonus-rules";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { bonusRuleSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const rules = await prisma.bonusRule.findMany({ orderBy: { product: "asc" } });
    return ok({ rules: rules.map(serializeBonusRule) });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertCsrf(request);
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const body = bonusRuleSchema.parse(await request.json());
    await assertBonusProductIsAvailable(body.product);

    const rule = await prisma.bonusRule.create({
      data: body
    });

    return ok({ rule: serializeBonusRule(rule) }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
