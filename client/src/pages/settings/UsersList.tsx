import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { PlusCircle, Edit, Trash2, FileUp, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { User } from "@shared/schema";
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
import { useAuth } from "@/utils/auth";
import { TableSkeleton } from "@/components/ui/skeletons";

export default function UsersList() {
  const { toast } = useToast();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const { user: currentUser } = useAuth();
  
  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/users/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "The user has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setUserToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Import users mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/import/users', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import users');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Import successful",
        description: "Users have been successfully imported.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
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
    downloadCsv('/api/export/users', 'users');
  };
  
  // Table columns
  const columns = [
    {
      header: "ID",
      accessorKey: "id" as const,
    },
    {
      header: "Username",
      accessorKey: "username" as const,
    },
    {
      header: "Name",
      accessorKey: "name" as const,
    },
    {
      header: "Role",
      accessorKey: "role" as const,
      cell: (user: User) => {
        // Get display name for the role
        const roleDisplay = {
          admin: 'Admin',
          production_manager: 'Production Manager',
          salesperson: 'Salesperson',
          operator: 'Operator'
        }[user.role] || user.role;
        
        return (
          <Badge
            className={`${
              user.role === 'admin' ? 'bg-red-100 text-red-800' : 
              user.role === 'production_manager' ? 'bg-blue-100 text-blue-800' :
              user.role === 'salesperson' ? 'bg-green-100 text-green-800' :
              'bg-slate-100 text-slate-800'
            }`}
          >
            {roleDisplay}
          </Badge>
        );
      }
    },
    {
      header: "Section",
      accessorKey: "section" as const,
    },
    {
      header: "Mobile",
      accessorKey: "mobile" as const,
    }
  ];
  
  // Actions for each row
  const actions = (user: User) => (
    <div className="flex space-x-2">
      <Link href={`/settings/users/${user.id}`}>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </Link>
      {/* Don't allow deleting self or if not admin */}
      {currentUser?.role === 'admin' && currentUser?.id !== user.id && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setUserToDelete(user)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      )}
    </div>
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-600">Manage system users</p>
        </div>
        {currentUser?.role === 'admin' && (
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
            <Link href="/settings/users/new">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      <DataTable
        data={users}
        columns={columns}
        actions={actions}
        isLoading={isLoading}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user "{userToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUserToDelete(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
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
