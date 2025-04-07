import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { PlusCircle, Edit, Trash2, FileUp, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { Customer, Salesperson } from "@shared/schema";
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
import { downloadCsv, uploadCsv } from "@/utils/csv";
import { TableSkeleton } from "@/components/ui/skeletons";
import { t } from "@/utils/language";

export default function CustomersList() {
  const { toast } = useToast();
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  
  // Fetch customers
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });
  
  // Fetch salespersons
  const { data: salespersons = [] } = useQuery<Salesperson[]>({
    queryKey: ['/api/salespersons'],
  });
  
  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/customers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t('customerDeleted', { fallback: "Customer deleted" }),
        description: t('customerDeletedDescription', { fallback: "The customer has been successfully deleted." }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setCustomerToDelete(null);
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('failedToDeleteCustomer', { fallback: `Failed to delete customer: ${error.message}` }),
        variant: "destructive",
      });
    }
  });
  
  // Import customers mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/customers', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import customers');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('importSuccess'),
        description: t('customersImported', { fallback: "Customers have been successfully imported." }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    },
    onError: (error) => {
      toast({
        title: t('importError'),
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
    downloadCsv('/api/export/customers', 'customers');
  };
  
  // Helper function to get salesperson name by ID
  const getSalespersonName = (salespersonId: number | null): string => {
    if (!salespersonId) return "N/A";
    
    const salesperson = salespersons.find(s => s.id === salespersonId);
    return salesperson ? salesperson.name : `ID: ${salespersonId}`;
  };
  
  // Table columns
  const columns = [
    {
      header: t('id'),
      accessorKey: "id" as const,
    },
    {
      header: t('name'),
      accessorKey: "name" as const,
      cell: (customer: Customer) => (
        <div className="flex flex-col">
          <span className="font-medium">{customer.name}</span>
          {customer.arabic_name && (
            <span dir="rtl" className="text-base text-slate-700 mt-1 font-semibold">
              {customer.arabic_name}
            </span>
          )}
        </div>
      )
    },
    {
      header: t('arabicName'),
      accessorKey: "arabic_name" as const,
      cell: (customer: Customer) => (
        <span dir="rtl" className="block text-right font-semibold text-base">
          {customer.arabic_name || "—"}
        </span>
      )
    },
    {
      header: t('address'),
      accessorKey: "address" as const,
    },
    {
      header: t('drawerNo'),
      accessorKey: "drawer_no" as const,
    },
    {
      header: t('salesperson'),
      accessorKey: "salesperson_id" as const,
      cell: (customer: Customer) => getSalespersonName(customer.salesperson_id)
    }
  ];
  
  // Actions for each row
  const actions = (customer: Customer) => (
    <div className="flex space-x-2">
      <Link href={`/customers/${customer.id}`}>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          {t('edit')}
        </Button>
      </Link>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setCustomerToDelete(customer)}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        {t('delete')}
      </Button>
    </div>
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('customers')}</h1>
          <p className="text-slate-600">{t('manageCustomers', { fallback: 'Manage and view all customers' })}</p>
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
            {t('import')}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            {t('export', { fallback: 'Export' })}
          </Button>
          <Link href="/customers/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('addCustomer', { fallback: 'Add Customer' })}
            </Button>
          </Link>
        </div>
      </div>
      
      <DataTable
        data={customers}
        columns={columns}
        actions={actions}
        isLoading={isLoading}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmDeletion', { fallback: 'Confirm Deletion' })}</DialogTitle>
            <DialogDescription>
              {t('confirmDeleteCustomer', { fallback: `Are you sure you want to delete customer "${customerToDelete?.name}"? This action cannot be undone.` })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCustomerToDelete(null)}
            >
              {t('cancel')}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => customerToDelete && deleteMutation.mutate(customerToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('deleting', { fallback: "Deleting..." }) : t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
