CREATE TABLE "resume" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"paper_size" text DEFAULT 'A4' NOT NULL,
	"job_title" text DEFAULT '' NOT NULL,
	"job_company" text DEFAULT '' NOT NULL,
	"job_description" text DEFAULT '' NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resume" ADD CONSTRAINT "resume_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resume_user_updated_idx" ON "resume" USING btree ("user_id","updated_at" DESC NULLS LAST);