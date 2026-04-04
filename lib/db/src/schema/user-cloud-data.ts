import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const userCloudDataTable = pgTable("user_cloud_data", {
  userId: text("user_id").primaryKey(),
  decks: jsonb("decks").notNull().default([]),
  favorites: jsonb("favorites").notNull().default([]),
  cardHistory: jsonb("card_history").notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cloudDataSchema = z.object({
  decks: z.array(z.any()),
  favorites: z.array(z.any()),
  cardHistory: z.array(z.any()),
});

export type CloudData = z.infer<typeof cloudDataSchema>;
export type UserCloudData = typeof userCloudDataTable.$inferSelect;
