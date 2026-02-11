<script setup lang="ts">
/* ============================================
   TENAXIS - Dashboard View
   Main dashboard with KPIs and summaries
   ============================================ */

import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, useAssetStore } from '@/stores';
import { formatNumber } from '@/lib/utils';
import {
  Package,
  Box,
  Wrench,
  FolderKanban,
  Users,
  Building2,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const assetStore = useAssetStore();

const isLoading = ref(true);

// Dashboard stats
const stats = ref({
  totalAssets: 0,
  assetsInUse: 0,
  assetsAvailable: 0,
  assetsUnderMaintenance: 0,
  totalConsumables: 0,
  lowStockAlerts: 0,
  openTickets: 0,
  criticalTickets: 0,
  activeProjects: 0,
  totalUsers: 0,
  totalOffices: 0,
});

// Quick action cards
const quickActions = [
  {
    title: 'Add Asset',
    description: 'Register a new asset',
    icon: Package,
    path: '/assets/new',
    module: 'assets',
  },
  {
    title: 'Create Ticket',
    description: 'Report an issue',
    icon: Wrench,
    path: '/maintenance/new',
    module: 'maintenance',
  },
  {
    title: 'Manage Stock',
    description: 'Issue or restock items',
    icon: Box,
    path: '/stock',
    module: 'consumables',
  },
  {
    title: 'Start Project',
    description: 'Create new project',
    icon: FolderKanban,
    path: '/projects/new',
    module: 'projects',
  },
];

// Recent activity (placeholder)
const recentActivity = ref([
  {
    id: 1,
    type: 'asset',
    action: 'created',
    description: 'New laptop registered',
    user: 'John Doe',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'maintenance',
    action: 'completed',
    description: 'Printer repair completed',
    user: 'Jane Smith',
    time: '4 hours ago',
  },
  {
    id: 3,
    type: 'stock',
    action: 'issued',
    description: '10 USB cables issued',
    user: 'Mike Johnson',
    time: '1 day ago',
  },
]);

onMounted(async () => {
  try {
    if (authStore.tenantId) {
      assetStore.initialize(authStore.tenantId);
      
      // Fetch asset statistics
      const assetStats = await assetStore.getStatistics();
      if (assetStats) {
        stats.value.totalAssets = assetStats.total;
        stats.value.assetsInUse = assetStats.byStatus.in_use || 0;
        stats.value.assetsAvailable = assetStats.byStatus.available || 0;
        stats.value.assetsUnderMaintenance = assetStats.byStatus.under_maintenance || 0;
      }
    }
  } finally {
    isLoading.value = false;
  }
});

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <p class="text-muted-foreground">
        Welcome back, {{ authStore.userName }}. Here's what's happening.
      </p>
    </div>

    <!-- Stats grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Total Assets -->
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Total Assets</span>
          <Package class="h-4 w-4 text-muted-foreground" />
        </div>
        <p class="mt-2 text-2xl font-bold">
          {{ formatNumber(stats.totalAssets) }}
        </p>
        <div class="mt-1 flex items-center gap-2 text-xs">
          <span class="text-green-600">{{ stats.assetsAvailable }} available</span>
          <span class="text-muted-foreground">•</span>
          <span class="text-blue-600">{{ stats.assetsInUse }} in use</span>
        </div>
      </div>

      <!-- Open Tickets -->
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Open Tickets</span>
          <Wrench class="h-4 w-4 text-muted-foreground" />
        </div>
        <p class="mt-2 text-2xl font-bold">
          {{ formatNumber(stats.openTickets) }}
        </p>
        <div v-if="stats.criticalTickets > 0" class="mt-1 flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle class="h-3 w-3" />
          {{ stats.criticalTickets }} critical
        </div>
        <div v-else class="mt-1 text-xs text-muted-foreground">
          All systems operational
        </div>
      </div>

      <!-- Low Stock Alerts -->
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Low Stock Alerts</span>
          <Box class="h-4 w-4 text-muted-foreground" />
        </div>
        <p class="mt-2 text-2xl font-bold">
          {{ formatNumber(stats.lowStockAlerts) }}
        </p>
        <div class="mt-1 text-xs text-muted-foreground">
          Items need restocking
        </div>
      </div>

      <!-- Active Projects -->
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Active Projects</span>
          <FolderKanban class="h-4 w-4 text-muted-foreground" />
        </div>
        <p class="mt-2 text-2xl font-bold">
          {{ formatNumber(stats.activeProjects) }}
        </p>
        <div class="mt-1 text-xs text-muted-foreground">
          Currently in progress
        </div>
      </div>
    </div>

    <!-- Quick actions & Recent activity -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Quick Actions -->
      <div class="rounded-lg border border-border bg-card">
        <div class="border-b border-border px-4 py-3">
          <h2 class="font-semibold">Quick Actions</h2>
        </div>
        <div class="grid gap-2 p-4 sm:grid-cols-2">
          <button
            v-for="action in quickActions"
            :key="action.path"
            class="flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted"
            @click="navigateTo(action.path)"
          >
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <component :is="action.icon" class="h-5 w-5" />
            </div>
            <div>
              <p class="font-medium">{{ action.title }}</p>
              <p class="text-xs text-muted-foreground">{{ action.description }}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="rounded-lg border border-border bg-card">
        <div class="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 class="font-semibold">Recent Activity</h2>
          <button
            class="flex items-center gap-1 text-xs text-primary hover:underline"
            @click="navigateTo('/audit-logs')"
          >
            View all
            <ArrowRight class="h-3 w-3" />
          </button>
        </div>
        <div class="divide-y divide-border">
          <div
            v-for="activity in recentActivity"
            :key="activity.id"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div class="h-2 w-2 rounded-full bg-primary" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm">{{ activity.description }}</p>
              <p class="text-xs text-muted-foreground">
                {{ activity.user }} • {{ activity.time }}
              </p>
            </div>
          </div>
          <div
            v-if="recentActivity.length === 0"
            class="px-4 py-8 text-center text-sm text-muted-foreground"
          >
            No recent activity
          </div>
        </div>
      </div>
    </div>

    <!-- Organization overview -->
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950">
          <Building2 class="h-6 w-6" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ stats.totalOffices }}</p>
          <p class="text-sm text-muted-foreground">Offices</p>
        </div>
      </div>

      <div class="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950">
          <Users class="h-6 w-6" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ stats.totalUsers }}</p>
          <p class="text-sm text-muted-foreground">Users</p>
        </div>
      </div>

      <div class="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950">
          <TrendingUp class="h-6 w-6" />
        </div>
        <div>
          <p class="text-2xl font-bold">98%</p>
          <p class="text-sm text-muted-foreground">Uptime</p>
        </div>
      </div>
    </div>
  </div>
</template>
