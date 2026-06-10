CREATE TYPE "public"."community_type" AS ENUM('semi_open_squadron', 'closed_squadron', 'open_community', 'event_only', 'esport_team', 'content_creator', 'mod_development', 'screenshot_community', 'atc_community', 'other');--> statement-breakpoint
CREATE TYPE "public"."event_frequency" AS ENUM('very_active', 'very_frequent', 'weekly', 'biweekly', 'monthly', 'occasional', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."historical_period" AS ENUM('ww2', 'cold_war_early', 'cold_war_mid', 'cold_war_late', 'gulf_war', 'early_modern', 'post_modern', 'none');--> statement-breakpoint
CREATE TYPE "public"."recruitment_status" AS ENUM('open', 'closed', 'none', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."size_category" AS ENUM('hub_300_plus', 'very_large_150_plus', 'large_50_plus', 'medium_30_plus', 'medium_under_30', 'small', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "communities" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_description" text,
	"description" text,
	"objectives" text,
	"logo_url" text,
	"size_category" "size_category" DEFAULT 'unknown',
	"community_type" "community_type" DEFAULT 'other',
	"recruitment_status" "recruitment_status" DEFAULT 'unknown',
	"event_frequency" "event_frequency" DEFAULT 'unknown',
	"founder" varchar(255),
	"contact" varchar(255),
	"entry_conditions" text,
	"size_text" varchar(255),
	"discord_url" text,
	"website_url" text,
	"youtube_url" text,
	"instagram_url" text,
	"facebook_url" text,
	"twitch_url" text,
	"twitter_url" text,
	"other_links" jsonb,
	"featured" boolean DEFAULT false,
	"published" boolean DEFAULT true,
	"is_community_pillar" boolean DEFAULT false,
	"votes" integer DEFAULT 0,
	"founded_date" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "communities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "community_experiences" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"experience_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_historical_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"period" "historical_period" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"url" text NOT NULL,
	"alt" varchar(255),
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "community_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"module_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_sought_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"module_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"ip_hash" varchar(64) NOT NULL,
	"fingerprint_hash" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"icon" varchar(50),
	"category" varchar(50),
	CONSTRAINT "experiences_name_unique" UNIQUE("name"),
	CONSTRAINT "experiences_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50),
	"icon_url" text,
	CONSTRAINT "modules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "streamer_dcs_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"streamer_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "streamers" (
	"id" serial PRIMARY KEY NOT NULL,
	"twitch_id" text NOT NULL,
	"twitch_login" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"profile_image_url" text,
	"is_live" boolean DEFAULT false,
	"last_stream_title" text,
	"last_stream_started_at" timestamp,
	"current_viewers" integer DEFAULT 0,
	"community_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "streamers_twitch_id_unique" UNIQUE("twitch_id"),
	CONSTRAINT "streamers_twitch_login_unique" UNIQUE("twitch_login")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_name" varchar(255) NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"short_description" text,
	"description" text,
	"objectives" text,
	"logo_url" text,
	"submission_community_type" text,
	"submission_size_category" text,
	"submission_recruitment_status" text,
	"submission_event_frequency" text,
	"founder" varchar(255),
	"entry_conditions" text,
	"size_text" varchar(255),
	"discord_url" text,
	"website_url" text,
	"youtube_url" text,
	"instagram_url" text,
	"facebook_url" text,
	"twitch_url" text,
	"twitter_url" text,
	"submission_other_links" jsonb,
	"submission_module_names" jsonb,
	"submission_sought_module_names" jsonb,
	"submission_experience_names" jsonb,
	"submission_historical_periods" jsonb,
	"submission_images" jsonb,
	"status" "submission_status" DEFAULT 'pending',
	"admin_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "community_experiences" ADD CONSTRAINT "community_experiences_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_experiences" ADD CONSTRAINT "community_experiences_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_historical_periods" ADD CONSTRAINT "community_historical_periods_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_images" ADD CONSTRAINT "community_images_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_modules" ADD CONSTRAINT "community_modules_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_modules" ADD CONSTRAINT "community_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_sought_modules" ADD CONSTRAINT "community_sought_modules_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_sought_modules" ADD CONSTRAINT "community_sought_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_votes" ADD CONSTRAINT "community_votes_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streamer_dcs_days" ADD CONSTRAINT "streamer_dcs_days_streamer_id_streamers_id_fk" FOREIGN KEY ("streamer_id") REFERENCES "public"."streamers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streamers" ADD CONSTRAINT "streamers_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_community_votes_session_unique" ON "community_votes" USING btree ("community_id","session_id");--> statement-breakpoint
CREATE INDEX "idx_community_votes_community" ON "community_votes" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "idx_community_votes_ip_created" ON "community_votes" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "idx_community_votes_fingerprint_created" ON "community_votes" USING btree ("fingerprint_hash","created_at");