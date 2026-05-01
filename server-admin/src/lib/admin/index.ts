import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { devices, itemFiles, items, policyOverrides, sessions, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getEffectivePolicy } from "@/lib/policy";

export async function listUsers(limit: number) {
  const db = getDb();
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
}

export async function getAdminUserDetail(userId: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const [override] = await db
    .select()
    .from(policyOverrides)
    .where(eq(policyOverrides.userId, userId))
    .limit(1);

  const effective = await getEffectivePolicy(userId);
  const devicesList = await db
    .select()
    .from(devices)
    .where(eq(devices.userId, userId))
    .orderBy(desc(devices.lastSeenAt));

  const [usage] = await db
    .select({
      fileBytesUsed: sql<number>`coalesce(sum(case when ${items.kind} = 'file' then ${items.contentBytes} else 0 end), 0)`,
      textBytesUsed: sql<number>`coalesce(sum(case when ${items.kind} = 'text' then ${items.contentBytes} else 0 end), 0)`,
    })
    .from(items)
    .where(and(eq(items.userId, userId), isNull(items.deletedAt)));

  return {
    user,
    policy: {
      effective,
      override,
    },
    usage: {
      fileBytesUsed: Number(usage?.fileBytesUsed ?? 0),
      textBytesUsed: Number(usage?.textBytesUsed ?? 0),
    },
    devices: devicesList,
  };
}

export async function listUserItemsMetadata(userId: string, limit: number) {
  const db = getDb();
  return db
    .select({
      id: items.id,
      kind: items.kind,
      contentBytes: items.contentBytes,
      createdAt: items.createdAt,
      expiresAt: items.expiresAt,
      originalName: itemFiles.originalName,
      mimeType: itemFiles.mimeType,
      sizeBytes: itemFiles.sizeBytes,
    })
    .from(items)
    .leftJoin(itemFiles, eq(itemFiles.itemId, items.id))
    .where(and(eq(items.userId, userId), isNull(items.deletedAt)))
    .orderBy(desc(items.createdAt))
    .limit(limit);
}

export async function disableOrEnableUser(userId: string, status: "active" | "disabled") {
  const db = getDb();
  await db.update(users).set({ status }).where(eq(users.id, userId));
}

export async function resetUserSessions(userId: string) {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
