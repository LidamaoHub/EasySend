import { requireAuth } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { createFileItem, getUsage, sanitizeFilename, verifyBlobExists } from "@/lib/items";
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

  const [policy, usage, blob] = await Promise.all([
    getEffectivePolicy(auth.user.id),
    getUsage(auth.user.id),
    verifyBlobExists(parsed.data.blobKey),
  ]);

  if (blob.size > policy.maxFileSizeMb * 1024 * 1024) {
    return fail("FILE_TOO_LARGE", "Uploaded blob exceeds the current single-file limit.", 400);
  }

  if (usage.fileBytesUsed + blob.size > policy.maxTotalFileBytes) {
    return fail("FILE_QUOTA_EXCEEDED", "File storage quota exceeded.", 400);
  }

  const expiresAt = new Date(Date.now() + policy.fileRetentionDays * 24 * 60 * 60 * 1000);
  const safeName = sanitizeFilename(parsed.data.filename);

  const item = await createFileItem({
    userId: auth.user.id,
    deviceId: auth.device.id,
    blobKey: parsed.data.blobKey,
    originalName: parsed.data.filename,
    safeName,
    mimeType: blob.contentType,
    sizeBytes: blob.size,
    expiresAt,
  });

  return ok({
    item: {
      id: item.id,
      kind: item.kind,
      deviceName: auth.device.deviceName,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      file: {
        originalName: parsed.data.filename,
        mimeType: blob.contentType,
        sizeBytes: blob.size,
      },
    },
  }, 201);
}
