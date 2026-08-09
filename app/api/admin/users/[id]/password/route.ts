import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security";
import { adminPasswordSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Params = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    assertCsrf(request);

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const body = adminPasswordSchema.parse(await request.json());
    await prisma.user.update({
      where: { id: params.id },
      data: {
        passwordHash: await hashPassword(body.password),
        sessions: { deleteMany: {} }
      }
    });

    return ok({ success: true });
  } catch (error) {
    return routeError(error);
  }
}
