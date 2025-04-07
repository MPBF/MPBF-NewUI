import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { PlusCircle, Edit, Trash2, FileUp, FileDown, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { Order, Customer, JobOrder, Category, Product, Item } from "@shared/schema";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { downloadCsv, uploadCsv } from "@/utils/csv";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { generateArabicOrderPdf, ArabicOrderPdfData } from "@/utils/arabic-pdf";
import { normalizeArabicText, decodeArabicText, prepareArabicForPdf, formatArabicForDisplay } from "@/utils/arabic-text";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function OrdersList() {
  const { toast } = useToast();
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  
  // State for viewing order details
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [viewOrderJobOrders, setViewOrderJobOrders] = useState<JobOrder[]>([]);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  
  // Fetch orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });
  
  // Fetch customers for lookup
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });
  
  // Fetch job orders to get counts
  const { data: jobOrders = [], isLoading: isLoadingJobOrders } = useQuery<JobOrder[]>({
    queryKey: ['/api/job-orders'],
  });

  // Fetch categories and products for PDF generation
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  const { data: items = [], isLoading: isLoadingItems } = useQuery<Item[]>({
    queryKey: ['/api/items'],
  });
  
  // Loading state
  const isLoading = isLoadingOrders || isLoadingCustomers || isLoadingJobOrders || 
                   isLoadingCategories || isLoadingProducts || isLoadingItems;
  
  // Get customer name by id
  const getCustomerName = (customerId: number) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer ? customer.name : `Customer #${customerId}`;
  };
  
  // Get job order count for an order
  const getJobOrderCount = (orderId: number) => {
    return jobOrders?.filter(jo => jo.order_id === orderId).length || 0;
  };
  
  // Delete order mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/orders/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Order deleted",
        description: "The order has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setOrderToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete order: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Import orders mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/orders', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import orders');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Import successful",
        description: "Orders have been successfully imported.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };
  
  // Handle export
  const handleExport = () => {
    downloadCsv('/api/export/orders', 'orders');
  };
  
  // Function to view order details
  const handleViewOrder = async (orderId: number) => {
    try {
      setIsLoadingOrderDetails(true);
      
      // Fetch order details
      const orderResponse = await fetch(`/api/orders/${orderId}`);
      if (!orderResponse.ok) throw new Error("Failed to fetch order details");
      const order = await orderResponse.json();
      
      // Fetch job orders for this order
      const jobOrdersResponse = await fetch(`/api/job-orders/order/${orderId}`);
      if (!jobOrdersResponse.ok) throw new Error("Failed to fetch job orders");
      const orderJobOrders = await jobOrdersResponse.json();
      
      setViewOrder(order);
      setViewOrderJobOrders(orderJobOrders);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingOrderDetails(false);
    }
  };
  
  // Helper function to create a text-based HTML printout as fallback when PDF fails
  const createTextBasedPrintout = (order: any, jobOrders: any[], customer: any) => {
    try {
      // Create HTML version
      const formattedDate = format(new Date(order.order_date), "MMM d, yyyy");
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order #${order.id} - ${formattedDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
            h1 { color: #333; margin-bottom: 10px; }
            h2 { color: #444; margin-top: 20px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; }
            th { background-color: #3b5998; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .company-info { margin-bottom: 20px; }
            .order-info { border: 1px solid #ddd; padding: 15px; background-color: #f5f8ff; margin-bottom: 20px; }
            .print-button { padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; font-weight: bold; }
            .print-button.red { background: #f44336; }
            .note { background-color: #fff3cd; border: 1px solid #ffeeba; padding: 10px; margin: 10px 0; border-radius: 4px; }
            @media print {
              .no-print { display: none; }
              body { margin: 0; padding: 15px; }
              h1 { font-size: 18px; }
              table { font-size: 12px; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px;">
            <button class="print-button" onclick="window.print()">Print This Order</button>
            <button class="print-button red" onclick="window.close()">Close Window</button>
          </div>
          
          <div class="note no-print">
            <p><strong>Note:</strong> This is a HTML fallback version of the order. PDF generation encountered an issue.</p>
          </div>
          
          <div class="header">
            <div style="display: flex; align-items: center;">
              <h1>MODERN PLASTIC BAG FACTORY</h1>
            </div>
            <div>
              <h2>PRODUCTION ORDER #${order.id}</h2>
              <p>Date: ${formattedDate}</p>
            </div>
          </div>
          
          <div class="order-info">
            <p><strong>Customer:</strong> ${customer?.name || 'Unknown'}</p>
            ${customer?.arabic_name ? `<p><strong>Arabic Name:</strong> <span dir="rtl">${decodeArabicText(normalizeArabicText(customer.arabic_name))}</span></p>` : ''}
            ${customer?.drawer_no ? `<p><strong>Drawer No:</strong> ${customer.drawer_no}</p>` : ''}
            ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>PCID</th>
                <th>Category</th>
                <th>Product</th>
                <th>Size</th>
                <th>Thickness</th>
                <th>Material</th>
                <th>Masterbatch</th>
                <th>Printed</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${jobOrders.map((job: any) => {
                const item = items?.find((i: any) => i.id === job.item_id);
                const category = categories?.find((c: any) => c.id === job.category_id);
                const product = products?.find((p: any) => p.id === job.sub_category_id);
                
                return `
                  <tr>
                    <td>${item?.pcid || 'N/A'}</td>
                    <td>${category?.name || 'Unknown'}</td>
                    <td>${product?.name || 'Unknown'}</td>
                    <td>${job.size_details || 'N/A'}</td>
                    <td>${job.thickness || 'N/A'}</td>
                    <td>${job.raw_material || 'N/A'}</td>
                    <td>${job.mast_batch || 'N/A'}</td>
                    <td>${job.is_printed ? 'Yes' : 'No'}</td>
                    <td>${job.quantity || 0}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="company-info">
            <p><strong>Phone:</strong> +966 532044751</p>
            <p><strong>Email:</strong> modplast83@gmail.com</p>
            <p><strong>Address:</strong> Dammam - 3865-7760</p>
          </div>
        </body>
        </html>
      `;
      
      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Open in a new window
      window.open(blobUrl, '_blank');
      
    } catch (htmlError) {
      console.error("Error creating HTML fallback:", htmlError);
      toast({
        title: "HTML Fallback Failed",
        description: "Could not create a fallback printout. Please try again later.",
        variant: "destructive"
      });
    }
  };

  // Function to print an order using our new Arabic-enabled PDF generator
  const handlePrintOrder = async (orderId: number) => {
    try {
      // Show loading toast
      toast({
        title: "Generating PDF",
        description: "Preparing your order document with full details...",
      });
      
      // Fetch order details
      const orderResponse = await fetch(`/api/orders/${orderId}`);
      if (!orderResponse.ok) throw new Error("Failed to fetch order details");
      const order = await orderResponse.json();
      
      // Fetch job orders for this order
      const jobOrdersResponse = await fetch(`/api/job-orders/order/${orderId}`);
      if (!jobOrdersResponse.ok) throw new Error("Failed to fetch job orders");
      const orderJobOrders = await jobOrdersResponse.json();
      
      if (!orderJobOrders || orderJobOrders.length === 0) {
        toast({
          title: "Cannot generate printout",
          description: "This order has no job orders to print.",
          variant: "destructive"
        });
        return;
      }
      
      // Get customer information
      const customer = customers?.find(c => c.id === order.customer_id);
      
      // Prepare order data for the Arabic PDF generator
      const orderData: ArabicOrderPdfData = {
        orderId: order.id,
        orderDate: new Date(order.order_date),
        customerName: customer?.name || 'Unknown Customer',
        customerArabicName: customer?.arabic_name || '',
        customerDrawerNo: customer?.drawer_no || 'N/A',
        notes: order.notes || '',
        jobOrders: orderJobOrders.map((job: any) => {
          const item = items?.find((i: any) => i.id === job.item_id);
          const category = categories?.find((c: any) => c.id === job.category_id);
          const product = products?.find((p: any) => p.id === job.sub_category_id);
          
          return {
            pcid: item?.pcid || 'N/A',
            category: category?.name || 'Unknown',
            product: product?.name || 'Unknown',
            size_details: job.size_details || 'N/A',
            thickness: job.thickness || 0,
            cylinder_inch: job.cylinder_inch || 0,
            cutting_length_cm: job.cutting_length_cm || 0,
            raw_material: job.raw_material || 'N/A',
            mast_batch: job.mast_batch || 'N/A',
            is_printed: job.is_printed === true || job.is_printed === 'Yes',
            cutting_unit: job.cutting_unit || 'N/A',
            unit_weight_kg: job.unit_weight_kg || 0,
            packing: job.packing || 'N/A',
            punching: job.punching || 'N/A',
            cover: job.cover || 'N/A',
            quantity: job.quantity || 0
          };
        })
      };
      
      console.log("Generating order PDF with data:", JSON.stringify(orderData, null, 2));
      
      try {
        // Use our new Arabic PDF generator
        console.log("Using new Arabic-enabled PDF generator");
        generateArabicOrderPdf(orderData);
        
        // Show success message
        toast({
          title: "PDF Generated",
          description: "Order PDF with Arabic support has been created successfully.",
          variant: "default"
        });
      } catch (pdfError) {
        console.error("Error generating PDF:", pdfError);
        
        // Handle error with toast
        toast({
          title: "PDF Generation Failed",
          description: pdfError instanceof Error ? pdfError.message : "An unknown error occurred",
          variant: "destructive"
        });
        
        // Create text-based fallback
        createTextBasedPrintout(order, orderJobOrders, customer);
      }
    } catch (error) {
      console.error("Error with order printout:", error);
      toast({
        title: "Error",
        description: "Failed to prepare data for PDF generation.",
        variant: "destructive"
      });
    }
  };
  
  // Define columns for the orders table
  const columns = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: (order) => <Badge variant="outline">{order.id}</Badge>,
    },
    {
      accessorKey: "order_date",
      header: "Date",
      cell: (order) => format(new Date(order.order_date), "MMM d, yyyy"),
    },
    {
      accessorKey: "customer_id",
      header: "Customer",
      cell: (order) => getCustomerName(order.customer_id),
    },
    {
      accessorKey: "jobs",
      header: "Job Orders",
      cell: (order) => getJobOrderCount(order.id),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (order) => (
        <Badge variant={order.status === "Completed" ? "default" : "secondary"}>
          {order.status || "Pending"}
        </Badge>
      ),
    },
  ];

  // Define actions for each row
  const actions = (order) => {
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleViewOrder(order.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handlePrintOrder(order.id)}
        >
          <Printer className="h-4 w-4" />
        </Button>
        <Link href={`/orders/${order.id}`}>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setOrderToDelete(order)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Orders</h2>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileUpload}
            ref={(ref) => setFileInputRef(ref)}
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef?.click()}
            disabled={importMutation.isPending}
          >
            <FileUp className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Link href="/orders/new">
            <Button variant="default" size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columns={6} rows={5} />
      ) : (
        <DataTable columns={columns} data={orders} actions={actions} />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete order #{orderToDelete?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOrderToDelete(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => orderToDelete && deleteMutation.mutate(orderToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order details side panel */}
      <Sheet open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Order #{viewOrder?.id}</SheetTitle>
            <SheetDescription>
              Created on {viewOrder && format(new Date(viewOrder.order_date), "MMMM d, yyyy")}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {isLoadingOrderDetails ? (
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-20 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-40 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Name:</span> {
                          customers?.find(c => c.id === viewOrder?.customer_id)?.name || "Unknown"
                        }
                      </div>
                      {customers?.find(c => c.id === viewOrder?.customer_id)?.arabic_name && (
                        <div className="text-right">
                          <span className="font-medium ml-2">:الاسم العربي</span>
                          <span className="mr-2" dir="rtl">
                            {formatArabicForDisplay(customers?.find(c => 
                              c.id === viewOrder?.customer_id
                            )?.arabic_name || "")}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Drawer No:</span> {
                          customers?.find(c => c.id === viewOrder?.customer_id)?.drawer_no || "N/A"
                        }
                      </div>
                      {viewOrder?.notes && (
                        <div>
                          <span className="font-medium">Notes:</span> {viewOrder.notes}
                        </div>
                      )}
                      <div className="pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => viewOrder && handlePrintOrder(viewOrder.id)}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print Order
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Job Orders</CardTitle>
                    <CardDescription>
                      {viewOrderJobOrders.length} job order{viewOrderJobOrders.length !== 1 ? 's' : ''} found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {viewOrderJobOrders.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No job orders found for this order.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {viewOrderJobOrders.map((jobOrder) => {
                          const item = items?.find(i => i.id === jobOrder.item_id);
                          const category = categories?.find(c => c.id === jobOrder.category_id);
                          const product = products?.find(p => p.id === jobOrder.sub_category_id);
                          
                          return (
                            <Card key={jobOrder.id} className="border-l-4 border-l-primary">
                              <CardContent className="pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-medium">Job ID:</span> {jobOrder.id}
                                  </div>
                                  <div>
                                    <span className="font-medium">PCID:</span> {item?.pcid || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Category:</span> {category?.name || "Unknown"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Product:</span> {product?.name || "Unknown"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Size:</span> {jobOrder.size_details || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Thickness:</span> {jobOrder.thickness || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Material:</span> {jobOrder.raw_material || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Masterbatch:</span> {jobOrder.mast_batch || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Printed:</span> {jobOrder.is_printed ? "Yes" : "No"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Quantity:</span> {jobOrder.quantity || 0}
                                  </div>
                                  {jobOrder.notes && (
                                    <div className="col-span-2">
                                      <span className="font-medium">Notes:</span> {jobOrder.notes}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}