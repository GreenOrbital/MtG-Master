import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";

export const partnerShopsTable = pgTable("partner_shops", {
  id: serial("id").primaryKey(),
  shopName: varchar("shop_name", { length: 200 }).notNull(),
  ownerName: varchar("owner_name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  address: varchar("address", { length: 300 }),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  continent: varchar("continent", { length: 60 }).notNull(),
  website: varchar("website", { length: 300 }),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export const insertPartnerShopSchema = z.object({
  shopName: z.string().min(2).max(200),
  ownerName: z.string().min(2).max(200),
  email: z.string().email().max(200),
  city: z.string().min(2).max(100),
  country: z.string().min(2).max(100),
  continent: z.string().min(2).max(60),
  phone: z.string().max(50).optional(),
  address: z.string().max(300).optional(),
  website: z.string().max(300).optional(),
  description: z.string().max(1000).optional(),
});

export type PartnerShop = typeof partnerShopsTable.$inferSelect;
export type InsertPartnerShop = z.infer<typeof insertPartnerShopSchema>;
