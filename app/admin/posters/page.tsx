import { PosterManager } from "@/components/admin/PosterManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPostersPage() {
  const poster = await prisma.poster.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <PosterManager
      activePoster={
        poster
          ? {
              id: poster.id,
              imageUrl: poster.imageUrl,
              active: poster.active,
              createdAt: poster.createdAt.toISOString()
            }
          : null
      }
    />
  );
}
