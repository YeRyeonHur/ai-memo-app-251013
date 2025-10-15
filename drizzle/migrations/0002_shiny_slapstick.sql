CREATE TABLE "summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"summary" text NOT NULL,
	"model" text DEFAULT 'gemini-2.0-flash' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "summaries_note_id_idx" ON "summaries" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "summaries_user_id_idx" ON "summaries" USING btree ("user_id");