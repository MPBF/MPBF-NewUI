import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LineChart, Line } from 'recharts';
import { format, startOfDay, subDays, subMonths, subWeeks, parseISO, isWithinInterval } from 'date-fns';
import { BarChart3, TrendingUp } from 'lucide-react';

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

interface ProductionInsightsWidgetProps {
  rolls: Roll[];
  isLoading: boolean;
  timeframe?: 'day' | 'week' | 'month';
}

export default function ProductionInsightsWidget({ 
  rolls, 
  isLoading,
  timeframe = 'week'
}: ProductionInsightsWidgetProps) {
  const [selectedView, setSelectedView] = useState<'production' | 'stage'>('production');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month'>(timeframe);
  
  // Get rolls for the selected timeframe
  const getFilteredRolls = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (selectedTimeframe) {
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
  
  // Group rolls by date for chart
  const getProductionChartData = () => {
    const filteredRolls = getFilteredRolls();
    const dailyProduction: Record<string, { 
      date: string, 
      extruding: number, 
      printing: number, 
      cutting: number,
      total: number
    }> = {};
    
    // Initialize dates in the range
    const now = new Date();
    const startDate = selectedTimeframe === 'day' 
      ? startOfDay(now) 
      : selectedTimeframe === 'week' 
        ? subDays(now, 7) 
        : subDays(now, 30);
        
    let currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      dailyProduction[dateKey] = {
        date: format(currentDate, 'MMM dd'),
        extruding: 0,
        printing: 0,
        cutting: 0,
        total: 0
      };
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }
    
    // Add roll data
    filteredRolls.forEach(roll => {
      const rollDate = parseISO(roll.created_date);
      const dateKey = format(rollDate, 'yyyy-MM-dd');
      
      // Skip if the date is not in our range
      if (!dailyProduction[dateKey]) return;
      
      if (roll.extruding_qty) {
        dailyProduction[dateKey].extruding += roll.extruding_qty;
        dailyProduction[dateKey].total += roll.extruding_qty;
      }
      
      if (roll.printing_qty) {
        dailyProduction[dateKey].printing += roll.printing_qty;
      }
      
      if (roll.cutting_qty) {
        dailyProduction[dateKey].cutting += roll.cutting_qty;
      }
    });
    
    // Convert to array for chart
    return Object.values(dailyProduction);
  };
  
  // Prepare chart data by production stage
  const getStageChartData = () => {
    const filteredRolls = getFilteredRolls();
    
    // Group by production stage
    let extrudingTotal = 0;
    let printingTotal = 0;
    let cuttingTotal = 0;
    
    filteredRolls.forEach(roll => {
      if (roll.extruding_qty) extrudingTotal += roll.extruding_qty;
      if (roll.printing_qty) printingTotal += roll.printing_qty;
      if (roll.cutting_qty) cuttingTotal += roll.cutting_qty;
    });
    
    return [
      { name: 'Extruding', value: extrudingTotal },
      { name: 'Printing', value: printingTotal },
      { name: 'Cutting', value: cuttingTotal }
    ];
  };
  
  const productionData = getProductionChartData();
  const stageData = getStageChartData();
  
  // Calculate key insights
  const calculateInsights = () => {
    const filteredRolls = getFilteredRolls();
    
    let totalExtruding = 0;
    let totalCutting = 0;
    let completeRolls = 0;
    
    filteredRolls.forEach(roll => {
      if (roll.extruding_qty) totalExtruding += roll.extruding_qty;
      if (roll.cutting_qty) {
        totalCutting += roll.cutting_qty;
        completeRolls++;
      }
    });
    
    const averageRollSize = completeRolls > 0 ? totalExtruding / completeRolls : 0;
    
    return {
      totalProduction: totalExtruding,
      totalDelivered: totalCutting,
      rollsProduced: filteredRolls.length,
      averageRollSize
    };
  };
  
  const insights = calculateInsights();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
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
          <TrendingUp className="mr-2 h-5 w-5 text-primary-500" />
          Production Analytics
        </CardTitle>
        <div className="flex justify-between items-center">
          <Tabs 
            value={selectedTimeframe} 
            onValueChange={(value) => setSelectedTimeframe(value as 'day' | 'week' | 'month')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="day">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-center gap-4 mb-2">
            <button
              onClick={() => setSelectedView('production')}
              className={`px-3 py-1 rounded-md text-sm flex items-center 
                ${selectedView === 'production' 
                  ? 'bg-primary-100 text-primary-800 font-medium' 
                  : 'bg-slate-100 text-slate-600'}`}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Trend
            </button>
            <button
              onClick={() => setSelectedView('stage')}
              className={`px-3 py-1 rounded-md text-sm flex items-center 
                ${selectedView === 'stage' 
                  ? 'bg-primary-100 text-primary-800 font-medium' 
                  : 'bg-slate-100 text-slate-600'}`}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              By Stage
            </button>
          </div>
          
          {/* Charts */}
          <div className="h-64">
            {selectedView === 'production' ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={productionData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="date" tickMargin={10} />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="Total Production"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stageData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} kg`, 'Quantity']} />
                  <Bar 
                    dataKey="value" 
                    name="Quantity" 
                    fill="#3b82f6" 
                    barSize={40}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {/* Key insights */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-slate-50 p-2 rounded-md">
              <div className="text-xs text-slate-500">Total Production</div>
              <div className="font-medium">{insights.totalProduction.toFixed(1)} kg</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-md">
              <div className="text-xs text-slate-500">Rolls Produced</div>
              <div className="font-medium">{insights.rollsProduced}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-md">
              <div className="text-xs text-slate-500">Total Delivered</div>
              <div className="font-medium">{insights.totalDelivered.toFixed(1)} kg</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-md">
              <div className="text-xs text-slate-500">Avg. Roll Size</div>
              <div className="font-medium">{insights.averageRollSize.toFixed(1)} kg</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}