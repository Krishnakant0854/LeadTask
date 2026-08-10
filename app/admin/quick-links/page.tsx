import { QuickLinksManager } from "@/components/admin/QuickLinksManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminQuickLinksPage() {
  const links = await prisma.quickLink.findMany({ select: { type: true, url: true } });

  return (
    <QuickLinksManager
      initialLinks={{
        customerSupportUrl: links.find((link) => link.type === "CUSTOMER_SUPPORT")?.url ?? null,
        groupUrl: links.find((link) => link.type === "GROUP")?.url ?? null
      }}
    />
  );
}
