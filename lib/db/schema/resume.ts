import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { PaperSize, ResumeContent } from "@/lib/resume/schema";
import { user } from "./auth";

// Millisecond precision on purpose: updatedAt round-trips to the browser as an
// ISO string and conflict checks compare it exactly.
const ts = (name: string) => timestamp(name, { precision: 3, withTimezone: true, mode: "date" }).notNull();

export const resume = pgTable(
  "resume",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: jsonb("content").$type<ResumeContent>().notNull(),
    paperSize: text("paper_size").$type<PaperSize>().notNull().default("A4"),
    jobTitle: text("job_title").notNull().default(""),
    jobCompany: text("job_company").notNull().default(""),
    jobDescription: text("job_description").notNull().default(""),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [index("resume_user_updated_idx").on(t.userId, t.updatedAt.desc())],
);
