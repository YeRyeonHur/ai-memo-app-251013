CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"tag" text NOT NULL,
	"model" text DEFAULT 'gemini-2.0-flash' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_note_id_tag_unique" UNIQUE("note_id","tag")
);
--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tags_note_id_idx" ON "tags" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "tags_user_id_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tags_tag_idx" ON "tags" USING btree ("tag");