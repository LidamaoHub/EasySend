import { eq } from "drizzle-orm";
import { sessions } from "@/db/schema";
import { getBearerToken, hashToken } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";

export async function POST(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return fail("INVALID_AUTH", "Missing Bearer token.", 401);
  }

  const db = getDb();
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  return ok({ loggedOut: true });
}
