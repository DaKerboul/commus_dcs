CREATE TABLE "community_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"title" varchar(80) NOT NULL,
	"body" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"grants_role" "member_role" DEFAULT 'editor' NOT NULL,
	"created_by_user_id" integer,
	"expires_at" timestamp NOT NULL,
	"used_by_user_id" integer,
	"used_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invite_codes_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "accent_color" varchar(20);--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "community_sections" ADD CONSTRAINT "community_sections_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_used_by_user_id_users_id_fk" FOREIGN KEY ("used_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_community_sections_community" ON "community_sections" USING btree ("community_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_invite_codes_community" ON "invite_codes" USING btree ("community_id");