import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkflowVisualization, Stage } from "@/components/ui/workflow-visualization";
import { useLanguage } from '@/utils/language';
import { fadeIn, pageTransition } from '@/utils/animations';

// Define workflow types
type WorkflowType = 'production' | 'mixing' | 'shipping' | 'maintenance' | 'custom';

export default function WorkflowDashboard() {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType>('production');
  const [customProcess, setCustomProcess] = useState('');
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  
  // Sample production workflow stages
  const productionStages: Stage[] = [
    { id: 'order', label: language === 'english' ? 'Order Processing' : 'معالجة الطلب', status: 'completed' },
    { id: 'extruding', label: language === 'english' ? 'Extruding' : 'البثق', status: 'in-progress' },
    { id: 'printing', label: language === 'english' ? 'Printing' : 'الطباعة', status: 'pending' },
    { id: 'cutting', label: language === 'english' ? 'Cutting' : 'القطع', status: 'pending' },
    { id: 'quality', label: language === 'english' ? 'Quality Control' : 'مراقبة الجودة', status: 'pending' },
    { id: 'delivery', label: language === 'english' ? 'Delivery' : 'التسليم', status: 'pending' }
  ];
  
  // Sample mixing workflow stages
  const mixingStages: Stage[] = [
    { id: 'material', label: language === 'english' ? 'Material Selection' : 'اختيار المواد', status: 'completed' },
    { id: 'preparation', label: language === 'english' ? 'Preparation' : 'التحضير', status: 'completed' },
    { id: 'mixing', label: language === 'english' ? 'Mixing Process' : 'عملية الخلط', status: 'in-progress' },
    { id: 'testing', label: language === 'english' ? 'Testing' : 'الاختبار', status: 'pending' },
    { id: 'storage', label: language === 'english' ? 'Storage' : 'التخزين', status: 'pending' }
  ];
  
  // Sample shipping workflow stages
  const shippingStages: Stage[] = [
    { id: 'packaging', label: language === 'english' ? 'Packaging' : 'التعبئة', status: 'completed' },
    { id: 'labeling', label: language === 'english' ? 'Labeling' : 'وضع العلامات', status: 'completed' },
    { id: 'inspection', label: language === 'english' ? 'Final Inspection' : 'الفحص النهائي', status: 'in-progress' },
    { id: 'loading', label: language === 'english' ? 'Loading' : 'التحميل', status: 'pending' },
    { id: 'shipping', label: language === 'english' ? 'Shipping' : 'الشحن', status: 'pending' },
    { id: 'delivery', label: language === 'english' ? 'Delivery' : 'التسليم', status: 'pending' }
  ];
  
  // Sample maintenance workflow stages
  const maintenanceStages: Stage[] = [
    { id: 'request', label: language === 'english' ? 'Maintenance Request' : 'طلب الصيانة', status: 'completed' },
    { id: 'scheduling', label: language === 'english' ? 'Scheduling' : 'الجدولة', status: 'completed' },
    { id: 'diagnosis', label: language === 'english' ? 'Diagnosis' : 'التشخيص', status: 'completed' },
    { id: 'parts', label: language === 'english' ? 'Parts Procurement' : 'شراء القطع', status: 'in-progress' },
    { id: 'repair', label: language === 'english' ? 'Repair' : 'الإصلاح', status: 'pending' },
    { id: 'testing', label: language === 'english' ? 'Testing' : 'الاختبار', status: 'pending' },
    { id: 'completion', label: language === 'english' ? 'Completion' : 'الإنجاز', status: 'pending' }
  ];
  
  // Custom workflow stages (empty by default)
  const customStages: Stage[] = [];
  
  const getActiveWorkflowStages = () => {
    switch (activeWorkflow) {
      case 'production':
        return productionStages;
      case 'mixing':
        return mixingStages;
      case 'shipping':
        return shippingStages;
      case 'maintenance':
        return maintenanceStages;
      case 'custom':
        return customStages;
      default:
        return productionStages;
    }
  };
  
  const getWorkflowTitle = () => {
    switch (activeWorkflow) {
      case 'production':
        return language === 'english' ? 'Production Workflow' : 'سير عمل الإنتاج';
      case 'mixing':
        return language === 'english' ? 'Mixing Workflow' : 'سير عمل الخلط';
      case 'shipping':
        return language === 'english' ? 'Shipping Workflow' : 'سير عمل الشحن';
      case 'maintenance':
        return language === 'english' ? 'Maintenance Workflow' : 'سير عمل الصيانة';
      case 'custom':
        return language === 'english' ? 'Custom Workflow' : 'سير عمل مخصص';
      default:
        return language === 'english' ? 'Production Workflow' : 'سير عمل الإنتاج';
    }
  };
  
  return (
    <motion.div
      className="container mx-auto py-6"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <motion.div variants={fadeIn} className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {language === 'english' ? 'Production Workflows' : 'سير عمليات الإنتاج'}
        </h1>
        <Button onClick={() => setLocation('/production')}>
          {language === 'english' ? 'Back to Dashboard' : 'العودة إلى لوحة المعلومات'}
        </Button>
      </motion.div>
      
      <Tabs defaultValue={activeWorkflow} onValueChange={(value) => setActiveWorkflow(value as WorkflowType)} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="production">{language === 'english' ? 'Production' : 'الإنتاج'}</TabsTrigger>
          <TabsTrigger value="mixing">{language === 'english' ? 'Mixing' : 'الخلط'}</TabsTrigger>
          <TabsTrigger value="shipping">{language === 'english' ? 'Shipping' : 'الشحن'}</TabsTrigger>
          <TabsTrigger value="maintenance">{language === 'english' ? 'Maintenance' : 'الصيانة'}</TabsTrigger>
          <TabsTrigger value="custom">{language === 'english' ? 'Custom' : 'مخصص'}</TabsTrigger>
        </TabsList>
        
        {/* All workflow content */}
        <Card>
          <CardHeader>
            <CardTitle>{getWorkflowTitle()}</CardTitle>
            <CardDescription>
              {language === 'english' 
                ? 'Visualize the current status of production workflow processes'
                : 'تصور الحالة الحالية لعمليات سير عمل الإنتاج'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeWorkflow === 'custom' ? (
              <div className="mb-6">
                <Select
                  value={customProcess}
                  onValueChange={setCustomProcess}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'english' ? "Select process" : "اختر العملية"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="process1">Process 1</SelectItem>
                    <SelectItem value="process2">Process 2</SelectItem>
                    <SelectItem value="process3">Process 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            
            <WorkflowVisualization
              stages={getActiveWorkflowStages()}
              animationDuration={0.5}
              showLabels={true}
              interactive={true}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">
              {language === 'english' ? 'Export as Image' : 'تصدير كصورة'}
            </Button>
            <Button>
              {language === 'english' ? 'View Details' : 'عرض التفاصيل'}
            </Button>
          </CardFooter>
        </Card>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'english' ? 'Workflow Statistics' : 'إحصائيات سير العمل'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>{language === 'english' ? 'Completed Stages' : 'المراحل المكتملة'}</span>
                <span className="font-semibold">
                  {getActiveWorkflowStages().filter(stage => stage.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'english' ? 'In Progress' : 'قيد التنفيذ'}</span>
                <span className="font-semibold">
                  {getActiveWorkflowStages().filter(stage => stage.status === 'in-progress').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'english' ? 'Pending' : 'معلق'}</span>
                <span className="font-semibold">
                  {getActiveWorkflowStages().filter(stage => stage.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'english' ? 'Total Stages' : 'إجمالي المراحل'}</span>
                <span className="font-semibold">{getActiveWorkflowStages().length}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'english' ? 'Completion Percentage' : 'نسبة الإكمال'}</span>
                <span className="font-semibold">
                  {Math.round(
                    (getActiveWorkflowStages().filter(stage => stage.status === 'completed').length / 
                    getActiveWorkflowStages().length) * 100
                  )}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'english' ? 'Actions' : 'الإجراءات'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full" variant="outline">
                {language === 'english' ? 'Update Status' : 'تحديث الحالة'}
              </Button>
              <Button className="w-full" variant="outline">
                {language === 'english' ? 'Add New Stage' : 'إضافة مرحلة جديدة'}
              </Button>
              <Button className="w-full" variant="outline">
                {language === 'english' ? 'Generate Report' : 'إنشاء تقرير'}
              </Button>
              <Button className="w-full" variant="outline">
                {language === 'english' ? 'Notify Team' : 'إبلاغ الفريق'}
              </Button>
              <Button className="w-full" variant="default">
                {language === 'english' ? 'Complete Workflow' : 'إكمال سير العمل'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}