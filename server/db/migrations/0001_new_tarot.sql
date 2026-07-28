CREATE TYPE "public"."claim_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."granted_via" AS ENUM('claim_form', 'invite_code', 'submission', 'admin');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'editor');--> statement-breakpoint
CREATE TABLE "claim_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"message" text,
	"status" "claim_status" DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "community_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "member_role" DEFAULT 'editor' NOT NULL,
	"granted_via" "granted_via" NOT NULL,
	"invited_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"user_id" integer,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"discord_id" varchar(32) NOT NULL,
	"discord_username" varchar(100) NOT NULL,
	"discord_avatar_url" text,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "submitted_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "claim_requests" ADD CONSTRAINT "claim_requests_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_requests" ADD CONSTRAINT "claim_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_snapshots" ADD CONSTRAINT "community_snapshots_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_snapshots" ADD CONSTRAINT "community_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_claim_requests_unique" ON "claim_requests" USING btree ("community_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_claim_requests_status" ON "claim_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_community_members_unique" ON "community_members" USING btree ("community_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_community_members_user" ON "community_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_community_snapshots_community" ON "community_snapshots" USING btree ("community_id","created_at");--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;