import { generateClientTokenFromReadWriteToken, handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAuth } from "@/lib/auth";
import { getRequiredEnv } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { getUsage, sanitizeFilename } from "@/lib/items";
import { getEffectivePolicy } from "@/lib/policy";
import { uploadPrepareSchema } from "@/lib/validation";

const DEFAULT_BLOB_API_URL = "https://vercel.com/api/blob";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth) {
    return fail("INVALID_AUTH", "Invalid or expired token.", 401);
  }

  const body = await request.json();
  if (typeof body?.type === "string" && body.type.startsWith("blob.")) {
    const json = await handleUpload({
      token: getRequiredEnv("easy_send_blob_READ_WRITE_TOKEN"),
      request,
      body: body as HandleUploadBody,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload ?? "{}") as {
          sizeBytes?: number;
          mimeType?: string;
        };

        if (!payload.sizeBytes || !payload.mimeType) {
          throw new Error("Missing upload payload.");
        }

        const [policy, usage] = await Promise.all([
          getEffectivePolicy(auth.user.id),
          getUsage(auth.user.id),
        ]);

        if (payload.sizeBytes > policy.maxFileSizeMb * 1024 * 1024) {
          throw new Error("File exceeds the current single-file limit.");
        }

        if (usage.fileBytesUsed + payload.sizeBytes > policy.maxTotalFileBytes) {
          throw new Error("File storage quota exceeded.");
        }

        if (!pathname.startsWith(`${auth.user.id}/`)) {
          throw new Error("Invalid upload pathname.");
        }

        return {
          allowedContentTypes: [payload.mimeType],
          maximumSizeInBytes: payload.sizeBytes,
          validUntil: Date.now() + 10 * 60 * 1000,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
    });

    return Response.json(json);
  }

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
  const clientToken = await generateClientTokenFromReadWriteToken({
    token: getRequiredEnv("easy_send_blob_READ_WRITE_TOKEN"),
    pathname,
    maximumSizeInBytes: parsed.data.sizeBytes,
    allowedContentTypes: [parsed.data.mimeType || "application/octet-stream"],
    validUntil: Date.now() + 10 * 60 * 1000,
    addRandomSuffix: false,
    allowOverwrite: false,
  });

  return ok({
    pathname,
    safeName,
    handleUploadUrl: "/api/uploads/prepare",
    nativeUpload: {
      clientToken,
      uploadUrl: `${process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL || DEFAULT_BLOB_API_URL}/?pathname=${encodeURIComponent(pathname)}`,
      access: "private",
      apiVersion: "12",
      timeoutMs: 30000,
    },
  });
}
