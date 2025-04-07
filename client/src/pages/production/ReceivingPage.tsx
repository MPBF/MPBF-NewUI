import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, PackageCheck, Download, Printer, ShoppingBag } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { JobOrderSelector } from "@/components/ui/job-order-selector";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Utils
import { apiRequest } from "@/lib/queryClient";
import { fadeIn } from "@/utils/animations";
import { useAuth } from "@/utils/auth";

// Receiving form schema
const receivingFormSchema = z.object({
  job_order_id: z.number(),
  received_quantity: z.coerce.number().positive("Quantity must be positive"),
  notes: z.string().nullable().optional(),
  // Roll ID will be added in the mutation function if available
});

type ReceivingFormValues = z.infer<typeof receivingFormSchema>;

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

interface ReceivingOrder {
  id: number;
  job_order_id: number;
  roll_id: number;
  received_date: string;
  received_by: number;
  received_quantity: number;
  notes: string | null;
  status: string;
  created_date: string;
}

export default function ReceivingPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const rollId = id ? parseInt(id) : undefined;
  const { user } = useAuth();

  // State to track selected job order for receiving
  const [selectedJobOrder, setSelectedJobOrder] = useState<number | null>(null);

  // Load roll data if coming from a roll
  const { data: roll, isLoading: isLoadingRoll } = useQuery({
    queryKey: ['/api/rolls', rollId],
    queryFn: () => apiRequest<Roll>('GET', `/api/rolls/${rollId}`),
    enabled: !!rollId,
  });

  // Load job orders that are ready for receiving
  const { data: jobOrders, isLoading: isLoadingJobOrders } = useQuery({
    queryKey: ['/api/job-orders'],
    queryFn: () => apiRequest<JobOrder[]>('GET', '/api/job-orders'),
  });

  // Load rolls for calculating available quantities
  const { data: rolls, isLoading: isLoadingRolls } = useQuery({
    queryKey: ['/api/rolls'],
    queryFn: () => apiRequest<Roll[]>('GET', '/api/rolls'),
  });

  // Load receiving orders to check what's already been received
  const { data: receivingOrders, isLoading: isLoadingReceivingOrders } = useQuery({
    queryKey: ['/api/receiving-orders'],
    queryFn: () => apiRequest<ReceivingOrder[]>('GET', '/api/receiving-orders'),
  });

  // Load customers for reference
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => apiRequest<Customer[]>('GET', '/api/customers'),
  });

  // Load items for reference
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/items'],
    queryFn: () => apiRequest<Item[]>('GET', '/api/items'),
  });

  // Form setup
  const form = useForm<ReceivingFormValues>({
    resolver: zodResolver(receivingFormSchema),
    defaultValues: {
      job_order_id: 0,
      received_quantity: 0,
      notes: "",
    },
  });

  // Initialize form with roll data if present
  useEffect(() => {
    if (roll) {
      form.setValue('job_order_id', roll.job_order_id);
      setSelectedJobOrder(roll.job_order_id);
      
      // Calculate available quantity
      const jobOrder = jobOrders?.find(jo => jo.id === roll.job_order_id);
      if (jobOrder) {
        const availableQuantity = calculateAvailableQuantity(jobOrder.id);
        form.setValue('received_quantity', availableQuantity > 0 ? availableQuantity : 0);
      }
    }
  }, [roll, jobOrders, form]);

  // Create receiving order mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: ReceivingFormValues) => {
      const receivingData = {
        ...values,
        received_by: user?.id || 0,
        received_date: new Date(),
        roll_id: rollId ? rollId : null, // Set to null when not provided
      };
      return await apiRequest('POST', '/api/receiving-orders', receivingData);
    },
    onSuccess: () => {
      toast({
        title: "Receiving order created",
        description: "The receiving order has been recorded successfully.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/receiving-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/job-orders'] });
      
      // Reset form
      form.reset({
        job_order_id: 0,
        received_quantity: 0,
        notes: "",
      });
      setSelectedJobOrder(null);
    },
    onError: (error) => {
      console.error("Error creating receiving order:", error);
      toast({
        title: "Error",
        description: "There was an error creating the receiving order. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: ReceivingFormValues) => {
    // Validate the receiving quantity
    if (selectedJobOrder) {
      const availableQty = calculateAvailableQuantity(selectedJobOrder);
      if (values.received_quantity > availableQty) {
        toast({
          title: "Quantity exceeds available",
          description: `The received quantity (${values.received_quantity}) exceeds the available quantity (${availableQty.toFixed(2)}).`,
          variant: "destructive",
        });
        return;
      }
    }
    
    mutate(values);
  };

  // Calculate available (cut) quantity for a job order
  const calculateAvailableQuantity = (jobOrderId: number): number => {
    if (!rolls || !receivingOrders) return 0;
    
    // Get all rolls for this job order that are cut
    const jobOrderRolls = rolls.filter(r => 
      r.job_order_id === jobOrderId && 
      (r.status === 'For Receiving' || r.status === 'Completed') &&
      r.cutting_qty !== null
    );
    
    // Calculate total cut quantity
    const totalCutQty = jobOrderRolls.reduce((sum, r) => sum + (r.cutting_qty || 0), 0);
    
    // Calculate already received quantity
    const alreadyReceived = receivingOrders
      .filter(ro => ro.job_order_id === jobOrderId)
      .reduce((sum, ro) => sum + ro.received_quantity, 0);
    
    // Return available quantity (cut minus received)
    return Math.max(0, totalCutQty - alreadyReceived);
  };

  // Get job order details
  const getJobOrderDetails = (jobOrderId: number) => {
    if (!jobOrders) return null;
    return jobOrders.find(jo => jo.id === jobOrderId);
  };

  // Get customer name
  const getCustomerName = (customerId: number): string => {
    if (!customers) return 'Unknown Customer';
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  // Get item name
  const getItemDetails = (itemId: number) => {
    if (!items) return null;
    return items.find(i => i.id === itemId);
  };

  // Filter job orders that have available quantity for receiving
  const receivableJobOrders = (() => {
    if (!jobOrders) return [];
    
    return jobOrders.filter(jobOrder => {
      const availableQty = calculateAvailableQuantity(jobOrder.id);
      return availableQty > 0;
    });
  })();

  // Loading state
  const isLoading = isLoadingJobOrders || isLoadingRolls || isLoadingReceivingOrders || 
                    isLoadingCustomers || isLoadingItems || 
                    (rollId && isLoadingRoll);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeIn}
      className="container mx-auto py-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receiving Orders</h1>
          <p className="text-muted-foreground mt-1">
            Receive completed production rolls into the warehouse
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            onClick={() => {
              // Navigate to receiving orders list page
              navigate("/production/receiving-orders");
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            View All Receiving Orders
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receiving form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Receiving Order</CardTitle>
            <CardDescription>
              Record the reception of finished goods into the warehouse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="job_order_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Order *</FormLabel>
                      <FormControl>
                        <JobOrderSelector
                          value={field.value || null}
                          onChange={(value) => {
                            field.onChange(value);
                            setSelectedJobOrder(value);
                            
                            if (value) {
                              const availableQty = calculateAvailableQuantity(value);
                              form.setValue('received_quantity', availableQty > 0 ? availableQty : 0);
                            }
                          }}
                          filterActive={false} // Show all job orders, including completed
                          placeholder="Select a job order to receive"
                        />
                      </FormControl>
                      <FormDescription>
                        Select the job order to receive. Only orders with available quantity are shown.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedJobOrder && (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <h3 className="font-medium mb-2">Job Order Details</h3>
                    {(() => {
                      const jobOrder = getJobOrderDetails(selectedJobOrder);
                      if (!jobOrder) return <p>No details available</p>;
                      
                      const customer = customers?.find(c => c.id === jobOrder.customer_id);
                      const item = getItemDetails(jobOrder.item_id);
                      
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Job Order:</span>
                            <span className="font-medium">JO-{jobOrder.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer:</span>
                            <span className="font-medium">{customer?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Item:</span>
                            <span className="font-medium">{item?.pcid || `Item-${jobOrder.item_id}`}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Size:</span>
                            <span className="font-medium">{jobOrder.size_details || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Quantity:</span>
                            <span className="font-medium">{jobOrder.quantity} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Available for Receiving:</span>
                            <span className="font-medium">{calculateAvailableQuantity(jobOrder.id).toFixed(2)} kg</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="received_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received Quantity (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the quantity being received in kilograms
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional notes about this receiving order
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/production/rolls")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || !selectedJobOrder}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <PackageCheck className="mr-2 h-4 w-4" />
                        Create Receiving Order
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Recent receiving orders list */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Receiving Orders</CardTitle>
            <CardDescription>
              Recently completed receiving orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!receivingOrders || receivingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No receiving orders recorded yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Job Order</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivingOrders.slice(0, 10).map((order) => {
                    const jobOrder = getJobOrderDetails(order.job_order_id);
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          {format(new Date(order.received_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">JO-{order.job_order_id}</div>
                          <div className="text-sm text-muted-foreground">
                            {jobOrder 
                              ? getCustomerName(jobOrder.customer_id)
                              : 'Unknown Customer'}
                          </div>
                        </TableCell>
                        <TableCell>{order.received_quantity} kg</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // Print receiving order form
                              const jobOrder = jobOrders?.find(jo => jo.id === order.job_order_id);
                              const customer = jobOrder ? customers?.find(c => c.id === jobOrder.customer_id) : null;
                              const receivingDate = new Date(order.received_date);
                              
                              try {
                                import('@/utils/pdf').then(({ generateSimplePdf }) => {
                                  try {
                                    const data = [
                                      ["Receiving Order ID", `RO-${order.id}`],
                                      ["Date", format(receivingDate, "MMMM d, yyyy")],
                                      ["Job Order", `JO-${order.job_order_id}`],
                                      ["Customer", customer?.name || 'Unknown Customer'],
                                      ["Quantity Received", `${order.received_quantity} kg`],
                                      ["Received By", user?.name || 'Unknown User'],
                                      ["Notes", order.notes || 'None']
                                    ];
                                    
                                    generateSimplePdf(
                                      `Receiving Order #${order.id}`,
                                      ["Property", "Value"],
                                      data
                                    );
                                    
                                    toast({
                                      title: "Printing",
                                      description: `Receiving Order #${order.id} form has been sent to printer.`,
                                    });
                                  } catch (error) {
                                    console.error("Error generating PDF:", error);
                                    toast({
                                      title: "Error",
                                      description: "There was an error generating the PDF. Please try again.",
                                      variant: "destructive"
                                    });
                                  }
                                }).catch(error => {
                                  console.error("Error importing PDF module:", error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to load PDF generation module. Please try again.",
                                    variant: "destructive"
                                  });
                                });
                              } catch (error) {
                                console.error("Unexpected error:", error);
                                toast({
                                  title: "Error",
                                  description: "An unexpected error occurred. Please try again.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={() => navigate("/production/receiving-orders")}
            >
              View All Receiving Orders
            </Button>
          </CardFooter>
        </Card>
      </div>
    </motion.div>
  );
}