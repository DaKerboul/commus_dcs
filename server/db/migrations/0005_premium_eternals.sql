CREATE TABLE "streamer_daily_stats" (
	"streamer_id" integer NOT NULL,
	"day" varchar(10) NOT NULL,
	"dcs_minutes" integer DEFAULT 0 NOT NULL,
	"total_minutes" integer DEFAULT 0 NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"peak_viewers" integer DEFAULT 0 NOT NULL,
	"avg_viewers" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streamer_follower_history" (
	"streamer_id" integer NOT NULL,
	"day" varchar(10) NOT NULL,
	"followers" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streamer_samples" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"streamer_id" integer NOT NULL,
	"stream_id" varchar(32) NOT NULL,
	"observed_at" timestamp DEFAULT now() NOT NULL,
	"viewer_count" integer DEFAULT 0 NOT NULL,
	"game_id" varchar(32),
	"title" text
);
--> statement-breakpoint
CREATE TABLE "streamer_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"streamer_id" integer NOT NULL,
	"stream_id" varchar(32) NOT NULL,
	"started_at" timestamp NOT NULL,
	"last_seen_at" timestamp NOT NULL,
	"is_live" boolean DEFAULT true NOT NULL,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"dcs_sample_count" integer DEFAULT 0 NOT NULL,
	"viewer_sum" integer DEFAULT 0 NOT NULL,
	"peak_viewers" integer DEFAULT 0 NOT NULL,
	"titles" jsonb,
	"vod_url" text,
	"vod_duration" varchar(16),
	"vod_view_count" integer,
	CONSTRAINT "streamer_sessions_stream_id_unique" UNIQUE("stream_id")
);
--> statement-breakpoint
ALTER TABLE "streamers" ADD COLUMN "broadcaster_language" varchar(10);--> statement-breakpoint
ALTER TABLE "streamers" ADD COLUMN "broadcaster_type" varchar(20);--> statement-breakpoint
ALTER TABLE "streamers" ADD COLUMN "is_french" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "streamers" ADD COLUMN "french_override" boolean;--> statement-breakpoint
ALTER TABLE "streamers" ADD COLUMN "followers" integer;--> statement-breakpoint
ALTER TABLE "streamer_daily_stats" ADD CONSTRAINT "streamer_daily_stats_streamer_id_streamers_id_fk" FOREIGN KEY ("streamer_id") REFERENCES "public"."streamers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streamer_follower_history" ADD CONSTRAINT "streamer_follower_history_streamer_id_streamers_id_fk" FOREIGN KEY ("streamer_id") REFERENCES "public"."streamers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streamer_samples" ADD CONSTRAINT "streamer_samples_streamer_id_streamers_id_fk" FOREIGN KEY ("streamer_id") REFERENCES "public"."streamers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streamer_sessions" ADD CONSTRAINT "streamer_sessions_streamer_id_streamers_id_fk" FOREIGN KEY ("streamer_id") REFERENCES "public"."streamers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_streamer_daily_stats_pk" ON "streamer_daily_stats" USING btree ("streamer_id","day");--> statement-breakpoint
CREATE INDEX "idx_streamer_daily_stats_day" ON "streamer_daily_stats" USING btree ("day");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_streamer_follower_history_pk" ON "streamer_follower_history" USING btree ("streamer_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_streamer_samples_unique" ON "streamer_samples" USING btree ("streamer_id","stream_id","observed_at");--> statement-breakpoint
CREATE INDEX "idx_streamer_samples_streamer" ON "streamer_samples" USING btree ("streamer_id","observed_at");--> statement-breakpoint
CREATE INDEX "idx_streamer_samples_stream" ON "streamer_samples" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "idx_streamer_sessions_streamer" ON "streamer_sessions" USING btree ("streamer_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_streamer_sessions_live" ON "streamer_sessions" USING btree ("is_live");