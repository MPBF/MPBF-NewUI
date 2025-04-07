import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, Printer, Scissors, Package, PackageOpen, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Utils
import { apiRequest } from "@/lib/queryClient";
import { fadeIn, slideFromRight } from "@/utils/animations";
import { t } from "@/utils/language";
import { useAuth } from "@/utils/auth";

// Form schema for creating/updating a roll in the extruding stage
const formSchema = z.object({
  job_order_id: z.number(),
  status: z.string(),
  extruding_qty: z.coerce.number().min(0, "Quantity must be positive"),
  roll_number: z.coerce.number().min(1, "Roll number is required").default(1),
  notes: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Extruding() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const rollId = id ? parseInt(id) : undefined;
  const { user } = useAuth(); // Get the current user from auth context

  // State for job order selection
  const [selectedJobOrder, setSelectedJobOrder] = useState<number | null>(null);
  
  // State for job order selector visibility
  const [showJobOrderSelector, setShowJobOrderSelector] = useState(false);
  
  // State for generated roll identification
  const [generatedRollId, setGeneratedRollId] = useState<string>("");

  // Load roll data in edit mode
  const { data: roll, isLoading: isLoadingRoll } = useQuery({
    queryKey: ['/api/rolls', rollId],
    queryFn: () => apiRequest<Roll>('GET', `/api/rolls/${rollId}`),
    enabled: !!rollId,
  });

  // Load job orders for selection
  const { data: jobOrders, isLoading: isLoadingJobOrders } = useQuery({
    queryKey: ['/api/job-orders'],
    queryFn: () => apiRequest<JobOrder[]>('GET', '/api/job-orders'),
  });
  
  // Load customers for reference
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => apiRequest<any[]>('GET', '/api/customers'),
  });
  
  // Load items for reference
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/items'],
    queryFn: () => apiRequest<any[]>('GET', '/api/items'),
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      job_order_id: 0,
      status: 'For Printing',
      extruding_qty: 0,
      roll_number: 1,
      notes: '',
    },
  });

  // Initialize form with roll data if in edit mode
  useEffect(() => {
    if (roll) {
      form.reset({
        job_order_id: roll.job_order_id,
        status: roll.status,
        extruding_qty: roll.extruding_qty || 0,
        roll_number: roll.roll_number,
        notes: roll.notes,
      });
      setSelectedJobOrder(roll.job_order_id);
    }
  }, [roll, form]);
  
  // Generate roll identification when job order and roll number change
  useEffect(() => {
    const jobOrderId = form.getValues("job_order_id");
    const rollNumber = form.getValues("roll_number");
    
    if (jobOrderId && rollNumber) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      // Format: JO{jobOrderId}-R{rollNumber}-{YYYYMMDD}
      const newRollId = `JO${jobOrderId}-R${rollNumber}-${year}${month}${day}`;
      setGeneratedRollId(newRollId);
    }
  }, [form, selectedJobOrder]);

  // Create or update roll mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditMode && rollId) {
        return await apiRequest('PATCH', `/api/rolls/${rollId}`, values);
      } else {
        return await apiRequest('POST', '/api/rolls', values);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "Roll updated successfully" : "Roll created successfully",
        description: `The roll has been ${isEditMode ? 'updated' : 'created'} and is now ready for printing.`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/rolls'] });
      
      // Navigate back to the rolls list
      navigate("/production/rolls");
    },
    onError: (error) => {
      console.error("Error saving roll:", error);
      toast({
        title: "Error",
        description: "There was an error saving the roll. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // Check if the quantity exceeds the remaining job order quantity
    if (jobOrderDetails) {
      const remainingQty = calculateRemainingQuantity(values.job_order_id, jobOrderDetails.quantity);
      
      // In edit mode, we need to check against the original value plus remaining
      if (isEditMode && roll) {
        // Allow the current roll's quantity to be modified up to the original quantity + remaining
        const originalQty = roll.extruding_qty || 0;
        const maxAllowedQty = originalQty + remainingQty;
        
        if (values.extruding_qty > maxAllowedQty) {
          toast({
            title: "Quantity exceeds limit",
            description: `The quantity (${values.extruding_qty}) exceeds the maximum allowed (${maxAllowedQty.toFixed(2)}).`,
            variant: "destructive",
          });
          return;
        }
      } else if (!isEditMode && values.extruding_qty > remainingQty) {
        // For new rolls, just check against remaining quantity
        toast({
          title: "Quantity exceeds limit",
          description: `The quantity (${values.extruding_qty}) exceeds the remaining job order quantity (${remainingQty.toFixed(2)}).`,
          variant: "destructive",
        });
        return;
      }
    }
    
    // If we're creating a new roll, add the generated roll identification
    if (!isEditMode) {
      // Get current user ID from auth context
      const userId = user?.id;
      
      // Add roll identification to the submission
      const submitData = {
        ...values,
        roll_identification: generatedRollId,
        created_by: userId,
        extruded_by: userId,
        extruded_date: new Date()
      };
      
      mutate(submitData);
    } else {
      // For editing, we'll only update the provided fields
      mutate(values);
    }
  };

  // Get the job order details
  const getJobOrderDetails = (jobOrderId: number) => {
    if (!jobOrders) return null;
    return jobOrders.find(jo => jo.id === jobOrderId);
  };
  
  const getCustomerName = (customerId: number): string => {
    if (!customers) return 'Unknown Customer';
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };
  
  const getItemName = (itemId: number): string => {
    if (!items) return 'Unknown Item';
    const item = items.find(i => i.id === itemId);
    return item ? item.pcid || `Item-${item.id}` : 'Unknown Item';
  };
  
  // Load rolls data
  const { data: rolls } = useQuery({
    queryKey: ['/api/rolls'],
    queryFn: () => apiRequest<Roll[]>('GET', '/api/rolls'),
  });
  
  // Calculate the remaining quantity for a job order
  const calculateRemainingQuantity = (jobOrderId: number, totalQuantity: number) => {
    if (!rolls) return totalQuantity;
    
    // Calculate total extruded quantity for this job order
    const jobOrderRolls = rolls.filter(roll => roll.job_order_id === jobOrderId);
    
    // When editing, exclude the current roll's quantity from the calculation
    let totalExtrudedQty = 0;
    if (isEditMode && roll) {
      totalExtrudedQty = jobOrderRolls.reduce((sum, r) => {
        // Skip the current roll being edited
        if (r.id === roll.id) return sum;
        return sum + (r.extruding_qty || 0);
      }, 0);
    } else {
      totalExtrudedQty = jobOrderRolls.reduce((sum, r) => 
        sum + (r.extruding_qty || 0), 0);
    }
    
    return Math.max(0, totalQuantity - totalExtrudedQty);
  };

  // Loading state
  if ((isEditMode && isLoadingRoll) || isLoadingJobOrders || isLoadingCustomers || isLoadingItems) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Get job order details for the selected job
  const jobOrderDetails = selectedJobOrder ? getJobOrderDetails(selectedJobOrder) : null;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeIn}
      className="max-w-4xl mx-auto py-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit Extruding Process" : "New Extruding Process"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode
              ? `Update the extruding details for Roll #${roll?.roll_number || ''}`
              : "Create a new roll and record the extruding process"}
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          {isEditMode && roll && (
            <Button
              variant="outline"
              onClick={() => {
                const rollData = {
                  rollId: roll.roll_identification,
                  rollNumber: roll.roll_number,
                  orderId: jobOrderDetails?.order_id || 0,
                  customerName: jobOrderDetails?.customer_id ? 
                    getCustomerName(jobOrderDetails.customer_id)
                    : 'Unknown',
                  status: roll.status,
                  createdBy: user?.name || 'System', // Use current user's name
                  createdDate: format(new Date(roll.created_date || new Date()), 'MMM d, yyyy'),
                  weight: roll.extruding_qty ? `${roll.extruding_qty} kg` : undefined
                };
                
                // Import dynamically to avoid issues with SSR
                import('@/utils/pdf').then(({ generateRollLabel }) => {
                  generateRollLabel(rollData);
                  toast({
                    title: "Printing Label",
                    description: `Label for Roll #${roll.roll_number} is being sent to printer.`,
                  });
                });
              }}
              className="flex items-center"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Label
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate("/production/rolls")}
          >
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main form */}
        <Card className="md:col-span-2 shadow-md border-primary/10">
          <CardHeader className="bg-card text-card-foreground border-b">
            <CardTitle className="flex items-center text-xl">
              <Package className="h-5 w-5 mr-2 text-primary" />
              Extruding Details
            </CardTitle>
            <CardDescription>
              Enter the information about the extruding process
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {isEditMode && roll ? (
                  <div className="p-4 rounded-md bg-muted/30 border border-primary/20 shadow-sm mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Roll Identification</p>
                        <p className="text-base font-semibold text-primary">{roll.roll_identification}</p>
                      </div>
                      <Badge variant="outline" className="text-primary border-primary/30">
                        Roll #{roll.roll_number}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-md bg-primary/5 border border-primary/20 shadow-sm mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Auto-Generated Roll ID</p>
                        <p className="text-base font-semibold text-primary">
                          {generatedRollId || "Will be generated based on selection"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-sm text-muted-foreground border-muted">
                        Format: JO#-R#-Date
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Reorganized form layout */}
                {/* Row 1: Job Order - Custom Selection Interface */}
                <FormField
                  control={form.control}
                  name="job_order_id"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Job Order</FormLabel>
                      <div className="relative">
                        {isEditMode ? (
                          // In edit mode, just show the selected job order details
                          <div className="w-full p-3 rounded-md border shadow-sm cursor-not-allowed bg-muted/30">
                            {jobOrderDetails ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="font-medium text-primary mr-2">JO #{jobOrderDetails.id}</span>
                                  <Badge variant="outline" className="text-xs px-2 py-0 bg-primary/5">
                                    {items?.find(i => i.id === jobOrderDetails.item_id)?.pcid || 'N/A'}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {customers?.find(c => c.id === jobOrderDetails.customer_id)?.name || 'Unknown Customer'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No job order selected</span>
                            )}
                          </div>
                        ) : (
                          <>
                            {/* Job Order Selector Trigger Button */}
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-between"
                              onClick={() => setShowJobOrderSelector(true)}
                            >
                              {field.value ? (
                                <div className="flex items-center">
                                  <span className="font-medium text-primary mr-2">
                                    JO #{field.value}
                                  </span>
                                  {jobOrderDetails && (
                                    <Badge variant="outline" className="text-xs bg-primary/5">
                                      {items?.find(i => i.id === jobOrderDetails.item_id)?.pcid || 'N/A'}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Select a job order</span>
                              )}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 opacity-50"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </Button>
                            
                            {/* Custom Job Order Selector */}
                            {showJobOrderSelector && (
                              <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-4 pt-16 md:pt-[15vh]">
                                <div 
                                  className="fixed inset-0 bg-black/50"
                                  onClick={() => setShowJobOrderSelector(false)}
                                ></div>
                                <div className="bg-background rounded-md shadow-lg w-[90%] max-w-[600px] max-h-[70vh] z-50 overflow-hidden flex flex-col">
                                  {/* Header */}
                                  <div className="flex items-center justify-between p-4 border-b">
                                    <h3 className="text-lg font-medium">Select Job Order</h3>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setShowJobOrderSelector(false)}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </Button>
                                  </div>
                                  
                                  {/* Search Input (future enhancement) */}
                                  <div className="p-4 border-b">
                                    <Input
                                      placeholder="Search job orders..."
                                      // Future enhancement: search functionality
                                      className="w-full"
                                    />
                                  </div>
                                  
                                  {/* Job Order List */}
                                  <div className="overflow-y-auto p-2">
                                    {jobOrders
                                      ?.filter(jobOrder => 
                                        // Only show job orders that are not completed
                                        jobOrder.status !== "Completed" && 
                                        // Calculate remaining quantity to ensure there's something to produce
                                        calculateRemainingQuantity(jobOrder.id, jobOrder.quantity) > 0
                                      )
                                      .map((jobOrder) => {
                                        // Get the item details
                                        const item = items?.find(i => i.id === jobOrder.item_id);
                                        // Get the customer details
                                        const customer = customers?.find(c => c.id === jobOrder.customer_id);
                                        // Calculate remaining quantity
                                        const balanceQty = calculateRemainingQuantity(jobOrder.id, jobOrder.quantity);
                                        
                                        return (
                                          <div
                                            key={jobOrder.id}
                                            className={`p-3 mb-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors ${
                                              field.value === jobOrder.id ? 'bg-primary/10 border-primary' : 'bg-card'
                                            }`}
                                            onClick={() => {
                                              const jobOrderId = jobOrder.id;
                                              field.onChange(jobOrderId);
                                              setSelectedJobOrder(jobOrderId);
                                              
                                              // Auto-populate extruding quantity from job order remaining quantity
                                              const remainingQty = calculateRemainingQuantity(jobOrderId, jobOrder.quantity);
                                              form.setValue("extruding_qty", remainingQty);
                                              
                                              // Close the selector
                                              setShowJobOrderSelector(false);
                                            }}
                                          >
                                            <div className="flex justify-between items-center mb-2">
                                              <div className="flex items-center space-x-2">
                                                <Badge className="px-2 py-0.5" variant="outline">JO #{jobOrder.id}</Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                  {item?.pcid || 'N/A'}
                                                </Badge>
                                              </div>
                                              <Badge variant={jobOrder.status === 'Processing' ? 'default' : 'outline'}>
                                                {jobOrder.status}
                                              </Badge>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                                              <div>
                                                <p className="text-xs text-muted-foreground">Customer</p>
                                                <p className="font-medium truncate">{customer?.name || 'Unknown'}</p>
                                              </div>
                                              
                                              <div>
                                                <p className="text-xs text-muted-foreground">Available Balance</p>
                                                <p className="font-bold text-primary">{balanceQty.toFixed(2)} kg</p>
                                              </div>
                                              
                                              <div>
                                                <p className="text-xs text-muted-foreground">Product</p>
                                                <p className="font-medium truncate">{item?.product_name || 'N/A'}</p>
                                              </div>
                                              
                                              <div>
                                                <p className="text-xs text-muted-foreground">Size Details</p>
                                                <p className="font-medium truncate">{jobOrder.size_details || 'N/A'}</p>
                                              </div>
                                              
                                              {jobOrder.raw_material && (
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Raw Material</p>
                                                  <p className="font-medium truncate">{jobOrder.raw_material}</p>
                                                </div>
                                              )}
                                              
                                              {jobOrder.mast_batch && (
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Mast Batch</p>
                                                  <p className="font-medium truncate">{jobOrder.mast_batch}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    }
                                    
                                    {/* Empty state */}
                                    {!jobOrders || jobOrders.filter(jo => 
                                      jo.status !== "Completed" && 
                                      calculateRemainingQuantity(jo.id, jo.quantity) > 0
                                    ).length === 0 ? (
                                      <div className="p-8 text-center">
                                        <p className="text-muted-foreground">No available job orders found</p>
                                      </div>
                                    ) : null}
                                  </div>
                                  
                                  {/* Footer Actions */}
                                  <div className="p-4 border-t flex justify-end space-x-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => setShowJobOrderSelector(false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        // Just close without changing anything if no selection
                                        setShowJobOrderSelector(false);
                                      }}
                                      disabled={!field.value}
                                    >
                                      Confirm Selection
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Show job order summary info if selected */}
                      {field.value > 0 && !isEditMode && (
                        <div className="mt-2 p-2 rounded bg-muted/20 text-sm">
                          {jobOrderDetails && (
                            <div className="flex flex-col">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Customer:</span>
                                <span className="font-medium truncate max-w-[200px]">
                                  {customers?.find(c => c.id === jobOrderDetails.customer_id)?.name || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Available:</span>
                                <span className="font-medium text-primary">
                                  {calculateRemainingQuantity(jobOrderDetails.id, jobOrderDetails.quantity).toFixed(2)} kg
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <FormDescription>
                        Select the job order for this roll
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Row 2: Quantity, Roll Number, and Status - all on one line */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="extruding_qty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="font-medium"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="roll_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll Number</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            className="font-medium"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="w-[180px]" side="bottom">
                            <SelectItem value="For Printing">For Printing</SelectItem>
                            <SelectItem value="Damage">Damage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 3: Notes - small text box */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional notes about this extruding process"
                          className="min-h-[60px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={isPending}
                    size="lg"
                    className="font-medium"
                  >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? "Update Roll" : "Create Roll"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Side panel with job order details */}
        <motion.div variants={slideFromRight} className="space-y-6">
          <Card className="border-primary/5 shadow-sm">
            <CardHeader className="bg-card border-b pb-3">
              <CardTitle className="text-lg font-medium flex items-center">
                <PackageOpen className="h-4 w-4 mr-2 text-primary" />
                Production Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Extruding</p>
                    <p className="text-sm text-muted-foreground">Current stage</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <Separator />
                <div className="flex items-center space-x-2">
                  <div className="bg-muted text-muted-foreground rounded-full p-2">
                    <Printer className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Printing</p>
                    <p className="text-sm text-muted-foreground">Next stage</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <Separator />
                <div className="flex items-center space-x-2">
                  <div className="bg-muted text-muted-foreground rounded-full p-2">
                    <Scissors className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Cutting</p>
                    <p className="text-sm text-muted-foreground">Third stage</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <Separator />
                <div className="flex items-center space-x-2">
                  <div className="bg-muted text-muted-foreground rounded-full p-2">
                    <PackageOpen className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Receiving</p>
                    <p className="text-sm text-muted-foreground">Final stage</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {jobOrderDetails && (
            <Card className="border-primary/5 shadow-sm">
              <CardHeader className="bg-card border-b pb-3">
                <CardTitle className="text-lg font-medium flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2 text-primary" />
                  Job Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="bg-muted/20 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">Job Order ID</p>
                  <p className="font-medium">JO-{jobOrderDetails.id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Quantity</p>
                    <p className="font-medium">{jobOrderDetails.quantity} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Quantity</p>
                    <div className="flex items-center">
                      <p className="font-medium text-primary">
                        {calculateRemainingQuantity(jobOrderDetails.id, jobOrderDetails.quantity)} kg
                      </p>
                      {calculateRemainingQuantity(jobOrderDetails.id, jobOrderDetails.quantity) <= 0 && (
                        <Badge className="ml-2" variant="destructive">Completed</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />
                
                {jobOrderDetails.size_details && (
                  <div>
                    <p className="text-sm text-muted-foreground">Size Details</p>
                    <p className="font-medium">{jobOrderDetails.size_details}</p>
                  </div>
                )}
                {jobOrderDetails.raw_material && (
                  <div>
                    <p className="text-sm text-muted-foreground">Raw Material</p>
                    <p className="font-medium">{jobOrderDetails.raw_material}</p>
                  </div>
                )}
                {jobOrderDetails.mast_batch && (
                  <div>
                    <p className="text-sm text-muted-foreground">Mast Batch</p>
                    <p className="font-medium">{jobOrderDetails.mast_batch}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Is Printed</p>
                  <p className="font-medium">
                    {jobOrderDetails.is_printed ? "Yes" : "No"}
                  </p>
                </div>
                {jobOrderDetails.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{jobOrderDetails.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Type definitions
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