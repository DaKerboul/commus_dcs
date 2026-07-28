CREATE TYPE "public"."revision_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "community_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"user_id" integer,
	"fields_patch" jsonb NOT NULL,
	"status" "revision_status" DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "community_revisions" ADD CONSTRAINT "community_revisions_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_revisions" ADD CONSTRAINT "community_revisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_community_revisions_status" ON "community_revisions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_community_revisions_community" ON "community_revisions" USING btree ("community_id");