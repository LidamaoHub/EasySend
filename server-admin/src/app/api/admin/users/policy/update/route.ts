import { eq } from "drizzle-orm";
import { policyOverrides } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { adminPolicyUpdateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return fail("PERMISSION_DENIED", "Admin access required.", 403);
  }

  const body = await request.json();
  const parsed = adminPolicyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const db = getDb();
  await db
    .insert(policyOverrides)
    .values({
      userId: parsed.data.userId,
      maxFileSizeMb: parsed.data.maxFileSizeMb ?? null,
      maxTotalFileBytes: parsed.data.maxTotalFileBytes ?? null,
      maxTotalTextBytes: parsed.data.maxTotalTextBytes ?? null,
      fileRetentionDays: parsed.data.fileRetentionDays ?? null,
      textRetentionDays: parsed.data.textRetentionDays ?? null,
      secretModeEnabled: parsed.data.secretModeEnabled ?? null,
    })
    .onConflictDoUpdate({
      target: policyOverrides.userId,
      set: {
        maxFileSizeMb: parsed.data.maxFileSizeMb ?? null,
        maxTotalFileBytes: parsed.data.maxTotalFileBytes ?? null,
        maxTotalTextBytes: parsed.data.maxTotalTextBytes ?? null,
        fileRetentionDays: parsed.data.fileRetentionDays ?? null,
        textRetentionDays: parsed.data.textRetentionDays ?? null,
        secretModeEnabled: parsed.data.secretModeEnabled ?? null,
        updatedAt: new Date(),
      },
    });

  return ok({ updated: true });
}
