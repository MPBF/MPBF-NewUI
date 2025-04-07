import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, Printer, Scissors, Package, CheckCircle2, PackageOpen } from "lucide-react";
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
import { calculateStageWaste, calculateStageWastePercentage, calculateJobOrderWaste, calculateJobOrderWastePercentage, calculateCumulativeCuttingWaste, calculateCumulativeCuttingWastePercentage } from "@/utils/waste-calculator";
import { WasteDisplay } from "@/components/ui/WasteDisplay";

// Form schema for updating a roll in the cutting stage
const formSchema = z.object({
  cutting_qty: z.coerce.number().min(0, "Quantity must be positive"),
  status: z.string(),
  notes: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Cutting() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const rollId = id ? parseInt(id) : undefined;

  // Load roll data
  const { data: roll, isLoading: isLoadingRoll } = useQuery({
    queryKey: ['/api/rolls', rollId],
    queryFn: () => apiRequest<Roll>('GET', `/api/rolls/${rollId}`),
    enabled: !!rollId,
  });

  // Load job order details
  const { data: jobOrder, isLoading: isLoadingJobOrder } = useQuery({
    queryKey: ['/api/job-orders', roll?.job_order_id],
    queryFn: () => apiRequest<JobOrder>('GET', `/api/job-orders/${roll?.job_order_id}`),
    enabled: !!roll?.job_order_id,
  });
  
  // Load all rolls for this job order to calculate total waste
  const { data: jobOrderRolls } = useQuery({
    queryKey: ['/api/rolls/by-job-order', roll?.job_order_id],
    queryFn: () => apiRequest<Roll[]>('GET', `/api/rolls?jobOrderId=${roll?.job_order_id}`),
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
    queryFn: () => apiRequest<any[]>('GET', '/api/customers'),
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cutting_qty: 0,
      status: 'For Receiving', // Updated: using "For Receiving" for the receiving stage
      notes: '',
    },
  });

  // Initialize form with roll data
  useEffect(() => {
    if (roll) {
      form.reset({
        cutting_qty: roll.cutting_qty || 0,
        status: roll.status,
        notes: roll.notes,
      });
    }
  }, [roll, form]);

  // Update roll mutation with waste calculation
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!rollId || !roll) {
        throw new Error("Roll ID is required for cutting stage");
      }
      
      // Calculate waste if extruding_qty is available
      let updatedValues = { ...values };
      let wasteInfo = "";
      
      if (roll.extruding_qty) {
        // Calculate waste
        const waste = Math.max(0, roll.extruding_qty - values.cutting_qty);
        const wastePercentage = (waste / roll.extruding_qty) * 100;
        
        // Format waste information
        wasteInfo = `Waste: ${waste.toFixed(1)} kg (${wastePercentage.toFixed(1)}%)`;
        
        // Update notes with waste information
        updatedValues.notes = values.notes 
          ? `${values.notes}\n${wasteInfo}`
          : wasteInfo;
          
        // We don't auto-change status - we use what the user selected in the form.
        // This preserves the user's choice between "For Receiving" and "Damage"
      }
      
      // Make API request with updated values
      return await apiRequest('PATCH', `/api/rolls/${rollId}`, updatedValues);
    },
    onSuccess: (data, variables) => {
      // Check if we have extruding quantity to calculate waste
      if (roll?.extruding_qty) {
        const waste = Math.max(0, roll.extruding_qty - variables.cutting_qty);
        const wastePercentage = (waste / roll.extruding_qty) * 100;
        
        if (variables.status === "Damage") {
          toast({
            title: "Cutting Complete - Marked as Damaged",
            description: `Roll marked as Damaged. Waste calculated: ${waste.toFixed(1)} kg (${wastePercentage.toFixed(1)}%)`,
          });
        } else {
          toast({
            title: "Cutting Complete",
            description: `Roll marked as ${variables.status}. Waste calculated: ${waste.toFixed(1)} kg (${wastePercentage.toFixed(1)}%)`,
          });
        }
      } else {
        toast({
          title: "Cutting process recorded",
          description: `The roll has been processed and is now ${variables.status === "Damage" ? "marked as damaged" : "ready for receiving"}.`,
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/rolls'] });
      
      // Navigate back to the rolls management page
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
    // Validate the cutting quantity
    if (!roll) return;
    
    // Get the source quantity based on what's available
    const sourceQty = roll.printing_qty || roll.extruding_qty;
    
    // Ensure cutting quantity is not greater than source quantity
    if (sourceQty && values.cutting_qty > sourceQty) {
      toast({
        title: "Quantity exceeds limit",
        description: `The cutting quantity (${values.cutting_qty}) cannot exceed the ${roll.printing_qty ? 'printing' : 'extruding'} quantity (${sourceQty}).`,
        variant: "destructive",
      });
      return;
    }
    
    // Add some validation to prevent accidental zero quantities
    if (values.cutting_qty === 0) {
      toast({
        title: "Warning: Zero quantity",
        description: "You are about to submit a zero cutting quantity. Continue only if this is intentional.",
        variant: "destructive",
      });
      // Allow submission to continue despite the warning
    }
    
    // Automatically set to 'For Receiving' when cutting is completed
    // unless the user explicitly chose 'Damage' or 'QC Issue'
    if (values.status !== 'Damage' && values.status !== 'QC Issue') {
      values.status = 'For Receiving';
    }
    
    // Calculate waste (but don't add to notes - just for display)
    // Use printing quantity if available, otherwise use extruding quantity
    const waste = roll.printing_qty 
      ? calculateStageWaste(roll.printing_qty, values.cutting_qty)
      : calculateStageWaste(roll.extruding_qty, values.cutting_qty);
      
    const wastePercentage = roll.printing_qty 
      ? calculateStageWastePercentage(roll.printing_qty, values.cutting_qty)
      : calculateStageWastePercentage(roll.extruding_qty, values.cutting_qty);
    
    if (waste !== null && waste > 0) {
      toast({
        title: "Cutting Waste Calculated",
        description: `Waste from ${roll.printing_qty ? 'printing' : 'extruding'} to cutting: ${waste.toFixed(1)} kg (${wastePercentage?.toFixed(1)}%)`,
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
          The specified roll could not be found or is not ready for cutting.
        </AlertDescription>
      </Alert>
    );
  }

  // Validation - check if roll is in correct status for cutting or already has printing data
  // Note: We allow cutting for rolls with 'For Printing' status if they already have printing data
  if (roll.status !== 'For Cutting' && roll.status !== 'Cutting' && roll.status !== 'QC Issue' && 
      !(roll.status === 'For Printing' && roll.printing_qty !== null)) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertTitle>Invalid Roll Status</AlertTitle>
        <AlertDescription>
          This roll is not currently in the cutting stage.
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
          <h1 className="text-3xl font-bold tracking-tight">Cutting Process</h1>
          <p className="text-muted-foreground mt-1">
            Record the cutting details for Roll #{roll.roll_number}
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
                
                const rollData = {
                  rollId: roll.roll_identification,
                  rollNumber: roll.roll_number,
                  orderId: jobOrder ? jobOrder.order_id : 0,
                  customerName: customer ? customer.name : 'Unknown',
                  status: roll.status,
                  createdBy: queryClient.getQueryData<any[]>(['/api/users'])?.find(u => u.id === 1)?.name || 'System',
                  createdDate: format(new Date(roll.created_date || new Date()), 'MMM d, yyyy'),
                  weight: roll.cutting_qty ? `${roll.cutting_qty} kg` : 
                          (roll.printing_qty ? `${roll.printing_qty} kg` : 
                          (roll.extruding_qty ? `${roll.extruding_qty} kg` : undefined))
                };
                
                // Log the final data before generating the label
                console.log("Generating roll label with data:", rollData);
                
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
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Cutting Details</CardTitle>
            <CardDescription>
              Enter the information about the cutting process
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
                    <p className="text-sm text-muted-foreground">
                      {roll.printing_qty ? 'Printing Quantity' : 'Extruding Quantity'}
                    </p>
                    <p className="font-medium">
                      {roll.printing_qty || roll.extruding_qty || 'Not recorded'}
                    </p>
                  </div>
                  
                  {/* Show current waste from previous stage to cutting */}
                  {((roll.printing_qty !== null || roll.extruding_qty !== null) && form.watch('cutting_qty') > 0) && (
                    <div className="p-4 border rounded-md bg-muted/50 md:col-span-2">
                      <p className="text-sm text-muted-foreground">Estimated Waste</p>
                      <div className="mt-1">
                        <WasteDisplay 
                          waste={calculateStageWaste(
                            roll.printing_qty || roll.extruding_qty || 0, 
                            Number(form.watch('cutting_qty'))
                          ) || 0} 
                          percentage={calculateStageWastePercentage(
                            roll.printing_qty || roll.extruding_qty || 0, 
                            Number(form.watch('cutting_qty'))
                          ) || 0}
                          stage="cutting"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Show total waste from extruding to cutting for this roll (if available) */}
                  {(roll.extruding_qty !== null && form.watch('cutting_qty') > 0) && (
                    <div className="p-4 border rounded-md bg-muted/50 md:col-span-2">
                      <p className="text-sm text-muted-foreground">Roll Waste (Extruding to Cutting)</p>
                      <div className="mt-1">
                        <WasteDisplay 
                          waste={calculateStageWaste(roll.extruding_qty, Number(form.watch('cutting_qty'))) || 0} 
                          percentage={calculateStageWastePercentage(roll.extruding_qty, Number(form.watch('cutting_qty'))) || 0}
                          stage="total"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Show cumulative job order waste (across all rolls) */}
                  {(jobOrderRolls && jobOrderRolls.length > 0) && (
                    <div className="p-4 border rounded-md bg-muted/50 md:col-span-2">
                      <p className="text-sm text-muted-foreground">Job Order Total Waste</p>
                      <div className="mt-1">
                        {/* Create a copy of jobOrderRolls with the current roll's cutting value for preview */}
                        <WasteDisplay 
                          waste={(() => {
                            // If we don't have the roll ID yet, just show the existing waste
                            if (!roll || !jobOrderRolls) return calculateCumulativeCuttingWaste(jobOrderRolls) || 0;
                            
                            // Clone the jobOrderRolls array to avoid mutating it
                            const updatedRolls = jobOrderRolls.map(r => {
                              // For the current roll, use the form value for cutting_qty
                              if (r.id === roll.id && form.watch('cutting_qty') > 0) {
                                return {
                                  ...r,
                                  cutting_qty: Number(form.watch('cutting_qty'))
                                };
                              }
                              return r;
                            });
                            
                            // Calculate and return the cumulative waste for all rolls
                            return calculateCumulativeCuttingWaste(updatedRolls) || 0;
                          })()} 
                          percentage={(() => {
                            if (!roll || !jobOrderRolls) return calculateCumulativeCuttingWastePercentage(jobOrderRolls) || 0;
                            
                            const updatedRolls = jobOrderRolls.map(r => {
                              if (r.id === roll.id && form.watch('cutting_qty') > 0) {
                                return {
                                  ...r,
                                  cutting_qty: Number(form.watch('cutting_qty'))
                                };
                              }
                              return r;
                            });
                            
                            return calculateCumulativeCuttingWastePercentage(updatedRolls) || 0;
                          })()}
                          stage="job-order"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="cutting_qty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cutting Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the final quantity after the cutting process
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
                          <SelectItem value="For Receiving">For Receiving</SelectItem>
                          <SelectItem value="Damage">Damage</SelectItem>
                          <SelectItem value="QC Issue">QC Issue</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Set the final status of this roll after cutting
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
                        Optional notes about the cutting process
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <PackageOpen className="mr-2 h-4 w-4" />
                    Complete & Send to Receiving
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
                  <div className="bg-muted text-muted-foreground rounded-full p-2">
                    <Printer className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Printing</p>
                    <p className="text-sm text-muted-foreground">Complete</p>
                  </div>
                  <Badge variant="outline">Done</Badge>
                </div>
                <Separator />
                <div className="flex items-center space-x-2">
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <Scissors className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Cutting</p>
                    <p className="text-sm text-muted-foreground">Current stage</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <Separator />
                <div className="flex items-center space-x-2">
                  <div className="bg-muted/50 text-muted-foreground rounded-full p-2">
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
                {jobOrder.cutting_unit && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cutting Unit</p>
                    <p className="font-medium">{jobOrder.cutting_unit}</p>
                  </div>
                )}
                {jobOrder.packing && (
                  <div>
                    <p className="text-sm text-muted-foreground">Packing</p>
                    <p className="font-medium">{jobOrder.packing}</p>
                  </div>
                )}
                {jobOrder.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{jobOrder.notes}</p>
                  </div>
                )}
                
                {/* Display total job order waste */}
                {jobOrderRolls && jobOrderRolls.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-semibold text-muted-foreground">Total Job Order Waste</p>
                    <div className="mt-2 p-3 bg-muted/30 rounded-md">
                      <WasteDisplay 
                        waste={calculateJobOrderWaste(jobOrderRolls) || 0}
                        percentage={calculateJobOrderWastePercentage(jobOrderRolls) || 0}
                        stage="job-order"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Based on data from {jobOrderRolls.length} roll{jobOrderRolls.length !== 1 ? 's' : ''} in this job order
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Roll Quantities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p>Extruding:</p>
                  <p className="font-semibold">{roll.extruding_qty || '0'}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p>Printing:</p>
                  <p className="font-semibold">{roll.printing_qty || '0'}</p>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <p className="font-medium">Final Cutting:</p>
                  <p className="font-semibold">{form.watch('cutting_qty')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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