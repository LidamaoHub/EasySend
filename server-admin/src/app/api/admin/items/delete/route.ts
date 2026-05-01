import { requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { deleteItemById } from "@/lib/items";
import { itemDeleteSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return fail("PERMISSION_DENIED", "Admin access required.", 403);
  }

  const body = await request.json();
  const parsed = itemDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  return ok({
    deleted: await deleteItemById(parsed.data.itemId),
  });
}
