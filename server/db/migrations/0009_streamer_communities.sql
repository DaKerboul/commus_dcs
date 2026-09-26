CREATE TYPE "public"."community_streamer_source" AS ENUM('manager', 'admin', 'migrated', 'twitch_url');--> statement-breakpoint
CREATE TYPE "public"."community_streamer_status" AS ENUM('linked', 'dismissed');--> statement-breakpoint
CREATE TABLE "community_streamers" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"streamer_id" integer NOT NULL,
	"status" "community_streamer_status" DEFAULT 'linked' NOT NULL,
	"source" "community_streamer_source" NOT NULL,
	"added_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "streamer_sessions" ADD COLUMN "vod_thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "community_streamers" ADD CONSTRAINT "community_streamers_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_streamers" ADD CONSTRAINT "community_streamers_streamer_id_streamers_id_fk" FOREIGN KEY ("streamer_id") REFERENCES "public"."streamers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_streamers" ADD CONSTRAINT "community_streamers_added_by_user_id_users_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_community_streamers_pair" ON "community_streamers" USING btree ("community_id","streamer_id");--> statement-breakpoint
CREATE INDEX "idx_community_streamers_streamer" ON "community_streamers" USING btree ("streamer_id");--> statement-breakpoint
-- Carry over the links set by hand on streamers.community_id (no longer read).
INSERT INTO "community_streamers" ("community_id", "streamer_id", "status", "source")
SELECT "community_id", "id", 'linked', 'migrated' FROM "streamers" WHERE "community_id" IS NOT NULL
ON CONFLICT DO NOTHING;
