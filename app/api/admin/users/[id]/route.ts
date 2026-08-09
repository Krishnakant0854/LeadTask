import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { adminUserUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Params = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    assertCsrf(request);

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const body = adminUserUpdateSchema.parse(await request.json());
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        employeeId: body.employeeId,
        name: body.name,
        mobile: body.mobile || null,
        email: body.email || null,
        state: body.state || null,
        role: body.role
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        mobile: true,
        email: true,
        state: true,
        photoUrl: true,
        createdAt: true
      }
    });

    return ok({ user });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    assertCsrf(request);

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();
    if (currentUser.id === params.id) {
      throw Object.assign(new Error("You cannot delete your own admin account"), { status: 422 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    return ok({ success: true });
  } catch (error) {
    return routeError(error);
  }
}
