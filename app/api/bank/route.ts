import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { bankSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const bank = await prisma.bankAccount.findUnique({
      where: { userId: user.id }
    });

    return ok({ bank });
  } catch (error) {
    return routeError(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertCsrf(request);
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = bankSchema.parse(await request.json());
    const bank = await prisma.bankAccount.upsert({
      where: { userId: user.id },
      update: body,
      create: {
        ...body,
        userId: user.id
      }
    });

    return ok({ bank });
  } catch (error) {
    return routeError(error);
  }
}
