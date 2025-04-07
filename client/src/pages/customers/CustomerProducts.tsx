import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Customer, Item, Product, Category } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { PlusCircle, Edit, Trash2, FileUp, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { downloadCsv, uploadCsv } from "@/utils/csv";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

export default function CustomerProducts() {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [location] = useLocation();

  // Parse URL params to pre-select customer if available
  useEffect(() => {
    // Check for customerId in URL
    const searchParams = typeof window !== 'undefined' 
      ? new URLSearchParams(window.location.search) 
      : new URLSearchParams('');
    
    const customerId = searchParams.get('customerId');
    if (customerId) {
      setSelectedCustomerId(parseInt(customerId));
    }
  }, [location]);

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Fetch customer's items when a customer is selected
  const { data: items = [], isLoading: isLoadingItems } = useQuery<Item[]>({
    queryKey: [`/api/items/customer/${selectedCustomerId}`],
    enabled: !!selectedCustomerId,
  });

  // Fetch categories for dropdown options
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch products for dropdown options
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/items/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted from this customer.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/items/customer/${selectedCustomerId}`] });
      setItemToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Import items mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/items', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import items');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Import successful",
        description: "Products have been successfully imported.",
      });
      
      // Invalidate all customer items queries and the current selected customer's items
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      if (selectedCustomerId) {
        queryClient.invalidateQueries({ queryKey: [`/api/items/customer/${selectedCustomerId}`] });
      }
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
    if (selectedCustomerId) {
      downloadCsv(`/api/export/items?customerId=${selectedCustomerId}`, `customer_${selectedCustomerId}_products`);
    } else {
      // Export all items if no customer is selected
      downloadCsv(`/api/export/items`, `all_customer_products`);
    }
  };

  // Get category and product names
  const getCategoryName = (categoryId: number): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : `Category ${categoryId}`;
  };

  const getProductName = (productId: number): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Product ${productId}`;
  };

  // Filter customers by search query (in both English and Arabic names)
  const filteredCustomers = searchQuery 
    ? customers.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (customer.arabic_name && customer.arabic_name.includes(searchQuery))
      )
    : customers;

  // Table columns for customer items
  const columns = [
    {
      header: "ID",
      accessorKey: "id" as const,
    },
    {
      header: "PCID",
      accessorKey: "pcid" as const,
    },
    {
      header: "Category",
      accessorKey: "category_id" as const,
      cell: (item: Item) => getCategoryName(item.category_id)
    },
    {
      header: "Product",
      accessorKey: "sub_category_id" as const,
      cell: (item: Item) => getProductName(item.sub_category_id)
    },
    {
      header: "Size Details",
      accessorKey: "size_details" as const,
    },
    {
      header: "Material",
      accessorKey: "raw_material" as const,
    }
  ];
  
  // Actions for each row
  const actions = (item: Item) => (
    <div className="flex space-x-2">
      <Button variant="outline" size="sm" asChild>
        <a href={`/items/${item.id}`}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </a>
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setItemToDelete(item)}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Products</h1>
          <p className="text-slate-600">Manage products for specific customers</p>
        </div>
        <div className="flex space-x-2">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
            ref={(input) => setFileInputRef(input)}
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef?.click()}
          >
            <FileUp className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            disabled={!selectedCustomerId}
            asChild
          >
            <a href={selectedCustomerId ? `/items/new?customerId=${selectedCustomerId}` : "#"}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Product
            </a>
          </Button>
        </div>
      </div>

      {/* Customer selector */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div>
          <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Customer
          </label>
          <Input
            id="customer-search"
            type="text"
            placeholder="Search by customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />
        </div>
        <div>
          <label htmlFor="customer-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Customer
          </label>
          <Select 
            onValueChange={(value) => setSelectedCustomerId(parseInt(value))}
            value={selectedCustomerId?.toString() || ""}
          >
            <SelectTrigger id="customer-select" className="w-full">
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {filteredCustomers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
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
        </div>
      </div>
      
      {/* Display customer items */}
      {selectedCustomerId ? (
        isLoadingItems ? (
          <div className="text-center p-6">
            <p>Loading customer products...</p>
          </div>
        ) : items.length > 0 ? (
          <DataTable
            data={items}
            columns={columns}
            actions={actions}
          />
        ) : (
          <div className="text-center p-6 bg-white shadow rounded-md">
            <p>No products found for this customer.</p>
          </div>
        )
      ) : (
        <div className="text-center p-6 bg-white shadow rounded-md">
          <p>Please select a customer to view their products.</p>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setItemToDelete(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}