import { ProfilePanel } from "@/components/employee/ProfilePanel";
import { requireUser } from "@/lib/auth";
import { calculateBonusSummary } from "@/lib/bonus";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import type { SessionUser, WithdrawalRow } from "@/types/app";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  const [bank, withdrawals, salesIncome, bonusSummary, withdrawn] = await Promise.all([
    prisma.bankAccount.findUnique({ where: { userId: user.id } }),
    prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" }
    }),
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

  const sessionUser: SessionUser = {
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    role: user.role,
    mobile: user.mobile,
    email: user.email,
    state: user.state,
    photoUrl: user.photoUrl
  };

  const sales = toNumber(salesIncome._sum.income);
  const bonus = bonusSummary.totalBonus;
  const total = sales + bonus;
  const paid = toNumber(withdrawn._sum.amount);

  const withdrawalRows: WithdrawalRow[] = withdrawals.map((item) => ({
    id: item.id,
    amount: toNumber(item.amount),
    date: item.date.toISOString(),
    status: item.status
  }));

  return (
    <ProfilePanel
      bank={
        bank
          ? {
              holderName: bank.holderName,
              accountNumber: bank.accountNumber,
              ifsc: bank.ifsc,
              bankName: bank.bankName
            }
          : null
      }
      income={{
        salesIncome: sales,
        bonusIncome: bonus,
        totalIncome: total,
        withdrawn: paid,
        available: Math.max(total - paid, 0)
      }}
      user={sessionUser}
      withdrawals={withdrawalRows}
    />
  );
}
