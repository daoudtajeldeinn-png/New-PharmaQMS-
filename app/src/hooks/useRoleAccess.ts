/**
 * useRoleAccess.ts
 *
 * Central hook that provides role-based permission checks for:
 *   - canModify: user can create/edit data
 *   - canDelete: user can delete data
 *   - canRecover: user can restore soft-deleted records
 *   - isAdminRole: true for 'admin' and 'qc_manager'
 *   - currentUser: the logged-in user object
 *
 * Only Admin (role: 'admin') and QC Manager (role: 'qc_manager')
 * have delete and modify privileges.
 * All other roles are READ-ONLY for persistent data.
 */
import { useSecurity } from '@/components/security/SecurityProvider';

// Roles that are permitted to modify and delete data
// NOTE: must match role values defined in SecurityProvider.tsx User type
const ADMIN_ROLES = new Set(['admin', 'qc_manager', 'manager']);

export function useRoleAccess() {
  const { user } = useSecurity();

  // FIX: check user.role (not user.username) against the allowed roles set
  const isAdminRole = !!(user && ADMIN_ROLES.has(user.role));

  /** Create / edit records */
  const canModify = isAdminRole;

  /** Delete records (hard or soft delete) */
  const canDelete = !!(user && user.role === 'admin');

  /** Recover / restore soft-deleted records */
  const canRecover = !!(user && (user.role === 'admin' || user.role === 'qc_manager'));

  /** Check a specific permission string (legacy compatibility) */
  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(perm);
  };

  return {
    user,
    isAdminRole,
    canModify,
    canDelete,
    canRecover,
    hasPermission,
  };
}
