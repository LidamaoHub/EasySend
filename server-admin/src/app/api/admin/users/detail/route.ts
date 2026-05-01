import { requireAdmin } from "@/lib/auth";
import { getAdminUserDetail } from "@/lib/admin";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return fail("PERMISSION_DENIED", "Admin access required.", 403);
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return fail("INVALID_INPUT", "Missing userId.");
  }

  const detail = await getAdminUserDetail(userId);
  if (!detail) {
    return fail("USER_NOT_FOUND", "User not found.", 404);
  }

  return ok(detail);
}
