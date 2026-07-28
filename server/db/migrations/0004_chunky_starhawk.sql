CREATE TABLE "community_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"type" varchar(30) NOT NULL,
	"day" varchar(10) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_events" ADD CONSTRAINT "community_events_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_community_events_unique" ON "community_events" USING btree ("community_id","type","day");--> statement-breakpoint
CREATE INDEX "idx_community_events_community" ON "community_events" USING btree ("community_id","day");