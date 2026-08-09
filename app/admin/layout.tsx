import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import type { SessionUser } from "@/types/app";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
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

  return <AdminShell user={sessionUser}>{children}</AdminShell>;
}
