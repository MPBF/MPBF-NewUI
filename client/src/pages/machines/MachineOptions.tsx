import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PermissionAwareContent } from "@/components/ui/role-aware-content";
import { apiRequest } from "@/lib/queryClient";
import { usePermissions } from "@/utils/permissions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { SECTION_OPTIONS } from "./MachineList";

// Form validation schema
const formSchema = z.object({
  option_details: z.string().min(1, "Option details are required"),
  section: z.string().min(1, "Section is required")
});

type FormValues = z.infer<typeof formSchema>;

// Badge variants based on section
const getSectionBadgeVariant = (section: string) => {
  switch (section.toLowerCase()) {
    case 'extrusion':
      return 'default';
    case 'printing':
      return 'secondary';
    case 'cutting':
      return 'outline';
    default:
      return 'default';
  }
};

export default function MachineOptions() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<MachineOption | null>(null);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      option_details: "",
      section: "",
    },
  });

  // Reset form when dialog opens/closes
  const resetForm = () => {
    form.reset({
      option_details: editingOption?.option_details || "",
      section: editingOption?.section || "",
    });
  };

  // Handle dialog open/close
  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingOption(null);
      form.reset();
    } else {
      resetForm();
    }
  };

  // Open edit dialog
  const handleEdit = (option: MachineOption) => {
    setEditingOption(option);
    setDialogOpen(true);
  };

  // Query to fetch machine options
  const { data: machineOptions, isLoading } = useQuery({
    queryKey: ['/api/machine-options'],
    queryFn: () => apiRequest<MachineOption[]>('GET', '/api/machine-options'),
  });

  // Create/Update machine option mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const url = editingOption 
        ? `/api/machine-options/${editingOption.id}` 
        : '/api/machine-options';
      const method = editingOption ? 'PUT' : 'POST';
      
      return apiRequest(method, url, values);
    },
    onSuccess: () => {
      toast({
        title: editingOption ? "Option updated" : "Option created",
        description: editingOption
          ? "The machine option has been updated successfully"
          : "The machine option has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/machine-options'] });
      setDialogOpen(false);
      setEditingOption(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: editingOption ? "Update failed" : "Creation failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Delete machine option mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/machine-options/${id}`),
    onSuccess: () => {
      toast({
        title: "Option deleted",
        description: "The machine option has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/machine-options'] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete machine option",
        variant: "destructive",
      });
    }
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  // Columns for the DataTable
  const columns = [
    {
      header: "Option Details",
      accessorKey: "option_details",
    },
    {
      header: "Section",
      accessorKey: "section",
      cell: (option: MachineOption) => (
        <Badge variant={getSectionBadgeVariant(option.section)}>
          {option.section}
        </Badge>
      )
    },
  ];

  // Action buttons for each row
  const actions = (option: MachineOption) => (
    <div className="flex space-x-2">
      <PermissionAwareContent permission="machines:edit">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEdit(option)}
        >
          Edit
        </Button>
      </PermissionAwareContent>
      <PermissionAwareContent permission="machines:delete">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm(`Are you sure you want to delete the option "${option.option_details}"?`)) {
              deleteMutation.mutate(option.id);
            }
          }}
        >
          Delete
        </Button>
      </PermissionAwareContent>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Machine Options</CardTitle>
            <CardDescription>
              Manage available options for machines
            </CardDescription>
          </div>
          <PermissionAwareContent permission="machines:create">
            <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button>Add Option</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingOption ? "Edit Option" : "Add New Option"}</DialogTitle>
                  <DialogDescription>
                    {editingOption 
                      ? "Update the details of an existing machine option" 
                      : "Add a new option that can be assigned to machines"}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="option_details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option Details *</FormLabel>
                          <FormControl>
                            <Input placeholder="Option details" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

                    <DialogFooter className="mt-6">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending 
                          ? "Saving..." 
                          : (editingOption ? "Update Option" : "Create Option")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </PermissionAwareContent>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <DataTable
              data={machineOptions || []}
              columns={columns}
              searchable
              pagination
              actions={hasPermission("machines:edit") || hasPermission("machines:delete") ? actions : undefined}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Types
interface MachineOption {
  id: number;
  option_details: string;
  section: string;
}