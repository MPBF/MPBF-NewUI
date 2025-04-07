import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { ErrorBoundary } from "./components/ui/error-boundary";
import NotFound from "./pages/not-found";
import MainLayout from "./layouts/MainLayout";
import SimpleLogin from "./pages/SimpleLogin";
import ModernLoginPage from "./pages/ModernLoginPage";
import Dashboard from "./pages/Dashboard";
import CustomersList from "./pages/customers/CustomersList";
import CustomerForm from "./pages/customers/CustomerForm";
import CustomerProducts from "./pages/customers/CustomerProducts";
import OrdersList from "./pages/orders/OrdersList";
import OrderForm from "./pages/orders/OrderForm";
import ProductsList from "./pages/products/ProductsList";
import ProductForm from "./pages/products/ProductForm";
import CategoriesList from "./pages/products/CategoriesList";
import CategoryForm from "./pages/products/CategoryForm";
import ProductionList from "./pages/production/ProductionList";
import ProductionForm from "./pages/production/ProductionForm";
import ProductionRolls from "./pages/production/ProductionRolls";
import ProductionDashboard from "./pages/production/ProductionDashboard";
import Extruding from "./pages/production/Extruding";
import Printing from "./pages/production/Printing";
import Cutting from "./pages/production/Cutting";
import RollsList from "./pages/production/RollsList";
import RollEdit from "./pages/production/RollEdit";
import RollView from "./pages/production/RollView";
import RollManagement from "./pages/production/RollManagement";
import ReceivingPage from "./pages/production/ReceivingPage";
import WasteMonitoring from "./pages/production/WasteMonitoring";
import WorkflowDashboard from "./pages/production/WorkflowDashboard";
import ReportsList from "./pages/reports/ReportsList";
import UsersList from "./pages/settings/UsersList";
import UserForm from "./pages/settings/UserForm";
import SmsNotifications from "./pages/settings/SmsNotifications";
import ItemForm from "./pages/customers/ItemForm";
import MachineList from "./pages/machines/MachineList";
import MachineForm from "./pages/machines/MachineForm";
import MachineOptions from "./pages/machines/MachineOptions";
import JobOrderScreen from "./pages/joborders/JobOrderScreen";
// Import mixing components directly to ensure they're available
import MixList from "./pages/mixing/MixList";
import MixForm from "./pages/mixing/MixForm";
import MixView from "./pages/mixing/MixView";
import SimpleMixForm from "./pages/mixing/SimpleMixForm";
import { Tools, QRScannerPage } from "./pages/tools";
import { MaintenanceList, MaintenanceForm } from "./pages/maintenance";
import { 
  MaterialList, 
  MaterialForm, 
  MaterialInputForm, 
  MaterialInputsList 
} from "./pages/inventory";
// Material Input form is imported from './pages/inventory'
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./utils/auth";
import { LanguageProvider } from "./utils/language"; 
import { PermissionsProvider, RestrictedRoute } from "./utils/permissions";

function Router() {
  // Use auth context
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <ModernLoginPage />;
  }

  return (
    <MainLayout>
      <Switch>
        {/* Dashboard - All authenticated users */}
        <Route path="/">
          <Dashboard />
        </Route>
        
        {/* Customer routes - Salesperson and Admin can access */}
        <Route path="/customers/products">
          <RestrictedRoute role={["admin", "salesperson"]}>
            <CustomerProducts />
          </RestrictedRoute>
        </Route>
        <Route path="/customers/new">
          <RestrictedRoute role={["admin", "salesperson"]}>
            <CustomerForm />
          </RestrictedRoute>
        </Route>
        <Route path="/customers/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "salesperson"]}>
              <CustomerForm id={parseInt(params.id)} />
            </RestrictedRoute>
          )}
        </Route>
        <Route path="/customers">
          <RestrictedRoute role={["admin", "salesperson"]}>
            <CustomersList />
          </RestrictedRoute>
        </Route>
        
        {/* Item routes - Salesperson and Admin can access */}
        <Route path="/items/new">
          <RestrictedRoute role={["admin", "salesperson"]}>
            <ItemForm />
          </RestrictedRoute>
        </Route>
        <Route path="/items/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "salesperson"]}>
              <ItemForm id={parseInt(params.id)} />
            </RestrictedRoute>
          )}
        </Route>
        
        {/* Order routes - Salesperson and Admin can access */}
        <Route path="/orders/new">
          <RestrictedRoute role={["admin", "salesperson"]}>
            <OrderForm />
          </RestrictedRoute>
        </Route>
        <Route path="/orders/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "salesperson"]}>
              <OrderForm id={parseInt(params.id)} />
            </RestrictedRoute>
          )}
        </Route>
        <Route path="/orders">
          <RestrictedRoute role={["admin", "salesperson"]}>
            <OrdersList />
          </RestrictedRoute>
        </Route>
        
        {/* Product routes - Admin and Salesperson can access */}
        <Route path="/products/new">
          <RestrictedRoute role={["admin", "salesperson"]}>
            <ProductForm />
          </RestrictedRoute>
        </Route>
        <Route path="/products/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "salesperson"]}>
              <ProductForm id={parseInt(params.id)} />
            </RestrictedRoute>
          )}
        </Route>
        <Route path="/products">
          <RestrictedRoute role={["admin", "salesperson", "production_manager"]}>
            <ProductsList />
          </RestrictedRoute>
        </Route>
        
        {/* Category routes - Admin and Salesperson can access */}
        <Route path="/categories/new">
          <RestrictedRoute role={["admin", "salesperson"]}>
            <CategoryForm />
          </RestrictedRoute>
        </Route>
        <Route path="/categories/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "salesperson"]}>
              <CategoryForm id={parseInt(params.id)} />
            </RestrictedRoute>
          )}
        </Route>
        <Route path="/categories">
          <RestrictedRoute role={["admin", "salesperson", "production_manager"]}>
            <CategoriesList />
          </RestrictedRoute>
        </Route>
        
        {/* Production routes - Production Manager, Admin and Operator can access */}
        
        {/* Roll Production Workflow routes - ORDER MATTERS! More specific routes first */}
        <Route path="/production/extruding">
          <RestrictedRoute role={["admin", "production_manager", "operator"]}>
            <Extruding />
          </RestrictedRoute>
        </Route>
        
        <Route path="/production/printing/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "production_manager", "operator"]}>
              <Printing />
            </RestrictedRoute>
          )}
        </Route>
        
        <Route path="/production/cutting/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "production_manager", "operator"]}>
              <Cutting />
            </RestrictedRoute>
          )}
        </Route>
        
        <Route path="/production/rolls/edit/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "production_manager", "operator"]}>
              <RollEdit />
            </RestrictedRoute>
          )}
        </Route>
        
        <Route path="/production/rolls/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "production_manager", "operator", "warehouse"]}>
              <RollView />
            </RestrictedRoute>
          )}
        </Route>
        
        <Route path="/production/rolls">
          <RestrictedRoute role={["admin", "production_manager", "operator"]}>
            <ProductionRolls />
          </RestrictedRoute>
        </Route>
        
        <Route path="/production/receiving">
          <RestrictedRoute role={["admin", "production_manager", "warehouse"]}>
            <ReceivingPage />
          </RestrictedRoute>
        </Route>
        
        <Route path="/production/workflow">
          <RestrictedRoute role={["admin", "production_manager", "operator"]}>
            <WorkflowDashboard />
          </RestrictedRoute>
        </Route>

        <Route path="/production/roll-management">
          <RestrictedRoute role={["admin", "production_manager", "operator"]}>
            <RollManagement />
          </RestrictedRoute>
        </Route>
        
        <Route path="/production/waste-monitoring">
          <RestrictedRoute role={["admin", "production_manager"]}>
            <WasteMonitoring />
          </RestrictedRoute>
        </Route>
        
        <Route path="/production/receiving-orders">
          <RestrictedRoute role={["admin", "production_manager", "warehouse"]}>
            <ReceivingPage />
          </RestrictedRoute>
        </Route>
        
        {/* Production dashboard route */}
        <Route path="/production">
          <RestrictedRoute role={["admin", "production_manager", "operator"]}>
            <ProductionDashboard />
          </RestrictedRoute>
        </Route>
        
        {/* Job Order Screen - Admin, Production Manager, and Salesperson can access */}
        <Route path="/production/joborders">
          <RestrictedRoute role={["admin", "production_manager", "salesperson"]}>
            <JobOrderScreen />
          </RestrictedRoute>
        </Route>
        
        {/* Redirect for old URL structure - Job Order Screen */}
        <Route path="/joborders">
          <RestrictedRoute role={["admin", "production_manager", "salesperson"]}>
            <JobOrderScreen />
          </RestrictedRoute>
        </Route>
        
        {/* Report routes - Admin and Managers can access */}
        <Route path="/reports">
          <RestrictedRoute role={["admin", "production_manager"]}>
            <ReportsList />
          </RestrictedRoute>
        </Route>
        
        {/* Settings routes - Admin only */}
        <Route path="/settings/users/new">
          <RestrictedRoute role="admin">
            <UserForm />
          </RestrictedRoute>
        </Route>
        <Route path="/settings/users/:id">
          {(params) => (
            <RestrictedRoute role="admin">
              <UserForm id={parseInt(params.id)} />
            </RestrictedRoute>
          )}
        </Route>
        <Route path="/settings/users">
          <RestrictedRoute role="admin">
            <UsersList />
          </RestrictedRoute>
        </Route>
        <Route path="/settings/sms">
          <RestrictedRoute role="admin">
            <SmsNotifications />
          </RestrictedRoute>
        </Route>
        
        {/* Machine Management routes - Admin only */}
        <Route path="/machines/new">
          <RestrictedRoute role="admin">
            <MachineForm />
          </RestrictedRoute>
        </Route>
        <Route path="/machines/options">
          <RestrictedRoute role="admin">
            <MachineOptions />
          </RestrictedRoute>
        </Route>
        <Route path="/machines/:id">
          {(params) => (
            <RestrictedRoute role="admin">
              <MachineForm id={parseInt(params.id)} />
            </RestrictedRoute>
          )}
        </Route>
        <Route path="/machines">
          <RestrictedRoute role="admin">
            <MachineList />
          </RestrictedRoute>
        </Route>
        
        {/* Mix Management routes - Production Manager, Admin and Operator can access */}
        <Route path="/production/mixing/new-simple">
          <RestrictedRoute role={["admin", "production_manager"]}>
            <SimpleMixForm />
          </RestrictedRoute>
        </Route>
        <Route path="/production/mixing/edit/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "production_manager"]}>
              <MixForm id={parseInt(params.id)} />
            </RestrictedRoute>
          )}
        </Route>
        <Route path="/production/mixing/view/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "production_manager", "operator"]}>
              <MixView />
            </RestrictedRoute>
          )}
        </Route>
        <Route path="/production/mixing">
          <RestrictedRoute role={["admin", "production_manager", "operator"]}>
            <MixList />
          </RestrictedRoute>
        </Route>
        
        {/* Production Tools route - All authenticated users */}
        <Route path="/tools/qr-scanner">
          <QRScannerPage />
        </Route>
        <Route path="/tools">
          <Tools />
        </Route>
        
        {/* Maintenance routes - Admin, Production Manager, and Operator can access */}
        <Route path="/maintenance/new">
          <RestrictedRoute role={["admin", "production_manager", "operator"]}>
            <MaintenanceForm />
          </RestrictedRoute>
        </Route>
        <Route path="/maintenance/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "production_manager"]}>
              <MaintenanceForm id={parseInt(params.id)} />
            </RestrictedRoute>
          )}
        </Route>
        <Route path="/maintenance">
          <RestrictedRoute role={["admin", "production_manager", "operator"]}>
            <MaintenanceList />
          </RestrictedRoute>
        </Route>
        
        {/* Inventory Management routes - Admin and Production Manager can access */}
        <Route path="/inventory/materials/new">
          <RestrictedRoute role={["admin", "production_manager"]}>
            <MaterialForm />
          </RestrictedRoute>
        </Route>
        <Route path="/inventory/material-inputs/new">
          <RestrictedRoute role={["admin", "production_manager"]}>
            {/* Use our completely redesigned material input form */}
            <MaterialInputForm />
          </RestrictedRoute>
        </Route>
        <Route path="/inventory/materials/:id/inputs">
          {(params) => (
            <RestrictedRoute role={["admin", "production_manager", "operator"]}>
              <MaterialInputsList materialId={parseInt(params.id)} />
            </RestrictedRoute>
          )}
        </Route>
        <Route path="/inventory/materials/:id">
          {(params) => (
            <RestrictedRoute role={["admin", "production_manager"]}>
              <MaterialForm id={parseInt(params.id)} />
            </RestrictedRoute>
          )}
        </Route>
        <Route path="/inventory/materials">
          <RestrictedRoute role={["admin", "production_manager", "operator"]}>
            <MaterialList />
          </RestrictedRoute>
        </Route>
        
        {/* Fallback to 404 */}
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <PermissionsProvider>
            <ErrorBoundary>
              <Router />
              <Toaster />
            </ErrorBoundary>
          </PermissionsProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
