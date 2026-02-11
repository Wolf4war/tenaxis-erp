/* ============================================
   TENAXIS - usePermission Composable
   Permission checking utilities
   ============================================ */

import { computed } from 'vue';
import { useAuthStore } from '@/stores';
import { 
  hasPermission, 
  canAccessModule, 
  isAdminRole,
  MODULES,
  type ModuleValue,
  type ActionValue 
} from '@/lib/permissions';

export function usePermission() {
  const authStore = useAuthStore();

  /**
   * Check if user has permission for action on module
   */
  const can = (module: ModuleValue, action: ActionValue): boolean => {
    if (!authStore.userRole) return false;
    return hasPermission(authStore.userRole, module, action);
  };

  /**
   * Check if user can access a module
   */
  const canAccess = (module: ModuleValue): boolean => {
    if (!authStore.userRole) return false;
    return canAccessModule(authStore.userRole, module);
  };

  /**
   * Check if user is admin
   */
  const isAdmin = computed(() => {
    if (!authStore.userRole) return false;
    return isAdminRole(authStore.userRole);
  });

  /**
   * Check if user can create in module
   */
  const canCreate = (module: ModuleValue): boolean => can(module, 'create');

  /**
   * Check if user can read in module
   */
  const canRead = (module: ModuleValue): boolean => can(module, 'read');

  /**
   * Check if user can update in module
   */
  const canUpdate = (module: ModuleValue): boolean => can(module, 'update');

  /**
   * Check if user can delete in module
   */
  const canDelete = (module: ModuleValue): boolean => can(module, 'delete');

  /**
   * Check if user can export from module
   */
  const canExport = (module: ModuleValue): boolean => can(module, 'export');

  // Module-specific permission checks
  const canManageAssets = computed(() => canCreate(MODULES.ASSETS));
  const canManageConsumables = computed(() => canCreate(MODULES.CONSUMABLES));
  const canManageMaintenance = computed(() => canCreate(MODULES.MAINTENANCE));
  const canManageProjects = computed(() => canCreate(MODULES.PROJECTS));
  const canManageUsers = computed(() => canCreate(MODULES.USERS));
  const canManageOrganization = computed(() => canUpdate(MODULES.ORGANIZATIONS));
  const canViewReports = computed(() => canRead(MODULES.REPORTS));
  const canViewAuditLogs = computed(() => canRead(MODULES.AUDIT_LOGS));
  const canManageSettings = computed(() => canUpdate(MODULES.SETTINGS));

  return {
    can,
    canAccess,
    isAdmin,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExport,
    canManageAssets,
    canManageConsumables,
    canManageMaintenance,
    canManageProjects,
    canManageUsers,
    canManageOrganization,
    canViewReports,
    canViewAuditLogs,
    canManageSettings,
  };
}
