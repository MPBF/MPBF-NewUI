import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileBarChart2, FileDown, FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { format, subDays, startOfMonth } from "date-fns";
import { downloadCsv } from "@/utils/csv";
import { generatePdf } from "@/utils/pdf";
import { Badge } from "@/components/ui/badge";

// Machine sections
const SECTIONS = [
  { value: "Extruder", label: "Extruder" },
  { value: "Printing", label: "Printing" },
  { value: "Cutting", label: "Cutting" },
];

// Define report types
type ReportType = "production" | "orders" | "products";

export default function ReportsList() {
  const [reportType, setReportType] = useState<ReportType>("production");
  const [customer, setCustomer] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [section, setSection] = useState<string>("all");
  const [operator, setOperator] = useState<string>("all");
  
  // Fetch customers for dropdown
  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
  });
  
  // Fetch users (operators) for dropdown
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Fetch production data
  const { data: productions, isLoading: isLoadingProductions } = useQuery({
    queryKey: ['/api/productions'],
  });
  
  // Fetch orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
  });
  
  // Fetch job orders
  const { data: jobOrders, isLoading: isLoadingJobOrders } = useQuery({
    queryKey: ['/api/job-orders'],
  });
  
  // Fetch products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
  });
  
  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Get operator name by id
  const getOperatorName = (operatorId: number) => {
    const foundOperator = users?.find(u => u.id === operatorId);
    return foundOperator ? foundOperator.name : `Operator #${operatorId}`;
  };

  // Get machine section by id (if available in data)
  const getMachineSection = (production: any) => {
    // Machine section might be directly in production data or through another relationship
    // If section is found in production data, return it
    if (production.section) {
      // Convert old "Extrusion" values to "Extruder" for consistency
      return production.section === "Extrusion" ? "Extruder" : production.section;
    }
    return "Unknown";
  };
  
  // Filter productions by date, customer, section, and operator
  const filteredProductions = productions?.filter(production => {
    const productionDate = new Date(production.production_date);
    const isInDateRange = (!startDate || productionDate >= startDate) && 
                          (!endDate || productionDate <= endDate);
    const isCustomerMatch = customer === "all" || String(production.customer_id) === customer;
    const isSectionMatch = section === "all" || getMachineSection(production) === section;
    const isOperatorMatch = operator === "all" || String(production.operator_id) === operator;
    
    return isInDateRange && isCustomerMatch && isSectionMatch && isOperatorMatch;
  }) || [];
  
  // Filter orders by date and customer
  const filteredOrders = orders?.filter(order => {
    const orderDate = new Date(order.order_date);
    const isInDateRange = (!startDate || orderDate >= startDate) && 
                          (!endDate || orderDate <= endDate);
    const isCustomerMatch = customer === "all" || String(order.customer_id) === customer;
    return isInDateRange && isCustomerMatch;
  }) || [];
  
  // Get customer name by id
  const getCustomerName = (customerId: number) => {
    const foundCustomer = customers?.find(c => c.id === customerId);
    return foundCustomer ? foundCustomer.name : `Customer #${customerId}`;
  };
  
  // Get product name by id
  const getProductName = (productId: number) => {
    const foundProduct = products?.find(p => p.id === productId);
    return foundProduct ? foundProduct.name : `Product #${productId}`;
  };
  
  // Get category name by id
  const getCategoryName = (categoryId: number) => {
    const foundCategory = categories?.find(c => c.id === categoryId);
    return foundCategory ? foundCategory.name : `Category #${categoryId}`;
  };
  
  // Get job order count for an order
  const getJobOrderCount = (orderId: number) => {
    return jobOrders?.filter(jo => jo.order_id === orderId).length || 0;
  };
  
  // Production report columns
  const productionColumns = [
    {
      header: "ID",
      accessorKey: "id" as const,
    },
    {
      header: "Date",
      accessorKey: "production_date" as const,
      cell: (row: any) => format(new Date(row.production_date), "MMM d, yyyy")
    },
    {
      header: "Customer",
      accessorKey: "customer_id" as const,
      cell: (row: any) => getCustomerName(row.customer_id)
    },
    {
      header: "Product",
      accessorKey: "product_id" as const,
      cell: (row: any) => getProductName(row.product_id)
    },
    {
      header: "Section",
      accessorKey: "section" as const,
      cell: (row: any) => {
        const section = getMachineSection(row);
        return (
          <Badge variant={
            section === "Extruder" ? "default" :
            section === "Printing" ? "secondary" :
            section === "Cutting" ? "outline" : "default"
          }>
            {section}
          </Badge>
        );
      }
    },
    {
      header: "Operator",
      accessorKey: "operator_id" as const,
      cell: (row: any) => row.operator_id ? getOperatorName(row.operator_id) : "—"
    },
    {
      header: "Quantity",
      accessorKey: "production_qty" as const,
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (row: any) => (
        <span 
          className={`px-2 py-1 rounded-full text-xs font-medium 
            ${row.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
        >
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      )
    },
  ];
  
  // Orders report columns
  const orderColumns = [
    {
      header: "ID",
      accessorKey: "id" as const,
    },
    {
      header: "Date",
      accessorKey: "order_date" as const,
      cell: (row: any) => format(new Date(row.order_date), "MMM d, yyyy")
    },
    {
      header: "Customer",
      accessorKey: "customer_id" as const,
      cell: (row: any) => getCustomerName(row.customer_id)
    },
    {
      header: "Job Orders",
      accessorKey: "id" as const,
      cell: (row: any) => getJobOrderCount(row.id)
    },
    {
      header: "Notes",
      accessorKey: "notes" as const,
      cell: (row: any) => <div className="max-w-xs truncate">{row.notes || "-"}</div>
    },
  ];
  
  // Products report columns
  const productColumns = [
    {
      header: "ID",
      accessorKey: "id" as const,
    },
    {
      header: "Name",
      accessorKey: "name" as const,
    },
    {
      header: "Category",
      accessorKey: "category_id" as const,
      cell: (row: any) => getCategoryName(row.category_id)
    },
    {
      header: "Size",
      accessorKey: "size_caption" as const,
    },
    {
      header: "Code",
      accessorKey: "product_identification" as const,
    },
  ];
  
  // Handle report export to CSV
  const handleExportCsv = () => {
    switch (reportType) {
      case "production":
        downloadCsv('/api/export/productions', 'production-report');
        break;
      case "orders":
        downloadCsv('/api/export/orders', 'orders-report');
        break;
      case "products":
        downloadCsv('/api/export/products', 'products-report');
        break;
    }
  };
  
  // Generate filter info text for PDF reports
  const getFilterInfoText = (): string => {
    let filterTexts: string[] = [];
    
    // Add customer filter text
    if (customer !== "all") {
      filterTexts.push(`Customer: ${getCustomerName(parseInt(customer))}`);
    } else {
      filterTexts.push("All Customers");
    }
    
    // Add section filter text for production reports
    if (reportType === "production" && section !== "all") {
      filterTexts.push(`Section: ${section}`);
    }
    
    // Add operator filter text for production reports
    if (reportType === "production" && operator !== "all") {
      filterTexts.push(`Operator: ${getOperatorName(parseInt(operator))}`);
    }
    
    return filterTexts.join(" | ");
  };

  // Handle report export to PDF
  const handleExportPdf = () => {
    let title = '';
    let columns: any[] = [];
    let data: any[] = [];
    
    switch (reportType) {
      case "production":
        title = "Production Report";
        columns = productionColumns.map(col => col.header);
        data = filteredProductions.map(item => [
          item.id,
          format(new Date(item.production_date), "MMM d, yyyy"),
          getCustomerName(item.customer_id),
          getProductName(item.product_id),
          getMachineSection(item),
          item.operator_id ? getOperatorName(item.operator_id) : "—",
          item.production_qty,
          item.status.charAt(0).toUpperCase() + item.status.slice(1)
        ]);
        break;
      case "orders":
        title = "Orders Report";
        columns = orderColumns.map(col => col.header);
        data = filteredOrders.map(item => [
          item.id,
          format(new Date(item.order_date), "MMM d, yyyy"),
          getCustomerName(item.customer_id),
          getJobOrderCount(item.id),
          item.notes || "-"
        ]);
        break;
      case "products":
        title = "Products Report";
        columns = productColumns.map(col => col.header);
        data = products?.map(item => [
          item.id,
          item.name,
          getCategoryName(item.category_id),
          item.size_caption,
          item.product_identification
        ]) || [];
        break;
    }
    
    generatePdf({
      title,
      subtitle: `Report generated on ${format(new Date(), "MMMM d, yyyy")}`,
      filterInfo: getFilterInfoText(),
      dateRange: startDate && endDate ? 
        `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}` : 
        "All dates",
      columns,
      data
    });
  };

  // Set active data and loading state based on report type
  let activeData = [];
  let isLoading = false;
  let activeColumns = [];
  
  switch (reportType) {
    case "production":
      activeData = filteredProductions;
      isLoading = isLoadingProductions;
      activeColumns = productionColumns;
      break;
    case "orders":
      activeData = filteredOrders;
      isLoading = isLoadingOrders;
      activeColumns = orderColumns;
      break;
    case "products":
      activeData = products || [];
      isLoading = isLoadingProducts || isLoadingCategories;
      activeColumns = productColumns;
      break;
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600">Generate and export system reports</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportPdf}>
            <FileText className="h-4 w-4 mr-2" />
            Generate PDF
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>
            Select report type and apply filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
            <div className="lg:col-span-3 xl:col-span-1">
              <label className="block text-sm font-medium mb-1">Report Type</label>
              <Select
                value={reportType}
                onValueChange={(value) => setReportType(value as ReportType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production Report</SelectItem>
                  <SelectItem value="orders">Orders Report</SelectItem>
                  <SelectItem value="products">Products Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Customer</label>
              <Select
                value={customer}
                onValueChange={setCustomer}
                disabled={reportType === "products"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers?.map(customer => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {reportType === "production" && (
              <div>
                <label className="block text-sm font-medium mb-1">Section</label>
                <Select
                  value={section}
                  onValueChange={setSection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {SECTIONS.map(section => (
                      <SelectItem key={section.value} value={section.value}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {reportType === "production" && (
              <div>
                <label className="block text-sm font-medium mb-1">Operator</label>
                <Select
                  value={operator}
                  onValueChange={setOperator}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Operators</SelectItem>
                    {users?.map(user => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <DatePicker
                date={startDate}
                setDate={setStartDate}
                disabled={reportType === "products"}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <DatePicker
                date={endDate}
                setDate={setEndDate}
                disabled={reportType === "products"}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-start space-x-2 mt-2">
            <Button size="sm" variant="outline" onClick={() => {
              setStartDate(startOfMonth(new Date()));
              setEndDate(new Date());
            }} disabled={reportType === "products"}>
              This Month
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setStartDate(subDays(new Date(), 7));
              setEndDate(new Date());
            }} disabled={reportType === "products"}>
              Last 7 Days
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setStartDate(subDays(new Date(), 30));
              setEndDate(new Date());
            }} disabled={reportType === "products"}>
              Last 30 Days
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setStartDate(undefined);
              setEndDate(undefined);
            }} disabled={reportType === "products"}>
              All Time
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {reportType === "production" ? "Production Report" : 
             reportType === "orders" ? "Orders Report" : "Products Report"}
          </CardTitle>
          <CardDescription>
            {reportType === "production" ? "View production records" : 
             reportType === "orders" ? "View order records" : "View product catalog"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6">Loading data...</div>
          ) : activeData.length === 0 ? (
            <div className="text-center py-6">No data available for the selected filters.</div>
          ) : (
            <DataTable
              data={activeData}
              columns={activeColumns}
              searchable
              pagination
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
