import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { del, get as getBlob } from "@vercel/blob";
import { itemFiles, itemTexts, items } from "@/db/schema";
import { getDb } from "@/lib/db";

export async function getUsage(userId: string) {
  const db = getDb();
  const [fileUsage] = await db
    .select({
      total: sql<number>`coalesce(sum(${items.contentBytes}), 0)`,
    })
    .from(items)
    .where(and(eq(items.userId, userId), eq(items.kind, "file"), isNull(items.deletedAt)));

  const [textUsage] = await db
    .select({
      total: sql<number>`coalesce(sum(${items.contentBytes}), 0)`,
    })
    .from(items)
    .where(and(eq(items.userId, userId), eq(items.kind, "text"), isNull(items.deletedAt)));

  return {
    fileBytesUsed: Number(fileUsage?.total ?? 0),
    textBytesUsed: Number(textUsage?.total ?? 0),
  };
}

export async function listItems(params: {
  userId: string;
  filter: "all" | "text" | "file";
  cursor?: string | null;
  limit: number;
}) {
  const db = getDb();
  const conditions = [eq(items.userId, params.userId), isNull(items.deletedAt)];

  if (params.filter !== "all") {
    conditions.push(eq(items.kind, params.filter));
  }

  if (params.cursor) {
    conditions.push(lt(items.createdAt, new Date(params.cursor)));
  }

  const rows = await db
    .select({
      id: items.id,
      kind: items.kind,
      secretMode: items.secretMode,
      contentBytes: items.contentBytes,
      createdAt: items.createdAt,
      expiresAt: items.expiresAt,
      content: itemTexts.content,
      originalName: itemFiles.originalName,
      mimeType: itemFiles.mimeType,
      sizeBytes: itemFiles.sizeBytes,
    })
    .from(items)
    .leftJoin(itemTexts, eq(itemTexts.itemId, items.id))
    .leftJoin(itemFiles, eq(itemFiles.itemId, items.id))
    .where(and(...conditions))
    .orderBy(desc(items.createdAt))
    .limit(params.limit);

  return {
    items: rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      secretMode: row.secretMode,
      contentBytes: Number(row.contentBytes),
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      contentPreview: row.content ?? undefined,
      file:
        row.kind === "file"
          ? {
              originalName: row.originalName,
              mimeType: row.mimeType,
              sizeBytes: Number(row.sizeBytes ?? 0),
            }
          : undefined,
    })),
    nextCursor:
      rows.length === params.limit ? rows[rows.length - 1]?.createdAt.toISOString() : null,
  };
}

export async function createTextItem(params: {
  userId: string;
  deviceId: string;
  content: string;
}) {
  const db = getDb();
  const bytes = Buffer.byteLength(params.content, "utf8");
  const [item] = await db
    .insert(items)
    .values({
      userId: params.userId,
      deviceId: params.deviceId,
      kind: "text",
      contentBytes: bytes,
    })
    .returning();

  await db.insert(itemTexts).values({
    itemId: item.id,
    content: params.content,
  });

  return item;
}

export async function createFileItem(params: {
  userId: string;
  deviceId: string;
  blobKey: string;
  originalName: string;
  safeName: string;
  mimeType: string;
  sizeBytes: number;
  expiresAt: Date;
}) {
  const db = getDb();
  const [item] = await db
    .insert(items)
    .values({
      userId: params.userId,
      deviceId: params.deviceId,
      kind: "file",
      contentBytes: params.sizeBytes,
      expiresAt: params.expiresAt,
    })
    .returning();

  await db.insert(itemFiles).values({
    itemId: item.id,
    blobKey: params.blobKey,
    originalName: params.originalName,
    safeName: params.safeName,
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
  });

  return item;
}

export async function deleteItemOwnedByUser(params: { itemId: string; userId: string }) {
  const db = getDb();
  const rows = await db
    .select({
      id: items.id,
      kind: items.kind,
      blobKey: itemFiles.blobKey,
    })
    .from(items)
    .leftJoin(itemFiles, eq(itemFiles.itemId, items.id))
    .where(and(eq(items.id, params.itemId), eq(items.userId, params.userId), isNull(items.deletedAt)))
    .limit(1);

  const item = rows[0];
  if (!item) {
    return false;
  }

  await db.update(items).set({ deletedAt: new Date() }).where(eq(items.id, item.id));

  if (item.kind === "file" && item.blobKey && process.env.BLOB_READ_WRITE_TOKEN) {
    await del(item.blobKey);
  }

  return true;
}

export async function deleteItemById(itemId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: items.id,
      kind: items.kind,
      blobKey: itemFiles.blobKey,
    })
    .from(items)
    .leftJoin(itemFiles, eq(itemFiles.itemId, items.id))
    .where(and(eq(items.id, itemId), isNull(items.deletedAt)))
    .limit(1);

  const item = rows[0];
  if (!item) {
    return false;
  }

  await db.update(items).set({ deletedAt: new Date() }).where(eq(items.id, item.id));

  if (item.kind === "file" && item.blobKey && process.env.BLOB_READ_WRITE_TOKEN) {
    await del(item.blobKey);
  }

  return true;
}

export async function getFileStreamForUser(params: { itemId: string; userId: string }) {
  const db = getDb();
  const rows = await db
    .select({
      blobKey: itemFiles.blobKey,
      mimeType: itemFiles.mimeType,
      safeName: itemFiles.safeName,
    })
    .from(items)
    .innerJoin(itemFiles, eq(itemFiles.itemId, items.id))
    .where(and(eq(items.id, params.itemId), eq(items.userId, params.userId), isNull(items.deletedAt)))
    .limit(1);

  const file = rows[0];
  if (!file) {
    return null;
  }

  const blob = await getBlob(file.blobKey, { access: "private" });
  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    return null;
  }

  return {
    blob,
    file,
  };
}

export function sanitizeFilename(filename: string) {
  return filename
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/[\u0000-\u001f\u007f]+/g, "")
    .trim()
    .slice(0, 255);
}
