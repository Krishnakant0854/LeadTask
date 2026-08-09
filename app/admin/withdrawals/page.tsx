import { WithdrawalManager } from "@/components/admin/WithdrawalManager";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage() {
  const withdrawals = await prisma.withdrawal.findMany({
    include: {
      user: {
        select: {
          employeeId: true,
          name: true
        }
      }
    },
    orderBy: { date: "desc" }
  });

  return (
    <WithdrawalManager
      initialRows={withdrawals.map((item) => ({
        id: item.id,
        amount: toNumber(item.amount),
        date: item.date.toISOString(),
        status: item.status,
        user: item.user
      }))}
    />
  );
}
