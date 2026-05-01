import { requireAuth } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { getUsage } from "@/lib/items";
import { getEffectivePolicy } from "@/lib/policy";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth) {
    return fail("INVALID_AUTH", "Invalid or expired token.", 401);
  }

  const [limits, usage] = await Promise.all([
    getEffectivePolicy(auth.user.id),
    getUsage(auth.user.id),
  ]);

  return ok({ limits, usage });
}
