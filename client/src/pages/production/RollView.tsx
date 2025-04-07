import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Loader2, CheckCircle2, Package, Printer, Scissors, PackageOpen, 
  CircleAlert, AlertOctagon, PackageCheck, Truck 
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Utils
import { apiRequest } from "@/lib/queryClient";
import { fadeIn, slideFromRight } from "@/utils/animations";
import { calculateRollWaste } from "@/utils/calculations";

// Status badges with colors
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Ready for Printing':
      return <Badge className="bg-blue-500 hover:bg-blue-600">Ready for Printing</Badge>;
    case 'Ready for Cutting':
      return <Badge className="bg-purple-500 hover:bg-purple-600">Ready for Cutting</Badge>;
    case 'Ready for Receiving':
      return <Badge className="bg-green-500 hover:bg-green-600">Ready for Receiving</Badge>;
    case 'Received':
      return <Badge className="bg-teal-500 hover:bg-teal-600">Received</Badge>;
    case 'Damage':
      return <Badge className="bg-red-500 hover:bg-red-600">Damage</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function RollView() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { id } = useParams<{ id?: string }>();
  const rollId = id ? parseInt(id) : undefined;
  const queryClient = useQueryClient();
  const [receiveNotes, setReceiveNotes] = useState<string>("");

  // Query to get the roll data
  const { data: roll, isLoading: isLoadingRoll } = useQuery({
    queryKey: ['/api/rolls', rollId],
    queryFn: async () => {
      return await apiRequest<Roll>('GET', `/api/rolls/${rollId}`);
    },
    enabled: !!rollId,
  });

  // Query to get the job order data
  const { data: jobOrder, isLoading: isLoadingJobOrder } = useQuery({
    queryKey: ['/api/job-orders', roll?.job_order_id],
    queryFn: async () => {
      return await apiRequest<JobOrder>('GET', `/api/job-orders/${roll?.job_order_id}`);
    },
    enabled: !!roll?.job_order_id,
  });

  // Query to get customers for reference
  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      return await apiRequest<any[]>('GET', '/api/customers');
    },
  });

  // Get the customer name from the job order
  const getCustomerName = () => {
    if (!jobOrder || !customers) return "Unknown Customer";
    const customer = customers.find(c => c.id === jobOrder.customer_id);
    return customer ? customer.name : "Unknown Customer";
  };

  // Calculate waste percentage
  const calculateWastePercentage = () => {
    if (!roll) return null;
    
    if (roll.extruding_qty && roll.cutting_qty) {
      const waste = roll.extruding_qty - roll.cutting_qty;
      const percentage = (waste / roll.extruding_qty) * 100;
      return percentage.toFixed(1) + '%';
    }
    
    return null;
  };

  // Mutation to mark a roll as received
  const receiveRollMutation = useMutation({
    mutationFn: async () => {
      if (!rollId) throw new Error("Roll ID is required");
      
      return await apiRequest('PATCH', `/api/rolls/${rollId}`, {
        status: 'Received',
        notes: receiveNotes ? `${roll?.notes || ''}\nReceived: ${receiveNotes}` : roll?.notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Roll Received",
        description: "The roll has been marked as received by the warehouse.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/rolls'] });
      
      // Reload the current page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error) => {
      console.error("Error receiving roll:", error);
      toast({
        title: "Error",
        description: "There was an error marking the roll as received. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle the receive roll action
  const handleReceiveRoll = () => {
    receiveRollMutation.mutate();
  };

  // Print label function
  const handlePrintLabel = () => {
    if (!roll || !jobOrder) return;
    
    // Import required function
    import('../../utils/pdf').then(({ generateRollLabel }) => {
      // Create label data
      const labelData = {
        rollId: roll.roll_identification,
        rollNumber: roll.roll_number,
        orderId: jobOrder.order_id,
        customerName: getCustomerName(),
        status: roll.status,
        createdBy: "Factory Staff", // This could be improved with actual user data
        createdDate: format(new Date(roll.created_date), "MMM d, yyyy")
      };
      
      // Generate and download the label
      generateRollLabel(labelData);
      
      // Show toast notification
      toast({
        title: "Printing Label",
        description: `Label for Roll #${roll.roll_number} is being sent to printer.`,
      });
    });
  };

  // Loading state
  if (isLoadingRoll || isLoadingJobOrder) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading roll details...</span>
      </div>
    );
  }

  // Error state if roll not found
  if (!roll) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          The specified roll could not be found.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate the next action based on roll status
  const getNextActionButton = () => {
    switch (roll.status) {
      case 'Ready for Printing':
        return (
          <Button 
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => navigate(`/production/printing/${roll.id}`)}
          >
            <Printer className="h-4 w-4 mr-2" />
            Go to Printing
          </Button>
        );
      case 'Ready for Cutting':
        return (
          <Button 
            className="bg-purple-500 hover:bg-purple-600"
            onClick={() => navigate(`/production/cutting/${roll.id}`)}
          >
            <Scissors className="h-4 w-4 mr-2" />
            Go to Cutting
          </Button>
        );
      case 'Ready for Receiving':
        return (
          <Button 
            className="bg-green-500 hover:bg-green-600"
            onClick={handleReceiveRoll}
            disabled={receiveRollMutation.isPending}
          >
            {receiveRollMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Mark as Received
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeIn}
      className="container py-6"
    >
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/production/rolls")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Rolls
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roll Details</h1>
          <p className="text-muted-foreground mt-1">
            View details for Roll #{roll.roll_number}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roll details card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Roll Information</CardTitle>
              {getStatusBadge(roll.status)}
            </div>
            <CardDescription>
              Details about the roll and production quantities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Roll ID</Label>
                <p className="font-medium">{roll.roll_identification}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Roll Number</Label>
                <p className="font-medium">{roll.roll_number}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Creation Date</Label>
                <p className="font-medium">{format(new Date(roll.created_date), "MMM d, yyyy")}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <p className="font-medium">{roll.status}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Production Quantities</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-md bg-muted/30">
                  <div className="flex items-center mb-2">
                    <Package className="h-4 w-4 mr-2 text-blue-500" />
                    <Label className="text-xs text-muted-foreground">Extruding</Label>
                  </div>
                  <p className="font-medium text-lg">
                    {roll.extruding_qty !== null ? `${roll.extruding_qty} kg` : '—'}
                  </p>
                </div>
                <div className="p-4 border rounded-md bg-muted/30">
                  <div className="flex items-center mb-2">
                    <Printer className="h-4 w-4 mr-2 text-purple-500" />
                    <Label className="text-xs text-muted-foreground">Printing</Label>
                  </div>
                  <p className="font-medium text-lg">
                    {roll.printing_qty !== null ? `${roll.printing_qty} kg` : '—'}
                  </p>
                </div>
                <div className="p-4 border rounded-md bg-muted/30">
                  <div className="flex items-center mb-2">
                    <Scissors className="h-4 w-4 mr-2 text-green-500" />
                    <Label className="text-xs text-muted-foreground">Cutting</Label>
                  </div>
                  <p className="font-medium text-lg">
                    {roll.cutting_qty !== null ? `${roll.cutting_qty} kg` : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Waste calculation */}
            {roll.extruding_qty && roll.cutting_qty && (
              <div className="p-4 border rounded-md bg-orange-50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs text-muted-foreground">Waste</Label>
                    <p className="font-medium">
                      {(roll.extruding_qty - roll.cutting_qty).toFixed(1)} kg ({calculateWastePercentage()})
                    </p>
                  </div>
                  {(roll.extruding_qty - roll.cutting_qty) / roll.extruding_qty > 0.35 && (
                    <Badge variant="destructive" className="flex items-center">
                      <AlertOctagon className="h-3 w-3 mr-1" />
                      High Waste
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {roll.notes && (
              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <div className="p-3 border rounded-md mt-1 whitespace-pre-wrap">
                  {roll.notes}
                </div>
              </div>
            )}

            {/* Receiving Form */}
            {roll.status === 'Ready for Receiving' && (
              <div className="mt-6 p-4 border border-emerald-200 rounded-md bg-emerald-50">
                <h3 className="text-lg font-semibold mb-2 text-emerald-700">Receive Roll</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Enter any notes about receiving this roll and click the button to mark it as received.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="receive-notes">Receipt Notes (Optional)</Label>
                  <Textarea
                    id="receive-notes"
                    placeholder="Any comments about receiving this roll..."
                    value={receiveNotes}
                    onChange={(e) => setReceiveNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handlePrintLabel}>
              <Printer className="h-4 w-4 mr-2" />
              Print Label
            </Button>
            {getNextActionButton()}
          </CardFooter>
        </Card>

        {/* Side panel with job order details */}
        <motion.div variants={slideFromRight}>
          <Card>
            <CardHeader>
              <CardTitle>Job Order Details</CardTitle>
              <CardDescription>
                Information about the associated job order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobOrder ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Job Order ID</Label>
                    <p className="font-medium">JO-{jobOrder.id}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Order ID</Label>
                    <p className="font-medium">Order #{jobOrder.order_id}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Customer</Label>
                    <p className="font-medium">{getCustomerName()}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Total Quantity</Label>
                    <p className="font-medium">{jobOrder.quantity} kg</p>
                  </div>
                  
                  <Separator />
                  
                  {jobOrder.size_details && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Size Details</Label>
                      <p className="font-medium">{jobOrder.size_details}</p>
                    </div>
                  )}
                  {jobOrder.raw_material && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Raw Material</Label>
                      <p className="font-medium">{jobOrder.raw_material}</p>
                    </div>
                  )}
                  {jobOrder.mast_batch && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Mast Batch</Label>
                      <p className="font-medium">{jobOrder.mast_batch}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Is Printed</Label>
                    <p className="font-medium">{jobOrder.is_printed ? "Yes" : "No"}</p>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">
                  No job order details available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Production Workflow Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Production Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <div className={roll.extruding_qty ? "bg-primary text-primary-foreground rounded-full p-2" : "bg-muted text-muted-foreground rounded-full p-2"}>
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Extruding</p>
                    <p className="text-sm text-muted-foreground">
                      {roll.extruding_qty ? "Complete" : "Not started"}
                    </p>
                  </div>
                  <Badge variant={roll.extruding_qty ? "default" : "outline"}>
                    {roll.extruding_qty ? roll.extruding_qty + " kg" : "Pending"}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="flex items-center space-x-2">
                  <div className={roll.status === 'Ready for Printing' || roll.printing_qty ? "bg-primary text-primary-foreground rounded-full p-2" : "bg-muted text-muted-foreground rounded-full p-2"}>
                    <Printer className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Printing</p>
                    <p className="text-sm text-muted-foreground">
                      {roll.printing_qty ? "Complete" : roll.status === 'Ready for Printing' ? "Ready" : jobOrder?.is_printed ? "Pending" : "N/A"}
                    </p>
                  </div>
                  <Badge variant={roll.printing_qty ? "default" : roll.status === 'Ready for Printing' ? "default" : "outline"}>
                    {roll.printing_qty ? roll.printing_qty + " kg" : roll.status === 'Ready for Printing' ? "Ready" : jobOrder?.is_printed ? "Pending" : "Not Required"}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="flex items-center space-x-2">
                  <div className={roll.status === 'Ready for Cutting' || roll.cutting_qty ? "bg-primary text-primary-foreground rounded-full p-2" : "bg-muted text-muted-foreground rounded-full p-2"}>
                    <Scissors className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Cutting</p>
                    <p className="text-sm text-muted-foreground">
                      {roll.cutting_qty ? "Complete" : roll.status === 'Ready for Cutting' ? "Ready" : "Pending"}
                    </p>
                  </div>
                  <Badge variant={roll.cutting_qty ? "default" : roll.status === 'Ready for Cutting' ? "default" : "outline"}>
                    {roll.cutting_qty ? roll.cutting_qty + " kg" : roll.status === 'Ready for Cutting' ? "Ready" : "Pending"}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="flex items-center space-x-2">
                  <div className={roll.status === 'Ready for Receiving' || roll.status === 'Received' ? "bg-primary text-primary-foreground rounded-full p-2" : "bg-muted text-muted-foreground rounded-full p-2"}>
                    <PackageOpen className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Receiving</p>
                    <p className="text-sm text-muted-foreground">
                      {roll.status === 'Received' ? "Complete" : roll.status === 'Ready for Receiving' ? "Ready" : "Not Ready"}
                    </p>
                  </div>
                  <Badge variant={roll.status === 'Received' ? "default" : roll.status === 'Ready for Receiving' ? "default" : "outline"}>
                    {roll.status === 'Received' ? "Done" : roll.status === 'Ready for Receiving' ? "Ready" : "Waiting"}
                  </Badge>
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