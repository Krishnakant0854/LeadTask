import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { calculateBonusSummary } from "@/lib/bonus";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = {
  params: { id: string };
};

export async function GET(_: Request, { params }: Params) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const [user, leadIncome, bonusSummary, withdrawn, withdrawals] = await Promise.all([
      prisma.user.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          employeeId: true,
          name: true,
          role: true,
          bankAccount: {
            select: {
              holderName: true,
              accountNumber: true,
              ifsc: true,
              bankName: true
            }
          }
        }
      }),
      prisma.leadProcess.aggregate({
        where: {
          status: "COMPLETED",
          customer: { userId: params.id }
        },
        _sum: { income: true }
      }),
      calculateBonusSummary(params.id),
      prisma.withdrawal.aggregate({
        where: {
          userId: params.id,
          status: { in: ["APPROVED", "PAID"] }
        },
        _sum: { amount: true }
      }),
      prisma.withdrawal.findMany({
        where: { userId: params.id },
        orderBy: { date: "desc" },
        take: 12
      })
    ]);

    if (!user || user.role !== "EMPLOYEE") {
      throw Object.assign(new Error("Employee not found"), { status: 404 });
    }

    const salesIncome = toNumber(leadIncome._sum.income);
    const bonusIncome = bonusSummary.totalBonus;
    const totalIncome = salesIncome + bonusIncome;
    const totalWithdrawn = toNumber(withdrawn._sum.amount);

    return ok({
      employee: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name
      },
      bank: user.bankAccount,
      income: {
        salesIncome,
        bonusIncome,
        totalIncome,
        withdrawn: totalWithdrawn,
        available: Math.max(totalIncome - totalWithdrawn, 0)
      },
      withdrawals: withdrawals.map((withdrawal) => ({
        id: withdrawal.id,
        amount: toNumber(withdrawal.amount),
        date: withdrawal.date.toISOString(),
        status: withdrawal.status
      }))
    });
  } catch (error) {
    return routeError(error);
  }
}
