import { v4 as uuidv4 } from 'uuid';
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
  ReceivingOrder, InsertReceivingOrder, receivingOrders
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;
  saveDashboardPreferences(userId: number, preferences: any): Promise<User | undefined>;
  
  // Customer methods
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  listCustomers(): Promise<Customer[]>;
  
  // Salesperson methods
  getSalesperson(id: number): Promise<Salesperson | undefined>;
  createSalesperson(salesperson: InsertSalesperson): Promise<Salesperson>;
  updateSalesperson(id: number, salesperson: Partial<InsertSalesperson>): Promise<Salesperson | undefined>;
  deleteSalesperson(id: number): Promise<boolean>;
  listSalespersons(): Promise<Salesperson[]>;
  
  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  listCategories(): Promise<Category[]>;
  
  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  listProducts(): Promise<Product[]>;
  
  // Item methods
  getItem(id: number): Promise<Item | undefined>;
  getItemsByCustomer(customerId: number): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  listItems(): Promise<Item[]>;
  
  // Order methods
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  listOrders(): Promise<Order[]>;
  
  // Job Order methods
  getJobOrder(id: number): Promise<JobOrder | undefined>;
  getJobOrdersByOrder(orderId: number): Promise<JobOrder[]>;
  createJobOrder(jobOrder: InsertJobOrder): Promise<JobOrder>;
  updateJobOrder(id: number, jobOrder: Partial<InsertJobOrder>): Promise<JobOrder | undefined>;
  deleteJobOrder(id: number): Promise<boolean>;
  listJobOrders(): Promise<JobOrder[]>;
  
  // Production methods
  getProduction(id: number): Promise<Production | undefined>;
  getProductionsByJobOrder(jobOrderId: number): Promise<Production[]>;
  createProduction(production: InsertProduction): Promise<Production>;
  updateProduction(id: number, production: Partial<InsertProduction>): Promise<Production | undefined>;
  deleteProduction(id: number): Promise<boolean>;
  listProductions(): Promise<Production[]>;
  
  // Production Rolls methods
  getRoll(id: number): Promise<Roll | undefined>;
  getRollsByJobOrder(jobOrderId: number): Promise<Roll[]>;
  getRollsByStatus(status: string): Promise<Roll[]>;
  createRoll(roll: InsertRoll): Promise<Roll>;
  updateRoll(id: number, roll: Partial<InsertRoll>): Promise<Roll | undefined>;
  deleteRoll(id: number): Promise<boolean>;
  listRolls(): Promise<Roll[]>;
  
  // Import data methods
  importData(entity: string, data: any[]): Promise<boolean>;
  
  // Machine methods
  getMachine(id: number): Promise<Machine | undefined>;
  createMachine(machine: InsertMachine): Promise<Machine>;
  updateMachine(id: number, machine: Partial<InsertMachine>): Promise<Machine | undefined>;
  deleteMachine(id: number): Promise<boolean>;
  listMachines(): Promise<Machine[]>;
  
  // Machine Option methods
  getMachineOption(id: number): Promise<MachineOption | undefined>;
  createMachineOption(option: InsertMachineOption): Promise<MachineOption>;
  updateMachineOption(id: number, option: Partial<InsertMachineOption>): Promise<MachineOption | undefined>;
  deleteMachineOption(id: number): Promise<boolean>;
  listMachineOptions(): Promise<MachineOption[]>;
  
  // Machine-Option relationship methods
  addOptionToMachine(machineId: number, optionId: number): Promise<boolean>;
  removeOptionFromMachine(machineId: number, optionId: number): Promise<boolean>;
  getMachineOptions(machineId: number): Promise<MachineOption[]>;
  getMachinesWithOption(optionId: number): Promise<Machine[]>;
  
  // Mix methods
  getMix(id: number): Promise<Mix | undefined>;
  createMix(mix: InsertMix): Promise<Mix>;
  updateMix(id: number, mix: Partial<InsertMix>): Promise<Mix | undefined>;
  deleteMix(id: number): Promise<boolean>;
  listMixes(): Promise<Mix[]>;
  
  // Mix item methods
  getMixItem(id: number): Promise<MixItem | undefined>;
  getMixItemsByMix(mixId: number): Promise<MixItem[]>;
  createMixItem(mixItem: InsertMixItem): Promise<MixItem>;
  updateMixItem(id: number, mixItem: Partial<InsertMixItem>): Promise<MixItem | undefined>;
  deleteMixItem(id: number): Promise<boolean>;
  
  // Mix order relationship methods
  addOrderToMix(mixId: number, orderId: number): Promise<boolean>;
  removeOrderFromMix(mixId: number, orderId: number): Promise<boolean>;
  getMixOrders(mixId: number): Promise<Order[]>;
  getMixesForOrder(orderId: number): Promise<Mix[]>;
  
  // Mix machine relationship methods
  addMachineToMix(mixId: number, machineId: number): Promise<boolean>;
  removeMachineFromMix(mixId: number, machineId: number): Promise<boolean>;
  getMixMachines(mixId: number): Promise<Machine[]>;
  getMixesForMachine(machineId: number): Promise<Mix[]>;
  
  // Maintenance Request methods
  getMaintenanceRequest(id: number): Promise<MaintenanceRequest | undefined>;
  getMaintenanceRequestsByMachine(machineId: number): Promise<MaintenanceRequest[]>;
  getMaintenanceRequestsByStatus(status: string): Promise<MaintenanceRequest[]>;
  createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  updateMaintenanceRequest(id: number, request: Partial<InsertMaintenanceRequest>): Promise<MaintenanceRequest | undefined>;
  deleteMaintenanceRequest(id: number): Promise<boolean>;
  listMaintenanceRequests(): Promise<MaintenanceRequest[]>;
  
  // Maintenance Action methods
  getMaintenanceAction(id: number): Promise<MaintenanceAction | undefined>;
  getMaintenanceActionsByRequest(requestId: number): Promise<MaintenanceAction[]>;
  createMaintenanceAction(action: InsertMaintenanceAction): Promise<MaintenanceAction>;
  updateMaintenanceAction(id: number, action: Partial<InsertMaintenanceAction>): Promise<MaintenanceAction | undefined>;
  deleteMaintenanceAction(id: number): Promise<boolean>;
  listMaintenanceActions(): Promise<MaintenanceAction[]>;
  
  // Material Inventory methods
  getMaterial(id: number): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: number): Promise<boolean>;
  listMaterials(): Promise<Material[]>;
  
  // Material Inputs methods
  getMaterialInput(id: number): Promise<MaterialInput | undefined>;
  getMaterialInputsByMaterial(materialId: number): Promise<MaterialInput[]>;
  createMaterialInput(input: InsertMaterialInput): Promise<MaterialInput>;
  deleteMaterialInput(id: number): Promise<boolean>;
  listMaterialInputs(): Promise<MaterialInput[]>;
  
  // Receiving orders methods
  getReceivingOrder(id: number): Promise<ReceivingOrder | undefined>;
  getReceivingOrdersByJobOrder(jobOrderId: number): Promise<ReceivingOrder[]>;
  createReceivingOrder(receivingOrder: InsertReceivingOrder): Promise<ReceivingOrder>;
  deleteReceivingOrder(id: number): Promise<boolean>;
  listReceivingOrders(): Promise<ReceivingOrder[]>;
  
  // Waste calculation methods
  calculateRollWaste(rollId: number): Promise<number>;
  calculateJobOrderWaste(jobOrderId: number): Promise<number>;
  calculateWastePercentage(jobOrderId: number): Promise<number>;
  getWasteByTimeframe(startDate: Date, endDate: Date): Promise<any[]>;
  getWasteByUser(userId: number): Promise<any[]>;
  getWasteBySection(section: string): Promise<any[]>;
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  
  private users: Map<number, User>;
  private customers: Map<number, Customer>;
  private salespersons: Map<number, Salesperson>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private items: Map<number, Item>;
  private orders: Map<number, Order>;
  private jobOrders: Map<number, JobOrder>;
  private productions: Map<number, Production>;
  private rolls: Map<number, Roll>;
  private machines: Map<number, Machine>;
  private machineOptions: Map<number, MachineOption>;
  private machineToOptions: Map<number, MachineToOption>;
  private materials: Map<number, Material>;
  private materialInputs: Map<number, MaterialInput>;
  private receivingOrders: Map<number, ReceivingOrder>;
  
  private userIdCounter: number;
  private customerIdCounter: number;
  private salespersonIdCounter: number;
  private categoryIdCounter: number;
  private productIdCounter: number;
  private itemIdCounter: number;
  private orderIdCounter: number;
  private jobOrderIdCounter: number;
  private productionIdCounter: number;
  private rollIdCounter: number;
  private machineIdCounter: number;
  private machineOptionIdCounter: number;
  private machineToOptionIdCounter: number;
  private materialIdCounter: number;
  private materialInputIdCounter: number;
  private receivingOrderIdCounter: number;

  constructor() {
    // Initialize session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize maps
    this.users = new Map();
    this.customers = new Map();
    this.salespersons = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.items = new Map();
    this.orders = new Map();
    this.jobOrders = new Map();
    this.productions = new Map();
    this.rolls = new Map();
    this.machines = new Map();
    this.machineOptions = new Map();
    this.machineToOptions = new Map();
    this.materials = new Map();
    this.materialInputs = new Map();
    this.receivingOrders = new Map();
    
    // Initialize ID counters
    this.userIdCounter = 1;
    this.customerIdCounter = 1;
    this.salespersonIdCounter = 1;
    this.categoryIdCounter = 1;
    this.productIdCounter = 1;
    this.itemIdCounter = 1;
    this.orderIdCounter = 1;
    this.jobOrderIdCounter = 1;
    this.productionIdCounter = 1;
    this.rollIdCounter = 1;
    this.machineIdCounter = 1;
    this.machineOptionIdCounter = 1;
    this.machineToOptionIdCounter = 1;
    this.materialIdCounter = 1;
    this.materialInputIdCounter = 1;
    this.receivingOrderIdCounter = 1;
    
    // Add admin user for demo purposes
    this.users.set(this.userIdCounter, {
      id: this.userIdCounter,
      username: 'admin',
      password: 'admin123',
      name: 'Administrator',
      role: 'Admin',
      mobile: null,
      section: null
    });
    this.userIdCounter++;
    
    // Add some default categories from sample data
    this.createCategory({ name: "Packet Trash Bag", category_identification: "1" });
    this.createCategory({ name: "Roll Trash Bag", category_identification: "2" });
    this.createCategory({ name: "T-Shirt Bag", category_identification: "3" });
    this.createCategory({ name: "Calendar Bag", category_identification: "4" });
    this.createCategory({ name: "Folded Table Cover", category_identification: "5" });
    this.createCategory({ name: "Non-Folded Table Cover", category_identification: "6" });
    this.createCategory({ name: "Nylon Factory", category_identification: "7" });
    this.createCategory({ name: "Nylon Bag", category_identification: "8" });
    this.createCategory({ name: "LD Bag", category_identification: "9" });
    this.createCategory({ name: "HD Bag", category_identification: "10" });
    
    // Add some products from sample data
    this.createProduct({ category_id: 1, name: "5GP", size_caption: "5GP", product_identification: "1" });
    this.createProduct({ category_id: 1, name: "8GP", size_caption: "8GP", product_identification: "2" });
    this.createProduct({ category_id: 1, name: "10GP", size_caption: "10GP", product_identification: "3" });
    this.createProduct({ category_id: 1, name: "20GP", size_caption: "20GP", product_identification: "4" });
    this.createProduct({ category_id: 1, name: "30GP", size_caption: "30GP", product_identification: "5" });
    this.createProduct({ category_id: 1, name: "50GP", size_caption: "50GP", product_identification: "6" });
    this.createProduct({ category_id: 1, name: "55GP", size_caption: "55GP", product_identification: "7" });
    this.createProduct({ category_id: 1, name: "60GP", size_caption: "60GP", product_identification: "8" });
    this.createProduct({ category_id: 1, name: "70GP", size_caption: "70GP", product_identification: "9" });
    this.createProduct({ category_id: 1, name: "80GP", size_caption: "80GP", product_identification: "10" });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Customer methods
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.customerIdCounter++;
    const customer: Customer = { ...insertCustomer, id };
    this.customers.set(id, customer);
    return customer;
  }
  
  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) return undefined;
    
    const updatedCustomer = { ...existingCustomer, ...customer };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }
  
  async listCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  // Salesperson methods
  async getSalesperson(id: number): Promise<Salesperson | undefined> {
    return this.salespersons.get(id);
  }
  
  async createSalesperson(insertSalesperson: InsertSalesperson): Promise<Salesperson> {
    const id = this.salespersonIdCounter++;
    const salesperson: Salesperson = { ...insertSalesperson, id };
    this.salespersons.set(id, salesperson);
    return salesperson;
  }
  
  async updateSalesperson(id: number, salesperson: Partial<InsertSalesperson>): Promise<Salesperson | undefined> {
    const existingSalesperson = this.salespersons.get(id);
    if (!existingSalesperson) return undefined;
    
    const updatedSalesperson = { ...existingSalesperson, ...salesperson };
    this.salespersons.set(id, updatedSalesperson);
    return updatedSalesperson;
  }
  
  async deleteSalesperson(id: number): Promise<boolean> {
    return this.salespersons.delete(id);
  }
  
  async listSalespersons(): Promise<Salesperson[]> {
    return Array.from(this.salespersons.values());
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory = { ...existingCategory, ...category };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  async listCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.category_id === categoryId,
    );
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    const updatedProduct = { ...existingProduct, ...product };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  async listProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  // Item methods
  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }
  
  async getItemsByCustomer(customerId: number): Promise<Item[]> {
    return Array.from(this.items.values()).filter(
      (item) => item.customer_id === customerId,
    );
  }
  
  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = this.itemIdCounter++;
    const item: Item = { ...insertItem, id };
    this.items.set(id, item);
    return item;
  }
  
  async updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined> {
    const existingItem = this.items.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.items.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }
  
  async listItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }
  
  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.customer_id === customerId,
    );
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const order: Order = { ...insertOrder, id };
    this.orders.set(id, order);
    return order;
  }
  
  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;
    
    const updatedOrder = { ...existingOrder, ...order };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async deleteOrder(id: number): Promise<boolean> {
    return this.orders.delete(id);
  }
  
  async listOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  // Job Order methods
  async getJobOrder(id: number): Promise<JobOrder | undefined> {
    return this.jobOrders.get(id);
  }
  
  async getJobOrdersByOrder(orderId: number): Promise<JobOrder[]> {
    return Array.from(this.jobOrders.values()).filter(
      (jobOrder) => jobOrder.order_id === orderId,
    );
  }
  
  async createJobOrder(insertJobOrder: InsertJobOrder): Promise<JobOrder> {
    const id = this.jobOrderIdCounter++;
    const jobOrder: JobOrder = { ...insertJobOrder, id };
    this.jobOrders.set(id, jobOrder);
    return jobOrder;
  }
  
  async updateJobOrder(id: number, jobOrder: Partial<InsertJobOrder>): Promise<JobOrder | undefined> {
    const existingJobOrder = this.jobOrders.get(id);
    if (!existingJobOrder) return undefined;
    
    const updatedJobOrder = { ...existingJobOrder, ...jobOrder };
    this.jobOrders.set(id, updatedJobOrder);
    return updatedJobOrder;
  }
  
  async deleteJobOrder(id: number): Promise<boolean> {
    return this.jobOrders.delete(id);
  }
  
  async listJobOrders(): Promise<JobOrder[]> {
    return Array.from(this.jobOrders.values());
  }
  
  // Production methods
  async getProduction(id: number): Promise<Production | undefined> {
    return this.productions.get(id);
  }
  
  async getProductionsByJobOrder(jobOrderId: number): Promise<Production[]> {
    return Array.from(this.productions.values()).filter(
      (production) => production.job_order_id === jobOrderId,
    );
  }
  
  async createProduction(insertProduction: InsertProduction): Promise<Production> {
    const id = this.productionIdCounter++;
    const production: Production = { ...insertProduction, id };
    this.productions.set(id, production);
    return production;
  }
  
  async updateProduction(id: number, production: Partial<InsertProduction>): Promise<Production | undefined> {
    const existingProduction = this.productions.get(id);
    if (!existingProduction) return undefined;
    
    const updatedProduction = { ...existingProduction, ...production };
    this.productions.set(id, updatedProduction);
    return updatedProduction;
  }
  
  async deleteProduction(id: number): Promise<boolean> {
    return this.productions.delete(id);
  }
  
  async listProductions(): Promise<Production[]> {
    return Array.from(this.productions.values());
  }
  
  // Roll methods
  async getRoll(id: number): Promise<Roll | undefined> {
    return this.rolls.get(id);
  }
  
  async getRollsByJobOrder(jobOrderId: number): Promise<Roll[]> {
    return Array.from(this.rolls.values()).filter(
      (roll) => roll.job_order_id === jobOrderId,
    );
  }
  
  async getRollsByStatus(status: string): Promise<Roll[]> {
    return Array.from(this.rolls.values()).filter(
      (roll) => roll.status === status,
    );
  }
  
  async createRoll(insertRoll: InsertRoll): Promise<Roll> {
    const id = this.rollIdCounter++;
    const roll: Roll = { ...insertRoll, id };
    this.rolls.set(id, roll);
    return roll;
  }
  
  async updateRoll(id: number, roll: Partial<InsertRoll>): Promise<Roll | undefined> {
    const existingRoll = this.rolls.get(id);
    if (!existingRoll) return undefined;
    
    const updatedRoll = { ...existingRoll, ...roll };
    this.rolls.set(id, updatedRoll);
    return updatedRoll;
  }
  
  async deleteRoll(id: number): Promise<boolean> {
    return this.rolls.delete(id);
  }
  
  async listRolls(): Promise<Roll[]> {
    return Array.from(this.rolls.values());
  }
  
  // Import data methods
  async importData(entity: string, data: any[]): Promise<boolean> {
    try {
      switch (entity) {
        case 'users':
          data.forEach(item => {
            this.createUser(item);
          });
          break;
        case 'customers':
          data.forEach(item => {
            this.createCustomer(item);
          });
          break;
        case 'salespersons':
          data.forEach(item => {
            this.createSalesperson(item);
          });
          break;
        case 'categories':
          data.forEach(item => {
            this.createCategory(item);
          });
          break;
        case 'products':
          data.forEach(item => {
            this.createProduct(item);
          });
          break;
        case 'items':
          data.forEach(item => {
            this.createItem(item);
          });
          break;
        case 'orders':
          data.forEach(item => {
            this.createOrder(item);
          });
          break;
        case 'jobOrders':
          data.forEach(item => {
            this.createJobOrder(item);
          });
          break;
        case 'productions':
          data.forEach(item => {
            this.createProduction(item);
          });
          break;
        case 'machines':
          data.forEach(item => {
            this.createMachine(item);
          });
          break;
        case 'machineOptions':
          data.forEach(item => {
            this.createMachineOption(item);
          });
          break;
        case 'rolls':
          data.forEach(item => {
            this.createRoll(item);
          });
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
    return this.machines.get(id);
  }
  
  async createMachine(insertMachine: InsertMachine): Promise<Machine> {
    const id = this.machineIdCounter++;
    const machine: Machine = { ...insertMachine, id };
    this.machines.set(id, machine);
    return machine;
  }
  
  async updateMachine(id: number, machine: Partial<InsertMachine>): Promise<Machine | undefined> {
    const existingMachine = this.machines.get(id);
    if (!existingMachine) return undefined;
    
    const updatedMachine = { ...existingMachine, ...machine };
    this.machines.set(id, updatedMachine);
    return updatedMachine;
  }
  
  async deleteMachine(id: number): Promise<boolean> {
    // Delete all relationships with this machine first
    Array.from(this.machineToOptions.values())
      .filter(mto => mto.machine_id === id)
      .forEach(mto => this.machineToOptions.delete(mto.id));
    
    return this.machines.delete(id);
  }
  
  async listMachines(): Promise<Machine[]> {
    return Array.from(this.machines.values());
  }
  
  // Machine Option methods
  async getMachineOption(id: number): Promise<MachineOption | undefined> {
    return this.machineOptions.get(id);
  }
  
  async createMachineOption(option: InsertMachineOption): Promise<MachineOption> {
    const id = this.machineOptionIdCounter++;
    const machineOption: MachineOption = { ...option, id };
    this.machineOptions.set(id, machineOption);
    return machineOption;
  }
  
  async updateMachineOption(id: number, option: Partial<InsertMachineOption>): Promise<MachineOption | undefined> {
    const existingOption = this.machineOptions.get(id);
    if (!existingOption) return undefined;
    
    const updatedOption = { ...existingOption, ...option };
    this.machineOptions.set(id, updatedOption);
    return updatedOption;
  }
  
  async deleteMachineOption(id: number): Promise<boolean> {
    // Delete all relationships with this option first
    Array.from(this.machineToOptions.values())
      .filter(mto => mto.option_id === id)
      .forEach(mto => this.machineToOptions.delete(mto.id));
    
    return this.machineOptions.delete(id);
  }
  
  async listMachineOptions(): Promise<MachineOption[]> {
    return Array.from(this.machineOptions.values());
  }
  
  // Machine-Option relationship methods
  async addOptionToMachine(machineId: number, optionId: number): Promise<boolean> {
    // Check if machine and option exist
    const machine = this.machines.get(machineId);
    const option = this.machineOptions.get(optionId);
    if (!machine || !option) return false;
    
    // Check if relationship already exists
    const existingRelation = Array.from(this.machineToOptions.values()).find(
      mto => mto.machine_id === machineId && mto.option_id === optionId
    );
    if (existingRelation) return true; // Already exists
    
    // Create new relationship
    const id = this.machineToOptionIdCounter++;
    this.machineToOptions.set(id, {
      id,
      machine_id: machineId,
      option_id: optionId
    });
    
    return true;
  }
  
  async removeOptionFromMachine(machineId: number, optionId: number): Promise<boolean> {
    // Find the relationship to remove
    const relationToRemove = Array.from(this.machineToOptions.values()).find(
      mto => mto.machine_id === machineId && mto.option_id === optionId
    );
    
    if (!relationToRemove) return false; // Relationship doesn't exist
    
    // Remove the relationship
    return this.machineToOptions.delete(relationToRemove.id);
  }
  
  async getMachineOptions(machineId: number): Promise<MachineOption[]> {
    // Get all option IDs associated with this machine
    const optionIds = Array.from(this.machineToOptions.values())
      .filter(mto => mto.machine_id === machineId)
      .map(mto => mto.option_id);
    
    // Get the option objects
    return optionIds
      .map(optionId => this.machineOptions.get(optionId))
      .filter((option): option is MachineOption => option !== undefined);
  }
  
  async getMachinesWithOption(optionId: number): Promise<Machine[]> {
    // Get all machine IDs associated with this option
    const machineIds = Array.from(this.machineToOptions.values())
      .filter(mto => mto.option_id === optionId)
      .map(mto => mto.machine_id);
    
    // Get the machine objects
    return machineIds
      .map(machineId => this.machines.get(machineId))
      .filter((machine): machine is Machine => machine !== undefined);
  }
  
  // Material Inventory methods
  async getMaterial(id: number): Promise<Material | undefined> {
    return this.materials.get(id);
  }
  
  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const id = this.materialIdCounter++;
    const identifier = `MAT-${uuidv4().substring(0, 8)}`;
    
    const material: Material = {
      ...insertMaterial,
      id,
      identifier,
      current_balance_kg: insertMaterial.starting_balance_kg,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.materials.set(id, material);
    return material;
  }
  
  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    const existingMaterial = this.materials.get(id);
    if (!existingMaterial) return undefined;
    
    // If updating starting_balance_kg, adjust current_balance_kg proportionally
    let adjustedCurrentBalance = existingMaterial.current_balance_kg;
    if (material.starting_balance_kg !== undefined) {
      const balanceDifference = material.starting_balance_kg - existingMaterial.starting_balance_kg;
      adjustedCurrentBalance += balanceDifference;
    }
    
    const updatedMaterial = { 
      ...existingMaterial, 
      ...material,
      current_balance_kg: adjustedCurrentBalance,
      updated_at: new Date()
    };
    
    this.materials.set(id, updatedMaterial);
    return updatedMaterial;
  }
  
  async deleteMaterial(id: number): Promise<boolean> {
    // Check if there are any material inputs linked to this material
    const hasInputs = Array.from(this.materialInputs.values()).some(
      input => input.material_id === id
    );
    
    // Don't allow deletion if there are linked inputs
    if (hasInputs) return false;
    
    return this.materials.delete(id);
  }
  
  async listMaterials(): Promise<Material[]> {
    return Array.from(this.materials.values());
  }
  
  // Material Inputs methods
  async getMaterialInput(id: number): Promise<MaterialInput | undefined> {
    return this.materialInputs.get(id);
  }
  
  async getMaterialInputsByMaterial(materialId: number): Promise<MaterialInput[]> {
    return Array.from(this.materialInputs.values()).filter(
      input => input.material_id === materialId
    );
  }
  
  async createMaterialInput(insertMaterialInput: InsertMaterialInput): Promise<MaterialInput> {
    const id = this.materialInputIdCounter++;
    const input_identifier = `INP-${uuidv4().substring(0, 8)}`;
    
    const materialInput: MaterialInput = {
      ...insertMaterialInput,
      id,
      input_identifier,
      created_at: new Date()
    };
    
    // Update the current balance of the material
    const material = this.materials.get(insertMaterialInput.material_id);
    if (material) {
      material.current_balance_kg += insertMaterialInput.quantity_kg;
      material.updated_at = new Date();
      this.materials.set(material.id, material);
    }
    
    this.materialInputs.set(id, materialInput);
    return materialInput;
  }
  
  async deleteMaterialInput(id: number): Promise<boolean> {
    const materialInput = this.materialInputs.get(id);
    if (!materialInput) return false;
    
    // Adjust the current balance of the material
    const material = this.materials.get(materialInput.material_id);
    if (material) {
      material.current_balance_kg -= materialInput.quantity_kg;
      material.updated_at = new Date();
      this.materials.set(material.id, material);
    }
    
    return this.materialInputs.delete(id);
  }
  
  async listMaterialInputs(): Promise<MaterialInput[]> {
    return Array.from(this.materialInputs.values());
  }
  
  // Receiving Order methods
  async getReceivingOrder(id: number): Promise<ReceivingOrder | undefined> {
    return this.receivingOrders.get(id);
  }
  
  async getReceivingOrdersByJobOrder(jobOrderId: number): Promise<ReceivingOrder[]> {
    return Array.from(this.receivingOrders.values()).filter(
      (receivingOrder) => receivingOrder.job_order_id === jobOrderId,
    );
  }
  
  async createReceivingOrder(insertReceivingOrder: InsertReceivingOrder): Promise<ReceivingOrder> {
    const id = this.receivingOrderIdCounter++;
    const receivingOrder: ReceivingOrder = { ...insertReceivingOrder, id };
    this.receivingOrders.set(id, receivingOrder);
    return receivingOrder;
  }
  
  async deleteReceivingOrder(id: number): Promise<boolean> {
    return this.receivingOrders.delete(id);
  }
  
  async listReceivingOrders(): Promise<ReceivingOrder[]> {
    return Array.from(this.receivingOrders.values());
  }
  
  // Waste calculation methods
  async calculateRollWaste(rollId: number): Promise<number> {
    const roll = await this.getRoll(rollId);
    if (!roll || !roll.extruding_qty || !roll.cutting_qty) {
      return 0;
    }
    return roll.extruding_qty - roll.cutting_qty;
  }
  
  async calculateJobOrderWaste(jobOrderId: number): Promise<number> {
    const rolls = await this.getRollsByJobOrder(jobOrderId);
    let totalWaste = 0;
    
    for (const roll of rolls) {
      if (roll.extruding_qty && roll.cutting_qty) {
        totalWaste += (roll.extruding_qty - roll.cutting_qty);
      }
    }
    
    return totalWaste;
  }
  
  async calculateWastePercentage(jobOrderId: number): Promise<number> {
    const rolls = await this.getRollsByJobOrder(jobOrderId);
    let totalExtruded = 0;
    let totalCut = 0;
    
    for (const roll of rolls) {
      if (roll.extruding_qty) {
        totalExtruded += roll.extruding_qty;
      }
      if (roll.cutting_qty) {
        totalCut += roll.cutting_qty;
      }
    }
    
    if (totalExtruded === 0) {
      return 0;
    }
    
    return ((totalExtruded - totalCut) / totalExtruded) * 100;
  }
  
  async getWasteByTimeframe(startDate: Date, endDate: Date): Promise<any[]> {
    // Get all rolls within the timeframe
    const rolls = Array.from(this.rolls.values()).filter(roll => {
      const rollDate = new Date(roll.created_date);
      return rollDate >= startDate && rollDate <= endDate;
    });
    
    // Calculate waste data
    const wasteData = [];
    const jobOrderGroups = new Map<number, Roll[]>();
    
    // Group rolls by job order
    for (const roll of rolls) {
      if (!jobOrderGroups.has(roll.job_order_id)) {
        jobOrderGroups.set(roll.job_order_id, []);
      }
      jobOrderGroups.get(roll.job_order_id)?.push(roll);
    }
    
    // Calculate waste for each job order
    for (const [jobOrderId, jobRolls] of jobOrderGroups.entries()) {
      const jobOrder = await this.getJobOrder(jobOrderId);
      if (!jobOrder) continue;
      
      const customer = await this.getCustomer(jobOrder.customer_id);
      if (!customer) continue;
      
      let totalExtruded = 0;
      let totalCut = 0;
      
      for (const roll of jobRolls) {
        if (roll.extruding_qty) {
          totalExtruded += roll.extruding_qty;
        }
        if (roll.cutting_qty) {
          totalCut += roll.cutting_qty;
        }
      }
      
      const wasteAmount = totalExtruded - totalCut;
      const wastePercentage = totalExtruded > 0 ? (wasteAmount / totalExtruded) * 100 : 0;
      
      wasteData.push({
        jobOrderId,
        customerName: customer.name,
        customerArabicName: customer.arabic_name,
        totalExtruded,
        totalCut,
        wasteAmount,
        wastePercentage,
        rollCount: jobRolls.length
      });
    }
    
    return wasteData;
  }
  
  async getWasteByUser(userId: number): Promise<any[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    // Get all rolls created by this user
    const rolls = Array.from(this.rolls.values()).filter(roll => {
      return roll.created_by === userId;
    });
    
    // Calculate waste data
    const wasteData = [];
    const jobOrderGroups = new Map<number, Roll[]>();
    
    // Group rolls by job order
    for (const roll of rolls) {
      if (!jobOrderGroups.has(roll.job_order_id)) {
        jobOrderGroups.set(roll.job_order_id, []);
      }
      jobOrderGroups.get(roll.job_order_id)?.push(roll);
    }
    
    // Calculate waste for each job order
    for (const [jobOrderId, jobRolls] of jobOrderGroups.entries()) {
      const jobOrder = await this.getJobOrder(jobOrderId);
      if (!jobOrder) continue;
      
      const customer = await this.getCustomer(jobOrder.customer_id);
      if (!customer) continue;
      
      let totalExtruded = 0;
      let totalCut = 0;
      
      for (const roll of jobRolls) {
        if (roll.extruding_qty) {
          totalExtruded += roll.extruding_qty;
        }
        if (roll.cutting_qty) {
          totalCut += roll.cutting_qty;
        }
      }
      
      const wasteAmount = totalExtruded - totalCut;
      const wastePercentage = totalExtruded > 0 ? (wasteAmount / totalExtruded) * 100 : 0;
      
      wasteData.push({
        jobOrderId,
        customerName: customer.name,
        customerArabicName: customer.arabic_name,
        totalExtruded,
        totalCut,
        wasteAmount,
        wastePercentage,
        rollCount: jobRolls.length
      });
    }
    
    return wasteData;
  }
  
  async getWasteBySection(section: string): Promise<any[]> {
    // Get all rolls from this section
    const rolls = Array.from(this.rolls.values()).filter(roll => {
      return roll.section === section;
    });
    
    // Calculate waste data
    const wasteData = [];
    const jobOrderGroups = new Map<number, Roll[]>();
    
    // Group rolls by job order
    for (const roll of rolls) {
      if (!jobOrderGroups.has(roll.job_order_id)) {
        jobOrderGroups.set(roll.job_order_id, []);
      }
      jobOrderGroups.get(roll.job_order_id)?.push(roll);
    }
    
    // Calculate waste for each job order
    for (const [jobOrderId, jobRolls] of jobOrderGroups.entries()) {
      const jobOrder = await this.getJobOrder(jobOrderId);
      if (!jobOrder) continue;
      
      const customer = await this.getCustomer(jobOrder.customer_id);
      if (!customer) continue;
      
      let totalExtruded = 0;
      let totalCut = 0;
      
      for (const roll of jobRolls) {
        if (roll.extruding_qty) {
          totalExtruded += roll.extruding_qty;
        }
        if (roll.cutting_qty) {
          totalCut += roll.cutting_qty;
        }
      }
      
      const wasteAmount = totalExtruded - totalCut;
      const wastePercentage = totalExtruded > 0 ? (wasteAmount / totalExtruded) * 100 : 0;
      
      wasteData.push({
        jobOrderId,
        customerName: customer.name,
        customerArabicName: customer.arabic_name,
        totalExtruded,
        totalCut,
        wasteAmount,
        wastePercentage,
        rollCount: jobRolls.length
      });
    }
    
    return wasteData;
  }
}

import { DatabaseStorage } from './database-storage';
export const storage = new DatabaseStorage();
