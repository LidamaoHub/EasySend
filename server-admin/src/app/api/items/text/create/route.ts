import { Buffer } from "node:buffer";
import { requireAuth } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { createTextItem, getUsage } from "@/lib/items";
import { getEffectivePolicy } from "@/lib/policy";
import { textCreateSchema } from "@/lib/validation";

const MAX_TEXT_BYTES = 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth) {
    return fail("INVALID_AUTH", "Invalid or expired token.", 401);
  }

  const body = await request.json();
  const parsed = textCreateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const contentBytes = Buffer.byteLength(parsed.data.content, "utf8");
  if (contentBytes > MAX_TEXT_BYTES) {
    return fail(
      "TEXT_TOO_LARGE",
      "Text content is over 1MB. Save it as a .txt file and upload it instead.",
      400,
    );
  }

  const [policy, usage] = await Promise.all([
    getEffectivePolicy(auth.user.id),
    getUsage(auth.user.id),
  ]);

  if (usage.textBytesUsed + contentBytes > policy.maxTotalTextBytes) {
    return fail("TEXT_QUOTA_EXCEEDED", "Text storage quota exceeded.", 400);
  }

  const item = await createTextItem({
    userId: auth.user.id,
    deviceId: auth.device.id,
    content: parsed.data.content,
  });

  return ok({
    item: {
      id: item.id,
      kind: item.kind,
      contentPreview: parsed.data.content,
      contentBytes,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
    },
  }, 201);
}
