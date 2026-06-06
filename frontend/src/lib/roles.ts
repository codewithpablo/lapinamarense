import type { UserRole } from '@/contexts/AuthContext';

export const STAFF_ROLES: UserRole[] = ['superadmin', 'admin', 'empleado'];

export function isStaff(role?: UserRole | null) {
  return !!role && STAFF_ROLES.includes(role);
}

export function isManager(role?: UserRole | null) {
  return role === 'superadmin' || role === 'admin';
}

export function isSuperAdmin(role?: UserRole | null) {
  return role === 'superadmin';
}
