<script setup lang="ts">
/* ============================================
   TENAXIS - Audit Logs View
   System activity and audit trail
   ============================================ */

import { ref, computed, onMounted, h } from 'vue';
import { useAuthStore, useUIStore } from '@/stores';
import { useSearch } from '@/composables/useDebounce';
import { auditLogService } from '@/services';
import { DataTable, Button, Badge, Input, Select } from '@/components/ui';
import { Filter, Download, RefreshCw } from 'lucide-vue-next';
import { formatDate } from '@/lib/utils';
import type { AuditLog, AuditAction } from '@/types';
import type { ColumnDef } from '@tanstack/vue-table';

const authStore = useAuthStore();
const uiStore = useUIStore();

const isLoading = ref(true);
const logs = ref<AuditLog[]>([]);
const showFilters = ref(false);

// Filter states
const filters = ref({
  action: '' as AuditAction | '',
  entity_type: '',
  user_id: '',
});

const { searchQuery, debouncedQuery } = useSearch(300);

// Period filter
const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
];

const selectedPeriod = ref('last_7_days');

// Computed logs with client-side filtering
const filteredLogs = computed(() => {
  let result = [...logs.value];

  // Apply search
  if (debouncedQuery.value) {
    const query = debouncedQuery.value.toLowerCase();
    result = result.filter(
      (log) =>
        log.entity_type.toLowerCase().includes(query) ||
        log.user_email?.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query)
    );
  }

  // Apply action filter
  if (filters.value.action) {
    result = result.filter((log) => log.action === filters.value.action);
  }

  // Apply entity type filter
  if (filters.value.entity_type) {
    result = result.filter((log) => log.entity_type === filters.value.entity_type);
  }

  return result;
});

// Action options
const actionOptions = [
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'assign', label: 'Assign' },
  { value: 'unassign', label: 'Unassign' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'export', label: 'Export' },
];

// Entity type options
const entityTypeOptions = [
  { value: 'asset', label: 'Asset' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'project', label: 'Project' },
  { value: 'user', label: 'User' },
  { value: 'office', label: 'Office' },
];

// Action badge variant
const getActionVariant = (action: AuditAction) => {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
    create: 'success',
    update: 'default',
    delete: 'destructive',
    login: 'secondary',
    logout: 'secondary',
    assign: 'default',
    unassign: 'warning',
    transfer: 'default',
    export: 'secondary',
  };
  return variants[action] || 'default';
};

// Table columns
const columns: ColumnDef<AuditLog, any>[] = [
  {
    accessorKey: 'created_at',
    header: 'Timestamp',
    cell: ({ row }) => formatDate(row.original.created_at),
  },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }) =>
      h(
        Badge,
        { variant: getActionVariant(row.original.action) },
        () => row.original.action.toUpperCase()
      ),
  },
  {
    accessorKey: 'entity_type',
    header: 'Entity Type',
    cell: ({ row }) =>
      h('span', { class: 'capitalize' }, row.original.entity_type),
  },
  {
    accessorKey: 'entity_id',
    header: 'Entity ID',
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs' }, row.original.entity_id.slice(0, 8) + '...'),
  },
  {
    accessorKey: 'user_email',
    header: 'User',
    cell: ({ row }) => row.original.user_email || 'System',
  },
  {
    accessorKey: 'ip_address',
    header: 'IP Address',
    cell: ({ row }) => row.original.ip_address || '-',
  },
];

onMounted(async () => {
  if (authStore.tenantId) {
    auditLogService.setTenant(authStore.tenantId);
    await loadLogs();
  }
});

const loadLogs = async () => {
  isLoading.value = true;
  try {
    // Calculate date range based on selected period
    const now = new Date();
    let startDate: Date | undefined;

    switch (selectedPeriod.value) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last_7_days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'last_30_days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      default:
        startDate = undefined;
    }

    const result = await auditLogService.getLogs({ page_size: 100, startDate });
    logs.value = result.data;
  } catch (error) {
    uiStore.showToast({
      type: 'error',
      message: 'Failed to load audit logs',
    });
  } finally {
    isLoading.value = false;
  }
};

const exportLogs = () => {
  uiStore.showToast({
    type: 'info',
    message: 'Exporting audit logs...',
  });
  // TODO: Implement export functionality
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Audit Logs</h1>
        <p class="text-muted-foreground">
          Track all system activities and changes
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="loadLogs">
          <RefreshCw class="h-4 w-4" />
          Refresh
        </Button>
        <Button variant="outline" @click="exportLogs">
          <Download class="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>

    <!-- Filters bar -->
    <div class="flex flex-wrap items-center gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Search logs..."
        class="max-w-xs"
      />

      <Select
        v-model="selectedPeriod"
        :options="periodOptions"
        class="w-40"
        @update:model-value="loadLogs"
      />

      <Button
        variant="outline"
        :class="{ 'border-primary': showFilters }"
        @click="showFilters = !showFilters"
      >
        <Filter class="h-4 w-4" />
        Filters
      </Button>
    </div>

    <!-- Expanded filters -->
    <div
      v-if="showFilters"
      class="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-muted/30 p-4"
    >
      <div class="min-w-[180px]">
        <label class="mb-1 block text-sm font-medium">Action</label>
        <Select
          v-model="filters.action"
          :options="actionOptions"
          placeholder="All actions"
        />
      </div>

      <div class="min-w-[180px]">
        <label class="mb-1 block text-sm font-medium">Entity Type</label>
        <Select
          v-model="filters.entity_type"
          :options="entityTypeOptions"
          placeholder="All types"
        />
      </div>

      <div class="flex gap-2">
        <Button @click="loadLogs">Apply</Button>
        <Button
          variant="ghost"
          @click="filters = { action: '', entity_type: '', user_id: '' }; loadLogs()"
        >
          Clear
        </Button>
      </div>
    </div>

    <!-- Data table -->
    <DataTable
      :columns="columns"
      :data="filteredLogs"
      :loading="isLoading"
      :searchable="false"
      :page-size="20"
      empty-title="No logs found"
      empty-description="No audit logs match your criteria."
    />
  </div>
</template>
