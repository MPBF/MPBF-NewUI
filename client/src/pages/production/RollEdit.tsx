import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Utils
import { apiRequest } from "@/lib/queryClient";

export default function RollEdit() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Roll data state
  const [formData, setFormData] = useState({
    roll_identification: "",
    extruding_qty: 0,
    printing_qty: 0,
    cutting_qty: 0,
    status: "",
    notes: ""
  });
  
  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get roll data
  const { data: roll, isLoading } = useQuery({
    queryKey: [`/api/rolls/${id}`],
    queryFn: () => apiRequest(`/api/rolls/${id}`),
  });

  // Get job order data for reference
  const { data: jobOrder } = useQuery({
    queryKey: [`/api/job-orders/${roll?.job_order_id}`],
    queryFn: () => apiRequest(`/api/job-orders/${roll?.job_order_id}`),
    enabled: !!roll?.job_order_id,
  });

  // Get customer data for reference
  const { data: customers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: () => apiRequest('/api/customers'),
  });

  // Initialize form with roll data when available
  useEffect(() => {
    if (roll) {
      setFormData({
        roll_identification: roll.roll_identification,
        extruding_qty: roll.extruding_qty || 0,
        printing_qty: roll.printing_qty || 0,
        cutting_qty: roll.cutting_qty || 0,
        status: roll.status,
        notes: roll.notes || ""
      });
    }
  }, [roll]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation
    if (!formData.roll_identification) {
      setError("Roll identification is required");
      setIsSubmitting(false);
      return;
    }

    // Calculate waste based on extruding vs cutting quantities
    // If cutting quantity > extruding quantity, update the extruding quantity
    if (formData.cutting_qty > formData.extruding_qty && formData.extruding_qty > 0) {
      if (!confirm("Cutting quantity is greater than extruding quantity. Do you want to update the extruding quantity to match?")) {
        setIsSubmitting(false);
        return;
      }
      setFormData({
        ...formData,
        extruding_qty: formData.cutting_qty
      });
    }

    try {
      // Update the roll
      await apiRequest(`/api/rolls/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          roll_identification: formData.roll_identification,
          extruding_qty: formData.extruding_qty || null,
          printing_qty: formData.printing_qty || null,
          cutting_qty: formData.cutting_qty || null,
          status: formData.status,
          notes: formData.notes || null
        }),
      });

      // Show success notification
      toast({
        title: "Roll Updated",
        description: `Roll ${formData.roll_identification} has been updated successfully.`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/rolls'] });
      queryClient.invalidateQueries({ queryKey: [`/api/rolls/${id}`] });

      // Navigate back to rolls list
      navigate("/production/rolls");
    } catch (error) {
      console.error('Error updating roll:', error);
      setError("Failed to update roll. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get customer name
  const getCustomerName = (customerId?: number) => {
    if (!customerId || !customers) return "Unknown";
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : `Customer #${customerId}`;
  };

  // Get customer name for display
  const customerName = jobOrder ? getCustomerName(jobOrder.customer_id) : "Unknown";

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name.includes('qty') ? parseFloat(value) || 0 : value
    });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Calculate waste based on current form data
  const calculateWaste = () => {
    if (!formData.extruding_qty || !formData.cutting_qty) return 0;
    return Math.max(0, formData.extruding_qty - formData.cutting_qty);
  };

  const waste = calculateWaste();
  const wastePercentage = formData.extruding_qty ? (waste / formData.extruding_qty) * 100 : 0;

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading roll data...</span>
      </div>
    );
  }

  return (
    <div className="container py-6">
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Roll</h1>
          <p className="text-muted-foreground mt-1">
            Update roll details and manage production quantities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roll details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Roll Details</CardTitle>
            <CardDescription>
              Edit roll information and production quantities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="roll-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roll_identification">Roll Identification</Label>
                  <Input
                    id="roll_identification"
                    name="roll_identification"
                    value={formData.roll_identification}
                    onChange={handleChange}
                    placeholder="Roll ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="For Printing">For Printing</SelectItem>
                      <SelectItem value="For Cutting">For Cutting</SelectItem>
                      <SelectItem value="Ready for Delivery">Ready for Delivery</SelectItem>
                      <SelectItem value="Hold">Hold</SelectItem>
                      <SelectItem value="QC Issue">QC Issue</SelectItem>
                      <SelectItem value="Rework">Rework</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="extruding_qty">Extruding Quantity (kg)</Label>
                  <Input
                    id="extruding_qty"
                    name="extruding_qty"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.extruding_qty}
                    onChange={handleChange}
                    placeholder="Extruding quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printing_qty">Printing Quantity (kg)</Label>
                  <Input
                    id="printing_qty"
                    name="printing_qty"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.printing_qty}
                    onChange={handleChange}
                    placeholder="Printing quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cutting_qty">Cutting Quantity (kg)</Label>
                  <Input
                    id="cutting_qty"
                    name="cutting_qty"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.cutting_qty}
                    onChange={handleChange}
                    placeholder="Cutting quantity"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Enter any additional notes about this roll"
                  rows={3}
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/production/rolls")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="roll-form"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        {/* Sidebar info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer</p>
                <p className="text-lg font-medium">{customerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Job Order ID</p>
                <p className="text-lg font-medium">#{roll?.job_order_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Roll Number</p>
                <p className="text-lg font-medium">#{roll?.roll_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <p className="text-lg font-medium">
                  {roll?.created_date ? format(new Date(roll.created_date), "PPP") : "Unknown"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Waste Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Extruding Quantity</p>
                <p className="text-lg font-medium">{formData.extruding_qty} kg</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cutting Quantity</p>
                <p className="text-lg font-medium">{formData.cutting_qty} kg</p>
              </div>
              <div className={waste > 0 ? "text-amber-600" : "text-green-600"}>
                <p className="text-sm font-medium text-muted-foreground">Waste Amount</p>
                <p className="text-lg font-bold">
                  {waste.toFixed(2)} kg ({wastePercentage.toFixed(2)}%)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}