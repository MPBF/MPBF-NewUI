import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSkeleton } from "@/components/ui/skeletons";
import { insertProductionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/utils/auth";
import { SECTION_OPTIONS } from "../machines/MachineList";

// Create our own form schema instead of extending the insertProductionSchema
const formSchema = z.object({
  order_id: z.string().transform(val => parseInt(val)),
  job_order_id: z.string().transform(val => parseInt(val)),
  customer_id: z.string().transform(val => parseInt(val)),
  product_id: z.string().transform(val => parseInt(val)),
  production_qty: z.string().transform(val => parseInt(val)),
  operator_id: z.string().transform(val => parseInt(val)),
  roll_no: z.string().transform(val => parseInt(val)).optional(),
  section: z.string().optional(),
  machine_id: z.string().transform(val => parseInt(val)).optional(),
  notes: z.string().optional().nullable(),
  status: z.string(),
  production_date: z.date({
    required_error: "Production date is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductionFormProps {
  id?: number;
}

export default function ProductionForm({ id }: ProductionFormProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!id;
  
  // Fetch production if editing
  const { data: production, isLoading: isLoadingProduction } = useQuery({
    queryKey: [`/api/productions/${id}`],
    enabled: isEditing,
  });
  
  // Fetch orders for dropdown
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
  });
  
  // Fetch job orders based on selected order
  const { data: jobOrders, isLoading: isLoadingJobOrders } = useQuery({
    queryKey: ['/api/job-orders'],
  });
  
  // Fetch customers for dropdown
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
  });
  
  // Fetch products for dropdown
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
  });
  
  // Fetch operators (users with Operator role)
  const { data: operators, isLoading: isLoadingOperators } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Fetch machines for dropdown
  const { data: machines, isLoading: isLoadingMachines } = useQuery({
    queryKey: ['/api/machines'],
  });
  
  // Filter operators with "Operator" role
  const filteredOperators = operators?.filter(user => user.role === "Operator") || [];
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      order_id: "",
      job_order_id: "",
      customer_id: "",
      product_id: "",
      production_qty: "",
      operator_id: user?.role === "Operator" ? String(user.id) : "",
      roll_no: "",
      section: user?.section || "",
      machine_id: "",
      notes: "",
      status: "ready_for_print",
      production_date: new Date(),
    },
  });
  
  // Update form values when production data is loaded
  useEffect(() => {
    if (production) {
      form.reset({
        order_id: String(production.order_id),
        job_order_id: String(production.job_order_id),
        customer_id: String(production.customer_id),
        product_id: String(production.product_id),
        production_qty: String(production.production_qty),
        operator_id: String(production.operator_id),
        roll_no: production.roll_no ? String(production.roll_no) : "",
        section: production.section || "",
        machine_id: production.machine_id ? String(production.machine_id) : "",
        notes: production.notes || "",
        status: production.status,
        production_date: new Date(production.production_date),
      });
    }
  }, [production, form]);
  
  // Filter job orders for the selected order
  const selectedOrderId = form.watch("order_id");
  const filteredJobOrders = jobOrders?.filter(
    job => job.order_id === (selectedOrderId ? Number(selectedOrderId) : 0)
  ) || [];

  // Update customer when job order changes
  useEffect(() => {
    const jobOrderId = form.watch("job_order_id");
    if (jobOrderId) {
      const selectedJobOrder = jobOrders?.find(jo => jo.id === Number(jobOrderId));
      if (selectedJobOrder) {
        form.setValue("customer_id", String(selectedJobOrder.customer_id));
        form.setValue("product_id", String(selectedJobOrder.sub_category_id));
      }
    }
  }, [form.watch("job_order_id"), jobOrders, form]);
  
  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditing) {
        await apiRequest('PATCH', `/api/productions/${id}`, values);
      } else {
        await apiRequest('POST', '/api/productions', values);
      }
    },
    onSuccess: () => {
      toast({
        title: `Production ${isEditing ? "updated" : "created"}`,
        description: `Production record has been successfully ${isEditing ? "updated" : "created"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/productions'] });
      navigate('/production');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} production record: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (values: FormValues) => {
    // Ensure the production date is properly formatted as ISO string
    let formattedDate;
    if (values.production_date instanceof Date) {
      formattedDate = values.production_date.toISOString();
    } else {
      formattedDate = new Date().toISOString();
    }
    
    const formattedValues = {
      ...values,
      production_date: formattedDate
    };
    
    console.log("Submitting production record:", formattedValues);
    mutation.mutate(formattedValues);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/production")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Production
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            {isEditing ? "Edit Production Record" : "New Production Record"}
          </h1>
        </div>
      </div>
      
      {isEditing && isLoadingProduction ? (
        <FormSkeleton fields={6} columns={2} hasButtons={true} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Production Details" : "Create New Production Record"}</CardTitle>
            <CardDescription>
              Enter the production information below. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="order_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset job order when order changes
                            form.setValue("job_order_id", "");
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an order" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!isLoadingOrders && orders?.map((order) => (
                              <SelectItem 
                                key={order.id} 
                                value={String(order.id)}
                              >
                                <div>
                                  Order #{order.id} - {customers?.find(c => c.id === order.customer_id)?.name || "Unknown Customer"}
                                  {customers?.find(c => c.id === order.customer_id)?.arabic_name && (
                                    <span dir="rtl" className="block text-sm text-slate-500">
                                      {customers?.find(c => c.id === order.customer_id)?.arabic_name}
                                    </span>
                                  )}
                                </div>
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
                    name="job_order_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Order *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!form.watch("order_id")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a job order" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredJobOrders.map((jobOrder) => {
                              // Find the product name
                              const product = products?.find(p => p.id === jobOrder.sub_category_id);
                              const productName = product ? product.name : 'Unknown Product';
                              
                              return (
                                <SelectItem 
                                  key={jobOrder.id} 
                                  value={String(jobOrder.id)}
                                >
                                  Job Order #{jobOrder.id} - {productName} {jobOrder.size_details ? `(${jobOrder.size_details})` : ''}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="customer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!!form.watch("job_order_id")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!isLoadingCustomers && customers?.map((customer) => (
                              <SelectItem 
                                key={customer.id} 
                                value={String(customer.id)}
                              >
                                <div className="flex flex-col">
                                  <span>{customer.name}</span>
                                  {customer.arabic_name && (
                                    <span dir="rtl" className="text-base text-slate-700 font-semibold">
                                      {customer.arabic_name}
                                    </span>
                                  )}
                                </div>
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
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!!form.watch("job_order_id")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!isLoadingProducts && products?.map((product) => (
                              <SelectItem 
                                key={product.id} 
                                value={String(product.id)}
                              >
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="production_qty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Production Quantity *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1"
                            placeholder="Enter quantity" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="operator_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operator *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={user?.role === "Operator"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an operator" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!isLoadingOperators && operators?.map((op) => (
                              <SelectItem 
                                key={op.id} 
                                value={String(op.id)}
                              >
                                {op.name} {op.role === "Operator" ? "" : `(${op.role})`}
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
                    name="roll_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll No.</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select roll number" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                              <SelectItem 
                                key={num} 
                                value={String(num)}
                              >
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset machine when section changes
                            form.setValue("machine_id", "");
                          }}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Extruder">Extruder</SelectItem>
                            <SelectItem value="Printing">Printing</SelectItem>
                            <SelectItem value="Cutting">Cutting</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="machine_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Machine</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ""}
                          disabled={!form.watch("section")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select machine" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!isLoadingMachines && machines
                              ?.filter(machine => machine.section === form.watch("section"))
                              .map((machine) => (
                                <SelectItem 
                                  key={machine.id} 
                                  value={String(machine.id)}
                                >
                                  {machine.identification} ({machine.code})
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ready_for_print">Ready For Print</SelectItem>
                            <SelectItem value="ready_for_cut">Ready For Cut</SelectItem>
                            <SelectItem value="ready_for_deliver">Ready For Deliver</SelectItem>
                            <SelectItem value="damage">Damage</SelectItem>
                          </SelectContent>
                        </Select>
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
                          setDate={(date) => field.onChange(date)}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Additional notes for this production record"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {mutation.isPending ? "Saving..." : "Save Record"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
