import { ReactNode } from 'react';
import { usePermission } from '@/app/hooks/usePermission';

/**
 * Component that conditionally renders its children based on a permission check.
 * While loading, it renders nothing. If permission is missing, it can render a fallback.
 */
export function RequirePermission({
  permission,
  fallback = null,
  children,
}: {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { hasPermission, loading, error } = usePermission(permission);

  if (loading) return null;
  if (error) {
    console.error('Permission check failed:', error);
    return <>{fallback}</>;
  }
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
