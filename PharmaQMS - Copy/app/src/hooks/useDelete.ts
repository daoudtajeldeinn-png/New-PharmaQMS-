/**
 * useDelete.ts
 * React hook that wraps deleteService for use in any component.
 *
 * Checks TWO gates before allowing delete:
 *   1. User must have `data.delete` permission (role-based)
 *   2. Global delete setting must be enabled by an Admin in Settings → Security
 *
 * Usage:
 *   const { canDelete, handleDelete, isDeleting } = useDelete();
 *   await handleDelete('products', product.id, product.name, () => dispatch({ type: 'DELETE_PRODUCT', payload: product.id }));
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useSecurity } from '@/components/security/SecurityProvider';
import { deleteRecord, canUserDelete } from '@/services/deleteService';

const GLOBAL_DELETE_KEY = 'pqms_global_delete_enabled';

/** Read the global delete setting (set by admins in Settings → Security) */
export function isGlobalDeleteEnabled(): boolean {
  try {
    const val = localStorage.getItem(GLOBAL_DELETE_KEY);
    // Default to enabled so admins can delete immediately.
    // Only disabled when an admin explicitly sets it to 'false' in Settings → Security.
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
}

/** Set the global delete setting (Admin only) */
export function setGlobalDeleteEnabled(enabled: boolean): void {
  localStorage.setItem(GLOBAL_DELETE_KEY, String(enabled));
}

export function useDelete() {
  const { user } = useSecurity();
  const [isDeleting, setIsDeleting] = useState(false);

  const roleCanDelete = canUserDelete(user);
  const globalEnabled = isGlobalDeleteEnabled();
  /** True only when the user has the right role AND the admin has enabled deletes globally */
  const canDelete = roleCanDelete && globalEnabled;

  const handleDelete = useCallback(
    async (
      tableName: string,
      recordId: string,
      recordLabel: string,
      /** Called AFTER successful delete to update local React state via dispatch */
      onSuccess: () => void,
      reason?: string
    ) => {
      if (!user) {
        toast.error('Not authenticated.');
        return false;
      }

      if (!roleCanDelete) {
        toast.error(
          'Access Denied: Only Administrators and QA Admins can delete records.',
          { duration: 5000 }
        );
        return false;
      }

      if (!globalEnabled) {
        toast.error(
          'Delete operations are globally disabled. Enable them in Settings → Security tab.',
          { duration: 6000 }
        );
        return false;
      }

      setIsDeleting(true);
      try {
        const result = await deleteRecord(user, tableName as any, recordId, recordLabel, reason);

        if (!result.success) {
          toast.error(result.error || 'Delete failed.');
          return false;
        }

        onSuccess();

        if (result.cloudDeleted) {
          toast.success(`"${recordLabel}" soft-deleted and synced to cloud.`);
        } else {
          toast.success(`"${recordLabel}" soft-deleted locally. Cloud sync will process shortly.`);
        }

        return true;
      } catch (err: any) {
        toast.error(`Delete error: ${err.message}`);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [user, roleCanDelete, globalEnabled]
  );

  return { canDelete, handleDelete, isDeleting, roleCanDelete, globalEnabled };
}
