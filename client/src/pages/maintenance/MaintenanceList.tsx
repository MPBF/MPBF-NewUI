import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Plus, 
  Filter, 
  Download, 
  Upload,
  FileSpreadsheet
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/DataTable";
import { TableSkeleton } from "@/components/ui/skeletons";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { downloadCsv, uploadCsv } from "@/utils/csv";
import { t } from "@/utils/language";

interface MaintenanceRequest {
  id: number;
  request_date: string;
  machine_id: number;
  created_by: number;
  status: string;
  description: string;
  notes?: string | null;
}

interface Machine {
  id: number;
  identification: string;
  section: string;
  code: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export default function MaintenanceList() {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [machineStats, setMachineStats] = useState<{[key: string]: {total: number, critical: number, under_maintain: number}}>({}); 
  const [priorityRequests, setPriorityRequests] = useState<MaintenanceRequest[]>([]);

  // Fetch maintenance requests
  const { data: maintenanceRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['/api/maintenance-requests'],
    enabled: true
  });

  // Fetch machines for display
  const { data: machines, isLoading: isLoadingMachines } = useQuery({
    queryKey: ['/api/machines'],
    enabled: true
  });

  // Fetch users for display
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: true
  });

  // Calculate machine statistics and priority requests when data is loaded
  useEffect(() => {
    if (maintenanceRequests && Array.isArray(maintenanceRequests) && machines && Array.isArray(machines)) {
      // Calculate statistics for each machine
      const stats: {[key: string]: {total: number, critical: number, under_maintain: number}} = {};
      
      // Initialize stats for all machines
      machines.forEach((machine: Machine) => {
        stats[machine.id] = { total: 0, critical: 0, under_maintain: 0 };
      });
      
      // Count requests by machine and status
      maintenanceRequests.forEach((request: MaintenanceRequest) => {
        const machineId = request.machine_id;
        if (!stats[machineId]) {
          stats[machineId] = { total: 0, critical: 0, under_maintain: 0 };
        }
        
        stats[machineId].total += 1;
        
        if (request.status === 'Critical') {
          stats[machineId].critical += 1;
        } else if (request.status === 'Under Maintain') {
          stats[machineId].under_maintain += 1;
        }
      });
      
      setMachineStats(stats);
      
      // Find priority requests (Critical ones or machines with multiple issues)
      const priority = maintenanceRequests.filter((request: MaintenanceRequest) => {
        return request.status === 'Critical' || 
               (stats[request.machine_id]?.total > 2); // Machines with more than 2 issues
      });
      
      setPriorityRequests(priority);
    }
  }, [maintenanceRequests, machines]);

  // Filter requests by status
  const filteredRequests = selectedStatus === 'all' 
    ? maintenanceRequests 
    : maintenanceRequests && Array.isArray(maintenanceRequests)
      ? maintenanceRequests.filter((request: MaintenanceRequest) => 
          request.status === selectedStatus
        )
      : [];

  // Handle CSV import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    
    try {
      const result = await uploadCsv('/api/import/maintenance-requests', event.target.files[0]);
      toast({
        title: t('importSuccess'),
        description: `${result.count} maintenance requests imported.`,
      });
    } catch (error) {
      toast({
        title: t('importError'),
        description: "Failed to import maintenance requests.",
        variant: "destructive"
      });
    }
  };

  // Get machine info by ID
  const getMachineName = (machineId: number) => {
    if (!machines || !Array.isArray(machines)) return "—";
    const machine = machines.find((m: Machine) => m.id === machineId);
    return machine ? machine.identification : "—";
  };

  // Get machine code by ID
  const getMachineCode = (machineId: number) => {
    if (!machines || !Array.isArray(machines)) return "—";
    const machine = machines.find((m: Machine) => m.id === machineId);
    return machine ? machine.code : "—";
  };

  // Get user name by ID
  const getUserName = (userId: number) => {
    if (!users || !Array.isArray(users)) return "—";
    const user = users.find((u: User) => u.id === userId);
    return user ? user.name : "—";
  };

  // Render status badge with appropriate color and intelligence
  const renderStatus = (status: string) => {
    const getStatusInfo = (status: string) => {
      switch (status) {
        case 'New':
          return {
            variant: "outline",
            className: "bg-blue-50 text-blue-800 border-blue-300",
            icon: <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5 animate-pulse" />,
            label: "New"
          };
        case 'Under Maintain':
          return {
            variant: "outline",
            className: "bg-yellow-50 text-yellow-800 border-yellow-300",
            icon: <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5 animate-pulse" />,
            label: "Under Maintain"
          };
        case 'Fixed':
          return {
            variant: "outline",
            className: "bg-green-50 text-green-800 border-green-300",
            icon: <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />,
            label: "Fixed"
          };
        case 'Pending Parts':
          return {
            variant: "outline",
            className: "bg-purple-50 text-purple-800 border-purple-300",
            icon: <div className="w-2 h-2 rounded-full bg-purple-500 mr-1.5" />,
            label: "Pending Parts"
          };
        case 'Critical':
          return {
            variant: "outline",
            className: "bg-red-50 text-red-800 border-red-300",
            icon: <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-ping" />,
            label: "Critical"
          };
        default:
          return {
            variant: "outline",
            className: "",
            icon: null,
            label: status
          };
      }
    };

    const statusInfo = getStatusInfo(status);
    
    return (
      <Badge variant={statusInfo.variant as any} className={`flex items-center ${statusInfo.className}`}>
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  // Columns definition for DataTable
  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Date",
      accessorKey: "request_date",
      cell: (request: MaintenanceRequest) => format(new Date(request.request_date), "MMM d, yyyy")
    },
    {
      header: "Machine",
      accessorKey: "machine_id",
      cell: (request: MaintenanceRequest) => getMachineName(request.machine_id)
    },
    {
      header: "Machine Code",
      accessorKey: "machine_code",
      cell: (request: MaintenanceRequest) => getMachineCode(request.machine_id)
    },
    {
      header: "Reported By",
      accessorKey: "created_by",
      cell: (request: MaintenanceRequest) => getUserName(request.created_by)
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (request: MaintenanceRequest) => renderStatus(request.status)
    },
    {
      header: "Description",
      accessorKey: "description",
    }
  ];

  // Actions for each row
  const actions = (request: MaintenanceRequest) => (
    <div className="flex space-x-2">
      <Link href={`/maintenance/${request.id}`}>
        <Button variant="outline" size="sm">
          View/Edit
        </Button>
      </Link>
    </div>
  );

  // Loading state
  const isLoading = isLoadingRequests || isLoadingMachines || isLoadingUsers;

  // Calculate stats for UI display
  const calculateMaintenanceStats = () => {
    if (!maintenanceRequests || !Array.isArray(maintenanceRequests)) return {
      total: 0,
      new: 0,
      underMaintain: 0,
      fixed: 0,
      critical: 0,
      pendingParts: 0
    };
    
    return {
      total: maintenanceRequests.length,
      new: maintenanceRequests.filter(req => req.status === 'New').length,
      underMaintain: maintenanceRequests.filter(req => req.status === 'Under Maintain').length,
      fixed: maintenanceRequests.filter(req => req.status === 'Fixed').length,
      critical: maintenanceRequests.filter(req => req.status === 'Critical').length,
      pendingParts: maintenanceRequests.filter(req => req.status === 'Pending Parts').length
    };
  };
  
  const stats = calculateMaintenanceStats();

  return (
    <div className="space-y-6">
      {/* Intelligent Maintenance Dashboard */}
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Maintenance Dashboard</CardTitle>
          <CardDescription>
            Intelligent maintenance system with real-time tracking and prioritization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.new}</div>
              <div className="text-sm text-blue-700">New</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700">{stats.underMaintain}</div>
              <div className="text-sm text-yellow-700">Under Maintain</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{stats.fixed}</div>
              <div className="text-sm text-green-700">Fixed</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
              <div className="text-sm text-red-700">Critical</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">{stats.pendingParts}</div>
              <div className="text-sm text-purple-700">Pending Parts</div>
            </div>
          </div>
          
          {/* Priority Maintenance Section */}
          {priorityRequests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Priority Maintenance</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-ping"></div>
                  <h4 className="font-medium text-red-800">Attention Required</h4>
                </div>
                <ul className="divide-y divide-red-100">
                  {priorityRequests.slice(0, 3).map((request) => (
                    <li key={request.id} className="py-2">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="font-medium">{getMachineName(request.machine_id)}</span>
                          <span className="mx-2 text-red-300">•</span>
                          <span className="text-sm text-gray-600">{request.description.substring(0, 40)}...</span>
                        </div>
                        <Link href={`/maintenance/${request.id}`}>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                            View
                          </Button>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
                {priorityRequests.length > 3 && (
                  <div className="text-center mt-2">
                    <Button variant="ghost" size="sm" 
                      onClick={() => setSelectedStatus('Critical')}
                      className="text-red-600 hover:text-red-800">
                      View all {priorityRequests.length} priority items
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Machine Health Indicators */}
          {Object.keys(machineStats).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Machine Health Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(machineStats)
                  .filter(([_, stats]) => stats.total > 0)
                  .sort((a, b) => b[1].critical - a[1].critical || b[1].total - a[1].total)
                  .slice(0, 6)
                  .map(([machineId, stats]) => {
                    const machine = machines?.find((m: Machine) => m.id === Number(machineId));
                    if (!machine) return null;
                    
                    // Calculate health percentage (fewer issues = better health)
                    const healthPercentage = Math.max(0, 100 - (stats.critical * 30) - (stats.under_maintain * 10) - ((stats.total - stats.critical - stats.under_maintain) * 5));
                    
                    return (
                      <div key={machineId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{machine.identification}</h4>
                          <Badge variant={healthPercentage > 80 ? "default" : healthPercentage > 50 ? "secondary" : "destructive"}>
                            {healthPercentage}% Health
                          </Badge>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full mb-2">
                          <div 
                            className={`h-2 rounded-full ${
                              healthPercentage > 80 ? 'bg-green-500' : 
                              healthPercentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${healthPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {stats.total} {stats.total === 1 ? 'issue' : 'issues'} • 
                          {stats.critical > 0 && <span className="text-red-600"> {stats.critical} critical</span>}
                          {stats.under_maintain > 0 && <span className="text-yellow-600"> • {stats.under_maintain} in progress</span>}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Maintenance Requests List */}
      <Card className="max-w-6xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Maintenance Requests</CardTitle>
            <CardDescription>
              View and manage maintenance requests for machines
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Link href="/maintenance/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </Link>
            <div className="hidden md:flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCsv('/api/export/maintenance-requests', 'maintenance-requests')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv" 
                    onChange={handleImport}
                  />
                </label>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="all" 
            className="w-full"
            onValueChange={(value) => setSelectedStatus(value)}
          >
            <TabsList className="mb-4 grid w-full grid-cols-3 md:w-auto md:inline-flex">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="New">New</TabsTrigger>
              <TabsTrigger value="Under Maintain">Under Maintain</TabsTrigger>
              <TabsTrigger value="Fixed">Fixed</TabsTrigger>
              <TabsTrigger value="Critical">Critical</TabsTrigger>
              <TabsTrigger value="Pending Parts">Pending Parts</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedStatus} className="p-0">
              {isLoading ? (
                <TableSkeleton columns={6} rows={5} />
              ) : (
                <DataTable
                  data={Array.isArray(filteredRequests) ? filteredRequests : []}
                  columns={columns}
                  searchable={true}
                  pagination={true}
                  actions={actions}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}