import { upload } from "@vercel/blob/client";
import { API_BASE_URL, apiFetch, ApiError } from "@/api/client";
import { invoke } from "@tauri-apps/api/core";

type UploadPlanResponse = {
  success: true;
  data: {
    pathname: string;
    safeName: string;
    handleUploadUrl: string;
    nativeUpload: {
      clientToken: string;
      uploadUrl: string;
      access: "private" | "public";
      apiVersion: string;
      timeoutMs: number;
    };
  };
};

type UploadCompleteResponse = {
  success: true;
  data: {
    item: {
      id: string;
      kind: "file";
      createdAt: string;
      expiresAt: string | null;
      file: {
        originalName: string;
        mimeType: string;
        sizeBytes: number;
      };
    };
  };
};

function getApiOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

function isTauriRuntime() {
  return typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}

type NativeUploadArgs = {
  uploadUrl: string;
  clientToken: string;
  contentType: string;
  access: "private" | "public";
  apiVersion: string;
  timeoutMs: number;
  bytes: number[];
};

async function uploadFileWithTauriNative(
  file: File,
  nativeUpload: UploadPlanResponse["data"]["nativeUpload"],
) {
  const bytes = Array.from(new Uint8Array(await file.arrayBuffer()));

  return invoke("upload_blob", {
    payload: {
      uploadUrl: nativeUpload.uploadUrl,
      clientToken: nativeUpload.clientToken,
      contentType: file.type || "application/octet-stream",
      access: nativeUpload.access,
      apiVersion: nativeUpload.apiVersion,
      timeoutMs: nativeUpload.timeoutMs,
      bytes,
    } satisfies NativeUploadArgs,
  });
}

export async function uploadFileWithBlob(token: string, file: File) {
  const planned = await apiFetch<UploadPlanResponse>(
    "/uploads/prepare",
    {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        sizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
      }),
    },
    token,
  );

  if (isTauriRuntime()) {
    try {
      await uploadFileWithTauriNative(file, planned.data.nativeUpload);
    } catch (error) {
      throw new ApiError(
        "BLOB_UPLOAD_FAILED",
        error instanceof Error ? `Blob upload failed: ${error.message}` : "Blob upload failed.",
        0,
      );
    }

    return apiFetch<UploadCompleteResponse>(
      "/uploads/complete",
      {
        method: "POST",
        body: JSON.stringify({
          blobKey: planned.data.pathname,
          filename: file.name,
          sizeBytes: file.size,
          mimeType: file.type || "application/octet-stream",
        }),
      },
      token,
    );
  }

  let blob;
  try {
    blob = await upload(planned.data.pathname, file, {
      access: "private",
      handleUploadUrl: new URL(planned.data.handleUploadUrl, getApiOrigin()).toString(),
      clientPayload: JSON.stringify({
        sizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
      }),
      headers: {
        Authorization: `Bearer ${token}`,
      },
      contentType: file.type || "application/octet-stream",
    });
  } catch (error) {
    throw new ApiError(
      "BLOB_UPLOAD_FAILED",
      error instanceof Error ? `Blob upload failed: ${error.message}` : "Blob upload failed.",
      0,
    );
  }

  return apiFetch<UploadCompleteResponse>(
    "/uploads/complete",
    {
      method: "POST",
      body: JSON.stringify({
        blobKey: blob.pathname,
        filename: file.name,
        sizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
      }),
    },
    token,
  );
}
