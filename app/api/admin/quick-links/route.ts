import { QuickLinkType } from "@prisma/client";

import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { quickLinksSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const links = await prisma.quickLink.findMany({ select: { type: true, url: true } });
    return ok({ links: serializeQuickLinks(links) });
  } catch (error) {
    return routeError(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertCsrf(request);
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const body = quickLinksSchema.parse(await request.json());
    const links = await prisma.$transaction([
      prisma.quickLink.upsert({
        where: { type: "CUSTOMER_SUPPORT" },
        update: { url: body.customerSupportUrl || null },
        create: { type: "CUSTOMER_SUPPORT", url: body.customerSupportUrl || null }
      }),
      prisma.quickLink.upsert({
        where: { type: "GROUP" },
        update: { url: body.groupUrl || null },
        create: { type: "GROUP", url: body.groupUrl || null }
      })
    ]);

    return ok({ links: serializeQuickLinks(links) });
  } catch (error) {
    return routeError(error);
  }
}

function serializeQuickLinks(links: Array<{ type: QuickLinkType; url: string | null }>) {
  return {
    customerSupportUrl: links.find((link) => link.type === "CUSTOMER_SUPPORT")?.url ?? null,
    groupUrl: links.find((link) => link.type === "GROUP")?.url ?? null
  };
}
