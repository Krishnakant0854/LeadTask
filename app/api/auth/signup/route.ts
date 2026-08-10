import { Prisma } from "@prisma/client";

import { fail, ok, routeError } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { assertSignupAllowed, recordSignupAttempt } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/security";
import { selfSignupSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertCsrf(request);
    const body = selfSignupSchema.parse(await request.json());

    await assertSignupAllowed(request);
    await recordSignupAttempt(request);

    const user = await prisma.user.create({
      data: {
        employeeId: body.employeeId,
        name: body.name,
        passwordHash: await hashPassword(body.password),
        role: "EMPLOYEE",
        mobile: body.mobile,
        email: body.email || null,
        state: body.state || null
      }
    });

    await createSession(user.id);

    return ok({
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role
      },
      redirectTo: "/home"
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("This Employee ID is already registered", 409);
    }

    return routeError(error);
  }
}
