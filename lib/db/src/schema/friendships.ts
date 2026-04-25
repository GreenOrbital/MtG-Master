import { pgTable, serial, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const friendshipsTable = pgTable(
  "friendships",
  {
    id: serial("id").primaryKey(),
    requesterUserId: varchar("requester_user_id", { length: 100 }).notNull(),
    recipientUserId: varchar("recipient_user_id", { length: 100 }).notNull(),
    requesterDisplayName: varchar("requester_display_name", { length: 200 }),
    recipientDisplayName: varchar("recipient_display_name", { length: 200 }),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => ({
    // Undirected pair uniqueness: ANY duplicate of (A,B) or (B,A) is rejected
    // at the DB layer, regardless of which side initiated the request.
    pairUniqueCanonical: uniqueIndex("friendships_pair_unique_canonical").on(
      sql`LEAST(${t.requesterUserId}, ${t.recipientUserId})`,
      sql`GREATEST(${t.requesterUserId}, ${t.recipientUserId})`,
    ),
  }),
);

export const sendFriendRequestSchema = z.object({
  identifier: z.string().min(2).max(200),
});

export const respondFriendRequestSchema = z.object({
  requestId: z.number().int().positive(),
  accept: z.boolean(),
});

export type Friendship = typeof friendshipsTable.$inferSelect;
export type FriendshipStatus = "pending" | "accepted";
