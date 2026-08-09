import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertCsrf(request);
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const formData = await request.formData();
    const file = formData.get("photo");

    if (!(file instanceof File) || file.size === 0) {
      throw Object.assign(new Error("Please upload a profile photo"), { status: 422 });
    }

    const photoUrl = await saveUpload(file, "profiles");
    await prisma.user.update({
      where: { id: user.id },
      data: { photoUrl }
    });

    return ok({ photoUrl });
  } catch (error) {
    return routeError(error);
  }
}
