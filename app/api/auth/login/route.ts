import { NextResponse } from "next/server";

import { createSession } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { assertLoginAllowed, clearFailedLogins, recordFailedLogin } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/security";
import { loginSchema } from "@/lib/validation";
import { routeError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertCsrf(request);
    const body = loginSchema.parse(await request.json());
    await assertLoginAllowed(body.employeeId, request);

    const user = await prisma.user.findUnique({
      where: { employeeId: body.employeeId }
    });

    const nameMatches = user?.name.trim().toLowerCase() === body.name.trim().toLowerCase();
    const passwordMatches = user
      ? await verifyPassword(body.password, user.passwordHash)
      : false;

    if (!user || !nameMatches || !passwordMatches) {
      await recordFailedLogin(body.employeeId, request);
      return NextResponse.json({ error: "Invalid login details" }, { status: 401 });
    }

    await clearFailedLogins(body.employeeId, request);
    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role
      },
      redirectTo: user.role === "ADMIN" ? "/admin/dashboard" : "/home"
    });
  } catch (error) {
    return routeError(error);
  }
}
