import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { PlusCircle, FileUp, Edit, Trash2, Eye, Package, Boxes, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { uploadCsv } from "@/utils/csv";
import { useLanguage, t } from "@/utils/language";
import { TableSkeleton } from "@/components/ui/skeletons";
import { usePermissions } from "@/utils/permissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Material types constants
const MATERIAL_TYPES = [
  "HDPE",
  "LDPE",
  "LLDPE",
  "Regrind",
  "Filler",
  "Color",
  "D2w"
];

// Define a more flexible type for table columns
interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

interface Mix {
  id: number;
  mix_date: string | Date;
  created_by: number;
  notes?: string | null;
}

interface MixItem {
  id: number;
  mix_id: number;
  material_type: string;
  quantity_kg: number;
  notes?: string | null;
}

interface Order {
  id: number;
  order_date: string;
  customer_id: number;
  customer_name?: string;
  status?: string;
}

interface Machine {
  id: number;
  identification: string;
  section: string;
  code: string;
  manufacturer_name?: string | null;
}

export default function MixList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { hasRole, isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const { language, isRtl } = useLanguage();

  // Query mixes
  const { data: mixes = [], isLoading: isLoadingMixes } = useQuery({
    queryKey: ["/api/mixes"],
    select: (data: Mix[]) => data.map(mix => ({
      ...mix,
      mix_date: new Date(mix.mix_date)
    })),
  });
  
  // Query mix items to get weights and percentages
  const { data: allMixItems = [], isLoading: isLoadingMixItems } = useQuery<MixItem[]>({
    queryKey: ["/api/mix-items"],
  });

  // Query for operators (users with Operator role)
  const { data: operators = [] } = useQuery({
    queryKey: ["/api/users"],
    select: (data: any[]) => data.filter(user => user.role === "Operator" || user.role === "ProductionManager"),
  });
  
  // Query for relatedOrders and relatedMachines for each mix
  const { data: mixOrdersMap = {}, isLoading: isLoadingOrders } = useQuery<Record<number, Order[]>>({
    queryKey: ["/api/mix-orders-map"],
    queryFn: async () => {
      // Make a separate API request for each mix to get related orders
      const orderMapPromises = mixes.map(async (mix) => {
        try {
          const orders = await apiRequest<Order[]>("GET", `/api/mixes/${mix.id}/orders`);
          return { mixId: mix.id, orders };
        } catch (error) {
          console.error(`Failed to fetch orders for mix ${mix.id}:`, error);
          return { mixId: mix.id, orders: [] };
        }
      });
      
      const orderMapResults = await Promise.all(orderMapPromises);
      
      // Convert to a map for efficient lookup
      const orderMap: Record<number, Order[]> = {};
      orderMapResults.forEach(result => {
        orderMap[result.mixId] = result.orders;
      });
      
      return orderMap;
    },
    enabled: mixes.length > 0, // Only run if mixes have loaded
  });
  
  // Query for machines associated with each mix
  const { data: mixMachinesMap = {}, isLoading: isLoadingMachines } = useQuery<Record<number, Machine[]>>({
    queryKey: ["/api/mix-machines-map"],
    queryFn: async () => {
      // Make a separate API request for each mix to get related machines
      const machineMapPromises = mixes.map(async (mix) => {
        try {
          const machines = await apiRequest<Machine[]>("GET", `/api/mixes/${mix.id}/machines`);
          return { mixId: mix.id, machines };
        } catch (error) {
          console.error(`Failed to fetch machines for mix ${mix.id}:`, error);
          return { mixId: mix.id, machines: [] };
        }
      });
      
      const machineMapResults = await Promise.all(machineMapPromises);
      
      // Convert to a map for efficient lookup
      const machineMap: Record<number, Machine[]> = {};
      machineMapResults.forEach(result => {
        machineMap[result.mixId] = result.machines;
      });
      
      return machineMap;
    },
    enabled: mixes.length > 0, // Only run if mixes have loaded
  });

  // For CSV import
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      return await uploadCsv('/api/import/mixes', file);
    },
    onSuccess: () => {
      toast({
        title: t("importSuccess", { lang: language }),
        description: t("mixesImported", { lang: language }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
    },
    onError: (error) => {
      toast({
        title: t("importError", { lang: language }),
        description: error.toString(),
        variant: "destructive",
      });
    },
  });

  // For mix deletion
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest<any>("DELETE", `/api/mixes/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t("deleteSuccess", { lang: language }),
        description: t("mixDeleted", { lang: language }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
    },
    onError: (error) => {
      toast({
        title: t("deleteError", { lang: language }),
        description: error.toString(),
        variant: "destructive",
      });
    },
  });

  // Handle CSV file import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  // Handle record deletion
  const handleDelete = (id: number) => {
    if (window.confirm(t("confirmDelete", { lang: language }))) {
      deleteMutation.mutate(id);
    }
  };

  // Get operator name by ID
  const getOperatorName = (operatorId: number) => {
    const operator = operators.find((user: any) => user.id === operatorId);
    return operator ? operator.name : `Operator #${operatorId}`;
  };

  // Efficiently get customers from the query client cache
  const getCustomerName = (customerId: number): string => {
    const customersQueryData = queryClient.getQueryData<any[]>(['/api/customers']);
    if (customersQueryData) {
      const customer = customersQueryData.find(c => c.id === customerId);
      return customer ? customer.name : `Customer #${customerId}`;
    }
    return `Customer #${customerId}`;
  };

  // For table columns - simplified as requested
  const columns = [
    {
      header: t("id", { lang: language }),
      accessorKey: "id",
      cell: (mix: Mix) => (
        <div className="font-medium">
          MIX-{mix.id.toString().padStart(3, '0')}
        </div>
      )
    },
    {
      header: t("date", { lang: language }),
      accessorKey: "mix_date",
      cell: (mix: Mix) => format(new Date(mix.mix_date), "MMM d, yyyy")
    },
    {
      header: t("mixItems", { lang: language }),
      accessorKey: "mix_items",
      cell: (mix: Mix) => {
        // Get all mix items for this mix
        const mixItems = allMixItems.filter((item: MixItem) => item.mix_id === mix.id);
        
        if (mixItems.length === 0) {
          return <span className="text-muted-foreground text-xs">No items</span>;
        }
        
        return (
          <div className="flex flex-col gap-2">
            <table className="min-w-full text-xs border-collapse">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-1 font-medium border">{t("id", { lang: language })}</th>
                  <th className="text-left p-1 font-medium border">{t("material", { lang: language })}</th>
                  <th className="text-right p-1 font-medium border">{t("quantity", { lang: language })}</th>
                </tr>
              </thead>
              <tbody>
                {mixItems.map((item, index) => (                  
                  <tr key={item.id} className={(index % 2 === 0) ? "bg-transparent" : "bg-muted/10"}>
                    <td className="p-1 border font-medium">
                      #{item.id}
                    </td>
                    <td className="p-1 border">
                      <div className="flex items-center">
                        <Scale className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="font-medium">{item.material_type}</span>
                      </div>
                    </td>
                    <td className="p-1 text-right border font-medium">
                      {item.quantity_kg.toFixed(1)} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }
  ];

  // Action buttons for each row
  const actions = (mix: Mix) => (
    <div className="flex space-x-2 rtl:space-x-reverse justify-end">
      <Button variant="ghost" size="icon" onClick={() => setLocation(`/production/mixing/view/${mix.id}`)}>
        <Eye className="h-4 w-4" />
      </Button>
      {(isAdmin || hasRole(["admin", "productionmanager", "ProductionManager", "Admin"])) && (
        <>
          <Button variant="ghost" size="icon" onClick={() => setLocation(`/production/mixing/edit/${mix.id}`)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(mix.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("mixes", { lang: language })}</CardTitle>
          <div className="flex space-x-2 rtl:space-x-reverse">
            {/* Use isAdmin directly to ensure admin can always add mixes */}
            {(isAdmin || hasRole(["admin", "productionmanager", "ProductionManager", "Admin"])) && (
              <>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("csvInput")?.click()}
                  disabled={importMutation.isPending}
                >
                  <FileUp className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t("import", { lang: language })}
                </Button>
                <input
                  id="csvInput"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => setLocation("/production/mixing/new-simple")}>
                        <PlusCircle className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                        {t("newMix", { lang: language })}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Simple Mix Form with Material Selection
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingMixes || isLoadingMixItems || isLoadingOrders || isLoadingMachines ? (
            <TableSkeleton columns={3} rows={5} hasActions />
          ) : (
            <DataTable
              data={mixes}
              columns={columns}
              searchable
              actions={actions}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}