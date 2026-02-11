<script setup lang="ts">
/* ============================================
   TENAXIS - App Sidebar
   Main navigation sidebar
   ============================================ */

import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUIStore, useAuthStore } from '@/stores';
import { usePermission } from '@/composables';
import { MODULES } from '@/lib/permissions';
import {
  LayoutDashboard,
  Package,
  Box,
  Wrench,
  FolderKanban,
  Building2,
  Users,
  BarChart3,
  ScrollText,
  Settings,
  ChevronLeft,
  LogOut,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const uiStore = useUIStore();
const authStore = useAuthStore();
const { canAccess } = usePermission();

// Navigation items
const navItems = computed(() => [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    module: MODULES.DASHBOARD,
  },
  {
    name: 'Assets',
    path: '/assets',
    icon: Package,
    module: MODULES.ASSETS,
  },
  {
    name: 'Consumables',
    path: '/consumables',
    icon: Box,
    module: MODULES.CONSUMABLES,
  },
  {
    name: 'Maintenance',
    path: '/maintenance',
    icon: Wrench,
    module: MODULES.MAINTENANCE,
  },
  {
    name: 'Projects',
    path: '/projects',
    icon: FolderKanban,
    module: MODULES.PROJECTS,
  },
  {
    name: 'Offices',
    path: '/offices',
    icon: Building2,
    module: MODULES.OFFICES,
  },
  {
    name: 'Users',
    path: '/users',
    icon: Users,
    module: MODULES.USERS,
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: BarChart3,
    module: MODULES.REPORTS,
  },
  {
    name: 'Audit Logs',
    path: '/audit-logs',
    icon: ScrollText,
    module: MODULES.AUDIT_LOGS,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
    module: MODULES.SETTINGS,
  },
]);

// Filter nav items based on permissions
const visibleNavItems = computed(() =>
  navItems.value.filter(item => canAccess(item.module))
);

// Check if route is active
const isActive = (path: string): boolean => {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
};

// Handle navigation
const navigateTo = (path: string): void => {
  router.push(path);
  if (uiStore.isMobile) {
    uiStore.closeMobileSidebar();
  }
};

// Handle logout
const handleLogout = async (): Promise<void> => {
  await authStore.logout();
  router.push('/auth/login');
};

// Sidebar class based on state
const sidebarClass = computed(() => ({
  'w-64': !uiStore.sidebarCollapsed,
  'w-20': uiStore.sidebarCollapsed,
  'translate-x-0': uiStore.sidebarMobileOpen,
  '-translate-x-full lg:translate-x-0': !uiStore.sidebarMobileOpen,
}));
</script>

<template>
  <aside
    class="fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border bg-sidebar-bg text-sidebar-text transition-all duration-300"
    :class="sidebarClass"
  >
    <!-- Header -->
    <div class="flex h-16 items-center justify-between border-b border-white/10 px-4">
      <div v-if="!uiStore.sidebarCollapsed" class="flex items-center gap-2">
        <span class="text-xl font-bold text-white">Tenaxis</span>
      </div>
      <div v-else class="mx-auto">
        <span class="text-xl font-bold text-white">T</span>
      </div>
      
      <button
        class="hidden rounded-md p-1.5 hover:bg-white/10 lg:block"
        @click="uiStore.toggleSidebar"
      >
        <ChevronLeft
          class="h-5 w-5 transition-transform"
          :class="{ 'rotate-180': uiStore.sidebarCollapsed }"
        />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 space-y-1 overflow-y-auto p-3">
      <button
        v-for="item in visibleNavItems"
        :key="item.path"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
        :class="[
          isActive(item.path)
            ? 'bg-white text-black'
            : 'text-white/70 hover:bg-white/10 hover:text-white',
        ]"
        @click="navigateTo(item.path)"
      >
        <component :is="item.icon" class="h-5 w-5 shrink-0" />
        <span
          v-if="!uiStore.sidebarCollapsed"
          class="truncate"
        >
          {{ item.name }}
        </span>
      </button>
    </nav>

    <!-- User section -->
    <div class="border-t border-white/10 p-3">
      <div
        v-if="!uiStore.sidebarCollapsed"
        class="mb-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2"
      >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-medium text-black"
        >
          {{ authStore.userName.charAt(0).toUpperCase() }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-white">{{ authStore.userName }}</p>
          <p class="truncate text-xs text-white/60">{{ authStore.userEmail }}</p>
        </div>
      </div>
      
      <button
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
        @click="handleLogout"
      >
        <LogOut class="h-5 w-5 shrink-0" />
        <span v-if="!uiStore.sidebarCollapsed">Logout</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.bg-sidebar-bg {
  background-color: hsl(var(--sidebar-bg));
}

.text-sidebar-text {
  color: hsl(var(--sidebar-text));
}

.bg-sidebar-active {
  background-color: hsl(var(--sidebar-active));
}
</style>
