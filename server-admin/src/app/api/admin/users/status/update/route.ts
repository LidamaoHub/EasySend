import { requireAdmin } from "@/lib/auth";
import { disableOrEnableUser } from "@/lib/admin";
import { fail, ok } from "@/lib/http";
import { adminStatusUpdateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return fail("PERMISSION_DENIED", "Admin access required.", 403);
  }

  const body = await request.json();
  const parsed = adminStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await disableOrEnableUser(parsed.data.userId, parsed.data.status);
  return ok({ updated: true });
}
