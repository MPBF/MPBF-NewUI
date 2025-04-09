import { Switch, Route } from "wouter";
import { RestrictedRoute } from "./utils/permissions";
import MainLayout from "./layouts/MainLayout";
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
import NotFound from "./pages/not-found";

export function AppRouter() {
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
          <RestrictedRoute role={["admin", "salesperson"]}>
            <CustomerForm />
          </RestrictedRoute>
        </Route>
        <Route path="/customers">
          <RestrictedRoute role={["admin", "salesperson"]}>
            <CustomersList />
          </RestrictedRoute>
        </Route>

        {/* Order routes - Salesperson and Admin can access */}
        <Route path="/orders/new">
          <RestrictedRoute role={["admin", "salesperson"]}>
            <OrderForm />
          </RestrictedRoute>
        </Route>
        <Route path="/orders/:id">
          <RestrictedRoute role={["admin", "salesperson"]}>
            <OrderForm />
          </RestrictedRoute>
        </Route>
        <Route path="/orders">
          <RestrictedRoute role={["admin", "salesperson"]}>
            <OrdersList />
          </RestrictedRoute>
        </Route>

        {/* Product routes - Admin only */}
        <Route path="/products/categories/new">
          <RestrictedRoute role={["admin"]}>
            <CategoryForm />
          </RestrictedRoute>
        </Route>
        <Route path="/products/categories/:id">
          <RestrictedRoute role={["admin"]}>
            <CategoryForm />
          </RestrictedRoute>
        </Route>
        <Route path="/products/categories">
          <RestrictedRoute role={["admin"]}>
            <CategoriesList />
          </RestrictedRoute>
        </Route>
        <Route path="/products/new">
          <RestrictedRoute role={["admin"]}>
            <ProductForm />
          </RestrictedRoute>
        </Route>
        <Route path="/products/:id">
          <RestrictedRoute role={["admin"]}>
            <ProductForm />
          </RestrictedRoute>
        </Route>
        <Route path="/products">
          <RestrictedRoute role={["admin"]}>
            <ProductsList />
          </RestrictedRoute>
        </Route>

        {/* Production routes - Production staff and Admin can access */}
        <Route path="/production/rolls/:id/edit">
          <RestrictedRoute role={["admin", "production"]}>
            <RollEdit />
          </RestrictedRoute>
        </Route>
        <Route path="/production/rolls/:id">
          <RestrictedRoute role={["admin", "production"]}>
            <RollView />
          </RestrictedRoute>
        </Route>
        <Route path="/production/rolls">
          <RestrictedRoute role={["admin", "production"]}>
            <RollsList />
          </RestrictedRoute>
        </Route>
        <Route path="/production/management">
          <RestrictedRoute role={["admin", "production"]}>
            <RollManagement />
          </RestrictedRoute>
        </Route>
        <Route path="/production/receiving">
          <RestrictedRoute role={["admin", "production"]}>
            <ReceivingPage />
          </RestrictedRoute>
        </Route>
        <Route path="/production/waste">
          <RestrictedRoute role={["admin", "production"]}>
            <WasteMonitoring />
          </RestrictedRoute>
        </Route>
        <Route path="/production/workflow">
          <RestrictedRoute role={["admin", "production"]}>
            <WorkflowDashboard />
          </RestrictedRoute>
        </Route>
        <Route path="/production/extruding">
          <RestrictedRoute role={["admin", "production"]}>
            <Extruding />
          </RestrictedRoute>
        </Route>
        <Route path="/production/printing">
          <RestrictedRoute role={["admin", "production"]}>
            <Printing />
          </RestrictedRoute>
        </Route>
        <Route path="/production/cutting">
          <RestrictedRoute role={["admin", "production"]}>
            <Cutting />
          </RestrictedRoute>
        </Route>
        <Route path="/production/rolls-list">
          <RestrictedRoute role={["admin", "production"]}>
            <ProductionRolls />
          </RestrictedRoute>
        </Route>
        <Route path="/production/new">
          <RestrictedRoute role={["admin", "production"]}>
            <ProductionForm />
          </RestrictedRoute>
        </Route>
        <Route path="/production/:id">
          <RestrictedRoute role={["admin", "production"]}>
            <ProductionForm />
          </RestrictedRoute>
        </Route>
        <Route path="/production">
          <RestrictedRoute role={["admin", "production"]}>
            <ProductionList />
          </RestrictedRoute>
        </Route>

        {/* Reports routes - Admin only */}
        <Route path="/reports">
          <RestrictedRoute role={["admin"]}>
            <ReportsList />
          </RestrictedRoute>
        </Route>

        {/* Settings routes - Admin only */}
        <Route path="/settings/users/new">
          <RestrictedRoute role={["admin"]}>
            <UserForm />
          </RestrictedRoute>
        </Route>
        <Route path="/settings/users/:id">
          <RestrictedRoute role={["admin"]}>
            <UserForm />
          </RestrictedRoute>
        </Route>
        <Route path="/settings/users">
          <RestrictedRoute role={["admin"]}>
            <UsersList />
          </RestrictedRoute>
        </Route>
        <Route path="/settings/sms">
          <RestrictedRoute role={["admin"]}>
            <SmsNotifications />
          </RestrictedRoute>
        </Route>

        {/* Tools routes - All authenticated users */}
        <Route path="/tools/qr-scanner">
          <Tools />
        </Route>
        <Route path="/tools">
          <Tools />
        </Route>

        {/* Maintenance routes - Maintenance staff and Admin can access */}
        <Route path="/maintenance/new">
          <RestrictedRoute role={["admin", "maintenance"]}>
            <MaintenanceForm />
          </RestrictedRoute>
        </Route>
        <Route path="/maintenance/:id">
          <RestrictedRoute role={["admin", "maintenance"]}>
            <MaintenanceForm />
          </RestrictedRoute>
        </Route>
        <Route path="/maintenance">
          <RestrictedRoute role={["admin", "maintenance"]}>
            <MaintenanceList />
          </RestrictedRoute>
        </Route>

        {/* Inventory routes - Inventory staff and Admin can access */}
        <Route path="/inventory/inputs/new">
          <RestrictedRoute role={["admin", "inventory"]}>
            <MaterialInputForm />
          </RestrictedRoute>
        </Route>
        <Route path="/inventory/inputs/:id">
          <RestrictedRoute role={["admin", "inventory"]}>
            <MaterialInputForm />
          </RestrictedRoute>
        </Route>
        <Route path="/inventory/inputs">
          <RestrictedRoute role={["admin", "inventory"]}>
            <MaterialInputsList />
          </RestrictedRoute>
        </Route>
        <Route path="/inventory/new">
          <RestrictedRoute role={["admin", "inventory"]}>
            <MaterialForm />
          </RestrictedRoute>
        </Route>
        <Route path="/inventory/:id">
          <RestrictedRoute role={["admin", "inventory"]}>
            <MaterialForm />
          </RestrictedRoute>
        </Route>
        <Route path="/inventory">
          <RestrictedRoute role={["admin", "inventory"]}>
            <MaterialList />
          </RestrictedRoute>
        </Route>

        {/* Machine routes - Maintenance staff and Admin can access */}
        <Route path="/machines/options">
          <RestrictedRoute role={["admin", "maintenance"]}>
            <MachineOptions />
          </RestrictedRoute>
        </Route>
        <Route path="/machines/new">
          <RestrictedRoute role={["admin", "maintenance"]}>
            <MachineForm />
          </RestrictedRoute>
        </Route>
        <Route path="/machines/:id">
          <RestrictedRoute role={["admin", "maintenance"]}>
            <MachineForm />
          </RestrictedRoute>
        </Route>
        <Route path="/machines">
          <RestrictedRoute role={["admin", "maintenance"]}>
            <MachineList />
          </RestrictedRoute>
        </Route>

        {/* Job Order routes - Production staff and Admin can access */}
        <Route path="/joborders/:id">
          <RestrictedRoute role={["admin", "production"]}>
            <JobOrderScreen />
          </RestrictedRoute>
        </Route>

        {/* Mixing routes - Production staff and Admin can access */}
        <Route path="/mixing/simple/new">
          <RestrictedRoute role={["admin", "production"]}>
            <SimpleMixForm />
          </RestrictedRoute>
        </Route>
        <Route path="/mixing/new">
          <RestrictedRoute role={["admin", "production"]}>
            <MixForm />
          </RestrictedRoute>
        </Route>
        <Route path="/mixing/:id">
          <RestrictedRoute role={["admin", "production"]}>
            <MixView />
          </RestrictedRoute>
        </Route>
        <Route path="/mixing">
          <RestrictedRoute role={["admin", "production"]}>
            <MixList />
          </RestrictedRoute>
        </Route>

        {/* 404 Not Found */}
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </MainLayout>
  );
} 