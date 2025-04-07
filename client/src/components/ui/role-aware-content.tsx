import React from 'react';
import { usePermissions } from '@/utils/permissions';
import { useAuth } from '@/utils/auth';

interface RoleAwareContentProps {
  adminContent?: React.ReactNode;
  managerContent?: React.ReactNode;
  salespersonContent?: React.ReactNode;
  operatorContent?: React.ReactNode;
  fallbackContent?: React.ReactNode;
  unauthenticatedContent?: React.ReactNode;
}

/**
 * Component that renders different content based on the user's role
 */
export function RoleAwareContent({
  adminContent,
  managerContent,
  salespersonContent,
  operatorContent,
  fallbackContent = <div>You don't have permission to view this content</div>,
  unauthenticatedContent = <div>Please log in to access this content</div>
}: RoleAwareContentProps) {
  const { isAuthenticated } = useAuth();
  const { 
    isAdmin, 
    isProductionManager, 
    isSalesperson, 
    isOperator 
  } = usePermissions();

  // First check if user is authenticated at all
  if (!isAuthenticated) {
    return <>{unauthenticatedContent}</>;
  }

  if (isAdmin && adminContent) {
    return <>{adminContent}</>;
  }

  if (isProductionManager && managerContent) {
    return <>{managerContent}</>;
  }

  if (isSalesperson && salespersonContent) {
    return <>{salespersonContent}</>;
  }

  if (isOperator && operatorContent) {
    return <>{operatorContent}</>;
  }

  return <>{fallbackContent}</>;
}

interface PermissionAwareContentProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  unauthenticatedContent?: React.ReactNode;
}

/**
 * Component that renders content only if the user has the specified permission
 */
export function PermissionAwareContent({
  permission,
  children,
  fallback = null,
  unauthenticatedContent = <div>Please log in to access this content</div>
}: PermissionAwareContentProps) {
  const { isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions();
  
  // First check if user is authenticated
  if (!isAuthenticated) {
    return <>{unauthenticatedContent}</>;
  }
  
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}