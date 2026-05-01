import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { ensureBootstrapData } from "@/lib/bootstrap";
import { getDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  await ensureBootstrapData();
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return fail("INVALID_AUTH", "Incorrect email or password.", 401);
  }

  if (user.status !== "active") {
    return fail("USER_DISABLED", "This account is disabled.", 403);
  }

  const { rawToken, device } = await createSession({
    userId: user.id,
    deviceType: parsed.data.deviceType,
    deviceName: parsed.data.deviceName,
  });

  return ok({
    token: rawToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    device: {
      id: device.id,
      deviceType: device.deviceType,
      deviceName: device.deviceName,
    },
  });
}
