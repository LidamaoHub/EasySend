import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { devices, sessions, users } from "@/db/schema";
import { getDb } from "@/lib/db";

const SESSION_DAYS = 30;

export type AuthContext = {
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
  device: {
    id: string;
    deviceType: string;
    deviceName: string;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, stored] = passwordHash.split(":");
  if (!salt || !stored) return false;

  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(stored, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(params: {
  userId: string;
  deviceType: string;
  deviceName: string;
}) {
  const db = getDb();
  const [device] = await db
    .insert(devices)
    .values({
      userId: params.userId,
      deviceType: params.deviceType,
      deviceName: params.deviceName,
    })
    .returning();

  const rawToken = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const [session] = await db
    .insert(sessions)
    .values({
      userId: params.userId,
      deviceId: device.id,
      tokenHash: hashToken(rawToken),
      expiresAt,
    })
    .returning();

  return { rawToken, session, device };
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export async function requireAuth(request: Request): Promise<AuthContext | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  const db = getDb();
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      deviceId: devices.id,
      deviceType: devices.deviceType,
      deviceName: devices.deviceName,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(devices, eq(sessions.deviceId, devices.id))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())));

  const row = rows[0];
  if (!row || row.status !== "active") {
    return null;
  }

  return {
    user: {
      id: row.userId,
      email: row.email,
      role: row.role,
      status: row.status,
    },
    device: {
      id: row.deviceId,
      deviceType: row.deviceType,
      deviceName: row.deviceName,
    },
    session: {
      id: row.sessionId,
      expiresAt: row.expiresAt,
    },
  };
}

export async function requireAdmin(request: Request) {
  const auth = await requireAuth(request);
  if (!auth || auth.user.role !== "admin") {
    return null;
  }

  return auth;
}
