import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { StatusBadge } from '../StatusBadge';
import { Package } from 'lucide-react';

interface Roll {
  id: number;
  roll_identification: string;
  job_order_id: number;
  roll_number: number;
  extruding_qty: number | null;
  printing_qty: number | null;
  cutting_qty: number | null;
  status: string;
  created_date: string;
  notes: string | null;
}

interface RollStatusWidgetProps {
  rolls: Roll[];
  isLoading: boolean;
}

export default function RollStatusWidget({ rolls, isLoading }: RollStatusWidgetProps) {
  // Count rolls by status
  const getRollCountByStatus = () => {
    const statusCounts: Record<string, number> = {};
    
    rolls.forEach(roll => {
      statusCounts[roll.status] = (statusCounts[roll.status] || 0) + 1;
    });
    
    // Convert to array format for chart
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      color: getStatusColor(status)
    }));
  };
  
  // Get color based on status for pie chart
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'for printing':
        return '#ec4899'; // pink-500
      case 'for cutting':
        return '#3b82f6'; // blue-500
      case 'for delivery':
      case 'for receiving':
        return '#22c55e'; // green-500
      case 'received':
        return '#64748b'; // slate-500
      case 'damaged':
      case 'damage':
        return '#ef4444'; // red-500
      case 'extruding':
        return '#000000'; // black
      default:
        return '#94a3b8'; // slate-400
    }
  };
  
  const statusData = getRollCountByStatus();
  const totalRolls = rolls.length;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-7 w-40 mb-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Package className="mr-2 h-5 w-5 text-primary-500" />
          Roll Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {totalRolls === 0 ? (
            <div className="flex justify-center items-center h-64 text-slate-500">
              No roll data available
            </div>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                      labelLine={false}
                      label={({ status, count, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} rolls`, props.payload.status]}
                      contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                {statusData.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                    <div className="flex items-center">
                      <StatusBadge status={status.status} />
                    </div>
                    <div className="font-medium">{status.count}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}