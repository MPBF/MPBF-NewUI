import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Clock, Factory } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface JobOrder {
  id: number;
  order_id: number;
  customer_id: number;
  category_id: number;
  sub_category_id: number;
  item_id: number;
  quantity: number;
  produced_quantity?: number;
  waste_quantity?: number;
  production_status?: string;
  status: string;
  size_details?: string | null;
  thickness?: number | null;
  cylinder_inch?: number | null;
  cutting_length_cm?: number | null;
  raw_material?: string | null;
  mast_batch?: string | null;
  is_printed: boolean;
  cutting_unit?: string | null;
  unit_weight_kg?: number | null;
  packing?: string | null;
  punching?: string | null;
  cover?: string | null;
  notes?: string | null;
}

interface ProductionProgressWidgetProps {
  jobOrders: JobOrder[];
  isLoading: boolean;
  limit?: number;
}

export default function ProductionProgressWidget({ 
  jobOrders, 
  isLoading,
  limit = 5
}: ProductionProgressWidgetProps) {
  // Filter only active job orders and sort by status
  const getActiveJobOrders = () => {
    return jobOrders
      .filter(jo => jo.status !== 'completed' && jo.status !== 'cancelled')
      .sort((a, b) => {
        // Sort by production_status if available, otherwise by status
        const statusA = a.production_status || a.status;
        const statusB = b.production_status || b.status;
        return statusA.localeCompare(statusB);
      })
      .slice(0, limit);
  };
  
  const activeJobOrders = getActiveJobOrders();
  
  // Calculate completion percentage for a job order
  const getCompletionPercentage = (jobOrder: JobOrder): number => {
    const quantity = jobOrder.quantity || 0;
    const producedQuantity = jobOrder.produced_quantity || 0;
    
    if (quantity <= 0) return 0;
    const percentage = (producedQuantity / quantity) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };
  
  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_progress':
      case 'in progress':
        return <Factory className="h-4 w-4" />;
      case 'completed':
        return <Check className="h-4 w-4" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-7 w-48 mb-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between text-xs">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Factory className="mr-2 h-5 w-5 text-primary-500" />
          Production Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activeJobOrders.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              No active job orders found
            </div>
          ) : (
            activeJobOrders.map((jobOrder) => {
              const completionPercentage = getCompletionPercentage(jobOrder);
              const status = jobOrder.production_status || jobOrder.status;
              
              return (
                <div key={jobOrder.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">Job Order #{jobOrder.id}</div>
                    <div className={`px-2 py-1 rounded-full text-xs flex items-center ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      <span className="ml-1">{status}</span>
                    </div>
                  </div>
                  
                  <Progress value={completionPercentage} className="h-2" />
                  
                  <div className="flex justify-between text-xs text-slate-500">
                    <div>
                      Produced: {jobOrder.produced_quantity || 0} of {jobOrder.quantity} units 
                      ({jobOrder.waste_quantity ? `Waste: ${jobOrder.waste_quantity}` : ''})
                    </div>
                    <div>{completionPercentage.toFixed(0)}% complete</div>
                  </div>
                </div>
              );
            })
          )}
          
          {jobOrders.length > limit && (
            <div className="text-center text-sm text-primary-600">
              + {jobOrders.length - limit} more job orders
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}