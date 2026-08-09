import { AdminUsersManager, type AdminUserRow } from "@/components/admin/AdminUsersManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
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

  const rows: AdminUserRow[] = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString()
  }));

  return <AdminUsersManager initialUsers={rows} />;
}
