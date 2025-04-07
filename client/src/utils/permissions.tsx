import React, { createContext, useContext } from 'react';
import { useAuth } from './auth';
import { ROLE_PERMISSIONS, USER_ROLES } from '@shared/schema';

interface PermissionsContextType {
  hasPermission: (resource: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  isAdmin: boolean;
  isProductionManager: boolean;
  isSalesperson: boolean;
  isOperator: boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  hasPermission: () => false,
  hasRole: () => false,
  isAdmin: false,
  isProductionManager: false,
  isSalesperson: false,
  isOperator: false,
});

interface PermissionsProviderProps {
  children: React.ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Function to check if user has permission for a resource
  const hasPermission = (resource: string): boolean => {
    if (!user) return false;
    
    // If user is admin, they should have all permissions
    if (user.role === USER_ROLES.ADMIN) return true;
    
    const role = user.role as keyof typeof ROLE_PERMISSIONS;
    
    if (!ROLE_PERMISSIONS[role]) {
      return false;
    }
    
    // Type assertion to handle the readonly array
    return (ROLE_PERMISSIONS[role] as readonly string[]).includes(resource);
  };
  
  // Function to check if user has a specific role or one of the roles in an array
  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    // If user is admin, they should have access to everything
    if (user.role === USER_ROLES.ADMIN) return true;
    
    if (Array.isArray(role)) {
      // Check if user's role is in the provided array
      return role.includes(user.role);
    }
    
    // Check for a single role
    return user.role === role;
  };
  
  // Role-specific checks
  const isAdmin = hasRole(USER_ROLES.ADMIN);
  const isProductionManager = hasRole(USER_ROLES.PRODUCTION_MANAGER);
  const isSalesperson = hasRole(USER_ROLES.SALESPERSON);
  const isOperator = hasRole(USER_ROLES.OPERATOR);
  
  const value = {
    hasPermission,
    hasRole,
    isAdmin,
    isProductionManager,
    isSalesperson,
    isOperator,
  };
  
  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);

// Restricted Route Component that conditionally renders based on permissions
interface RestrictedRouteProps {
  children: React.ReactNode;
  resource?: string;
  role?: string | string[];
  fallback?: React.ReactNode;
}

export const RestrictedRoute: React.FC<RestrictedRouteProps> = ({
  children,
  resource,
  role,
  fallback = <div className="p-8 text-center">You don't have permission to access this page.</div>,
}) => {
  const { hasPermission, hasRole, isAdmin } = usePermissions();
  
  // Admin users should always have access
  if (isAdmin) {
    return <>{children}</>;
  }
  
  // Check if user has permission or role
  const hasAccess = (resource && hasPermission(resource)) || (role && hasRole(role));
  
  // If no resource or role is specified, grant access
  const shouldRender = (!resource && !role) || hasAccess;
  
  return shouldRender ? <>{children}</> : <>{fallback}</>;
};