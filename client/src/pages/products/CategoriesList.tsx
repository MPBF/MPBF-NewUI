import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { PlusCircle, Edit, Trash2, FileUp, FileDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { Category } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";

export default function CategoriesList() {
  const { toast } = useToast();
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  
  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Fetch products to count by category
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products'],
  });
  
  // Loading state
  const isLoading = isLoadingCategories || isLoadingProducts;
  
  // Count products by category
  const getProductCount = (categoryId: number) => {
    return products?.filter(p => p.category_id === categoryId).length || 0;
  };
  
  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/categories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Category deleted",
        description: "The category has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setCategoryToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete category: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Import categories mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/categories', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import categories');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Import successful",
        description: "Categories have been successfully imported.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
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
    downloadCsv('/api/export/categories', 'categories');
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
      header: "Code",
      accessorKey: "category_identification" as const,
    },
    {
      header: "Products",
      accessorKey: "id" as const,
      cell: (category: Category) => (
        <Badge variant="secondary" className="bg-primary-100 hover:bg-primary-100 text-primary-800">
          {getProductCount(category.id)}
        </Badge>
      )
    }
  ];
  
  // Actions for each row
  const actions = (category: Category) => (
    <div className="flex space-x-2">
      <Link href={`/categories/${category.id}`}>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </Link>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setCategoryToDelete(category)}
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Product Categories</h1>
          <p className="text-slate-600">Manage product categories</p>
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
          <Link href="/categories/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </Link>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center p-6">
          <p>Loading categories...</p>
        </div>
      ) : (
        <DataTable
          data={categories || []}
          columns={columns}
          actions={actions}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete category "{categoryToDelete?.name}"?
              {getProductCount(categoryToDelete?.id || 0) > 0 && (
                <div className="mt-2 text-red-500 font-semibold">
                  Warning: This category has {getProductCount(categoryToDelete?.id || 0)} products associated with it. 
                  Deleting it may affect these products.
                </div>
              )}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCategoryToDelete(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => categoryToDelete && deleteMutation.mutate(categoryToDelete.id)}
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
