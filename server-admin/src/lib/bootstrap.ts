import { eq } from "drizzle-orm";
import { policyDefaults, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

let bootstrapped = false;

export async function ensureBootstrapData() {
  if (bootstrapped) {
    return;
  }

  const db = getDb();
  const [defaultPolicy] = await db.select({ id: policyDefaults.id }).from(policyDefaults).limit(1);

  if (!defaultPolicy) {
    await db.insert(policyDefaults).values({
      maxFileSizeMb: 10,
      maxTotalFileBytes: 100 * 1024 * 1024,
      maxTotalTextBytes: 100 * 1024 * 1024,
      fileRetentionDays: 15,
      textRetentionDays: null,
      secretModeEnabled: false,
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const [existingAdmin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (!existingAdmin) {
      await db.insert(users).values({
        email: adminEmail,
        passwordHash: hashPassword(adminPassword),
        role: "admin",
        status: "active",
      });
    }
  }

  bootstrapped = true;
}
