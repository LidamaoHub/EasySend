import { requireAdmin } from "@/lib/auth";
import { listUserItemsMetadata } from "@/lib/admin";
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

  const items = await listUserItemsMetadata(userId, 50);
  return ok({ items, nextCursor: null });
}
