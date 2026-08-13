import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";

import { ok, routeError } from "@/lib/api";
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

    const passwordHash = await hashPassword(body.password);
    let user = null;

    // The employee ID is generated exclusively on the server. The client never submits it.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        user = await prisma.user.create({
          data: {
            employeeId: createEmployeeId(),
            name: body.name,
            passwordHash,
            role: "EMPLOYEE",
            mobile: body.mobile,
            email: body.email || null,
            state: body.state || null
          }
        });
        break;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
        throw error;
      }
    }

    if (!user) {
      throw Object.assign(new Error("Unable to issue an Employee ID. Please try again."), { status: 503 });
    }

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
    return routeError(error);
  }
}

function createEmployeeId() {
  return `EMP-${randomBytes(5).toString("hex").toUpperCase()}`;
}
