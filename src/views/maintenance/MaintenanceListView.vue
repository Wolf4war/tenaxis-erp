<script setup lang="ts">
/* ============================================
   TENAXIS - Maintenance List View
   Service tickets and maintenance tracking
   ============================================ */

import { ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, useUIStore } from '@/stores';
import { usePermission } from '@/composables';
import { useSearch } from '@/composables/useDebounce';
import { maintenanceService } from '@/services';
import { DataTable, Button, Badge, Input, Select } from '@/components/ui';
import { Plus, Filter, AlertCircle, Clock, CheckCircle2 } from 'lucide-vue-next';
import { MAINTENANCE_STATUSES, MAINTENANCE_PRIORITIES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { MaintenanceTicket, MaintenanceStatus, MaintenancePriority } from '@/types';
import type { ColumnDef } from '@tanstack/vue-table';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUIStore();
const { can } = usePermission();

const isLoading = ref(true);
const tickets = ref<MaintenanceTicket[]>([]);
const showFilters = ref(false);

// Filter states
const filters = ref({
  status: '' as MaintenanceStatus | '',
  priority: '' as MaintenancePriority | '',
});

const { searchQuery, debouncedQuery } = useSearch(300);

// Computed tickets with client-side filtering
const filteredTickets = computed(() => {
  let result = [...tickets.value];

  // Apply search
  if (debouncedQuery.value) {
    const query = debouncedQuery.value.toLowerCase();
    result = result.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(query) ||
        ticket.ticket_number?.toLowerCase().includes(query)
    );
  }

  // Apply status filter
  if (filters.value.status) {
    result = result.filter((ticket) => ticket.status === filters.value.status);
  }

  // Apply priority filter
  if (filters.value.priority) {
    result = result.filter((ticket) => ticket.priority === filters.value.priority);
  }

  return result;
});

// Stats
const openCount = computed(() =>
  tickets.value.filter((t) => t.status === 'open' || t.status === 'in_progress').length
);
const criticalCount = computed(() =>
  tickets.value.filter((t) => t.priority === 'critical' && t.status !== 'completed').length
);

// Get status label and variant
const getStatusVariant = (status: MaintenanceStatus) => {
  const variants: Record<MaintenanceStatus, 'default' | 'success' | 'warning' | 'secondary' | 'destructive'> = {
    open: 'default',
    in_progress: 'warning',
    waiting_parts: 'secondary',
    completed: 'success',
    cancelled: 'destructive',
  };
  return variants[status] || 'default';
};

const getStatusLabel = (status: MaintenanceStatus) => {
  const statusObj = MAINTENANCE_STATUSES.find((s) => s.value === status);
  return statusObj?.label || status;
};

// Get priority variant
const getPriorityVariant = (priority: MaintenancePriority) => {
  const variants: Record<MaintenancePriority, 'default' | 'warning' | 'destructive' | 'secondary'> = {
    low: 'secondary',
    medium: 'default',
    high: 'warning',
    critical: 'destructive',
  };
  return variants[priority] || 'default';
};

const getPriorityLabel = (priority: MaintenancePriority) => {
  const priorityObj = MAINTENANCE_PRIORITIES.find((p) => p.value === priority);
  return priorityObj?.label || priority;
};

// Table columns
const columns: ColumnDef<MaintenanceTicket, any>[] = [
  {
    accessorKey: 'ticket_number',
    header: 'Ticket #',
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs' }, row.original.ticket_number || '-'),
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) =>
      h('div', [
        h('p', { class: 'font-medium' }, row.original.title),
        h('p', { class: 'text-xs text-muted-foreground line-clamp-1' }, row.original.description),
      ]),
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) =>
      h(
        Badge,
        { variant: getPriorityVariant(row.original.priority) },
        () => getPriorityLabel(row.original.priority)
      ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(
        Badge,
        { variant: getStatusVariant(row.original.status) },
        () => getStatusLabel(row.original.status)
      ),
  },
  {
    accessorKey: 'reported_at',
    header: 'Reported',
    cell: ({ row }) => formatDate(row.original.reported_at),
  },
];

// Status options
const statusOptions = MAINTENANCE_STATUSES.map((s) => ({
  value: s.value,
  label: s.label,
}));

// Priority options
const priorityOptions = MAINTENANCE_PRIORITIES.map((p) => ({
  value: p.value,
  label: p.label,
}));

onMounted(async () => {
  if (authStore.tenantId) {
    maintenanceService.setTenant(authStore.tenantId);
    await loadTickets();
  }
});

const loadTickets = async () => {
  isLoading.value = true;
  try {
    tickets.value = await maintenanceService.getAll();
  } catch (error) {
    uiStore.showToast({
      type: 'error',
      message: 'Failed to load tickets',
    });
  } finally {
    isLoading.value = false;
  }
};

const createTicket = () => {
  router.push('/maintenance/new');
};

const handleRowClick = (ticket: MaintenanceTicket) => {
  router.push(`/maintenance/${ticket.id}`);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Maintenance</h1>
        <p class="text-muted-foreground">
          Track and manage service requests
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          v-if="can('maintenance', 'create')"
          @click="createTicket"
        >
          <Plus class="h-4 w-4" />
          New Ticket
        </Button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Clock class="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Open Tickets</p>
            <p class="text-2xl font-bold">{{ openCount }}</p>
          </div>
        </div>
      </div>
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
            <AlertCircle class="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Critical</p>
            <p class="text-2xl font-bold">{{ criticalCount }}</p>
          </div>
        </div>
      </div>
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <CheckCircle2 class="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Total Tickets</p>
            <p class="text-2xl font-bold">{{ tickets.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters bar -->
    <div class="flex flex-wrap items-center gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Search tickets..."
        class="max-w-xs"
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
        <label class="mb-1 block text-sm font-medium">Status</label>
        <Select
          v-model="filters.status"
          :options="statusOptions"
          placeholder="All statuses"
        />
      </div>

      <div class="min-w-[180px]">
        <label class="mb-1 block text-sm font-medium">Priority</label>
        <Select
          v-model="filters.priority"
          :options="priorityOptions"
          placeholder="All priorities"
        />
      </div>

      <Button variant="ghost" @click="filters = { status: '', priority: '' }">
        Clear
      </Button>
    </div>

    <!-- Data table -->
    <DataTable
      :columns="columns"
      :data="filteredTickets"
      :loading="isLoading"
      :searchable="false"
      empty-title="No tickets found"
      empty-description="No maintenance tickets to display."
      @row-click="handleRowClick"
    >
      <template #empty-action>
        <Button v-if="can('maintenance', 'create')" @click="createTicket">
          <Plus class="h-4 w-4" />
          New Ticket
        </Button>
      </template>
    </DataTable>
  </div>
</template>
