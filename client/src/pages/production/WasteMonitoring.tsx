import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, subDays, startOfMonth, endOfMonth } from "date-fns";
import { 
  FileDown, 
  Loader2, 
  Calendar, 
  BarChart3, 
  BarChart, 
  PieChart, 
  Percent,
  FileText,
  UserCircle2,
  Laptop2
} from "lucide-react";
import { ApiResponse } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { motion } from "framer-motion";
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useAuth } from "@/utils/auth";
import { usePermissions } from "@/utils/permissions";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { fadeIn, slideFromBottom } from "@/utils/animations";
import { generatePdf } from "@/utils/pdf";
import * as z from "zod";

// Type definition for waste data
interface WasteData {
  date: string;
  jobOrderId: number;
  customerId: number;
  customerName: string;
  rollId: number;
  rollNumber: number;
  extrudingQty: number;
  printingQty: number | null;
  cuttingQty: number | null;
  operator: string;
  section: string;
  wasteKg: number;
  wastePercentage: number;
}

// Create a schema for CSV export
const wasteDataSchema = z.object({
  date: z.string(),
  jobOrderId: z.number(),
  customerName: z.string(),
  rollId: z.number(),
  rollNumber: z.number(),
  extrudingQty: z.number(),
  printingQty: z.number().nullable(),
  cuttingQty: z.number().nullable(),
  operator: z.string(),
  section: z.string(),
  wasteKg: z.number(),
  wastePercentage: z.number(),
});

export default function WasteMonitoring() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, isProductionManager } = usePermissions();
  
  // State for date range selection
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Calculate the formatted date range for API requests
  const formattedDateRange = useMemo(() => {
    if (!dateRange?.from) return { startDate: "", endDate: "" };
    
    const startDate = format(dateRange.from, 'yyyy-MM-dd');
    const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;
    
    return { startDate, endDate };
  }, [dateRange]);
  
  // Query for waste data by date range
  const { data: wasteByTimeframe, isLoading: isLoadingTimeframe } = useQuery({
    queryKey: ['/api/waste/by-timeframe', formattedDateRange.startDate, formattedDateRange.endDate],
    queryFn: () => apiRequest<WasteData[]>('GET', `/api/waste/by-timeframe?startDate=${formattedDateRange.startDate}&endDate=${formattedDateRange.endDate}`),
    enabled: !!formattedDateRange.startDate && !!formattedDateRange.endDate,
  });
  
  // Query for waste data by user
  const { data: wasteByUser, isLoading: isLoadingUserData } = useQuery({
    queryKey: ['/api/waste/by-user'],
    queryFn: () => apiRequest<Record<number, WasteData[]>>('GET', '/api/waste/by-user'),
  });
  
  // Query for waste data by section
  const { data: wasteBySection, isLoading: isLoadingSectionData } = useQuery({
    queryKey: ['/api/waste/by-section'],
    queryFn: () => apiRequest<Record<string, WasteData[]>>('GET', '/api/waste/by-section'),
  });
  
  // Loading state
  const isLoading = isLoadingTimeframe || isLoadingUserData || isLoadingSectionData;
  
  // Calculate overall statistics
  const stats = useMemo(() => {
    if (!wasteByTimeframe) return {
      totalWaste: 0,
      averageWastePercentage: 0,
      highestWaste: { value: 0, customerName: '', date: '' },
      lowestWaste: { value: 100, customerName: '', date: '' },
      totalProduction: 0,
      rollsCount: 0,
    };
    
    const totalWaste = wasteByTimeframe.reduce((sum, item) => sum + item.wasteKg, 0);
    const totalProduction = wasteByTimeframe.reduce((sum, item) => sum + item.extrudingQty, 0);
    const totalPercentage = wasteByTimeframe.reduce((sum, item) => sum + item.wastePercentage, 0);
    const averageWastePercentage = wasteByTimeframe.length > 0 ? totalPercentage / wasteByTimeframe.length : 0;
    
    // Find highest and lowest waste
    let highestWaste = { value: 0, customerName: '', date: '' };
    let lowestWaste = { value: 100, customerName: '', date: '' };
    
    wasteByTimeframe.forEach(item => {
      if (item.wastePercentage > highestWaste.value) {
        highestWaste = {
          value: item.wastePercentage,
          customerName: item.customerName,
          date: item.date,
        };
      }
      
      if (item.wastePercentage < lowestWaste.value && item.wastePercentage > 0) {
        lowestWaste = {
          value: item.wastePercentage,
          customerName: item.customerName,
          date: item.date,
        };
      }
    });
    
    return {
      totalWaste: Math.round(totalWaste * 100) / 100,
      averageWastePercentage: Math.round(averageWastePercentage * 100) / 100,
      highestWaste,
      lowestWaste,
      totalProduction: Math.round(totalProduction * 100) / 100,
      rollsCount: wasteByTimeframe.length,
    };
  }, [wasteByTimeframe]);
  
  // Prepare chart data for timeframe
  const timeframeChartData = useMemo(() => {
    if (!wasteByTimeframe) return [];
    
    // Group data by date
    const groupedByDate = wasteByTimeframe.reduce((acc, item) => {
      const date = item.date.split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          totalWaste: 0,
          averagePercentage: 0,
          count: 0,
        };
      }
      
      acc[date].totalWaste += item.wasteKg;
      acc[date].averagePercentage += item.wastePercentage;
      acc[date].count += 1;
      
      return acc;
    }, {} as Record<string, { date: string; totalWaste: number; averagePercentage: number; count: number }>);
    
    // Convert to array and calculate averages
    return Object.values(groupedByDate).map(item => ({
      date: format(parseISO(item.date), 'MMM dd'),
      waste: Math.round(item.totalWaste * 100) / 100,
      percentage: Math.round((item.averagePercentage / item.count) * 100) / 100,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [wasteByTimeframe]);
  
  // Prepare chart data for users
  const userChartData = useMemo(() => {
    if (!wasteByUser) return [];
    
    return Object.entries(wasteByUser as Record<number, WasteData[]>).map(([userId, data]) => {
      const totalWaste = data.reduce((sum, item) => sum + item.wasteKg, 0);
      const avgPercentage = data.reduce((sum, item) => sum + item.wastePercentage, 0) / data.length;
      
      return {
        name: data[0]?.operator || `User ${userId}`,
        waste: Math.round(totalWaste * 100) / 100,
        percentage: Math.round(avgPercentage * 100) / 100,
        rollCount: data.length,
      };
    }).sort((a, b) => b.waste - a.waste);
  }, [wasteByUser]);
  
  // Prepare chart data for sections
  const sectionChartData = useMemo(() => {
    if (!wasteBySection) return [];
    
    return Object.entries(wasteBySection as Record<string, WasteData[]>).map(([section, data]) => {
      const totalWaste = data.reduce((sum, item) => sum + item.wasteKg, 0);
      const avgPercentage = data.reduce((sum, item) => sum + item.wastePercentage, 0) / data.length;
      
      return {
        name: section,
        waste: Math.round(totalWaste * 100) / 100,
        percentage: Math.round(avgPercentage * 100) / 100,
        rollCount: data.length,
      };
    }).sort((a, b) => b.waste - a.waste);
  }, [wasteBySection]);
  
  // Prepare customer data for pie chart
  const customerChartData = useMemo(() => {
    if (!wasteByTimeframe) return [];
    
    // Group data by customer
    const groupedByCustomer = wasteByTimeframe.reduce((acc, item) => {
      if (!acc[item.customerName]) {
        acc[item.customerName] = {
          name: item.customerName,
          waste: 0,
          percentage: 0,
          count: 0,
        };
      }
      
      acc[item.customerName].waste += item.wasteKg;
      acc[item.customerName].percentage += item.wastePercentage;
      acc[item.customerName].count += 1;
      
      return acc;
    }, {} as Record<string, { name: string; waste: number; percentage: number; count: number }>);
    
    // Convert to array and calculate averages
    return Object.values(groupedByCustomer).map(item => ({
      name: item.name,
      waste: Math.round(item.waste * 100) / 100,
      percentage: Math.round((item.percentage / item.count) * 100) / 100,
    })).sort((a, b) => b.waste - a.waste);
  }, [wasteByTimeframe]);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Function to export data as CSV
  const exportCSV = () => {
    if (!wasteByTimeframe) {
      toast({
        title: "No data to export",
        description: "There is no waste data available for the selected period.",
        variant: "destructive",
      });
      return;
    }
    
    // Create CSV content
    const headers = ["Date", "Job Order", "Customer", "Roll ID", "Roll #", "Extruding (kg)", "Printing (kg)", "Cutting (kg)", "Operator", "Section", "Waste (kg)", "Waste (%)"];
    
    const csvContent = wasteByTimeframe.map(item => [
      format(new Date(item.date), 'yyyy-MM-dd'),
      item.jobOrderId,
      item.customerName,
      item.rollId,
      item.rollNumber,
      item.extrudingQty,
      item.printingQty || 0,
      item.cuttingQty || 0,
      item.operator,
      item.section,
      Math.round(item.wasteKg * 100) / 100,
      Math.round(item.wastePercentage * 100) / 100,
    ]);
    
    // Create and download the CSV file
    const csv = [headers.join(','), ...csvContent.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `waste-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: "The waste report has been exported as a CSV file.",
    });
  };
  
  // Function to export data as PDF
  const exportPDF = () => {
    if (!wasteByTimeframe) {
      toast({
        title: "No data to export",
        description: "There is no waste data available for the selected period.",
        variant: "destructive",
      });
      return;
    }
    
    // Format data for PDF
    const data = wasteByTimeframe.map(item => [
      format(new Date(item.date), 'yyyy-MM-dd'),
      `JO-${item.jobOrderId}`,
      item.customerName,
      `Roll-${item.rollId}`,
      item.rollNumber,
      `${Math.round(item.extrudingQty * 100) / 100} kg`,
      item.printingQty ? `${Math.round(item.printingQty * 100) / 100} kg` : '-',
      item.cuttingQty ? `${Math.round(item.cuttingQty * 100) / 100} kg` : '-',
      item.operator,
      item.section,
      `${Math.round(item.wasteKg * 100) / 100} kg`,
      `${Math.round(item.wastePercentage * 100) / 100}%`,
    ]);
    
    // Generate PDF
    generatePdf({
      title: "Production Waste Report",
      subtitle: `From ${dateRange?.from ? format(dateRange.from, 'MMM dd, yyyy') : ''} to ${dateRange?.to ? format(dateRange.to, 'MMM dd, yyyy') : ''}`,
      filterInfo: `Total waste: ${stats.totalWaste} kg (${stats.averageWastePercentage}%)`,
      dateRange: `Generated on: ${format(new Date(), 'MMM dd, yyyy')}`,
      columns: ["Date", "Job Order", "Customer", "Roll ID", "Roll #", "Extruding", "Printing", "Cutting", "Operator", "Section", "Waste (kg)", "Waste (%)"],
      data,
      orientation: 'landscape',
    });
    
    toast({
      title: "Export successful",
      description: "The waste report has been exported as a PDF file.",
    });
  };
  
  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading waste data...</span>
      </div>
    );
  }
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeIn}
      className="container mx-auto py-6 space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Waste Monitoring</h1>
          <p className="text-muted-foreground">
            Track and analyze production waste metrics
          </p>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            className="flex items-center"
            onClick={exportCSV}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center"
            onClick={exportPDF}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>
      
      {/* Date range selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <div className="mt-1">
                <DatePickerWithRange 
                  id="date-range"
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Total Waste</span>
                <span className="text-2xl font-semibold">{stats.totalWaste} kg</span>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Average Waste</span>
                <span className="text-2xl font-semibold">{stats.averageWastePercentage}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={slideFromBottom} custom={0}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Production Overview</CardTitle>
              <CardDescription>Summary of production and waste</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-muted-foreground">Total Production</dt>
                  <dd className="text-2xl font-bold mt-1">{stats.totalProduction} kg</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Total Waste</dt>
                  <dd className="text-2xl font-bold mt-1">{stats.totalWaste} kg</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Rolls Count</dt>
                  <dd className="text-2xl font-bold mt-1">{stats.rollsCount}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Avg Waste %</dt>
                  <dd className="text-2xl font-bold mt-1">{stats.averageWastePercentage}%</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={slideFromBottom} custom={1}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Highest Waste</CardTitle>
              <CardDescription>Highest waste percentage recorded</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{stats.highestWaste.value}%</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.highestWaste.customerName || 'No data'}
                  </p>
                </div>
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Percent className="h-8 w-8 text-red-500" />
                </div>
              </div>
              {stats.highestWaste.date && (
                <p className="text-xs text-muted-foreground mt-4">
                  Recorded on {format(new Date(stats.highestWaste.date), 'MMM dd, yyyy')}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={slideFromBottom} custom={2}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Lowest Waste</CardTitle>
              <CardDescription>Lowest waste percentage recorded</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{stats.lowestWaste.value}%</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.lowestWaste.customerName || 'No data'}
                  </p>
                </div>
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Percent className="h-8 w-8 text-green-500" />
                </div>
              </div>
              {stats.lowestWaste.date && (
                <p className="text-xs text-muted-foreground mt-4">
                  Recorded on {format(new Date(stats.lowestWaste.date), 'MMM dd, yyyy')}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="by-user">
            <UserCircle2 className="h-4 w-4 mr-2" />
            By User
          </TabsTrigger>
          <TabsTrigger value="by-section">
            <Laptop2 className="h-4 w-4 mr-2" />
            By Section
          </TabsTrigger>
          <TabsTrigger value="by-customer">
            <PieChart className="h-4 w-4 mr-2" />
            By Customer
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Waste Over Time</CardTitle>
                <CardDescription>
                  Total waste in kg over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart
                      data={timeframeChartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="waste" name="Waste (kg)" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="percentage" name="Waste (%)" fill="#82ca9d" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Waste by Customer</CardTitle>
                <CardDescription>
                  Distribution of waste across different customers
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={customerChartData.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="waste"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {customerChartData.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} kg`} />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="by-user" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Waste by User</CardTitle>
              <CardDescription>
                Comparison of waste production by different users
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart
                    data={userChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="waste" name="Total Waste (kg)" fill="#8884d8" />
                    <Bar dataKey="percentage" name="Avg Waste (%)" fill="#82ca9d" />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="by-section" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Waste by Section</CardTitle>
              <CardDescription>
                Comparison of waste production by different production sections
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart
                    data={sectionChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="waste" name="Total Waste (kg)" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="percentage" name="Avg Waste (%)" fill="#82ca9d" />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="by-customer" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Customer Waste Comparison</CardTitle>
                <CardDescription>
                  Detailed comparison of waste across customers
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart
                      data={customerChartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 100,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="waste" name="Total Waste (kg)" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="percentage" name="Avg Waste (%)" fill="#82ca9d" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle>Waste Data Records</CardTitle>
          <CardDescription>
            Showing data for {dateRange?.from ? format(dateRange.from, 'MMM dd, yyyy') : ''} to {dateRange?.to ? format(dateRange.to, 'MMM dd, yyyy') : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] caption-bottom text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-2 text-left font-medium">Date</th>
                    <th className="h-10 px-2 text-left font-medium">Job Order</th>
                    <th className="h-10 px-2 text-left font-medium">Customer</th>
                    <th className="h-10 px-2 text-left font-medium">Roll #</th>
                    <th className="h-10 px-2 text-left font-medium">Extruding</th>
                    <th className="h-10 px-2 text-left font-medium">Cutting</th>
                    <th className="h-10 px-2 text-left font-medium">Waste</th>
                    <th className="h-10 px-2 text-left font-medium">Waste %</th>
                    <th className="h-10 px-2 text-left font-medium">Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {wasteByTimeframe && wasteByTimeframe.length > 0 ? (
                    wasteByTimeframe.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-2 align-middle font-medium">
                          {format(new Date(item.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="p-2 align-middle">JO-{item.jobOrderId}</td>
                        <td className="p-2 align-middle">{item.customerName}</td>
                        <td className="p-2 align-middle">{item.rollNumber}</td>
                        <td className="p-2 align-middle">{Math.round(item.extrudingQty * 100) / 100} kg</td>
                        <td className="p-2 align-middle">
                          {item.cuttingQty ? `${Math.round(item.cuttingQty * 100) / 100} kg` : '—'}
                        </td>
                        <td className="p-2 align-middle">{Math.round(item.wasteKg * 100) / 100} kg</td>
                        <td className="p-2 align-middle">
                          <span className={item.wastePercentage > 10 ? 'text-red-500 font-medium' : 'text-green-500 font-medium'}>
                            {Math.round(item.wastePercentage * 100) / 100}%
                          </span>
                        </td>
                        <td className="p-2 align-middle">{item.operator}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="h-24 text-center">
                        No waste data available for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {wasteByTimeframe && wasteByTimeframe.length > 10 && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={exportPDF}>
                View All Records
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}