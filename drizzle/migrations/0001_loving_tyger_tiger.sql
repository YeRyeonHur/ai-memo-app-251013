ALTER TABLE "notes" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "notes_deleted_at_idx" ON "notes" USING btree ("deleted_at");