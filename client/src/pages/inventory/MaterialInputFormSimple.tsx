import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, ArrowLeftIcon, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { FormSkeleton } from "@/components/ui/skeletons";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// Define material interface
interface Material {
  id: number;
  identifier: string;
  name: string;
  starting_balance_kg: number;
  current_balance_kg: number;
  low_stock_threshold_kg: number | null;
  created_at: string;
  updated_at: string;
}

// Form validation schema
const materialInputSchema = z.object({
  material_id: z.coerce.number({
    required_error: "Please select a material",
    invalid_type_error: "Material selection is required",
  }),
  quantity_kg: z.coerce.number({
    required_error: "Input quantity is required",
    invalid_type_error: "Input quantity must be a number",
  }).positive("Quantity must be greater than zero"),
  input_date: z.date({
    required_error: "Please select a date",
    invalid_type_error: "That's not a valid date",
  }),
  notes: z.string().optional(),
});

type MaterialInputFormValues = z.infer<typeof materialInputSchema>;

export default function MaterialInputForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Get materialId from URL parameter or query string
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const materialIdParam = searchParams.get('materialId');
  const materialId = materialIdParam ? parseInt(materialIdParam) : undefined;
  
  // Initialize form with default values
  const form = useForm<MaterialInputFormValues>({
    resolver: zodResolver(materialInputSchema),
    defaultValues: {
      material_id: materialId || undefined,
      quantity_kg: undefined,
      input_date: new Date(),
      notes: "",
    },
  });
  
  // Query for fetching a specific material if ID is provided
  const materialQuery = useQuery<Material>({
    queryKey: ['/api/materials', materialId],
    enabled: !!materialId,
  });

  // Query for fetching all materials for dropdown
  const materialsQuery = useQuery<Material[]>({
    queryKey: ['/api/materials'],
    enabled: !materialId, // Only fetch all materials if no specific materialId is provided
  });
  
  // Mutation for creating material input
  const createInputMutation = useMutation({
    mutationFn: async (values: MaterialInputFormValues) => {
      return apiRequest<any>(
        'POST',
        '/api/material-inputs',
        {
          material_id: values.material_id,
          quantity_kg: values.quantity_kg,
          input_date: values.input_date.toISOString(),
          notes: values.notes,
        }
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Material input recorded successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/material-inputs'] });
      
      if (materialId) {
        queryClient.invalidateQueries({ queryKey: ['/api/materials', materialId] });
        queryClient.invalidateQueries({ queryKey: ['/api/material-inputs/material', materialId] });
        navigate(`/inventory/materials/${materialId}/inputs`);
      } else {
        navigate('/inventory/materials');
      }
    },
    onError: (error) => {
      console.error("Error saving material input:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record material input",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: MaterialInputFormValues) => {
    createInputMutation.mutate(values);
  };
  
  // Get all needed data and states
  const material = materialQuery.data;
  const materials = materialsQuery.data;
  const isLoading = materialQuery.isLoading || materialsQuery.isLoading;
  const isSubmitting = createInputMutation.isPending;
  const hasErrors = !!materialQuery.error || !!materialsQuery.error;
  
  // Handle loading state
  if (isLoading) {
    return <FormSkeleton />;
  }
  
  // Handle error state - material not found
  if (!material && materialId) {
    return (
      <div className="container mx-auto py-6 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Material not found</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Not Found</AlertTitle>
              <AlertDescription>
                The requested material (ID: {materialId}) could not be found.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate("/inventory/materials")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Return to Materials List
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Get the selected material for display
  const selectedMaterial = materialId && material 
    ? material 
    : form.watch("material_id") && materials 
      ? materials.find(m => m.id === form.watch("material_id")) 
      : null;
  
  return (
    <div className="container mx-auto py-6 max-w-xl">
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">Add Material Input</CardTitle>
              <CardDescription className="mt-2">
                {selectedMaterial 
                  ? `Recording input for ${selectedMaterial.name}`
                  : "Select a material and record the input quantity"
                }
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/inventory/materials")}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Materials
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Display selected material info */}
          {selectedMaterial && (
            <div className="bg-muted rounded-md p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Material ID</h3>
                  <p className="font-medium">{selectedMaterial.identifier}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Material Name</h3>
                  <p className="font-medium">{selectedMaterial.name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Current Balance</h3>
                  <p className={cn(
                    "font-medium", 
                    selectedMaterial.low_stock_threshold_kg !== null && 
                    selectedMaterial.current_balance_kg <= selectedMaterial.low_stock_threshold_kg
                      ? "text-red-600"
                      : ""
                  )}>
                    {selectedMaterial.current_balance_kg.toFixed(2)} kg
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Last Updated</h3>
                  <p className="font-medium">{format(new Date(selectedMaterial.updated_at), "MMM d, yyyy")}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Material Selection (only if not provided in URL) */}
              {!materialId && (
                <FormField
                  control={form.control}
                  name="material_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {materials?.map((material) => (
                            <SelectItem 
                              key={material.id} 
                              value={material.id.toString()}
                            >
                              {material.name} ({material.identifier})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the material you want to add to inventory
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Quantity Input */}
              <FormField
                control={form.control}
                name="quantity_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Input Quantity (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Enter quantity in kilograms" 
                        {...field}
                        // Clear the field.value when it's 0 or NaN
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the quantity of material being added in kilograms
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Date Picker */}
              <FormField
                control={form.control}
                name="input_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Input Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("2000-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The date when this material was added to inventory
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Notes Field (Optional) */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Add any additional notes about this input" 
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional information about the material input
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Form Buttons */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (materialId) {
                      navigate(`/inventory/materials/${materialId}/inputs`);
                    } else {
                      navigate('/inventory/materials');
                    }
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {isSubmitting ? "Recording..." : "Record Input"}
                </Button>
              </div>
            </form>
          </Form>
          
          {/* Display API Errors */}
          {hasErrors && (
            <Alert variant="destructive" className="mt-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {materialQuery.error instanceof Error 
                  ? materialQuery.error.message 
                  : materialsQuery.error instanceof Error 
                    ? materialsQuery.error.message 
                    : "Failed to load necessary data. Please try again."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}