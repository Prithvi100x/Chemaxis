import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { reportsTable } from "./reports";

export const generatedReportsTable = pgTable("generated_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  reportId: integer("report_id").notNull().references(() => reportsTable.id),
  targetLanguage: text("target_language").notNull().default("en"),
  customNotes: text("custom_notes"),
  status: text("status").notNull().default("pending"),
  content: jsonb("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGeneratedReportSchema = createInsertSchema(generatedReportsTable).omit({
  id: true,
  createdAt: true,
  content: true,
  status: true,
});
export type InsertGeneratedReport = z.infer<typeof insertGeneratedReportSchema>;
export type GeneratedReport = typeof generatedReportsTable.$inferSelect;
