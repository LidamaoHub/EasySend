import { apiFetch } from "@/api/client";

export type TimelineItem = {
  id: string;
  kind: "text" | "file";
  secretMode: boolean;
  contentBytes: number;
  createdAt: string;
  expiresAt: string | null;
  deviceName: string;
  contentPreview?: string;
  file?: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
};

export type ItemsResponse = {
  success: true;
  data: {
    items: TimelineItem[];
    nextCursor: string | null;
  };
};

export type TextCreateResponse = {
  success: true;
  data: {
    item: TimelineItem;
  };
};

export type FileDownloadUrlResponse = {
  success: true;
  data: {
    downloadUrl: string;
    expiresIn: number;
  };
};

export function getItems(token: string, filter: "all" | "text" | "file") {
  return apiFetch<ItemsResponse>(`/items?filter=${filter}&limit=50`, undefined, token);
}

export function createText(token: string, content: string) {
  return apiFetch<TextCreateResponse>(
    "/items/text/create",
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
    token,
  );
}

export function deleteItem(token: string, itemId: string) {
  return apiFetch<{ success: true; data: { deleted: boolean } }>(
    "/items/delete",
    {
      method: "POST",
      body: JSON.stringify({ itemId }),
    },
    token,
  );
}

export function getFileDownloadUrl(token: string, itemId: string) {
  return apiFetch<FileDownloadUrlResponse>(
    `/items/file-download-url?itemId=${encodeURIComponent(itemId)}`,
    undefined,
    token,
  );
}
