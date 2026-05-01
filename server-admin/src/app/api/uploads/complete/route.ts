import { requireAuth } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { createFileItem, sanitizeFilename } from "@/lib/items";
import { getEffectivePolicy } from "@/lib/policy";
import { uploadCompleteSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth) {
    return fail("INVALID_AUTH", "Invalid or expired token.", 401);
  }

  const body = await request.json();
  const parsed = uploadCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const policy = await getEffectivePolicy(auth.user.id);
  const expiresAt = new Date(Date.now() + policy.fileRetentionDays * 24 * 60 * 60 * 1000);
  const safeName = sanitizeFilename(parsed.data.filename);

  const item = await createFileItem({
    userId: auth.user.id,
    deviceId: auth.device.id,
    blobKey: parsed.data.blobKey,
    originalName: parsed.data.filename,
    safeName,
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
    expiresAt,
  });

  return ok({
    item: {
      id: item.id,
      kind: item.kind,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      file: {
        originalName: parsed.data.filename,
        mimeType: parsed.data.mimeType,
        sizeBytes: parsed.data.sizeBytes,
      },
    },
  }, 201);
}
