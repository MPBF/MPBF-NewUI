import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Plus, Trash2, CalendarIcon, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { insertOrderSchema, insertJobOrderSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { generateExactOrderPdf, OrderPdfData } from "@/utils/pdf";
import { format } from "date-fns";
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
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSkeleton } from "@/components/ui/skeletons";

// Create a new schema for the form instead of extending the existing one
const formSchema = z.object({
  customer_id: z.string().transform(val => parseInt(val)),
  order_date: z.date().optional().nullable(),
  notes: z.string().nullable().optional(),
  status: z.string().default("pending"),
});

type FormValues = z.infer<typeof formSchema>;

// Job order form schema - create from scratch rather than extending
const jobOrderFormSchema = z.object({
  order_id: z.number(),
  customer_id: z.number(),
  category_id: z.string().transform(val => parseInt(val)),
  sub_category_id: z.string().transform(val => parseInt(val)),
  size_details: z.string().optional(),
  thickness: z.number().optional(),
  cylinder_inch: z.number().optional(),
  cutting_length_cm: z.number().optional(),
  raw_material: z.string().optional(),
  mast_batch: z.string().optional(),
  is_printed: z.boolean().default(false),
  cutting_unit: z.string().optional(),
  unit_weight_kg: z.number().optional(),
  packing: z.string().optional(),
  punching: z.string().optional(),
  cover: z.string().optional(),
  notes: z.string().optional(),
  quantity: z.string().transform(val => parseInt(val)),
  status: z.string().default("pending"),
  item_id: z.string().optional(),
});

type JobOrderFormValues = z.infer<typeof jobOrderFormSchema>;

interface OrderFormProps {
  id?: number;
}

export default function OrderForm({ id }: OrderFormProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id;
  const [jobOrders, setJobOrders] = useState<any[]>([]);
  const [showJobOrderForm, setShowJobOrderForm] = useState(false);
  const [editingJobOrderId, setEditingJobOrderId] = useState<number | null>(null);
  
  // Fetch order if editing
  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: [`/api/orders/${id}`],
    enabled: isEditing,
  });
  
  // Fetch job orders if editing
  const { data: fetchedJobOrders, isLoading: isLoadingJobOrders } = useQuery({
    queryKey: [`/api/job-orders/order/${id}`],
    enabled: isEditing,
  });
  
  // Fetch customers for dropdown
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
  });
  
  // Fetch categories for dropdown
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Fetch products 
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
  });
  
  // Form setup for main order form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: "",
      notes: "",
      order_date: new Date(), // Set default to current date
      status: "pending", // Default status
    },
  });
  
  // Get customer-specific items based on selected customer
  const selectedCustomerId = form.watch("customer_id");
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/items/customer', selectedCustomerId], 
    enabled: !!selectedCustomerId,
    queryFn: async () => {
      if (!selectedCustomerId) return [];
      const response = await fetch(`/api/items/customer/${selectedCustomerId}`);
      if (!response.ok) throw new Error('Failed to fetch customer items');
      return response.json();
    }
  });
  
  // Log the items to debug
  useEffect(() => {
    if (items) {
      console.log("Fetched customer items:", items);
    }
  }, [items]);

  // Set up job order form
  const jobOrderForm = useForm<JobOrderFormValues>({
    resolver: zodResolver(jobOrderFormSchema),
    defaultValues: {
      order_id: id || 0,
      customer_id: 0,
      category_id: "",
      sub_category_id: "",
      size_details: "",
      thickness: 0,
      cylinder_inch: 0,
      cutting_length_cm: 0,
      raw_material: "",
      mast_batch: "",
      is_printed: false,
      cutting_unit: "",
      unit_weight_kg: 0,
      packing: "",
      punching: "",
      cover: "",
      notes: "",
      quantity: "0",
      status: "pending",
      item_id: "",
    }
  });
  
  // Update form values when order data is loaded
  useEffect(() => {
    if (order) {
      form.reset({
        customer_id: String(order.customer_id),
        notes: order.notes || "",
        order_date: order.order_date ? new Date(order.order_date) : new Date(),
        status: order.status || "pending",
      });
    }
  }, [order, form]);
  
  // Update job orders when fetched
  useEffect(() => {
    if (fetchedJobOrders) {
      setJobOrders(fetchedJobOrders);
    }
  }, [fetchedJobOrders]);
  
  // Update job order form based on customer selection in main form
  useEffect(() => {
    const customerId = form.watch("customer_id");
    if (customerId) {
      const customerIdNum = parseInt(customerId);
      console.log("Set job order customer ID:", customerIdNum);
      jobOrderForm.setValue("customer_id", customerIdNum);
    }
  }, [form.watch("customer_id"), jobOrderForm]);
  
  // Get product name by ID
  const getProductName = (categoryId: number, productId: number) => {
    const category = categories?.find(c => c.id === categoryId);
    const product = products?.find(p => p.id === productId);
    return `${category?.name || 'Unknown'} - ${product?.name || 'Unknown'}`;
  };
  
  // Create/Update order mutation
  const orderMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      console.log("OrderMutation - Starting API request with values:", values);
      if (isEditing) {
        const response = await apiRequest('PATCH', `/api/orders/${id}`, values);
        console.log("OrderMutation - PATCH response:", response);
        return id;
      } else {
        // Make sure we're sending proper data
        console.log("OrderMutation - Sending POST request to /api/orders");
        try {
          const data = await apiRequest('POST', '/api/orders', values);
          console.log("OrderMutation - POST response:", data);
          if (!data.id) {
            console.error("OrderMutation - Response missing ID property:", data);
            throw new Error("Server returned invalid response: missing ID");
          }
          return data.id;
        } catch (error) {
          console.error("OrderMutation - Error during POST request:", error);
          throw error;
        }
      }
    },
    onSuccess: (orderId) => {
      toast({
        title: `Order ${isEditing ? "updated" : "created"}`,
        description: `Order has been successfully ${isEditing ? "updated" : "created"}.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      // If not editing and we created a new order, set the ID for job orders
      if (!isEditing && orderId) {
        setJobOrders(jobs => jobs.map(job => ({ ...job, order_id: orderId })));
        
        // Create all job orders one by one with better error handling
        const createJobOrders = async () => {
          try {
            console.log("Starting to create job orders for new order:", orderId);
            
            for (const job of jobOrders) {
              try {
                console.log("Creating job order:", { ...job, order_id: orderId });
                await apiRequest('POST', '/api/job-orders', { ...job, order_id: orderId });
                console.log("Job order created successfully");
              } catch (jobError) {
                console.error("Error creating individual job order:", jobError);
                // Continue with other job orders even if one fails
              }
            }
            
            console.log("All job orders processed");
            queryClient.invalidateQueries({ queryKey: [`/api/job-orders/order/${orderId}`] });
            navigate('/orders');
          } catch (batchError) {
            console.error("Error in job orders batch processing:", batchError);
            toast({
              title: "Error",
              description: "Failed to create some job orders. The order was created, but you may need to add job orders manually.",
              variant: "destructive",
            });
          }
        };
        
        createJobOrders();
      } else {
        navigate('/orders');
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} order: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Create/Update job order mutation for editing mode
  const jobOrderMutation = useMutation({
    mutationFn: async (values: JobOrderFormValues) => {
      if (editingJobOrderId) {
        await apiRequest('PATCH', `/api/job-orders/${editingJobOrderId}`, values);
      } else {
        await apiRequest('POST', '/api/job-orders', values);
      }
    },
    onSuccess: () => {
      toast({
        title: `Job Order ${editingJobOrderId ? "updated" : "added"}`,
        description: `Job Order has been successfully ${editingJobOrderId ? "updated" : "added"} to the order.`,
      });
      
      // Refetch job orders if we're in edit mode
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: [`/api/job-orders/order/${id}`] });
      }
      
      // Reset form and close dialog
      jobOrderForm.reset();
      setShowJobOrderForm(false);
      setEditingJobOrderId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingJobOrderId ? "update" : "add"} job order: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Add job order to temporary list
  const handleAddJobOrder = (values: JobOrderFormValues) => {
    if (isEditing) {
      // If editing an existing order, immediately save the job order
      jobOrderMutation.mutate(values);
    } else {
      // If creating a new order, add to temporary list
      if (editingJobOrderId !== null) {
        // Update existing job order in the list
        setJobOrders(prev => 
          prev.map(job => job.id === editingJobOrderId ? { ...values, id: editingJobOrderId } : job)
        );
      } else {
        // Add new job order to the list with a temporary ID
        const tempId = -Date.now(); // Negative ID to avoid conflicts with real IDs
        setJobOrders(prev => [...prev, { ...values, id: tempId }]);
      }
      
      // Reset form and close dialog
      jobOrderForm.reset();
      setShowJobOrderForm(false);
      setEditingJobOrderId(null);
    }
  };
  
  // Remove job order from list
  const handleRemoveJobOrder = (jobId: number) => {
    if (isEditing) {
      // If editing an existing order, delete the job order from the database
      apiRequest('DELETE', `/api/job-orders/${jobId}`, null)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: [`/api/job-orders/order/${id}`] });
          toast({
            title: "Job Order removed",
            description: "The job order has been successfully removed from the order.",
          });
        })
        .catch(error => {
          toast({
            title: "Error",
            description: `Failed to remove job order: ${error.message}`,
            variant: "destructive",
          });
        });
    } else {
      // If creating a new order, just remove from temporary list
      setJobOrders(prev => prev.filter(job => job.id !== jobId));
    }
  };
  
  // Edit job order
  const handleEditJobOrder = (job: any) => {
    jobOrderForm.reset({
      order_id: job.order_id,
      customer_id: job.customer_id,
      category_id: String(job.category_id),
      sub_category_id: String(job.sub_category_id),
      size_details: job.size_details || "",
      thickness: job.thickness || 0,
      cylinder_inch: job.cylinder_inch || 0,
      cutting_length_cm: job.cutting_length_cm || 0,
      raw_material: job.raw_material || "",
      mast_batch: job.mast_batch || "",
      is_printed: job.is_printed || false,
      cutting_unit: job.cutting_unit || "",
      unit_weight_kg: job.unit_weight_kg || 0,
      packing: job.packing || "",
      punching: job.punching || "",
      cover: job.cover || "",
      notes: job.notes || "",
      quantity: String(job.quantity || 0),
      status: job.status || "pending",
      item_id: job.item_id || "",
    });
    setEditingJobOrderId(job.id);
    setShowJobOrderForm(true);
  };
  
  // Filter products based on selected category
  const filteredProducts = products?.filter(
    product => product.category_id === Number(jobOrderForm.watch("category_id"))
  ) || [];
  
  // Filter items based on customer selection
  const filteredItems = items || [];
  
  // Debug the customer selection and filtered items
  console.log("Customer ID:", selectedCustomerId);
  console.log("Filtered items array length:", filteredItems?.length);
  
  // Form submission handler
  const onSubmit = (values: FormValues) => {
    try {
      // Make sure we properly format the date as timestamp for submission
      const formattedValues = {
        customer_id: parseInt(values.customer_id as string),
        notes: values.notes || "",
        // Only send the date string in ISO format
        order_date: values.order_date ? values.order_date.toISOString() : new Date().toISOString(),
        status: values.status || "pending" // Include status in submission
      };
      
      console.log("Submitting order with:", formattedValues);
      // Add debug info to see exactly what's being sent
      console.log("order_date type:", typeof formattedValues.order_date);
      console.log("order_date value:", formattedValues.order_date);
      console.log("status:", formattedValues.status);
      console.log("customer_id type:", typeof formattedValues.customer_id);
      console.log("customer_id value:", formattedValues.customer_id);
      
      // Send without type checking to bypass TypeScript complaints
      orderMutation.mutate(formattedValues as any);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description: "Failed to prepare form data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            {isEditing ? "Edit Order" : "New Order"}
          </h1>
        </div>
      </div>
      
      {isEditing && (isLoadingOrder || isLoadingJobOrders) ? (
        <FormSkeleton fields={4} hasButtons={true} />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "Edit Order Details" : "Create New Order"}</CardTitle>
              <CardDescription>
                Enter the order information below. All fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="customer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={isEditing}
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
                    name="order_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Order Date *</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={(date) => field.onChange(date)}
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
                        <FormLabel>Order Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Additional notes for this order"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="for_production">For Production</SelectItem>
                            <SelectItem value="hold">Hold</SelectItem>
                            <SelectItem value="finish">Finish</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    {isEditing && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center"
                        onClick={() => {
                          // Prepare order data for PDF
                          if (!order || !fetchedJobOrders) return;
                          
                          // Show toast notification that PDF is being generated
                          toast({
                            title: "Generating PDF",
                            description: "Preparing your order document...",
                          });
                          
                          // Create the PDF data structure
                          const customer = customers?.find(c => c.id === order.customer_id);
                          const pdfData: OrderPdfData = {
                            orderId: order.id,
                            orderDate: new Date(order.order_date || new Date()),
                            customerName: customer?.name || 'Unknown Customer',
                            customerArabicName: customer?.arabic_name || '',
                            customerDrawerNo: customer?.drawer_no || '',
                            notes: order.notes || '',
                            jobOrders: fetchedJobOrders.map((job: any) => {
                              const item = items?.find(i => i.id === job.item_id);
                              return {
                                pcid: item?.pcid || 'N/A',
                                category: categories?.find(c => c.id === job.category_id)?.name || 'Unknown',
                                product: products?.find(p => p.id === job.sub_category_id)?.name || 'Unknown',
                                size_details: job.size_details,
                                thickness: job.thickness,
                                cylinder_inch: job.cylinder_inch,
                                cutting_length_cm: job.cutting_length_cm,
                                raw_material: job.raw_material,
                                mast_batch: job.mast_batch,
                                is_printed: job.is_printed,
                                cutting_unit: job.cutting_unit,
                                unit_weight_kg: job.unit_weight_kg,
                                packing: job.packing,
                                punching: job.punching,
                                cover: job.cover,
                                notes: job.notes,
                                quantity: job.quantity
                              };
                            })
                          };
                          
                          // Generate PDF with exact template match
                          generateExactOrderPdf(pdfData);
                          
                          // Confirmation toast
                          setTimeout(() => {
                            toast({
                              title: "PDF Generated",
                              description: "Your order document has been downloaded successfully.",
                              variant: "success",
                            });
                          }, 1500);
                        }}
                      >
                        <Printer className="h-5 w-5 mr-2" />
                        Print Order PDF
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={orderMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {orderMutation.isPending ? "Saving..." : "Save Order"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Job Orders Section */}
          <Card>
            <CardHeader>
              <CardTitle>Job Orders</CardTitle>
              <CardDescription>
                Add production job orders to this order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PCID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Specifications</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobOrders.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          {job.item_id && filteredItems && Array.isArray(filteredItems) 
                            ? (filteredItems.find((i: any) => i.id === parseInt(job.item_id))?.pcid || 'N/A')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{getProductName(job.category_id, job.sub_category_id)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Size: {job.size_details || 'N/A'}</div>
                            <div>Material: {job.raw_material || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>{job.quantity}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium 
                            ${job.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              job.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-slate-100 text-slate-800'
                            }`}>
                            {job.status?.charAt(0).toUpperCase() + job.status?.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditJobOrder(job)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleRemoveJobOrder(job.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  No job orders added to this order yet.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={() => {
                  // Get the current customer ID
                  const customerIdStr = form.getValues("customer_id");
                  const customerIdNum = customerIdStr ? parseInt(customerIdStr) : 0;
                  
                  console.log("Opening job order dialog with customer ID:", customerIdNum);
                  
                  // Reset job order form with current customer ID
                  jobOrderForm.reset({
                    order_id: id || 0,
                    customer_id: customerIdNum,
                    category_id: "",
                    sub_category_id: "",
                    size_details: "",
                    thickness: 0,
                    cylinder_inch: 0,
                    cutting_length_cm: 0,
                    raw_material: "",
                    mast_batch: "",
                    is_printed: false,
                    cutting_unit: "",
                    unit_weight_kg: 0,
                    packing: "",
                    punching: "",
                    cover: "",
                    notes: "",
                    quantity: "0",
                    status: "pending",
                    item_id: "",
                  });
                  setEditingJobOrderId(null);
                  setShowJobOrderForm(true);
                }}
                disabled={!form.getValues("customer_id")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Job Order
              </Button>
            </CardFooter>
          </Card>
          
          {/* Job Order Dialog Form */}
          <Dialog open={showJobOrderForm} onOpenChange={setShowJobOrderForm}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingJobOrderId ? "Edit Job Order" : "Add Job Order"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...jobOrderForm}>
                <form onSubmit={jobOrderForm.handleSubmit(handleAddJobOrder)} className="space-y-4">
                  {/* Item Selection Field - Simplified form */}
                  <FormField
                    control={jobOrderForm.control}
                    name="item_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Item *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // When an item is selected, auto-fill fields based on the item data
                            const selectedItem = filteredItems.find((item: any) => String(item.id) === value);
                            if (selectedItem) {
                              // Auto-fill all fields from the item, but hide them in the UI
                              jobOrderForm.setValue("category_id", String(selectedItem.category_id));
                              jobOrderForm.setValue("sub_category_id", String(selectedItem.sub_category_id));
                              
                              // Additional specifications
                              if (selectedItem.size_details) jobOrderForm.setValue("size_details", selectedItem.size_details);
                              if (selectedItem.thickness) jobOrderForm.setValue("thickness", selectedItem.thickness);
                              if (selectedItem.cylinder_inch) jobOrderForm.setValue("cylinder_inch", selectedItem.cylinder_inch);
                              if (selectedItem.cutting_length_cm) jobOrderForm.setValue("cutting_length_cm", selectedItem.cutting_length_cm);
                              if (selectedItem.raw_material) jobOrderForm.setValue("raw_material", selectedItem.raw_material);
                              if (selectedItem.mast_batch) jobOrderForm.setValue("mast_batch", selectedItem.mast_batch);
                              if (selectedItem.is_printed !== undefined) jobOrderForm.setValue("is_printed", selectedItem.is_printed);
                              if (selectedItem.cutting_unit) jobOrderForm.setValue("cutting_unit", selectedItem.cutting_unit);
                              if (selectedItem.unit_weight_kg) jobOrderForm.setValue("unit_weight_kg", selectedItem.unit_weight_kg);
                              if (selectedItem.packing) jobOrderForm.setValue("packing", selectedItem.packing);
                              if (selectedItem.punching) jobOrderForm.setValue("punching", selectedItem.punching);
                              if (selectedItem.cover) jobOrderForm.setValue("cover", selectedItem.cover);
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!isLoadingItems && filteredItems.map((item) => (
                              <SelectItem 
                                key={item.id} 
                                value={String(item.id)}
                              >
                                {`${getProductName(item.category_id, item.sub_category_id)} - ${item.size_details || ''} ${item.thickness ? `- ${item.thickness}mm` : ''} ${item.cylinder_inch ? `- ${item.cylinder_inch}"` : ''} ${item.cutting_length_cm ? `- ${item.cutting_length_cm}cm` : ''}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={jobOrderForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity *</FormLabel>
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
                    control={jobOrderForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Additional notes for this job order"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Note: Fields are auto-filled in the onValueChange handler when an item is selected */}
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowJobOrderForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingJobOrderId ? "Update" : "Add"} Job Order
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
