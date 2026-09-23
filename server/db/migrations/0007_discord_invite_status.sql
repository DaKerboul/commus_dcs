ALTER TABLE "communities" ADD COLUMN "discord_status" varchar(16);--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "discord_status_url" text;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "discord_checked_at" timestamp;