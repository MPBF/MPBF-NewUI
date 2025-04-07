CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category_identification" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"arabic_name" text,
	"drawer_no" text,
	"salesperson_id" integer,
	"address" text,
	"photo_url" text
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"pcid" text NOT NULL,
	"customer_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"sub_category_id" integer NOT NULL,
	"size_details" text,
	"thickness" real,
	"cylinder_inch" real,
	"cutting_length_cm" real,
	"raw_material" text,
	"mast_batch" text,
	"is_printed" boolean DEFAULT false,
	"cutting_unit" text,
	"unit_weight_kg" real,
	"packing" text,
	"punching" text,
	"cover" text,
	"notes" text,
	"pcs_pack_roll_qty" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "job_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"sub_category_id" integer NOT NULL,
	"size_details" text,
	"thickness" real,
	"cylinder_inch" real,
	"cutting_length_cm" real,
	"raw_material" text,
	"mast_batch" text,
	"is_printed" boolean DEFAULT false,
	"cutting_unit" text,
	"unit_weight_kg" real,
	"packing" text,
	"punching" text,
	"cover" text,
	"notes" text,
	"quantity" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machine_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"option_details" text NOT NULL,
	"section" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machine_to_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" integer NOT NULL,
	"option_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"identification" text NOT NULL,
	"section" text NOT NULL,
	"code" text NOT NULL,
	"production_date" timestamp NOT NULL,
	"serial_number" text,
	"manufacturer_code" text,
	"manufacturer_name" text
);
--> statement-breakpoint
CREATE TABLE "maintenance_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"machine_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"action_date" timestamp DEFAULT now() NOT NULL,
	"part_type" text NOT NULL,
	"action_type" text NOT NULL,
	"description" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "maintenance_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_date" timestamp DEFAULT now() NOT NULL,
	"machine_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"status" text DEFAULT 'New' NOT NULL,
	"description" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "mix_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"mix_id" integer NOT NULL,
	"material_type" text NOT NULL,
	"quantity_kg" real NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "mix_machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"mix_id" integer NOT NULL,
	"machine_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mix_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"mix_id" integer NOT NULL,
	"order_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixes" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_number" text,
	"mix_date" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"customer_id" integer NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"job_order_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"production_qty" integer NOT NULL,
	"operator_id" integer NOT NULL,
	"roll_no" integer,
	"section" text,
	"notes" text,
	"production_date" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'ready_for_print' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"size_caption" text NOT NULL,
	"product_identification" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salespersons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"salesperson_identification" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"arabic_name" text,
	"role" text NOT NULL,
	"mobile" text,
	"section" text,
	"language_preference" text DEFAULT 'english',
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "machine_to_options" ADD CONSTRAINT "machine_to_options_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_to_options" ADD CONSTRAINT "machine_to_options_option_id_machine_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."machine_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_actions" ADD CONSTRAINT "maintenance_actions_request_id_maintenance_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."maintenance_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_actions" ADD CONSTRAINT "maintenance_actions_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_actions" ADD CONSTRAINT "maintenance_actions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mix_items" ADD CONSTRAINT "mix_items_mix_id_mixes_id_fk" FOREIGN KEY ("mix_id") REFERENCES "public"."mixes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mix_machines" ADD CONSTRAINT "mix_machines_mix_id_mixes_id_fk" FOREIGN KEY ("mix_id") REFERENCES "public"."mixes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mix_machines" ADD CONSTRAINT "mix_machines_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mix_orders" ADD CONSTRAINT "mix_orders_mix_id_mixes_id_fk" FOREIGN KEY ("mix_id") REFERENCES "public"."mixes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mix_orders" ADD CONSTRAINT "mix_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;