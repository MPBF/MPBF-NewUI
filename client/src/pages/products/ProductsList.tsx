import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { PlusCircle, Edit, Trash2, FileUp, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { Product } from "@shared/schema";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { downloadCsv } from "@/utils/csv";

export default function ProductsList() {
  const { toast } = useToast();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  
  // Fetch products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
  });
  
  // Fetch categories for lookup
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Loading state
  const isLoading = isLoadingProducts || isLoadingCategories;
  
  // Get category name by id
  const getCategoryName = (categoryId: number) => {
    const category = categories?.find(c => c.id === categoryId);
    return category ? category.name : `Category #${categoryId}`;
  };
  
  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setProductToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Import products mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/products', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import products');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Import successful",
        description: "Products have been successfully imported.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
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
    downloadCsv('/api/export/products', 'products');
  };
  
  // Table columns
  const columns = [
    {
      header: "ID",
      accessorKey: "id" as const,
    },
    {
      header: "Name",
      accessorKey: "name" as const,
    },
    {
      header: "Size Caption",
      accessorKey: "size_caption" as const,
    },
    {
      header: "Category",
      accessorKey: "category_id" as const,
      cell: (product: Product) => getCategoryName(product.category_id)
    },
    {
      header: "Product Code",
      accessorKey: "product_identification" as const,
    }
  ];
  
  // Actions for each row
  const actions = (product: Product) => (
    <div className="flex space-x-2">
      <Link href={`/products/${product.id}`}>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </Link>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setProductToDelete(product)}
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
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600">Manage product catalog</p>
        </div>
        <div className="flex space-x-2">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
            ref={(input) => setFileInputRef(input)}
          />
          <Button variant="outline" onClick={() => fileInputRef?.click()}>
            <FileUp className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/categories">
            <Button variant="outline">
              Manage Categories
            </Button>
          </Link>
          <Link href="/products/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center p-6">
          <p>Loading products...</p>
        </div>
      ) : (
        <DataTable
          data={products || []}
          columns={columns}
          actions={actions}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete product "{productToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setProductToDelete(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => productToDelete && deleteMutation.mutate(productToDelete.id)}
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
