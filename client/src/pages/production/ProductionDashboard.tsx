import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  AlertTriangle, 
  Check, 
  Clock, 
  Factory, 
  RotateCcw, 
  PackageCheck,
  PackageX,
  Printer,
  Scissors,
  TrendingUp,
  Award,
  RefreshCw,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { t, useLanguage } from "../../utils/language";

// Type definitions for our data
interface Machine {
  id: number;
  identification: string;
  section: string;
  code: string;
  production_date: string;
  serial_number?: string;
  manufacturer_code?: string;
  manufacturer_name?: string;
  status?: 'active' | 'maintenance' | 'offline';
}

interface Production {
  id: number;
  order_id: number;
  job_order_id: number;
  customer_id: number;
  product_id: number;
  production_qty: number;
  operator_id: number;
  roll_no?: number;
  section?: string;
  notes?: string;
  production_date: string;
  status: string;
}

interface Roll {
  id: number;
  roll_identification: string;
  job_order_id: number;
  roll_number: number;
  extruding_qty?: number;
  printing_qty?: number;
  cutting_qty?: number;
  created_date: string;
  created_by?: number;
  extruded_by?: number;
  printed_by?: number;
  cut_by?: number;
  extruded_date?: string;
  printed_date?: string;
  cut_date?: string;
  status: string;
  notes?: string;
}

interface JobOrder {
  id: number;
  order_id: number;
  item_id: number;
  customer_id: number;
  category_id: number;
  sub_category_id: number;
  quantity: number;
  produced_quantity: number;
  waste_quantity: number;
  production_status: string;
  status: string;
}

interface ProductionData {
  machines: Machine[];
  productions: Production[];
  rolls: Roll[];
  jobOrders: JobOrder[];
  lastUpdated: string;
}

// Helper function to calculate completion percentage
const calculateProgress = (produced: number, total: number): number => {
  if (total <= 0) return 0;
  const percentage = (produced / total) * 100;
  return Math.min(percentage, 100);
};

// Helper to format date/time
const formatDateTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  } catch (e) {
    return 'Invalid date';
  }
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'for receiving':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'maintenance':
      case 'for cutting':
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'for printing':
      case 'pending':
      case 'not started':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'offline':
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Badge className={cn("capitalize", getStatusColor())}>
      {status}
    </Badge>
  );
};

// Machine card component
const MachineCard = ({ machine }: { machine: Machine }) => {
  // Determine icon based on section
  const getMachineIcon = (section: string) => {
    switch (section.toLowerCase()) {
      case 'extrusion':
        return <Factory className="h-6 w-6" />;
      case 'printing':
        return <Printer className="h-6 w-6" />;
      case 'cutting':
        return <Scissors className="h-6 w-6" />;
      default:
        return <Factory className="h-6 w-6" />;
    }
  };

  // Machine status (we're assuming it's active if not specified)
  const status = machine.status || 'active';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <Card className={cn(
        "cursor-pointer hover:shadow-md transition-all",
        status === 'offline' && "border-red-300",
        status === 'maintenance' && "border-yellow-300"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getMachineIcon(machine.section)}
              <CardTitle className="text-lg">{machine.identification}</CardTitle>
            </div>
            <StatusBadge status={status} />
          </div>
          <CardDescription>{machine.code} - {machine.section}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Serial Number:</div>
            <div>{machine.serial_number || 'N/A'}</div>
            <div className="text-muted-foreground">Manufacturer:</div>
            <div>{machine.manufacturer_name || 'N/A'}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Production Order Card
const ProductionOrderCard = ({ jobOrder }: { jobOrder: JobOrder }) => {
  const progress = calculateProgress(jobOrder.produced_quantity, jobOrder.quantity);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <Card className="hover:shadow-md transition-all">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Order #{jobOrder.order_id}</CardTitle>
            <StatusBadge status={jobOrder.production_status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Quantity:</div>
            <div>{jobOrder.quantity}</div>
            <div className="text-muted-foreground">Produced:</div>
            <div>{jobOrder.produced_quantity}</div>
            <div className="text-muted-foreground">Waste:</div>
            <div>{jobOrder.waste_quantity} ({(jobOrder.waste_quantity / (jobOrder.produced_quantity || 1) * 100).toFixed(2)}%)</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Roll Card
const RollCard = ({ roll }: { roll: Roll }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <Card className="hover:shadow-md transition-all">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Roll #{roll.roll_number}</CardTitle>
            <StatusBadge status={roll.status} />
          </div>
          <CardDescription className="text-xs">{roll.roll_identification}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {roll.extruding_qty && (
              <>
                <div className="text-muted-foreground">Extruding Qty:</div>
                <div>{roll.extruding_qty}</div>
              </>
            )}
            {roll.printing_qty && (
              <>
                <div className="text-muted-foreground">Printing Qty:</div>
                <div>{roll.printing_qty}</div>
              </>
            )}
            {roll.cutting_qty && (
              <>
                <div className="text-muted-foreground">Cutting Qty:</div>
                <div>{roll.cutting_qty}</div>
              </>
            )}
            
            {roll.extruded_date && (
              <>
                <div className="text-muted-foreground">Extruded Date:</div>
                <div>{formatDateTime(roll.extruded_date)}</div>
              </>
            )}
            {roll.printed_date && (
              <>
                <div className="text-muted-foreground">Printed Date:</div>
                <div>{formatDateTime(roll.printed_date)}</div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Production Dashboard Component
export default function ProductionDashboard() {
  const [data, setData] = useState<ProductionData | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { language, isRtl } = useLanguage(); // Ensure useLanguage is always called

  // Initialize WebSocket connection
  useEffect(() => {
    // Function to fetch data via REST API (used as fallback)
    const fetchDataFromRestAPI = () => {
      console.log('Falling back to REST API for production data');
      setLoading(true);
      
      Promise.all([
        fetch('/api/machines').then(res => res.json()),
        fetch('/api/productions').then(res => res.json()),
        fetch('/api/rolls').then(res => res.json()),
        fetch('/api/job-orders').then(res => res.json())
      ])
      .then(([machines, productions, rolls, jobOrders]) => {
        console.log('Data loaded via REST API');
        
        setData({
          machines,
          productions,
          rolls,
          jobOrders,
          lastUpdated: new Date().toISOString()
        });
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data via REST API:', error);
        toast({
          title: "Data Fetch Error",
          description: "Unable to load production data. Please try again later.",
          variant: "destructive"
        });
        setLoading(false);
      });
    };
    
    // Connect to WebSocket
    let webSocket: WebSocket | null = null;
    let connectionTimeout: NodeJS.Timeout | null = null;
    
    try {
      // Use the current window location to determine the appropriate WebSocket URL
      const host = window.location.host;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      
      // Check if we're in a Replit environment
      const isReplitEnv = host.includes('replit.app') || host.includes('replit.dev');
      
      // Create WebSocket connection - use a special path for Replit environment
      const wsUrl = `${protocol}//${host}/ws`;
      
      console.log('Attempting WebSocket connection to:', wsUrl);
      console.log('Host:', host, 'Protocol:', protocol, 'Is Replit:', isReplitEnv);
      
      webSocket = new WebSocket(wsUrl);
      
      // Add a timeout to handle failed connections
      connectionTimeout = setTimeout(() => {
        console.log('WebSocket connection timeout');
        if (webSocket && webSocket.readyState !== WebSocket.OPEN) {
          webSocket.close();
          fetchDataFromRestAPI();
        }
      }, 5000);
      
      webSocket.onopen = () => {
        console.log('WebSocket connected successfully');
        if (connectionTimeout) clearTimeout(connectionTimeout);
        setConnected(true);
        setSocket(webSocket);
      };
      
      webSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'initial-data' || message.type === 'production-update') {
            setData(message.data);
            setLoading(false);
            setRefreshing(false);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      webSocket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        setSocket(null);
      };
      
      webSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Unable to connect to the production data service. Falling back to REST API.",
          variant: "destructive"
        });
        // Fallback to REST API on WebSocket error
        fetchDataFromRestAPI();
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      fetchDataFromRestAPI();
    }
    
    // Clean up function
    return () => {
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (webSocket && webSocket.readyState !== WebSocket.CLOSED) {
        webSocket.close();
      }
    };
  }, [toast, language, isRtl]);

  // Handle refresh button click
  const handleRefresh = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      setRefreshing(true);
      socket.send(JSON.stringify({ type: 'request-update' }));
      
      // Add a timeout to stop refreshing indicator if no response
      setTimeout(() => {
        setRefreshing(false);
      }, 5000);
    } else {
      toast({
        title: "Connection Error",
        description: "Not connected to the production data service. Please reload the page.",
        variant: "destructive"
      });
    }
  };

  // Get machines by section
  const getMachinesBySection = (section: string) => {
    return data?.machines.filter(machine => 
      machine.section.toLowerCase() === section.toLowerCase()
    ) || [];
  };

  // Get production orders by status
  const getOrdersByStatus = (status: string) => {
    return data?.jobOrders.filter(order => 
      order.production_status.toLowerCase() === status.toLowerCase()
    ) || [];
  };

  // Get rolls by status
  const getRollsByStatus = (status: string) => {
    return data?.rolls.filter(roll => 
      roll.status.toLowerCase() === status.toLowerCase()
    ) || [];
  };

  // Dashboard stats
  const getStats = () => {
    if (!data) return {
      totalMachines: 0,
      activeMachines: 0,
      totalOrders: 0,
      inProgressOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      totalRolls: 0
    };

    const jobOrders = data.jobOrders;
    
    return {
      totalMachines: data.machines.length,
      activeMachines: data.machines.filter(m => m.status !== 'offline' && m.status !== 'maintenance').length,
      totalOrders: jobOrders.length,
      inProgressOrders: jobOrders.filter(o => o.production_status.toLowerCase() === 'in progress').length,
      completedOrders: jobOrders.filter(o => o.production_status.toLowerCase() === 'completed').length,
      pendingOrders: jobOrders.filter(o => 
        o.production_status.toLowerCase() === 'not started' || 
        o.production_status.toLowerCase() === 'pending'
      ).length,
      totalRolls: data.rolls.length
    };
  };

  const stats = getStats();

  // Helper for empty state
  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-8">
      <PackageX className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-20" />
      <h3 className="text-lg font-semibold">{t('noDataFound')}</h3>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
    </div>
  );

  // Main render
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4 space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('productionDashboard')}</h1>
          <p className="text-muted-foreground">
            {t('realTimeStatus')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <Badge className="bg-green-100 text-green-800">
              <Check className="h-3 w-3 mr-1" /> {t('connected')}
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              <AlertTriangle className="h-3 w-3 mr-1" /> {t('disconnected')}
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing || !connected}
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('refreshing')}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('refresh')}
              </>
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">{t('loadingProduction')}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{t('totalMachines')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">
                    {stats.activeMachines}/{stats.totalMachines}
                  </div>
                  <Factory className="h-8 w-8 text-muted-foreground opacity-80" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeMachines} {t('activeMachines')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Production Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">{stats.totalOrders}</div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground opacity-80" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.inProgressOrders} in progress, {stats.pendingOrders} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">
                    {stats.totalOrders ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
                  </div>
                  <Award className="h-8 w-8 text-muted-foreground opacity-80" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completedOrders} completed orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Active Rolls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">{stats.totalRolls}</div>
                  <RotateCcw className="h-8 w-8 text-muted-foreground opacity-80" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total rolls in production
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Last updated info */}
          {data?.lastUpdated && (
            <div className="text-xs text-right text-muted-foreground">
              Last updated: {formatDateTime(data.lastUpdated)}
            </div>
          )}

          {/* Main content tabs */}
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="machines">Machines</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>
            
            {/* Overview tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Quick status indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Extrusion status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Factory className="h-5 w-5 mr-2" />
                      Extrusion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getMachinesBySection('Extrusion').length > 0 ? (
                        getMachinesBySection('Extrusion').map(machine => (
                          <div key={machine.id} className="flex justify-between items-center py-2 border-b">
                            <div>
                              <div className="font-medium">{machine.identification}</div>
                              <div className="text-sm text-muted-foreground">{machine.code}</div>
                            </div>
                            <StatusBadge status={machine.status || 'active'} />
                          </div>
                        ))
                      ) : (
                        <EmptyState message="No extrusion machines found" />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Printing status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Printer className="h-5 w-5 mr-2" />
                      Printing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getMachinesBySection('Printing').length > 0 ? (
                        getMachinesBySection('Printing').map(machine => (
                          <div key={machine.id} className="flex justify-between items-center py-2 border-b">
                            <div>
                              <div className="font-medium">{machine.identification}</div>
                              <div className="text-sm text-muted-foreground">{machine.code}</div>
                            </div>
                            <StatusBadge status={machine.status || 'active'} />
                          </div>
                        ))
                      ) : (
                        <EmptyState message="No printing machines found" />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Cutting status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Scissors className="h-5 w-5 mr-2" />
                      Cutting
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getMachinesBySection('Cutting').length > 0 ? (
                        getMachinesBySection('Cutting').map(machine => (
                          <div key={machine.id} className="flex justify-between items-center py-2 border-b">
                            <div>
                              <div className="font-medium">{machine.identification}</div>
                              <div className="text-sm text-muted-foreground">{machine.code}</div>
                            </div>
                            <StatusBadge status={machine.status || 'active'} />
                          </div>
                        ))
                      ) : (
                        <EmptyState message="No cutting machines found" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Latest production orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <PackageCheck className="h-5 w-5 mr-2" />
                    Latest Production Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data?.jobOrders && data.jobOrders.length > 0 ? (
                      data.jobOrders.slice(0, 5).map(order => (
                        <div key={order.id} className="flex justify-between items-center py-2 border-b">
                          <div>
                            <div className="font-medium">Order #{order.order_id}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.produced_quantity}/{order.quantity} produced
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24">
                              <Progress 
                                value={calculateProgress(order.produced_quantity, order.quantity)} 
                                className="h-2" 
                              />
                            </div>
                            <StatusBadge status={order.production_status} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState message="No production orders found" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Machines tab */}
            <TabsContent value="machines" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.machines && data.machines.length > 0 ? (
                  data.machines.map(machine => (
                    <MachineCard key={machine.id} machine={machine} />
                  ))
                ) : (
                  <div className="col-span-3">
                    <EmptyState message="No machines found" />
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Orders tab */}
            <TabsContent value="orders" className="space-y-4">
              <Tabs defaultValue="in-progress">
                <TabsList>
                  <TabsTrigger value="in-progress">
                    <Clock className="h-4 w-4 mr-2" />
                    In Progress
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    <Check className="h-4 w-4 mr-2" />
                    Completed
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="rolls">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Rolls
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="in-progress" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getOrdersByStatus('In Progress').length > 0 ? (
                      getOrdersByStatus('In Progress').map(order => (
                        <ProductionOrderCard key={order.id} jobOrder={order} />
                      ))
                    ) : (
                      <div className="col-span-3">
                        <EmptyState message="No in-progress orders found" />
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="completed" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getOrdersByStatus('Completed').length > 0 ? (
                      getOrdersByStatus('Completed').map(order => (
                        <ProductionOrderCard key={order.id} jobOrder={order} />
                      ))
                    ) : (
                      <div className="col-span-3">
                        <EmptyState message="No completed orders found" />
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="pending" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getOrdersByStatus('Not Started').length > 0 ? (
                      getOrdersByStatus('Not Started').map(order => (
                        <ProductionOrderCard key={order.id} jobOrder={order} />
                      ))
                    ) : (
                      <div className="col-span-3">
                        <EmptyState message="No pending orders found" />
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="rolls" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data?.rolls && data.rolls.length > 0 ? (
                      data.rolls.slice(0, 12).map(roll => (
                        <RollCard key={roll.id} roll={roll} />
                      ))
                    ) : (
                      <div className="col-span-3">
                        <EmptyState message="No rolls found" />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>

          {/* Connection status indicator */}
          {!connected && (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connection Lost</AlertTitle>
              <AlertDescription>
                Connection to the production data service has been lost. Please wait while we try to reconnect, or refresh the page.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </motion.div>
  );
}