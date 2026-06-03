import type { User } from '@/components/security/SecurityProvider';

export class PermissionService {
  static canDelete(user: User | null): boolean {
    if (!user) return false;
    return user.username === 'admin' || user.username === 'qa_admin';
  }

  static canRecover(user: User | null): boolean {
    if (!user) return false;
    return user.username === 'admin' || user.username === 'qa_admin';
  }

  static canHardDelete(user: User | null): boolean {
    if (!user) return false;
    return user.username === 'admin' || user.username === 'qa_admin';
  }
}
