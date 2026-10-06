CREATE TYPE "public"."email_delivery_status" AS ENUM('accepted', 'delayed', 'delivered', 'bounced', 'complained', 'suppressed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_attempt_outcome" AS ENUM('succeeded', 'temporary_failure', 'permanent_failure', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_destination_type" AS ENUM('email', 'webhook', 'discord');--> statement-breakpoint
CREATE TYPE "public"."notification_event_status" AS ENUM('pending', 'sending', 'retrying', 'succeeded', 'failed', 'cancelled', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('renewal_reminder', 'monthly_overview');--> statement-breakpoint
CREATE TYPE "public"."notification_pause_reason" AS ENUM('user', 'rejected', 'failing', 'recipient_rejected');--> statement-breakpoint
CREATE TABLE "notification_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"outcome" "notification_attempt_outcome" NOT NULL,
	"status_code" integer,
	"message" text,
	"request_key" text,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_destinations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_destination_type" NOT NULL,
	"name" text NOT NULL,
	"webhook_url" text,
	"signing_secret" text,
	"retired_signing_secrets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"paused_at" timestamp with time zone,
	"pause_reason" "notification_pause_reason",
	"pause_message" text,
	"consecutive_failed_events" integer DEFAULT 0 NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"last_failure_message" text,
	"last_test_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_destinations_user_id_id_unique" UNIQUE("user_id","id"),
	CONSTRAINT "notification_destinations_webhook_url_required" CHECK (("notification_destinations"."type" = 'email') = ("notification_destinations"."webhook_url" is null)),
	CONSTRAINT "notification_destinations_signing_secret_required" CHECK (("notification_destinations"."type" = 'webhook') = ("notification_destinations"."signing_secret" is not null)),
	CONSTRAINT "notification_destinations_pause_reason_required" CHECK (("notification_destinations"."paused_at" is null) = ("notification_destinations"."pause_reason" is null))
);
--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"destination_id" text NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"period_key" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"time_zone" text NOT NULL,
	"status" "notification_event_status" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"lease_token" text,
	"lease_expires_at" timestamp with time zone,
	"request_key" text,
	"item_count" integer,
	"provider_message_id" text,
	"email_status" "email_delivery_status",
	"email_status_at" timestamp with time zone,
	"last_error" text,
	"succeeded_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_events_destination_kind_period_unique" UNIQUE("destination_id","kind","period_key")
);
--> statement-breakpoint
CREATE TABLE "notification_reminder_claims" (
	"destination_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"invoice_date" date NOT NULL,
	"event_id" text NOT NULL,
	CONSTRAINT "notification_reminder_claims_pk" PRIMARY KEY("destination_id","subscription_id","invoice_date")
);
--> statement-breakpoint
CREATE TABLE "notification_routes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"collection_id" text NOT NULL,
	"destination_id" text NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_routes_collection_destination_kind_unique" UNIQUE("collection_id","destination_id","kind")
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"time_zone" text NOT NULL,
	"reminder_lead_days" integer DEFAULT 3 NOT NULL,
	"timing_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_reminder_lead_days_range" CHECK ("notification_settings"."reminder_lead_days" between 1 and 6)
);
--> statement-breakpoint
CREATE TABLE "resend_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription_invoices" ADD COLUMN "notifications_included" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "notifications_included" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "reminders_eligible_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_attempts" ADD CONSTRAINT "notification_attempts_event_id_notification_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."notification_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_destinations" ADD CONSTRAINT "notification_destinations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_user_destination_fk" FOREIGN KEY ("user_id","destination_id") REFERENCES "public"."notification_destinations"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reminder_claims" ADD CONSTRAINT "notification_reminder_claims_destination_id_notification_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."notification_destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reminder_claims" ADD CONSTRAINT "notification_reminder_claims_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reminder_claims" ADD CONSTRAINT "notification_reminder_claims_event_id_notification_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."notification_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_routes" ADD CONSTRAINT "notification_routes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_routes" ADD CONSTRAINT "notification_routes_user_collection_fk" FOREIGN KEY ("user_id","collection_id") REFERENCES "public"."collections"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_routes" ADD CONSTRAINT "notification_routes_user_destination_fk" FOREIGN KEY ("user_id","destination_id") REFERENCES "public"."notification_destinations"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_attempts_event_id_idx" ON "notification_attempts" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "notification_destinations_user_id_idx" ON "notification_destinations" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_destinations_one_email_per_user" ON "notification_destinations" USING btree ("user_id") WHERE "notification_destinations"."type" = 'email';--> statement-breakpoint
CREATE INDEX "notification_events_status_next_attempt_idx" ON "notification_events" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_events_provider_message_id_unique" ON "notification_events" USING btree ("provider_message_id");--> statement-breakpoint
CREATE INDEX "notification_reminder_claims_event_id_idx" ON "notification_reminder_claims" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "notification_routes_destination_id_idx" ON "notification_routes" USING btree ("destination_id");--> statement-breakpoint
CREATE INDEX "notification_routes_user_id_idx" ON "notification_routes" USING btree ("user_id");