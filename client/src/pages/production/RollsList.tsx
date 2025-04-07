import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Printer, Edit, PackageOpen, ArrowRight, Filter, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Utils
import { apiRequest } from "@/lib/queryClient";
import { fadeIn } from "@/utils/animations";
import { usePermissions } from "@/utils/permissions";

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
  arabic_name?: string;
  drawer_no?: string;
  phone?: string;
  email?: string;
  address?: string;
  salesperson_id?: number;
  photo_url?: string;
}

interface Item {
  id: number;
  pcid?: string;
  customer_id: number;
  product_id: number;
  size_details?: string;
  thickness?: number;
  cylinder_inch?: number;
  cutting_length_cm?: number;
  raw_material?: string;
  mast_batch?: string;
  is_printed?: boolean;
  cutting_unit?: string;
  unit_weight_kg?: number;
  packing?: string;
  punching?: string;
  cover?: string;
  notes?: string;
}

export default function RollsList({ stageFilter = "all" }: { stageFilter?: string }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { isAdmin, hasPermission } = usePermissions();
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(stageFilter === "all" ? "" : stageFilter);
  const [customerFilter, setCustomerFilter] = useState<number | "">("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Load rolls data
  const { data: rolls, isLoading: isLoadingRolls } = useQuery({
    queryKey: ['/api/rolls'],
    queryFn: () => apiRequest<Roll[]>('GET', '/api/rolls'),
  });
  
  // Load job orders for reference
  const { data: jobOrders, isLoading: isLoadingJobOrders } = useQuery({
    queryKey: ['/api/job-orders'],
    queryFn: () => apiRequest<JobOrder[]>('GET', '/api/job-orders'),
  });
  
  // Load customers for filtering
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => apiRequest<Customer[]>('GET', '/api/customers'),
  });
  
  // Load items for reference
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/items'],
    queryFn: () => apiRequest<Item[]>('GET', '/api/items'),
  });

  // Filter rolls based on selected status and customer
  const filteredRolls = (() => {
    if (!rolls) return [];
    
    return rolls.filter(roll => {
      // Apply status filter
      if (statusFilter && roll.status !== statusFilter) {
        return false;
      }
      
      // Apply customer filter
      if (customerFilter && jobOrders) {
        const jobOrder = jobOrders.find(jo => jo.id === roll.job_order_id);
        if (!jobOrder || jobOrder.customer_id !== customerFilter) {
          return false;
        }
      }
      
      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const rollId = roll.roll_identification.toLowerCase();
        
        // Search by roll ID or roll number
        if (rollId.includes(term) || roll.roll_number.toString().includes(term)) {
          return true;
        }
        
        // Search by job order details
        if (jobOrders) {
          const jobOrder = jobOrders.find(jo => jo.id === roll.job_order_id);
          if (jobOrder) {
            // Search by job order ID
            if (jobOrder.id.toString().includes(term)) {
              return true;
            }
            
            // Search by customer name
            if (customers) {
              const customer = customers.find(c => c.id === jobOrder.customer_id);
              if (customer && customer.name.toLowerCase().includes(term)) {
                return true;
              }
            }
            
            // Search by item details
            if (items) {
              const item = items.find(i => i.id === jobOrder.item_id);
              if (item && item.pcid && item.pcid.toLowerCase().includes(term)) {
                return true;
              }
            }
          }
        }
        
        return false;
      }
      
      return true;
    });
  })();
  
  // Group rolls by customer
  const rollsByCustomer = (() => {
    if (!filteredRolls || !jobOrders || !customers) return {};
    
    const grouped: Record<string, { customer: Customer; rolls: Roll[] }> = {};
    
    filteredRolls.forEach(roll => {
      const jobOrder = jobOrders.find(jo => jo.id === roll.job_order_id);
      if (!jobOrder) return;
      
      const customer = customers.find(c => c.id === jobOrder.customer_id);
      if (!customer) return;
      
      const customerKey = customer.id.toString();
      
      if (!grouped[customerKey]) {
        grouped[customerKey] = { customer, rolls: [] };
      }
      
      grouped[customerKey].rolls.push(roll);
    });
    
    // Sort rolls within each customer group by roll number
    Object.keys(grouped).forEach(key => {
      grouped[key].rolls.sort((a, b) => a.roll_number - b.roll_number);
    });
    
    return grouped;
  })();

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'For Printing':
        return <Badge className="bg-blue-500">For Printing</Badge>;
      case 'For Cutting':
        return <Badge className="bg-amber-500">For Cutting</Badge>;
      case 'For Receiving':
        return <Badge className="bg-green-500">For Receiving</Badge>;
      case 'Completed':
        return <Badge className="bg-green-700">Completed</Badge>;
      case 'Damage':
        return <Badge variant="destructive">Damaged</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Get job order details for a roll
  const getJobOrderDetails = (roll: Roll): JobOrder | null => {
    if (!jobOrders) return null;
    return jobOrders.find(jo => jo.id === roll.job_order_id) || null;
  };
  
  // Get item details for a job order
  const getItemDetails = (jobOrder: JobOrder | null): Item | null => {
    if (!jobOrder || !items) return null;
    return items.find(item => item.id === jobOrder.item_id) || null;
  };
  
  // Handle next action based on roll status
  const handleNextAction = (roll: Roll) => {
    switch (roll.status) {
      case 'For Printing':
        navigate(`/production/printing/${roll.id}`);
        break;
      case 'For Cutting':
        navigate(`/production/cutting/${roll.id}`);
        break;
      case 'For Receiving':
        navigate(`/production/receiving/${roll.id}`);
        break;
      default:
        toast({
          title: "No Action Available",
          description: `The roll is in "${roll.status}" status and no action is available.`,
        });
    }
  };
  
  // Check if user has permission for next action
  const hasNextActionPermission = (roll: Roll) => {
    switch (roll.status) {
      case 'For Printing':
        return isAdmin || hasPermission('printing');
      case 'For Cutting':
        return isAdmin || hasPermission('cutting');
      case 'For Receiving':
        return isAdmin || hasPermission('warehouse');
      default:
        return false;
    }
  };
  
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeIn}
      className="container mx-auto py-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Rolls</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track rolls through the production workflow
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          {isAdmin || hasPermission('extruding') ? (
            <Button onClick={() => navigate("/production/extruding")}>
              <PackageOpen className="mr-2 h-4 w-4" />
              New Extruding
            </Button>
          ) : null}
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Rolls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select
                value={statusFilter.toString()}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="For Printing">For Printing</SelectItem>
                  <SelectItem value="For Cutting">For Cutting</SelectItem>
                  <SelectItem value="For Receiving">For Receiving</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Damage">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Customer</label>
              <Select
                value={customerFilter.toString()}
                onValueChange={(value) => setCustomerFilter(value ? parseInt(value) : "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Customers</SelectItem>
                  {customers?.map(customer => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <Input
                placeholder="Search by roll ID, customer, etc."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoadingRolls || isLoadingJobOrders || isLoadingCustomers || isLoadingItems ? (
        <Card>
          <CardContent className="flex justify-center items-center p-8">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {Object.keys(rollsByCustomer).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <PackageOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No Rolls Found</h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  {statusFilter ? `No rolls with "${statusFilter}" status found.` : "No rolls match your filter criteria."}
                </p>
                {isAdmin || hasPermission('extruding') ? (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/production/extruding")}
                  >
                    <PackageOpen className="mr-2 h-4 w-4" />
                    Create New Roll
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <>
              {Object.entries(rollsByCustomer).map(([customerId, { customer, rolls }]) => (
                <Card key={customerId} className="mb-6">
                  <CardHeader>
                    <CardTitle>{customer.name}</CardTitle>
                    <CardDescription>
                      {customer.drawer_no ? `Drawer No: ${customer.drawer_no}` : ""}
                      {rolls.length} roll{rolls.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll ID</TableHead>
                          <TableHead>Job Order</TableHead>
                          <TableHead>Extruding (kg)</TableHead>
                          <TableHead>Printing (kg)</TableHead>
                          <TableHead>Cutting (kg)</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rolls.map(roll => {
                          const jobOrder = getJobOrderDetails(roll);
                          const item = getItemDetails(jobOrder);
                          
                          return (
                            <TableRow key={roll.id}>
                              <TableCell>
                                <div className="font-medium">{roll.roll_identification}</div>
                                <div className="text-sm text-muted-foreground">Roll #{roll.roll_number}</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">JO-{roll.job_order_id}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item?.pcid || `Item-${jobOrder?.item_id || 'Unknown'}`}
                                </div>
                              </TableCell>
                              <TableCell>{roll.extruding_qty || "—"}</TableCell>
                              <TableCell>{roll.printing_qty || "—"}</TableCell>
                              <TableCell>{roll.cutting_qty || "—"}</TableCell>
                              <TableCell>{getStatusBadge(roll.status)}</TableCell>
                              <TableCell>
                                {format(new Date(roll.created_date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      // Print label for this roll
                                      import('@/utils/pdf').then(async ({ generateRollLabel }) => {
                                        const rollData = {
                                          rollId: roll.roll_identification,
                                          rollNumber: roll.roll_number,
                                          orderId: jobOrder?.order_id || 0,
                                          customerName: customer.name,
                                          customerArabicName: customer.arabic_name,
                                          status: roll.status,
                                          createdBy: 'System', // Ideally use current user
                                          createdDate: format(new Date(roll.created_date), 'MMM d, yyyy'),
                                          weight: roll.cutting_qty 
                                            ? `${roll.cutting_qty} kg` 
                                            : (roll.printing_qty 
                                              ? `${roll.printing_qty} kg` 
                                              : (roll.extruding_qty ? `${roll.extruding_qty} kg` : undefined))
                                        };
                                        
                                        try {
                                          await generateRollLabel(rollData);
                                          toast({
                                            title: "Printing Label",
                                            description: `Label for Roll #${roll.roll_number} sent to printer.`,
                                          });
                                        } catch (error) {
                                          console.error("Error printing label:", error);
                                          toast({
                                            title: "Error",
                                            description: "Could not generate the label. Please try again.",
                                            variant: "destructive"
                                          });
                                        }
                                      });
                                    }}
                                  >
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                  
                                  {isAdmin && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        // Navigate to edit based on the current stage
                                        if (roll.status === 'For Printing' || roll.status === 'Extruding') {
                                          navigate(`/production/extruding/${roll.id}`);
                                        } else if (roll.status === 'For Cutting' || roll.status === 'Printing') {
                                          navigate(`/production/printing/${roll.id}`);
                                        } else if (roll.status === 'For Receiving' || roll.status === 'Cutting') {
                                          navigate(`/production/cutting/${roll.id}`);
                                        } else {
                                          navigate(`/production/extruding/${roll.id}`);
                                        }
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  
                                  {hasNextActionPermission(roll) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleNextAction(roll)}
                                    >
                                      <ArrowRight className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </motion.div>
  );
}