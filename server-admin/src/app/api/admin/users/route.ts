import { requireAdmin } from "@/lib/auth";
import { listUsers } from "@/lib/admin";
import { ensureBootstrapData } from "@/lib/bootstrap";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  await ensureBootstrapData();
  const auth = await requireAdmin(request);
  if (!auth) {
    return fail("PERMISSION_DENIED", "Admin access required.", 403);
  }

  const users = await listUsers(20);
  return ok({ users, nextCursor: null });
}
