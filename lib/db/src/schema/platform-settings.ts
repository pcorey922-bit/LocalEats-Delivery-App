import { createInsertSchema } from "drizzle-zod";
import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { profilesTable } from "./profiles";

export const platformSettingsTable = pgTable("platform_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  settingKey: varchar("setting_key", { length: 120 }).notNull().unique(),
  value: jsonb("value").$type<unknown>().notNull(),
  description: text("description"),
  updatedByProfileId: uuid("updated_by_profile_id").references(() => profilesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlatformSettingSchema = createInsertSchema(platformSettingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;
export type PlatformSetting = typeof platformSettingsTable.$inferSelect;