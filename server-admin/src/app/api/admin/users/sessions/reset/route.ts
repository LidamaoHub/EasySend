import { requireAdmin } from "@/lib/auth";
import { resetUserSessions } from "@/lib/admin";
import { fail, ok } from "@/lib/http";
import { adminResetSessionsSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return fail("PERMISSION_DENIED", "Admin access required.", 403);
  }

  const body = await request.json();
  const parsed = adminResetSessionsSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await resetUserSessions(parsed.data.userId);
  return ok({ updated: true });
}
