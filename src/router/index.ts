/* ============================================
   TENAXIS - Vue Router Configuration
   Application routing with auth guards
   ============================================ */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores';
import { MODULES } from '@/lib/permissions';

// ==========================================
// ROUTE DEFINITIONS
// ==========================================

const routes: RouteRecordRaw[] = [
  // Auth routes (public)
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { public: true, title: 'Login' },
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('@/views/auth/ForgotPasswordView.vue'),
        meta: { public: true, title: 'Forgot Password' },
      },
    ],
  },

  // Main app routes (authenticated)
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // Dashboard
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: 'Dashboard', module: MODULES.DASHBOARD },
      },

      // Assets
      {
        path: 'assets',
        name: 'assets',
        component: () => import('@/views/assets/AssetListView.vue'),
        meta: { title: 'Assets', module: MODULES.ASSETS },
      },
      {
        path: 'assets/new',
        name: 'asset-create',
        component: () => import('@/views/assets/AssetFormView.vue'),
        meta: { title: 'New Asset', module: MODULES.ASSETS, action: 'create' },
      },
      {
        path: 'assets/:id',
        name: 'asset-detail',
        component: () => import('@/views/assets/AssetDetailView.vue'),
        meta: { title: 'Asset Details', module: MODULES.ASSETS },
      },
      {
        path: 'assets/:id/edit',
        name: 'asset-edit',
        component: () => import('@/views/assets/AssetFormView.vue'),
        meta: { title: 'Edit Asset', module: MODULES.ASSETS, action: 'update' },
      },

      // Consumables
      {
        path: 'consumables',
        name: 'consumables',
        component: () => import('@/views/stock/StockListView.vue'),
        meta: { title: 'Consumables', module: MODULES.CONSUMABLES },
      },
      {
        path: 'consumables/new',
        name: 'consumable-create',
        component: () => import('@/views/stock/StockListView.vue'), // TODO: Create form
        meta: { title: 'New Consumable', module: MODULES.CONSUMABLES, action: 'create' },
      },
      {
        path: 'consumables/:id',
        name: 'consumable-detail',
        component: () => import('@/views/stock/StockListView.vue'), // TODO: Create detail
        meta: { title: 'Consumable Details', module: MODULES.CONSUMABLES },
      },
      {
        path: 'stock',
        name: 'stock',
        component: () => import('@/views/stock/StockListView.vue'),
        meta: { title: 'Stock Management', module: MODULES.CONSUMABLES },
      },

      // Maintenance
      {
        path: 'maintenance',
        name: 'maintenance',
        component: () => import('@/views/maintenance/MaintenanceListView.vue'),
        meta: { title: 'Maintenance', module: MODULES.MAINTENANCE },
      },
      {
        path: 'maintenance/new',
        name: 'maintenance-create',
        component: () => import('@/views/maintenance/MaintenanceFormView.vue'),
        meta: { title: 'New Ticket', module: MODULES.MAINTENANCE, action: 'create' },
      },
      {
        path: 'maintenance/:id',
        name: 'maintenance-detail',
        component: () => import('@/views/maintenance/MaintenanceDetailView.vue'),
        meta: { title: 'Ticket Details', module: MODULES.MAINTENANCE },
      },

      // Projects
      {
        path: 'projects',
        name: 'projects',
        component: () => import('@/views/projects/ProjectListView.vue'),
        meta: { title: 'Projects', module: MODULES.PROJECTS },
      },
      {
        path: 'projects/new',
        name: 'project-create',
        component: () => import('@/views/projects/ProjectFormView.vue'),
        meta: { title: 'New Project', module: MODULES.PROJECTS, action: 'create' },
      },
      {
        path: 'projects/:id',
        name: 'project-detail',
        component: () => import('@/views/projects/ProjectDetailView.vue'),
        meta: { title: 'Project Details', module: MODULES.PROJECTS },
      },

      // Organization
      {
        path: 'offices',
        name: 'offices',
        component: () => import('@/views/offices/OfficeListView.vue'),
        meta: { title: 'Offices', module: MODULES.OFFICES },
      },
      {
        path: 'offices/new',
        name: 'office-create',
        component: () => import('@/views/offices/OfficeListView.vue'), // TODO: Create form
        meta: { title: 'New Office', module: MODULES.OFFICES, action: 'create' },
      },
      {
        path: 'offices/:id',
        name: 'office-detail',
        component: () => import('@/views/offices/OfficeListView.vue'), // TODO: Create detail
        meta: { title: 'Office Details', module: MODULES.OFFICES },
      },

      // Users
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/users/UserListView.vue'),
        meta: { title: 'Users', module: MODULES.USERS },
      },
      {
        path: 'users/new',
        name: 'user-create',
        component: () => import('@/views/users/UserFormView.vue'),
        meta: { title: 'New User', module: MODULES.USERS, action: 'create' },
      },
      {
        path: 'users/:id',
        name: 'user-detail',
        component: () => import('@/views/users/UserDetailView.vue'),
        meta: { title: 'User Details', module: MODULES.USERS },
      },

      // Reports
      {
        path: 'reports',
        name: 'reports',
        component: () => import('@/views/reports/ReportsView.vue'),
        meta: { title: 'Reports', module: MODULES.REPORTS },
      },

      // Audit Logs
      {
        path: 'audit-logs',
        name: 'audit-logs',
        component: () => import('@/views/audit/AuditLogsView.vue'),
        meta: { title: 'Audit Logs', module: MODULES.AUDIT_LOGS },
      },

      // Settings
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: { title: 'Settings', module: MODULES.SETTINGS },
      },

      // Profile
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/profile/ProfileView.vue'),
        meta: { title: 'Profile' },
      },
    ],
  },

  // 404 Not Found
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page Not Found' },
  },
];

// ==========================================
// ROUTER INSTANCE
// ==========================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
});

// ==========================================
// NAVIGATION GUARDS
// ==========================================

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Wait for auth to initialize
  if (authStore.isLoading) {
    await authStore.initializeAuth();
  }

  // Update page title
  const appName = 'Tenaxis';
  const pageTitle = to.meta.title as string | undefined;
  document.title = pageTitle ? `${pageTitle} | ${appName}` : appName;

  // Check if route requires auth
  if (to.meta.requiresAuth || to.matched.some(record => record.meta.requiresAuth)) {
    if (!authStore.isAuthenticated) {
      // Redirect to login
      return next({
        name: 'login',
        query: { redirect: to.fullPath },
      });
    }

    // Check module access
    const module = to.meta.module as string | undefined;
    if (module && !authStore.canAccess(module as any)) {
      // User doesn't have access to this module
      return next({ name: 'dashboard' });
    }

    // Check action permission
    const action = to.meta.action as string | undefined;
    if (module && action && !authStore.can(module as any, action as any)) {
      // User doesn't have permission for this action
      return next({ name: 'dashboard' });
    }
  }

  // Redirect authenticated users away from auth pages
  if (to.meta.public && authStore.isAuthenticated) {
    return next({ name: 'dashboard' });
  }

  next();
});

export default router;
