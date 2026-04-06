import { pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const cardParallaxCacheTable = pgTable("card_parallax_cache", {
  cardId:      text("card_id").primaryKey(),
  x:           real("x").notNull(),
  y:           real("y").notNull(),
  w:           real("w").notNull(),
  h:           real("h").notNull(),
  subjectType: text("subject_type").notNull(),
  description: text("description").notNull(),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CardParallaxCache = typeof cardParallaxCacheTable.$inferSelect;
