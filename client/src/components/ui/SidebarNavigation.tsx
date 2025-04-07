import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Home, 
  Users, 
  ClipboardList, 
  Package2, 
  Factory, 
  FileBarChart2, 
  Settings, 
  Cpu,
  Layers,
  ChevronRight,
  Calculator,
  Wrench,
  Boxes,
  ScrollText,
  PackageOpen,
  Warehouse,
  GitGraph,
  Activity,
  BarChart3,
  Gauge,
  MessageSquare
} from "lucide-react";
import { t, translations, useLanguage } from "../../utils/language";

interface SidebarNavigationProps {
  location: string;
  isRtl: boolean;
  setupSectionOpen: boolean;
  setSetupSectionOpen: (open: boolean) => void;
  mobile?: boolean;
  onLinkClick?: () => void;
}

export function SidebarNavigation({
  location,
  isRtl,
  setupSectionOpen,
  setSetupSectionOpen,
  mobile = false,
  onLinkClick = () => {}
}: SidebarNavigationProps) {
  
  // Get current language
  const { language } = useLanguage();
  
  // Add state to manage production section visibility
  const [productionSectionOpen, setProductionSectionOpen] = useState(false);
  
  // Check if current location is a production page
  const isProductionPage = location.startsWith('/production') || location === '/joborders';
  
  // Automatically open production section if on a production page
  useEffect(() => {
    if (isProductionPage) {
      setProductionSectionOpen(true);
    }
  }, [isProductionPage]);
  
  // Check if current location is in the setup section
  const isSetupPage = location.startsWith('/settings') || 
                     location === '/customers' || 
                     location === '/machines' || 
                     location === '/customers/products' || 
                     location === '/products';
                     
  // Automatically open setup section if on a setup page
  useEffect(() => {
    if (isSetupPage) {
      setSetupSectionOpen(true);
    }
  }, [isSetupPage]);
  
  const handleLinkClick = () => {
    if (mobile) {
      onLinkClick();
    }
  };
  
  return (
    <>
      {/* Dashboard item - always visible */}
      <Link
        href="/"
        onClick={handleLinkClick}
        className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          location === "/"
            ? "bg-mpbf-teal text-white"
            : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-80 hover:text-white"
        }`}
      >
        <Home className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
        {t('dashboard')}
      </Link>
      
      {/* Regular menu items - always visible */}
      <Link
        href="/orders"
        onClick={handleLinkClick}
        className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          location === "/orders"
            ? "bg-mpbf-teal text-white"
            : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-80 hover:text-white"
        }`}
      >
        <ClipboardList className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
        {t('orders')}
      </Link>
      {/* Production section header - clickable to toggle visibility */}
      <div 
        className={`mt-4 mb-1 cursor-pointer ${productionSectionOpen ? 'bg-mpbf-teal bg-opacity-90 rounded-md' : ''}`}
        onClick={() => setProductionSectionOpen(!productionSectionOpen)}
      >
        <div className={`flex items-center justify-between px-2 py-2 text-xs font-semibold uppercase tracking-wider ${productionSectionOpen ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>
          <div className="flex items-center">
            <Factory className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
            {t('production')}
          </div>
          <motion.div
            animate={{ 
              rotate: productionSectionOpen ? (isRtl ? -90 : 90) : 0,
              scaleX: isRtl ? -1 : 1 
            }}
            transition={{ duration: 0.2 }}
            className="transform-gpu"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.div>
        </div>
      </div>
      
      {/* Production sub-items - with animation */}
      <motion.div
        animate={{ 
          height: productionSectionOpen ? 'auto' : 0,
          opacity: productionSectionOpen ? 1 : 0
        }}
        initial={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ overflow: 'hidden' }}
      >
        <Link
          href="/production"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location === "/production"
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <Gauge className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('realTimeDashboard')}
        </Link>
        
        <Link
          href="/production/roll-management"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location === "/production/roll-management"
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <ScrollText className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('rollManagement')}
        </Link>
        
        <Link
          href="/production/receiving"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location === "/production/receiving"
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <Warehouse className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('warehouseReceiving')}
        </Link>
        
        <Link
          href="/production/waste-monitoring"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location === "/production/waste-monitoring"
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <Activity className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('wasteMonitoring')}
        </Link>
        
        <Link
          href="/production/mixing"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location.startsWith("/production/mixing")
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <Layers className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('mixes')}
        </Link>
        
        <Link
          href="/production/workflow"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location === "/production/workflow"
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <GitGraph className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('processWorkflows')}
        </Link>
        
        <Link
          href="/production/joborders"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location === "/production/joborders" || location === "/joborders"
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <Layers className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('jobOrders')}
        </Link>
      </motion.div>
      
      <Link
        href="/reports"
        onClick={handleLinkClick}
        className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          location === "/reports"
            ? "bg-mpbf-teal text-white"
            : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-80 hover:text-white"
        }`}
      >
        <FileBarChart2 className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
        {t('reports')}
      </Link>
      
      <Link
        href="/tools"
        onClick={handleLinkClick}
        className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          location === "/tools"
            ? "bg-mpbf-teal text-white"
            : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-80 hover:text-white"
        }`}
      >
        <Calculator className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
        {t('tools', { fallback: 'Tools' })}
      </Link>
      
      <Link
        href="/maintenance"
        onClick={handleLinkClick}
        className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          location === "/maintenance"
            ? "bg-mpbf-teal text-white"
            : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-80 hover:text-white"
        }`}
      >
        <Wrench className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
        {t('maintenance')}
      </Link>
      
      <Link
        href="/inventory/materials"
        onClick={handleLinkClick}
        className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          location.startsWith("/inventory")
            ? "bg-mpbf-teal text-white"
            : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-80 hover:text-white"
        }`}
      >
        <Boxes className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
        {t('inventory')}
      </Link>
      
      {/* Setup section header - clickable to toggle visibility */}
      <div 
        className={`mt-4 mb-1 cursor-pointer ${setupSectionOpen ? 'bg-mpbf-teal bg-opacity-90 rounded-md' : ''}`}
        onClick={() => setSetupSectionOpen(!setupSectionOpen)}
      >
        <div className={`flex items-center justify-between px-2 py-2 text-xs font-semibold uppercase tracking-wider ${setupSectionOpen ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>
          <div className="flex items-center">
            <Settings className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
            {t('setup' as keyof typeof translations.english)}
          </div>
          <motion.div
            animate={{ 
              rotate: setupSectionOpen ? (isRtl ? -90 : 90) : 0,
              scaleX: isRtl ? -1 : 1 
            }}
            transition={{ duration: 0.2 }}
            className="transform-gpu"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.div>
        </div>
      </div>
      
      {/* Setup sub-items - with animation */}
      <motion.div
        animate={{ 
          height: setupSectionOpen ? 'auto' : 0,
          opacity: setupSectionOpen ? 1 : 0
        }}
        initial={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ overflow: 'hidden' }}
      >
        <Link
          href="/customers"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location === "/customers"
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <Users className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('customers')}
        </Link>
        
        <Link
          href="/machines"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location === "/machines"
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <Cpu className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('machines')}
        </Link>
        
        <Link
          href="/customers/products"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location === "/customers/products"
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <Package2 className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('customerProducts')}
        </Link>
        
        <Link
          href="/products"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location === "/products"
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <Package2 className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('products')}
        </Link>
        
        <Link
          href="/settings/users"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location === "/settings/users"
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <Settings className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('settings')}
        </Link>
        
        <Link
          href="/settings/sms"
          onClick={handleLinkClick}
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isRtl ? 'mr-4' : 'ml-4'} ${
            location === "/settings/sms"
              ? "bg-mpbf-teal bg-opacity-90 text-white"
              : "text-gray-300 hover:bg-mpbf-teal hover:bg-opacity-70 hover:text-white"
          }`}
        >
          <MessageSquare className={`h-5 w-5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
          {t('smsNotifications')}
        </Link>
      </motion.div>
    </>
  );
}

export default SidebarNavigation;