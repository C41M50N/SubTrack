CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"collection_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_collection_fk" FOREIGN KEY ("user_id","collection_id") REFERENCES "public"."collections"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_user_collection_idx" ON "categories" USING btree ("user_id","collection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_collection_name_unique" ON "categories" USING btree ("collection_id",lower("name"));--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscriptions_category_id_idx" ON "subscriptions" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "category";