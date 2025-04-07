import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PermissionAwareContent, RoleAwareContent } from "@/components/ui/role-aware-content";
import { apiRequest } from "@/lib/queryClient";
import { usePermissions } from "@/utils/permissions";
import { uploadCsv } from "@/utils/csv";

// Section options for machines
export const SECTION_OPTIONS = [
  { value: "Extruder", label: "Extruder" },
  { value: "Printing", label: "Printing" },
  { value: "Cutting", label: "Cutting" },
];

// Badge variants based on section
const getSectionBadgeVariant = (section: string) => {
  switch (section.toLowerCase()) {
    case 'extruder':
      return 'default';
    case 'extrusion': // For backward compatibility with existing data
      return 'default';
    case 'printing':
      return 'secondary';
    case 'cutting':
      return 'outline';
    default:
      return 'default';
  }
};

export default function MachineList() {
  const [, navigate] = useLocation();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Upload CSV mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return uploadCsv('/api/machines/import', file);
    },
    onSuccess: () => {
      toast({
        title: "Import successful",
        description: "Machines data has been imported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import machines data",
        variant: "destructive",
      });
    }
  });

  // Query to fetch machines data
  const { data: machines, isLoading } = useQuery({
    queryKey: ['/api/machines'],
    queryFn: () => apiRequest<Machine[]>('GET', '/api/machines'),
  });

  // Query to fetch machine options data for filtering
  const { data: machineOptions } = useQuery({
    queryKey: ['/api/machine-options'],
    queryFn: () => apiRequest<MachineOption[]>('GET', '/api/machine-options'),
  });

  // Delete machine mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/machines/${id}`),
    onSuccess: () => {
      toast({
        title: "Machine deleted",
        description: "The machine has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete machine",
        variant: "destructive",
      });
    }
  });

  // Columns for the DataTable
  const columns = [
    {
      header: "Identification",
      accessorKey: "identification",
    },
    {
      header: "Section",
      accessorKey: "section",
      cell: (machine: Machine) => {
        // Convert any "Extrusion" values to "Extruder" for display
        const displaySection = machine.section === "Extrusion" ? "Extruder" : machine.section;
        return (
          <Badge variant={getSectionBadgeVariant(machine.section)}>
            {displaySection}
          </Badge>
        );
      }
    },
    {
      header: "Code",
      accessorKey: "code",
    },
    {
      header: "Production Date",
      accessorKey: "production_date",
      cell: (machine: Machine) => format(new Date(machine.production_date), "MMM d, yyyy")
    },
    {
      header: "Serial No.",
      accessorKey: "serial_number",
      cell: (machine: Machine) => machine.serial_number || "—"
    },
    {
      header: "Manufacturer",
      accessorKey: "manufacturer_name",
      cell: (machine: Machine) => machine.manufacturer_name || "—"
    },
  ];

  // Action buttons for each row
  const actions = (machine: Machine) => (
    <div className="flex space-x-2">
      <PermissionAwareContent permission="machines:edit">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/machines/${machine.id}`)}
        >
          Edit
        </Button>
      </PermissionAwareContent>
      <PermissionAwareContent permission="machines:delete">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm(`Are you sure you want to delete the machine ${machine.identification}?`)) {
              deleteMutation.mutate(machine.id);
            }
          }}
        >
          Delete
        </Button>
      </PermissionAwareContent>
    </div>
  );

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Machines</CardTitle>
            <CardDescription>
              View and manage all machines in the factory
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <RoleAwareContent adminContent={
              <div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "Importing..." : "Import CSV"}
                </Button>
              </div>
            } />
            <PermissionAwareContent permission="machines:create">
              <Button onClick={() => navigate("/machines/new")}>
                Add Machine
              </Button>
            </PermissionAwareContent>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <DataTable
              data={machines || []}
              columns={columns}
              searchable
              pagination
              actions={hasPermission("machines:edit") || hasPermission("machines:delete") ? actions : undefined}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Types
interface Machine {
  id: number;
  identification: string;
  section: string;
  code: string;
  production_date: string;
  serial_number: string | null;
  manufacturer_code: string | null;
  manufacturer_name: string | null;
}

interface MachineOption {
  id: number;
  option_details: string;
  section: string;
}