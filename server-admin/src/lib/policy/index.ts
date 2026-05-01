import { eq } from "drizzle-orm";
import { policyDefaults, policyOverrides } from "@/db/schema";
import { getDb } from "@/lib/db";

export type EffectivePolicy = {
  maxFileSizeMb: number;
  maxTotalFileBytes: number;
  maxTotalTextBytes: number;
  fileRetentionDays: number;
  textRetentionDays: number | null;
  secretModeEnabled: boolean;
};

const fallbackPolicy: EffectivePolicy = {
  maxFileSizeMb: 10,
  maxTotalFileBytes: 100 * 1024 * 1024,
  maxTotalTextBytes: 100 * 1024 * 1024,
  fileRetentionDays: 15,
  textRetentionDays: null,
  secretModeEnabled: false,
};

export async function getEffectivePolicy(userId: string) {
  const db = getDb();

  const [defaults] = await db.select().from(policyDefaults).limit(1);
  const [override] = await db
    .select()
    .from(policyOverrides)
    .where(eq(policyOverrides.userId, userId))
    .limit(1);

  const base = defaults
    ? {
        maxFileSizeMb: defaults.maxFileSizeMb,
        maxTotalFileBytes: defaults.maxTotalFileBytes,
        maxTotalTextBytes: defaults.maxTotalTextBytes,
        fileRetentionDays: defaults.fileRetentionDays,
        textRetentionDays: defaults.textRetentionDays,
        secretModeEnabled: defaults.secretModeEnabled,
      }
    : fallbackPolicy;

  return {
    maxFileSizeMb: override?.maxFileSizeMb ?? base.maxFileSizeMb,
    maxTotalFileBytes: override?.maxTotalFileBytes ?? base.maxTotalFileBytes,
    maxTotalTextBytes: override?.maxTotalTextBytes ?? base.maxTotalTextBytes,
    fileRetentionDays: override?.fileRetentionDays ?? base.fileRetentionDays,
    textRetentionDays: override?.textRetentionDays ?? base.textRetentionDays,
    secretModeEnabled: override?.secretModeEnabled ?? base.secretModeEnabled,
  } satisfies EffectivePolicy;
}
