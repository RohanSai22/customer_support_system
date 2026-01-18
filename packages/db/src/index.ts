import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// For querying
const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient, { schema });

export * from "./schema";
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// Re-export commonly used Drizzle functions
export { eq, desc, and, or, gte, lte, sql } from "drizzle-orm";
