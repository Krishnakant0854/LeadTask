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
    const [, user] = await Promise.all([
      assertLoginAllowed(body.employeeId, request),
      prisma.user.findUnique({
        where: { employeeId: body.employeeId }
      })
    ]);

    const nameMatches = user?.name.trim().toLowerCase() === body.name.trim().toLowerCase();
    const passwordMatches = user
      ? await verifyPassword(body.password, user.passwordHash)
      : false;

    if (!user || !nameMatches || !passwordMatches) {
      await recordFailedLogin(body.employeeId, request);
      return NextResponse.json({ error: "Invalid login details" }, { status: 401 });
    }

    await Promise.all([
      createSession(user.id),
      // A stale lockout record must not prevent an otherwise valid sign-in.
      clearFailedLogins(body.employeeId, request).catch(() => undefined)
    ]);

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
