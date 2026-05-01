import {
  bigint,
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 32 }).notNull().default("user"),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const policyDefaults = pgTable("policy_defaults", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  maxFileSizeMb: integer("max_file_size_mb").notNull().default(10),
  maxTotalFileBytes: bigint("max_total_file_bytes", { mode: "number" }).notNull().default(104857600),
  maxTotalTextBytes: bigint("max_total_text_bytes", { mode: "number" }).notNull().default(104857600),
  fileRetentionDays: integer("file_retention_days").notNull().default(15),
  textRetentionDays: integer("text_retention_days"),
  secretModeEnabled: boolean("secret_mode_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const policyOverrides = pgTable("policy_overrides", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  maxFileSizeMb: integer("max_file_size_mb"),
  maxTotalFileBytes: bigint("max_total_file_bytes", { mode: "number" }),
  maxTotalTextBytes: bigint("max_total_text_bytes", { mode: "number" }),
  fileRetentionDays: integer("file_retention_days"),
  textRetentionDays: integer("text_retention_days"),
  secretModeEnabled: boolean("secret_mode_enabled"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const devices = pgTable("devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceType: varchar("device_type", { length: 32 }).notNull(),
  deviceName: varchar("device_name", { length: 255 }).notNull(),
  clientVersion: varchar("client_version", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceId: uuid("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceId: uuid("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 16 }).notNull(),
  secretMode: boolean("secret_mode").notNull().default(false),
  title: varchar("title", { length: 255 }),
  contentBytes: bigint("content_bytes", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const itemTexts = pgTable("item_texts", {
  itemId: uuid("item_id").primaryKey().references(() => items.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
});

export const itemFiles = pgTable("item_files", {
  itemId: uuid("item_id").primaryKey().references(() => items.id, { onDelete: "cascade" }),
  blobKey: text("blob_key").notNull().unique(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  safeName: varchar("safe_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
});
