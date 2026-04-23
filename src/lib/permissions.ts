// Defines the professional Permission System for PharmaQMS Enterprise

export type Role = 'admin' | 'manager' | 'qc_manager' | 'analyst' | 'viewer';

export type Module = 
  | 'COA'
  | 'CAPA'
  | 'DEVIATION'
  | 'INVENTORY'
  | 'SETTINGS'
  | 'TESTING'
  | 'EQUIPMENT'
  | 'USERS';

export type Action = 
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE' // Soft Delete
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT';

export interface Permission {
  module: Module;
  actions: Action[];
}

export const PERMISSION_MATRIX: Record<Role, Permission[]> = {
  admin: [
    { module: 'COA', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'CAPA', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'DEVIATION', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'INVENTORY', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'SETTINGS', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'TESTING', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'EQUIPMENT', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'USERS', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT'] },
  ],
  manager: [
    { module: 'COA', actions: ['CREATE', 'READ', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'CAPA', actions: ['CREATE', 'READ', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'DEVIATION', actions: ['CREATE', 'READ', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'INVENTORY', actions: ['CREATE', 'READ', 'UPDATE', 'EXPORT'] },
    { module: 'SETTINGS', actions: ['READ'] },
    { module: 'TESTING', actions: ['CREATE', 'READ', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'EQUIPMENT', actions: ['READ', 'UPDATE'] },
    { module: 'USERS', actions: ['READ'] },
  ],
  qc_manager: [
    { module: 'COA', actions: ['CREATE', 'READ', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'TESTING', actions: ['CREATE', 'READ', 'UPDATE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { module: 'INVENTORY', actions: ['READ', 'EXPORT'] },
    { module: 'EQUIPMENT', actions: ['READ', 'UPDATE'] },
  ],
  analyst: [
    { module: 'COA', actions: ['CREATE', 'READ', 'UPDATE', 'EXPORT'] },
    { module: 'TESTING', actions: ['CREATE', 'READ', 'UPDATE', 'EXPORT'] },
    { module: 'INVENTORY', actions: ['READ'] },
    { module: 'EQUIPMENT', actions: ['READ'] },
  ],
  viewer: [
    { module: 'COA', actions: ['READ'] },
    { module: 'CAPA', actions: ['READ'] },
    { module: 'DEVIATION', actions: ['READ'] },
    { module: 'INVENTORY', actions: ['READ'] },
    { module: 'TESTING', actions: ['READ'] },
    { module: 'EQUIPMENT', actions: ['READ'] },
  ],
};

/**
 * Core permission check function
 */
export function checkPermission(userRole: Role, module: Module, action: Action): boolean {
  if (userRole === 'admin') return true;
  
  const permissions = PERMISSION_MATRIX[userRole];
  if (!permissions) return false;
  
  const modulePermission = permissions.find(p => p.module === module);
  if (!modulePermission) return false;
  
  return modulePermission.actions.includes(action);
}
