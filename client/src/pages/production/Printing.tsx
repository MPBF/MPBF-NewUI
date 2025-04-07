import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, Printer, Scissors, Package, PackageOpen, AlertCircle } from "lucide-react";
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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WasteDisplay } from "@/components/ui/WasteDisplay";

// Utils
import { apiRequest } from "@/lib/queryClient";
import { fadeIn, slideFromRight } from "@/utils/animations";
import { t } from "@/utils/language";
import { calculateStageWaste, calculateStageWastePercentage } from "@/utils/waste-calculator";

// Form schema for updating a roll in the printing stage
const formSchema = z.object({
  printing_qty: z.coerce.number().min(0, "Quantity must be positive"),
  status: z.string(),
  notes: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Printing() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const rollId = id ? parseInt(id) : undefined;

  // Load roll data
  const { data: roll, isLoading: isLoadingRoll } = useQuery({
    queryKey: ['/api/rolls', rollId],
    queryFn: async () => {
      return await apiRequest<Roll>(`GET`, `/api/rolls/${rollId}`);
    },
    enabled: !!rollId,
  });

  // Load job order details
  const { data: jobOrder, isLoading: isLoadingJobOrder } = useQuery({
    queryKey: ['/api/job-orders', roll?.job_order_id],
    queryFn: async () => {
      return await apiRequest<JobOrder>(`GET`, `/api/job-orders/${roll?.job_order_id}`);
    },
    enabled: !!roll?.job_order_id,
  });
  
  // Log to check if the job order is being loaded correctly
  useEffect(() => {
    if (jobOrder) {
      console.log("Job Order loaded successfully:", jobOrder);
    }
  }, [jobOrder]);
  
  // Load customers for labels
  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      return await apiRequest<any[]>('GET', '/api/customers');
    },
  });
  
  // Load users for the print label
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      return await apiRequest<any[]>('GET', '/api/users');
    },
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      printing_qty: 0,
      status: 'For Cutting', // This should be the default
      notes: '',
    },
  });
  
  // Force set the default status to "For Cutting" after form initialization
  useEffect(() => {
    if (form) {
      console.log("Setting initial default status to For Cutting");
      form.setValue('status', 'For Cutting');
    }
  }, [form]);

  // Initialize form with roll data
  useEffect(() => {
    if (roll) {
      // For a new roll being processed through printing, 
      // explicitly set the default status to "For Cutting"
      const defaultStatus = roll.status === 'For Printing' ? 'For Cutting' : roll.status;
      
      console.log("Initializing form with status:", defaultStatus);
      
      form.reset({
        printing_qty: roll.printing_qty || 0,
        status: defaultStatus,
        notes: roll.notes,
      });
    }
  }, [roll, form]);

  // Update roll mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      if (rollId) {
        return await apiRequest('PATCH', `/api/rolls/${rollId}`, values);
      }
      throw new Error("Roll ID is required for printing stage");
    },
    onSuccess: (data, variables) => {
      // Customize message based on the status
      let message = "The roll has been updated";
      switch (variables.status) {
        case 'For Cutting':
          message += " and is now ready for cutting.";
          break;
        case 'For Receiving':
          message += " and is now ready for receiving in the warehouse.";
          break;
        case 'Damage':
          message += " and has been marked as damaged.";
          break;
        default:
          message += ".";
      }

      toast({
        title: "Printing process recorded",
        description: message,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/rolls'] });
      
      // Navigate back to the rolls list
      navigate("/production/rolls");
    },
    onError: (error) => {
      console.error("Error updating roll:", error);
      toast({
        title: "Error",
        description: "There was an error updating the roll. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // Validate the printing quantity
    if (!roll) return;
    
    // Ensure printing quantity is not greater than extruding quantity
    if (roll.extruding_qty && values.printing_qty > roll.extruding_qty) {
      toast({
        title: "Quantity exceeds limit",
        description: `The printing quantity (${values.printing_qty}) cannot exceed the extruding quantity (${roll.extruding_qty}).`,
        variant: "destructive",
      });
      return;
    }
    
    // Add some validation to prevent accidental zero quantities
    if (values.printing_qty === 0) {
      toast({
        title: "Warning: Zero quantity",
        description: "You are about to submit a zero printing quantity. Continue only if this is intentional.",
        variant: "destructive",
      });
      // Allow submission to continue despite the warning
    }
    
    // Always default to 'For Cutting' if not explicitly set to something else
    // This ensures the correct default value is used
    if (!values.status || values.status === '') {
      console.log("Setting default status: For Cutting");
      values.status = 'For Cutting';
      form.setValue('status', 'For Cutting');
    }
    
    // Calculate waste (but don't add to notes - just for display)
    const waste = calculateStageWaste(roll.extruding_qty, values.printing_qty);
    const wastePercentage = calculateStageWastePercentage(roll.extruding_qty, values.printing_qty);
    
    if (waste !== null && waste > 0) {
      toast({
        title: "Printing Waste Calculated",
        description: `Waste from extruding to printing: ${waste.toFixed(1)} kg (${wastePercentage?.toFixed(1)}%)`,
      });
    }
    
    // Proceed with the mutation
    mutate(values);
  };

  // Loading state
  if (isLoadingRoll || isLoadingJobOrder) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Error state - roll not found
  if (!roll) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          The specified roll could not be found or is not ready for printing.
        </AlertDescription>
      </Alert>
    );
  }

  // Validation - check if roll is in correct status for printing
  if (roll.status !== 'For Printing' && roll.status !== 'Printing' && roll.status !== 'QC Issue') {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertTitle>Invalid Roll Status</AlertTitle>
        <AlertDescription>
          This roll is not currently in the printing stage.
          Current status: {roll.status}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeIn}
      className="max-w-4xl mx-auto py-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Printing Process</h1>
          <p className="text-muted-foreground mt-1">
            Record the printing details for Roll #{roll.roll_number}
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          {roll && (
            <Button
              variant="outline"
              onClick={() => {
                // We already have the jobOrder data from the query above
                // No need to search in jobOrders array
                
                // Log data for debugging
                console.log("jobOrder:", jobOrder);
                console.log("customers:", customers);
                
                // Find customer for this job order
                const customer = jobOrder && jobOrder.customer_id && customers ? 
                  customers.find(c => c.id === jobOrder.customer_id) : null;
                
                // Find the logged-in user or use a default value
                const currentUser = users ? users.find(u => u.id === 1) : null;
                
                const rollData = {
                  rollId: roll.roll_identification,
                  rollNumber: roll.roll_number,
                  orderId: jobOrder ? jobOrder.order_id : 0,
                  customerName: customer ? customer.name : 'Unknown Customer',
                  status: roll.status,
                  createdBy: currentUser ? currentUser.name : 'Factory Staff',
                  createdDate: format(new Date(roll.created_date || new Date()), 'MMM d, yyyy'),
                  weight: roll.printing_qty ? `${roll.printing_qty} kg` : (roll.extruding_qty ? `${roll.extruding_qty} kg` : undefined)
                };
                
                // Log the final data before generating the label
                console.log("Generating roll label with data:", rollData);
                
                // Import dynamically to avoid issues with SSR
                import('@/utils/pdf').then(async ({ generateRollLabel }) => {
                  try {
                    await generateRollLabel(rollData);
                    toast({
                      title: "Printing Label",
                      description: `Label for Roll #${roll.roll_number} is being sent to printer.`,
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
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Printing Details</CardTitle>
            <CardDescription>
              Enter the information about the printing process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground">Roll Identification</p>
                    <p className="font-medium">{roll.roll_identification}</p>
                  </div>
                  <div className="p-4 border rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground">Extruding Quantity</p>
                    <p className="font-medium">{roll.extruding_qty || 'Not recorded'}</p>
                  </div>
                  
                  {/* Show waste information if we have both extruding and printing quantities */}
                  {roll.extruding_qty !== null && roll.printing_qty !== null && (
                    <div className="p-4 border rounded-md bg-muted/50 md:col-span-2">
                      <p className="text-sm text-muted-foreground">Current Waste</p>
                      <div className="mt-1">
                        <WasteDisplay 
                          waste={calculateStageWaste(roll.extruding_qty, roll.printing_qty) || 0} 
                          percentage={calculateStageWastePercentage(roll.extruding_qty, roll.printing_qty) || 0}
                          stage="printing"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="printing_qty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Printing Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the quantity after the printing process
                      </FormDescription>
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
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="For Cutting">For Cutting</SelectItem>
                          <SelectItem value="For Receiving">For Receiving</SelectItem>
                          <SelectItem value="Damage">Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Set the current status of this roll
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
                        Optional notes about the printing process
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Record Printing
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Side panel with workflow and job order details */}
        <motion.div variants={slideFromRight} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Production Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-muted text-muted-foreground rounded-full p-2">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Extruding</p>
                    <p className="text-sm text-muted-foreground">Complete</p>
                  </div>
                  <Badge variant="outline">Done</Badge>
                </div>
                <Separator />
                <div className="flex items-center space-x-2">
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <Printer className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Printing</p>
                    <p className="text-sm text-muted-foreground">Current stage</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <Separator />
                <div className="flex items-center space-x-2">
                  <div className="bg-muted text-muted-foreground rounded-full p-2">
                    <Scissors className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Cutting</p>
                    <p className="text-sm text-muted-foreground">Next stage</p>
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

          {jobOrder && (
            <Card>
              <CardHeader>
                <CardTitle>Job Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Job Order ID</p>
                  <p className="font-medium">JO-{jobOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                  <p className="font-medium">{jobOrder.quantity} units</p>
                </div>
                {jobOrder.size_details && (
                  <div>
                    <p className="text-sm text-muted-foreground">Size Details</p>
                    <p className="font-medium">{jobOrder.size_details}</p>
                  </div>
                )}
                {jobOrder.raw_material && (
                  <div>
                    <p className="text-sm text-muted-foreground">Raw Material</p>
                    <p className="font-medium">{jobOrder.raw_material}</p>
                  </div>
                )}
                {jobOrder.mast_batch && (
                  <div>
                    <p className="text-sm text-muted-foreground">Mast Batch</p>
                    <p className="font-medium">{jobOrder.mast_batch}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Is Printed</p>
                  <p className="font-medium">
                    {jobOrder.is_printed ? "Yes" : "No"}
                  </p>
                </div>
                {jobOrder.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{jobOrder.notes}</p>
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