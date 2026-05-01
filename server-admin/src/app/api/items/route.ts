import { requireAuth } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { listItems } from "@/lib/items";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth) {
    return fail("INVALID_AUTH", "Invalid or expired token.", 401);
  }

  const url = new URL(request.url);
  const filter = (url.searchParams.get("filter") ?? "all") as "all" | "text" | "file";
  const cursor = url.searchParams.get("cursor");
  const limit = Number(url.searchParams.get("limit") ?? "50");

  const data = await listItems({
    userId: auth.user.id,
    filter: filter === "text" || filter === "file" ? filter : "all",
    cursor,
    limit: Math.min(Math.max(limit, 1), 100),
  });

  return ok(data);
}
