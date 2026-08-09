import { ok, routeError } from "@/lib/api";
import { destroySession } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertCsrf(request);
    await destroySession();
    return ok({ success: true });
  } catch (error) {
    return routeError(error);
  }
}
