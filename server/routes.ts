import express, { type Express, Request, Response, NextFunction } from "express";
import http, { type Server } from "http";
import { storage } from "./storage";
import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { setupAuth } from "./auth";
import jwt from "jsonwebtoken";
import { detectEncoding, ensureEncoding } from "./encoding-helpers";
import { WebSocketServer, WebSocket } from 'ws';
import smsService from './sms-service';
import {
  User,
  insertUserSchema,
  insertCustomerSchema,
  insertSalespersonSchema,
  insertCategorySchema,
  insertProductSchema,
  insertItemSchema,
  insertOrderSchema,
  insertJobOrderSchema,
  insertProductionSchema,
  insertRollSchema,
  insertMachineSchema,
  insertMachineOptionSchema,
  insertMixSchema,
  insertMixItemSchema,
  insertMixOrderSchema,
  insertMixMachineSchema,
  insertMaintenanceRequestSchema,
  updateMaintenanceRequestSchema,
  insertMaintenanceActionSchema,
  updateMaintenanceActionSchema,
  insertMaterialSchema,
  insertMaterialInputSchema,
  insertReceivingOrderSchema,
  MATERIAL_TYPES,
  PART_TYPES,
  ACTION_TYPES
} from "@shared/schema";

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  // QR Code validation endpoints
  app.get('/api/rolls/validate/:id', async (req, res) => {
    try {
      const rollId = parseInt(req.params.id, 10);
      if (isNaN(rollId)) {
        return res.status(400).json({ error: 'Invalid roll ID' });
      }
      
      const roll = await storage.getRoll(rollId);
      if (!roll) {
        return res.status(404).json({ error: 'Roll not found' });
      }
      
      // Get related job order for more context
      const jobOrder = await storage.getJobOrder(roll.job_order_id);
      if (!jobOrder) {
        return res.status(404).json({ error: 'Related job order not found' });
      }
      
      // Get customer info
      const customer = await storage.getCustomer(jobOrder.customer_id);
      
      // Return combined data
      return res.json({
        ...roll,
        job_order: jobOrder,
        customer: customer || undefined
      });
    } catch (error) {
      console.error('Error validating roll:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/api/orders/validate/:id', async (req, res) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: 'Invalid order ID' });
      }
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Get customer info
      const customer = await storage.getCustomer(order.customer_id);
      
      // Get job orders
      const jobOrders = await storage.getJobOrdersByOrder(orderId);
      
      // Return combined data
      return res.json({
        ...order,
        customer: customer || undefined,
        job_orders: jobOrders
      });
    } catch (error) {
      console.error('Error validating order:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  const router = express.Router();
  
  // Set up JWT authentication
  const authMiddleware = setupAuth(app);
  
  // Apply optional authentication to all API routes
  // This adds user and permission info when available but doesn't block requests
  router.use(authMiddleware.optionalJwtAuth);
  
  // Serve static assets from the attached_assets directory
  app.use(express.static('attached_assets'));
  
  // Health check endpoint for monitoring and diagnostics
  router.get("/health", async (req, res) => {
    try {
      // Check if database is accessible
      let dbStatus = "ok";
      let dbConnectionTime = 0;
      
      try {
        const startTime = Date.now();
        // Simple query to check database connectivity
        await storage.listUsers();
        dbConnectionTime = Date.now() - startTime;
      } catch (err) {
        console.error("Health check - Database error:", err);
        dbStatus = "error";
      }
      
      // Check environment variables (don't display full values for security)
      const envVars = {
        SESSION_SECRET: process.env.SESSION_SECRET ? "Set" : "Not set",
        JWT_SECRET: process.env.JWT_SECRET ? "Set" : "Not set",
        DATABASE_URL: process.env.DATABASE_URL ? "Set" : "Not set",
        NODE_ENV: process.env.NODE_ENV || "Not set",
        PORT: process.env.PORT || "Using default (5003)"
      };
      
      // System resources
      const memoryUsage = process.memoryUsage();
      
      // Response with detailed health information
      res.status(200).json({ 
        status: "ok", 
        ready: true, // Explicit ready flag for deployment health checks
        version: process.env.npm_package_version || "1.0.0",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus,
          connectionTime: dbConnectionTime, // ms
        },
        environment: envVars,
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + "MB", // RSS memory
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + "MB", // Total heap
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB", // Used heap
          external: Math.round(memoryUsage.external / 1024 / 1024) + "MB" // External memory
        }
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ 
        status: "error",
        ready: false, // Explicit ready flag for deployment health checks
        timestamp: new Date().toISOString(),
        message: "Health check failed"
      });
    }
  });
  
  // Helper function to handle validation errors
  function handleZodError(error: unknown, res: Response) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: validationError.message,
        errors: error.errors,
      });
    }
    console.error("Unexpected error:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }

  // User routes
  router.get("/users", async (req, res) => {
    try {
      const users = await storage.listUsers();
      // Don't send passwords back to the client
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  router.get("/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password back to the client
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  router.post("/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Don't send password back to the client
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.patch("/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password back to the client
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.delete("/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Dashboard preferences
  router.post("/users/:id/dashboard-preferences", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { preferences } = req.body;
      
      if (!preferences) {
        return res.status(400).json({ message: "Dashboard preferences are required" });
      }
      
      const user = await storage.saveDashboardPreferences(id, preferences);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password back to the client
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error saving dashboard preferences:", error);
      res.status(500).json({ message: "Failed to save dashboard preferences" });
    }
  });

  // Login route with JWT
  router.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      console.log(`Attempting login for username: ${username}`);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        console.log(`Login failed: Invalid credentials for username: ${username}`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      console.log(`Login successful for user: ${username}, generating JWT token`);
      
      // Generate a JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.SESSION_SECRET || process.env.JWT_SECRET || 'mpbf-jwt-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      // Don't send password back to the client
      const { password: _, ...safeUser } = user;
      
      // Return the user data and token
      res.json({
        user: safeUser,
        token
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "An error occurred during login" });
    }
  });
  
  // JWT-based auth to get current user
  router.get("/users/me", (req, res) => {
    // Check for auth header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If no token, return admin user for development/testing
      console.log("No token found, attempting to return admin user");
      return storage.getUserByUsername("admin")
        .then(user => {
          if (!user) {
            console.log("Admin user not found");
            return res.status(404).json({ message: "User not found" });
          }
          // Don't send password back to the client
          const { password: _, ...safeUser } = user;
          console.log("Returning admin user:", safeUser);
          res.json(safeUser);
        })
        .catch(error => {
          console.error("Error fetching admin user:", error);
          res.status(500).json({ message: "Failed to fetch user" });
        });
    }
    
    try {
      // Extract and validate token
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mpbf-jwt-secret-key') as { userId: number };
      
      console.log("Token verified, fetching user with ID:", decoded.userId);
      
      // Get user from database
      storage.getUser(decoded.userId)
        .then(user => {
          if (!user) {
            console.log("User not found with ID:", decoded.userId);
            return res.status(404).json({ message: "User not found" });
          }
          
          // Don't send password back to the client
          const { password: _, ...safeUser } = user;
          console.log("Returning authenticated user:", safeUser);
          res.json(safeUser);
        })
        .catch(error => {
          console.error("Error fetching user:", error);
          res.status(500).json({ message: "Failed to fetch user" });
        });
    } catch (error) {
      console.error("JWT verification error:", error);
      res.status(401).json({ message: "Invalid token" });
    }
  });

  // Customer routes
  router.get("/customers", async (req, res) => {
    try {
      const customers = await storage.listCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  router.get("/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  router.post("/customers", authMiddleware.authenticateJwt, authMiddleware.requirePermission('customers:create'), async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.patch("/customers/:id", authMiddleware.authenticateJwt, authMiddleware.requirePermission('customers:edit'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.delete("/customers/:id", authMiddleware.authenticateJwt, authMiddleware.requirePermission('customers:delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomer(id);
      
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Salesperson routes
  router.get("/salespersons", async (req, res) => {
    try {
      const salespersons = await storage.listSalespersons();
      res.json(salespersons);
    } catch (error) {
      console.error("Error fetching salespersons:", error);
      res.status(500).json({ message: "Failed to fetch salespersons" });
    }
  });

  router.get("/salespersons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const salesperson = await storage.getSalesperson(id);
      
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      
      res.json(salesperson);
    } catch (error) {
      console.error("Error fetching salesperson:", error);
      res.status(500).json({ message: "Failed to fetch salesperson" });
    }
  });

  router.post("/salespersons", async (req, res) => {
    try {
      const salespersonData = insertSalespersonSchema.parse(req.body);
      const salesperson = await storage.createSalesperson(salespersonData);
      res.status(201).json(salesperson);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.patch("/salespersons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const salespersonData = insertSalespersonSchema.partial().parse(req.body);
      const salesperson = await storage.updateSalesperson(id, salespersonData);
      
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      
      res.json(salesperson);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.delete("/salespersons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSalesperson(id);
      
      if (!success) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting salesperson:", error);
      res.status(500).json({ message: "Failed to delete salesperson" });
    }
  });

  // Category routes
  router.get("/categories", async (req, res) => {
    try {
      const categories = await storage.listCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  router.get("/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  router.post("/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.patch("/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.delete("/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Product routes
  router.get("/products", async (req, res) => {
    try {
      const products = await storage.listProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  router.get("/products/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      const products = await storage.getProductsByCategory(categoryId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  router.get("/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  router.post("/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.patch("/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.delete("/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Item routes
  router.get("/items", async (req, res) => {
    try {
      const items = await storage.listItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  router.get("/items/customer/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      const items = await storage.getItemsByCustomer(customerId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items by customer:", error);
      res.status(500).json({ message: "Failed to fetch items by customer" });
    }
  });

  router.get("/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  router.post("/items", async (req, res) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      const item = await storage.createItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.patch("/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = insertItemSchema.partial().parse(req.body);
      const item = await storage.updateItem(id, itemData);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.delete("/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Order routes
  router.get("/orders", async (req, res) => {
    try {
      const orders = await storage.listOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  router.get("/orders/customer/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      const orders = await storage.getOrdersByCustomer(customerId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders by customer:", error);
      res.status(500).json({ message: "Failed to fetch orders by customer" });
    }
  });

  router.get("/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  router.post("/orders", async (req, res) => {
    console.log("=== ORDER CREATION START ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Request ID: ${Math.random().toString(36).substring(2, 15)}`);
    
    try {
      // Log the entire request for debugging
      console.log("Received order data:", JSON.stringify(req.body, null, 2));
      console.log("customer_id type:", typeof req.body.customer_id);
      console.log("customer_id value:", req.body.customer_id);
      console.log("Headers:", JSON.stringify(req.headers, null, 2));
      
      // Input validation pre-processing
      if (!req.body) {
        console.error("Request body is empty or undefined");
        return res.status(400).json({ message: "Missing request body" });
      }
      
      if (!req.body.customer_id) {
        console.error("Missing required field: customer_id");
        return res.status(400).json({ message: "Missing required field: customer_id" });
      }
      
      // Manually handle date conversion before validation
      const body = {
        ...req.body,
        // Convert ISO date string to Date object if it's a string
        order_date: req.body.order_date ? new Date(req.body.order_date) : new Date()
      };
      
      // Force customer_id to be a number if it's not already
      if (typeof body.customer_id === 'string') {
        body.customer_id = parseInt(body.customer_id, 10);
        console.log("Converted customer_id string to number:", body.customer_id);
        
        if (isNaN(body.customer_id)) {
          console.error("Invalid customer_id: not a valid number");
          return res.status(400).json({ message: "customer_id must be a valid number" });
        }
      }
      
      // Parse with the schema
      let orderData;
      try {
        orderData = insertOrderSchema.parse(body);
        console.log("Schema validation successful");
        console.log("Parsed order data:", JSON.stringify(orderData, null, 2));
      } catch (validationError) {
        console.error("Schema validation failed:", validationError);
        return handleZodError(validationError, res);
      }
      
      // Debug customer_id after schema parsing 
      console.log("After schema parsing, customer_id type:", typeof orderData.customer_id);
      console.log("After schema parsing, customer_id value:", orderData.customer_id);
      
      // Check if the customer exists
      try {
        const customerExists = await storage.getCustomer(orderData.customer_id);
        if (!customerExists) {
          console.error(`Customer with ID ${orderData.customer_id} not found`);
          return res.status(400).json({ message: `Customer with ID ${orderData.customer_id} not found` });
        }
        console.log(`Verified customer exists: ${customerExists.id} (${customerExists.name})`);
      } catch (customerError) {
        console.error("Error verifying customer:", customerError);
        // Continue anyway, as this is just a validation check
      }
      
      // Log before database insertion
      console.log("Calling storage.createOrder with:", JSON.stringify(orderData, null, 2));
      
      let order;
      try {
        order = await storage.createOrder(orderData);
        console.log("Order created successfully in database");
      } catch (dbError) {
        console.error("Database error during order creation:", dbError);
        console.error(dbError instanceof Error ? dbError.stack : "Unknown database error");
        return res.status(500).json({ message: "Database error during order creation", error: dbError instanceof Error ? dbError.message : "Unknown error" });
      }
      
      // Validate the response
      if (!order || !order.id) {
        console.error("Invalid order creation response:", order);
        return res.status(500).json({ message: "Order created but returned invalid data" });
      }
      
      console.log("Order created response:", JSON.stringify(order, null, 2));
      console.log("=== ORDER CREATION SUCCESS ===");
      
      // Send the response
      res.status(201).json(order);
    } catch (error) {
      console.error("=== ORDER CREATION FAILED ===");
      console.error("Unhandled error during order creation:", error);
      console.error(error instanceof Error ? error.stack : "Unknown error type");
      
      // Try to send a helpful error response
      handleZodError(error, res);
      console.log("=== ORDER CREATION END (WITH ERROR) ===");
    }
  });

  router.patch("/orders/:id", async (req, res) => {
    try {
      console.log("Updating order data:", req.body);
      
      const id = parseInt(req.params.id);
      
      // Manually handle date conversion before validation
      const body = {
        ...req.body,
        // Convert ISO date string to Date object if it's a string
        order_date: req.body.order_date ? new Date(req.body.order_date) : undefined
      };
      
      // Create a partial schema validator for updates
      const partialSchema = z.object({
        customer_id: z.number().optional(),
        order_date: z.date().optional(),
        notes: z.string().nullable().optional(),
        status: z.string().optional(), // Add status field
      });
      
      const orderData = partialSchema.parse(body);
      console.log("Parsed order update data:", orderData);
      
      const order = await storage.updateOrder(id, orderData);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Order update error:", error);
      handleZodError(error, res);
    }
  });

  router.delete("/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOrder(id);
      
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Job Order routes
  router.get("/job-orders", async (req, res) => {
    try {
      const jobOrders = await storage.listJobOrders();
      res.json(jobOrders);
    } catch (error) {
      console.error("Error fetching job orders:", error);
      res.status(500).json({ message: "Failed to fetch job orders" });
    }
  });

  router.get("/job-orders/order/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const jobOrders = await storage.getJobOrdersByOrder(orderId);
      res.json(jobOrders);
    } catch (error) {
      console.error("Error fetching job orders by order:", error);
      res.status(500).json({ message: "Failed to fetch job orders by order" });
    }
  });

  router.get("/job-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const jobOrder = await storage.getJobOrder(id);
      
      if (!jobOrder) {
        return res.status(404).json({ message: "Job order not found" });
      }
      
      res.json(jobOrder);
    } catch (error) {
      console.error("Error fetching job order:", error);
      res.status(500).json({ message: "Failed to fetch job order" });
    }
  });

  router.post("/job-orders", async (req, res) => {
    try {
      console.log("Received job order data:", req.body);
      
      // Create a custom schema for job order creation with string-to-number conversion
      const jobOrderCreateSchema = z.object({
        order_id: z.number().or(z.string().transform(val => parseInt(val))),
        customer_id: z.number().or(z.string().transform(val => parseInt(val))),
        category_id: z.number().or(z.string().transform(val => parseInt(val))), 
        sub_category_id: z.number().or(z.string().transform(val => parseInt(val))),
        item_id: z.number().or(z.string().transform(val => parseInt(val))).optional(),
        size_details: z.string().optional(),
        thickness: z.number().or(z.string().transform(val => parseFloat(val))).optional(),
        cylinder_inch: z.number().or(z.string().transform(val => parseFloat(val))).optional(),
        cutting_length_cm: z.number().or(z.string().transform(val => parseFloat(val))).optional(),
        raw_material: z.string().optional(),
        mast_batch: z.string().optional(),
        is_printed: z.boolean().or(z.string().transform(val => val === 'true')).default(false),
        cutting_unit: z.string().optional(),
        unit_weight_kg: z.number().or(z.string().transform(val => parseFloat(val))).optional(),
        packing: z.string().optional(),
        punching: z.string().optional(),
        cover: z.string().optional(),
        notes: z.string().optional(),
        quantity: z.number().or(z.string().transform(val => parseInt(val))),
        status: z.string().default("pending")
      });
      
      // Parse and validate the data
      const jobOrderData = jobOrderCreateSchema.parse(req.body);
      console.log("Parsed job order data:", jobOrderData);
      
      // Create the job order
      const jobOrder = await storage.createJobOrder(jobOrderData);
      res.status(201).json(jobOrder);
    } catch (error) {
      console.error("Job order creation error:", error);
      handleZodError(error, res);
    }
  });

  router.patch("/job-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Create a partial schema specifically for job order updates
      const partialJobOrderSchema = z.object({
        order_id: z.number().optional(),
        customer_id: z.number().optional(),
        category_id: z.number().optional(), 
        sub_category_id: z.number().optional(),
        item_id: z.number().optional(),
        size_details: z.string().optional(),
        thickness: z.number().optional(),
        cylinder_inch: z.number().optional(),
        cutting_length_cm: z.number().optional(),
        raw_material: z.string().optional(),
        mast_batch: z.string().optional(),
        is_printed: z.boolean().optional(),
        cutting_unit: z.string().optional(),
        unit_weight_kg: z.number().optional(),
        packing: z.string().optional(),
        punching: z.string().optional(),
        cover: z.string().optional(),
        notes: z.string().optional(),
        quantity: z.number().optional(),
        status: z.string().optional()
      });
      
      const jobOrderData = partialJobOrderSchema.parse(req.body);
      const jobOrder = await storage.updateJobOrder(id, jobOrderData);
      
      if (!jobOrder) {
        return res.status(404).json({ message: "Job order not found" });
      }
      
      res.json(jobOrder);
    } catch (error) {
      console.error("Job order update error:", error);
      handleZodError(error, res);
    }
  });

  router.delete("/job-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteJobOrder(id);
      
      if (!success) {
        return res.status(404).json({ message: "Job order not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting job order:", error);
      res.status(500).json({ message: "Failed to delete job order" });
    }
  });

  // Production routes
  router.get("/productions", async (req, res) => {
    try {
      const productions = await storage.listProductions();
      res.json(productions);
    } catch (error) {
      console.error("Error fetching productions:", error);
      res.status(500).json({ message: "Failed to fetch productions" });
    }
  });

  router.get("/productions/job-order/:jobOrderId", async (req, res) => {
    try {
      const jobOrderId = parseInt(req.params.jobOrderId);
      if (isNaN(jobOrderId)) {
        return res.status(400).json({ message: "Invalid job order ID" });
      }
      const productions = await storage.getProductionsByJobOrder(jobOrderId);
      res.json(productions);
    } catch (error) {
      console.error("Error fetching productions by job order:", error);
      res.status(500).json({ message: "Failed to fetch productions by job order" });
    }
  });

  router.get("/productions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const production = await storage.getProduction(id);
      
      if (!production) {
        return res.status(404).json({ message: "Production not found" });
      }
      
      res.json(production);
    } catch (error) {
      console.error("Error fetching production:", error);
      res.status(500).json({ message: "Failed to fetch production" });
    }
  });

  router.post("/productions", async (req, res) => {
    try {
      console.log("Received production data:", JSON.stringify(req.body));
      
      // Handle the production date manually if it's a string
      const rawData = req.body;
      if (typeof rawData.production_date === 'string') {
        try {
          // Convert string date to proper Date object
          rawData.production_date = new Date(rawData.production_date);
        } catch (err) {
          console.error("Error converting production date:", err);
          return res.status(400).json({ message: "Invalid production date format" });
        }
      }
      
      const productionData = insertProductionSchema.parse(rawData);
      console.log("Parsed production data:", JSON.stringify(productionData));
      
      const production = await storage.createProduction(productionData);
      res.status(201).json(production);
    } catch (error) {
      console.error("Error creating production:", error);
      handleZodError(error, res);
    }
  });

  router.patch("/productions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Handle date field explicitly
      const rawData = req.body;
      if (typeof rawData.production_date === 'string') {
        try {
          // Convert string date to proper Date object
          rawData.production_date = new Date(rawData.production_date);
        } catch (err) {
          console.error("Error converting production date:", err);
          return res.status(400).json({ message: "Invalid production date format" });
        }
      }
      
      // Create a partial schema for validation
      const updateProductionSchema = z.object({
        order_id: z.number().optional(),
        job_order_id: z.number().optional(),
        customer_id: z.number().optional(),
        product_id: z.number().optional(),
        production_qty: z.number().optional(),
        operator_id: z.number().optional(),
        section: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        production_date: z.date().optional(),
        status: z.string().optional()
      });
      
      const productionData = updateProductionSchema.parse(rawData);
      const production = await storage.updateProduction(id, productionData);
      
      if (!production) {
        return res.status(404).json({ message: "Production not found" });
      }
      
      res.json(production);
    } catch (error) {
      console.error("Error updating production:", error);
      handleZodError(error, res);
    }
  });

  router.delete("/productions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduction(id);
      
      if (!success) {
        return res.status(404).json({ message: "Production not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting production:", error);
      res.status(500).json({ message: "Failed to delete production" });
    }
  });
  
  // Roll routes
  router.get("/rolls", async (req, res) => {
    try {
      const rolls = await storage.listRolls();
      res.json(rolls);
    } catch (error) {
      console.error("Error fetching rolls:", error);
      res.status(500).json({ message: "Failed to fetch rolls" });
    }
  });

  router.get("/rolls/job-order/:jobOrderId", async (req, res) => {
    try {
      const jobOrderId = parseInt(req.params.jobOrderId);
      if (isNaN(jobOrderId)) {
        return res.status(400).json({ message: "Invalid job order ID" });
      }
      const rolls = await storage.getRollsByJobOrder(jobOrderId);
      res.json(rolls);
    } catch (error) {
      console.error("Error fetching rolls by job order:", error);
      res.status(500).json({ message: "Failed to fetch rolls by job order" });
    }
  });
  
  router.get("/rolls/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const rolls = await storage.getRollsByStatus(status);
      res.json(rolls);
    } catch (error) {
      console.error("Error fetching rolls by status:", error);
      res.status(500).json({ message: "Failed to fetch rolls by status" });
    }
  });

  router.get("/rolls/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const roll = await storage.getRoll(id);
      
      if (!roll) {
        return res.status(404).json({ message: "Roll not found" });
      }
      
      res.json(roll);
    } catch (error) {
      console.error("Error fetching roll:", error);
      res.status(500).json({ message: "Failed to fetch roll" });
    }
  });

  router.post("/rolls", authMiddleware.authenticateJwt, async (req, res) => {
    // Allow admin users to bypass permission checks
    if (!req.user || (req.user.role !== 'admin' && !req.hasPermission?.('production:create'))) {
      return res.status(403).json({ message: "Permission denied" });
    }
    try {
      const rollData = insertRollSchema.parse(req.body);
      const roll = await storage.createRoll(rollData);
      res.status(201).json(roll);
    } catch (error) {
      console.error("Error creating roll:", error);
      handleZodError(error, res);
    }
  });

  router.patch("/rolls/:id", authMiddleware.authenticateJwt, async (req, res) => {
    // Allow admin users to bypass permission checks
    if (!req.user || (req.user.role !== 'admin' && !req.hasPermission?.('production:edit'))) {
      return res.status(403).json({ message: "Permission denied" });
    }
    try {
      const id = parseInt(req.params.id);
      
      // Create a partial schema with the same structure as insertRollSchema
      // Removed created_date to fix date validation issues
      const partialRollSchema = z.object({
        job_order_id: z.number().optional(),
        roll_number: z.number().optional(),
        extruding_qty: z.number().optional().nullable(),
        printing_qty: z.number().optional().nullable(),
        cutting_qty: z.number().optional().nullable(),
        status: z.string().optional(),
        notes: z.string().nullable().optional(),
      });
      
      const rollData = partialRollSchema.parse(req.body);
      console.log("Roll data to update:", rollData);
      
      const roll = await storage.updateRoll(id, rollData);
      
      if (!roll) {
        return res.status(404).json({ message: "Roll not found" });
      }
      
      res.json(roll);
    } catch (error) {
      console.error("Error updating roll:", error);
      handleZodError(error, res);
    }
  });

  router.delete("/rolls/:id", authMiddleware.authenticateJwt, async (req, res) => {
    // Allow admin users to bypass permission checks
    if (!req.user || (req.user.role !== 'admin' && !req.hasPermission?.('production:delete'))) {
      return res.status(403).json({ message: "Permission denied" });
    }
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRoll(id);
      
      if (!success) {
        return res.status(404).json({ message: "Roll not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting roll:", error);
      res.status(500).json({ message: "Failed to delete roll" });
    }
  });

  // Import data
  router.post("/import/:entity", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const entity = req.params.entity;
      const allowedEntities = [
        'users', 'customers', 'salespersons', 'categories', 
        'products', 'items', 'orders', 'jobOrders', 'productions', 'rolls'
      ];
      
      if (!allowedEntities.includes(entity)) {
        return res.status(400).json({ message: "Invalid entity type" });
      }

      // Read file with buffer to properly handle various encodings
      const fileBuffer = fs.readFileSync(req.file.path);
      
      // Detect and handle file encoding using our utility functions
      console.log(`Processing import for entity: ${entity}`);
      
      // Detect the encoding of the file
      const detectedEncoding = detectEncoding(fileBuffer);
      console.log(`Detected encoding: ${detectedEncoding}`);
      
      // Convert the file to UTF-8
      const convertedBuffer = ensureEncoding(fileBuffer, 'utf8');
      const fileContent = convertedBuffer.toString('utf8');
      
      // Log if we needed special encoding handling (for Arabic names particularly)
      if (detectedEncoding !== 'utf8') {
        console.log(`File was converted from ${detectedEncoding} to UTF-8`);
      }
      
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      // Handle large datasets by processing in chunks
      const CHUNK_SIZE = 50; // Process 50 records at a time
      let succeeded = 0;
      let failed = 0;
      
      // For items, we should handle the possibility of ID conflicts (if present in the import)
      if (entity === 'items') {
        // Remove any ID fields from records to let the database auto-increment them
        records.forEach((record: Record<string, any>) => {
          if ('id' in record) {
            delete record.id;
          }
        });
      }
      
      // Handle special processing for customers entity - ensure proper encoding of Arabic names
      if (entity === 'customers') {
        records.forEach((record: Record<string, any>) => {
          // Process Arabic names specifically
          if (record.arabic_name) {
            // Normalize Arabic text to ensure consistent representation
            record.arabic_name = record.arabic_name.normalize('NFC');
            
            // Log the Arabic name for debugging
            console.log(`Processed Arabic name: ${record.arabic_name}`);
          }
          
          // Remove any ID fields from records to let the database auto-increment them
          if ('id' in record) {
            delete record.id;
          }
        });
      }
      
      // Process records in chunks to avoid memory issues
      for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        try {
          const success = await storage.importData(entity, chunk);
          if (success) {
            succeeded += chunk.length;
          } else {
            failed += chunk.length;
          }
        } catch (err) {
          console.error(`Error importing chunk ${i}:`, err);
          failed += chunk.length;
        }
      }
      
      if (succeeded > 0) {
        res.json({ 
          message: `Successfully imported ${succeeded} ${entity}` + 
                  (failed > 0 ? ` (${failed} records failed)` : '')
        });
      } else {
        res.status(500).json({ message: "Failed to import data" });
      }
    } catch (error) {
      console.error("Error importing data:", error);
      res.status(500).json({ message: "An error occurred during import" });
    }
  });

  // Export data
  router.get("/export/:entity", async (req, res) => {
    try {
      const entity = req.params.entity;
      let data;
      
      switch (entity) {
        case 'users':
          data = await storage.listUsers();
          break;
        case 'customers':
          data = await storage.listCustomers();
          break;
        case 'salespersons':
          data = await storage.listSalespersons();
          break;
        case 'categories':
          data = await storage.listCategories();
          break;
        case 'products':
          data = await storage.listProducts();
          break;
        case 'items':
          // Check if we have a customerId query parameter
          if (req.query.customerId) {
            const customerId = parseInt(req.query.customerId as string);
            data = await storage.getItemsByCustomer(customerId);
          } else {
            data = await storage.listItems();
          }
          break;
        case 'orders':
          data = await storage.listOrders();
          break;
        case 'jobOrders':
          data = await storage.listJobOrders();
          break;
        case 'productions':
          data = await storage.listProductions();
          break;
        case 'rolls':
          // Check if we have jobOrderId or status parameters
          if (req.query.jobOrderId) {
            const jobOrderId = parseInt(req.query.jobOrderId as string);
            data = await storage.getRollsByJobOrder(jobOrderId);
          } else if (req.query.status) {
            const status = req.query.status as string;
            data = await storage.getRollsByStatus(status);
          } else {
            data = await storage.listRolls();
          }
          break;
        default:
          return res.status(400).json({ message: "Invalid entity type" });
      }
      
      if (!data || data.length === 0) {
        return res.status(404).json({ message: `No ${entity} found` });
      }

      // Convert data to CSV with enhanced handling of Arabic text
      const headers = Object.keys(data[0]).join(',') + '\n';
      
      // Process rows with improved handling for Arabic text
      const rows = data.map(row => {
        return Object.values(row).map(value => {
          if (typeof value === 'string') {
            // Ensure proper Arabic text encoding using our utility functions
            // First normalize the Unicode text
            const normalizedValue = value.normalize('NFC');
            
            // Special handling for bidirectional text (Arabic + Latin)
            let processedValue = normalizedValue;
            
            // Check if it contains Arabic characters
            if (/[\u0600-\u06FF]/.test(processedValue)) {
              // Add directional markers to ensure proper display in Excel/CSV readers
              processedValue = '\u202B' + processedValue + '\u202C';
            }
            
            // Sanitize CSV field (escape double quotes with double double quotes)
            return `"${processedValue.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',');
      }).join('\n');
      
      const csv = headers + rows;
      
      // Set headers with proper encoding for Arabic text
      res.setHeader('Content-Type', 'text/csv; charset=UTF-8');
      res.setHeader('Content-Disposition', `attachment; filename=${entity}-${Date.now()}.csv`);
      
      // Send with BOM for Excel compatibility with UTF-8
      const BOM = '\uFEFF'; // Byte Order Mark for UTF-8
      res.send(BOM + csv);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "An error occurred during export" });
    }
  });

  // Machine API Routes
  // List all machines
  router.get("/machines", async (req, res) => {
    try {
      const machines = await storage.listMachines();
      res.json(machines);
    } catch (error) {
      console.error("Error fetching machines:", error);
      res.status(500).json({ error: "Failed to fetch machines" });
    }
  });

  // Get a single machine by ID
  router.get("/machines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const machine = await storage.getMachine(id);
      
      if (!machine) {
        return res.status(404).json({ error: "Machine not found" });
      }
      
      res.json(machine);
    } catch (error) {
      console.error("Error fetching machine:", error);
      res.status(500).json({ error: "Failed to fetch machine" });
    }
  });

  // Create a new machine
  router.post("/machines", async (req, res) => {
    try {
      const machineData = insertMachineSchema.parse(req.body);
      const newMachine = await storage.createMachine(machineData);
      res.status(201).json(newMachine);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Update an existing machine
  router.patch("/machines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const machineData = insertMachineSchema.partial().parse(req.body);
      
      const updatedMachine = await storage.updateMachine(id, machineData);
      
      if (!updatedMachine) {
        return res.status(404).json({ error: "Machine not found" });
      }
      
      res.json(updatedMachine);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Delete a machine
  router.delete("/machines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMachine(id);
      
      if (!success) {
        return res.status(404).json({ error: "Machine not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting machine:", error);
      res.status(500).json({ error: "Failed to delete machine" });
    }
  });

  // Machine Options API Routes
  // List all machine options
  router.get("/machine-options", async (req, res) => {
    try {
      const options = await storage.listMachineOptions();
      res.json(options);
    } catch (error) {
      console.error("Error fetching machine options:", error);
      res.status(500).json({ error: "Failed to fetch machine options" });
    }
  });

  // Get a single machine option by ID
  router.get("/machine-options/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const option = await storage.getMachineOption(id);
      
      if (!option) {
        return res.status(404).json({ error: "Machine option not found" });
      }
      
      res.json(option);
    } catch (error) {
      console.error("Error fetching machine option:", error);
      res.status(500).json({ error: "Failed to fetch machine option" });
    }
  });

  // Create a new machine option
  router.post("/machine-options", async (req, res) => {
    try {
      const optionData = insertMachineOptionSchema.parse(req.body);
      const newOption = await storage.createMachineOption(optionData);
      res.status(201).json(newOption);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Update an existing machine option
  router.patch("/machine-options/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const optionData = insertMachineOptionSchema.partial().parse(req.body);
      
      const updatedOption = await storage.updateMachineOption(id, optionData);
      
      if (!updatedOption) {
        return res.status(404).json({ error: "Machine option not found" });
      }
      
      res.json(updatedOption);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Delete a machine option
  router.delete("/machine-options/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMachineOption(id);
      
      if (!success) {
        return res.status(404).json({ error: "Machine option not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting machine option:", error);
      res.status(500).json({ error: "Failed to delete machine option" });
    }
  });

  // Machine-Option relationship API Routes
  // Get all options for a machine
  router.get("/machines/:id/options", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const machine = await storage.getMachine(id);
      
      if (!machine) {
        return res.status(404).json({ error: "Machine not found" });
      }
      
      const options = await storage.getMachineOptions(id);
      res.json(options);
    } catch (error) {
      console.error("Error fetching machine options:", error);
      res.status(500).json({ error: "Failed to fetch machine options" });
    }
  });

  // Associate options with a machine
  router.post("/machines/:id/options", async (req, res) => {
    try {
      const machineId = parseInt(req.params.id);
      const { optionIds } = req.body;
      
      if (!Array.isArray(optionIds)) {
        return res.status(400).json({ error: "optionIds must be an array of option IDs" });
      }
      
      const machine = await storage.getMachine(machineId);
      if (!machine) {
        return res.status(404).json({ error: "Machine not found" });
      }
      
      // First, get existing options to find ones to remove
      const existingOptions = await storage.getMachineOptions(machineId);
      const existingOptionIds = existingOptions.map(o => o.id);
      
      // Remove options that are no longer in the list
      for (const existingId of existingOptionIds) {
        if (!optionIds.includes(existingId)) {
          await storage.removeOptionFromMachine(machineId, existingId);
        }
      }
      
      // Add new options
      let allSuccess = true;
      for (const optionId of optionIds) {
        // Skip if it's already associated
        if (existingOptionIds.includes(optionId)) {
          continue;
        }
        const success = await storage.addOptionToMachine(machineId, optionId);
        if (!success) {
          allSuccess = false;
        }
      }
      
      if (!allSuccess) {
        return res.status(207).json({ 
          message: "Some options could not be associated with the machine",
          status: "partial_success"
        });
      }
      
      res.json({ message: "Options associated with machine successfully" });
    } catch (error) {
      console.error("Error associating options with machine:", error);
      res.status(500).json({ error: "Failed to associate options with machine" });
    }
  });

  // Material types endpoint
  router.get("/material-types", (req, res) => {
    res.json(MATERIAL_TYPES);
  });

  // Mix routes
  router.get("/mixes", async (req, res) => {
    try {
      const mixes = await storage.listMixes();
      res.json(mixes);
    } catch (error) {
      console.error("Error fetching mixes:", error);
      res.status(500).json({ message: "Failed to fetch mixes" });
    }
  });

  router.get("/mixes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mix = await storage.getMix(id);
      
      if (!mix) {
        return res.status(404).json({ message: "Mix not found" });
      }
      
      res.json(mix);
    } catch (error) {
      console.error("Error fetching mix:", error);
      res.status(500).json({ message: "Failed to fetch mix" });
    }
  });

  router.post("/mixes", async (req, res) => {
    try {
      const mixData = insertMixSchema.parse(req.body);
      console.log("Creating mix with data:", mixData);
      const mix = await storage.createMix(mixData);
      res.status(201).json(mix);
    } catch (error) {
      console.error("Error creating mix:", error);
      handleZodError(error, res);
    }
  });
  
  // Simplified mix creation route with material inventory validation
  router.post("/mixes/simple", async (req, res) => {
    try {
      const { created_by, notes, materials, orderIds, machineIds } = req.body;
      
      if (!created_by) {
        return res.status(400).json({ message: "Creator ID is required" });
      }
      
      if (!Array.isArray(materials) || materials.length === 0) {
        return res.status(400).json({ message: "At least one material must be included in the mix" });
      }
      
      // Validate all materials have proper data
      for (const material of materials) {
        if (!material.material_id || !material.quantity_kg) {
          return res.status(400).json({ message: "Each material must have a material_id and quantity_kg" });
        }
      }
      
      // Create the base mix with mix items, orders and machines in one transaction
      const mix = await storage.createMix(
        { 
          created_by: created_by, 
          notes: notes || null,
          mix_date: new Date(),
          status: "Pending"
        },
        // Map to InsertMixItem format
        materials.map(m => ({
          mix_id: 0, // This will be set by createMix
          material_id: m.material_id,
          material_type: "Material", // Using a placeholder type
          quantity_kg: m.quantity_kg,
          notes: m.notes || null
        })),
        orderIds || [],
        machineIds || []
      );
      
      return res.status(201).json(mix);
    } catch (error) {
      console.error("[/api/mixes/simple] Error:", error);
      
      // Return user-friendly error message if inventory check failed
      if (error instanceof Error && error.message.includes("Not enough")) {
        return res.status(400).json({ message: error.message });
      }
      
      return res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  router.patch("/mixes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // We need to use the original schema and make a partial version
      const partialSchema = z.object({
        mix_date: z.preprocess(
          val => val instanceof Date ? val : new Date(val as string),
          z.date().optional()
        ),
        created_by: z.number().optional(),
        status: z.string().optional(),
        notes: z.string().nullable().optional(),
        batch_number: z.string().nullable().optional(),
      });
      
      const mixData = partialSchema.parse(req.body);
      console.log("Updating mix with data:", mixData);
      
      const mix = await storage.updateMix(id, mixData);
      
      if (!mix) {
        return res.status(404).json({ message: "Mix not found" });
      }
      
      res.json(mix);
    } catch (error) {
      console.error("Error updating mix:", error);
      handleZodError(error, res);
    }
  });

  router.delete("/mixes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMix(id);
      
      if (!success) {
        return res.status(404).json({ message: "Mix not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting mix:", error);
      res.status(500).json({ message: "Failed to delete mix" });
    }
  });

  // Mix Items routes
  router.get("/mix-items", async (req, res) => {
    try {
      // Fetch all mix items from all mixes
      const mixes = await storage.listMixes();
      let allMixItems = [];
      
      // For each mix, get its items
      for (const mix of mixes) {
        const mixItems = await storage.getMixItemsByMix(mix.id);
        allMixItems = [...allMixItems, ...mixItems];
      }
      
      res.json(allMixItems);
    } catch (error) {
      console.error("Error fetching all mix items:", error);
      res.status(500).json({ message: "Failed to fetch all mix items" });
    }
  });

  router.get("/mix-items/:mixId", async (req, res) => {
    try {
      const mixId = parseInt(req.params.mixId);
      const mixItems = await storage.getMixItemsByMix(mixId);
      res.json(mixItems);
    } catch (error) {
      console.error("Error fetching mix items:", error);
      res.status(500).json({ message: "Failed to fetch mix items" });
    }
  });

  router.post("/mix-items", async (req, res) => {
    try {
      const mixItemData = insertMixItemSchema.parse(req.body);
      const mixItem = await storage.createMixItem(mixItemData);
      res.status(201).json(mixItem);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.patch("/mix-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mixItemData = insertMixItemSchema.partial().parse(req.body);
      const mixItem = await storage.updateMixItem(id, mixItemData);
      
      if (!mixItem) {
        return res.status(404).json({ message: "Mix item not found" });
      }
      
      res.json(mixItem);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  router.delete("/mix-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMixItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Mix item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting mix item:", error);
      res.status(500).json({ message: "Failed to delete mix item" });
    }
  });

  // Mix-Order relationships
  router.get("/mixes/:id/orders", async (req, res) => {
    try {
      const mixId = parseInt(req.params.id);
      const orders = await storage.getMixOrders(mixId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching mix orders:", error);
      res.status(500).json({ message: "Failed to fetch mix orders" });
    }
  });

  router.post("/mixes/:id/orders", async (req, res) => {
    try {
      const mixId = parseInt(req.params.id);
      const { orderIds } = req.body;
      
      if (!Array.isArray(orderIds)) {
        return res.status(400).json({ message: "orderIds should be an array" });
      }
      
      // Add each order to the mix
      for (const orderId of orderIds) {
        await storage.addOrderToMix(mixId, orderId);
      }
      
      res.json({ message: "Orders associated with mix successfully" });
    } catch (error) {
      console.error("Error associating orders with mix:", error);
      res.status(500).json({ message: "Failed to associate orders with mix" });
    }
  });

  router.delete("/mixes/:mixId/orders/:orderId", async (req, res) => {
    try {
      const mixId = parseInt(req.params.mixId);
      const orderId = parseInt(req.params.orderId);
      
      const success = await storage.removeOrderFromMix(mixId, orderId);
      
      if (!success) {
        return res.status(404).json({ message: "Association not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error removing order from mix:", error);
      res.status(500).json({ message: "Failed to remove order from mix" });
    }
  });

  // Mix-Machine relationships
  router.get("/mixes/:id/machines", async (req, res) => {
    try {
      const mixId = parseInt(req.params.id);
      const machines = await storage.getMixMachines(mixId);
      res.json(machines);
    } catch (error) {
      console.error("Error fetching mix machines:", error);
      res.status(500).json({ message: "Failed to fetch mix machines" });
    }
  });

  router.post("/mixes/:id/machines", async (req, res) => {
    try {
      const mixId = parseInt(req.params.id);
      const { machineIds } = req.body;
      
      if (!Array.isArray(machineIds)) {
        return res.status(400).json({ message: "machineIds should be an array" });
      }
      
      // Add each machine to the mix
      for (const machineId of machineIds) {
        await storage.addMachineToMix(mixId, machineId);
      }
      
      res.json({ message: "Machines associated with mix successfully" });
    } catch (error) {
      console.error("Error associating machines with mix:", error);
      res.status(500).json({ message: "Failed to associate machines with mix" });
    }
  });

  router.delete("/mixes/:mixId/machines/:machineId", async (req, res) => {
    try {
      const mixId = parseInt(req.params.mixId);
      const machineId = parseInt(req.params.machineId);
      
      const success = await storage.removeMachineFromMix(mixId, machineId);
      
      if (!success) {
        return res.status(404).json({ message: "Association not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error removing machine from mix:", error);
      res.status(500).json({ message: "Failed to remove machine from mix" });
    }
  });

  // Maintenance Request routes
  router.get("/maintenance-requests", async (req, res) => {
    try {
      const requests = await storage.listMaintenanceRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      res.status(500).json({ message: "Failed to fetch maintenance requests" });
    }
  });

  // Get maintenance requests by status
  router.get("/maintenance-requests/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const requests = await storage.getMaintenanceRequestsByStatus(status);
      res.json(requests);
    } catch (error) {
      console.error(`Error fetching maintenance requests with status ${req.params.status}:`, error);
      res.status(500).json({ message: "Failed to fetch maintenance requests by status" });
    }
  });

  // Get maintenance requests by machine
  router.get("/maintenance-requests/machine/:machineId", async (req, res) => {
    try {
      const machineId = parseInt(req.params.machineId);
      if (isNaN(machineId)) {
        return res.status(400).json({ message: "Invalid machine ID" });
      }
      const requests = await storage.getMaintenanceRequestsByMachine(machineId);
      res.json(requests);
    } catch (error) {
      console.error(`Error fetching maintenance requests for machine ${req.params.machineId}:`, error);
      res.status(500).json({ message: "Failed to fetch maintenance requests by machine" });
    }
  });

  // Get a single maintenance request by ID
  router.get("/maintenance-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      const request = await storage.getMaintenanceRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Maintenance request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error(`Error fetching maintenance request with ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch maintenance request" });
    }
  });

  // Create a new maintenance request
  router.post("/maintenance-requests", async (req, res) => {
    try {
      // Pre-process the request data to ensure string fields are not null
      const requestBody = {
        ...req.body,
        description: req.body.description || "",
        notes: req.body.notes || "",
        created_by: req.body.created_by || 1 // Default to admin if not specified
      };
      
      console.log("Maintenance request data received:", requestBody);
      
      const requestData = insertMaintenanceRequestSchema.parse(requestBody);
      const request = await storage.createMaintenanceRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating maintenance request:", error);
      handleZodError(error, res);
    }
  });

  // Update a maintenance request
  router.patch("/maintenance-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      
      // Pre-process the request data to ensure string fields are not null
      const requestBody = {
        ...req.body,
        description: req.body.description || "",
        notes: req.body.notes || "",
      };
      
      console.log("Maintenance request update data:", requestBody);
      
      const requestData = updateMaintenanceRequestSchema.parse(requestBody);
      const request = await storage.updateMaintenanceRequest(id, requestData);
      
      if (!request) {
        return res.status(404).json({ message: "Maintenance request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error(`Error updating maintenance request with ID ${req.params.id}:`, error);
      handleZodError(error, res);
    }
  });

  // Delete a maintenance request
  router.delete("/maintenance-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      const success = await storage.deleteMaintenanceRequest(id);
      
      if (!success) {
        return res.status(404).json({ message: "Maintenance request not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting maintenance request with ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete maintenance request" });
    }
  });

  // Maintenance Action routes
  router.get("/maintenance-actions", async (req, res) => {
    try {
      const actions = await storage.listMaintenanceActions();
      res.json(actions);
    } catch (error) {
      console.error("Error fetching maintenance actions:", error);
      res.status(500).json({ message: "Failed to fetch maintenance actions" });
    }
  });

  // Get maintenance actions by request
  router.get("/maintenance-actions/request/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      const actions = await storage.getMaintenanceActionsByRequest(requestId);
      res.json(actions);
    } catch (error) {
      console.error(`Error fetching maintenance actions for request ${req.params.requestId}:`, error);
      res.status(500).json({ message: "Failed to fetch maintenance actions by request" });
    }
  });

  // Get a single maintenance action by ID
  router.get("/maintenance-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid action ID" });
      }
      const action = await storage.getMaintenanceAction(id);
      
      if (!action) {
        return res.status(404).json({ message: "Maintenance action not found" });
      }
      
      res.json(action);
    } catch (error) {
      console.error(`Error fetching maintenance action with ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch maintenance action" });
    }
  });

  // Create a new maintenance action
  router.post("/maintenance-actions", async (req, res) => {
    try {
      // Pre-process the request data to ensure string fields are not null
      const actionBody = {
        ...req.body,
        part_type: req.body.part_type || "",
        action_type: req.body.action_type || "",
        description: req.body.description || "",
        notes: req.body.notes || "",
        created_by: req.body.created_by || 1 // Default to admin if not specified
      };
      
      console.log("Maintenance action data received:", actionBody);
      
      const actionData = insertMaintenanceActionSchema.parse(actionBody);
      const action = await storage.createMaintenanceAction(actionData);
      res.status(201).json(action);
    } catch (error) {
      console.error("Error creating maintenance action:", error);
      handleZodError(error, res);
    }
  });

  // Update a maintenance action
  router.patch("/maintenance-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid action ID" });
      }
      
      // Pre-process the request data to ensure string fields are not null
      const actionBody = {
        ...req.body,
        part_type: req.body.part_type || "",
        action_type: req.body.action_type || "",
        description: req.body.description || "",
        notes: req.body.notes || "",
      };
      
      console.log("Maintenance action update data:", actionBody);
      
      const actionData = updateMaintenanceActionSchema.parse(actionBody);
      const action = await storage.updateMaintenanceAction(id, actionData);
      
      if (!action) {
        return res.status(404).json({ message: "Maintenance action not found" });
      }
      
      res.json(action);
    } catch (error) {
      console.error(`Error updating maintenance action with ID ${req.params.id}:`, error);
      handleZodError(error, res);
    }
  });

  // Delete a maintenance action
  router.delete("/maintenance-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid action ID" });
      }
      const success = await storage.deleteMaintenanceAction(id);
      
      if (!success) {
        return res.status(404).json({ message: "Maintenance action not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting maintenance action with ID ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete maintenance action" });
    }
  });

  // Get part types and action types for maintenance
  router.get("/maintenance/part-types", (req, res) => {
    try {
      res.json(PART_TYPES);
    } catch (error) {
      console.error("Error fetching part types:", error);
      res.status(500).json({ message: "Failed to fetch part types" });
    }
  });

  router.get("/maintenance/action-types", (req, res) => {
    try {
      res.json(ACTION_TYPES);
    } catch (error) {
      console.error("Error fetching action types:", error);
      res.status(500).json({ message: "Failed to fetch action types" });
    }
  });
  
  // Material Inventory routes
  router.get("/materials", async (req, res) => {
    try {
      const materials = await storage.listMaterials();
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ message: "Failed to fetch materials" });
    }
  });
  
  router.get("/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Ensure all fields are properly returned
      const materialResponse = {
        id: material.id,
        identifier: material.identifier,
        name: material.name,
        starting_balance_kg: material.starting_balance_kg || 0,
        current_balance_kg: material.current_balance_kg || 0,
        low_stock_threshold_kg: material.low_stock_threshold_kg,
        created_at: material.created_at || new Date(),
        updated_at: material.updated_at || new Date()
      };
      
      res.json(materialResponse);
    } catch (error) {
      console.error("Error fetching material:", error);
      res.status(500).json({ message: "Failed to fetch material" });
    }
  });
  
  router.post("/materials", async (req, res) => {
    try {
      const materialData = insertMaterialSchema.parse(req.body);
      const material = await storage.createMaterial(materialData);
      res.status(201).json(material);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  router.patch("/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      
      // Create a partial schema that excludes the identifier field for updates
      const updateMaterialSchema = insertMaterialSchema.partial().omit({ identifier: true });
      const materialData = updateMaterialSchema.parse(req.body);
      const material = await storage.updateMaterial(id, materialData);
      
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Ensure all fields are properly returned
      const materialResponse = {
        id: material.id,
        identifier: material.identifier,
        name: material.name,
        starting_balance_kg: material.starting_balance_kg || 0,
        current_balance_kg: material.current_balance_kg || 0,
        low_stock_threshold_kg: material.low_stock_threshold_kg,
        created_at: material.created_at || new Date(),
        updated_at: material.updated_at || new Date()
      };
      
      res.json(materialResponse);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  router.delete("/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      
      const success = await storage.deleteMaterial(id);
      
      if (!success) {
        return res.status(404).json({ message: "Material not found or cannot be deleted because it has input records" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });
  
  // Material Input routes
  router.get("/material-inputs", async (req, res) => {
    try {
      const inputs = await storage.listMaterialInputs();
      res.json(inputs);
    } catch (error) {
      console.error("Error fetching material inputs:", error);
      res.status(500).json({ message: "Failed to fetch material inputs" });
    }
  });
  
  router.get("/material-inputs/material/:materialId", async (req, res) => {
    try {
      const materialId = parseInt(req.params.materialId);
      if (isNaN(materialId)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }
      
      const inputs = await storage.getMaterialInputsByMaterial(materialId);
      res.json(inputs);
    } catch (error) {
      console.error("Error fetching material inputs:", error);
      res.status(500).json({ message: "Failed to fetch material inputs" });
    }
  });
  
  router.get("/material-inputs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid input ID" });
      }
      
      const input = await storage.getMaterialInput(id);
      if (!input) {
        return res.status(404).json({ message: "Material input not found" });
      }
      
      res.json(input);
    } catch (error) {
      console.error("Error fetching material input:", error);
      res.status(500).json({ message: "Failed to fetch material input" });
    }
  });
  
  router.post("/material-inputs", async (req, res) => {
    console.log("POST /material-inputs - Request received with body:", JSON.stringify(req.body, null, 2));
    try {
      // Log important debugging info
      console.log("Request headers:", req.headers);
      
      // Convert string date to Date object if needed
      const body = req.body;
      console.log("Processing request with body:", JSON.stringify(body, null, 2));
      
      // Make sure required fields are present
      if (!body.material_id) {
        return res.status(400).json({ message: "material_id is required" });
      }
      
      if (!body.quantity_kg) {
        return res.status(400).json({ message: "quantity_kg is required" });
      }
      
      // Ensure values are in the correct format
      body.material_id = parseInt(body.material_id);
      body.quantity_kg = parseFloat(body.quantity_kg);
      
      if (body.input_date && typeof body.input_date === 'string') {
        body.input_date = new Date(body.input_date);
        console.log("Converted input_date to Date object:", body.input_date);
      }
      
      console.log("Attempting to parse input data with schema");
      const inputData = insertMaterialInputSchema.parse(body);
      console.log("Validation passed, parsed data:", JSON.stringify(inputData, null, 2));
      
      console.log("Calling storage.createMaterialInput");
      const input = await storage.createMaterialInput(inputData);
      console.log("Material input created successfully:", JSON.stringify(input, null, 2));
      
      res.status(201).json(input);
    } catch (error) {
      console.error("Material input creation error:", error);
      console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
      
      if (error instanceof Error && error.message.includes("input_identifier")) {
        console.log("Trying to fix input_identifier error");
        try {
          // Add unique identifier if needed
          const body = req.body;
          body.material_id = parseInt(body.material_id);
          body.quantity_kg = parseFloat(body.quantity_kg);
          
          // Manual creation
          const patchedInput = {
            ...body,
            input_identifier: `INP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          };
          
          if (body.input_date && typeof body.input_date === 'string') {
            patchedInput.input_date = new Date(body.input_date);
          }
          
          console.log("Attempting recovery with patched data:", JSON.stringify(patchedInput, null, 2));
          const input = await storage.createMaterialInput(patchedInput);
          console.log("Recovery successful - Material input created:", JSON.stringify(input, null, 2));
          
          return res.status(201).json(input);
        } catch (recoveryError) {
          console.error("Recovery attempt failed:", recoveryError);
        }
      }
      
      handleZodError(error, res);
    }
  });
  
  router.delete("/material-inputs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid input ID" });
      }
      
      const success = await storage.deleteMaterialInput(id);
      
      if (!success) {
        return res.status(404).json({ message: "Material input not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting material input:", error);
      res.status(500).json({ message: "Failed to delete material input" });
    }
  });
  
  // Receiving Orders routes
  router.get("/receiving-orders", async (req, res) => {
    try {
      const receivingOrders = await storage.listReceivingOrders();
      res.json(receivingOrders);
    } catch (error) {
      console.error("Error fetching receiving orders:", error);
      res.status(500).json({ message: "Failed to fetch receiving orders" });
    }
  });
  
  router.get("/receiving-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid receiving order ID" });
      }
      
      const receivingOrder = await storage.getReceivingOrder(id);
      
      if (!receivingOrder) {
        return res.status(404).json({ message: "Receiving order not found" });
      }
      
      res.json(receivingOrder);
    } catch (error) {
      console.error("Error fetching receiving order:", error);
      res.status(500).json({ message: "Failed to fetch receiving order" });
    }
  });
  
  router.get("/receiving-orders/job-order/:jobOrderId", async (req, res) => {
    try {
      const jobOrderId = parseInt(req.params.jobOrderId);
      if (isNaN(jobOrderId)) {
        return res.status(400).json({ message: "Invalid job order ID" });
      }
      
      const receivingOrders = await storage.getReceivingOrdersByJobOrder(jobOrderId);
      res.json(receivingOrders);
    } catch (error) {
      console.error("Error fetching receiving orders by job order:", error);
      res.status(500).json({ message: "Failed to fetch receiving orders by job order" });
    }
  });
  
  router.post("/receiving-orders", async (req, res) => {
    try {
      const result = insertReceivingOrderSchema.safeParse(req.body);
      
      if (!result.success) {
        return handleZodError(result.error, res);
      }
      
      const receivingOrder = await storage.createReceivingOrder(result.data);
      res.status(201).json(receivingOrder);
    } catch (error) {
      console.error("Error creating receiving order:", error);
      res.status(500).json({ message: "Failed to create receiving order" });
    }
  });
  
  router.delete("/receiving-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid receiving order ID" });
      }
      
      const success = await storage.deleteReceivingOrder(id);
      
      if (!success) {
        return res.status(404).json({ message: "Receiving order not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting receiving order:", error);
      res.status(500).json({ message: "Failed to delete receiving order" });
    }
  });
  
  // Waste calculation routes
  router.get("/waste/roll/:rollId", async (req, res) => {
    try {
      const rollId = parseInt(req.params.rollId);
      if (isNaN(rollId)) {
        return res.status(400).json({ message: "Invalid roll ID" });
      }
      
      const waste = await storage.calculateRollWaste(rollId);
      res.json({ waste });
    } catch (error) {
      console.error("Error calculating roll waste:", error);
      res.status(500).json({ message: "Failed to calculate roll waste" });
    }
  });
  
  router.get("/waste/job-order/:jobOrderId", async (req, res) => {
    try {
      const jobOrderId = parseInt(req.params.jobOrderId);
      if (isNaN(jobOrderId)) {
        return res.status(400).json({ message: "Invalid job order ID" });
      }
      
      const waste = await storage.calculateJobOrderWaste(jobOrderId);
      const wastePercentage = await storage.calculateWastePercentage(jobOrderId);
      
      res.json({ waste, wastePercentage });
    } catch (error) {
      console.error("Error calculating job order waste:", error);
      res.status(500).json({ message: "Failed to calculate job order waste" });
    }
  });
  
  router.get("/waste/timeframe", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      
      const wasteData = await storage.getWasteByTimeframe(startDate, endDate);
      res.json(wasteData);
    } catch (error) {
      console.error("Error getting waste by timeframe:", error);
      res.status(500).json({ message: "Failed to get waste by timeframe" });
    }
  });
  
  // Add an alias for "by-timeframe" to match frontend expectations
  router.get("/waste/by-timeframe", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      
      const wasteData = await storage.getWasteByTimeframe(startDate, endDate);
      res.json(wasteData);
    } catch (error) {
      console.error("Error getting waste by timeframe:", error);
      res.status(500).json({ message: "Failed to get waste by timeframe" });
    }
  });
  
  router.get("/waste/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const wasteData = await storage.getWasteByUser(userId);
      res.json(wasteData);
    } catch (error) {
      console.error("Error getting waste by user:", error);
      res.status(500).json({ message: "Failed to get waste by user" });
    }
  });
  
  // Add an endpoint to get all waste by user (grouped)
  router.get("/waste/by-user", async (req, res) => {
    try {
      const users = await storage.listUsers();
      const result: Record<number, any[]> = {};
      
      // Get waste data for each user
      for (const user of users) {
        const userData = await storage.getWasteByUser(user.id);
        if (userData && userData.length > 0) {
          result[user.id] = userData;
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error getting waste by all users:", error);
      res.status(500).json({ message: "Failed to get waste by all users" });
    }
  });
  
  router.get("/waste/section/:section", async (req, res) => {
    try {
      const section = req.params.section;
      
      const wasteData = await storage.getWasteBySection(section);
      res.json(wasteData);
    } catch (error) {
      console.error("Error getting waste by section:", error);
      res.status(500).json({ message: "Failed to get waste by section" });
    }
  });
  
  // Add an endpoint to get all waste by section (grouped)
  router.get("/waste/by-section", async (req, res) => {
    try {
      // Get users with unique sections
      const users = await storage.listUsers();
      const sections = Array.from(new Set(users.map(user => user.section).filter(section => !!section)));
      const result: Record<string, any[]> = {};
      
      // Get waste data for each section
      for (const section of sections) {
        if (section) {
          const sectionData = await storage.getWasteBySection(section);
          if (sectionData && sectionData.length > 0) {
            result[section] = sectionData;
          }
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error getting waste by all sections:", error);
      res.status(500).json({ message: "Failed to get waste by all sections" });
    }
  });

  // Set up JWT authentication - we already have this later
  
  // Register API routes
  app.use("/api", router);
  
  // Root-level health endpoint for deployment platforms
  app.get("/health", async (req, res) => {
    try {
      // Simplified health check for faster response
      res.status(200).json({ 
        status: "ok", 
        ready: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Root health check failed:", error);
      res.status(500).json({ 
        status: "error",
        ready: false,
        message: "Health check failed" 
      });
    }
  });
  
  // Create HTTP server
  const httpServer = http.createServer(app);
  
  // WebSocket server setup for real-time updates on a distinct path
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Connected clients
  const clients = new Set<WebSocket>();
  
  // Store machine and production status data
  let productionData = {
    machines: [],
    productions: [],
    rolls: [],
    jobOrders: [],
    lastUpdated: new Date().toISOString()
  };
  
  // WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    // Send the current production data to the new client
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'initial-data', 
        data: productionData 
      }));
    }
    
    // Handle client messages
    ws.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        console.log('Received message:', parsedMessage.type);
        
        if (parsedMessage.type === 'request-update') {
          // Refresh production data from the database
          await updateProductionData();
          
          // Send updated data to all clients
          broadcastProductionData();
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
    
    // Handle connection errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // Function to update production data from the database
  async function updateProductionData() {
    try {
      const [
        machinesList, 
        productionsList, 
        rollsList,
        jobOrdersList
      ] = await Promise.all([
        storage.listMachines(),
        storage.listProductions(),
        storage.listRolls(),
        storage.listJobOrders()
      ]);
      
      // Update the production data store
      productionData = {
        machines: machinesList,
        productions: productionsList,
        rolls: rollsList,
        jobOrders: jobOrdersList,
        lastUpdated: new Date().toISOString()
      };
      
      return productionData;
    } catch (error) {
      console.error('Error updating production data:', error);
      throw error;
    }
  }
  
  // Function to broadcast production data to all connected clients
  function broadcastProductionData() {
    const message = JSON.stringify({ 
      type: 'production-update', 
      data: productionData 
    });
    
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
  
  // Set up an interval to update production data every 30 seconds
  const updateInterval = setInterval(async () => {
    try {
      await updateProductionData();
      broadcastProductionData();
    } catch (error) {
      console.error('Error in scheduled production data update:', error);
    }
  }, 30000); // 30 seconds
  
  // Clean up the interval when the server is closed
  httpServer.on('close', () => {
    clearInterval(updateInterval);
  });
  
  // Initialize the production data
  updateProductionData().catch(error => {
    console.error('Error initializing production data:', error);
  });
  
  // Use SMS service for notifications

  // SMS API Endpoints
  
  // Send SMS to a single recipient
  app.post('/api/sms/send', async (req: Request, res: Response) => {
    try {
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ 
          success: false, 
          error: 'Phone number and message are required' 
        });
      }

      const result = await smsService.sendSMS(phoneNumber, message);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'An error occurred while sending the SMS' 
      });
    }
  });

  // Send SMS to multiple recipients (bulk SMS)
  app.post('/api/sms/send-bulk', async (req: Request, res: Response) => {
    try {
      const { phoneNumbers, message } = req.body;
      
      if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0 || !message) {
        return res.status(400).json({ 
          success: false, 
          error: 'Valid phone numbers array and message are required' 
        });
      }

      const result = await smsService.sendBulkSMS(phoneNumbers, message);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Error sending bulk SMS:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'An error occurred while sending bulk SMS' 
      });
    }
  });

  // Send SMS notification to a customer
  app.post('/api/sms/notify-customer', async (req: Request, res: Response) => {
    try {
      const { customerId, message } = req.body;
      
      if (!customerId || !message) {
        return res.status(400).json({ 
          success: false, 
          error: 'Customer ID and message are required' 
        });
      }

      // Get the customer details
      const customer = await storage.getCustomer(parseInt(customerId, 10));
      
      if (!customer) {
        return res.status(404).json({ 
          success: false, 
          error: 'Customer not found' 
        });
      }

      if (!customer.phone) {
        return res.status(400).json({ 
          success: false, 
          error: 'Customer does not have a phone number' 
        });
      }

      // Send the SMS
      const result = await smsService.sendSMS(customer.phone, message);
      
      if (result.success) {
        return res.status(200).json({
          ...result,
          customer: {
            id: customer.id,
            name: customer.name
          }
        });
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Error sending customer notification:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'An error occurred while sending the notification' 
      });
    }
  });

  // Send SMS notification for order status
  app.post('/api/sms/notify-order-status', async (req: Request, res: Response) => {
    try {
      const { orderId, status, customMessage } = req.body;
      
      if (!orderId || !status) {
        return res.status(400).json({ 
          success: false, 
          error: 'Order ID and status are required' 
        });
      }

      // Get the order details
      const order = await storage.getOrder(parseInt(orderId, 10));
      
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          error: 'Order not found' 
        });
      }

      // Get the customer details
      const customer = await storage.getCustomer(order.customer_id);
      
      if (!customer) {
        return res.status(404).json({ 
          success: false, 
          error: 'Customer not found' 
        });
      }

      if (!customer.phone) {
        return res.status(400).json({ 
          success: false, 
          error: 'Customer does not have a phone number' 
        });
      }

      // Construct the message
      let message = customMessage;
      if (!message) {
        // Default message if custom message is not provided
        message = `Dear ${customer.name}, your order #${order.id} has been updated to status: ${status}. Thank you for your business.`;
      }

      // Send the SMS
      const result = await smsService.sendSMS(customer.phone, message);
      
      if (result.success) {
        return res.status(200).json({
          ...result,
          order: {
            id: order.id,
            status: order.status
          },
          customer: {
            id: customer.id,
            name: customer.name
          }
        });
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Error sending order status notification:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'An error occurred while sending the notification' 
      });
    }
  });

  // Send SMS notification to all customers
  app.post('/api/sms/notify-all-customers', async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ 
          success: false, 
          error: 'Message is required' 
        });
      }

      // Get all customers
      const customers = await storage.listCustomers();
      
      // Filter customers with phone numbers
      const customersWithPhones = customers.filter(customer => customer.phone);
      
      if (customersWithPhones.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No customers found with phone numbers' 
        });
      }

      // Extract phone numbers
      const phoneNumbers = customersWithPhones.map(customer => customer.phone!);

      // Send bulk SMS
      const result = await smsService.sendBulkSMS(phoneNumbers, message);
      
      if (result.success) {
        return res.status(200).json({
          ...result,
          customersCount: customersWithPhones.length,
          customers: customersWithPhones.map(c => ({ id: c.id, name: c.name }))
        });
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Error sending bulk customer notification:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'An error occurred while sending bulk notifications' 
      });
    }
  });

  return httpServer;
}
