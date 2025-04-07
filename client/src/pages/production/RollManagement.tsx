import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Printer, 
  Scissors, 
  RefreshCcw, 
  BarChart2,
  Factory,
  PackageCheck,
  Loader2,
  Eye,
  Edit,
  Boxes,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  Users,
  FileSpreadsheet,
  Tag,
  SlidersHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Avatar, 
  AvatarFallback 
} from "@/components/ui/avatar";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/utils/auth";
import { usePermissions } from "@/utils/permissions";
import { fadeIn, slideFromBottom } from "@/utils/animations";

// Define interfaces based on your schema
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
  created_by?: number | null;
  extruded_by?: number | null;
  printed_by?: number | null;
  cut_by?: number | null;
  extruded_date?: string | null;
  printed_date?: string | null;
  cut_date?: string | null;
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

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  mobile?: string | null;
  section?: string | null;
}

interface Item {
  id: number;
  pcid: string;
  category_id: number;
  sub_category_id: number;
  customer_id: number;
  notes?: string | null;
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
}

// Define an interface for the roll card data with calculated fields
interface RollCardData extends Roll {
  customer: Customer | null;
  jobOrder: JobOrder | null;
  item: Item | null;
  creator: User | null;
  extruder: User | null;
  printer: User | null;
  cutter: User | null;
  wastePercentage: number | null;
  daysSinceCreation: number;
  stage: 'extruding' | 'printing' | 'cutting' | 'completed' | 'none';
  // Progress of the roll through the production process (0-100%)
  progressPercentage: number;
}

// Interface for grouping rolls by customer
interface CustomerGroupedRolls {
  customerId: number;
  customerName: string;
  rollCount: number;
  activeRolls: number;
  completedRolls: number;
  rolls: RollCardData[];
}

// Interface for grouping rolls by job order
interface JobOrderGroupedRolls {
  jobOrderId: number;
  customerName: string | null;
  customerId: number | null;
  rollCount: number;
  totalWeight: number;
  rolls: RollCardData[];
}

// Function to determine the stage of a roll based on its status
function determineRollStage(roll: Roll): 'extruding' | 'printing' | 'cutting' | 'completed' | 'none' {
  if (!roll) return 'none';
  
  const status = roll.status.toLowerCase();
  
  if (status.includes('extrud') || status === 'for printing') {
    return 'extruding';
  } else if (status.includes('print') || status === 'for cutting') {
    return 'printing';
  } else if (status.includes('cut') || status === 'for receiving' || status === 'for delivery') {
    return 'cutting';
  } else if (status === 'completed' || status === 'received') {
    return 'completed';
  }
  
  return 'none';
}

// Function to calculate the progress percentage of a roll
function calculateProgressPercentage(roll: Roll): number {
  if (!roll) return 0;
  
  const stage = determineRollStage(roll);
  
  switch (stage) {
    case 'extruding':
      return roll.extruding_qty ? 25 : 0;
    case 'printing':
      return roll.printing_qty ? 50 : 25;
    case 'cutting':
      return roll.cutting_qty ? 75 : 50;
    case 'completed':
      return 100;
    default:
      return 0;
  }
}

// Custom component for status badge with appropriate colors
function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let className = "";
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('extrud') || statusLower === 'for printing') {
    className = "bg-blue-500 text-white hover:bg-blue-600";
  } else if (statusLower.includes('print') || statusLower === 'for cutting') {
    className = "bg-purple-500 text-white hover:bg-purple-600";
  } else if (statusLower.includes('cut') || statusLower === 'for receiving' || statusLower === 'for delivery') {
    className = "bg-green-500 text-white hover:bg-green-600";
  } else if (statusLower === 'completed' || statusLower === 'received') {
    className = "bg-teal-500 text-white hover:bg-teal-600";
  } else if (statusLower.includes('damage') || statusLower.includes('issue') || statusLower.includes('reject')) {
    variant = "destructive";
  }
  
  return <Badge variant={variant} className={className}>{status}</Badge>;
}

// Custom component for stage icon
function StageIcon({ stage }: { stage: 'extruding' | 'printing' | 'cutting' | 'completed' | 'none' }) {
  switch (stage) {
    case 'extruding':
      return <Factory className="h-5 w-5 text-blue-500" />;
    case 'printing':
      return <Printer className="h-5 w-5 text-purple-500" />;
    case 'cutting':
      return <Scissors className="h-5 w-5 text-green-500" />;
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-teal-500" />;
    default:
      return <Package className="h-5 w-5 text-gray-500" />;
  }
}

// Main component
export default function RollManagement() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { isAdmin, hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  
  // State for active view
  const [activeView, setActiveView] = useState<string>("customer");
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // State for filter options
  const [filterCustomer, setFilterCustomer] = useState<string>("all");
  const [filterJobOrder, setFilterJobOrder] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Query for all rolls
  const { data: rolls, isLoading: isLoadingRolls } = useQuery({
    queryKey: ['/api/rolls'],
    queryFn: () => apiRequest<Roll[]>('GET', '/api/rolls'),
  });
  
  // Query for job orders
  const { data: jobOrders, isLoading: isLoadingJobOrders } = useQuery({
    queryKey: ['/api/job-orders'],
    queryFn: () => apiRequest<JobOrder[]>('GET', '/api/job-orders'),
  });
  
  // Query for customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => apiRequest<Customer[]>('GET', '/api/customers'),
  });
  
  // Query for items
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/items'],
    queryFn: () => apiRequest<Item[]>('GET', '/api/items'),
  });
  
  // Query for users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest<User[]>('GET', '/api/users'),
  });
  
  // Loading state
  const isLoading = isLoadingRolls || isLoadingJobOrders || isLoadingCustomers || 
                    isLoadingItems || isLoadingUsers;
  
  // Helper functions
  const getJobOrderDetails = (jobOrderId: number): JobOrder | null => {
    if (!jobOrders) return null;
    return jobOrders.find(jo => jo.id === jobOrderId) || null;
  };
  
  const getCustomerDetails = (customerId: number): Customer | null => {
    if (!customers) return null;
    return customers.find(c => c.id === customerId) || null;
  };
  
  const getItemDetails = (itemId: number): Item | null => {
    if (!items) return null;
    return items.find(i => i.id === itemId) || null;
  };
  
  const getUserDetails = (userId: number | null | undefined): User | null => {
    if (!userId || !users) return null;
    return users.find(u => u.id === userId) || null;
  };
  
  // Prepare roll data with additional calculated fields
  const rollsData: RollCardData[] = useMemo(() => {
    if (!rolls) return [];
    
    return rolls.map(roll => {
      const jobOrder = getJobOrderDetails(roll.job_order_id);
      const customer = jobOrder ? getCustomerDetails(jobOrder.customer_id) : null;
      const item = jobOrder ? getItemDetails(jobOrder.item_id) : null;
      
      const creator = getUserDetails(roll.created_by);
      const extruder = getUserDetails(roll.extruded_by);
      const printer = getUserDetails(roll.printed_by);
      const cutter = getUserDetails(roll.cut_by);
      
      const now = new Date();
      const createdDate = new Date(roll.created_date);
      const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const stage = determineRollStage(roll);
      const progressPercentage = calculateProgressPercentage(roll);
      
      // Calculate waste percentage if we have both extruding and cutting quantities
      let wastePercentage = null;
      if (roll.extruding_qty && roll.cutting_qty) {
        const waste = roll.extruding_qty - roll.cutting_qty;
        wastePercentage = (waste / roll.extruding_qty) * 100;
      }
      
      return {
        ...roll,
        customer,
        jobOrder,
        item,
        creator,
        extruder,
        printer,
        cutter,
        wastePercentage,
        daysSinceCreation,
        stage,
        progressPercentage
      };
    });
  }, [rolls, jobOrders, customers, items, users]);
  
  // Filter rolls based on active filters
  const filteredRolls = useMemo(() => {
    if (!rollsData) return [];
    
    // Start with all rolls
    let filtered = [...rollsData];
    
    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(roll => {
        // If filterStatus is a stage, filter by the stage
        if (['extruding', 'printing', 'cutting', 'completed'].includes(filterStatus)) {
          return roll.stage === filterStatus;
        }
        
        // Otherwise filter by the exact status
        return roll.status.toLowerCase() === filterStatus.toLowerCase();
      });
    }
    
    // Apply customer filter
    if (filterCustomer !== "all") {
      const customerId = parseInt(filterCustomer);
      filtered = filtered.filter(roll => 
        roll.customer && roll.customer.id === customerId
      );
    }
    
    // Apply job order filter
    if (filterJobOrder !== "all") {
      const jobOrderId = parseInt(filterJobOrder);
      filtered = filtered.filter(roll => roll.job_order_id === jobOrderId);
    }
    
    // Apply search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(roll => {
        // Search by roll identification
        if (roll.roll_identification.toLowerCase().includes(lowerSearchTerm)) {
          return true;
        }
        
        // Search by customer name
        if (roll.customer && roll.customer.name.toLowerCase().includes(lowerSearchTerm)) {
          return true;
        }
        
        // Search by roll number
        if (roll.roll_number.toString().includes(lowerSearchTerm)) {
          return true;
        }
        
        // Search by job order ID
        if (roll.job_order_id.toString().includes(lowerSearchTerm)) {
          return true;
        }
        
        // Search by roll notes
        if (roll.notes && roll.notes.toLowerCase().includes(lowerSearchTerm)) {
          return true;
        }
        
        return false;
      });
    }
    
    return filtered;
  }, [rollsData, filterStatus, filterCustomer, filterJobOrder, searchTerm]);
  
  // Group rolls by customer for customer view
  const customerGroups = useMemo(() => {
    if (!filteredRolls || !customers) return [];
    
    const groups: Record<number, CustomerGroupedRolls> = {};
    
    // Initialize groups for all customers that have rolls
    filteredRolls.forEach(roll => {
      if (!roll.customer) return;
      
      const customerId = roll.customer.id;
      
      if (!groups[customerId]) {
        groups[customerId] = {
          customerId,
          customerName: roll.customer.name,
          rollCount: 0,
          activeRolls: 0,
          completedRolls: 0,
          rolls: []
        };
      }
      
      groups[customerId].rolls.push(roll);
      groups[customerId].rollCount++;
      
      if (roll.stage === 'completed') {
        groups[customerId].completedRolls++;
      } else {
        groups[customerId].activeRolls++;
      }
    });
    
    // Convert to array and sort by customer name
    return Object.values(groups).sort((a, b) => 
      a.customerName.localeCompare(b.customerName)
    );
  }, [filteredRolls, customers]);
  
  // Group rolls by job order for job order view
  const jobOrderGroups = useMemo(() => {
    if (!filteredRolls || !jobOrders) return [];
    
    const groups: Record<number, JobOrderGroupedRolls> = {};
    
    // Initialize groups for all job orders that have rolls
    filteredRolls.forEach(roll => {
      const jobOrderId = roll.job_order_id;
      const jobOrder = roll.jobOrder;
      const customer = roll.customer;
      
      if (!groups[jobOrderId]) {
        groups[jobOrderId] = {
          jobOrderId,
          customerId: customer?.id || null,
          customerName: customer?.name || "Unknown Customer",
          rollCount: 0,
          totalWeight: 0,
          rolls: []
        };
      }
      
      groups[jobOrderId].rolls.push(roll);
      groups[jobOrderId].rollCount++;
      
      // Add to total weight if extruded quantity exists
      if (roll.extruding_qty) {
        groups[jobOrderId].totalWeight += roll.extruding_qty;
      }
    });
    
    // Convert to array and sort by job order ID
    return Object.values(groups).sort((a, b) => a.jobOrderId - b.jobOrderId);
  }, [filteredRolls, jobOrders]);
  
  // Group rolls by stage for status view
  const stageGroups = useMemo(() => {
    const groups = {
      extruding: [] as RollCardData[],
      printing: [] as RollCardData[],
      cutting: [] as RollCardData[],
      completed: [] as RollCardData[]
    };
    
    filteredRolls.forEach(roll => {
      if (roll.stage && roll.stage !== 'none') {
        groups[roll.stage].push(roll);
      }
    });
    
    return groups;
  }, [filteredRolls]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!rollsData) {
      return {
        total: 0,
        extruding: 0,
        printing: 0,
        cutting: 0,
        completed: 0,
        customerCount: 0,
        jobOrderCount: 0,
        averageWaste: 0
      };
    }
    
    const extruding = rollsData.filter(r => r.stage === 'extruding').length;
    const printing = rollsData.filter(r => r.stage === 'printing').length;
    const cutting = rollsData.filter(r => r.stage === 'cutting').length;
    const completed = rollsData.filter(r => r.stage === 'completed').length;
    
    // Get unique customer and job order counts
    const customerIds = new Set<number>();
    const jobOrderIds = new Set<number>();
    
    rollsData.forEach(roll => {
      if (roll.customer) {
        customerIds.add(roll.customer.id);
      }
      jobOrderIds.add(roll.job_order_id);
    });
    
    // Calculate average waste percentage
    let totalWastePercentage = 0;
    let rollsWithWaste = 0;
    
    rollsData.forEach(roll => {
      if (roll.wastePercentage !== null) {
        totalWastePercentage += roll.wastePercentage;
        rollsWithWaste++;
      }
    });
    
    const averageWaste = rollsWithWaste > 0 ? totalWastePercentage / rollsWithWaste : 0;
    
    return {
      total: rollsData.length,
      extruding,
      printing,
      cutting,
      completed,
      customerCount: customerIds.size,
      jobOrderCount: jobOrderIds.size,
      averageWaste: Math.round(averageWaste * 10) / 10 // Round to 1 decimal place
    };
  }, [rollsData]);
  
  // Mutation for updating roll status
  const updateRollMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      apiRequest('PATCH', `/api/rolls/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rolls'] });
      toast({
        title: "Roll status updated",
        description: "The roll status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating roll status",
        description: "There was an error updating the roll status. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating roll status:", error);
    }
  });
  
  // Function to handle status change
  const handleStatusChange = (rollId: number, newStatus: string) => {
    updateRollMutation.mutate({ id: rollId, status: newStatus });
  };
  
  // Function to process a roll (navigate to appropriate stage page)
  const handleProcessRoll = (roll: RollCardData) => {
    const stage = roll.stage;
    
    switch(stage) {
      case 'extruding':
        navigate(`/production/printing/${roll.id}`);
        break;
      case 'printing':
        navigate(`/production/cutting/${roll.id}`);
        break;
      case 'cutting':
        navigate(`/production/receiving`);
        break;
      default:
        toast({
          title: "Cannot process roll",
          description: `This roll is in ${roll.status} status and cannot be processed.`,
          variant: "destructive"
        });
    }
  };
  
  // Generate a summary of quantities
  const getQuantitySummary = (roll: RollCardData) => {
    return (
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="rounded-md bg-muted/50 p-2 text-center">
          <p className="text-xs text-muted-foreground">Extruded</p>
          <p className="text-sm font-medium">{roll.extruding_qty || "-"} kg</p>
        </div>
        
        <div className="rounded-md bg-muted/50 p-2 text-center">
          <p className="text-xs text-muted-foreground">Printed</p>
          <p className="text-sm font-medium">{roll.printing_qty || "-"} kg</p>
        </div>
        
        <div className="rounded-md bg-muted/50 p-2 text-center">
          <p className="text-xs text-muted-foreground">Cut</p>
          <p className="text-sm font-medium">{roll.cutting_qty || "-"} kg</p>
        </div>
      </div>
    );
  };
  
  // Render a compact roll card
  const renderRollCard = (roll: RollCardData) => {
    return (
      <Card 
        key={roll.id}
        className="hover:shadow-md transition-shadow"
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <StageIcon stage={roll.stage} />
              <div>
                <div className="font-semibold">Roll #{roll.roll_number}</div>
                <div className="text-xs text-muted-foreground">JO-{roll.job_order_id}</div>
              </div>
            </div>
            <StatusBadge status={roll.status} />
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-2">
          {getQuantitySummary(roll)}
          
          {roll.wastePercentage !== null && (
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-muted-foreground">Waste:</span>
              <span className={`text-sm font-medium ${roll.wastePercentage > 10 ? 'text-red-500' : 'text-green-500'}`}>
                {Math.round(roll.wastePercentage * 10) / 10}%
              </span>
            </div>
          )}
          
          <Separator className="my-3" />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span>{format(new Date(roll.created_date), "MMM d, yyyy")}</span>
            {roll.creator && <span>by {roll.creator.name}</span>}
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/production/rolls/${roll.id}`)}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              View
            </Button>
            
            {(isAdmin || ((roll.stage === 'extruding' && hasPermission('extruding')) || 
                          (roll.stage === 'printing' && hasPermission('printing')) || 
                          (roll.stage === 'cutting' && hasPermission('cutting')))) && (
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={() => navigate(`/production/rolls/${roll.id}/edit`)}
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            )}
            
            {roll.stage !== 'completed' && (
              <Button 
                size="sm"
                className="flex-1"
                onClick={() => handleProcessRoll(roll)}
              >
                <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                Process
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Roll Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage production rolls across different stages
            </p>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-10 w-48" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
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
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roll Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage production rolls across different stages
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => navigate("/production/extruding")}
                  className="flex items-center"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  New Roll
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Create a new roll through extrusion
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => navigate("/production/receiving")}
                  className="flex items-center"
                >
                  <PackageCheck className="mr-1 h-4 w-4" />
                  Receiving
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                View and manage order receiving
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => navigate("/production/waste")}
                  className="flex items-center"
                >
                  <BarChart2 className="mr-1 h-4 w-4" />
                  Waste
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Monitor production waste
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rolls</p>
                <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
              </div>
              <Boxes className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">For Printing</p>
                <h3 className="text-2xl font-bold mt-1">{stats.extruding}</h3>
              </div>
              <Factory className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">For Cutting</p>
                <h3 className="text-2xl font-bold mt-1">{stats.printing}</h3>
              </div>
              <Printer className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">For Receiving</p>
                <h3 className="text-2xl font-bold mt-1">{stats.cutting}</h3>
              </div>
              <Scissors className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Waste</p>
                <h3 className="text-2xl font-bold mt-1">{stats.averageWaste}%</h3>
              </div>
              <BarChart2 className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center flex-1 relative">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rolls, customers, or job orders..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="extruding">For Printing</SelectItem>
                  <SelectItem value="printing">For Cutting</SelectItem>
                  <SelectItem value="cutting">For Receiving</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filterCustomer}
                onValueChange={setFilterCustomer}
              >
                <SelectTrigger className="w-[160px]">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers && customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filterJobOrder}
                onValueChange={setFilterJobOrder}
              >
                <SelectTrigger className="w-[160px]">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Job Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Job Orders</SelectItem>
                  {jobOrders && jobOrders.map(jobOrder => (
                    <SelectItem key={jobOrder.id} value={jobOrder.id.toString()}>
                      JO-{jobOrder.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Display views - Tabs for different grouping views */}
      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="customer" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              By Customer
            </TabsTrigger>
            <TabsTrigger value="job-order" className="flex items-center">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              By Job Order
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              By Status
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {filteredRolls.length} roll{filteredRolls.length !== 1 ? 's' : ''} found
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setFilterCustomer("all");
                setFilterJobOrder("all");
                setFilterStatus("all");
                setSearchTerm("");
              }}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
        
        {/* Customer View */}
        <TabsContent value="customer" className="space-y-6">
          {customerGroups.length === 0 ? (
            <Alert>
              <AlertTitle>No rolls found</AlertTitle>
              <AlertDescription>
                No rolls match the current filters. Try adjusting your search criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {customerGroups.map((group) => (
                <AccordionItem 
                  key={group.customerId} 
                  value={`customer-${group.customerId}`}
                  className="border rounded-lg p-0 overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 data-[state=open]:bg-muted/50">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarFallback>{group.customerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-left">{group.customerName}</h3>
                          <div className="text-xs text-muted-foreground text-left">
                            {group.rollCount} roll{group.rollCount !== 1 ? 's' : ''}
                            {group.activeRolls > 0 && ` • ${group.activeRolls} active`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 md:mr-6">
                        <Badge variant="outline" className="bg-blue-50">
                          {group.activeRolls} Active
                        </Badge>
                        <Badge variant="outline" className="bg-green-50">
                          {group.completedRolls} Completed
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.rolls
                          .sort((a, b) => a.roll_number - b.roll_number)
                          .map(roll => renderRollCard(roll))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
        
        {/* Job Order View */}
        <TabsContent value="job-order" className="space-y-6">
          {jobOrderGroups.length === 0 ? (
            <Alert>
              <AlertTitle>No rolls found</AlertTitle>
              <AlertDescription>
                No rolls match the current filters. Try adjusting your search criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {jobOrderGroups.map((group) => (
                <AccordionItem 
                  key={group.jobOrderId} 
                  value={`joborder-${group.jobOrderId}`}
                  className="border rounded-lg p-0 overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 data-[state=open]:bg-muted/50">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                          <FileSpreadsheet className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-left">JO-{group.jobOrderId}</h3>
                          <div className="text-xs text-muted-foreground text-left">
                            {group.customerName} • {group.rollCount} roll{group.rollCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 md:mr-6">
                        <Badge variant="outline" className="bg-primary/10">
                          {group.totalWeight.toFixed(1)} kg
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.rolls
                          .sort((a, b) => a.roll_number - b.roll_number)
                          .map(roll => renderRollCard(roll))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
        
        {/* Status View */}
        <TabsContent value="status" className="space-y-6">
          {filteredRolls.length === 0 ? (
            <Alert>
              <AlertTitle>No rolls found</AlertTitle>
              <AlertDescription>
                No rolls match the current filters. Try adjusting your search criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {/* Extruding Section */}
              {stageGroups.extruding.length > 0 && (
                <section>
                  <div className="flex items-center mb-4">
                    <Factory className="h-5 w-5 text-blue-500 mr-2" />
                    <h2 className="text-xl font-semibold">For Printing</h2>
                    <Badge variant="outline" className="ml-3 bg-blue-50">
                      {stageGroups.extruding.length} roll{stageGroups.extruding.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stageGroups.extruding
                      .sort((a, b) => a.roll_number - b.roll_number)
                      .map(roll => renderRollCard(roll))}
                  </div>
                </section>
              )}
              
              {/* Printing Section */}
              {stageGroups.printing.length > 0 && (
                <section>
                  <div className="flex items-center mb-4">
                    <Printer className="h-5 w-5 text-purple-500 mr-2" />
                    <h2 className="text-xl font-semibold">For Cutting</h2>
                    <Badge variant="outline" className="ml-3 bg-purple-50">
                      {stageGroups.printing.length} roll{stageGroups.printing.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stageGroups.printing
                      .sort((a, b) => a.roll_number - b.roll_number)
                      .map(roll => renderRollCard(roll))}
                  </div>
                </section>
              )}
              
              {/* Cutting Section */}
              {stageGroups.cutting.length > 0 && (
                <section>
                  <div className="flex items-center mb-4">
                    <Scissors className="h-5 w-5 text-green-500 mr-2" />
                    <h2 className="text-xl font-semibold">For Receiving</h2>
                    <Badge variant="outline" className="ml-3 bg-green-50">
                      {stageGroups.cutting.length} roll{stageGroups.cutting.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stageGroups.cutting
                      .sort((a, b) => a.roll_number - b.roll_number)
                      .map(roll => renderRollCard(roll))}
                  </div>
                </section>
              )}
              
              {/* Completed Section */}
              {stageGroups.completed.length > 0 && (
                <section>
                  <div className="flex items-center mb-4">
                    <CheckCircle2 className="h-5 w-5 text-teal-500 mr-2" />
                    <h2 className="text-xl font-semibold">Completed</h2>
                    <Badge variant="outline" className="ml-3 bg-teal-50">
                      {stageGroups.completed.length} roll{stageGroups.completed.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stageGroups.completed
                      .sort((a, b) => a.roll_number - b.roll_number)
                      .map(roll => renderRollCard(roll))}
                  </div>
                </section>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}