/* ============================================
   TENAXIS - Permission System
   Centralized role-based access control
   ============================================ */

import type { UserRole, Permission } from '@/types';

// ==========================================
// MODULE DEFINITIONS
// ==========================================

export const MODULES = {
  DASHBOARD: 'dashboard',
  ASSETS: 'assets',
  CONSUMABLES: 'consumables',
  MAINTENANCE: 'maintenance',
  PROJECTS: 'projects',
  ORGANIZATIONS: 'organizations',
  COMPANIES: 'companies',
  OFFICES: 'offices',
  DEPARTMENTS: 'departments',
  USERS: 'users',
  VENDORS: 'vendors',
  REPORTS: 'reports',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings',
} as const;

export type ModuleKey = keyof typeof MODULES;
export type ModuleValue = (typeof MODULES)[ModuleKey];

// ==========================================
// ACTION DEFINITIONS
// ==========================================

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  ASSIGN: 'assign',
  TRANSFER: 'transfer',
  APPROVE: 'approve',
} as const;

export type ActionKey = keyof typeof ACTIONS;
export type ActionValue = (typeof ACTIONS)[ActionKey];

// ==========================================
// ROLE PERMISSION MATRIX
// ==========================================

const ALL_ACTIONS: ActionValue[] = ['create', 'read', 'update', 'delete', 'export'];
const READ_ONLY: ActionValue[] = ['read', 'export'];
const READ_CREATE_UPDATE: ActionValue[] = ['create', 'read', 'update'];

export const ROLE_PERMISSIONS: Record<UserRole, Record<ModuleValue, ActionValue[]>> = {
  // Platform-level super admin - full access to everything
  SUPER_ADMIN: {
    [MODULES.DASHBOARD]: ALL_ACTIONS,
    [MODULES.ASSETS]: ALL_ACTIONS,
    [MODULES.CONSUMABLES]: ALL_ACTIONS,
    [MODULES.MAINTENANCE]: ALL_ACTIONS,
    [MODULES.PROJECTS]: ALL_ACTIONS,
    [MODULES.ORGANIZATIONS]: ALL_ACTIONS,
    [MODULES.COMPANIES]: ALL_ACTIONS,
    [MODULES.OFFICES]: ALL_ACTIONS,
    [MODULES.DEPARTMENTS]: ALL_ACTIONS,
    [MODULES.USERS]: ALL_ACTIONS,
    [MODULES.VENDORS]: ALL_ACTIONS,
    [MODULES.REPORTS]: ALL_ACTIONS,
    [MODULES.AUDIT_LOGS]: ['read', 'export'],
    [MODULES.SETTINGS]: ALL_ACTIONS,
  },
  
  // Tenant administrator - full access within tenant
  TENANT_ADMIN: {
    [MODULES.DASHBOARD]: ALL_ACTIONS,
    [MODULES.ASSETS]: ALL_ACTIONS,
    [MODULES.CONSUMABLES]: ALL_ACTIONS,
    [MODULES.MAINTENANCE]: ALL_ACTIONS,
    [MODULES.PROJECTS]: ALL_ACTIONS,
    [MODULES.ORGANIZATIONS]: ALL_ACTIONS,
    [MODULES.COMPANIES]: ALL_ACTIONS,
    [MODULES.OFFICES]: ALL_ACTIONS,
    [MODULES.DEPARTMENTS]: ALL_ACTIONS,
    [MODULES.USERS]: ALL_ACTIONS,
    [MODULES.VENDORS]: ALL_ACTIONS,
    [MODULES.REPORTS]: ALL_ACTIONS,
    [MODULES.AUDIT_LOGS]: ['read', 'export'],
    [MODULES.SETTINGS]: ALL_ACTIONS,
  },
  
  // Organization administrator
  ORG_ADMIN: {
    [MODULES.DASHBOARD]: ['read'],
    [MODULES.ASSETS]: ALL_ACTIONS,
    [MODULES.CONSUMABLES]: ALL_ACTIONS,
    [MODULES.MAINTENANCE]: ALL_ACTIONS,
    [MODULES.PROJECTS]: ALL_ACTIONS,
    [MODULES.ORGANIZATIONS]: ['read', 'update'],
    [MODULES.COMPANIES]: ALL_ACTIONS,
    [MODULES.OFFICES]: ALL_ACTIONS,
    [MODULES.DEPARTMENTS]: ALL_ACTIONS,
    [MODULES.USERS]: ALL_ACTIONS,
    [MODULES.VENDORS]: ALL_ACTIONS,
    [MODULES.REPORTS]: ['read', 'export'],
    [MODULES.AUDIT_LOGS]: ['read'],
    [MODULES.SETTINGS]: ['read', 'update'],
  },
  
  // IT Administrator
  IT_ADMIN: {
    [MODULES.DASHBOARD]: ['read'],
    [MODULES.ASSETS]: ALL_ACTIONS,
    [MODULES.CONSUMABLES]: ALL_ACTIONS,
    [MODULES.MAINTENANCE]: ALL_ACTIONS,
    [MODULES.PROJECTS]: READ_CREATE_UPDATE,
    [MODULES.ORGANIZATIONS]: ['read'],
    [MODULES.COMPANIES]: ['read'],
    [MODULES.OFFICES]: ['read'],
    [MODULES.DEPARTMENTS]: ['read'],
    [MODULES.USERS]: ['read'],
    [MODULES.VENDORS]: READ_CREATE_UPDATE,
    [MODULES.REPORTS]: ['read', 'export'],
    [MODULES.AUDIT_LOGS]: ['read'],
    [MODULES.SETTINGS]: ['read'],
  },
  
  // IT Technician
  IT_TECHNICIAN: {
    [MODULES.DASHBOARD]: ['read'],
    [MODULES.ASSETS]: READ_CREATE_UPDATE,
    [MODULES.CONSUMABLES]: ['read', 'update'],
    [MODULES.MAINTENANCE]: READ_CREATE_UPDATE,
    [MODULES.PROJECTS]: ['read'],
    [MODULES.ORGANIZATIONS]: ['read'],
    [MODULES.COMPANIES]: ['read'],
    [MODULES.OFFICES]: ['read'],
    [MODULES.DEPARTMENTS]: ['read'],
    [MODULES.USERS]: ['read'],
    [MODULES.VENDORS]: ['read'],
    [MODULES.REPORTS]: ['read'],
    [MODULES.AUDIT_LOGS]: [],
    [MODULES.SETTINGS]: [],
  },
  
  // Office Administrator
  OFFICE_ADMIN: {
    [MODULES.DASHBOARD]: ['read'],
    [MODULES.ASSETS]: ['read', 'update'],
    [MODULES.CONSUMABLES]: READ_CREATE_UPDATE,
    [MODULES.MAINTENANCE]: READ_CREATE_UPDATE,
    [MODULES.PROJECTS]: ['read'],
    [MODULES.ORGANIZATIONS]: ['read'],
    [MODULES.COMPANIES]: ['read'],
    [MODULES.OFFICES]: ['read', 'update'],
    [MODULES.DEPARTMENTS]: READ_CREATE_UPDATE,
    [MODULES.USERS]: ['read'],
    [MODULES.VENDORS]: ['read'],
    [MODULES.REPORTS]: ['read', 'export'],
    [MODULES.AUDIT_LOGS]: [],
    [MODULES.SETTINGS]: ['read'],
  },
  
  // Finance role
  FINANCE: {
    [MODULES.DASHBOARD]: ['read'],
    [MODULES.ASSETS]: ['read', 'export'],
    [MODULES.CONSUMABLES]: ['read', 'export'],
    [MODULES.MAINTENANCE]: ['read', 'export'],
    [MODULES.PROJECTS]: ['read', 'export'],
    [MODULES.ORGANIZATIONS]: ['read'],
    [MODULES.COMPANIES]: ['read'],
    [MODULES.OFFICES]: ['read'],
    [MODULES.DEPARTMENTS]: ['read'],
    [MODULES.USERS]: ['read'],
    [MODULES.VENDORS]: ['read', 'export'],
    [MODULES.REPORTS]: ['read', 'export'],
    [MODULES.AUDIT_LOGS]: ['read'],
    [MODULES.SETTINGS]: [],
  },
  
  // Management - read-only access
  MANAGEMENT: {
    [MODULES.DASHBOARD]: ['read'],
    [MODULES.ASSETS]: READ_ONLY,
    [MODULES.CONSUMABLES]: READ_ONLY,
    [MODULES.MAINTENANCE]: READ_ONLY,
    [MODULES.PROJECTS]: READ_ONLY,
    [MODULES.ORGANIZATIONS]: ['read'],
    [MODULES.COMPANIES]: ['read'],
    [MODULES.OFFICES]: ['read'],
    [MODULES.DEPARTMENTS]: ['read'],
    [MODULES.USERS]: ['read'],
    [MODULES.VENDORS]: ['read'],
    [MODULES.REPORTS]: ['read', 'export'],
    [MODULES.AUDIT_LOGS]: ['read'],
    [MODULES.SETTINGS]: [],
  },
};

// ==========================================
// PERMISSION HELPERS
// ==========================================

/**
 * Check if a role has permission for a specific action on a module
 */
export function hasPermission(
  role: UserRole,
  module: ModuleValue,
  action: ActionValue
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  if (!rolePermissions) return false;
  
  const modulePermissions = rolePermissions[module];
  if (!modulePermissions) return false;
  
  return modulePermissions.includes(action);
}

/**
 * Check if a role can access a module (has at least read permission)
 */
export function canAccessModule(role: UserRole, module: ModuleValue): boolean {
  return hasPermission(role, module, 'read');
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return [];
  
  return Object.entries(rolePerms).map(([module, actions]) => ({
    module,
    actions: actions as ('create' | 'read' | 'update' | 'delete' | 'export')[],
  }));
}

/**
 * Get accessible modules for a role
 */
export function getAccessibleModules(role: UserRole): ModuleValue[] {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return [];
  
  return Object.entries(rolePerms)
    .filter(([_, actions]) => actions.includes('read'))
    .map(([module]) => module as ModuleValue);
}

/**
 * Check if role is admin level
 */
export function isAdminRole(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'TENANT_ADMIN', 'ORG_ADMIN'].includes(role);
}

/**
 * Check if role can manage users
 */
export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, MODULES.USERS, 'create') || 
         hasPermission(role, MODULES.USERS, 'update');
}

/**
 * Check if role can manage organization structure
 */
export function canManageOrganization(role: UserRole): boolean {
  return hasPermission(role, MODULES.ORGANIZATIONS, 'update') &&
         hasPermission(role, MODULES.OFFICES, 'create');
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Administrator',
    TENANT_ADMIN: 'Tenant Administrator',
    ORG_ADMIN: 'Organization Administrator',
    IT_ADMIN: 'IT Administrator',
    IT_TECHNICIAN: 'IT Technician',
    OFFICE_ADMIN: 'Office Administrator',
    FINANCE: 'Finance',
    MANAGEMENT: 'Management',
  };
  
  return displayNames[role] || role;
}

/**
 * Get available roles for assignment (based on current user's role)
 */
export function getAssignableRoles(currentUserRole: UserRole): UserRole[] {
  const roleHierarchy: UserRole[] = [
    'SUPER_ADMIN',
    'TENANT_ADMIN',
    'ORG_ADMIN',
    'IT_ADMIN',
    'OFFICE_ADMIN',
    'IT_TECHNICIAN',
    'FINANCE',
    'MANAGEMENT',
  ];
  
  const currentIndex = roleHierarchy.indexOf(currentUserRole);
  if (currentIndex === -1) return [];
  
  // Users can only assign roles below their level
  // SUPER_ADMIN and TENANT_ADMIN can assign all roles
  if (currentIndex <= 1) {
    return roleHierarchy.slice(1); // Exclude SUPER_ADMIN
  }
  
  return roleHierarchy.slice(currentIndex + 1);
}
