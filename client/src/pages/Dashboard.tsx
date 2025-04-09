import { useQuery } from "@tanstack/react-query";
import { 
  ClipboardList, ShoppingCart, Clock, Users, Plus, UserPlus, Package, FileBarChart, 
  Gauge, Factory, ArrowUpRight, TrendingUp, Layers, Settings, BarChart, Box,
  ScrollText, Warehouse, PackageOpen, Languages, ListChecks, Workflow
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import StatCard from "../components/ui/dashboard/StatCard";
import RecentProductionItem from "../components/ui/dashboard/RecentProductionItem";
import QuickActionCard from "../components/ui/dashboard/QuickActionCard";
import WasteStatsWidget from "../components/ui/dashboard/WasteStatsWidget";
import ProductionProgressWidget from "../components/ui/dashboard/ProductionProgressWidget";
import RollStatusWidget from "../components/ui/dashboard/RollStatusWidget";
import ProductionInsightsWidget from "../components/ui/dashboard/ProductionInsightsWidget";
import DraggableDashboard, { DashboardWidget, WidgetLayout } from "../components/ui/dashboard/DraggableDashboard";
import { 
  ProductionStatusWidget,
  PendingOrdersWidget,
  RecentRollsWidget,
  CustomerActivityWidget,
  ProductionChartWidget,
  TeamStatusWidget,
  QuickLinksWidget,
  CurrentTimeWidget,
  StatusOverviewWidget
} from "../components/ui/dashboard/DashboardWidgets";
import { DataTable } from "../components/ui/data-table/DataTable";
import { Badge } from "../components/ui/badge";
import { useAuth } from "@/utils/auth";
import { useLanguage } from "@/utils/language";
import { RoleAwareContent, PermissionAwareContent } from "@/components/ui/role-aware-content";
import { TableSkeleton, CardSkeleton, DashboardSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Define simplified types to avoid import issues
type Category = {
  id: number;
  name: string;
  category_identification?: string;
};

type Product = {
  id: number;
  name: string;
  category_id: number;
};

type Customer = {
  id: number;
  name: string;
  drawer_no?: string;
  phone?: string;
  email?: string;
  salesperson_id: number;
  arabic_name?: string;
};

// Type definitions for data fetching
type Order = {
  id: number;
  order_date: string;
  customer_id: number;
  notes?: string;
  status?: string;
};

type JobOrder = {
  id: number;
  order_id: number;
  customer_id: number;
  item_id: number;
  category_id: number;
  sub_category_id: number;
  quantity: number;
  status: string;
  mast_batch?: string;
  size_details?: string;
  raw_material?: string;
  is_printed?: boolean;
};

type Production = {
  id: number;
  production_date: string;
  status: string;
  customer_id: number;
  product_id: number;
  operator_id: number;
  roll_no?: number;
  order_id: number;
  job_order_id: number;
  section?: string;
  notes?: string;
  production_qty: number;
};

type User = {
  id: number;
  username: string;
  name: string;
  role: string;
};

type Roll = {
  id: number;
  roll_identification: string;
  job_order_id: number;
  roll_number: number;
  extruding_qty: number | null;
  printing_qty: number | null;
  cutting_qty: number | null;
  status: string;
  created_date: string;
  notes: string | null;
};

export default function Dashboard() {
  const { language, isRtl, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Translation mapping for dashboard elements
  const translations = {
    english: {
      dashboard: "Dashboard",
      welcome: "Welcome",
      systemOverview: "System overview and key metrics",
      overview: "Overview",
      production: "Production",
      orders: "Orders",
      totalOrders: "Total Orders",
      pendingJobOrders: "Pending Job Orders",
      productionItems: "Production Items",
      totalCustomers: "Total Customers",
      productionStatus: "Production Status",
      currentProductionItems: "Current production items by status",
      readyForPrint: "Ready for Print",
      readyForCut: "Ready for Cut", 
      readyForDeliver: "Ready for Deliver",
      ordersInsights: "Orders Insights",
      processingOrders: "Processing and recent orders",
      viewAll: "View all",
      recentOrder: "Recent Order",
      recentProduction: "Recent Production",
      quickActions: "Quick Actions",
      shortcuts: "Shortcuts to common tasks",
      newOrder: "New Order",
      createCustomerOrder: "Create customer order",
      addCustomer: "Add Customer",
      registerNewCustomer: "Register new customer",
      itemCatalog: "Item Catalog",
      manageItemSpecs: "Manage item specifications",
      runReports: "Run Reports",
      generateReports: "Generate production reports",
      productionRecords: "Production Records",
      manageProduction: "Manage production",
      viewAssignedTasks: "View assigned tasks",
      myProduction: "My Production",
      detailedView: "Detailed view of production items",
      viewAllItems: "View All Production Items",
      orderManagement: "Order Management",
      trackAndManage: "Track and manage customer orders",
      jobOrders: "Job Orders",
      customers: "Customers",
      recentCustomers: "Recent Customers",
      createNewOrder: "Create New Order",
      viewAllOrders: "View All Orders",
      drawerNo: "Drawer No",
      phone: "Phone"
    },
    arabic: {
      dashboard: "لوحة التحكم",
      welcome: "مرحباً",
      systemOverview: "نظرة عامة على النظام والمقاييس الرئيسية",
      overview: "نظرة عامة",
      production: "الإنتاج",
      orders: "الطلبات",
      totalOrders: "إجمالي الطلبات",
      pendingJobOrders: "طلبات العمل المعلقة",
      productionItems: "عناصر الإنتاج",
      totalCustomers: "إجمالي العملاء",
      productionStatus: "حالة الإنتاج",
      currentProductionItems: "عناصر الإنتاج الحالية حسب الحالة",
      readyForPrint: "جاهز للطباعة",
      readyForCut: "جاهز للقص", 
      readyForDeliver: "جاهز للتسليم",
      ordersInsights: "إحصاءات الطلبات",
      processingOrders: "معالجة وأحدث الطلبات",
      viewAll: "عرض الكل",
      recentOrder: "أحدث طلب",
      recentProduction: "الإنتاج الحديث",
      quickActions: "إجراءات سريعة",
      shortcuts: "اختصارات للمهام الشائعة",
      newOrder: "طلب جديد",
      createCustomerOrder: "إنشاء طلب عميل",
      addCustomer: "إضافة عميل",
      registerNewCustomer: "تسجيل عميل جديد",
      itemCatalog: "كتالوج العناصر",
      manageItemSpecs: "إدارة مواصفات العناصر",
      runReports: "تشغيل التقارير",
      generateReports: "إنشاء تقارير الإنتاج",
      productionRecords: "سجلات الإنتاج",
      manageProduction: "إدارة الإنتاج",
      viewAssignedTasks: "عرض المهام المعينة",
      myProduction: "إنتاجي",
      detailedView: "عرض تفصيلي لعناصر الإنتاج",
      viewAllItems: "عرض كل عناصر الإنتاج",
      orderManagement: "إدارة الطلبات",
      trackAndManage: "تتبع وإدارة طلبات العملاء",
      jobOrders: "طلبات العمل",
      customers: "العملاء",
      recentCustomers: "العملاء الأخيرين",
      createNewOrder: "إنشاء طلب جديد",
      viewAllOrders: "عرض جميع الطلبات",
      drawerNo: "رقم الدرج",
      phone: "الهاتف"
    }
  };
  
  // Translation function
  const t = (key: keyof typeof translations.english) => {
    return translations[language][key];
  };
  
  // Fetch categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Fetch customers
  const { data: customers = [], isLoading: loadingCustomers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });
  
  // Fetch orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });
  
  // Fetch job orders
  const { data: jobOrders = [], isLoading: loadingJobOrders } = useQuery<JobOrder[]>({
    queryKey: ['/api/job-orders'],
  });
  
  // Fetch productions
  const { data: productions = [], isLoading: loadingProductions } = useQuery<Production[]>({
    queryKey: ['/api/productions'],
  });
  
  // Fetch users (for operators)
  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Fetch rolls data for production widgets
  const { data: rolls = [], isLoading: loadingRolls } = useQuery<Roll[]>({
    queryKey: ['/api/rolls'],
  });
  
  // Calculate statistics based on real data
  const totalOrders = orders.length;
  const pendingJobOrders = jobOrders.filter(jo => jo.status === 'pending').length;
  const totalCustomers = customers.length;
  
  // Count productions by status
  const productionsByStatus = productions.reduce((acc, prod) => {
    acc[prod.status] = (acc[prod.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const readyForPrint = productionsByStatus['ready_for_print'] || 0;
  const readyForCut = productionsByStatus['ready_for_cut'] || 0;
  const readyForDeliver = productionsByStatus['ready_for_deliver'] || 0;
  
  // Format production data for display
  const formattedProductions = productions
    .slice(0, 5)
    .sort((a, b) => new Date(b.production_date).getTime() - new Date(a.production_date).getTime())
    .map(prod => {
      const customer = customers.find(c => c.id === prod.customer_id);
      const product = categories.find(cat => cat.id === prod.product_id);
      const operator = users.find(u => u.id === prod.operator_id);
      
      return {
        jobOrderId: `JO-${prod.job_order_id}`,
        status: getProductionStatus(prod.status),
        date: new Date(prod.production_date),
        customer: customer?.name || `Customer #${prod.customer_id}`,
        productCategory: product?.name || `Product #${prod.product_id}`,
        operator: operator?.name || `Operator #${prod.operator_id}`
      };
    });
  
  // Derive stats cards from actual data
  const stats = [
    { 
      title: "Total Orders", 
      value: totalOrders, 
      icon: <ClipboardList className="h-6 w-6 text-white" />, 
      bgColor: "bg-gradient-to-br from-blue-600 to-blue-800",
      shadowColor: "shadow-blue-200"
    },
    { 
      title: "Pending Job Orders", 
      value: pendingJobOrders, 
      icon: <Layers className="h-6 w-6 text-white" />, 
      bgColor: "bg-gradient-to-br from-cyan-500 to-cyan-700",
      shadowColor: "shadow-cyan-200"
    },
    { 
      title: "Production Items", 
      value: productions.length, 
      icon: <Factory className="h-6 w-6 text-white" />, 
      bgColor: "bg-gradient-to-br from-green-500 to-green-700",
      shadowColor: "shadow-green-200"
    },
    { 
      title: "Total Customers", 
      value: totalCustomers, 
      icon: <Users className="h-6 w-6 text-white" />, 
      bgColor: "bg-gradient-to-br from-yellow-500 to-yellow-700",
      shadowColor: "shadow-yellow-200"
    },
  ];
  
  // Helper function to convert production status to display status
  function getProductionStatus(status: string): "completed" | "in-progress" | "pending" {
    if (status === 'ready_for_deliver') return 'completed';
    if (status === 'ready_for_cut' || status === 'ready_for_print') return 'in-progress';
    return 'pending';
  }
  
  // Quick action cards
  const quickActions = [
    {
      title: "New Order",
      description: "Create customer order",
      icon: <Plus className="h-6 w-6 text-primary-600" />,
      href: "/orders/new"
    },
    {
      title: "Add Customer",
      description: "Register new customer",
      icon: <UserPlus className="h-6 w-6 text-primary-600" />,
      href: "/customers/new"
    },
    {
      title: "Item Catalog",
      description: "Manage item specifications",
      icon: <Package className="h-6 w-6 text-primary-600" />,
      href: "/products"
    },
    {
      title: "Run Reports",
      description: "Generate production reports",
      icon: <FileBarChart className="h-6 w-6 text-primary-600" />,
      href: "/reports"
    }
  ];
  
  // Get all products in a single query
  const { data: allProducts = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  // Create a map of category ID to product arrays
  const categoryProductsMap = useMemo(() => {
    const map: Record<number, { data: Product[], loading: boolean }> = {};
    
    if (allProducts && allProducts.length > 0 && categories) {
      // Group products by category_id
      (categories || []).forEach(category => {
        const productsForCategory = allProducts.filter(
          product => product.category_id === category.id
        );
        map[category.id] = { 
          data: productsForCategory, 
          loading: loadingProducts 
        };
      });
    }
    
    return map;
  }, [categories, allProducts, loadingProducts]);
  
  // Table columns for categories
  const categoryColumns = [
    {
      header: "ID",
      accessorKey: "id" as const,
    },
    {
      header: "Name",
      accessorKey: "name" as const,
    },
    {
      header: "Code",
      accessorKey: "category_identification" as const,
    },
    {
      header: "Products",
      accessorKey: "id" as const,
      cell: (category: Category) => {
        const categoryProducts = categoryProductsMap[category.id] || { data: [], loading: false };
        const products = categoryProducts.data;
        const loading = categoryProducts.loading;
        
        return loading ? (
          <div className="flex gap-1 max-w-[250px]">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ) : products.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-[250px]">
            {products.map((product) => (
              <Badge 
                key={product.id} 
                variant="secondary" 
                className="bg-primary-100 hover:bg-primary-100 text-primary-800"
              >
                {product.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-slate-500">No products</span>
        );
      }
    }
  ];
  
  // Actions for category table
  const categoryActions = (category: Category) => (
    <div className="flex space-x-3">
      <Link href={`/categories/${category.id}`} className="text-primary-600 hover:text-primary-900">
        Edit
      </Link>
      <button 
        className="text-red-600 hover:text-red-900"
        onClick={() => {
          // In a real app, we would show a confirmation dialog and delete the category
          console.log("Delete category:", category.id);
        }}
      >
        Delete
      </button>
    </div>
  );
  
  const { user } = useAuth();
  
  // Show skeleton if overall dashboard is loading
  if (loadingCategories || loadingCustomers || loadingProductions || loadingOrders || loadingJobOrders || loadingUsers || loadingRolls) {
    return <DashboardSkeleton />;
  }
  
  // For debugging
  console.log("Productions:", productions);
  console.log("Formatted Productions:", formattedProductions);

  return (
    <div className="fade-in">
      {/* Dashboard Header */}
      <div className="mb-8 card-modern bg-white p-6 shadow-medium">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
            className="flex-1"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-mpbf-teal to-mpbf-navy bg-clip-text text-transparent tracking-tight">{t('dashboard')}</h1>
            <p className="text-slate-600 mt-2 flex flex-wrap items-center gap-2">
              {user ? (
                <>
                  <span className="flex items-center gap-1 text-base">
                    {t('welcome')}, <span className="font-semibold text-mpbf-navy">{user.name}</span>
                  </span>
                  <Badge 
                    variant="outline" 
                    className="ml-1 border-mpbf-teal text-mpbf-teal bg-mpbf-teal/5 font-medium px-2.5 py-0.5"
                  >
                    {user.role}
                  </Badge>
                </>
              ) : (
                <span>{t('systemOverview')}</span>
              )}
            </p>
          </motion.div>
          
          {/* Language Toggle */}
          <motion.button 
            onClick={toggleLanguage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-outline text-sm rounded-full px-4 shadow-soft"
          >
            <span className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              {language === 'english' ? 'العربية' : 'English'}
            </span>
          </motion.button>
        </div>
        
        <div className="h-1 w-20 bg-gradient-to-r from-mpbf-teal to-mpbf-navy rounded-full mt-4 opacity-80"></div>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 dashboard-grid ${isRtl ? 'rtl-auto-fix' : ''}`}>
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            className="fade-slide-in"
          >
            <div className="stat-card group hover:shadow-medium">
              <div className="flex justify-between items-center">
                <div className="stat-title">{t(stat.title.replace(/\s+/g, '') as keyof typeof translations.english)}</div>
                <div className={`p-2 rounded-lg transition-colors ${stat.bgColor} text-white`}>
                  {stat.icon}
                </div>
              </div>
              <div className="stat-value font-bold text-gray-900">{stat.value}</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500 font-medium">+12%</span> from last month
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="mb-8" dir={isRtl ? "rtl" : "ltr"}>
        <TabsList className="grid w-full grid-cols-3 rounded-xl bg-gray-100/70 p-1 border border-gray-200 shadow-soft">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-white data-[state=active]:text-mpbf-teal data-[state=active]:shadow-sm rounded-lg"
          >
            <div className="flex items-center gap-2 py-0.5">
              <Gauge className="h-4 w-4" />
              {t('overview')}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="production" 
            className="data-[state=active]:bg-white data-[state=active]:text-mpbf-teal data-[state=active]:shadow-sm rounded-lg"
          >
            <div className="flex items-center gap-2 py-0.5">
              <Factory className="h-4 w-4" />
              {t('production')}
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="data-[state=active]:bg-white data-[state=active]:text-mpbf-teal data-[state=active]:shadow-sm rounded-lg"
          >
            <div className="flex items-center gap-2 py-0.5">
              <ClipboardList className="h-4 w-4" />
              {t('orders')}
            </div>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isRtl ? 'rtl-auto-fix' : ''}`}>
            {/* Production Status Card */}
            <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
              <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 to-white">
                <CardTitle className="text-lg font-bold text-blue-800">{t('productionStatus')}</CardTitle>
                <CardDescription>{t('currentProductionItems')}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>{t('readyForPrint')}</span>
                    </div>
                    <div className="font-medium">{readyForPrint}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>{t('readyForCut')}</span>
                    </div>
                    <div className="font-medium">{readyForCut}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>{t('readyForDeliver')}</span>
                    </div>
                    <div className="font-medium">{readyForDeliver}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Orders Insights Card */}
            <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
              <CardHeader className="pb-2 border-b bg-gradient-to-r from-green-50 to-white">
                <CardTitle className="text-lg font-bold text-green-800">{t('ordersInsights')}</CardTitle>
                <CardDescription>{t('processingOrders')}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span>{t('totalOrders')}</span>
                    </div>
                    <div className="font-medium">{orders.length}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Layers className="h-5 w-5 text-yellow-500" />
                      <span>{t('pendingJobOrders')}</span>
                    </div>
                    <div className="font-medium">{pendingJobOrders}</div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('recentOrder')}</span>
                      <span className="text-sm text-gray-500">
                        {orders.length > 0 ? format(new Date(orders[0].order_date), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <Link href="/orders" className="text-xs text-primary-600 font-medium flex items-center">
                        {t('viewAll')} <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Production */}
          <PermissionAwareContent permission="production:view">
            <Card className="mb-4 overflow-hidden border-0 shadow-lg rounded-xl">
              <CardHeader className="pb-2 border-b bg-gradient-to-r from-indigo-50 to-white">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-bold text-indigo-800">{t('recentProduction')}</CardTitle>
                  <Link href="/production" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
                    {t('viewAll')} <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-white overflow-hidden">
                  <ul className="divide-y divide-slate-200">
                    {formattedProductions.map((item, index) => (
                      <RecentProductionItem 
                        key={index}
                        jobOrderId={item.jobOrderId}
                        status={item.status}
                        date={item.date}
                        customer={item.customer}
                        productCategory={item.productCategory}
                        operator={item.operator}
                      />
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </PermissionAwareContent>

          {/* Quick Actions */}
          <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-2 border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-white">
              <CardTitle className="text-lg font-bold text-blue-800">{t('quickActions')}</CardTitle>
              <CardDescription>{t('shortcuts')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${isRtl ? 'rtl-auto-fix' : ''}`}>
                <RoleAwareContent
                  adminContent={
                    <>
                      {quickActions.map((action, index) => (
                        <QuickActionCard
                          key={index}
                          title={action.title}
                          description={action.description}
                          icon={action.icon}
                          href={action.href}
                        />
                      ))}
                    </>
                  }
                  managerContent={
                    <>
                      <QuickActionCard
                        title="Production Records"
                        description="Manage production"
                        icon={<Factory className="h-6 w-6 text-primary-600" />}
                        href="/production"
                      />
                      <QuickActionCard
                        title="Run Reports"
                        description="Generate production reports"
                        icon={<BarChart className="h-6 w-6 text-primary-600" />}
                        href="/reports"
                      />
                    </>
                  }
                  salespersonContent={
                    <>
                      <QuickActionCard
                        title="New Order"
                        description="Create customer order"
                        icon={<Plus className="h-6 w-6 text-primary-600" />}
                        href="/orders/new"
                      />
                      <QuickActionCard
                        title="Add Customer"
                        description="Register new customer"
                        icon={<UserPlus className="h-6 w-6 text-primary-600" />}
                        href="/customers/new"
                      />
                    </>
                  }
                  operatorContent={
                    <QuickActionCard
                      title="My Production"
                      description="View assigned tasks"
                      icon={<Factory className="h-6 w-6 text-primary-600" />}
                      href="/production"
                    />
                  }
                  fallbackContent={
                    <div className="p-4 bg-amber-50 text-amber-800 rounded-md col-span-full">
                      You don't have permission to access quick actions
                    </div>
                  }
                  unauthenticatedContent={
                    <div className="p-4 bg-amber-50 text-amber-800 rounded-md col-span-full">
                      Please log in to access quick actions
                    </div>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Production Tab - Manufacturing Insights */}
        <TabsContent value="production" className="mt-6">
          {/* First row: Waste Stats and Roll Status */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 ${isRtl ? 'rtl-auto-fix' : ''}`}>
            <WasteStatsWidget 
              rolls={rolls as Roll[]} 
              isLoading={loadingRolls} 
              dateRange="month"
            />
            <RollStatusWidget 
              rolls={rolls as Roll[]} 
              isLoading={loadingRolls} 
            />
          </div>
          
          {/* Second row: Production Progress and Insights */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 ${isRtl ? 'rtl-auto-fix' : ''}`}>
            <ProductionProgressWidget 
              jobOrders={jobOrders as any[]} 
              isLoading={loadingJobOrders} 
              limit={5}
            />
            <ProductionInsightsWidget 
              rolls={rolls as Roll[]} 
              isLoading={loadingRolls} 
              timeframe="week"
            />
          </div>
          
          {/* Link to Production page */}
          <div className="flex justify-center mt-8">
            <Link 
              href="/production" 
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 rounded-lg
                        hover:from-indigo-200 hover:to-indigo-300 transition-all shadow-md border border-indigo-200
                        flex items-center"
            >
              <Factory className="h-4 w-4 mr-2" />
              {t('viewAllItems')}
            </Link>
          </div>
        </TabsContent>
        
        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-6">
          <Card className="overflow-hidden border-0 shadow-lg rounded-xl">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 via-blue-100 to-white">
              <CardTitle className="text-xl font-bold text-blue-800">{t('orderManagement')}</CardTitle>
              <CardDescription>{t('trackAndManage')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Order Statistics */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isRtl ? 'rtl-auto-fix' : ''}`}>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                      <div className="text-blue-800 font-medium mb-1">{t('totalOrders')}</div>
                      <div className="text-2xl font-bold">{orders.length}</div>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-full text-white">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl shadow-sm border border-amber-100 flex items-center justify-between">
                    <div>
                      <div className="text-amber-800 font-medium mb-1">{t('jobOrders')}</div>
                      <div className="text-2xl font-bold">{jobOrders.length}</div>
                    </div>
                    <div className="bg-amber-500 p-3 rounded-full text-white">
                      <Layers className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl shadow-sm border border-indigo-100 flex items-center justify-between">
                    <div>
                      <div className="text-indigo-800 font-medium mb-1">{t('customers')}</div>
                      <div className="text-2xl font-bold">{customers.length}</div>
                    </div>
                    <div className="bg-indigo-500 p-3 rounded-full text-white">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                
                {/* Recent Customers */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-slate-900">{t('recentCustomers')}</h3>
                    <Link href="/customers" className="text-sm text-primary-600 hover:text-primary-500">
                      {t('viewAll')}
                    </Link>
                  </div>
                  
                  <DataTable 
                    data={customers.slice(0, 5)} 
                    columns={[
                      {
                        header: "Name",
                        accessorKey: "name" as const,
                        cell: (customer: Customer) => (
                          <div className="flex flex-col">
                            <span>{customer.name}</span>
                            {customer.arabic_name && (
                              <span dir="rtl" className="text-sm text-slate-500">
                                {customer.arabic_name}
                              </span>
                            )}
                          </div>
                        )
                      },
                      {
                        header: t('drawerNo'),
                        accessorKey: "drawer_no" as const,
                        cell: (customer: Customer) => customer.drawer_no || "—"
                      },
                      {
                        header: t('phone'),
                        accessorKey: "phone" as const,
                        cell: (customer: Customer) => customer.phone || "—"
                      }
                    ]} 
                    isLoading={loadingCustomers}
                  />
                </div>
                
                <div className="flex justify-center gap-4 mt-6">
                  <Link 
                    href="/orders/new" 
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg 
                              hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg
                              flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createNewOrder')}
                  </Link>
                  <Link 
                    href="/orders" 
                    className="px-5 py-2.5 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 rounded-lg
                              hover:from-slate-200 hover:to-slate-300 transition-all shadow-md border border-slate-200
                              flex items-center"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    {t('viewAllOrders')}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
