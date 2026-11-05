export type Role = 'admin' | 'store_person' | 'sales';

export const ROLES: readonly Role[] = ['admin', 'store_person', 'sales'] as const;

export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  store_person: 2,
  sales: 1
};
