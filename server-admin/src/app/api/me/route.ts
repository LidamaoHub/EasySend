import { requireAuth } from "@/lib/auth";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth) {
    return fail("INVALID_AUTH", "Invalid or expired token.", 401);
  }

  return ok({
    user: auth.user,
    device: auth.device,
  });
}
