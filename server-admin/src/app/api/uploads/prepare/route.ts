import { requireAuth } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { getUsage, sanitizeFilename } from "@/lib/items";
import { getEffectivePolicy } from "@/lib/policy";
import { uploadPrepareSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth) {
    return fail("INVALID_AUTH", "Invalid or expired token.", 401);
  }

  const body = await request.json();
  const parsed = uploadPrepareSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const [policy, usage] = await Promise.all([
    getEffectivePolicy(auth.user.id),
    getUsage(auth.user.id),
  ]);

  if (parsed.data.sizeBytes > policy.maxFileSizeMb * 1024 * 1024) {
    return fail("FILE_TOO_LARGE", "File exceeds the current single-file limit.");
  }

  if (usage.fileBytesUsed + parsed.data.sizeBytes > policy.maxTotalFileBytes) {
    return fail("FILE_QUOTA_EXCEEDED", "File storage quota exceeded.");
  }

  const safeName = sanitizeFilename(parsed.data.filename);
  const pathname = `${auth.user.id}/${Date.now()}-${safeName}`;

  return ok({
    pathname,
    safeName,
    mode: "client-direct",
    note: "Wire this endpoint to a Vercel Blob client-upload token exchange next.",
  });
}
