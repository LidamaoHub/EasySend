import { requireAuth } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { deleteItemOwnedByUser } from "@/lib/items";
import { itemDeleteSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth) {
    return fail("INVALID_AUTH", "Invalid or expired token.", 401);
  }

  const body = await request.json();
  const parsed = itemDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const deleted = await deleteItemOwnedByUser({
    itemId: parsed.data.itemId,
    userId: auth.user.id,
  });

  if (!deleted) {
    return fail("ITEM_NOT_FOUND", "Item not found.", 404);
  }

  return ok({ deleted: true });
}
