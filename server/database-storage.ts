import { 
  User, InsertUser, users,
  Customer, InsertCustomer, customers,
  Salesperson, InsertSalesperson, salespersons,
  Category, InsertCategory, categories,
  Product, InsertProduct, products,
  Item, InsertItem, items,
  Order, InsertOrder, orders,
  JobOrder, InsertJobOrder, jobOrders,
  Production, InsertProduction, productions,
  Roll, InsertRoll, rolls,
  Machine, InsertMachine, machines,
  MachineOption, InsertMachineOption, machineOptions,
  MachineToOption, InsertMachineToOption, machineToOptions,
  Mix, InsertMix, mixes,
  MixItem, InsertMixItem, mixItems,
  MixOrder, InsertMixOrder, mixOrders,
  MixMachine, InsertMixMachine, mixMachines,
  MaintenanceRequest, InsertMaintenanceRequest, maintenanceRequests,
  MaintenanceAction, InsertMaintenanceAction, maintenanceActions,
  Material, InsertMaterial, materials,
  MaterialInput, InsertMaterialInput, materialInputs,
  ReceivingOrder, InsertReceivingOrder, receivingOrders,
  MATERIAL_TYPES
} from '@shared/schema';
import { db } from './db';
import { eq, and, inArray, or, gte, lte, desc } from 'drizzle-orm';
import connectPg from 'connect-pg-simple';
import session from 'express-session';

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage {
  sessionStore: session.Store;

  constructor() {
    // Build connection string from individual parameters if DATABASE_URL is not provided
    const dbUrl = process.env.DATABASE_URL || 
      `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
    
    console.log('Initializing database connection...');
    
    this.sessionStore = new PostgresSessionStore({
      conString: dbUrl,
      createTableIfMissing: true
    });
    
    // Initialize database with sample user
    this.initializeDatabase();
  }
  
  private async initializeDatabase() {
    try {
      console.log("Attempting to initialize database...");
      // Check if admin user exists
      const adminUser = await this.getUserByUsername('admin');
      
      if (!adminUser) {
        console.log("Admin user not found, creating initial data...");
        try {
          // Create admin user
          await this.createUser({
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'Admin',
            mobile: null,
            section: null
          });
          
          // Add some default categories from sample data
          await this.createCategory({ name: "Packet Trash Bag", category_identification: "1" });
          await this.createCategory({ name: "Roll Trash Bag", category_identification: "2" });
          await this.createCategory({ name: "T-Shirt Bag", category_identification: "3" });
          await this.createCategory({ name: "Calendar Bag", category_identification: "4" });
          await this.createCategory({ name: "Folded Table Cover", category_identification: "5" });
          await this.createCategory({ name: "Non-Folded Table Cover", category_identification: "6" });
          await this.createCategory({ name: "Nylon Factory", category_identification: "7" });
          await this.createCategory({ name: "Nylon Bag", category_identification: "8" });
          await this.createCategory({ name: "LD Bag", category_identification: "9" });
          await this.createCategory({ name: "HD Bag", category_identification: "10" });
          
          // Add some products from sample data
          await this.createProduct({ category_id: 1, name: "5GP", size_caption: "5GP", product_identification: "1" });
          await this.createProduct({ category_id: 1, name: "8GP", size_caption: "8GP", product_identification: "2" });
          await this.createProduct({ category_id: 1, name: "10GP", size_caption: "10GP", product_identification: "3" });
          await this.createProduct({ category_id: 1, name: "20GP", size_caption: "20GP", product_identification: "4" });
          await this.createProduct({ category_id: 1, name: "30GP", size_caption: "30GP", product_identification: "5" });
          await this.createProduct({ category_id: 1, name: "50GP", size_caption: "50GP", product_identification: "6" });
          await this.createProduct({ category_id: 1, name: "55GP", size_caption: "55GP", product_identification: "7" });
          await this.createProduct({ category_id: 1, name: "60GP", size_caption: "60GP", product_identification: "8" });
          await this.createProduct({ category_id: 1, name: "70GP", size_caption: "70GP", product_identification: "9" });
          await this.createProduct({ category_id: 1, name: "80GP", size_caption: "80GP", product_identification: "10" });
          
          console.log("Database initialized with sample data");
        } catch (innerError) {
          console.error("Error creating initial data:", innerError);
          console.log("Continuing application startup despite initialization error");
        }
      } else {
        console.log("Admin user already exists, skipping initialization");
      }
    } catch (error) {
      console.error("Error checking database state:", error);
      console.log("Continuing application startup despite database initialization error");
      // Continue application execution instead of crashing
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    if (!id || isNaN(id)) {
      console.error(`Invalid user ID: ${id}`);
      return undefined;
    }
    try {
      console.log(`Searching for user with ID: ${id}`);
      const [user] = await db.select().from(users).where(eq(users.id, id));
      
      if (user) {
        console.log(`Found user with ID ${id}: username=${user.username}, role=${user.role}`);
      } else {
        console.log(`No user found with ID ${id}`);
      }
      
      return user;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!username) {
      console.error("Invalid username: empty");
      return undefined;
    }
    
    try {
      console.log(`Searching for user with username: ${username}`);
      const [user] = await db.select().from(users).where(eq(users.username, username));
      
      if (user) {
        console.log(`Found user with username ${username}: id=${user.id}, role=${user.role}`);
      } else {
        console.log(`No user found with username ${username}`);
      }
      
      return user;
    } catch (error) {
      console.error(`Error fetching user with username ${username}:`, error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async saveDashboardPreferences(userId: number, preferences: any): Promise<User | undefined> {
    try {
      const [user] = await db.update(users)
        .set({ dashboard_preferences: preferences })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error(`Error saving dashboard preferences for user ${userId}:`, error);
      return undefined;
    }
  }
  
  // Customer methods
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers)
      .set(customerData)
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return !!result;
  }

  async listCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }
  
  // Salesperson methods
  async getSalesperson(id: number): Promise<Salesperson | undefined> {
    const [salesperson] = await db.select().from(salespersons).where(eq(salespersons.id, id));
    return salesperson;
  }

  async createSalesperson(insertSalesperson: InsertSalesperson): Promise<Salesperson> {
    const [salesperson] = await db.insert(salespersons).values(insertSalesperson).returning();
    return salesperson;
  }

  async updateSalesperson(id: number, salespersonData: Partial<InsertSalesperson>): Promise<Salesperson | undefined> {
    const [salesperson] = await db.update(salespersons)
      .set(salespersonData)
      .where(eq(salespersons.id, id))
      .returning();
    return salesperson;
  }

  async deleteSalesperson(id: number): Promise<boolean> {
    const result = await db.delete(salespersons).where(eq(salespersons.id, id));
    return !!result;
  }

  async listSalespersons(): Promise<Salesperson[]> {
    return await db.select().from(salespersons);
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db.update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return !!result;
  }

  async listCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category_id, categoryId));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return !!result;
  }

  async listProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }
  
  // Item methods
  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }
  
  async getItemsByCustomer(customerId: number): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.customer_id, customerId));
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db.insert(items).values(insertItem).returning();
    return item;
  }

  async updateItem(id: number, itemData: Partial<InsertItem>): Promise<Item | undefined> {
    const [item] = await db.update(items)
      .set(itemData)
      .where(eq(items.id, id))
      .returning();
    return item;
  }

  async deleteItem(id: number): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id));
    return !!result;
  }

  async listItems(): Promise<Item[]> {
    return await db.select().from(items);
  }
  
  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  
  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customer_id, customerId));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    console.log("DEBUG: Preparing to insert order into database:", JSON.stringify(insertOrder, null, 2));
    
    // Validate required fields
    if (!insertOrder.customer_id) {
      console.error("VALIDATION ERROR: Missing customer_id");
      throw new Error("customer_id is required");
    }
    
    // Make sure customer_id is a number
    if (typeof insertOrder.customer_id !== 'number') {
      console.error(`VALIDATION ERROR: customer_id must be a number, received ${typeof insertOrder.customer_id}`);
      try {
        // Try to convert it
        insertOrder.customer_id = Number(insertOrder.customer_id);
        console.log("Converted customer_id to number:", insertOrder.customer_id);
      } catch (e) {
        throw new Error("customer_id must be a valid number");
      }
    }

    // Ensure order_date is a Date object
    if (!(insertOrder.order_date instanceof Date)) {
      console.error(`VALIDATION ERROR: order_date must be a Date object, received ${typeof insertOrder.order_date}`);
      try {
        // Try to convert it - ensure it's not undefined first
        if (insertOrder.order_date) {
          insertOrder.order_date = new Date(insertOrder.order_date);
          console.log("Converted order_date to Date object:", insertOrder.order_date);
        } else {
          // Use current date as default if undefined
          insertOrder.order_date = new Date();
          console.log("Using current date as default for order_date");
        }
      } catch (e) {
        throw new Error("order_date must be a valid date");
      }
    }
    
    // Ensure the customer exists
    try {
      const customer = await this.getCustomer(insertOrder.customer_id);
      if (!customer) {
        console.error(`VALIDATION ERROR: Customer with ID ${insertOrder.customer_id} not found`);
        throw new Error(`Customer with ID ${insertOrder.customer_id} not found`);
      }
      console.log("Customer exists:", customer.id, customer.name);
    } catch (error) {
      console.error("Customer validation error:", error);
      // Continue anyway, as we don't want to block order creation if the customer check fails
    }
    
    // Prepare the query
    try {
      console.log("DEBUG: SQL Values to insert:", JSON.stringify(insertOrder, null, 2));
      console.log("DEBUG: Executing insert query...");
      
      // Execute the query with detailed error handling
      let order: Order;
      try {
        const result = await db.insert(orders).values(insertOrder).returning();
        console.log("DEBUG: Insert query result:", JSON.stringify(result, null, 2));
        
        if (!result || result.length === 0) {
          console.error("DEBUG: Insert query returned empty result");
          throw new Error("Database insert returned empty result");
        }
        
        order = result[0];
        
        // Verify the returned order has an ID
        if (!order.id) {
          console.error("DEBUG: Returned order missing ID:", order);
          throw new Error("Database returned order without ID");
        }
        
        console.log("DEBUG: Order created successfully with ID:", order.id);
      } catch (dbError) {
        console.error("DATABASE ERROR during insert:", dbError);
        if (dbError instanceof Error) {
          console.error("Error details:", dbError.message);
          console.error("Stack trace:", dbError.stack);
        }
        throw dbError;
      }
      
      // Double-check that the order was created by fetching it back
      try {
        const verifiedOrder = await this.getOrder(order.id);
        if (!verifiedOrder) {
          console.warn("WARNING: Order was created but could not be verified by getOrder");
        } else {
          console.log("DEBUG: Order verified by getOrder:", verifiedOrder.id);
        }
      } catch (verifyError) {
        console.warn("WARNING: Error verifying order after creation:", verifyError);
        // Don't fail the request if verification fails
      }
      
      return order;
    } catch (error) {
      console.error("DEBUG: Critical error creating order:", error);
      console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
      throw error;
    }
  }

  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set(orderData)
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      // Find all job orders for this order
      const jobOrdersToDelete = await this.getJobOrdersByOrder(id);
      
      // For each job order, delete associated rolls
      for (const jobOrder of jobOrdersToDelete) {
        const rollsToDelete = await this.getRollsByJobOrder(jobOrder.id);
        
        // Delete rolls
        for (const roll of rollsToDelete) {
          await db.delete(rolls).where(eq(rolls.id, roll.id));
        }
        
        // Delete the job order
        await db.delete(jobOrders).where(eq(jobOrders.id, jobOrder.id));
      }
      
      // Also remove any mix_orders associations
      await db.delete(mixOrders).where(eq(mixOrders.order_id, id));
      
      // Finally, delete the order itself
      const result = await db.delete(orders).where(eq(orders.id, id));
      return !!result;
    } catch (error) {
      console.error("Error cascading delete order:", error);
      return false;
    }
  }

  async listOrders(): Promise<Order[]> {
    console.log("DEBUG: Listing all orders from database");
    console.log("Timestamp:", new Date().toISOString());
    
    try {
      // Execute the query with additional debugging
      console.log("DEBUG: Executing SELECT query on 'orders' table");
      const results = await db.select().from(orders);
      
      console.log("DEBUG: Orders retrieved count:", results.length);
      
      if (results.length === 0) {
        console.warn("WARNING: No orders found in the database!");
      } else {
        console.log("DEBUG: First few orders:", results.slice(0, 3));
        
        // Log any orders with missing IDs (which shouldn't happen)
        const missingIds = results.filter(order => !order.id);
        if (missingIds.length > 0) {
          console.error("ERROR: Found orders with missing IDs:", missingIds);
        }
        
        // Log the most recently created orders
        const mostRecent = [...results].sort((a, b) => 
          new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
        ).slice(0, 3);
        
        console.log("DEBUG: Most recently created orders:", 
          mostRecent.map(order => ({ 
            id: order.id, 
            date: order.order_date,
            customer_id: order.customer_id
          }))
        );
      }
      
      return results;
    } catch (error) {
      console.error("DEBUG: Error listing orders:", error);
      console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
      throw error;
    }
  }
  
  // Job Order methods
  async getJobOrder(id: number): Promise<JobOrder | undefined> {
    const [jobOrder] = await db.select().from(jobOrders).where(eq(jobOrders.id, id));
    return jobOrder;
  }
  
  async getJobOrdersByOrder(orderId: number): Promise<JobOrder[]> {
    return await db.select().from(jobOrders).where(eq(jobOrders.order_id, orderId));
  }

  async createJobOrder(insertJobOrder: InsertJobOrder): Promise<JobOrder> {
    const [jobOrder] = await db.insert(jobOrders).values(insertJobOrder).returning();
    return jobOrder;
  }

  async updateJobOrder(id: number, jobOrderData: Partial<InsertJobOrder>): Promise<JobOrder | undefined> {
    const [jobOrder] = await db.update(jobOrders)
      .set(jobOrderData)
      .where(eq(jobOrders.id, id))
      .returning();
    return jobOrder;
  }

  async deleteJobOrder(id: number): Promise<boolean> {
    try {
      // First, delete all rolls associated with this job order
      const rollsToDelete = await this.getRollsByJobOrder(id);
      for (const roll of rollsToDelete) {
        await db.delete(rolls).where(eq(rolls.id, roll.id));
      }
      
      // Then delete the job order itself
      const result = await db.delete(jobOrders).where(eq(jobOrders.id, id));
      return !!result;
    } catch (error) {
      console.error("Error cascading delete job order:", error);
      return false;
    }
  }

  async listJobOrders(): Promise<JobOrder[]> {
    return await db.select().from(jobOrders);
  }
  
  // Production methods
  async getProduction(id: number): Promise<Production | undefined> {
    const [production] = await db.select().from(productions).where(eq(productions.id, id));
    return production;
  }
  
  async getProductionsByJobOrder(jobOrderId: number): Promise<Production[]> {
    return await db.select().from(productions).where(eq(productions.job_order_id, jobOrderId));
  }

  async createProduction(insertProduction: InsertProduction): Promise<Production> {
    // If production_date is a string, convert it to a Date object for PostgreSQL
    let productionData = insertProduction;
    
    if (typeof insertProduction.production_date === 'string') {
      productionData = {
        ...insertProduction,
        production_date: new Date(insertProduction.production_date)
      };
    }
    
    const [production] = await db.insert(productions).values(productionData).returning();
    return production;
  }

  async updateProduction(id: number, updateData: Partial<InsertProduction>): Promise<Production | undefined> {
    // If production_date is a string, convert it to a Date object for PostgreSQL
    let productionData = updateData;
    
    if (typeof updateData.production_date === 'string') {
      productionData = {
        ...updateData,
        production_date: new Date(updateData.production_date)
      };
    }
    
    const [production] = await db.update(productions)
      .set(productionData)
      .where(eq(productions.id, id))
      .returning();
    return production;
  }

  async deleteProduction(id: number): Promise<boolean> {
    const result = await db.delete(productions).where(eq(productions.id, id));
    return !!result;
  }

  async listProductions(): Promise<Production[]> {
    return await db.select().from(productions);
  }

  // Roll methods
  async getRoll(id: number): Promise<Roll | undefined> {
    const results = await db.select().from(rolls).where(eq(rolls.id, id)).limit(1);
    return results[0];
  }

  async getRollsByJobOrder(jobOrderId: number): Promise<Roll[]> {
    return await db.select().from(rolls).where(eq(rolls.job_order_id, jobOrderId));
  }

  async getRollsByStatus(status: string): Promise<Roll[]> {
    return await db.select().from(rolls).where(eq(rolls.status, status));
  }

  async createRoll(insertRoll: InsertRoll): Promise<Roll> {
    // Find the maximum roll number for this job order
    const existingRolls = await this.getRollsByJobOrder(insertRoll.job_order_id);
    const maxRollNumber = existingRolls.length > 0 
      ? Math.max(...existingRolls.map(roll => roll.roll_number))
      : 0;
    
    // Set the roll number to be one more than the max (or 1 if no existing rolls)
    const rollToInsert = {
      ...insertRoll,
      roll_number: insertRoll.roll_number || maxRollNumber + 1
    };
    
    // Create the new roll
    const results = await db.insert(rolls).values(rollToInsert).returning();
    const newRoll = results[0];
    
    // Reduce job order quantity if extruding quantity is specified
    if (newRoll.extruding_qty && newRoll.extruding_qty > 0) {
      try {
        // Get the current job order
        const jobOrderResults = await db.select().from(jobOrders)
          .where(eq(jobOrders.id, newRoll.job_order_id));
        
        if (jobOrderResults.length > 0) {
          const jobOrder = jobOrderResults[0];
          
          // Calculate the total extruded quantity for this job order
          const allRolls = await this.getRollsByJobOrder(jobOrder.id);
          const totalExtrudedQty = allRolls.reduce((sum, roll) => 
            sum + (roll.extruding_qty || 0), 0);
          
          // Update job order status based on extruded quantity
          const remainingQty = jobOrder.quantity - totalExtrudedQty;
          let newStatus = jobOrder.status;
          
          if (remainingQty <= 0) {
            newStatus = "Completed";
          } else if (totalExtrudedQty > 0) {
            newStatus = "In Progress";
          }
          
          // Update the job order with the new status
          await db.update(jobOrders)
            .set({ status: newStatus })
            .where(eq(jobOrders.id, jobOrder.id));
        }
      } catch (error) {
        console.error('Error updating job order quantity:', error);
        // Still return the created roll even if updating job order fails
      }
    }
    
    return newRoll;
  }

  async updateRoll(id: number, rollData: Partial<InsertRoll>): Promise<Roll | undefined> {
    // Get the original roll data before updating
    const originalRoll = await this.getRoll(id);
    if (!originalRoll) {
      return undefined;
    }
    
    // Update the roll
    const results = await db
      .update(rolls)
      .set(rollData)
      .where(eq(rolls.id, id))
      .returning();
    
    const updatedRoll = results[0];
    
    // If roll status changed to Received, update job order production quantity
    if (updatedRoll && updatedRoll.status === 'Received' && originalRoll.status !== 'Received') {
      try {
        await this.updateJobOrderProductionQuantity(updatedRoll.job_order_id);
      } catch (error) {
        console.error("Error updating job order production quantity:", error);
      }
    }
    
    // If extruding quantity changed, update job order status
    if (updatedRoll && originalRoll.extruding_qty !== updatedRoll.extruding_qty) {
      try {
        // Get the job order
        const jobOrderResults = await db.select().from(jobOrders)
          .where(eq(jobOrders.id, updatedRoll.job_order_id));
        
        if (jobOrderResults.length > 0) {
          const jobOrder = jobOrderResults[0];
          
          // Calculate the total extruded quantity for this job order
          const allRolls = await this.getRollsByJobOrder(jobOrder.id);
          const totalExtrudedQty = allRolls.reduce((sum, roll) => 
            sum + (roll.extruding_qty || 0), 0);
          
          // Update job order status based on extruded quantity
          const remainingQty = jobOrder.quantity - totalExtrudedQty;
          let newStatus = jobOrder.status;
          
          if (remainingQty <= 0) {
            newStatus = "Completed";
          } else if (totalExtrudedQty > 0) {
            newStatus = "In Progress";
          }
          
          // Update the job order with the new status
          await db.update(jobOrders)
            .set({ status: newStatus })
            .where(eq(jobOrders.id, jobOrder.id));
        }
      } catch (error) {
        console.error('Error updating job order quantity:', error);
        // Still return the updated roll even if updating job order fails
      }
    }
    
    return updatedRoll;
  }
  
  // New method to update the job order production quantity
  async updateJobOrderProductionQuantity(jobOrderId: number): Promise<void> {
    try {
      // Get all received rolls for this job order
      const receivedRolls = await db
        .select()
        .from(rolls)
        .where(and(
          eq(rolls.job_order_id, jobOrderId),
          eq(rolls.status, 'Received')
        ));
      
      // Calculate total production quantity (sum of cutting quantity of received rolls)
      const totalProducedQuantity = receivedRolls.reduce((sum, roll) => 
        sum + (roll.cutting_qty || 0), 0);
      
      // Get job order
      const jobOrderResult = await db
        .select()
        .from(jobOrders)
        .where(eq(jobOrders.id, jobOrderId));
      
      if (jobOrderResult.length === 0) {
        throw new Error(`Job order ${jobOrderId} not found`);
      }
      
      const jobOrder = jobOrderResult[0];
      
      // Calculate waste based on extruding vs cutting quantities
      const allRolls = await this.getRollsByJobOrder(jobOrderId);
      
      // Total extruding quantity across all rolls in this job order
      const totalExtrudingQuantity = allRolls.reduce((sum, roll) => 
        sum + (roll.extruding_qty || 0), 0);
      
      // Calculate waste quantity (extruding - cutting)
      const wasteQuantity = Math.max(0, totalExtrudingQuantity - totalProducedQuantity);
      
      // Determine production status
      let productionStatus = 'Not Started';
      
      if (totalProducedQuantity > 0) {
        if (totalProducedQuantity >= jobOrder.quantity) {
          productionStatus = totalProducedQuantity > jobOrder.quantity ? 'Overproduced' : 'Completed';
        } else {
          productionStatus = 'In Progress';
        }
      }
      
      // Update job order with production quantity and status
      await db
        .update(jobOrders)
        .set({ 
          produced_quantity: totalProducedQuantity,
          waste_quantity: wasteQuantity,
          production_status: productionStatus
        })
        .where(eq(jobOrders.id, jobOrderId));
        
    } catch (error) {
      console.error(`Error updating production quantity for job order ${jobOrderId}:`, error);
      throw error;
    }
  }

  async deleteRoll(id: number): Promise<boolean> {
    const result = await db.delete(rolls).where(eq(rolls.id, id));
    return !!result;
  }

  async listRolls(): Promise<Roll[]> {
    return await db.select().from(rolls);
  }
  
  // Import data method
  async importData(entity: string, data: any[]): Promise<boolean> {
    try {
      if (!data || data.length === 0) {
        return true; // Nothing to import, consider it a success
      }

      // For items, ensure PCID is generated if not provided and handle null values
      if (entity === 'items') {
        // Process each record to ensure it has the required fields
        for (const record of data) {
          // If PCID is not provided, generate one using the same logic as in the API
          if (!record.pcid && record.category_id) {
            try {
              // Get the category to generate PCID
              const category = await this.getCategory(parseInt(record.category_id));
              if (category) {
                const categoryCode = category.category_identification || 
                                   category.name.split(' ').map(word => word[0]).join('').toUpperCase();
                const categoryPrefix = category.name.substring(0, 3).toUpperCase();
                const timestamp = Math.floor((Date.now() % (1000 * 60 * 60 * 24)) / 1000);
                record.pcid = `${categoryCode}-${categoryPrefix}-${timestamp}`;
              }
            } catch (err) {
              console.error("Error generating PCID:", err);
              // Continue with import without PCID if there's an error
            }
          }
          
          // Handle empty/null values for numeric fields
          // Float/Real numbers
          if (record.thickness === '' || record.thickness === undefined) {
            record.thickness = null;
          }
          if (record.cylinder_inch === '' || record.cylinder_inch === undefined) {
            record.cylinder_inch = null;
          }
          if (record.cutting_length_cm === '' || record.cutting_length_cm === undefined) {
            record.cutting_length_cm = null;
          }
          if (record.unit_weight_kg === '' || record.unit_weight_kg === undefined) {
            record.unit_weight_kg = null;
          }
          
          // Integer fields
          if (record.pcs_pack_roll_qty === '' || record.pcs_pack_roll_qty === undefined) {
            record.pcs_pack_roll_qty = 0;
          } else if (typeof record.pcs_pack_roll_qty === 'string') {
            record.pcs_pack_roll_qty = parseInt(record.pcs_pack_roll_qty) || 0;
          }
          
          // Required integer fields must be present and valid
          if (!record.customer_id || record.customer_id === '') {
            throw new Error('Customer ID is required for item import');
          }
          if (!record.category_id || record.category_id === '') {
            throw new Error('Category ID is required for item import');
          }
          if (!record.sub_category_id || record.sub_category_id === '') {
            throw new Error('Product (Sub Category) ID is required for item import');
          }
          
          // Ensure integer fields are actually integers
          record.customer_id = parseInt(record.customer_id);
          record.category_id = parseInt(record.category_id);
          record.sub_category_id = parseInt(record.sub_category_id);
          
          // Ensure boolean values are properly formatted
          if (typeof record.is_printed === 'string') {
            record.is_printed = record.is_printed.toLowerCase() === 'true';
          }
        }
      }

      switch (entity) {
        case 'users':
          await db.insert(users).values(data);
          break;
        case 'customers':
          await db.insert(customers).values(data);
          break;
        case 'salespersons':
          await db.insert(salespersons).values(data);
          break;
        case 'categories':
          await db.insert(categories).values(data);
          break;
        case 'products':
          await db.insert(products).values(data);
          break;
        case 'items':
          await db.insert(items).values(data);
          break;
        case 'orders':
          await db.insert(orders).values(data);
          break;
        case 'jobOrders':
          await db.insert(jobOrders).values(data);
          break;
        case 'productions':
          await db.insert(productions).values(data);
          break;
        case 'machines':
          await db.insert(machines).values(data);
          break;
        case 'machineOptions':
          await db.insert(machineOptions).values(data);
          break;
        case 'machineToOptions':
          await db.insert(machineToOptions).values(data);
          break;
        case 'rolls':
          await db.insert(rolls).values(data);
          break;
        default:
          return false;
      }
      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  }

  // Machine methods
  async getMachine(id: number): Promise<Machine | undefined> {
    try {
      const result = await db.select().from(machines).where(eq(machines.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting machine:", error);
      return undefined;
    }
  }

  async createMachine(insertMachine: InsertMachine): Promise<Machine> {
    try {
      // Auto-generate identification field based on section and code
      if (!insertMachine.identification) {
        const section = insertMachine.section;
        const code = insertMachine.code;
        const sectionPrefix = section.substring(0, 3).toUpperCase();
        const timestamp = new Date().getTime().toString().slice(-6);
        insertMachine.identification = `${sectionPrefix}-${code}-${timestamp}`;
      }
      
      // Create a properly typed version for Drizzle
      const machineInsert = {
        identification: insertMachine.identification || '',
        section: insertMachine.section,
        code: insertMachine.code,
        production_date: insertMachine.production_date,
        serial_number: insertMachine.serial_number,
        manufacturer_code: insertMachine.manufacturer_code,
        manufacturer_name: insertMachine.manufacturer_name
      };
      
      const [machine] = await db.insert(machines).values(machineInsert).returning();
      return machine;
    } catch (error) {
      console.error("Error creating machine:", error);
      throw error;
    }
  }

  async updateMachine(id: number, machineData: Partial<InsertMachine>): Promise<Machine | undefined> {
    try {
      const [updatedMachine] = await db
        .update(machines)
        .set(machineData)
        .where(eq(machines.id, id))
        .returning();
      
      return updatedMachine;
    } catch (error) {
      console.error("Error updating machine:", error);
      return undefined;
    }
  }

  async deleteMachine(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(machines)
        .where(eq(machines.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting machine:", error);
      return false;
    }
  }

  async listMachines(): Promise<Machine[]> {
    try {
      return await db.select().from(machines);
    } catch (error) {
      console.error("Error listing machines:", error);
      return [];
    }
  }

  // Machine Option methods
  async getMachineOption(id: number): Promise<MachineOption | undefined> {
    try {
      const result = await db.select().from(machineOptions).where(eq(machineOptions.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting machine option:", error);
      return undefined;
    }
  }

  async createMachineOption(option: InsertMachineOption): Promise<MachineOption> {
    try {
      const [machineOption] = await db.insert(machineOptions).values(option).returning();
      return machineOption;
    } catch (error) {
      console.error("Error creating machine option:", error);
      throw error;
    }
  }

  async updateMachineOption(id: number, option: Partial<InsertMachineOption>): Promise<MachineOption | undefined> {
    try {
      const [updatedOption] = await db
        .update(machineOptions)
        .set(option)
        .where(eq(machineOptions.id, id))
        .returning();
      
      return updatedOption;
    } catch (error) {
      console.error("Error updating machine option:", error);
      return undefined;
    }
  }

  async deleteMachineOption(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(machineOptions)
        .where(eq(machineOptions.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting machine option:", error);
      return false;
    }
  }

  async listMachineOptions(): Promise<MachineOption[]> {
    try {
      return await db.select().from(machineOptions);
    } catch (error) {
      console.error("Error listing machine options:", error);
      return [];
    }
  }

  // Machine-Option relationship methods
  async addOptionToMachine(machineId: number, optionId: number): Promise<boolean> {
    try {
      // Check if the relationship already exists
      const existingRelation = await db
        .select()
        .from(machineToOptions)
        .where(and(
          eq(machineToOptions.machine_id, machineId),
          eq(machineToOptions.option_id, optionId)
        ));
      
      if (existingRelation.length > 0) {
        // Relationship already exists
        return true;
      }
      
      // Create new relationship
      await db.insert(machineToOptions).values({
        machine_id: machineId,
        option_id: optionId
      });
      
      return true;
    } catch (error) {
      console.error("Error adding option to machine:", error);
      return false;
    }
  }

  async removeOptionFromMachine(machineId: number, optionId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(machineToOptions)
        .where(and(
          eq(machineToOptions.machine_id, machineId),
          eq(machineToOptions.option_id, optionId)
        ));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error removing option from machine:", error);
      return false;
    }
  }

  async getMachineOptions(machineId: number): Promise<MachineOption[]> {
    try {
      const options = await db.select({
        id: machineOptions.id,
        option_details: machineOptions.option_details,
        section: machineOptions.section
      })
      .from(machineOptions)
      .innerJoin(
        machineToOptions,
        eq(machineOptions.id, machineToOptions.option_id)
      )
      .where(eq(machineToOptions.machine_id, machineId));
      
      return options;
    } catch (error) {
      console.error("Error getting machine options:", error);
      return [];
    }
  }

  async getMachinesWithOption(optionId: number): Promise<Machine[]> {
    try {
      const machinesWithOption = await db.select({
        id: machines.id,
        identification: machines.identification,
        section: machines.section,
        code: machines.code,
        production_date: machines.production_date,
        serial_number: machines.serial_number,
        manufacturer_code: machines.manufacturer_code,
        manufacturer_name: machines.manufacturer_name
      })
      .from(machines)
      .innerJoin(
        machineToOptions,
        eq(machines.id, machineToOptions.machine_id)
      )
      .where(eq(machineToOptions.option_id, optionId));
      
      return machinesWithOption;
    } catch (error) {
      console.error("Error getting machines with option:", error);
      return [];
    }
  }

  // Material Inventory methods
  async listMaterials(): Promise<Material[]> {
    try {
      const materialsData = await db.select().from(materials);
      return materialsData;
    } catch (error) {
      console.error("Error listing materials:", error);
      return [];
    }
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    try {
      const material = await db.query.materials.findFirst({
        where: eq(materials.id, id)
      });
      return material || undefined;
    } catch (error) {
      console.error("Error getting material:", error);
      return undefined;
    }
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    try {
      // Prepare the material data with required fields
      const prefix = insertMaterial.name.substring(0, 2).toUpperCase();
      const timestamp = Date.now().toString().slice(-4);
      const identifier = `MAT-${timestamp}-${prefix}`;
      
      // Insert the material with all required fields
      const [material] = await db.insert(materials).values({
        name: insertMaterial.name,
        identifier: identifier,
        starting_balance_kg: insertMaterial.starting_balance_kg || 0,
        low_stock_threshold_kg: insertMaterial.low_stock_threshold_kg,
        current_balance_kg: insertMaterial.starting_balance_kg || 0,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning();
      
      return material;
    } catch (error) {
      console.error("Error creating material:", error);
      throw error;
    }
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    try {
      // Get the current material to ensure we don't allow changing starting_balance_kg
      const currentMaterial = await this.getMaterial(id);
      if (!currentMaterial) {
        return undefined;
      }

      // Remove starting_balance_kg from updates if it exists
      const { starting_balance_kg, ...updateData } = material;

      // Only update allowed fields explicitly
      const [updatedMaterial] = await db.update(materials)
        .set({
          name: updateData.name || currentMaterial.name,
          low_stock_threshold_kg: updateData.low_stock_threshold_kg,
          updated_at: new Date()
        })
        .where(eq(materials.id, id))
        .returning();
      
      return updatedMaterial;
    } catch (error) {
      console.error("Error updating material:", error);
      return undefined;
    }
  }

  async deleteMaterial(id: number): Promise<boolean> {
    try {
      // Check if there are any material inputs associated with this material
      const inputs = await this.getMaterialInputsByMaterial(id);
      if (inputs.length > 0) {
        // Cannot delete materials with input records
        return false;
      }

      const result = await db.delete(materials)
        .where(eq(materials.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting material:", error);
      return false;
    }
  }

  async listMaterialInputs(): Promise<MaterialInput[]> {
    try {
      const inputs = await db.select().from(materialInputs);
      return inputs;
    } catch (error) {
      console.error("Error listing material inputs:", error);
      return [];
    }
  }

  async getMaterialInputsByMaterial(materialId: number): Promise<MaterialInput[]> {
    try {
      const inputs = await db.select()
        .from(materialInputs)
        .where(eq(materialInputs.material_id, materialId));
      
      return inputs;
    } catch (error) {
      console.error("Error getting material inputs by material:", error);
      return [];
    }
  }

  async getMaterialInput(id: number): Promise<MaterialInput | undefined> {
    try {
      const input = await db.query.materialInputs.findFirst({
        where: eq(materialInputs.id, id)
      });
      return input || undefined;
    } catch (error) {
      console.error("Error getting material input:", error);
      return undefined;
    }
  }

  async createMaterialInput(insertMaterialInput: InsertMaterialInput): Promise<MaterialInput> {
    try {
      // Generate a unique input identifier
      const inputIdentifier = `INP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Get the current material first
      const material = await db.query.materials.findFirst({
        where: eq(materials.id, insertMaterialInput.material_id)
      });
      
      if (!material) {
        throw new Error("Material not found");
      }
      
      // Insert the new input
      const [input] = await db.insert(materialInputs).values({
        ...insertMaterialInput,
        input_identifier: inputIdentifier,
        created_at: new Date()
      }).returning();
      
      // Update the material's current balance
      await db.update(materials)
        .set({
          current_balance_kg: material.current_balance_kg + insertMaterialInput.quantity_kg,
          updated_at: new Date()
        })
        .where(eq(materials.id, insertMaterialInput.material_id));
      
      return input;
    } catch (error) {
      console.error("Error creating material input:", error);
      throw error;
    }
  }

  async deleteMaterialInput(id: number): Promise<boolean> {
    try {
      // Get the input to be deleted
      const input = await db.query.materialInputs.findFirst({
        where: eq(materialInputs.id, id)
      });
      
      if (!input) {
        return false;
      }
      
      // Get the current material
      const material = await db.query.materials.findFirst({
        where: eq(materials.id, input.material_id)
      });
      
      if (!material) {
        return false;
      }
      
      // Calculate new balance
      const newBalance = material.current_balance_kg - input.quantity_kg;
      
      // Delete the input
      const deleteResult = await db.delete(materialInputs)
        .where(eq(materialInputs.id, id));
      
      if (deleteResult.rowCount === 0) {
        return false;
      }
      
      // Update the material's current balance
      await db.update(materials)
        .set({
          current_balance_kg: newBalance,
          updated_at: new Date()
        })
        .where(eq(materials.id, input.material_id));
      
      return true;
    } catch (error) {
      console.error("Error deleting material input:", error);
      return false;
    }
  }

  // Mix methods
  async getMix(id: number): Promise<Mix | undefined> {
    try {
      const mix = await db.query.mixes.findFirst({
        where: eq(mixes.id, id)
      });
      return mix || undefined;
    } catch (error) {
      console.error("Error getting mix:", error);
      return undefined;
    }
  }

  async createMix(mix: InsertMix, mixItems: InsertMixItem[], orderIds: number[] = [], machineIds: number[] = []): Promise<Mix> {
    try {
      // Generate a unique identifier for the mix
      const mixIdentifier = `MIX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // First, validate that there are enough materials in inventory for the mix
      for (const item of mixItems) {
        // Create a regular array from the const array for type compatibility
        const materialTypesArray = [...MATERIAL_TYPES] as readonly string[];
        // For material-based mix items, check inventory
        if (materialTypesArray.includes(item.material_type as any)) {
          // If using new inventory system with material_id
          if ('material_id' in item && item.material_id) {
            const material = await db.query.materials.findFirst({
              where: eq(materials.id, item.material_id)
            });
            
            if (!material) {
              throw new Error(`Material with ID ${item.material_id} not found`);
            }
            
            if (material.current_balance_kg < item.quantity_kg) {
              throw new Error(`Not enough ${material.name} in inventory. Available: ${material.current_balance_kg}kg, Required: ${item.quantity_kg}kg`);
            }
          }
        }
      }
      
      // The mix_date is already a Date object thanks to our zod schema processing
      const [createdMix] = await db.insert(mixes).values({
        ...mix,
        batch_number: mixIdentifier
      }).returning();
      
      // Now create all the mix items
      for (const item of mixItems) {
        await this.createMixItem({
          ...item,
          mix_id: createdMix.id
        });
        
        // If this is a material from inventory, update the inventory
        if ('material_id' in item && item.material_id) {
          const material = await db.query.materials.findFirst({
            where: eq(materials.id, item.material_id)
          });
          
          if (material) {
            // Update the material's current balance
            await db.update(materials)
              .set({
                current_balance_kg: material.current_balance_kg - item.quantity_kg,
                updated_at: new Date()
              })
              .where(eq(materials.id, item.material_id));
          }
        }
      }
      
      // Associate orders if any
      for (const orderId of orderIds) {
        await this.addOrderToMix(createdMix.id, orderId);
      }
      
      // Associate machines if any
      for (const machineId of machineIds) {
        await this.addMachineToMix(createdMix.id, machineId);
      }
      
      return createdMix;
    } catch (error) {
      console.error("Error creating mix:", error);
      throw error;
    }
  }

  async updateMix(id: number, mixData: Partial<InsertMix>): Promise<Mix | undefined> {
    try {
      // The mix_date is already a Date object thanks to our zod schema processing
      const [updatedMix] = await db.update(mixes)
        .set(mixData)
        .where(eq(mixes.id, id))
        .returning();
      return updatedMix;
    } catch (error) {
      console.error("Error updating mix:", error);
      return undefined;
    }
  }

  async deleteMix(id: number): Promise<boolean> {
    try {
      const result = await db.delete(mixes).where(eq(mixes.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting mix:", error);
      return false;
    }
  }

  async listMixes(): Promise<Mix[]> {
    try {
      return await db.query.mixes.findMany();
    } catch (error) {
      console.error("Error listing mixes:", error);
      return [];
    }
  }
  
  // Mix item methods
  async getMixItem(id: number): Promise<MixItem | undefined> {
    try {
      const mixItem = await db.query.mixItems.findFirst({
        where: eq(mixItems.id, id)
      });
      return mixItem || undefined;
    } catch (error) {
      console.error("Error getting mix item:", error);
      return undefined;
    }
  }
  
  async getMixItemsByMix(mixId: number): Promise<MixItem[]> {
    try {
      return await db.query.mixItems.findMany({
        where: eq(mixItems.mix_id, mixId)
      });
    } catch (error) {
      console.error("Error getting mix items by mix:", error);
      return [];
    }
  }
  
  async createMixItem(mixItem: InsertMixItem): Promise<MixItem> {
    try {
      const [createdMixItem] = await db.insert(mixItems).values(mixItem).returning();
      return createdMixItem;
    } catch (error) {
      console.error("Error creating mix item:", error);
      throw error;
    }
  }
  
  async updateMixItem(id: number, mixItemData: Partial<InsertMixItem>): Promise<MixItem | undefined> {
    try {
      const [updatedMixItem] = await db.update(mixItems)
        .set(mixItemData)
        .where(eq(mixItems.id, id))
        .returning();
      return updatedMixItem;
    } catch (error) {
      console.error("Error updating mix item:", error);
      return undefined;
    }
  }
  
  async deleteMixItem(id: number): Promise<boolean> {
    try {
      const result = await db.delete(mixItems).where(eq(mixItems.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting mix item:", error);
      return false;
    }
  }
  
  // Mix order relationship methods
  async addOrderToMix(mixId: number, orderId: number): Promise<boolean> {
    try {
      await db.insert(mixOrders)
        .values({ mix_id: mixId, order_id: orderId });
      return true;
    } catch (error) {
      console.error("Error adding order to mix:", error);
      return false;
    }
  }
  
  async removeOrderFromMix(mixId: number, orderId: number): Promise<boolean> {
    try {
      const result = await db.delete(mixOrders)
        .where(
          and(
            eq(mixOrders.mix_id, mixId),
            eq(mixOrders.order_id, orderId)
          )
        );
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error removing order from mix:", error);
      return false;
    }
  }
  
  async getMixOrders(mixId: number): Promise<Order[]> {
    try {
      const mixOrdersResult = await db.select()
        .from(mixOrders)
        .where(eq(mixOrders.mix_id, mixId));
      
      const orderIds = mixOrdersResult.map(mo => mo.order_id);
      
      if (orderIds.length === 0) {
        return [];
      }
      
      return await db.select()
        .from(orders)
        .where(inArray(orders.id, orderIds));
    } catch (error) {
      console.error("Error getting mix orders:", error);
      return [];
    }
  }
  
  async getMixesForOrder(orderId: number): Promise<Mix[]> {
    try {
      const mixOrdersResult = await db.select()
        .from(mixOrders)
        .where(eq(mixOrders.order_id, orderId));
      
      const mixIds = mixOrdersResult.map(mo => mo.mix_id);
      
      if (mixIds.length === 0) {
        return [];
      }
      
      return await db.select()
        .from(mixes)
        .where(inArray(mixes.id, mixIds));
    } catch (error) {
      console.error("Error getting mixes for order:", error);
      return [];
    }
  }
  
  // Mix machine relationship methods
  async addMachineToMix(mixId: number, machineId: number): Promise<boolean> {
    try {
      await db.insert(mixMachines)
        .values({ mix_id: mixId, machine_id: machineId });
      return true;
    } catch (error) {
      console.error("Error adding machine to mix:", error);
      return false;
    }
  }
  
  async removeMachineFromMix(mixId: number, machineId: number): Promise<boolean> {
    try {
      const result = await db.delete(mixMachines)
        .where(
          and(
            eq(mixMachines.mix_id, mixId),
            eq(mixMachines.machine_id, machineId)
          )
        );
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error removing machine from mix:", error);
      return false;
    }
  }
  
  async getMixMachines(mixId: number): Promise<Machine[]> {
    try {
      const mixMachinesResult = await db.select()
        .from(mixMachines)
        .where(eq(mixMachines.mix_id, mixId));
      
      const machineIds = mixMachinesResult.map(mm => mm.machine_id);
      
      if (machineIds.length === 0) {
        return [];
      }
      
      return await db.select()
        .from(machines)
        .where(inArray(machines.id, machineIds));
    } catch (error) {
      console.error("Error getting mix machines:", error);
      return [];
    }
  }
  
  async getMixesForMachine(machineId: number): Promise<Mix[]> {
    try {
      const mixMachinesResult = await db.select()
        .from(mixMachines)
        .where(eq(mixMachines.machine_id, machineId));
      
      const mixIds = mixMachinesResult.map(mm => mm.mix_id);
      
      if (mixIds.length === 0) {
        return [];
      }
      
      return await db.select()
        .from(mixes)
        .where(inArray(mixes.id, mixIds));
    } catch (error) {
      console.error("Error getting mixes for machine:", error);
      return [];
    }
  }
  
  // Maintenance Request methods
  async getMaintenanceRequest(id: number): Promise<MaintenanceRequest | undefined> {
    try {
      const [request] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id));
      return request;
    } catch (error) {
      console.error(`Error fetching maintenance request with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getMaintenanceRequestsByMachine(machineId: number): Promise<MaintenanceRequest[]> {
    try {
      return await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.machine_id, machineId));
    } catch (error) {
      console.error(`Error fetching maintenance requests for machine ${machineId}:`, error);
      return [];
    }
  }
  
  async getMaintenanceRequestsByStatus(status: string): Promise<MaintenanceRequest[]> {
    try {
      return await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.status, status));
    } catch (error) {
      console.error(`Error fetching maintenance requests with status ${status}:`, error);
      return [];
    }
  }
  
  async createMaintenanceRequest(insertRequest: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    try {
      // If request_date is a string, convert it to a Date object for PostgreSQL
      let requestData = insertRequest;
      
      if (typeof insertRequest.request_date === 'string') {
        requestData = {
          ...insertRequest,
          request_date: new Date(insertRequest.request_date)
        };
      }
      
      const [request] = await db.insert(maintenanceRequests).values(requestData).returning();
      return request;
    } catch (error) {
      console.error("Error creating maintenance request:", error);
      throw error;
    }
  }
  
  async updateMaintenanceRequest(id: number, updateData: Partial<InsertMaintenanceRequest>): Promise<MaintenanceRequest | undefined> {
    try {
      // If request_date is a string, convert it to a Date object for PostgreSQL
      let requestData = updateData;
      
      if (typeof updateData.request_date === 'string') {
        requestData = {
          ...updateData,
          request_date: new Date(updateData.request_date)
        };
      }
      
      const [request] = await db.update(maintenanceRequests)
        .set(requestData)
        .where(eq(maintenanceRequests.id, id))
        .returning();
      return request;
    } catch (error) {
      console.error(`Error updating maintenance request with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteMaintenanceRequest(id: number): Promise<boolean> {
    try {
      const result = await db.delete(maintenanceRequests).where(eq(maintenanceRequests.id, id));
      return !!result;
    } catch (error) {
      console.error(`Error deleting maintenance request with ID ${id}:`, error);
      return false;
    }
  }
  
  async listMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    try {
      return await db.select().from(maintenanceRequests);
    } catch (error) {
      console.error("Error listing maintenance requests:", error);
      return [];
    }
  }
  
  // Maintenance Action methods
  async getMaintenanceAction(id: number): Promise<MaintenanceAction | undefined> {
    try {
      const [action] = await db.select().from(maintenanceActions).where(eq(maintenanceActions.id, id));
      return action;
    } catch (error) {
      console.error(`Error fetching maintenance action with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async getMaintenanceActionsByRequest(requestId: number): Promise<MaintenanceAction[]> {
    try {
      return await db.select().from(maintenanceActions).where(eq(maintenanceActions.request_id, requestId));
    } catch (error) {
      console.error(`Error fetching maintenance actions for request ${requestId}:`, error);
      return [];
    }
  }
  
  async createMaintenanceAction(insertAction: InsertMaintenanceAction): Promise<MaintenanceAction> {
    try {
      // If action_date is a string, convert it to a Date object for PostgreSQL
      let actionData = insertAction;
      
      if (typeof insertAction.action_date === 'string') {
        actionData = {
          ...insertAction,
          action_date: new Date(insertAction.action_date)
        };
      }
      
      const [action] = await db.insert(maintenanceActions).values(actionData).returning();
      return action;
    } catch (error) {
      console.error("Error creating maintenance action:", error);
      throw error;
    }
  }
  
  async updateMaintenanceAction(id: number, updateData: Partial<InsertMaintenanceAction>): Promise<MaintenanceAction | undefined> {
    try {
      // If action_date is a string, convert it to a Date object for PostgreSQL
      let actionData = updateData;
      
      if (typeof updateData.action_date === 'string') {
        actionData = {
          ...updateData,
          action_date: new Date(updateData.action_date)
        };
      }
      
      const [action] = await db.update(maintenanceActions)
        .set(actionData)
        .where(eq(maintenanceActions.id, id))
        .returning();
      return action;
    } catch (error) {
      console.error(`Error updating maintenance action with ID ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteMaintenanceAction(id: number): Promise<boolean> {
    try {
      const result = await db.delete(maintenanceActions).where(eq(maintenanceActions.id, id));
      return !!result;
    } catch (error) {
      console.error(`Error deleting maintenance action with ID ${id}:`, error);
      return false;
    }
  }
  
  async listMaintenanceActions(): Promise<MaintenanceAction[]> {
    try {
      return await db.select().from(maintenanceActions);
    } catch (error) {
      console.error("Error listing maintenance actions:", error);
      return [];
    }
  }

  // Receiving orders methods
  async listReceivingOrders(): Promise<ReceivingOrder[]> {
    try {
      const results = await db.select()
        .from(receivingOrders);
      
      // Sort by received_date in memory
      return results.sort((a, b) => {
        const dateA = new Date(a.received_date);
        const dateB = new Date(b.received_date);
        return dateB.getTime() - dateA.getTime(); // descending order
      });
    } catch (error) {
      console.error("Error listing receiving orders:", error);
      return [];
    }
  }

  async getReceivingOrder(id: number): Promise<ReceivingOrder | undefined> {
    try {
      const receivingOrder = await db.select()
        .from(receivingOrders)
        .where(eq(receivingOrders.id, id))
        .limit(1);
      
      return receivingOrder.length > 0 ? receivingOrder[0] : undefined;
    } catch (error) {
      console.error("Error getting receiving order:", error);
      return undefined;
    }
  }

  async getReceivingOrdersByJobOrder(jobOrderId: number): Promise<ReceivingOrder[]> {
    try {
      const results = await db.select()
        .from(receivingOrders)
        .where(eq(receivingOrders.job_order_id, jobOrderId));
      
      return results;
    } catch (error) {
      console.error("Error getting receiving orders by job order:", error);
      return [];
    }
  }

  async createReceivingOrder(insertReceivingOrder: InsertReceivingOrder): Promise<ReceivingOrder> {
    try {
      const [receivingOrder] = await db.insert(receivingOrders).values(insertReceivingOrder).returning();
      return receivingOrder;
    } catch (error) {
      console.error("Error creating receiving order:", error);
      throw error;
    }
  }

  async deleteReceivingOrder(id: number): Promise<boolean> {
    try {
      await db.delete(receivingOrders).where(eq(receivingOrders.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting receiving order:", error);
      return false;
    }
  }

  // Waste calculation methods
  async calculateRollWaste(rollId: number): Promise<number> {
    try {
      const roll = await this.getRoll(rollId);
      if (!roll) return 0;
      
      if (roll.extruding_qty === null || roll.cutting_qty === null) {
        return 0;
      }
      
      // Calculate waste as the difference between extruding_qty and cutting_qty
      const waste = roll.extruding_qty - roll.cutting_qty;
      return waste > 0 ? waste : 0;
    } catch (error) {
      console.error("Error calculating roll waste:", error);
      return 0;
    }
  }

  async calculateJobOrderWaste(jobOrderId: number): Promise<number> {
    try {
      const jobOrderRolls = await this.getRollsByJobOrder(jobOrderId);
      
      let totalExtrudedQty = 0;
      let totalCuttingQty = 0;
      
      for (const roll of jobOrderRolls) {
        if (roll.extruding_qty !== null) {
          totalExtrudedQty += roll.extruding_qty;
        }
        
        if (roll.cutting_qty !== null) {
          totalCuttingQty += roll.cutting_qty;
        }
      }
      
      // Calculate waste as the difference between total extruded and total cut quantities
      const waste = totalExtrudedQty - totalCuttingQty;
      return waste > 0 ? waste : 0;
    } catch (error) {
      console.error("Error calculating job order waste:", error);
      return 0;
    }
  }

  async calculateWastePercentage(jobOrderId: number): Promise<number> {
    try {
      const jobOrderRolls = await this.getRollsByJobOrder(jobOrderId);
      
      let totalExtrudedQty = 0;
      let totalCuttingQty = 0;
      
      for (const roll of jobOrderRolls) {
        if (roll.extruding_qty !== null) {
          totalExtrudedQty += roll.extruding_qty;
        }
        
        if (roll.cutting_qty !== null) {
          totalCuttingQty += roll.cutting_qty;
        }
      }
      
      if (totalExtrudedQty === 0) return 0;
      
      // Calculate waste percentage
      const waste = totalExtrudedQty - totalCuttingQty;
      const wastePercentage = (waste / totalExtrudedQty) * 100;
      return wastePercentage > 0 ? wastePercentage : 0;
    } catch (error) {
      console.error("Error calculating waste percentage:", error);
      return 0;
    }
  }

  async getWasteByTimeframe(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      // Get all rolls created within the date range
      const dateRangeRolls = await db.select()
        .from(rolls)
        .where(
          and(
            gte(rolls.created_date, startDate),
            lte(rolls.created_date, endDate)
          )
        );
      
      // Group rolls by date
      const wasteByDate: Record<string, { date: string, waste: number, totalExtruded: number, wastePercentage: number }> = {};
      
      for (const roll of dateRangeRolls) {
        const dateStr = new Date(roll.created_date).toISOString().split('T')[0];
        
        if (!wasteByDate[dateStr]) {
          wasteByDate[dateStr] = {
            date: dateStr,
            waste: 0,
            totalExtruded: 0,
            wastePercentage: 0
          };
        }
        
        if (roll.extruding_qty !== null) {
          wasteByDate[dateStr].totalExtruded += roll.extruding_qty;
          
          if (roll.cutting_qty !== null) {
            const rollWaste = roll.extruding_qty - roll.cutting_qty;
            if (rollWaste > 0) {
              wasteByDate[dateStr].waste += rollWaste;
            }
          }
        }
      }
      
      // Calculate waste percentages
      for (const date in wasteByDate) {
        if (wasteByDate[date].totalExtruded > 0) {
          wasteByDate[date].wastePercentage = (wasteByDate[date].waste / wasteByDate[date].totalExtruded) * 100;
        }
      }
      
      return Object.values(wasteByDate);
    } catch (error) {
      console.error("Error getting waste by timeframe:", error);
      return [];
    }
  }

  async getWasteByUser(userId: number): Promise<any[]> {
    try {
      // Get all rolls created by the user
      const userRolls = await db.select()
        .from(rolls)
        .where(
          or(
            eq(rolls.extruded_by, userId),
            eq(rolls.printed_by, userId),
            eq(rolls.cut_by, userId)
          )
        );
      
      const wasteByStage = {
        extrusion: { waste: 0, totalExtruded: 0, wastePercentage: 0 },
        printing: { waste: 0, totalExtruded: 0, wastePercentage: 0 },
        cutting: { waste: 0, totalExtruded: 0, wastePercentage: 0 }
      };
      
      for (const roll of userRolls) {
        // Calculate waste by stage
        if (roll.extruded_by === userId && roll.extruding_qty !== null && roll.printing_qty !== null) {
          wasteByStage.extrusion.totalExtruded += roll.extruding_qty;
          const extrusionWaste = roll.extruding_qty - roll.printing_qty;
          if (extrusionWaste > 0) {
            wasteByStage.extrusion.waste += extrusionWaste;
          }
        }
        
        if (roll.printed_by === userId && roll.printing_qty !== null && roll.cutting_qty !== null) {
          wasteByStage.printing.totalExtruded += roll.printing_qty;
          const printingWaste = roll.printing_qty - roll.cutting_qty;
          if (printingWaste > 0) {
            wasteByStage.printing.waste += printingWaste;
          }
        }
      }
      
      // Calculate waste percentages
      if (wasteByStage.extrusion.totalExtruded > 0) {
        wasteByStage.extrusion.wastePercentage = 
          (wasteByStage.extrusion.waste / wasteByStage.extrusion.totalExtruded) * 100;
      }
      
      if (wasteByStage.printing.totalExtruded > 0) {
        wasteByStage.printing.wastePercentage = 
          (wasteByStage.printing.waste / wasteByStage.printing.totalExtruded) * 100;
      }
      
      return [
        { stage: 'Extrusion', ...wasteByStage.extrusion },
        { stage: 'Printing', ...wasteByStage.printing },
        { stage: 'Cutting', ...wasteByStage.cutting }
      ];
    } catch (error) {
      console.error("Error getting waste by user:", error);
      return [];
    }
  }

  async getWasteBySection(section: string): Promise<any[]> {
    try {
      // Get all users in the specified section
      const sectionUsers = await db.select()
        .from(users)
        .where(eq(users.section, section));
      
      const userIds = sectionUsers.map(user => user.id);
      
      // Get all rolls created by users in the section
      const sectionRolls = await db.select()
        .from(rolls)
        .where(
          or(
            inArray(rolls.extruded_by, userIds),
            inArray(rolls.printed_by, userIds),
            inArray(rolls.cut_by, userIds)
          )
        );
      
      // Group rolls by user
      const wasteByUser: Record<number, { userId: number, username: string, waste: number, totalExtruded: number, wastePercentage: number }> = {};
      
      for (const user of sectionUsers) {
        wasteByUser[user.id] = {
          userId: user.id,
          username: user.name,
          waste: 0,
          totalExtruded: 0,
          wastePercentage: 0
        };
      }
      
      for (const roll of sectionRolls) {
        // Track waste by user based on their role in the process
        if (roll.extruded_by !== null && roll.extruding_qty !== null && wasteByUser[roll.extruded_by]) {
          wasteByUser[roll.extruded_by].totalExtruded += roll.extruding_qty;
          
          if (roll.cutting_qty !== null) {
            const waste = roll.extruding_qty - roll.cutting_qty;
            if (waste > 0) {
              wasteByUser[roll.extruded_by].waste += waste;
            }
          }
        }
      }
      
      // Calculate waste percentages for each user
      for (const userId in wasteByUser) {
        if (wasteByUser[userId].totalExtruded > 0) {
          wasteByUser[userId].wastePercentage = 
            (wasteByUser[userId].waste / wasteByUser[userId].totalExtruded) * 100;
        }
      }
      
      return Object.values(wasteByUser);
    } catch (error) {
      console.error("Error getting waste by section:", error);
      return [];
    }
  }
}