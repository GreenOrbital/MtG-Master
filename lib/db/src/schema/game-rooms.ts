import { pgTable, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";

export const gameRoomsTable = pgTable("game_rooms", {
  code: varchar("code", { length: 10 }).primaryKey(),
  state: jsonb("state").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("waiting"),
  isPublic: varchar("is_public", { length: 5 }).notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type GameRoomRow = typeof gameRoomsTable.$inferSelect;
