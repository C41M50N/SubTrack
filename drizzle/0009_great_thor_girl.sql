CREATE TYPE "public"."reminder_invitation_status" AS ENUM('pending', 'shown', 'suppressed');--> statement-breakpoint
CREATE TABLE "onboarding" (
	"user_id" text PRIMARY KEY NOT NULL,
	"first_subscription_saved_at" timestamp with time zone,
	"collection_id" text,
	"reminder_invitation" "reminder_invitation_status",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;