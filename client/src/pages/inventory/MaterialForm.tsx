import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { FormSkeleton } from "@/components/ui/skeletons";
import { useEffect, useState } from "react";

// Define the material interface type
interface Material {
  id: number;
  identifier: string;
  name: string;
  starting_balance_kg: number;
  current_balance_kg: number;
  low_stock_threshold_kg: number | null;
  created_at: string | Date;
  updated_at: string | Date;
}

// Define the form schema with validation rules
const formSchema = z.object({
  name: z.string().min(2, "Material name must be at least 2 characters"),
  identifier: z.string().min(2, "Material ID must be at least 2 characters").optional(),
  starting_balance_kg: z.number().min(0, "Starting balance must be 0 or greater"),
  low_stock_threshold_kg: z.number().min(0, "Low stock threshold must be 0 or greater").nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface MaterialFormProps {
  id?: number;
}

export default function MaterialForm({ id }: MaterialFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const [autoGenerateId, setAutoGenerateId] = useState(true);
  
  const isEditMode = !!id;
  
  // Prepare form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      identifier: "",
      starting_balance_kg: 0,
      low_stock_threshold_kg: null,
    },
  });
  
  // Auto-generate identifier based on material name
  useEffect(() => {
    if (!isEditMode && autoGenerateId) {
      const name = form.watch("name");
      if (name.length >= 2) {
        // Create an identifier like MAT-0001-FIRSTTWOCHARS
        const prefix = name.substring(0, 2).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        const identifier = `MAT-${timestamp}-${prefix}`;
        form.setValue("identifier", identifier);
      }
    }
  }, [form.watch("name"), isEditMode, autoGenerateId]);
  
  // Query for fetching material data in edit mode
  const { data: material, isLoading } = useQuery<Material>({
    queryKey: ['/api/materials', id],
    enabled: isEditMode,
    staleTime: 0, // Don't use stale data
    refetchOnMount: true, // Always refetch when component mounts
  });
  
  // Update form values when material data is loaded
  useEffect(() => {
    if (material && isEditMode) {
      // Reset the form with the material data
      form.reset({
        name: material.name,
        identifier: material.identifier,
        starting_balance_kg: material.starting_balance_kg,
        low_stock_threshold_kg: material.low_stock_threshold_kg
      });
      
      // Disable auto-generation when editing
      setAutoGenerateId(false);
      
      console.log("Material data loaded:", material);
    }
  }, [material, form, isEditMode]);
  
  // Mutation for creating a new material
  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return apiRequest('/api/materials', {
        method: 'POST',
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      toast({
        title: "Material created successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      navigate("/inventory/materials");
    },
    onError: (error) => {
      toast({
        title: "Failed to create material",
        description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating an existing material
  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Remove identifier from update values since it shouldn't be updated
      const { identifier, ...updateValues } = values;
      return apiRequest(`/api/materials/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateValues),
      });
    },
    onSuccess: () => {
      toast({
        title: "Material updated successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials', id] });
      navigate("/inventory/materials");
    },
    onError: (error) => {
      toast({
        title: "Failed to update material",
        description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (isEditMode) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };
  
  // Show loading state while fetching material data
  if (isLoading && isEditMode) {
    return <FormSkeleton />;
  }
  
  return (
    <div className="container mx-auto py-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Material" : "Add New Material"}</CardTitle>
          <CardDescription>
            {isEditMode 
              ? "Update the details of this material in the inventory system" 
              : "Add a new material to the inventory system"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Material ID</FormLabel>
                      {!isEditMode && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">Auto-generate</span>
                          <Switch 
                            checked={autoGenerateId} 
                            onCheckedChange={setAutoGenerateId}
                            aria-label="Auto-generate ID"
                          />
                        </div>
                      )}
                    </div>
                    <FormControl>
                      <Input 
                        placeholder="Enter unique material identifier" 
                        {...field} 
                        disabled={isEditMode || (!isEditMode && autoGenerateId)}
                        readOnly={isEditMode}
                      />
                    </FormControl>
                    <FormDescription>
                      {autoGenerateId && !isEditMode
                        ? "ID will be auto-generated based on material name"
                        : "A unique identifier for this material (e.g., HD-001 for HDPE)"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter material name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the material as it will appear in the system
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator className="my-4" />
              
              <FormField
                control={form.control}
                name="starting_balance_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Balance (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        disabled={isEditMode} // Can't modify starting balance in edit mode
                      />
                    </FormControl>
                    <FormDescription>
                      {isEditMode 
                        ? "Initial material balance (cannot be modified after creation)" 
                        : "Initial quantity of this material in stock (kg)"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="low_stock_threshold_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Stock Threshold (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Optional"
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      When stock falls below this level, it will be marked as low stock (leave empty for no threshold)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isEditMode && material && (
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium mb-2">Current Stock Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="font-medium">
                        {material.current_balance_kg !== undefined ? 
                          material.current_balance_kg.toFixed(2) : "0.00"} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">
                        {material.updated_at ? 
                          new Date(material.updated_at).toLocaleDateString() : 
                          new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/inventory/materials")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : isEditMode
                      ? "Update Material"
                      : "Add Material"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}