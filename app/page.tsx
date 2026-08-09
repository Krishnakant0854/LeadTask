import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function IndexPage() {
  const user = await getCurrentUser();
  redirect(user?.role === "ADMIN" ? "/admin/dashboard" : user ? "/home" : "/login");
}
