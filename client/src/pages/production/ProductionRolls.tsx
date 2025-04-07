import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Plus, Printer, Scissors, Package, Filter, ExternalLink, PackageOpen, CircleAlert, Pencil, Trash2 } from "lucide-react";
import { Check, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

// Type definitions
interface Customer {
  id: number;
  name: string;
  arabic_name?: string;
  drawer_no?: string;
  phone?: string;
  email?: string;
  address?: string;
  salesperson_id?: number;
  photo_url?: string;
}

interface Category {
  id: number;
  name: string;
  category_identification?: string;
}

interface Item {
  id: number;
  name: string;
  customer_id: number;
  category_id: number;
  sub_category_id?: number;
  item_identification?: string;
  description?: string;
}

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

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TableSkeleton } from "@/components/ui/skeletons";
import { useToast } from "@/hooks/use-toast";

// Utils
import { apiRequest } from "@/lib/queryClient";
import { fadeIn } from "@/utils/animations";
import { t } from "@/utils/language";

// Status badges with colors
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'For Printing':
      return <Badge className="bg-blue-500 hover:bg-blue-600">For Printing</Badge>;
    case 'For Cutting':
      return <Badge className="bg-purple-500 hover:bg-purple-600">For Cutting</Badge>;
    case 'For Delivery':
    case 'For Receiving':
      return <Badge className="bg-green-500 hover:bg-green-600">{status}</Badge>;
    // Removed 'Ready for' statuses
    case 'Received':
      return <Badge className="bg-teal-500 hover:bg-teal-600">Received</Badge>;
    case 'Damage':
    case 'Damaged':
      return <Badge className="bg-red-500 hover:bg-red-600">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function ProductionRolls() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredRolls, setFilteredRolls] = useState<Roll[]>([]);
  const { toast } = useToast();
  
  // Load all rolls
  const { data: rolls, isLoading } = useQuery({
    queryKey: ['/api/rolls'],
    queryFn: () => apiRequest<Roll[]>('GET', '/api/rolls'),
  });

  // Load job orders for reference
  const { data: jobOrders } = useQuery({
    queryKey: ['/api/job-orders'],
    queryFn: () => apiRequest<JobOrder[]>('GET', '/api/job-orders'),
  });
  
  // Load customers for reference
  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => apiRequest<Customer[]>('GET', '/api/customers'),
  });
  
  // Load categories for reference
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest<Category[]>('GET', '/api/categories'),
  });
  
  // Load items for reference
  const { data: items } = useQuery({
    queryKey: ['/api/items'],
    queryFn: () => apiRequest<Item[]>('GET', '/api/items'),
  });

  // Filter rolls based on status and search query
  useEffect(() => {
    if (!rolls) return;
    
    let filtered = [...rolls];
    
    // Filter by status
    if (filter !== "all") {
      filtered = filtered.filter(roll => roll.status === filter);
    }
    
    // Filter by search query (roll identification, notes, or job order ID)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(roll => 
        roll.roll_identification.toLowerCase().includes(query) ||
        (roll.notes && roll.notes.toLowerCase().includes(query)) ||
        roll.job_order_id.toString().includes(query)
      );
    }
    
    // Sort by roll number (newest first)
    filtered.sort((a, b) => b.roll_number - a.roll_number);
    
    setFilteredRolls(filtered);
  }, [rolls, filter, searchQuery]);

  // Get job order details for a roll
  const getJobOrderDetails = (jobOrderId: number) => {
    if (!jobOrders) return null;
    return jobOrders.find(jo => jo.id === jobOrderId);
  };
  
  // Get customer name for a job order
  const getCustomerName = (jobOrderId: number) => {
    if (!jobOrders || !customers) return "—";
    const jobOrder = jobOrders.find(jo => jo.id === jobOrderId);
    if (!jobOrder) return "—";
    
    const customer = customers.find(c => c.id === jobOrder.customer_id);
    return customer ? customer.name : "—";
  };
  
  // Get category name for a job order
  const getCategoryName = (jobOrderId: number) => {
    if (!jobOrders || !categories) return "—";
    const jobOrder = jobOrders.find(jo => jo.id === jobOrderId);
    if (!jobOrder) return "—";
    
    const category = categories.find(c => c.id === jobOrder.category_id);
    return category ? category.name : "—";
  };
  
  // Get item name for a job order
  const getItemName = (jobOrderId: number) => {
    if (!jobOrders || !items) return "—";
    const jobOrder = jobOrders.find(jo => jo.id === jobOrderId);
    if (!jobOrder) return "—";
    
    const item = items.find(i => i.id === jobOrder.item_id);
    return item ? item.name : "—";
  };
  
  // Calculate waste for a roll
  const calculateWaste = (roll: Roll): { amount: number | null, percentage: string } => {
    if (roll.extruding_qty === null || roll.cutting_qty === null) {
      return { amount: null, percentage: "—" };
    }
    
    const waste = roll.extruding_qty - roll.cutting_qty;
    const percentage = roll.extruding_qty > 0 
      ? ((waste / roll.extruding_qty) * 100).toFixed(1) 
      : "0.0";
      
    return { amount: waste, percentage: `${percentage}%` };
  };
  
  // Handle edit roll function
  const handleEditRoll = (roll: Roll) => {
    navigate(`/production/rolls/edit/${roll.id}`);
  };
  
  // Handle view roll details
  const handleViewRoll = (roll: Roll) => {
    navigate(`/production/rolls/${roll.id}`);
  };
  
  // Handle delete roll function
  const handleDeleteRoll = async (roll: Roll) => {
    if (confirm(`Are you sure you want to delete roll ${roll.roll_identification}?`)) {
      try {
        // Delete the roll
        await apiRequest('DELETE', `/api/rolls/${roll.id}`);
        
        // Show success notification
        toast({
          title: "Roll Deleted",
          description: `Roll ${roll.roll_identification} has been deleted.`,
        });
        
        // Refresh the data
        window.location.reload();
      } catch (error) {
        console.error('Error deleting roll:', error);
        toast({
          title: "Delete Failed",
          description: "There was an error deleting the roll. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Handle receiving a roll in warehouse after delivery
  const handleReceiveRoll = async (roll: Roll) => {
    if (confirm(`Confirm receiving roll ${roll.roll_identification} in warehouse?`)) {
      try {
        // Update the roll status to Received
        await apiRequest('PATCH', `/api/rolls/${roll.id}`, {
          status: 'Received',
          notes: roll.notes ? `${roll.notes}\nReceived in warehouse on ${format(new Date(), "MMM d, yyyy")}` : `Received in warehouse on ${format(new Date(), "MMM d, yyyy")}`
        });
        
        // Show success notification
        toast({
          title: "Roll Received",
          description: `Roll ${roll.roll_identification} has been received in warehouse.`,
        });
        
        // Refresh the data
        window.location.reload();
      } catch (error) {
        console.error('Error receiving roll:', error);
        toast({
          title: "Update Failed",
          description: "There was an error updating the roll status. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Columns for DataTable
  const columns = [
    {
      header: "Roll ID",
      accessorKey: "roll_identification",
      cell: (roll: Roll) => (
        <div className="font-medium text-center">{roll.roll_identification}</div>
      ),
    },
    {
      header: "Roll #",
      accessorKey: "roll_number",
      cell: (roll: Roll) => (
        <div className="font-medium text-center">
          <Badge variant="secondary">{roll.roll_number}</Badge>
        </div>
      ),
    },
    {
      header: "Job Order",
      accessorKey: "job_order_id",
      cell: (roll: Roll) => (
        <div className="font-medium text-center">JO-{roll.job_order_id}</div>
      ),
    },
    {
      header: "Customer",
      accessorKey: "customer_name",
      cell: (roll: Roll) => (
        <div className="font-medium text-center">{getCustomerName(roll.job_order_id)}</div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category_name",
      cell: (roll: Roll) => (
        <div className="font-medium text-center">{getCategoryName(roll.job_order_id)}</div>
      ),
    },
    {
      header: "Item",
      accessorKey: "item_name",
      cell: (roll: Roll) => (
        <div className="font-medium text-center">{getItemName(roll.job_order_id)}</div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (roll: Roll) => <div className="text-center">{getStatusBadge(roll.status)}</div>,
    },
    {
      header: "Created Date",
      accessorKey: "created_date",
      cell: (roll: Roll) => <div className="text-center">{format(new Date(roll.created_date), "MMM d, yyyy")}</div>,
    },
    {
      header: "Extruding",
      accessorKey: "extruding_qty",
      cell: (roll: Roll) => (
        <div className="font-medium text-center">{roll.extruding_qty !== null ? roll.extruding_qty : '—'}</div>
      ),
    },
    {
      header: "Printing",
      accessorKey: "printing_qty",
      cell: (roll: Roll) => (
        <div className="font-medium text-center">{roll.printing_qty !== null ? roll.printing_qty : '—'}</div>
      ),
    },
    {
      header: "Cutting",
      accessorKey: "cutting_qty",
      cell: (roll: Roll) => (
        <div className="font-medium text-center">{roll.cutting_qty !== null ? roll.cutting_qty : '—'}</div>
      ),
    },
    {
      header: "Waste",
      accessorKey: "waste",
      cell: (roll: Roll) => {
        const waste = calculateWaste(roll);
        return (
          <div className="font-medium text-center">
            {waste.amount !== null ? (
              <span className="text-red-600">{waste.amount} ({waste.percentage})</span>
            ) : (
              '—'
            )}
          </div>
        );
      },
    },
  ];
  
  // Table actions
  const actions = (roll: Roll) => {
    // Primary workflow action button based on roll status
    let primaryActionButton;
    
    switch (roll.status) {
      case 'For Printing':
        primaryActionButton = (
          <Button 
            size="sm" 
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => navigate(`/production/printing/${roll.id}`)}
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        );
        break;
      case 'For Cutting':
        primaryActionButton = (
          <Button 
            size="sm" 
            className="bg-purple-500 hover:bg-purple-600"
            onClick={() => navigate(`/production/cutting/${roll.id}`)}
          >
            <Scissors className="h-4 w-4 mr-1" />
            Cut
          </Button>
        );
        break;
      case 'For Receiving':
        primaryActionButton = (
          <Button 
            size="sm" 
            className="bg-green-500 hover:bg-green-600"
            onClick={() => navigate(`/production/rolls/${roll.id}`)}
          >
            <PackageOpen className="h-4 w-4 mr-1" />
            Receive
          </Button>
        );
        break;
      // Removed 'Ready for Receiving' case
        break;
      case 'Damage':
        primaryActionButton = (
          <Button 
            size="sm" 
            className="bg-red-500 hover:bg-red-600"
            onClick={() => handleViewRoll(roll)}
          >
            <CircleAlert className="h-4 w-4 mr-1" />
            View Damage
          </Button>
        );
        break;
      case 'Received':
        primaryActionButton = (
          <Button 
            size="sm" 
            className="bg-teal-500 hover:bg-teal-600"
            onClick={() => handleViewRoll(roll)}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Completed
          </Button>
        );
        break;
      default:
        // View details for completed rolls or any other status
        primaryActionButton = (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleViewRoll(roll)}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View
          </Button>
        );
    }
    
    // View details button - always show for all rolls
    const viewButton = (
      <Button 
        size="sm"
        variant="outline"
        onClick={() => handleViewRoll(roll)}
        title="View Roll Details"
      >
        <ExternalLink className="h-4 w-4 mr-1" />
        View
      </Button>
    );
    
    // Edit button
    const editButton = (
      <Button
        size="sm"
        variant="outline"
        className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
        onClick={() => handleEditRoll(roll)}
        title="Edit Roll"
      >
        <Pencil className="h-4 w-4 mr-1" />
        Edit
      </Button>
    );
    
    // Delete button
    const deleteButton = (
      <Button
        size="sm"
        variant="outline"
        className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
        onClick={() => handleDeleteRoll(roll)}
        title="Delete Roll"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
    );
    
    // Receive button - only show for rolls that need to be received
    const receiveButton = (roll.status === 'For Receiving') ? (
      <Button
        size="sm"
        variant="outline"
        className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200"
        onClick={() => handleReceiveRoll(roll)}
        title="Receive Roll in Warehouse"
      >
        <CheckCircle2 className="h-4 w-4 mr-1" />
        Receive
      </Button>
    ) : null;
    
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {primaryActionButton}
          {viewButton}
        </div>
        <div className="flex items-center gap-2">
          {editButton}
          {deleteButton}
          {receiveButton}
        </div>
      </div>
    );
  };

  // Stats for the dashboard cards
  const getTotalsByStatus = () => {
    if (!rolls) return { 
      forPrinting: 0, 
      forCutting: 0, 
      forReceiving: 0, 
      readyForDelivery: 0,
      received: 0,
      damaged: 0 
    };
    
    return {
      forPrinting: rolls.filter(r => r.status === 'For Printing').length,
      forCutting: rolls.filter(r => r.status === 'For Cutting').length,
      forReceiving: rolls.filter(r => r.status === 'For Receiving').length,
      readyForDelivery: 0, // Removed Ready for Receiving tracking
      received: rolls.filter(r => r.status === 'Received').length,
      damaged: rolls.filter(r => r.status === 'Damage' || r.status === 'Damaged').length,
    };
  };
  
  const stats = getTotalsByStatus();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeIn}
      className="container py-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roll Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage production rolls through the workflow
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button
            onClick={() => navigate("/production/extruding")}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Roll
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">For Printing</p>
              <p className="text-2xl font-bold">{stats.forPrinting}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-full">
              <Printer className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">For Cutting</p>
              <p className="text-2xl font-bold">{stats.forCutting}</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-full">
              <Scissors className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">For Receiving</p>
              <p className="text-2xl font-bold">{stats.forReceiving}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-full">
              <PackageOpen className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ready</p>
              <p className="text-2xl font-bold">{stats.readyForDelivery}</p>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-full">
              <Check className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Received</p>
              <p className="text-2xl font-bold">{stats.received}</p>
            </div>
            <div className="bg-teal-500/20 p-3 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-teal-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Damaged</p>
              <p className="text-2xl font-bold">{stats.damaged}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-full">
              <CircleAlert className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/4">
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="For Printing">For Printing</SelectItem>
                  <SelectItem value="For Cutting">For Cutting</SelectItem>
                  <SelectItem value="For Receiving">For Receiving</SelectItem>
                  {/* Removed Ready for Receiving option */}
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Damage">Damage</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-3/4">
              <Input
                placeholder="Search by roll ID, job order, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rolls table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Rolls</CardTitle>
          <CardDescription>
            Manage and track all production rolls through the workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : (
            <DataTable
              columns={columns}
              data={filteredRolls}
              actions={actions}
              searchable={false}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}