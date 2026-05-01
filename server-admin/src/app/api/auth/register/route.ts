import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { ensureBootstrapData } from "@/lib/bootstrap";
import { getDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  await ensureBootstrapData();
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existing) {
    return fail("EMAIL_ALREADY_EXISTS", "This email is already registered.");
  }

  const [user] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password),
    })
    .returning();

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
  }, 201);
}
