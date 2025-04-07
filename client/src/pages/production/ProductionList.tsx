import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  BarChart3, 
  PieChart, 
  FileUp, 
  FileDown, 
  Printer, 
  PackageOpen, 
  Scissors, 
  ArrowRight, 
  ChevronRight,
  CircleAlert,
  Clock,
  CheckCircle2,
  ListFilter,
  Package
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { fadeIn } from "@/utils/animations";
import { format } from "date-fns";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Define interfaces based on schema
interface Roll {
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
}

interface JobOrder {
  id: number;
  order_id: number;
  customer_id: number;
  category_id: number;
  sub_category_id: number;
  item_id: number;
  quantity: number;
  status: string;
  size_details?: string | null;
  thickness?: number | null;
  cylinder_inch?: number | null;
  cutting_length_cm?: number | null;
  raw_material?: string | null;
  mast_batch?: string | null;
  is_printed: boolean;
  cutting_unit?: string | null;
  unit_weight_kg?: number | null;
  packing?: string | null;
  punching?: string | null;
  cover?: string | null;
  notes?: string | null;
}

interface Customer {
  id: number;
  name: string;
  arabic_name?: string | null;
  drawer_no?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  salesperson_id?: number | null;
  photo_url?: string | null;
}

export default function ProductionDashboard() {
  const { toast } = useToast();
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'thisWeek' | 'thisMonth'>('all');
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch rolls
  const { data: rolls, isLoading: isLoadingRolls } = useQuery<Roll[]>({
    queryKey: ['/api/rolls'],
  });
  
  // Fetch job orders for lookup
  const { data: jobOrders, isLoading: isLoadingJobOrders } = useQuery<JobOrder[]>({
    queryKey: ['/api/job-orders'],
  });
  
  // Fetch customers for lookup
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });
  
  // Loading state
  const isLoading = isLoadingRolls || isLoadingJobOrders || isLoadingCustomers;
  
  // Roll statistics
  const [stats, setStats] = useState({
    totalRolls: 0,
    forPrinting: 0,
    forCutting: 0,
    readyForDelivery: 0,
    onHold: 0,
    productionProgress: 0,
    recentRolls: [] as Roll[],
    customerBreakdown: [] as {name: string, value: number, color: string}[],
    statusDistribution: [] as {name: string, value: number, color: string}[],
    dailyProduction: [] as {date: string, count: number}[]
  });
  
  // Process and calculate statistics when rolls data is available
  useEffect(() => {
    if (rolls && rolls.length > 0) {
      // Filter rolls based on date filter
      let filteredRolls = [...rolls];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      if (dateFilter === 'today') {
        filteredRolls = filteredRolls.filter((roll: Roll) => new Date(roll.created_date) >= today);
      } else if (dateFilter === 'thisWeek') {
        filteredRolls = filteredRolls.filter((roll: Roll) => new Date(roll.created_date) >= startOfWeek);
      } else if (dateFilter === 'thisMonth') {
        filteredRolls = filteredRolls.filter((roll: Roll) => new Date(roll.created_date) >= startOfMonth);
      }
      
      // Count rolls by status
      const forPrinting = filteredRolls.filter((roll: Roll) => roll.status === 'For Printing').length;
      const forCutting = filteredRolls.filter((roll: Roll) => roll.status === 'For Cutting').length;
      const forDelivery = filteredRolls.filter((roll: Roll) => 
        roll.status === 'For Delivery' || 
        roll.status === 'For Receiving'
      ).length;
      const damaged = filteredRolls.filter((roll: Roll) => roll.status === 'Damage').length;
      
      // Debug - log all different status values
      const uniqueStatusSet = new Set<string>();
      filteredRolls.forEach(roll => uniqueStatusSet.add(roll.status));
      const uniqueStatuses = Array.from(uniqueStatusSet);
      console.log("Unique roll statuses found:", uniqueStatuses);
      console.log("For Receiving count:", forDelivery);
      
      // Calculate production progress percentage
      const totalSteps = filteredRolls.length * 3; // 3 steps in production: Extruding, Printing, Cutting
      let completedSteps = 0;
      
      filteredRolls.forEach((roll: Roll) => {
        if (roll.extruding_qty) completedSteps++;
        if (roll.printing_qty) completedSteps++;
        if (roll.cutting_qty) completedSteps++;
      });
      
      const productionProgress = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;
      
      // Get recent rolls (last 5)
      const recentRolls = [...filteredRolls]
        .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
        .slice(0, 5);
      
      // Customer breakdown
      const customerCounts: Record<string, number> = {};
      
      filteredRolls.forEach((roll: Roll) => {
        const jobOrder = jobOrders?.find((jo: JobOrder) => jo.id === roll.job_order_id);
        if (jobOrder) {
          const customer = customers?.find((c: Customer) => c.id === jobOrder.customer_id);
          const customerName = customer?.name || 'Unknown';
          customerCounts[customerName] = (customerCounts[customerName] || 0) + 1;
        }
      });
      
      const customerBreakdown = Object.entries(customerCounts)
        .map(([name, value], index) => ({
          name,
          value,
          color: getChartColor(index)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6); // Top 6 customers
      
      // Status distribution
      const statusDistribution = [
        { name: 'For Printing', value: forPrinting, color: '#3b82f6' },
        { name: 'For Cutting', value: forCutting, color: '#8b5cf6' },
        { name: 'For Receiving', value: forDelivery, color: '#22c55e' },
        { name: 'Damage', value: damaged, color: '#ef4444' }
      ];
      
      // Daily production counts (last 7 days)
      const dailyProduction: Record<string, number> = {};
      const last7Days: Date[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        last7Days.push(date);
        dailyProduction[format(date, 'MMM dd')] = 0;
      }
      
      filteredRolls.forEach((roll: Roll) => {
        const rollDate = new Date(roll.created_date);
        rollDate.setHours(0, 0, 0, 0);
        
        for (const date of last7Days) {
          if (rollDate.getTime() === date.getTime()) {
            const dateKey = format(date, 'MMM dd');
            dailyProduction[dateKey]++;
            break;
          }
        }
      });
      
      const dailyProductionData = Object.entries(dailyProduction).map(([date, count]) => ({
        date,
        count
      }));
      
      // Update stats
      setStats({
        totalRolls: filteredRolls.length,
        forPrinting,
        forCutting,
        readyForDelivery: forDelivery,
        onHold: damaged,
        productionProgress,
        recentRolls,
        customerBreakdown,
        statusDistribution,
        dailyProduction: dailyProductionData
      });
    }
  }, [rolls, customers, jobOrders, dateFilter]);
  
  // Get customer name for a job order
  const getCustomerName = (jobOrderId: number) => {
    const jobOrder = jobOrders?.find((jo: JobOrder) => jo.id === jobOrderId);
    if (!jobOrder) return "Unknown";
    
    const customer = customers?.find((c: Customer) => c.id === jobOrder.customer_id);
    return customer ? customer.name : "Unknown";
  };
  
  // Get chart colors
  const getChartColor = (index: number) => {
    const colors = [
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#22c55e', // green
      '#f97316', // orange
      '#ef4444', // red
      '#06b6d4', // cyan
      '#f59e0b', // amber
      '#ec4899', // pink
    ];
    
    return colors[index % colors.length];
  };
  
  // Get appropriate icon by status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'For Printing':
        return <Printer className="h-5 w-5 text-blue-500" />;
      case 'For Cutting':
        return <Scissors className="h-5 w-5 text-purple-500" />;
      case 'For Delivery':
      case 'For Receiving':
        return <PackageOpen className="h-5 w-5 text-green-500" />;
      case 'Damage':
        return <CircleAlert className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={fadeIn}
      className="space-y-6"
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Dashboard</h1>
          <p className="text-slate-600">Roll production statistics and monitoring</p>
        </div>
        
        <div className="flex space-x-2">
          <Select 
            defaultValue="all" 
            onValueChange={(value) => setDateFilter(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Link href="/production/rolls">
            <Button variant="outline">
              <ListFilter className="h-4 w-4 mr-2" />
              View All Rolls
            </Button>
          </Link>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Loading production data...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Rolls Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Rolls</CardTitle>
                  <Package className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRolls}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total rolls in the system
                  </p>
                </CardContent>
              </Card>
              
              {/* Rolls For Printing Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">For Printing</CardTitle>
                  <Printer className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.forPrinting}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rolls waiting to be printed
                  </p>
                </CardContent>
              </Card>
              
              {/* Rolls For Cutting Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">For Cutting</CardTitle>
                  <Scissors className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.forCutting}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rolls waiting to be cut
                  </p>
                </CardContent>
              </Card>
              
              {/* For Receiving Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">For Receiving</CardTitle>
                  <PackageOpen className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.readyForDelivery}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rolls ready for receiving
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Production Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Production Progress</CardTitle>
                  <CardDescription>Overall completion status of rolls in production</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-slate-500" />
                        <div>In Progress</div>
                      </div>
                      <div>{stats.productionProgress}% Complete</div>
                    </div>
                    
                    <Progress value={stats.productionProgress} className="h-2" />
                    
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                        <div className="text-xs text-slate-500">Extruding</div>
                        <div className="font-semibold mt-1">
                          {rolls?.filter((r: Roll) => r.extruding_qty !== null).length || 0}
                        </div>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                        <div className="text-xs text-slate-500">Printing</div>
                        <div className="font-semibold mt-1">
                          {rolls?.filter((r: Roll) => r.printing_qty !== null).length || 0}
                        </div>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-slate-50 rounded-md">
                        <div className="text-xs text-slate-500">Cutting</div>
                        <div className="font-semibold mt-1">
                          {rolls?.filter((r: Roll) => r.cutting_qty !== null).length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 pb-0 px-6">
                  <Link href="/production/rolls" className="text-sm text-blue-600 hover:underline w-full flex justify-between items-center">
                    View details
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </CardFooter>
              </Card>
              
              {/* Status Distribution Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>Roll distribution by current status</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-[220px] flex items-center justify-center">
                    {stats.statusDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={stats.statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {stats.statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-slate-500">No data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Daily Production Chart */}
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Daily Production</CardTitle>
                  <CardDescription>Number of rolls created in the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {stats.dailyProduction.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stats.dailyProduction}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" name="Rolls Created" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        No data available for the selected period
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Customer Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Distribution</CardTitle>
                  <CardDescription>Rolls by customer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {stats.customerBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={stats.customerBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {stats.customerBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        No customer data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Production Workflow */}
              <Card>
                <CardHeader>
                  <CardTitle>Production Workflow</CardTitle>
                  <CardDescription>Status transitions of rolls in production</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-4 py-4">
                    <div className="flex items-center w-full max-w-md">
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-blue-100 p-3">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="text-sm font-medium mt-2">Extruding</div>
                        <div className="text-xs text-slate-500">
                          {rolls?.filter((r: Roll) => r.status === 'For Printing').length || 0} rolls
                        </div>
                      </div>
                      
                      <ArrowRight className="mx-2 text-slate-400" />
                      
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-purple-100 p-3">
                          <Printer className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="text-sm font-medium mt-2">Printing</div>
                        <div className="text-xs text-slate-500">
                          {rolls?.filter((r: Roll) => r.status === 'For Cutting').length || 0} rolls
                        </div>
                      </div>
                      
                      <ArrowRight className="mx-2 text-slate-400" />
                      
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-green-100 p-3">
                          <Scissors className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="text-sm font-medium mt-2">Cutting</div>
                        <div className="text-xs text-slate-500">
                          {rolls?.filter((r: Roll) => r.status === 'For Cutting').length || 0} rolls
                        </div>
                      </div>
                      
                      <ArrowRight className="mx-2 text-slate-400" />
                      
                      <div className="flex flex-col items-center">
                        <div className="rounded-full bg-emerald-100 p-3">
                          <PackageOpen className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="text-sm font-medium mt-2">Receiving</div>
                        <div className="text-xs text-slate-500">
                          {rolls?.filter((r: Roll) => r.status === 'For Delivery' || r.status === 'For Receiving').length || 0} rolls
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="grid grid-cols-3 gap-4 w-full">
                      <div className="flex flex-col items-center p-3 bg-slate-50 rounded-md">
                        <div className="text-lg font-bold">
                          {rolls?.filter((r: Roll) => r.extruding_qty !== null).length || 0}
                        </div>
                        <div className="text-xs text-slate-500">Extruded</div>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-slate-50 rounded-md">
                        <div className="text-lg font-bold">
                          {rolls?.filter((r: Roll) => r.printing_qty !== null).length || 0}
                        </div>
                        <div className="text-xs text-slate-500">Printed</div>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-slate-50 rounded-md">
                        <div className="text-lg font-bold">
                          {rolls?.filter((r: Roll) => r.cutting_qty !== null).length || 0}
                        </div>
                        <div className="text-xs text-slate-500">Cut</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="recent" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Rolls</CardTitle>
                <CardDescription>Latest production rolls added to the system</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentRolls.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentRolls.map((roll) => (
                      <div key={roll.id} className="flex items-start space-x-4 p-3 bg-slate-50 rounded-lg">
                        <div className="p-2 rounded-full bg-white">
                          {getStatusIcon(roll.status)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Roll #{roll.roll_number}</div>
                            <Badge variant="outline">
                              {roll.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-500">
                            {getCustomerName(roll.job_order_id)}
                          </div>
                          <div className="flex items-center text-xs text-slate-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(roll.created_date), "PPp")}
                          </div>
                        </div>
                        <Link href={`/production/rolls/${roll.id}`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    No recent roll activity found
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="text-sm text-slate-500">
                  Showing {stats.recentRolls.length} of {stats.totalRolls} rolls
                </div>
                <Link href="/production/rolls">
                  <Button variant="outline" size="sm">
                    View All Rolls
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}
