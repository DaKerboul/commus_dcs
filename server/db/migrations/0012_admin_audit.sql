CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"actor_type" varchar(16) DEFAULT 'admin' NOT NULL,
	"actor_user_id" integer,
	"actor_label" varchar(100),
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(32) NOT NULL,
	"entity_id" varchar(64),
	"community_id" integer,
	"summary" text,
	"metadata" jsonb,
	"backfill_key" varchar(128),
	"approximate" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "reviewed_by" varchar(100);--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_log_created" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_log_entity" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_action" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_log_actor_user" ON "audit_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_community" ON "audit_log" USING btree ("community_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_audit_log_backfill_key" ON "audit_log" USING btree ("backfill_key");--> statement-breakpoint
CREATE INDEX "idx_community_votes_created" ON "community_votes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_submissions_status_created" ON "submissions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_user_favorites_created" ON "user_favorites" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_users_last_login" ON "users" USING btree ("last_login_at");--> statement-breakpoint
CREATE INDEX "idx_users_created" ON "users" USING btree ("created_at");