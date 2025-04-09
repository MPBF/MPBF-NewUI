import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { toast } from "@/hooks/use-toast";
import { Save, RotateCcw } from 'lucide-react';
import { useAuth } from '@/utils/auth';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from '@/utils/language';

// Initialize the responsive grid layout with the width provider
const ResponsiveGridLayout = WidthProvider(Responsive);

// Define widget interface
export interface DashboardWidget {
  id: string;
  title: string;
  type: string;
  component: React.ReactNode;
  size?: {
    minW: number;
    minH: number;
    w: number;
    h: number;
  };
}

// Define widget position/layout interface
export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface DraggableDashboardProps {
  widgets: DashboardWidget[];
  defaultLayouts?: { [key: string]: WidgetLayout[] };
  onLayoutChange?: (layouts: { [key: string]: WidgetLayout[] }) => void;
  verticalCompact?: boolean;
  className?: string;
  isDraggable?: boolean;
  isResizable?: boolean;
  preventCollision?: boolean;
}

const DraggableDashboard: React.FC<DraggableDashboardProps> = ({
  widgets,
  defaultLayouts,
  onLayoutChange,
  verticalCompact = true,
  className = '',
  isDraggable = true,
  isResizable = true,
  preventCollision = false
}) => {
  const { user } = useAuth();
  const { isRtl } = useLanguage();
  const [layouts, setLayouts] = useState<{ [key: string]: WidgetLayout[] }>(
    defaultLayouts || {
      lg: widgets.map((widget, index) => ({
        i: widget.id,
        x: index % 3 * 4,
        y: Math.floor(index / 3) * 4,
        w: widget.size?.w || 4,
        h: widget.size?.h || 4,
        minW: widget.size?.minW || 2,
        minH: widget.size?.minH || 2,
      })),
      md: widgets.map((widget, index) => ({
        i: widget.id,
        x: index % 2 * 6,
        y: Math.floor(index / 2) * 4,
        w: widget.size?.w || 6,
        h: widget.size?.h || 4,
        minW: widget.size?.minW || 2,
        minH: widget.size?.minH || 2,
      })),
      sm: widgets.map((widget, index) => ({
        i: widget.id,
        x: 0,
        y: index * 4,
        w: widget.size?.w || 12,
        h: widget.size?.h || 4,
        minW: widget.size?.minW || 2,
        minH: widget.size?.minH || 2,
      })),
      xs: widgets.map((widget, index) => ({
        i: widget.id,
        x: 0,
        y: index * 4,
        w: widget.size?.w || 12,
        h: widget.size?.h || 4,
        minW: widget.size?.minW || 2,
        minH: widget.size?.minH || 2,
      })),
    }
  );
  const [loading, setLoading] = useState(false);

  // Load user's dashboard preferences when component mounts
  useEffect(() => {
    if (user?.dashboard_preferences) {
      try {
        const savedLayouts = user.dashboard_preferences;
        // Ensure all widgets from the current configuration are included
        const updatedLayouts = { ...savedLayouts };
        
        // For each breakpoint, add any missing widgets 
        Object.keys(updatedLayouts).forEach(breakpoint => {
          const currentWidgetIds = updatedLayouts[breakpoint].map(item => item.i);
          widgets.forEach((widget, idx) => {
            if (!currentWidgetIds.includes(widget.id)) {
              // Get the default position for this widget
              const defaultPosition = defaultLayouts?.[breakpoint]?.find(item => item.i === widget.id) || 
                {
                  x: idx % 3 * 4,
                  y: 100, // Place it at the bottom
                  w: widget.size?.w || 4,
                  h: widget.size?.h || 4,
                  minW: widget.size?.minW || 2,
                  minH: widget.size?.minH || 2,
                };
                
              updatedLayouts[breakpoint].push({
                i: widget.id,
                ...defaultPosition
              });
            }
          });
        });
        
        setLayouts(updatedLayouts);
      } catch (error) {
        console.error('Error parsing saved dashboard layout:', error);
      }
    }
  }, [user, widgets, defaultLayouts]);

  // Handle layout changes
  const handleLayoutChange = (currentLayout: WidgetLayout[], allLayouts: { [key: string]: WidgetLayout[] }) => {
    setLayouts(allLayouts);
    if (onLayoutChange) {
      onLayoutChange(allLayouts);
    }
  };

  // Save dashboard layouts to user preferences
  const saveLayout = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await apiRequest(`/api/users/${user.id}/dashboard-preferences`, {
        method: 'POST',
        data: { preferences: layouts }
      });
      
      toast({
        title: 'Dashboard layout saved',
        description: 'Your dashboard layout preferences have been saved.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      toast({
        title: 'Error saving layout',
        description: 'There was a problem saving your dashboard layout.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset dashboard layouts to default
  const resetLayout = () => {
    if (defaultLayouts) {
      setLayouts(defaultLayouts);
      toast({
        title: 'Dashboard reset',
        description: 'Your dashboard layout has been reset to default.',
        variant: 'default',
      });
    }
  };

  return (
    <div className={`draggable-dashboard ${className}`}>
      <div className="flex justify-end mb-4 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetLayout}
          className="text-amber-600 border-amber-300 hover:bg-amber-50"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset Layout
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={saveLayout}
          disabled={loading}
          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
        >
          <Save className="h-4 w-4 mr-1" />
          Save Layout
        </Button>
      </div>
      
      <ResponsiveGridLayout
        className={`w-full ${isRtl ? 'rtl-auto-fix' : ''}`}
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12 }}
        rowHeight={60}
        onLayoutChange={handleLayoutChange}
        isDraggable={isDraggable}
        isResizable={isResizable}
        verticalCompact={verticalCompact}
        preventCollision={preventCollision}
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="dashboard-widget">
            <Card className="h-full overflow-hidden border-0 shadow-md rounded-xl">
              <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-white pb-2">
                <CardTitle className="text-lg font-bold text-teal-800">{widget.title}</CardTitle>
              </CardHeader>
              <CardContent className={`p-4 ${widget.type === 'chart' ? 'overflow-hidden' : 'overflow-auto'}`}>
                {widget.component}
              </CardContent>
            </Card>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default DraggableDashboard;