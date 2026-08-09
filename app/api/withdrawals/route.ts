import { Prisma } from "@prisma/client";

import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { calculateBonusSummary } from "@/lib/bonus";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" }
    });

    return ok({
      withdrawals: withdrawals.map((item) => ({
        id: item.id,
        amount: toNumber(item.amount),
        date: item.date.toISOString(),
        status: item.status
      }))
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertCsrf(request);
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = (await request.json()) as { amount?: number };
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw Object.assign(new Error("Enter a valid withdrawal amount"), { status: 422 });
    }

    const [income, bonusSummary, withdrawn] = await Promise.all([
      prisma.leadProcess.aggregate({
        where: {
          status: "COMPLETED",
          customer: { userId: user.id }
        },
        _sum: { income: true }
      }),
      calculateBonusSummary(user.id),
      prisma.withdrawal.aggregate({
        where: {
          userId: user.id,
          status: { in: ["APPROVED", "PAID"] }
        },
        _sum: { amount: true }
      })
    ]);

    const available = toNumber(income._sum.income) + bonusSummary.totalBonus - toNumber(withdrawn._sum.amount);
    if (amount > available) {
      throw Object.assign(new Error("Withdrawal amount is higher than available balance"), {
        status: 422
      });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.id,
        amount: new Prisma.Decimal(amount),
        status: "PENDING"
      }
    });

    return ok({
      withdrawal: {
        id: withdrawal.id,
        amount: toNumber(withdrawal.amount),
        date: withdrawal.date.toISOString(),
        status: withdrawal.status
      }
    });
  } catch (error) {
    return routeError(error);
  }
}
