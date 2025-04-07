CREATE TABLE "material_inputs" (
	"id" serial PRIMARY KEY NOT NULL,
	"input_identifier" text NOT NULL,
	"material_id" integer NOT NULL,
	"input_date" timestamp DEFAULT now() NOT NULL,
	"quantity_kg" real NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "material_inputs_input_identifier_unique" UNIQUE("input_identifier")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"name" text NOT NULL,
	"starting_balance_kg" real DEFAULT 0 NOT NULL,
	"current_balance_kg" real DEFAULT 0 NOT NULL,
	"low_stock_threshold_kg" real,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "materials_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
ALTER TABLE "mix_items" ADD COLUMN "material_id" integer;--> statement-breakpoint
ALTER TABLE "material_inputs" ADD CONSTRAINT "material_inputs_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;