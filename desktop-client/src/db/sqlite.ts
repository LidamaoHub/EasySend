import { convertFileSrc, invoke } from "@tauri-apps/api/core";

export type CachedImageRecord = {
  itemId: string;
  savedPath: string;
  downloadedAt: string;
  mimeType: string;
  originalName: string;
  assetUrl: string;
};

type NativeCachedImageRecord = Omit<CachedImageRecord, "assetUrl">;

type CacheImagePayload = {
  itemId: string;
  downloadUrl: string;
  token: string;
  fileName: string;
  mimeType: string;
  timeoutMs?: number;
};

function isTauriRuntime() {
  return typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}

function hydrateRecord(record: NativeCachedImageRecord): CachedImageRecord {
  return {
    ...record,
    assetUrl: convertFileSrc(record.savedPath),
  };
}

export async function getCachedImageRecords(): Promise<CachedImageRecord[]> {
  if (!isTauriRuntime()) {
    return [];
  }

  const records = await invoke<NativeCachedImageRecord[]>("list_cached_images");
  return records.map(hydrateRecord);
}

export async function cacheImageRecord(payload: CacheImagePayload): Promise<CachedImageRecord> {
  if (!isTauriRuntime()) {
    throw new Error("Image cache is only available in the desktop client.");
  }

  const record = await invoke<NativeCachedImageRecord>("cache_image_download", {
    payload,
  });

  return hydrateRecord(record);
}

export async function removeCachedImage(itemId: string) {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("remove_cached_image", { itemId });
}
