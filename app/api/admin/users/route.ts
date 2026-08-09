import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security";
import { adminUserCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const users = await prisma.user.findMany({
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
      },
      orderBy: { createdAt: "desc" }
    });

    return ok({ users });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertCsrf(request);

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const body = adminUserCreateSchema.parse(await request.json());
    const user = await prisma.user.create({
      data: {
        employeeId: body.employeeId,
        name: body.name,
        passwordHash: await hashPassword(body.password),
        role: body.role,
        mobile: body.mobile || null,
        email: body.email || null,
        state: body.state || null
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

    return ok({ user }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
