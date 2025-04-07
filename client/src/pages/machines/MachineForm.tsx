import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSkeleton } from "@/components/ui/skeletons";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SECTION_OPTIONS } from "./MachineList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Form validation schema
const formSchema = z.object({
  section: z.string().min(1, "Section is required"),
  code: z.string().min(1, "Machine code is required"),
  production_date: z.date({
    required_error: "Production date is required",
  }),
  identification: z.string().optional(),
  serial_number: z.string().optional().nullable(),
  manufacturer_code: z.string().optional().nullable(),
  manufacturer_name: z.string().optional().nullable(),
});

// Machine option form validation schema
const optionFormSchema = z.object({
  option_details: z.string().min(1, "Option details are required"),
  section: z.string().min(1, "Section is required"),
});

type FormValues = z.infer<typeof formSchema>;
type OptionFormValues = z.infer<typeof optionFormSchema>;

interface MachineFormProps {
  id?: number;
}

export default function MachineForm({ id }: MachineFormProps) {
  const params = useParams();
  console.log("MachineForm params:", params);
  const machineId = id || parseInt(params.id || "0");
  console.log("MachineForm machineId:", machineId);
  const isEditing = Boolean(machineId);
  console.log("MachineForm isEditing:", isEditing);
  
  const [location, navigate] = useLocation();
  console.log("Current location:", location);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch machine data if editing
  const { data: machine, isLoading } = useQuery<Machine>({
    queryKey: ['/api/machines', machineId],
    queryFn: () => apiRequest<Machine>('GET', `/api/machines/${machineId}`),
    enabled: isEditing,
  });

  // Fetch available machine options
  const { data: machineOptions } = useQuery<MachineOption[]>({
    queryKey: ['/api/machine-options'],
    queryFn: () => apiRequest<MachineOption[]>('GET', '/api/machine-options'),
  });

  // State for selected machine options
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  // Fetch associated options if editing
  const { data: machineAssociatedOptions } = useQuery<MachineOption[]>({
    queryKey: ['/api/machines', machineId, 'options'],
    queryFn: () => apiRequest<MachineOption[]>('GET', `/api/machines/${machineId}/options`),
    enabled: isEditing,
  });

  // Set selected options when data is loaded
  useEffect(() => {
    if (machineAssociatedOptions && Array.isArray(machineAssociatedOptions)) {
      setSelectedOptions(machineAssociatedOptions.map((o: MachineOption) => o.id));
    }
  }, [machineAssociatedOptions]);

  // Form initialization
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identification: "",
      section: "",
      code: "",
      production_date: new Date(),
      serial_number: "",
      manufacturer_code: "",
      manufacturer_name: "",
    },
  });

  // Initialize form with existing data when available
  useEffect(() => {
    if (machine) {
      form.reset({
        identification: machine.identification,
        section: machine.section,
        code: machine.code,
        production_date: new Date(machine.production_date),
        serial_number: machine.serial_number || "",
        manufacturer_code: machine.manufacturer_code || "",
        manufacturer_name: machine.manufacturer_name || "",
      });
    }
  }, [machine, form]);

  // Create/Update Machine mutation
  const mutation = useMutation<Machine, Error, FormValues>({
    mutationFn: async (values: FormValues) => {
      // Create a properly typed payload object
      const dataToSend: MachineMutationPayload = {
        section: values.section,
        code: values.code,
        production_date: values.production_date instanceof Date 
          ? values.production_date.toISOString() 
          : new Date().toISOString(),
        serial_number: values.serial_number,
        manufacturer_code: values.manufacturer_code,
        manufacturer_name: values.manufacturer_name
      };
      
      // Add identification for edit operations
      if (values.identification) {
        dataToSend.identification = values.identification;
      }
      
      const url = isEditing ? `/api/machines/${machineId}` : '/api/machines';
      const method = isEditing ? 'PATCH' : 'POST';
      
      return await apiRequest<Machine>(method, url, dataToSend);
    },
    onSuccess: async (machineData: Machine) => {
      try {
        // Always update the options (replaces existing ones)
        await apiRequest('POST', `/api/machines/${machineData.id}/options`, { 
          optionIds: selectedOptions 
        });
        
        toast({
          title: isEditing ? "Machine updated" : "Machine created",
          description: isEditing 
            ? `The machine ${machineData.identification} has been updated successfully` 
            : `The machine ${machineData.identification} has been created successfully`,
        });
        
        // Invalidate both machines list and the specific machine's data
        queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
        if (isEditing) {
          queryClient.invalidateQueries({ queryKey: ['/api/machines', machineId] });
          queryClient.invalidateQueries({ queryKey: ['/api/machines', machineId, 'options'] });
        }
        
        navigate("/machines");
      } catch (error) {
        console.error("Error updating machine options:", error);
        toast({
          title: "Options update failed",
          description: "The machine was saved but its options could not be updated",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Machine mutation error:", error);
      toast({
        title: isEditing ? "Update failed" : "Creation failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    // production_date is already a Date object from the schema validation
    // and DatePicker component, so we don't need to convert it
    mutation.mutate(values);
  };

  // Toggle option selection
  const toggleOption = (optionId: number) => {
    setSelectedOptions(prev => 
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };
  
  // Machine Option Form
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  
  // Initialize the option form
  const optionForm = useForm<OptionFormValues>({
    resolver: zodResolver(optionFormSchema),
    defaultValues: {
      option_details: "",
      section: form.watch("section") || "",
    },
  });
  
  // Update option section when main form section changes
  useEffect(() => {
    const section = form.watch("section");
    if (section) {
      optionForm.setValue("section", section);
    }
  }, [form.watch("section"), optionForm]);
  
  // Create machine option mutation
  const optionMutation = useMutation<MachineOption, Error, OptionFormValues>({
    mutationFn: async (values: OptionFormValues) => {
      return await apiRequest<MachineOption>('POST', '/api/machine-options', values);
    },
    onSuccess: (newOption) => {
      toast({
        title: "Option created",
        description: `The option "${newOption.option_details}" has been created successfully`,
      });
      
      // Add the new option to the selected options
      setSelectedOptions(prev => [...prev, newOption.id]);
      
      // Invalidate the machine options query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/machine-options'] });
      
      // Reset the form and close the dialog
      optionForm.reset();
      setIsOptionDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Option creation failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Option form submission handler
  const onSubmitOption = (values: OptionFormValues) => {
    optionMutation.mutate(values);
  };

  if (isEditing && isLoading) {
    return <FormSkeleton fields={7} columns={1} hasButtons />;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Machine" : "Add New Machine"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Update the details of an existing machine" 
              : "Add a new machine to the factory inventory"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isEditing && (
                  <FormField
                    control={form.control}
                    name="identification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identification</FormLabel>
                        <FormControl>
                          <Input placeholder="Auto-generated" {...field} disabled />
                        </FormControl>
                        <FormDescription>
                          Auto-generated from section and code
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SECTION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="Machine code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="production_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Production Date *</FormLabel>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serial_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Serial number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturer_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Manufacturer code" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Manufacturer name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Machine Options Section */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <FormLabel>Machine Options</FormLabel>
                  <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Add Option</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Machine Option</DialogTitle>
                        <DialogDescription>
                          Create a new option that can be applied to machines
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...optionForm}>
                        <form onSubmit={optionForm.handleSubmit(onSubmitOption)} className="space-y-4">
                          <FormField
                            control={optionForm.control}
                            name="option_details"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Option Details *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter option details" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={optionForm.control}
                            name="section"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Section *</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a section" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {SECTION_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsOptionDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={optionMutation.isPending}>
                              {optionMutation.isPending ? "Creating..." : "Create Option"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <FormDescription>
                  Select all options that apply to this machine
                </FormDescription>
                
                <div className="mt-3 border rounded-md p-4">
                  {machineOptions && machineOptions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {machineOptions
                        .filter(option => !form.watch("section") || option.section === form.watch("section"))
                        .map(option => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`option-${option.id}`}
                              checked={selectedOptions.includes(option.id)}
                              onCheckedChange={() => toggleOption(option.id)}
                            />
                            <label
                              htmlFor={`option-${option.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {option.option_details}
                            </label>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No options available. Click "Add Option" to create one.
                    </div>
                  )}
                </div>
              </div>

              <CardFooter className="flex justify-between px-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/machines")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : (isEditing ? "Update Machine" : "Create Machine")}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Types
interface Machine {
  id: number;
  identification: string;
  section: string;
  code: string;
  production_date: string; // From server it's a string
  serial_number: string | null;
  manufacturer_code: string | null;
  manufacturer_name: string | null;
}

// Interface for the mutation payload
interface MachineMutationPayload {
  section: string;
  code: string;
  production_date: string; // Send as string to server
  identification?: string;
  serial_number?: string | null;
  manufacturer_code?: string | null;
  manufacturer_name?: string | null;
}

interface MachineOption {
  id: number;
  option_details: string;
  section: string;
}