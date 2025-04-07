CREATE TABLE "rolls" (
	"id" serial PRIMARY KEY NOT NULL,
	"roll_identification" text NOT NULL,
	"job_order_id" integer NOT NULL,
	"roll_number" integer NOT NULL,
	"extruding_qty" real,
	"printing_qty" real,
	"cutting_qty" real,
	"created_date" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'For Printing' NOT NULL,
	"notes" text,
	CONSTRAINT "rolls_roll_identification_unique" UNIQUE("roll_identification")
);
--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_job_order_id_job_orders_id_fk" FOREIGN KEY ("job_order_id") REFERENCES "public"."job_orders"("id") ON DELETE cascade ON UPDATE no action;