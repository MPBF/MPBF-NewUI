import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FaPlus, FaTrash, FaEye } from "react-icons/fa";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DataTable } from "@/components/ui/data-table/DataTable";

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

// Simple schema for adding a new material
const addMaterialSchema = z.object({
  name: z.string().min(1, "Material name is required")
});

// Schema for material input (transaction)
const addInputSchema = z.object({
  material_id: z.number({ required_error: "Please select a material" }),
  quantity_kg: z.number({ required_error: "Quantity is required" })
    .min(0.01, "Quantity must be greater than 0"),
  notes: z.string().optional()
});

type AddMaterialFormValues = z.infer<typeof addMaterialSchema>;
type AddInputFormValues = z.infer<typeof addInputSchema>;

export default function MaterialList() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("materials");
  
  // Query to fetch materials
  const { data: materials, isLoading } = useQuery({
    queryKey: ['/api/materials'],
    select: (data: Material[]) => {
      return [...data].sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  // Setup form for adding a new material
  const addMaterialForm = useForm<AddMaterialFormValues>({
    resolver: zodResolver(addMaterialSchema),
    defaultValues: {
      name: ""
    }
  });

  // Setup form for adding a material input
  const addInputForm = useForm<AddInputFormValues>({
    resolver: zodResolver(addInputSchema),
    defaultValues: {
      material_id: undefined,
      quantity_kg: undefined,
      notes: ""
    }
  });

  // Mutation for adding a new material
  const addMaterialMutation = useMutation({
    mutationFn: async (values: AddMaterialFormValues) => {
      const data = {
        name: values.name,
        starting_balance_kg: 0, // Set default starting balance to 0
        current_balance_kg: 0,  // Set default current balance to 0
        low_stock_threshold_kg: null // No low stock threshold by default
      };
      return apiRequest<any>('POST', '/api/materials', data);
    },
    onSuccess: () => {
      toast({
        title: "Material added successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      addMaterialForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to add material",
        description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });

  // Mutation for adding a material input
  const addInputMutation = useMutation({
    mutationFn: async (values: AddInputFormValues) => {
      const data = {
        material_id: values.material_id,
        quantity_kg: values.quantity_kg,
        input_date: new Date(),
        notes: values.notes
      };
      return apiRequest<any>('POST', '/api/material-inputs', data);
    },
    onSuccess: () => {
      toast({
        title: "Material input recorded successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      addInputForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to record material input",
        description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });

  // Handle adding a new material
  const onSubmitAddMaterial = (values: AddMaterialFormValues) => {
    addMaterialMutation.mutate(values);
  };

  // Handle adding a material input
  const onSubmitAddInput = (values: AddInputFormValues) => {
    addInputMutation.mutate(values);
  };

  // Column definitions for the data table
  const columns = [
    {
      header: "Material ID",
      accessorKey: "identifier",
    },
    {
      header: "Material Name",
      accessorKey: "name",
    },
    {
      header: "Current Balance (kg)",
      accessorKey: "current_balance_kg",
      cell: (material: Material) => {
        const currentBalance = material.current_balance_kg || 0;
        const isLow = material.low_stock_threshold_kg !== null && 
                     currentBalance <= material.low_stock_threshold_kg;
        
        return (
          <div className="flex items-center gap-2">
            <span className={isLow ? "text-red-600 font-semibold" : ""}>
              {currentBalance.toFixed(2)}
            </span>
            {isLow && (
              <Badge variant="destructive" className="text-xs">
                Low Stock
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      header: "Last Updated",
      accessorKey: "updated_at",
      cell: (material: Material) => format(new Date(material.updated_at), "MMM d, yyyy HH:mm")
    },
  ];
  
  // Function to render action buttons for each material
  const actions = (material: Material) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(`/inventory/materials/${material.id}/inputs`)}
        title="View Input History"
      >
        <FaEye className="h-4 w-4 text-primary" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Delete Material">
            <FaTrash className="h-4 w-4 text-red-600" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the material {material.name} and all associated input records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                apiRequest<any>('DELETE', `/api/materials/${material.id}`)
                  .then(() => {
                    toast({
                      title: "Material deleted successfully",
                      variant: "default",
                    });
                    queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
                  })
                  .catch((error) => {
                    toast({
                      title: "Failed to delete material",
                      description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
                      variant: "destructive",
                    });
                  });
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <TableSkeleton />
      </div>
    );
  }
  
  // Calculate totals and stats
  const totalMaterials = materials?.length || 0;
  const totalCurrentBalance = materials?.reduce((sum, material) => sum + (material.current_balance_kg || 0), 0) || 0;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">
          Manage raw materials and record material inputs
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials">Material List</TabsTrigger>
          <TabsTrigger value="actions">Add Material / Record Input</TabsTrigger>
        </TabsList>
        
        <TabsContent value="materials" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalMaterials}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalCurrentBalance.toFixed(2)} <span className="text-sm">kg</span></p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Material Inventory</CardTitle>
              <CardDescription>View and manage all materials in inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={materials || []}
                columns={columns}
                searchable={true}
                pagination={true}
                actions={actions}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="actions" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add New Material Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Material</CardTitle>
                <CardDescription>Create a new material in the inventory system</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...addMaterialForm}>
                  <form onSubmit={addMaterialForm.handleSubmit(onSubmitAddMaterial)} className="space-y-4">
                    <FormField
                      control={addMaterialForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter material name" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter a descriptive name for the material
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={addMaterialMutation.isPending}
                    >
                      {addMaterialMutation.isPending ? "Adding..." : "Add Material"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Record Material Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Record Material Input</CardTitle>
                <CardDescription>Record a new material input transaction</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...addInputForm}>
                  <form onSubmit={addInputForm.handleSubmit(onSubmitAddInput)} className="space-y-4">
                    <FormField
                      control={addInputForm.control}
                      name="material_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value ? field.value.toString() : undefined}
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
                    
                    <FormField
                      control={addInputForm.control}
                      name="quantity_kg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="Enter quantity in kg"
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the quantity of material being added in kilograms
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addInputForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter any additional notes about this input"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Add any remarks or notes about this material input
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={addInputMutation.isPending}
                    >
                      {addInputMutation.isPending ? "Recording..." : "Record Input"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
