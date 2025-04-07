import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, AlertTriangle, BarChart4, Box, CheckCircle, ClipboardList, 
  Clock, Factory, TrendingUp, User, Users, Loader2 
} from 'lucide-react';
import { useLanguage, translations } from '@/utils/language';
import { Customer, JobOrder, Order, Production, Roll, User as UserType } from '@shared/schema';
import type { Language } from '@/utils/language';

// Helper function to get translation with type safety
function getTranslation(key: string, language: Language) {
  return translations[language]?.[key as keyof (typeof translations)[typeof language]] || key;
}
import { format } from 'date-fns';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

interface StatisticCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
}

export const StatisticCard: React.FC<StatisticCardProps> = ({ 
  title, 
  value, 
  icon, 
  description, 
  trend 
}) => (
  <Card className="overflow-hidden border-0 shadow-md rounded-xl h-full">
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 p-2 rounded-lg">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            <p className="text-2xl font-bold text-teal-800">{value}</p>
          </div>
        </div>
        
        {trend && (
          <Badge 
            variant={trend.direction === 'up' ? 'outline' : 'destructive'} 
            className={
              trend.direction === 'up' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : trend.direction === 'down' 
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
            }
          >
            {trend.direction === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
            {trend.direction === 'down' && <TrendingUp className="h-3 w-3 mr-1 rotate-180" />}
            {trend.value}
          </Badge>
        )}
      </div>
      
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
);

interface ProductionStatusWidgetProps {
  productions: Production[];
  isLoading?: boolean;
}

export const ProductionStatusWidget: React.FC<ProductionStatusWidgetProps> = ({ productions, isLoading }) => {
  const { language } = useLanguage();
  
  const readyForPrint = productions.filter(p => p.status === 'ready_for_print').length;
  const readyForCut = productions.filter(p => p.status === 'ready_for_cut').length;
  const readyForDeliver = productions.filter(p => p.status === 'ready_for_deliver').length;
  const total = productions.length;
  
  // Calculate percentages
  const printPercent = total > 0 ? Math.round((readyForPrint / total) * 100) : 0;
  const cutPercent = total > 0 ? Math.round((readyForCut / total) * 100) : 0;
  const deliverPercent = total > 0 ? Math.round((readyForDeliver / total) * 100) : 0;
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 text-teal-500 animate-spin mb-2" />
        <p className="text-sm text-gray-500">{getTranslation('loadingProduction', language)}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>{getTranslation('readyForPrint', language)}</span>
        </div>
        <div className="font-medium">{readyForPrint}</div>
      </div>
      <Progress value={printPercent} className="h-2 bg-yellow-100" />
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>{getTranslation('readyForCut', language)}</span>
        </div>
        <div className="font-medium">{readyForCut}</div>
      </div>
      <Progress value={cutPercent} className="h-2 bg-blue-100" />
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>{getTranslation('readyForDeliver', language)}</span>
        </div>
        <div className="font-medium">{readyForDeliver}</div>
      </div>
      <Progress value={deliverPercent} className="h-2 bg-green-100" />
    </div>
  );
};

interface PendingOrdersWidgetProps {
  orders: Order[];
  jobOrders: JobOrder[];
  isLoading?: boolean;
}

export const PendingOrdersWidget: React.FC<PendingOrdersWidgetProps> = ({ orders, jobOrders, isLoading }) => {
  const { language } = useLanguage();
  
  // Find pending job orders (can be customized based on your status definitions)
  const pendingJobOrders = jobOrders.filter(jo => 
    jo.status === 'pending' || jo.status === 'in_progress' || jo.status === 'processing'
  );
  
  // Get the latest 3 orders
  const recentOrders = [...orders].sort((a, b) => 
    new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
  ).slice(0, 3);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 text-teal-500 animate-spin mb-2" />
        <p className="text-sm text-gray-500">{getTranslation('loadingProduction', language)}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-teal-500" />
          <span>{getTranslation('totalOrders', language)}</span>
        </div>
        <div className="font-medium">{orders.length}</div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span>{getTranslation('pendingJobOrders', language)}</span>
        </div>
        <div className="font-medium">{pendingJobOrders.length}</div>
      </div>
      
      <Separator className="my-3" />
      
      <div>
        <h4 className="text-sm font-medium mb-2">{getTranslation('recentOrders', language)}</h4>
        <div className="space-y-2">
          {recentOrders.map((order, index) => (
            <div key={order.id} className="flex justify-between items-center py-1 px-2 rounded bg-slate-50">
              <span className="text-sm">Order #{order.id}</span>
              <span className="text-xs text-gray-500">
                {format(new Date(order.order_date), 'MMM dd, yyyy')}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end mt-2">
        <Link href="/orders" className="text-xs text-teal-600 font-medium flex items-center">
          {getTranslation('viewAll', language)} <Box className="h-3 w-3 ml-1" />
        </Link>
      </div>
    </div>
  );
};

interface RecentRollsWidgetProps {
  rolls: Roll[];
  isLoading?: boolean;
}

export const RecentRollsWidget: React.FC<RecentRollsWidgetProps> = ({ rolls, isLoading }) => {
  const { language } = useLanguage();
  
  // Get the latest 5 rolls
  const recentRolls = [...rolls].sort((a, b) => 
    new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
  ).slice(0, 5);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 text-teal-500 animate-spin mb-2" />
        <p className="text-sm text-gray-500">{getTranslation('loadingRolls', language)}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium mb-1">{getTranslation('recentProductionRolls', language)}</h3>
      
      {recentRolls.length > 0 ? (
        <div className="space-y-2 max-h-[220px] overflow-auto pr-1">
          {recentRolls.map((roll) => (
            <div key={roll.id} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white
                ${roll.status === 'active' ? 'bg-green-500' : 
                  roll.status === 'completed' ? 'bg-blue-500' : 
                  roll.status === 'pending' ? 'bg-amber-500' : 'bg-gray-500'}`}>
                {roll.roll_number}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Roll #{roll.roll_number}</span>
                  <Badge 
                    variant="outline" 
                    className={
                      roll.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                      roll.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      roll.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }
                  >
                    {roll.status}
                  </Badge>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    Job Order #{roll.job_order_id}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(roll.created_date), 'MM/dd/yyyy')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          <Box className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>{getTranslation('noRollsFound', language)}</p>
        </div>
      )}
      
      <div className="flex justify-end mt-2">
        <Link href="/production/rolls" className="text-xs text-teal-600 font-medium flex items-center">
          {getTranslation('viewAll', language)} <Box className="h-3 w-3 ml-1" />
        </Link>
      </div>
    </div>
  );
};

interface CustomerActivityWidgetProps {
  customers: Customer[];
  orders: Order[];
  isLoading?: boolean;
}

export const CustomerActivityWidget: React.FC<CustomerActivityWidgetProps> = ({ 
  customers, 
  orders,
  isLoading 
}) => {
  const { language } = useLanguage();
  
  // Calculate customer metrics
  const activeCustomers = customers.length;
  
  // Creates a mapping of customer to order count
  const customerOrderCounts = orders.reduce((acc, order) => {
    if (!order.customer_id) return acc;
    acc[order.customer_id] = (acc[order.customer_id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  // Find top customers by order count
  const topCustomers = Object.entries(customerOrderCounts)
    .map(([customerId, count]) => ({
      customer: customers.find(c => c.id === parseInt(customerId)),
      orderCount: count
    }))
    .filter(item => item.customer) // Filter out any undefined customers
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 4);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 text-teal-500 animate-spin mb-2" />
        <p className="text-sm text-gray-500">{getTranslation('loadingCustomers', language)}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-3 rounded-lg text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-teal-600" />
          <div className="text-xl font-bold text-slate-800">{activeCustomers}</div>
          <div className="text-xs text-slate-500">{getTranslation('totalCustomers', language)}</div>
        </div>
        
        <div className="bg-slate-50 p-3 rounded-lg text-center">
          <Activity className="h-5 w-5 mx-auto mb-1 text-teal-600" />
          <div className="text-xl font-bold text-slate-800">{orders.length > 0 ? (orders.length / activeCustomers).toFixed(1) : '0'}</div>
          <div className="text-xs text-slate-500">{getTranslation('avgOrdersPerCustomer', language)}</div>
        </div>
      </div>
      
      <Separator className="my-2" />
      
      <div>
        <h4 className="text-sm font-medium mb-2">{getTranslation('topCustomers', language)}</h4>
        <div className="space-y-2">
          {topCustomers.map((item) => (
            <div key={item.customer!.id} className="flex justify-between items-center p-2 rounded bg-slate-50">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{item.customer!.name}</span>
              </div>
              <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">{item.orderCount} {getTranslation('orders', language)}</Badge>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end mt-2">
        <Link href="/customers" className="text-xs text-teal-600 font-medium flex items-center">
          {getTranslation('viewAllCustomers', language)} <Box className="h-3 w-3 ml-1" />
        </Link>
      </div>
    </div>
  );
};

interface ProductionChartWidgetProps {
  productions: Production[];
  isLoading?: boolean;
}

export const ProductionChartWidget: React.FC<ProductionChartWidgetProps> = ({ productions, isLoading }) => {
  const { language } = useLanguage();
  
  // Prepare data for the chart
  const statusCounts = productions.reduce((acc, prod) => {
    acc[prod.status] = (acc[prod.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count
  }));
  
  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 text-teal-500 animate-spin mb-2" />
        <p className="text-sm text-gray-500">{getTranslation('loadingChartData', language)}</p>
      </div>
    );
  }
  
  return (
    <div className="h-full">
      <h3 className="text-sm font-medium mb-4">{getTranslation('productionStatusDistribution', language)}</h3>
      
      {productions.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              nameKey="status"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="py-8 text-center text-gray-500">
          <BarChart4 className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>{getTranslation('noProductionDataAvailable', language)}</p>
        </div>
      )}
    </div>
  );
};

interface TeamStatusWidgetProps {
  users: UserType[];
  isLoading?: boolean;
}

export const TeamStatusWidget: React.FC<TeamStatusWidgetProps> = ({ users, isLoading }) => {
  const { language } = useLanguage();
  
  // Group users by role
  const roleGroups = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Prepare data for the chart
  const chartData = Object.entries(roleGroups).map(([role, count]) => ({
    name: role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count
  }));
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 text-teal-500 animate-spin mb-2" />
        <p className="text-sm text-gray-500">{getTranslation('loadingTeamData', language)}</p>
      </div>
    );
  }
  
  return (
    <div className="h-full">
      <h3 className="text-sm font-medium mb-2">{getTranslation('teamComposition', language)}</h3>
      
      {users.length > 0 ? (
        <>
          <div className="space-y-2 mb-4">
            {Object.entries(roleGroups).map(([role, count], index) => (
              <div key={role} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5] }}>
                  </div>
                  <span className="text-sm capitalize">{role.replace(/_/g, ' ')}</span>
                </div>
                <div className="font-medium">{count}</div>
              </div>
            ))}
          </div>
          
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <div className="py-8 text-center text-gray-500">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>{getTranslation('noTeamDataAvailable', language)}</p>
        </div>
      )}
    </div>
  );
};

interface QuickLinksWidgetProps {
  links: {
    title: string;
    href: string;
    icon: React.ReactNode;
    color: string;
  }[];
}

export const QuickLinksWidget: React.FC<QuickLinksWidgetProps> = ({ links }) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {links.map((link, index) => (
        <motion.div 
          key={link.title}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          <Link href={link.href}>
            <a className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${link.color}`}>
                {link.icon}
              </div>
              <span className="text-sm font-medium text-center">{link.title}</span>
            </a>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

interface CurrentTimeWidgetProps {
  className?: string;
}

export const CurrentTimeWidget: React.FC<CurrentTimeWidgetProps> = ({ className = '' }) => {
  const { language } = useLanguage();
  const [currentTime, setCurrentTime] = React.useState(new Date());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Use Arabic locale for dates when language is set to Arabic
  const localeString = language === 'ar' ? 'ar-SA' : undefined;
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Clock className="h-6 w-6 text-teal-500 mb-1" />
      <div className="text-2xl font-mono font-bold text-teal-800">
        {currentTime.toLocaleTimeString(localeString)}
      </div>
      <div className="text-xs text-gray-500">
        {currentTime.toLocaleDateString(localeString, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
    </div>
  );
};

interface StatusOverviewWidgetProps {
  statusItems: {
    title: string;
    count: number;
    status: 'success' | 'warning' | 'error' | 'info';
  }[];
}

export const StatusOverviewWidget: React.FC<StatusOverviewWidgetProps> = ({ statusItems }) => {
  const { language } = useLanguage();
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {statusItems.map((item, index) => (
        <div key={item.title} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-gray-500">{getTranslation(item.title, language) || item.title}</span>
            {item.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {item.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            {item.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
            {item.status === 'info' && <Activity className="h-4 w-4 text-blue-500" />}
          </div>
          <div className="text-2xl font-bold text-gray-800">{item.count}</div>
        </div>
      ))}
    </div>
  );
};