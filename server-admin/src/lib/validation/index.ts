import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const registerSchema = z.object({
  email: z.string().regex(emailRegex, "Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  deviceType: z.string().min(2).max(32),
  deviceName: z.string().min(2).max(255),
});

export const loginSchema = registerSchema.pick({
  email: true,
  password: true,
  deviceType: true,
  deviceName: true,
});

export const textCreateSchema = z.object({
  content: z.string().min(1),
});

export const itemDeleteSchema = z.object({
  itemId: z.string().uuid(),
});

export const deviceUpdateSchema = z.object({
  deviceName: z.string().min(2).max(255),
});

export const uploadPrepareSchema = z.object({
  filename: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
  mimeType: z.string().min(1).max(255),
});

export const uploadCompleteSchema = z.object({
  blobKey: z.string().min(1),
  filename: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
  mimeType: z.string().min(1).max(255),
});

export const adminPolicyUpdateSchema = z.object({
  userId: z.string().uuid(),
  maxFileSizeMb: z.number().int().positive().nullable().optional(),
  maxTotalFileBytes: z.number().int().positive().nullable().optional(),
  maxTotalTextBytes: z.number().int().positive().nullable().optional(),
  fileRetentionDays: z.number().int().positive().nullable().optional(),
  textRetentionDays: z.number().int().positive().nullable().optional(),
  secretModeEnabled: z.boolean().nullable().optional(),
});

export const adminStatusUpdateSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "disabled"]),
});

export const adminResetSessionsSchema = z.object({
  userId: z.string().uuid(),
});
