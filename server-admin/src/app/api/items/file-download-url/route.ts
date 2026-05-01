import { requireAuth } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { getFileStreamForUser } from "@/lib/items";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth) {
    return fail("INVALID_AUTH", "Invalid or expired token.", 401);
  }

  const url = new URL(request.url);
  const itemId = url.searchParams.get("itemId");
  if (!itemId) {
    return fail("INVALID_INPUT", "Missing itemId.");
  }

  if (url.searchParams.get("stream") === "1") {
    const streamResult = await getFileStreamForUser({
      itemId,
      userId: auth.user.id,
    });

    if (!streamResult) {
      return fail("ITEM_NOT_FOUND", "File not found.", 404);
    }

    return new Response(streamResult.blob.stream, {
      headers: {
        "Content-Type": streamResult.file.mimeType,
        "Content-Disposition": `attachment; filename="${streamResult.file.safeName}"`,
      },
    });
  }

  return ok({
    downloadUrl: `/api/items/file-download-url?stream=1&itemId=${encodeURIComponent(itemId)}`,
    expiresIn: 60,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth) {
    return fail("INVALID_AUTH", "Invalid or expired token.", 401);
  }

  return fail("NOT_IMPLEMENTED", "Use GET with itemId query.", 405);
}
