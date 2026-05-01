import { eq } from "drizzle-orm";
import { devices } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { deviceUpdateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth) {
    return fail("INVALID_AUTH", "Invalid or expired token.", 401);
  }

  const body = await request.json();
  const parsed = deviceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  await db
    .update(devices)
    .set({ deviceName: parsed.data.deviceName, lastSeenAt: new Date() })
    .where(eq(devices.id, auth.device.id));

  return ok({
    device: {
      id: auth.device.id,
      deviceName: parsed.data.deviceName,
    },
  });
}
