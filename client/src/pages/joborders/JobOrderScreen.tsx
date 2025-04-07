import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileDown, 
  FileText, 
  Filter, 
  AlertTriangle, 
  Package, 
  RefreshCcw, 
  Search, 
  ArrowUpDown, 
  Users, 
  Calendar,
  ListFilter
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { downloadCsv } from "@/utils/csv";
import { generatePdf } from "@/utils/pdf";
import { DatePicker } from "@/components/ui/date-picker";
import { apiRequest } from "@/lib/queryClient";
import { 
  calculateJobOrderWaste, 
  calculateJobOrderQuantity,
  calculateWastePercentage 
} from "@/utils/calculations";
import { useToast } from "@/hooks/use-toast";

// Unique values for group by feature
type GroupByField = "customer" | "status" | "mast_batch" | "cylinder_inch" | "none";

interface FilterState {
  customer: string;
  status: string;
  mastBatch: string;
  cylinderSize: string;
}

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function JobOrderScreen() {
  const { toast } = useToast();
  
  // State for filters
  const [filters, setFilters] = useState<FilterState>({
    customer: "all",
    status: "all",
    mastBatch: "all",
    cylinderSize: "all",
  });
  
  // State for active tab and group by field
  const [activeTab, setActiveTab] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<GroupByField>("none");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // State for searching within a specific field
  const [searchField, setSearchField] = useState<string>("all");
  
  // State for expanded filters
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Fetch all the necessary data
  const { data: jobOrders, isLoading: isLoadingJobOrders, refetch: refetchJobOrders } = useQuery({
    queryKey: ['/api/job-orders'],
    queryFn: () => apiRequest('GET', '/api/job-orders'),
  });
  
  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => apiRequest('GET', '/api/customers'),
  });
  
  const { data: orders } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: () => apiRequest('GET', '/api/orders'),
  });
  
  const { data: products } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest('GET', '/api/products'),
  });
  
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest('GET', '/api/categories'),
  });
  
  const { data: items } = useQuery({
    queryKey: ['/api/items'],
    queryFn: () => apiRequest('GET', '/api/items'),
  });
  
  // Fetch rolls for waste calculation with explicit invalidation on 3-second intervals
  const { data: rolls } = useQuery({
    queryKey: ['/api/rolls'],
    queryFn: () => apiRequest('GET', '/api/rolls'),
    staleTime: 3000, // Consider data stale after 3 seconds
    refetchInterval: 5000, // Refetch every 5 seconds to ensure latest data
  });
  
  // Helper functions to get related data
  const getCustomerName = (customerId?: number) => {
    if (!customerId || !customers) return "Unknown";
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : `Customer #${customerId}`;
  };
  
  const getProductName = (productId?: number) => {
    if (!productId || !products) return "Unknown";
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Product #${productId}`;
  };
  
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId || !categories) return "Unknown";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : `Category #${categoryId}`;
  };
  
  const getOrderStatus = (orderId?: number) => {
    if (!orderId || !orders) return "Unknown";
    const order = orders.find(o => o.id === orderId);
    return order ? order.status : "Unknown";
  };
  
  const getItemDetails = (itemId?: number) => {
    if (!itemId || !items) return null;
    return items.find(i => i.id === itemId);
  };
  
  // Get all rolls for a specific job order
  const getRollsForJobOrder = (jobOrderId: number) => {
    if (!rolls) return [];
    return rolls.filter(roll => roll.job_order_id === jobOrderId);
  };
  
  // Extract unique values for filters
  const uniqueCustomers = useMemo(() => {
    if (!jobOrders || !customers) return [];
    const uniqueIds = [...new Set(jobOrders.map(jo => jo.customer_id))];
    return uniqueIds.map(id => {
      const customer = customers.find(c => c.id === id);
      return { id, name: customer ? customer.name : `Customer #${id}` };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [jobOrders, customers]);
  
  const uniqueStatuses = useMemo(() => {
    if (!jobOrders) return [];
    return [...new Set(jobOrders.map(jo => jo.status))].filter(Boolean);
  }, [jobOrders]);
  
  const uniqueMastBatches = useMemo(() => {
    if (!jobOrders) return [];
    return [...new Set(jobOrders.map(jo => jo.mast_batch))].filter(Boolean).sort();
  }, [jobOrders]);
  
  const uniqueCylinderSizes = useMemo(() => {
    if (!jobOrders) return [];
    return [...new Set(jobOrders.map(jo => jo.cylinder_inch?.toString()))]
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b));
  }, [jobOrders]);
  
  // Apply filters to job orders
  const filteredJobOrders = useMemo(() => {
    if (!jobOrders) return [];
    
    return jobOrders.filter(jo => {
      // Filter by tab
      if (activeTab !== "all" && jo.status !== activeTab) {
        return false;
      }
      
      // Apply customer filter
      if (filters.customer !== "all" && jo.customer_id !== parseInt(filters.customer)) {
        return false;
      }
      
      // Apply status filter
      if (filters.status !== "all" && jo.status !== filters.status) {
        return false;
      }
      
      // Apply mast batch filter
      if (filters.mastBatch !== "all" && jo.mast_batch !== filters.mastBatch) {
        return false;
      }
      
      // Apply cylinder size filter
      if (filters.cylinderSize !== "all" && jo.cylinder_inch?.toString() !== filters.cylinderSize) {
        return false;
      }
      
      // Apply search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (searchField === "all") {
          // Search in all relevant fields
          return (
            jo.pcid?.toLowerCase().includes(term) ||
            getCustomerName(jo.customer_id).toLowerCase().includes(term) ||
            jo.raw_material?.toLowerCase().includes(term) ||
            jo.mast_batch?.toLowerCase().includes(term) ||
            jo.status?.toLowerCase().includes(term) ||
            jo.notes?.toLowerCase().includes(term)
          );
        } else {
          // Search in specific field
          switch (searchField) {
            case "pcid":
              return jo.pcid?.toLowerCase().includes(term);
            case "customer":
              return getCustomerName(jo.customer_id).toLowerCase().includes(term);
            case "raw_material":
              return jo.raw_material?.toLowerCase().includes(term);
            case "mast_batch":
              return jo.mast_batch?.toLowerCase().includes(term);
            case "status":
              return jo.status?.toLowerCase().includes(term);
            case "notes":
              return jo.notes?.toLowerCase().includes(term);
            default:
              return true;
          }
        }
      }
      
      return true;
    });
  }, [jobOrders, activeTab, filters, searchTerm, searchField]);
  
  // Group data according to selected grouping
  const groupedData = useMemo(() => {
    if (groupBy === "none") {
      return { "All Job Orders": filteredJobOrders };
    }
    
    const groups: Record<string, any[]> = {};
    
    filteredJobOrders.forEach(jo => {
      let groupKey = "Unknown";
      
      switch (groupBy) {
        case "customer":
          groupKey = getCustomerName(jo.customer_id);
          break;
        case "status":
          groupKey = jo.status || "No Status";
          break;
        case "mast_batch":
          groupKey = jo.mast_batch || "No Mast Batch";
          break;
        case "cylinder_inch":
          groupKey = jo.cylinder_inch ? `${jo.cylinder_inch}" Cylinder` : "No Cylinder";
          break;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(jo);
    });
    
    // Sort the groups by keys
    return Object.fromEntries(
      Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
    );
  }, [filteredJobOrders, groupBy]);
  
  // Get statistics for summary cards
  const stats = useMemo(() => {
    if (!jobOrders) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        onHold: 0,
      };
    }

    return {
      total: jobOrders.length,
      completed: jobOrders.filter(jo => jo.status === "completed").length,
      inProgress: jobOrders.filter(jo => jo.status === "in-progress").length,
      pending: jobOrders.filter(jo => jo.status === "pending").length,
      onHold: jobOrders.filter(jo => jo.status === "on-hold").length,
    };
  }, [jobOrders]);
  
  // DataTable columns - responsive design with mobile-first approach
  const columns = [
    {
      header: "Job Order",
      accessorKey: "id" as const,
      cell: (row: any) => {
        const item = getItemDetails(row.item_id);
        return (
          <div className="space-y-1 min-w-[120px]">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="font-semibold whitespace-nowrap">
                JO #{row.id}
              </Badge>
              <Badge variant="secondary" className="text-xs hidden md:inline-flex">
                {item?.pcid || 'N/A'}
              </Badge>
            </div>
            <div className="text-sm truncate max-w-[180px]">
              <span className="font-medium">{getCustomerName(row.customer_id)}</span>
            </div>
            <div className="md:hidden">
              <Badge variant="secondary" className="text-xs">
                {item?.pcid || 'N/A'}
              </Badge>
            </div>
          </div>
        );
      }
    },
    {
      header: "Product Details",
      accessorKey: "item_id" as const,
      cell: (row: any) => {
        const item = getItemDetails(row.item_id);
        if (!item) return "Unknown";
        return (
          <div className="space-y-1 min-w-[150px]">
            <div className="font-medium">{getProductName(item.sub_category_id)}</div>
            <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <div className="truncate">
                <span className="text-xs">Category:</span> {getCategoryName(item.category_id)}
              </div>
              <div className="truncate">
                <span className="text-xs">Size:</span> {row.size_details || "—"}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: "Specifications",
      accessorKey: "raw_material" as const,
      cell: (row: any) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm min-w-[150px]">
          <div className="truncate">
            <span className="text-xs text-muted-foreground">Material:</span><br/>
            <span className="font-medium">{row.raw_material || "—"}</span>
          </div>
          <div className="truncate">
            <span className="text-xs text-muted-foreground">M.Batch:</span><br/>
            <span className="font-medium">{row.mast_batch || "—"}</span>
          </div>
          <div className="truncate">
            <span className="text-xs text-muted-foreground">Thickness:</span><br/>
            <span className="font-medium">{row.thickness ? `${row.thickness}mm` : "—"}</span>
          </div>
          <div className="truncate">
            <span className="text-xs text-muted-foreground">Cylinder:</span><br/>
            <span className="font-medium">{row.cylinder_inch ? `${row.cylinder_inch}"` : "—"}</span>
          </div>
        </div>
      )
    },
    {
      header: "Production Info",
      accessorKey: "cutting_length_cm" as const,
      cell: (row: any) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm min-w-[150px]">
          <div className="truncate">
            <span className="text-xs text-muted-foreground">Cut Length:</span><br/>
            <span className="font-medium">{row.cutting_length_cm ? `${row.cutting_length_cm}cm` : "—"}</span>
          </div>
          <div className="truncate">
            <span className="text-xs text-muted-foreground">Cut Unit:</span><br/>
            <span className="font-medium">{row.cutting_unit || "—"}</span>
          </div>
          <div className="truncate">
            <span className="text-xs text-muted-foreground">Packing:</span><br/>
            <span className="font-medium">{row.packing || "—"}</span>
          </div>
          <div className="truncate">
            <span className="text-xs text-muted-foreground">Qty:</span><br/>
            <span className="font-semibold text-blue-700">{row.quantity} kg</span>
          </div>
        </div>
      )
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (row: any) => (
        <div className="space-y-2 min-w-[180px]">
          <Badge variant={
            row.status === "completed" ? "default" :
            row.status === "in-progress" ? "secondary" :
            row.status === "on-hold" ? "destructive" :
            "outline"
          } className="whitespace-nowrap">
            {row.status || "pending"}
          </Badge>
          {/* Adding the production details below the status */}
          {renderWasteCalculation(row)}
        </div>
      )
    }
  ];
  
  // Handle export to CSV
  const handleExportCsv = () => {
    try {
      downloadCsv('/api/job-orders/export', 'job-orders-report');
      toast({
        title: "Export Started",
        description: "Your CSV file is being generated and will download automatically.",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle export to PDF
  const handleExportPdf = () => {
    try {
      // Convert data for PDF
      const columns = [
        "Job ID", "Customer", "Category", "Product", "Size", "Thickness", "Cylinder", 
        "Materials", "Master Batch", "Quantity", "Status", "Production Status"
      ];
      
      const data = filteredJobOrders.map(jo => {
        const item = getItemDetails(jo.item_id);
        
        return [
          `JO #${jo.id}`,
          getCustomerName(jo.customer_id),
          item ? getCategoryName(item.category_id) : "Unknown",
          item ? getProductName(item.sub_category_id) : "Unknown",
          jo.size_details || "—",
          jo.thickness ? `${jo.thickness}mm` : "—",
          jo.cylinder_inch ? `${jo.cylinder_inch}"` : "—",
          jo.raw_material || "—",
          jo.mast_batch || "—",
          `${jo.quantity} kg`,
          jo.status || "pending",
          jo.production_status || "Not Started"
        ];
      });
      
      // Generate PDF
      generatePdf({
        title: "Job Orders Report",
        subtitle: `Report generated on ${format(new Date(), "MMMM d, yyyy")}`,
        filterInfo: `Filters: ${filters.customer !== "all" ? `Customer: ${getCustomerName(parseInt(filters.customer))}` : "All Customers"} | ${filters.status !== "all" ? `Status: ${filters.status}` : "All Statuses"} | ${filters.mastBatch !== "all" ? `Mast Batch: ${filters.mastBatch}` : "All Mast Batches"} | ${filters.cylinderSize !== "all" ? `Cylinder: ${filters.cylinderSize}"` : "All Cylinders"}`,
        columns,
        data,
        orientation: "landscape",
        pageSize: "a4"
      });
      
      toast({
        title: "PDF Generated",
        description: "Your PDF report has been generated and will download automatically.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error creating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Refresh job orders data
  const handleRefresh = () => {
    refetchJobOrders();
    toast({
      title: "Data Refreshed",
      description: "Job orders data has been updated.",
    });
  };
  
  // Function to clear all filters
  const clearFilters = () => {
    setFilters({
      customer: "all",
      status: "all",
      mastBatch: "all",
      cylinderSize: "all",
    });
    setSearchTerm("");
    setSearchField("all");
    toast({
      title: "Filters Cleared",
      description: "All search filters have been reset."
    });
  };
  
  // Function to render production and waste calculation for a job order
  const renderWasteCalculation = (jobOrder: any) => {
    // Get all rolls for this job order
    const jobOrderRolls = getRollsForJobOrder(jobOrder.id);
    
    // Either use the calculated (real-time) values from rolls or the stored values
    // This ensures we always show the latest data even if the job order hasn't been updated yet
    const extrudingQty = jobOrderRolls.reduce((sum, roll) => 
      sum + (roll.extruding_qty || 0), 0);
    
    // Use stored produced_quantity if available, otherwise calculate from rolls
    let producedQty = jobOrder.produced_quantity || 0;
    let wasteQty = jobOrder.waste_quantity || 0;
    
    // If no stored quantity but we have rolls, calculate in real-time
    if (producedQty === 0 && jobOrderRolls.length > 0) {
      const receivedRolls = jobOrderRolls.filter(roll => roll.status === 'Received');
      producedQty = receivedRolls.reduce((sum, roll) => 
        sum + (roll.cutting_qty || 0), 0);
      
      // Calculate waste in real-time too
      wasteQty = Math.max(0, extrudingQty - producedQty);
    }
    
    // Calculate percentages
    const wastePercentage = extrudingQty > 0 ? (wasteQty / extrudingQty) * 100 : 0;
    const productionCompletion = jobOrder.quantity > 0 ? (producedQty / jobOrder.quantity) * 100 : 0;
    
    // Nothing to show if no production data
    if (extrudingQty === 0 && producedQty === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          No production data
        </div>
      );
    }
    
    // Determine if overproduced, completed, or in-progress
    let productionStatus = jobOrder.production_status || 'Not Started';
    
    // Determine status color
    const getStatusColor = () => {
      switch(productionStatus) {
        case 'Overproduced':
          return 'text-blue-600';
        case 'Completed':
          return 'text-green-600';
        case 'In Progress':
          return 'text-amber-600';
        default:
          return 'text-gray-600';
      }
    };
    
    // Format display with appropriate colors for easy visibility
    return (
      <div className="space-y-1 border p-2 rounded-md bg-slate-50">
        <div className="grid grid-cols-2 gap-1">
          <div>
            <span className="text-xs font-medium text-slate-500">Target:</span>
            <span className="text-sm ml-1 font-semibold">{jobOrder.quantity.toFixed(2)} kg</span>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Produced:</span>
            <span className="text-sm ml-1 font-semibold">{producedQty.toFixed(2)} kg</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-1">
          <div>
            <span className="text-xs font-medium text-slate-500">Extruding:</span>
            <span className="text-sm ml-1 font-semibold">{extrudingQty.toFixed(2)} kg</span>
          </div>
          <div className={`flex items-center ${getStatusColor()}`}>
            <span className="text-xs font-medium">Status:</span>
            <span className="text-sm ml-1 font-bold">{productionStatus}</span>
          </div>
        </div>
        
        {/* Progress bar for completion percentage */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              productionCompletion >= 100 
                ? 'bg-green-600' 
                : productionCompletion >= 50
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(productionCompletion, 100)}%` }}
          ></div>
        </div>
        <div className="text-xs text-right font-medium">
          {productionCompletion.toFixed(2)}% complete
        </div>
        
        {/* Waste calculation */}
        {wasteQty > 0 && (
          <div className="mt-1 p-1 rounded bg-gray-100">
            <div className="flex justify-between">
              <span className="text-xs font-medium text-rose-700">Waste:</span>
              <span className="text-xs font-semibold text-rose-700">
                {wasteQty.toFixed(2)} kg ({wastePercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render the component
  return (
    <motion.div 
      className="space-y-6 pb-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Summary Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-blue-600">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Job Orders</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-green-600">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <h3 className="text-2xl font-bold">{stats.completed}</h3>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <Badge className="h-6 px-2 py-1 bg-green-600">
                  {Math.round((stats.completed / (stats.total || 1)) * 100)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <h3 className="text-2xl font-bold">{stats.inProgress}</h3>
              </div>
              <div className="bg-amber-100 p-2 rounded-full">
                <Package className="h-6 w-6 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-slate-500">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <h3 className="text-2xl font-bold">{stats.pending}</h3>
              </div>
              <div className="bg-slate-100 p-2 rounded-full">
                <Package className="h-6 w-6 text-slate-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="border-l-4 border-l-red-600">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">On Hold</p>
                <h3 className="text-2xl font-bold">{stats.onHold}</h3>
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      
      {/* Main Card with Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Package className="h-5 w-5" /> Job Orders
              </CardTitle>
              <CardDescription className="mt-1">
                View and manage all production job orders
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCcw className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Clear Filters</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
              >
                <ListFilter className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">
                  {filtersExpanded ? "Hide Filters" : "Show Filters"}
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search job orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              
              <div className="w-full sm:w-56">
                <Select
                  value={searchField}
                  onValueChange={setSearchField}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Search in..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    <SelectItem value="pcid">PCID</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="raw_material">Raw Material</SelectItem>
                    <SelectItem value="mast_batch">Mast Batch</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="notes">Notes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:w-56">
                <Select
                  value={groupBy}
                  onValueChange={(value) => setGroupBy(value as GroupByField)}
                >
                  <SelectTrigger>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Group by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="customer">Group by Customer</SelectItem>
                    <SelectItem value="status">Group by Status</SelectItem>
                    <SelectItem value="mast_batch">Group by Mast Batch</SelectItem>
                    <SelectItem value="cylinder_inch">Group by Cylinder Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Expanded Filters */}
            {filtersExpanded && (
              <motion.div 
                className="border rounded-md p-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center mb-3">
                  <Filter className="h-4 w-4 mr-2 text-primary" />
                  <h3 className="text-sm font-medium">Advanced Filters</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <label className="text-xs font-medium">Customer</label>
                    </div>
                    <Select
                      value={filters.customer}
                      onValueChange={(value) => setFilters({ ...filters, customer: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Customers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        {uniqueCustomers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <label className="text-xs font-medium">Status</label>
                    </div>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {uniqueStatuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                      <label className="text-xs font-medium">Mast Batch</label>
                    </div>
                    <Select
                      value={filters.mastBatch}
                      onValueChange={(value) => setFilters({ ...filters, mastBatch: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Mast Batches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Mast Batches</SelectItem>
                        {uniqueMastBatches.map(mastBatch => (
                          <SelectItem key={mastBatch} value={mastBatch}>
                            {mastBatch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                      <label className="text-xs font-medium">Cylinder Size</label>
                    </div>
                    <Select
                      value={filters.cylinderSize}
                      onValueChange={(value) => setFilters({ ...filters, cylinderSize: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Cylinder Sizes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cylinder Sizes</SelectItem>
                        {uniqueCylinderSizes.map(size => (
                          <SelectItem key={size} value={size}>
                            {size}"
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="border-t pt-4 flex justify-between gap-4 flex-wrap">
          <div className="text-sm text-muted-foreground">
            {filteredJobOrders.length} job orders found
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
            >
              <FileDown className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm" 
              onClick={handleExportPdf}
            >
              <FileText className="h-4 w-4 mr-1" /> Export PDF
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-0">
          <Tabs defaultValue="all" onValueChange={setActiveTab} value={activeTab} className="w-full overflow-x-auto">
            <TabsList className="w-full justify-start lg:justify-center">
              <TabsTrigger value="all" className="px-4">All Orders</TabsTrigger>
              <TabsTrigger value="pending" className="px-4">Pending</TabsTrigger>
              <TabsTrigger value="in-progress" className="px-4">In Progress</TabsTrigger>
              <TabsTrigger value="completed" className="px-4">Completed</TabsTrigger>
              <TabsTrigger value="on-hold" className="px-4">On Hold</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          {isLoadingJobOrders ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : (
            <div className="overflow-hidden">
              {Object.entries(groupedData).map(([groupName, data], index) => (
                <div key={groupName} className="mb-6 last:mb-0">
                  {groupBy !== "none" && (
                    <>
                      {index > 0 && <Separator className="my-6" />}
                      <div className="px-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <span>{groupName}</span>
                          <Badge variant="secondary" className="ml-2">{data.length}</Badge>
                        </h3>
                      </div>
                    </>
                  )}
                  
                  <div className="overflow-x-auto">
                    <DataTable
                      data={data}
                      columns={columns}
                      searchable={false} // We already have our custom search
                      pagination
                    />
                  </div>
                </div>
              ))}
              
              {filteredJobOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
                  <h3 className="text-lg font-semibold">No job orders found</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}