import { ok, routeError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { isSafeImageUrl, saveUpload } from "@/lib/storage";
import { posterLinkSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const poster = await prisma.poster.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" }
    });

    return ok({ poster });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertCsrf(request);

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") return unauthorized();

    const formData = await request.formData();
    const file = formData.get("poster");
    const imageUrlInput = String(formData.get("imageUrl") ?? "").trim();
    const linkUrl = posterLinkSchema.parse(String(formData.get("linkUrl") ?? "")) || null;

    let imageUrl = imageUrlInput;
    if (file instanceof File && file.size > 0) {
      imageUrl = await saveUpload(file, "posters");
    }

    if (!imageUrl) {
      throw Object.assign(new Error("Upload a poster image or provide an image URL"), {
        status: 422
      });
    }

    if (!isSafeImageUrl(imageUrl)) {
      throw Object.assign(new Error("Poster URL must be http, https, or a local path"), {
        status: 422
      });
    }

    const poster = await prisma.$transaction(async (tx) => {
      await tx.poster.updateMany({ data: { active: false } });
      return tx.poster.create({
        data: {
          imageUrl,
          linkUrl,
          active: true
        }
      });
    });

    return ok({ poster }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
