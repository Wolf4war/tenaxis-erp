<script setup lang="ts">
/* ============================================
   TENAXIS - Reports View
   Reporting and analytics dashboard
   ============================================ */

import { ref, onMounted } from 'vue';
import { useAuthStore, useAssetStore, useUIStore } from '@/stores';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Select,
  Spinner,
} from '@/components/ui';
import {
  Download,
  FileText,
  Package,
  Wrench,
  Box,
  FolderKanban,
  TrendingUp,
  PieChart,
  BarChart3,
} from 'lucide-vue-next';
import { formatNumber } from '@/lib/utils';

const authStore = useAuthStore();
const assetStore = useAssetStore();
const uiStore = useUIStore();

const isLoading = ref(true);

// Report period options
const periodOptions = [
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all_time', label: 'All Time' },
];

const selectedPeriod = ref('last_30_days');

// Statistics
const stats = ref({
  assets: {
    total: 0,
    available: 0,
    in_use: 0,
    under_maintenance: 0,
    total_value: 0,
  },
  maintenance: {
    open_tickets: 0,
    closed_tickets: 0,
    avg_resolution_time: 0,
  },
  consumables: {
    total_items: 0,
    low_stock: 0,
    out_of_stock: 0,
  },
  projects: {
    active: 0,
    completed: 0,
    total_budget: 0,
  },
});

// Report types available
const reportTypes = [
  {
    id: 'asset_summary',
    title: 'Asset Summary Report',
    description: 'Overview of all assets by status, category, and location',
    icon: Package,
  },
  {
    id: 'asset_valuation',
    title: 'Asset Valuation Report',
    description: 'Financial summary of asset values and depreciation',
    icon: TrendingUp,
  },
  {
    id: 'maintenance_report',
    title: 'Maintenance Report',
    description: 'Ticket resolution times, costs, and trends',
    icon: Wrench,
  },
  {
    id: 'inventory_report',
    title: 'Inventory Report',
    description: 'Stock levels, usage patterns, and reorder analysis',
    icon: Box,
  },
  {
    id: 'project_report',
    title: 'Project Status Report',
    description: 'Project progress, budgets, and timelines',
    icon: FolderKanban,
  },
  {
    id: 'audit_report',
    title: 'Audit Trail Report',
    description: 'System activity and user actions log',
    icon: FileText,
  },
];

onMounted(async () => {
  if (authStore.tenantId) {
    assetStore.initialize(authStore.tenantId);
    await loadStatistics();
  }
});

const loadStatistics = async () => {
  isLoading.value = true;
  try {
    // Load asset statistics
    const assetStats = await assetStore.getStatistics();
    if (assetStats) {
      stats.value.assets.total = assetStats.total;
      stats.value.assets.available = assetStats.byStatus.available || 0;
      stats.value.assets.in_use = assetStats.byStatus.in_use || 0;
      stats.value.assets.under_maintenance = assetStats.byStatus.under_maintenance || 0;
    }
  } finally {
    isLoading.value = false;
  }
};

const generateReport = (reportId: string) => {
  uiStore.showToast({
    type: 'info',
    message: `Generating ${reportId.replace(/_/g, ' ')}...`,
  });
  // TODO: Implement actual report generation
};

const exportReport = (_reportId: string, format: 'pdf' | 'csv' | 'xlsx') => {
  uiStore.showToast({
    type: 'info',
    message: `Exporting as ${format.toUpperCase()}...`,
  });
  // TODO: Implement actual export functionality
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Reports</h1>
        <p class="text-muted-foreground">
          Analytics and reporting dashboard
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Select
          v-model="selectedPeriod"
          :options="periodOptions"
          class="w-40"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex h-64 items-center justify-center">
      <Spinner size="lg" />
    </div>

    <template v-else>
      <!-- Quick Stats -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">Total Assets</p>
                <p class="text-2xl font-bold">{{ formatNumber(stats.assets.total) }}</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950">
                <Package class="h-6 w-6" />
              </div>
            </div>
            <div class="mt-3 flex gap-2 text-xs">
              <span class="text-green-600">{{ stats.assets.available }} available</span>
              <span class="text-muted-foreground">•</span>
              <span class="text-blue-600">{{ stats.assets.in_use }} in use</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">Open Tickets</p>
                <p class="text-2xl font-bold">{{ formatNumber(stats.maintenance.open_tickets) }}</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-950">
                <Wrench class="h-6 w-6" />
              </div>
            </div>
            <div class="mt-3 text-xs text-muted-foreground">
              {{ stats.maintenance.closed_tickets }} resolved this period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">Low Stock Items</p>
                <p class="text-2xl font-bold">{{ formatNumber(stats.consumables.low_stock) }}</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950">
                <Box class="h-6 w-6" />
              </div>
            </div>
            <div class="mt-3 text-xs text-muted-foreground">
              {{ stats.consumables.out_of_stock }} out of stock
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-muted-foreground">Active Projects</p>
                <p class="text-2xl font-bold">{{ formatNumber(stats.projects.active) }}</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950">
                <FolderKanban class="h-6 w-6" />
              </div>
            </div>
            <div class="mt-3 text-xs text-muted-foreground">
              {{ stats.projects.completed }} completed this period
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Charts placeholder -->
      <div class="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Distribution</CardTitle>
            <CardDescription>Assets by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex h-64 items-center justify-center text-muted-foreground">
              <div class="text-center">
                <PieChart class="mx-auto h-12 w-12 mb-2" />
                <p class="text-sm">Chart visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Trends</CardTitle>
            <CardDescription>Tickets over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex h-64 items-center justify-center text-muted-foreground">
              <div class="text-center">
                <BarChart3 class="mx-auto h-12 w-12 mb-2" />
                <p class="text-sm">Chart visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Available Reports -->
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Generate and export detailed reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="report in reportTypes"
              :key="report.id"
              class="rounded-lg border border-border p-4"
            >
              <div class="flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <component :is="report.icon" class="h-5 w-5 text-muted-foreground" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-medium">{{ report.title }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">{{ report.description }}</p>
                </div>
              </div>
              <div class="mt-4 flex gap-2">
                <Button size="sm" variant="outline" @click="generateReport(report.id)">
                  View
                </Button>
                <Button size="sm" variant="ghost" @click="exportReport(report.id, 'pdf')">
                  <Download class="h-3 w-3" />
                  PDF
                </Button>
                <Button size="sm" variant="ghost" @click="exportReport(report.id, 'csv')">
                  <Download class="h-3 w-3" />
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
