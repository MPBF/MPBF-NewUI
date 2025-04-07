import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define available roles
export const USER_ROLES = {
  ADMIN: 'admin',  // Changed to lowercase to match the actual database value
  PRODUCTION_MANAGER: 'production_manager',
  SALESPERSON: 'salesperson',
  OPERATOR: 'operator',
  MAINTENANCE: 'maintenance'
} as const;

// Define permissions map with fine-grained access control
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    // View permissions
    'users:view', 'customers:view', 'products:view', 'categories:view', 'orders:view', 'production:view', 'reports:view', 'settings:view', 'machines:view', 'maintenance:view',
    // Management permissions
    'users:manage', 'customers:manage', 'products:manage', 'categories:manage', 'orders:manage', 'production:manage', 'reports:manage', 'settings:manage', 'machines:manage', 'maintenance:manage',
    // Create permissions
    'users:create', 'customers:create', 'products:create', 'categories:create', 'orders:create', 'production:create', 'machines:create', 'maintenance:create',
    // Edit permissions
    'users:edit', 'customers:edit', 'products:edit', 'categories:edit', 'orders:edit', 'production:edit', 'machines:edit', 'maintenance:edit',
    // Delete permissions
    'users:delete', 'customers:delete', 'products:delete', 'categories:delete', 'orders:delete', 'production:delete', 'machines:delete', 'maintenance:delete',
    // Print permissions
    'orders:print', 'production:print', 'reports:print'
  ],
  [USER_ROLES.PRODUCTION_MANAGER]: [
    // View permissions
    'products:view', 'categories:view', 'production:view', 'reports:view', 'machines:view',
    // Management permissions
    'products:manage', 'categories:manage', 'production:manage', 'reports:manage', 'machines:manage',
    // Create permissions
    'production:create', 'machines:create',
    // Edit permissions
    'production:edit', 'machines:edit',
    // Print permissions
    'production:print', 'reports:print'
  ],
  [USER_ROLES.SALESPERSON]: [
    // View permissions
    'customers:view', 'products:view', 'categories:view', 'orders:view',
    // Management permissions
    'customers:manage', 'orders:manage',
    // Create permissions
    'customers:create', 'orders:create',
    // Edit permissions
    'customers:edit', 'orders:edit',
    // Print permissions
    'orders:print'
  ],
  [USER_ROLES.OPERATOR]: [
    // View permissions
    'production:view', 'machines:view', 'maintenance:view',
    // Create permissions
    'production:create', 'maintenance:create', 
    // Edit permissions (limited)
    'production:edit'
  ],
  [USER_ROLES.MAINTENANCE]: [
    // View permissions
    'machines:view', 'maintenance:view',
    // Management permissions 
    'maintenance:manage',
    // Create permissions
    'maintenance:create',
    // Edit permissions
    'maintenance:edit'
  ]
} as const;

export type UserRole = keyof typeof ROLE_PERMISSIONS;

// User table and schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  arabic_name: text("arabic_name"), // Arabic name for multilingual display
  role: text("role").notNull(), // admin, production_manager, salesperson, operator
  mobile: text("mobile"),
  section: text("section"), // Department or section
  language_preference: text("language_preference").default("english"), // english, arabic
  dashboard_preferences: json("dashboard_preferences"), // Store dashboard widget layout and preferences
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Salesperson table and schema
export const salespersons = pgTable("salespersons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  salesperson_identification: text("salesperson_identification"),
});

export const insertSalespersonSchema = createInsertSchema(salespersons).omit({ id: true });
export type InsertSalesperson = z.infer<typeof insertSalespersonSchema>;
export type Salesperson = typeof salespersons.$inferSelect;

// Customer table and schema
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  arabic_name: text("arabic_name"), // Arabic translation of the customer name
  drawer_no: text("drawer_no"),
  phone: text("phone"), // Phone number for SMS notifications
  email: text("email"), // Email for notifications
  salesperson_id: integer("salesperson_id"),
  address: text("address"),
  photo_url: text("photo_url"),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Product Category table and schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category_identification: text("category_identification").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Product Subcategory (Product) table and schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  category_id: integer("category_id").notNull(),
  name: text("name").notNull(),
  size_caption: text("size_caption").notNull(),
  product_identification: text("product_identification").notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Item table and schema
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  pcid: text("pcid").notNull(),
  customer_id: integer("customer_id").notNull(),
  category_id: integer("category_id").notNull(),
  sub_category_id: integer("sub_category_id").notNull(),
  size_details: text("size_details"),
  thickness: real("thickness"),
  cylinder_inch: real("cylinder_inch"),
  cutting_length_cm: real("cutting_length_cm"),
  raw_material: text("raw_material"),
  mast_batch: text("mast_batch"),
  is_printed: boolean("is_printed").default(false),
  cutting_unit: text("cutting_unit"),
  unit_weight_kg: real("unit_weight_kg"),
  packing: text("packing"),
  punching: text("punching"),
  cover: text("cover"),
  notes: text("notes"),
  pcs_pack_roll_qty: integer("pcs_pack_roll_qty").default(0),
});

export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

// Order table and schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  order_date: timestamp("order_date").defaultNow().notNull(),
  customer_id: integer("customer_id").notNull(),
  notes: text("notes"),
  status: text("status").default("pending").notNull(), // pending, for_production, hold, finish
});

// Create the order schema with a custom transformation for the date field
export const insertOrderSchema = createInsertSchema(orders)
  .omit({ id: true })
  .transform((data) => {
    // If order_date is a string (ISO format), convert it to a Date object
    if (typeof data.order_date === 'string') {
      return {
        ...data,
        order_date: new Date(data.order_date)
      };
    }
    return data;
  });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Job Order table and schema
export const jobOrders = pgTable("job_orders", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull(),
  item_id: integer("item_id").notNull(),
  customer_id: integer("customer_id").notNull(),
  category_id: integer("category_id").notNull(),
  sub_category_id: integer("sub_category_id").notNull(),
  size_details: text("size_details"),
  thickness: real("thickness"),
  cylinder_inch: real("cylinder_inch"),
  cutting_length_cm: real("cutting_length_cm"),
  raw_material: text("raw_material"),
  mast_batch: text("mast_batch"),
  is_printed: boolean("is_printed").default(false),
  cutting_unit: text("cutting_unit"),
  unit_weight_kg: real("unit_weight_kg"),
  packing: text("packing"),
  punching: text("punching"),
  cover: text("cover"),
  notes: text("notes"),
  quantity: integer("quantity").notNull(),
  produced_quantity: real("produced_quantity").default(0),
  waste_quantity: real("waste_quantity").default(0),
  production_status: text("production_status").default("Not Started").notNull(), // Not Started, In Progress, Completed, Overproduced
  status: text("status").default("pending").notNull(), // pending, in_progress, completed, cancelled
});

export const insertJobOrderSchema = createInsertSchema(jobOrders).omit({ id: true });
export type InsertJobOrder = z.infer<typeof insertJobOrderSchema>;
export type JobOrder = typeof jobOrders.$inferSelect;

// Production table and schema
export const productions = pgTable("productions", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull(),
  job_order_id: integer("job_order_id").notNull(),
  customer_id: integer("customer_id").notNull(),
  product_id: integer("product_id").notNull(),
  production_qty: integer("production_qty").notNull(),
  operator_id: integer("operator_id").notNull(),
  roll_no: integer("roll_no"),
  section: text("section"),
  notes: text("notes"),
  production_date: timestamp("production_date").defaultNow().notNull(),
  status: text("status").default("ready_for_print").notNull(), // ready_for_print, ready_for_cut, ready_for_deliver, damage
});

// Create the production schema with a custom transformation for the date field
export const insertProductionSchema = createInsertSchema(productions)
  .omit({ id: true })
  .transform((data) => {
    // If production_date is a string (ISO format), convert it to a Date object
    if (typeof data.production_date === 'string') {
      return {
        ...data,
        production_date: new Date(data.production_date)
      };
    }
    return data;
  });
export type InsertProduction = z.infer<typeof insertProductionSchema>;
export type Production = typeof productions.$inferSelect;

// Production Rolls table and schema
export const rolls = pgTable("rolls", {
  id: serial("id").primaryKey(),
  roll_identification: text("roll_identification").notNull().unique(),
  job_order_id: integer("job_order_id").notNull().references(() => jobOrders.id, { onDelete: 'cascade' }),
  roll_number: integer("roll_number").notNull(),
  extruding_qty: real("extruding_qty"),
  printing_qty: real("printing_qty"),
  cutting_qty: real("cutting_qty"),
  created_date: timestamp("created_date").defaultNow().notNull(),
  created_by: integer("created_by"), // User ID who created the roll
  extruded_by: integer("extruded_by"), // User ID who extruded the roll
  printed_by: integer("printed_by"), // User ID who printed the roll
  cut_by: integer("cut_by"), // User ID who cut the roll
  extruded_date: timestamp("extruded_date"), // When the roll was extruded
  printed_date: timestamp("printed_date"), // When the roll was printed
  cut_date: timestamp("cut_date"), // When the roll was cut
  status: text("status").default("For Printing").notNull(), // For Printing, For Cutting, For Receiving
  notes: text("notes"),
});

export const insertRollSchema = createInsertSchema(rolls)
  .omit({ id: true, roll_identification: true })
  .extend({
    roll_number: z.coerce.number().min(1, "Roll number is required"),
    job_order_id: z.coerce.number().min(1, "Job order is required"),
    extruding_qty: z.coerce.number().min(0, "Extruding quantity must be positive").nullable().optional(),
    status: z.string().default("For Printing"),
    created_by: z.coerce.number().optional(),
    extruded_by: z.coerce.number().optional(),
    printed_by: z.coerce.number().optional(),
    cut_by: z.coerce.number().optional(),
    extruded_date: z.preprocess(
      val => val instanceof Date ? val : val ? new Date(val as string) : null,
      z.date().optional().nullable()
    ),
    printed_date: z.preprocess(
      val => val instanceof Date ? val : val ? new Date(val as string) : null,
      z.date().optional().nullable()
    ),
    cut_date: z.preprocess(
      val => val instanceof Date ? val : val ? new Date(val as string) : null,
      z.date().optional().nullable()
    ),
  })
  .transform((data) => {
    return {
      ...data,
      roll_identification: `ROLL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      roll_number: data.roll_number || 1, // Default to 1 if not provided
    };
  });
export type InsertRoll = z.infer<typeof insertRollSchema>;
export type Roll = typeof rolls.$inferSelect;

// Machine Schema
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  identification: text("identification").notNull(),
  section: text("section").notNull(), // Extrusion, Printing, Cutting
  code: text("code").notNull(),
  production_date: timestamp("production_date").notNull(),
  serial_number: text("serial_number"),
  manufacturer_code: text("manufacturer_code"),
  manufacturer_name: text("manufacturer_name"),
});

export const insertMachineSchema = createInsertSchema(machines, {
  section: z.string().min(1, "Section is required"),
  code: z.string().min(1, "Machine code is required"),
  production_date: z.preprocess(
    val => val instanceof Date ? val : new Date(val as string),
    z.date({
      required_error: "Production date is required",
    })
  ),
  identification: z.string().optional(),
  serial_number: z.string().optional().nullable(),
  manufacturer_code: z.string().optional().nullable(),
  manufacturer_name: z.string().optional().nullable(),
}).omit({ id: true });
export type InsertMachine = z.infer<typeof insertMachineSchema>;
export type Machine = typeof machines.$inferSelect;

// Machine Option Schema
export const machineOptions = pgTable("machine_options", {
  id: serial("id").primaryKey(),
  option_details: text("option_details").notNull(),
  section: text("section").notNull(), // Extrusion, Printing, Cutting
});

export const insertMachineOptionSchema = createInsertSchema(machineOptions, {
  option_details: z.string().min(1, "Option details are required"),
  section: z.string().min(1, "Section is required")
}).omit({ id: true });
export type InsertMachineOption = z.infer<typeof insertMachineOptionSchema>;
export type MachineOption = typeof machineOptions.$inferSelect;

// Machine to Option (Many-to-Many relationship)
export const machineToOptions = pgTable("machine_to_options", {
  id: serial("id").primaryKey(),
  machine_id: integer("machine_id").notNull().references(() => machines.id, { onDelete: 'cascade' }),
  option_id: integer("option_id").notNull().references(() => machineOptions.id, { onDelete: 'cascade' }),
});

export const insertMachineToOptionSchema = createInsertSchema(machineToOptions).omit({ id: true });
export type InsertMachineToOption = z.infer<typeof insertMachineToOptionSchema>;
export type MachineToOption = typeof machineToOptions.$inferSelect;

// Define material types for mixing
export const MATERIAL_TYPES = [
  'HDPE',
  'LDPE',
  'LLDPE',
  'Regrind',
  'Filler',
  'Color',
  'D2w',
  'Material' // Added for simplified mixing system
] as const;

// Mixes table
export const mixes = pgTable("mixes", {
  id: serial("id").primaryKey(),
  batch_number: text("batch_number"),
  mix_date: timestamp("mix_date").defaultNow().notNull(),
  created_by: integer("created_by").notNull(),
  status: text("status").default("Pending").notNull(), // Pending, In Progress, Completed
  notes: text("notes"),
});

// Custom insert schema for mixes that allows string dates and transforms them
export const insertMixSchema = createInsertSchema(mixes, {
  mix_date: z.preprocess(
    val => val instanceof Date ? val : new Date(val as string),
    z.date().optional()
  ),
}).omit({ id: true })
.transform((data) => {
  // If mix_date is a string (ISO format), convert it to a Date object
  if (typeof data.mix_date === 'string') {
    return {
      ...data,
      mix_date: new Date(data.mix_date)
    };
  }
  return data;
});
export type InsertMix = z.infer<typeof insertMixSchema>;
export type Mix = typeof mixes.$inferSelect;

// Mix items table
export const mixItems = pgTable("mix_items", {
  id: serial("id").primaryKey(),
  mix_id: integer("mix_id").notNull().references(() => mixes.id, { onDelete: 'cascade' }),
  material_type: text("material_type").notNull(),
  material_id: integer("material_id"),
  quantity_kg: real("quantity_kg").notNull(),
  notes: text("notes"),
});

export const insertMixItemSchema = createInsertSchema(mixItems).omit({ id: true });
export type InsertMixItem = z.infer<typeof insertMixItemSchema>;
export type MixItem = typeof mixItems.$inferSelect;

// Mix Orders table - represents the many-to-many relationship between mixes and orders
export const mixOrders = pgTable("mix_orders", {
  id: serial("id").primaryKey(),
  mix_id: integer("mix_id").notNull().references(() => mixes.id, { onDelete: 'cascade' }),
  order_id: integer("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
});

export const insertMixOrderSchema = createInsertSchema(mixOrders).omit({ id: true });
export type InsertMixOrder = z.infer<typeof insertMixOrderSchema>;
export type MixOrder = typeof mixOrders.$inferSelect;

// Mix Machines table - represents the many-to-many relationship between mixes and machines
export const mixMachines = pgTable("mix_machines", {
  id: serial("id").primaryKey(),
  mix_id: integer("mix_id").notNull().references(() => mixes.id, { onDelete: 'cascade' }),
  machine_id: integer("machine_id").notNull().references(() => machines.id, { onDelete: 'cascade' }),
});

export const insertMixMachineSchema = createInsertSchema(mixMachines).omit({ id: true });
export type InsertMixMachine = z.infer<typeof insertMixMachineSchema>;
export type MixMachine = typeof mixMachines.$inferSelect;

// Define machine part types for maintenance
export const PART_TYPES = [
  'Shaft',
  'Screw',
  'Roller',
  'Gear',
  'Motor',
  'Servo',
  'Blade',
  'Contactor',
  'Filter',
  'Heater',
  'Sealer',
  'Valve',
  'Hose',
  'Rubber',
  'Die',
  'Bearing',
  'Other'
] as const;

// Define action types for maintenance
export const ACTION_TYPES = [
  'Workshop',
  'Replacement',
  'Adjustments'
] as const;

// Maintenance Request table
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  request_date: timestamp("request_date").defaultNow().notNull(),
  machine_id: integer("machine_id").notNull().references(() => machines.id),
  created_by: integer("created_by").notNull().references(() => users.id),
  status: text("status").default("New").notNull(), // New, Under Maintain, Fixed
  description: text("description"),
  notes: text("notes"),
});

// Create base schema for maintenance requests
const baseMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({ id: true });

// Create the maintenance request schema with refinements and transformations
export const insertMaintenanceRequestSchema = baseMaintenanceRequestSchema
  .extend({
    description: z.string().min(1, "Description is required"), // Make description required with min length 1
    notes: z.string().optional().default(""), // Allow optional notes but default to empty string
    status: z.string().default("New") // Ensure status has a default
  })
  .transform((data) => {
    // If request_date is a string (ISO format), convert it to a Date object
    if (typeof data.request_date === 'string') {
      return {
        ...data,
        request_date: new Date(data.request_date),
        // Ensure no null values are sent for string fields
        notes: data.notes || "", 
        description: data.description || ""
      };
    }
    return {
      ...data,
      notes: data.notes || "", 
      description: data.description || ""
    };
  });

// Export a partial schema for updates
export const updateMaintenanceRequestSchema = baseMaintenanceRequestSchema.partial();

export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type UpdateMaintenanceRequest = z.infer<typeof updateMaintenanceRequestSchema>;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;

// Maintenance Action table
export const maintenanceActions = pgTable("maintenance_actions", {
  id: serial("id").primaryKey(),
  request_id: integer("request_id").notNull().references(() => maintenanceRequests.id, { onDelete: 'cascade' }),
  machine_id: integer("machine_id").notNull().references(() => machines.id),
  created_by: integer("created_by").notNull().references(() => users.id),
  action_date: timestamp("action_date").defaultNow().notNull(),
  part_type: text("part_type").notNull(), // Shaft, Screw, Roller, etc.
  action_type: text("action_type").notNull(), // Workshop, Replacement, Adjustments
  description: text("description"),
  notes: text("notes"),
});

// Create base schema for maintenance actions
const baseMaintenanceActionSchema = createInsertSchema(maintenanceActions).omit({ id: true });

// Create the maintenance action schema with refinements and transformations
export const insertMaintenanceActionSchema = baseMaintenanceActionSchema
  .extend({
    description: z.string().default(""), // Default empty string for description
    notes: z.string().optional().default(""), // Allow optional notes but default to empty string
    part_type: z.string().min(1, "Part type is required"),
    action_type: z.string().min(1, "Action type is required")
  })
  .transform((data) => {
    // If action_date is a string (ISO format), convert it to a Date object
    if (typeof data.action_date === 'string') {
      return {
        ...data,
        action_date: new Date(data.action_date),
        // Ensure no null values are sent for string fields
        notes: data.notes || "", 
        description: data.description || "",
        part_type: data.part_type || "",
        action_type: data.action_type || ""
      };
    }
    return {
      ...data,
      notes: data.notes || "", 
      description: data.description || "",
      part_type: data.part_type || "",
      action_type: data.action_type || ""
    };
  });

// Export a partial schema for updates
export const updateMaintenanceActionSchema = baseMaintenanceActionSchema.partial();

export type InsertMaintenanceAction = z.infer<typeof insertMaintenanceActionSchema>;
export type UpdateMaintenanceAction = z.infer<typeof updateMaintenanceActionSchema>;
export type MaintenanceAction = typeof maintenanceActions.$inferSelect;

// Material inventory tables

// Materials table for managing inventory items
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  name: text("name").notNull(),
  starting_balance_kg: real("starting_balance_kg").notNull().default(0),
  current_balance_kg: real("current_balance_kg").notNull().default(0),
  low_stock_threshold_kg: real("low_stock_threshold_kg"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  identifier: true, // Auto-generated
  current_balance_kg: true, // Calculated field
  created_at: true,
  updated_at: true,
});
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

// Material inputs table for tracking additions to inventory
export const materialInputs = pgTable("material_inputs", {
  id: serial("id").primaryKey(),
  input_identifier: text("input_identifier").notNull().unique(),
  material_id: integer("material_id").notNull().references(() => materials.id),
  input_date: timestamp("input_date").defaultNow().notNull(),
  quantity_kg: real("quantity_kg").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertMaterialInputSchema = createInsertSchema(materialInputs)
  .omit({
    id: true,
    input_identifier: true, // Auto-generated
    created_at: true,
  })
  .transform((data) => {
    // Transform input_date from string to Date if needed
    const transformed = {
      ...data,
      input_identifier: `INP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    
    // Handle date conversion
    if (typeof data.input_date === 'string') {
      transformed.input_date = new Date(data.input_date);
    }
    
    return transformed;
  });
export type InsertMaterialInput = z.infer<typeof insertMaterialInputSchema>;
export type MaterialInput = typeof materialInputs.$inferSelect;

// Receiving Orders table and schema
export const receivingOrders = pgTable("receiving_orders", {
  id: serial("id").primaryKey(),
  received_date: timestamp("received_date").defaultNow().notNull(),
  job_order_id: integer("job_order_id").notNull().references(() => jobOrders.id),
  roll_id: integer("roll_id").references(() => rolls.id), // Made nullable
  received_by: integer("received_by").notNull().references(() => users.id),
  received_quantity: real("received_quantity").notNull(),
  notes: text("notes"),
  status: text("status").default("received"),
  created_date: timestamp("created_date").defaultNow(),
});

export const insertReceivingOrderSchema = createInsertSchema(receivingOrders)
  .omit({ id: true, created_date: true })
  .extend({
    received_date: z.preprocess(
      val => val instanceof Date ? val : new Date(val as string),
      z.date()
    ),
    received_quantity: z.coerce.number().min(0, "Received quantity must be positive"),
    status: z.string().default("received"),
    roll_id: z.coerce.number().nullable().optional() // Make roll_id optional
  })
  .transform((data) => {
    // If received_date is a string (ISO format), convert it to a Date object
    if (typeof data.received_date === 'string') {
      return {
        ...data,
        received_date: new Date(data.received_date)
      };
    }
    return data;
  });
export type InsertReceivingOrder = z.infer<typeof insertReceivingOrderSchema>;
export type ReceivingOrder = typeof receivingOrders.$inferSelect;
