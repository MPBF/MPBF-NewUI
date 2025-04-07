ALTER TABLE "rolls" ADD COLUMN "created_by" integer;
ALTER TABLE "rolls" ADD COLUMN "extruded_by" integer;
ALTER TABLE "rolls" ADD COLUMN "printed_by" integer;
ALTER TABLE "rolls" ADD COLUMN "cut_by" integer;
ALTER TABLE "rolls" ADD COLUMN "extruded_date" timestamp;
ALTER TABLE "rolls" ADD COLUMN "printed_date" timestamp;
ALTER TABLE "rolls" ADD COLUMN "cut_date" timestamp;