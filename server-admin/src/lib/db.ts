import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { getRequiredEnv } from "@/lib/env";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    const databaseUrl = getRequiredEnv("EASY_SEND_DATABASE_URL");
    dbInstance = drizzle(neon(databaseUrl), { schema });
  }

  return dbInstance;
}
