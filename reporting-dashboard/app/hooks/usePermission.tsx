import { useEffect, useState } from 'react';

/**
 * Hook to check if the current user has a specific permission.
 * It fetches the permission list from the backend endpoint `/api/auth/permissions`.
 * Returns an object with loading state, error and a boolean `hasPermission`.
 */
export function usePermission(permission: string) {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/permissions', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch permissions');
        return res.json();
      })
      .then((data: { permissions: string[] }) => {
        if (active) {
          setHasPermission(data.permissions.includes(permission));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [permission]);

  return { hasPermission, loading, error };
}
