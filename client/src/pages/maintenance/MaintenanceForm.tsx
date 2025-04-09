import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChevronLeft, Save, Plus, Trash } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormSkeleton } from "@/components/ui/skeletons";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { t } from "@/utils/language";

// Define form validation schema for the maintenance request
const formSchema = z.object({
  machine_id: z.string().min(1, "Machine is required"),
  description: z.string().min(3, "Description is required"),
  notes: z.string().optional(),
  status: z.string().min(1, "Status is required"),
});

type FormValues = z.infer<typeof formSchema>;

// Define form validation schema for the maintenance action
const actionFormSchema = z.object({
  part_type: z.string().min(1, "Part type is required"),
  action_type: z.string().min(1, "Action type is required"),
  description: z.string().min(3, "Description is required"),
  notes: z.string().optional(),
});

type ActionFormValues = z.infer<typeof actionFormSchema>;

// Define the component props
interface MaintenanceFormProps {
  id?: number;
}

export default function MaintenanceForm({ id }: MaintenanceFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actions, setActions] = useState<any[]>([]);

  // Create form for maintenance request
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machine_id: "",
      description: "",
      notes: "",
      status: id ? "" : "New", // Default status for new requests is "New"
    },
  });

  // Create form for maintenance action
  const actionForm = useForm<ActionFormValues>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      part_type: "",
      action_type: "",
      description: "",
      notes: "",
    },
  });

  // Fetch request data if editing
  const { data: requestData, isLoading: isLoadingRequest } = useQuery({
    queryKey: ['/api/maintenance-requests', id],
    enabled: !!id,
  });

  // Fetch action data if editing
  const { data: actionsData, isLoading: isLoadingActions } = useQuery({
    queryKey: ['/api/maintenance-actions/request', id],
    enabled: !!id,
  });

  // Fetch machines for dropdown
  const { data: machines, isLoading: isLoadingMachines } = useQuery({
    queryKey: ['/api/machines'],
    enabled: true,
  });

  // Update local state when actions are loaded
  useEffect(() => {
    if (actionsData && Array.isArray(actionsData)) {
      setActions(actionsData);
    }
  }, [actionsData]);

  // Set form values when request data is loaded
  useEffect(() => {
    if (requestData && typeof requestData === 'object') {
      const machineId = requestData.machine_id !== undefined ? requestData.machine_id.toString() : "";
      const description = requestData.description || "";
      const notes = requestData.notes || "";
      const status = requestData.status || "New";
      
      form.reset({
        machine_id: machineId,
        description: description,
        notes: notes,
        status: status,
      });
      
      if (requestData.request_date) {
        setSelectedDate(new Date(requestData.request_date));
      }
    }
  }, [requestData, form]);

  // Mutation to create a new maintenance request
  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const dataToSend = {
        machine_id: parseInt(values.machine_id),
        description: values.description || "", // Ensure string not null
        notes: values.notes || "", // Ensure string not null
        request_date: selectedDate.toISOString(),
        status: values.status,
        created_by: 1, // Default to admin user if not specified
      };
      
      return await apiRequest('/api/maintenance-requests', {
        method: 'POST',
        body: JSON.stringify(dataToSend),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/maintenance-requests']});
      toast({
        title: "Maintenance request created",
        description: "The maintenance request has been created successfully.",
      });
      navigate("/maintenance");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create maintenance request. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating maintenance request:", error);
    },
  });

  // Mutation to update an existing maintenance request
  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const dataToSend = {
        machine_id: parseInt(values.machine_id),
        description: values.description || "", // Ensure string not null
        notes: values.notes || "", // Ensure string not null 
        request_date: selectedDate.toISOString(),
        status: values.status,
        created_by: 1, // Default to admin user if not specified
      };
      
      return await apiRequest(`/api/maintenance-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dataToSend),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/maintenance-requests']});
      queryClient.invalidateQueries({queryKey: ['/api/maintenance-requests', id]});
      toast({
        title: "Maintenance request updated",
        description: "The maintenance request has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update maintenance request. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating maintenance request:", error);
    },
  });

  // Mutation to create a new maintenance action
  const createActionMutation = useMutation({
    mutationFn: async (values: ActionFormValues) => {
      const dataToSend = {
        request_id: Number(id),
        machine_id: parseInt(form.getValues().machine_id),
        part_type: values.part_type || "", // Ensure string not null
        action_type: values.action_type || "", // Ensure string not null
        description: values.description || "", // Ensure string not null
        notes: values.notes || "", // Ensure string not null
        action_date: new Date().toISOString(),
      };
      
      console.log("Sending maintenance action data:", dataToSend);
      
      return await apiRequest('/api/maintenance-actions', {
        method: 'POST',
        body: JSON.stringify(dataToSend),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({queryKey: ['/api/maintenance-actions/request', id]});
      setActions(prev => [...prev, data]);
      setIsDialogOpen(false);
      actionForm.reset({
        part_type: "",
        action_type: "",
        description: "",
        notes: "",
      });
      toast({
        title: "Maintenance action added",
        description: "The maintenance action has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add maintenance action. Please try again.",
        variant: "destructive",
      });
      console.error("Error adding maintenance action:", error);
    },
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (id) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  // Handle action form submission
  const onSubmitAction = (values: ActionFormValues) => {
    createActionMutation.mutate(values);
  };

  // Define columns for the actions table
  const actionColumns = [
    {
      header: "Date",
      accessorKey: "action_date",
      cell: (action: any) => format(new Date(action.action_date), "MMM d, yyyy"),
    },
    {
      header: "Part Type",
      accessorKey: "part_type",
    },
    {
      header: "Action Type",
      accessorKey: "action_type",
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Notes",
      accessorKey: "notes",
      cell: (action: any) => action.notes || "—",
    },
  ];

  // Show a loading state while data is being fetched
  const isLoading = isLoadingRequest || isLoadingMachines || (id && isLoadingActions);
  
  // Helper to get the next status based on current status
  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "New": return "Under Maintain";
      case "Under Maintain": return "Fixed";
      default: return currentStatus;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/maintenance">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to List
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {id ? "View/Edit Maintenance Request" : "New Maintenance Request"}
          </h1>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Request Form</CardTitle>
            <CardDescription>
              {id ? "Edit the maintenance request details" : "Create a new maintenance request"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormSkeleton fields={5} columns={1} hasButtons={true} />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Maintenance Request Details</CardTitle>
              <CardDescription>
                {id ? "Edit the maintenance request details" : "Create a new maintenance request"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="request_date">Request Date</Label>
                      <DatePicker
                        date={selectedDate}
                        setDate={(date) => date && setSelectedDate(date)}
                        disabled={false}
                        placeholder="Select date"
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="machine_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Machine</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                            disabled={!!id}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select machine" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {machines && Array.isArray(machines) 
                                ? machines.map((machine: any) => (
                                    <SelectItem key={machine.id} value={machine.id.toString()}>
                                      {machine.identification} - {machine.code}
                                    </SelectItem>
                                  ))
                                : null}
                            </SelectContent>
                          </Select>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Under Maintain">Under Maintain</SelectItem>
                            <SelectItem value="Fixed">Fixed</SelectItem>
                          </SelectContent>
                        </Select>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the issue"
                            {...field}
                            rows={3}
                          />
                        </FormControl>

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
                            placeholder="Additional notes (optional)"
                            {...field}
                            rows={2}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/maintenance")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {id ? "Update Request" : "Create Request"}
                    </Button>
                    {id && requestData && typeof requestData === 'object' && 
                     'status' in requestData && requestData.status !== "Fixed" && (
                      <Button
                        type="button"
                        onClick={() => {
                          const nextStatus = getNextStatus(form.getValues().status);
                          form.setValue("status", nextStatus);
                          form.handleSubmit(onSubmit)();
                        }}
                      >
                        Advance to {getNextStatus(form.getValues().status)}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {id && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Maintenance Actions</CardTitle>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={requestData && typeof requestData === 'object' && 
                                     'status' in requestData && requestData.status === "Fixed"}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Action
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Maintenance Action</DialogTitle>
                    </DialogHeader>
                    <Form {...actionForm}>
                      <form onSubmit={actionForm.handleSubmit(onSubmitAction)} className="space-y-4">
                        <FormField
                          control={actionForm.control}
                          name="part_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Part Type</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select part type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Motor">Motor</SelectItem>
                                  <SelectItem value="Shaft">Shaft</SelectItem>
                                  <SelectItem value="Gear">Gear</SelectItem>
                                  <SelectItem value="Bearing">Bearing</SelectItem>
                                  <SelectItem value="Belt">Belt</SelectItem>
                                  <SelectItem value="Chain">Chain</SelectItem>
                                  <SelectItem value="Electrical">Electrical</SelectItem>
                                  <SelectItem value="Hydraulic">Hydraulic</SelectItem>
                                  <SelectItem value="Pneumatic">Pneumatic</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={actionForm.control}
                          name="action_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Action Type</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select action type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Repair">Repair</SelectItem>
                                  <SelectItem value="Replace">Replace</SelectItem>
                                  <SelectItem value="Adjust">Adjust</SelectItem>
                                  <SelectItem value="Clean">Clean</SelectItem>
                                  <SelectItem value="Lubricate">Lubricate</SelectItem>
                                  <SelectItem value="Workshop">Workshop</SelectItem>
                                  <SelectItem value="External">External</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={actionForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe the action taken"
                                  {...field}
                                  rows={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={actionForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Additional notes (optional)"
                                  {...field}
                                  rows={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <DialogFooter>
                          <Button 
                            type="submit"
                            disabled={createActionMutation.isPending}
                          >
                            Add Action
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {actions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No maintenance actions recorded yet.
                  </div>
                ) : (
                  <DataTable
                    data={actions}
                    columns={actionColumns}
                    searchable={false}
                    pagination={false}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}