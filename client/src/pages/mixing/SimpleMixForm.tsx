import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  ChevronRight, 
  Save, 
  Plus, 
  Trash2, 
  Beaker,
  AlertTriangle,
  ListChecks, 
  PieChart 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/utils/auth";
import { FormSkeleton } from "@/components/ui/skeletons";
import { DatePicker } from "@/components/ui/date-picker";

// Form validation schemas
const formSchema = z.object({
  mix_date: z.date({ required_error: "Mix date is required" }),
  created_by: z.coerce.number({ required_error: "Operator is required" }),
  notes: z.string().nullable().optional(),
});

const mixItemSchema = z.object({
  material_type: z.string().min(1, "Material type is required"),
  material_id: z.coerce.number().optional(),
  quantity_kg: z.coerce.number().min(0.1, "Quantity must be greater than 0"),
  notes: z.string().optional().default(""),
});

type FormValues = z.infer<typeof formSchema>;
type MixItemValues = z.infer<typeof mixItemSchema>;

interface SimpleMixFormProps {
  id?: number;
}

export default function SimpleMixForm({ id }: SimpleMixFormProps) {
  const { id: urlId } = useParams();
  const finalId = id || (urlId ? parseInt(urlId) : undefined);
  const isEditing = Boolean(finalId);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // State for mix items
  const [mixItems, setMixItems] = useState<(MixItemValues & { id?: number })[]>([]);
  const [newMixItem, setNewMixItem] = useState<MixItemValues>({
    material_type: "Material",
    material_id: 0,
    quantity_kg: 0,
    notes: ""
  });
  
  // Fetch materials for inventory selection
  const { data: materials = [] } = useQuery<{
    id: number;
    name: string;
    identifier: string;
    current_balance_kg: number;
  }[]>({
    queryKey: ["/api/materials"],
  });
  const [itemError, setItemError] = useState<string | null>(null);
  
  // Calculate total weight
  const totalWeight = mixItems.reduce((sum, item) => sum + parseFloat(item.quantity_kg.toString()), 0);
  
  // State for related orders and machines
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectedMachines, setSelectedMachines] = useState<number[]>([]);

  // Query for data if editing
  const { data: mix, isLoading: isMixLoading } = useQuery<any>({
    queryKey: ["/api/mixes", finalId],
    enabled: isEditing,
  });

  // Query for existing mix items if editing
  const { data: existingMixItems = [], isLoading: isMixItemsLoading } = useQuery<any>({
    queryKey: ["/api/mix-items", finalId],
    enabled: isEditing,
  });

  // Query for related orders if editing
  const { data: relatedOrders = [], isLoading: isOrdersLoading } = useQuery<{id: number}[]>({
    queryKey: ["/api/mixes", finalId, "orders"],
    enabled: isEditing,
  });

  // Query for related machines if editing
  const { data: relatedMachines = [], isLoading: isMachinesLoading } = useQuery<{id: number}[]>({
    queryKey: ["/api/mixes", finalId, "machines"],
    enabled: isEditing,
  });
  
  // Queries for dropdown options
  const { data: operators = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: allOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });

  const { data: allMachines = [] } = useQuery<any[]>({
    queryKey: ["/api/machines"],
  });

  // Set up form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mix_date: new Date(),
      created_by: user?.id || 0,
      notes: null,
    },
  });
  
  // Set current user ID when user data is loaded
  useEffect(() => {
    if (user && !isEditing) {
      form.setValue("created_by", user.id);
    }
  }, [user, form, isEditing]);

  // Create/update mix mutation
  const mixMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Validate that we have all required selections
      if (!isEditing) {
        // Check if materials from inventory have sufficient balance
        const materialItems = mixItems.filter(item => item.material_id && item.material_type === "Material");
        for (const item of materialItems) {
          const material = materials.find(m => m.id === item.material_id);
          if (material && material.current_balance_kg < item.quantity_kg) {
            throw new Error(`Insufficient balance for ${material.name}. Available: ${material.current_balance_kg.toFixed(2)} kg, Needed: ${item.quantity_kg.toFixed(2)} kg`);
          }
        }
        
        // Validate machine and order selection
        if (selectedMachines.length === 0) {
          throw new Error("Please select at least one machine");
        }
        
        if (selectedOrders.length === 0) {
          throw new Error("Please select at least one order");
        }
      }
      
      if (isEditing) {
        return await apiRequest<any>("PATCH", `/api/mixes/${finalId}`, values);
      } else {
        // For new mixes, use the simplified endpoint that handles inventory deduction
        return await apiRequest<any>("POST", "/api/mixes/simple", {
          created_by: values.created_by,
          notes: values.notes,
          materials: mixItems.map(item => ({
            material_id: item.material_id,
            quantity_kg: item.quantity_kg,
            notes: item.notes
          })),
          orderIds: selectedOrders,
          machineIds: selectedMachines
        });
      }
    },
    onSuccess: async (data) => {
      const mixId = isEditing ? finalId : data.id;
      
      // For editing mode, we need to handle items individually
      if (isEditing) {
        // Handle mix items
        for (const item of mixItems) {
          const itemData = { ...item, mix_id: mixId };
          
          if (item.id) {
            // Update existing mix item
            await apiRequest<any>("PATCH", `/api/mix-items/${item.id}`, itemData);
          } else {
            // Create new mix item
            await apiRequest<any>("POST", "/api/mix-items", itemData);
          }
        }
        
        // Handle relations with orders if any were selected
        if (selectedOrders.length > 0) {
          await apiRequest<any>("POST", `/api/mixes/${mixId}/orders`, { orderIds: selectedOrders });
        }
        
        // Handle relations with machines if any were selected
        if (selectedMachines.length > 0) {
          await apiRequest<any>("POST", `/api/mixes/${mixId}/machines`, { machineIds: selectedMachines });
        }
      }
      
      // Invalidate queries after successful operation
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      
      toast({
        title: isEditing ? "Update Successful" : "Create Successful",
        description: isEditing ? "Mix updated successfully" : "Mix created successfully",
      });
      
      setLocation("/production/mixing");
    },
    onError: (error) => {
      toast({
        title: isEditing ? "Update Error" : "Create Error",
        description: error.toString(),
        variant: "destructive",
      });
    },
  });

  // Load data into form when editing
  useEffect(() => {
    if (mix) {
      form.reset({
        mix_date: mix.mix_date ? new Date(mix.mix_date) : new Date(),
        created_by: mix.created_by,
        notes: mix.notes || null,
      });
    }
  }, [mix, form]);

  // Load mix items when editing
  useEffect(() => {
    if (existingMixItems.length > 0) {
      setMixItems(existingMixItems);
    }
  }, [existingMixItems]);

  // Load related orders when editing
  useEffect(() => {
    if (relatedOrders.length > 0) {
      setSelectedOrders(relatedOrders.map((order: any) => order.id));
    }
  }, [relatedOrders]);

  // Load related machines when editing
  useEffect(() => {
    if (relatedMachines.length > 0) {
      setSelectedMachines(relatedMachines.map((machine: any) => machine.id));
    }
  }, [relatedMachines]);

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // Always set the current user as the creator
    if (user && !isEditing) {
      values.created_by = user.id;
    }
    mixMutation.mutate(values);
  };

  // Handle adding a new mix item
  const handleAddItem = () => {
    try {
      // Validate the new item
      mixItemSchema.parse(newMixItem);
      
      // If this is a material from inventory, check if enough balance is available
      if (newMixItem.material_id) {
        const selectedMaterial = materials.find(m => m.id === newMixItem.material_id);
        
        if (!selectedMaterial) {
          setItemError("Material not found");
          return;
        }
        
        if (selectedMaterial.current_balance_kg < newMixItem.quantity_kg) {
          setItemError(`Insufficient inventory balance. Available: ${selectedMaterial.current_balance_kg.toFixed(2)} kg`);
          return;
        }
        
        // Add material name to notes for better identification
        if (!newMixItem.notes) {
          newMixItem.notes = `${selectedMaterial.name} (${selectedMaterial.identifier})`;
        }
      }
      
      setMixItems([...mixItems, { ...newMixItem }]);
      setNewMixItem({
        material_type: "Material",
        material_id: 0,
        quantity_kg: 0,
        notes: ""
      });
      setItemError(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setItemError(error.errors[0].message);
      } else {
        setItemError("Invalid input");
      }
    }
  };

  // Handle removing a mix item
  const handleRemoveItem = (index: number) => {
    const newItems = [...mixItems];
    newItems.splice(index, 1);
    setMixItems(newItems);
  };

  // Handle order selection
  const handleOrderSelect = (orderId: number) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  // Handle machine selection
  const handleMachineSelect = (machineId: number) => {
    if (selectedMachines.includes(machineId)) {
      setSelectedMachines(selectedMachines.filter(id => id !== machineId));
    } else {
      setSelectedMachines([...selectedMachines, machineId]);
    }
  };

  // Loading state
  const isLoading = isMixLoading || isMixItemsLoading || isOrdersLoading || isMachinesLoading;
  const isPending = mixMutation.isPending;

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center mb-4 text-sm text-muted-foreground">
        <Button variant="link" onClick={() => setLocation("/production/mixing")}>
          Mixes
        </Button>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span>{isEditing ? "Edit Mix" : "New Mix"}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            {isEditing ? "Edit Mix" : "Create New Mix"}
            <Badge variant="outline" className="ml-2">Enhanced UI</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <FormSkeleton fields={5} hasButtons />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="mix_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                            disabled={isPending}
                            placeholder="Select Date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="created_by"
                    render={({ field }) => {
                      // Find the current operator name based on the field value
                      const currentOperator = operators.find((op: any) => op.id === field.value);
                      
                      return (
                        <FormItem>
                          <FormLabel>Created By</FormLabel>
                          <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            {currentOperator?.name || user?.name || "Current User"}
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Notes Field - full width now that batch_number and status are removed */}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={isPending}
                          placeholder="Enter notes here..."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Inventory Materials for Mixing */}
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-primary/10 p-4 border-b">
                    <h3 className="text-lg font-medium flex items-center">
                      <Beaker className="mr-2 h-5 w-5" />
                      Mix Components
                    </h3>
                  </div>
                  
                  <div className="p-4">
                    {/* Material Selection Panel */}
                    <div className="mb-6 bg-card rounded-md border shadow-sm">
                      <div className="bg-muted p-3 border-b">
                        <h4 className="font-medium text-sm flex items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          ADD NEW MATERIAL TO MIX
                        </h4>
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              MATERIAL FROM INVENTORY
                            </label>
                            <Select
                              disabled={isPending}
                              value={newMixItem.material_id ? newMixItem.material_id.toString() : ""}
                              onValueChange={(value) => setNewMixItem({
                                ...newMixItem, 
                                material_id: parseInt(value),
                                material_type: "Material" // Set fixed type for inventory materials
                              })}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a material..." />
                              </SelectTrigger>
                              <SelectContent>
                                {materials.map((material) => (
                                  <SelectItem 
                                    key={material.id} 
                                    value={material.id.toString()}
                                    disabled={material.current_balance_kg <= 0}
                                  >
                                    <div className="flex flex-col">
                                      <div className="font-medium flex items-center">
                                        {material.name}
                                        {material.current_balance_kg < 10 && (
                                          <span className="ml-2 px-1.5 py-0.5 rounded-sm text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Low Stock
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground flex justify-between">
                                        <span>{material.identifier}</span>
                                        <span className="font-medium">
                                          {material.current_balance_kg.toFixed(2)} kg available
                                        </span>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Selected material details */}
                            {newMixItem.material_id && newMixItem.material_id > 0 && (
                              <div className="mt-2 p-2 bg-muted/20 rounded border text-sm">
                                {(() => {
                                  const material = materials.find(m => m.id === newMixItem.material_id);
                                  if (!material) return null;
                                  return (
                                    <div className="flex justify-between">
                                      <div>
                                        <div className="font-medium">{material.name}</div>
                                        <div className="text-xs text-muted-foreground">{material.identifier}</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-medium">{material.current_balance_kg.toFixed(2)} kg</div>
                                        <div className="text-xs text-muted-foreground">Available</div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                QUANTITY (KG)
                              </label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0.1"
                                disabled={isPending || !newMixItem.material_id}
                                value={newMixItem.quantity_kg || ""}
                                onChange={(e) => setNewMixItem({
                                  ...newMixItem, 
                                  quantity_kg: parseFloat(e.target.value) || 0
                                })}
                                className="text-lg"
                              />
                              
                              {/* Quantity percentage helper */}
                              {newMixItem.material_id && newMixItem.material_id > 0 && newMixItem.quantity_kg > 0 && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {(() => {
                                    const material = materials.find(m => m.id === newMixItem.material_id);
                                    if (!material) return null;
                                    const percentOfAvailable = (newMixItem.quantity_kg / material.current_balance_kg) * 100;
                                    return (
                                      <div className="flex items-center">
                                        <div 
                                          className={`h-1.5 rounded-full mr-2 ${
                                            percentOfAvailable > 80 ? 'bg-red-500' : 
                                            percentOfAvailable > 50 ? 'bg-orange-500' : 'bg-green-500'
                                          }`}
                                          style={{ width: `${Math.min(100, percentOfAvailable)}%` }}
                                        ></div>
                                        <span>
                                          {percentOfAvailable.toFixed(1)}% of available {material.name}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                NOTES (OPTIONAL)
                              </label>
                              <Input
                                disabled={isPending || !newMixItem.material_id}
                                value={newMixItem.notes || ""}
                                onChange={(e) => setNewMixItem({
                                  ...newMixItem, 
                                  notes: e.target.value
                                })}
                                placeholder="e.g., batch details, color, specific use"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            type="button" 
                            onClick={handleAddItem}
                            disabled={isPending || !newMixItem.material_id || !newMixItem.quantity_kg}
                            size="lg"
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add to Mix
                          </Button>
                        </div>
                        
                        {itemError && (
                          <div className="mt-2 p-2 bg-destructive/10 border border-destructive text-destructive rounded text-sm">
                            <AlertTriangle className="inline-block mr-1 h-4 w-4" />
                            {itemError}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Material List */}
                    {mixItems.length > 0 && (
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium flex items-center">
                            <ListChecks className="mr-2 h-4 w-4" />
                            MATERIALS IN THIS MIX
                          </h4>
                          <Badge variant="outline" className="px-3 font-bold">
                            {totalWeight.toFixed(2)} kg
                          </Badge>
                        </div>
                        
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="w-[40%]">MATERIAL</TableHead>
                                <TableHead className="text-right">QUANTITY</TableHead>
                                <TableHead className="text-right">PERCENTAGE</TableHead>
                                <TableHead>NOTES</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {mixItems.map((item, index) => {
                                // Calculate percentage for this item
                                const percentage = totalWeight > 0 
                                  ? ((parseFloat(item.quantity_kg.toString()) / totalWeight) * 100).toFixed(2) 
                                  : "0";
                                
                                // Get material details from inventory
                                let materialName = item.material_type;
                                let materialId = "";
                                
                                if (item.material_id) {
                                  const material = materials.find(m => m.id === item.material_id);
                                  if (material) {
                                    materialName = material.name;
                                    materialId = material.identifier;
                                  }
                                }
                                
                                return (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <div className="font-medium">{materialName}</div>
                                      {materialId && (
                                        <div className="text-xs text-muted-foreground">{materialId}</div>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {item.quantity_kg.toFixed(2)} kg
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="inline-flex items-center gap-1.5">
                                        <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-primary" 
                                            style={{ width: `${percentage}%` }}
                                          ></div>
                                        </div>
                                        <span>{percentage}%</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                      {item.notes || "—"}
                                    </TableCell>
                                    <TableCell>
                                      <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleRemoveItem(index)}
                                        disabled={isPending}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    
                    {/* Mix Composition Summary */}
                    {mixItems.length > 0 && (
                      <div className="bg-primary/5 rounded-md border p-4">
                        <h4 className="font-medium mb-3 flex items-center">
                          <PieChart className="mr-2 h-4 w-4" />
                          MIX COMPOSITION SUMMARY
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(() => {
                            // Group materials by type for summary
                            const materialSummary: Record<string, {weight: number, items: any[]}> = {};
                            
                            mixItems.forEach(item => {
                              let materialName = "Unknown";
                              
                              if (item.material_id) {
                                const material = materials.find(m => m.id === item.material_id);
                                if (material) {
                                  materialName = material.name;
                                }
                              } else {
                                materialName = item.material_type;
                              }
                              
                              if (!materialSummary[materialName]) {
                                materialSummary[materialName] = {
                                  weight: 0,
                                  items: []
                                };
                              }
                              
                              materialSummary[materialName].weight += parseFloat(item.quantity_kg.toString());
                              materialSummary[materialName].items.push(item);
                            });
                            
                            return Object.entries(materialSummary).map(([name, data]) => {
                              const percentage = totalWeight > 0 
                                ? ((data.weight / totalWeight) * 100).toFixed(1)
                                : "0";
                                
                              return (
                                <div key={name} className="bg-card rounded-md border shadow-sm p-3">
                                  <div className="flex justify-between items-center mb-1">
                                    <h5 className="font-medium truncate">{name}</h5>
                                    <Badge variant="secondary">
                                      {percentage}%
                                    </Badge>
                                  </div>
                                  <div className="text-sm font-medium">
                                    {data.weight.toFixed(2)} kg
                                  </div>
                                  <div className="mt-2 w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Orders Section */}
                <div className="border p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-4">Related Orders</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {allOrders.map((order: any) => (
                      <div 
                        key={order.id} 
                        className={`p-2 border rounded-md cursor-pointer ${
                          selectedOrders.includes(order.id) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handleOrderSelect(order.id)}
                      >
                        <div className="font-medium">Order #{order.id}</div>
                        <div className="text-sm">
                          {new Date(order.order_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Machines Section */}
                <div className="border p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-4">Machines</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {allMachines.map((machine: any) => (
                      <div 
                        key={machine.id} 
                        className={`p-2 border rounded-md cursor-pointer ${
                          selectedMachines.includes(machine.id) 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handleMachineSelect(machine.id)}
                      >
                        <div className="font-medium">{machine.identification || `Machine #${machine.id}`}</div>
                        <div className="text-sm">{machine.section}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/mixing")}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? "Update Mix" : "Save Mix"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}