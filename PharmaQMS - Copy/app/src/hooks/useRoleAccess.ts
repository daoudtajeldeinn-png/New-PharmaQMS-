/**
 * useRoleAccess.ts
 * 
 * Central hook that provides role-based permission checks for:
 *   - canModify: user can create/edit data
 *   - canDelete: user can delete data
 *   - canRecover: user can restore soft-deleted records
 *   - isAdminRole: true for 'it_admin' and 'qa_admin'
 *   - currentUser: the logged-in user object
 *
 * Only IT Admin (role: 'it_admin') and QA Admin (role: 'qa_admin')
 * have delete and modify privileges.
 * All other roles are READ-ONLY for persistent data.
 */

import { useSecurity } from '@/components/security/SecurityProvider';

// Roles that are permitted to modify and delete data
const ADMIN_ROLES = new Set(['it_admin', 'qa_admin', 'admin']);

export function useRoleAccess() {
  const { user } = useSecurity();

  const username = user?.username?.toLowerCase();
  const isAdminRole = !!(user && (username === 'admin' || username === 'qa_admin'));

  /** Create / edit records */
  const canModify = isAdminRole;

  /** Delete records (hard or soft delete) */
  const canDelete = isAdminRole;

  /** Recover / restore soft-deleted records */
  const canRecover = isAdminRole;

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
