CREATE TYPE "public"."ai_usage_feature" AS ENUM('smart_import');--> statement-breakpoint
CREATE TYPE "public"."ai_usage_status" AS ENUM('started', 'succeeded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"feature" "ai_usage_feature" NOT NULL,
	"status" "ai_usage_status" DEFAULT 'started' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"metadata" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_usage_user_feature_created_at_idx" ON "ai_usage" USING btree ("user_id","feature","created_at");