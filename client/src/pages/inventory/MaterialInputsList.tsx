import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { FaPlus, FaTrash, FaArrowLeft } from "react-icons/fa";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

interface Material {
  id: number;
  identifier: string;
  name: string;
  starting_balance_kg: number;
  current_balance_kg: number;
  low_stock_threshold_kg: number | null;
  created_at: string;
  updated_at: string;
}

interface MaterialInput {
  id: number;
  input_identifier: string;
  material_id: number;
  quantity_kg: number;
  input_date: string;
  created_at: string;
}

interface MaterialInputsListProps {
  materialId?: number;
}

export default function MaterialInputsList({ materialId }: MaterialInputsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  
  // Query to fetch material details
  const { data: material, isLoading: isLoadingMaterial } = useQuery<Material>({
    queryKey: ['/api/materials', materialId],
    enabled: !!materialId,
  });
  
  // Query to fetch material inputs
  const { data: inputs, isLoading: isLoadingInputs } = useQuery<MaterialInput[]>({
    queryKey: ['/api/material-inputs/material', materialId],
    enabled: !!materialId,
    select: (data: MaterialInput[]) => {
      // Sort inputs by date (newest first)
      return [...data].sort((a, b) => 
        new Date(b.input_date).getTime() - new Date(a.input_date).getTime()
      );
    }
  });
  
  // Mutation to delete an input
  const deleteInput = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/material-inputs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Input record deleted successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/material-inputs/material', materialId] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials', materialId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete input record",
        description: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });
  
  // Column definitions for the data table
  const columns = [
    {
      header: "Input ID",
      accessorKey: "input_identifier",
    },
    {
      header: "Date",
      accessorKey: "input_date",
      cell: (input: MaterialInput) => format(new Date(input.input_date), "MMM d, yyyy")
    },
    {
      header: "Quantity (kg)",
      accessorKey: "quantity_kg",
      cell: (input: MaterialInput) => input.quantity_kg.toFixed(2)
    },
    {
      header: "Recorded On",
      accessorKey: "created_at",
      cell: (input: MaterialInput) => format(new Date(input.created_at), "MMM d, yyyy HH:mm")
    },
  ];
  
  // Function to render action buttons for each input
  const actions = (input: MaterialInput) => (
    <div className="flex items-center gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <FaTrash className="h-4 w-4 text-red-600" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this input record ({input.input_identifier}) of {input.quantity_kg.toFixed(2)} kg.
              The current balance of the material will be adjusted accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteInput.mutate(input.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
  
  const isLoading = isLoadingMaterial || isLoadingInputs;
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <TableSkeleton />
      </div>
    );
  }
  
  if ((!material || Object.keys(material).length === 0) && materialId) {
    return (
      <div className="container mx-auto py-6 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Material not found</CardDescription>
          </CardHeader>
          <CardContent>
            <p>The requested material could not be found.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/inventory/materials")}>
              Return to Materials List
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Calculate total inputs quantity
  const totalInputsQty = inputs?.reduce((sum, input) => sum + input.quantity_kg, 0) || 0;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link to="/inventory/materials">
              <FaArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Material Inputs</h1>
        </div>
        <p className="text-muted-foreground">
          View input history for {material?.name} ({material?.identifier})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Starting Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{material?.starting_balance_kg ? material.starting_balance_kg.toFixed(2) : "0.00"} <span className="text-sm">kg</span></p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{material?.current_balance_kg ? material.current_balance_kg.toFixed(2) : "0.00"} <span className="text-sm">kg</span></p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalInputsQty.toFixed(2)} <span className="text-sm">kg</span></p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Input Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{inputs?.length || 0}</p>
          </CardContent>
        </Card>
      </div>
      
      <Separator />
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Input History</h2>
        <Button
          onClick={() => navigate(`/inventory/inputs/new?materialId=${materialId}`)}
        >
          <FaPlus className="mr-2 h-4 w-4" /> Record New Input
        </Button>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DataTable
          data={inputs || []}
          columns={columns}
          searchable={true}
          pagination={true}
          actions={actions}
        />
      </motion.div>
    </div>
  );
}