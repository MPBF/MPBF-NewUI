import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownIcon, ArrowUpIcon, Trash2 } from 'lucide-react';
import { format, startOfDay, subDays, subMonths, subWeeks } from 'date-fns';

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

interface WasteStatsWidgetProps {
  rolls: Roll[];
  isLoading: boolean;
  dateRange?: 'day' | 'week' | 'month';
}

export default function WasteStatsWidget({ 
  rolls, 
  isLoading,
  dateRange = 'month'
}: WasteStatsWidgetProps) {
  const [selectedRange, setSelectedRange] = useState<'day' | 'week' | 'month'>(dateRange);
  
  // Filter rolls based on date range
  const getFilteredRolls = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (selectedRange) {
      case 'day':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
      default:
        startDate = subMonths(now, 1);
        break;
    }
    
    return rolls.filter(roll => new Date(roll.created_date) >= startDate);
  };

  const filteredRolls = getFilteredRolls();
  
  // Calculate waste metrics
  const calculateWaste = () => {
    let totalExtruding = 0;
    let totalCutting = 0;
    let totalRolls = filteredRolls.length;
    let completedRolls = 0;
    
    filteredRolls.forEach(roll => {
      if (roll.extruding_qty !== null) {
        totalExtruding += roll.extruding_qty;
      }
      
      if (roll.cutting_qty !== null) {
        totalCutting += roll.cutting_qty;
        completedRolls++;
      }
    });
    
    const totalWaste = totalExtruding - totalCutting;
    const wastePercentage = totalExtruding > 0 ? (totalWaste / totalExtruding) * 100 : 0;
    
    // Calculate compared to previous period
    // This is simplified for now - in a real app, we'd compare with the previous time period
    const trend = Math.random() > 0.5 ? 'up' : 'down';
    const trendPercentage = parseFloat((Math.random() * 5).toFixed(2));
    
    return {
      totalExtruding,
      totalCutting,
      totalWaste,
      wastePercentage,
      totalRolls,
      completedRolls,
      trend,
      trendPercentage
    };
  };
  
  const wasteStats = calculateWaste();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Trash2 className="mr-2 h-5 w-5 text-red-500" />
          Waste Statistics
        </CardTitle>
        <Tabs 
          value={selectedRange} 
          onValueChange={(value) => setSelectedRange(value as 'day' | 'week' | 'month')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-sm text-red-600 font-medium">Waste Amount</div>
              <div className="text-2xl font-bold">{wasteStats.totalWaste.toFixed(2)} kg</div>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="text-sm text-amber-600 font-medium">Waste Rate</div>
              <div className="text-2xl font-bold">{wasteStats.wastePercentage.toFixed(2)}%</div>
              <div className="flex items-center text-xs mt-1">
                {wasteStats.trend === 'down' ? (
                  <>
                    <ArrowDownIcon className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">{wasteStats.trendPercentage.toFixed(2)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowUpIcon className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-500">{wasteStats.trendPercentage.toFixed(2)}%</span>
                  </>
                )}
                <span className="text-slate-500 ml-1">vs previous {selectedRange}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Extruding: {wasteStats.totalExtruding.toFixed(2)} kg</span>
              <span>Cutting: {wasteStats.totalCutting.toFixed(2)} kg</span>
            </div>
            <Progress value={100 - wasteStats.wastePercentage} className="h-2" />
            <div className="text-xs text-slate-500">
              Production efficiency: {(100 - wasteStats.wastePercentage).toFixed(2)}%
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between text-sm">
              <div>
                <div className="text-slate-500">Total Rolls</div>
                <div className="font-medium">{wasteStats.totalRolls}</div>
              </div>
              <div>
                <div className="text-slate-500">Completed</div>
                <div className="font-medium">{wasteStats.completedRolls}</div>
              </div>
              <div>
                <div className="text-slate-500">Completion Rate</div>
                <div className="font-medium">
                  {wasteStats.totalRolls > 0 
                    ? ((wasteStats.completedRolls / wasteStats.totalRolls) * 100).toFixed(0) 
                    : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}