<script setup lang="ts">
/* ============================================
   TENAXIS - Stock List View
   Consumables and inventory management
   ============================================ */

import { ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, useUIStore } from '@/stores';
import { usePermission } from '@/composables';
import { useSearch } from '@/composables/useDebounce';
import { consumableService } from '@/services';
import { DataTable, Button, Badge, Input, Select } from '@/components/ui';
import { Plus, Filter, AlertTriangle, Package } from 'lucide-vue-next';
import { CONSUMABLE_STATUSES, CONSUMABLE_CATEGORIES } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import type { Consumable } from '@/types';
import type { ColumnDef } from '@tanstack/vue-table';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUIStore();
const { can } = usePermission();

const isLoading = ref(true);
const consumables = ref<Consumable[]>([]);
const showFilters = ref(false);

// Filter states
const filters = ref({
  status: '' as 'active' | 'discontinued' | '',
  category_id: '',
});

const { searchQuery, debouncedQuery } = useSearch(300);

// Computed consumables with client-side filtering
const filteredConsumables = computed(() => {
  let result = [...consumables.value];

  // Apply search
  if (debouncedQuery.value) {
    const query = debouncedQuery.value.toLowerCase();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query)
    );
  }

  // Apply status filter
  if (filters.value.status) {
    result = result.filter((item) => item.status === filters.value.status);
  }

  // Apply category filter
  if (filters.value.category_id) {
    result = result.filter((item) => item.category_id === filters.value.category_id);
  }

  return result;
});

// Low stock count - based on minimum_stock threshold
const lowStockCount = computed(() =>
  consumables.value.filter((item) => (item as any).current_quantity <= item.minimum_stock).length
);

// Status options
const statusOptions = CONSUMABLE_STATUSES.map((s) => ({
  value: s.value,
  label: s.label,
}));

const categoryOptions = CONSUMABLE_CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
}));

// Get status label
const getStatusLabel = (status: 'active' | 'discontinued') => {
  const statusObj = CONSUMABLE_STATUSES.find((s) => s.value === status);
  return statusObj?.label || status;
};

// Table columns
const columns: ColumnDef<Consumable, any>[] = [
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs' }, row.original.sku || '-'),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) =>
      h('div', [
        h('p', { class: 'font-medium' }, row.original.name),
        h('p', { class: 'text-xs text-muted-foreground' }, row.original.brand || 'No brand'),
      ]),
  },
  {
    accessorKey: 'unit',
    header: 'Unit',
    cell: ({ row }) => row.original.unit || '-',
  },
  {
    accessorKey: 'minimum_stock',
    header: 'Min Stock',
    cell: ({ row }) => formatNumber(row.original.minimum_stock),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(
        Badge,
        { variant: row.original.status === 'active' ? 'success' : 'secondary' },
        () => getStatusLabel(row.original.status)
      ),
  },
];

onMounted(async () => {
  if (authStore.tenantId) {
    consumableService.setTenant(authStore.tenantId);
    await loadConsumables();
  }
});

const loadConsumables = async () => {
  isLoading.value = true;
  try {
    consumables.value = await consumableService.getAll();
  } catch (error) {
    uiStore.showToast({
      type: 'error',
      message: 'Failed to load consumables',
    });
  } finally {
    isLoading.value = false;
  }
};

const createConsumable = () => {
  router.push('/consumables/new');
};

const handleRowClick = (item: Consumable) => {
  router.push(`/consumables/${item.id}`);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Stock & Consumables</h1>
        <p class="text-muted-foreground">
          Manage inventory and consumable items
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          v-if="can('consumables', 'create')"
          @click="createConsumable"
        >
          <Plus class="h-4 w-4" />
          Add Item
        </Button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Package class="h-5 w-5 text-primary" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Total Items</p>
            <p class="text-2xl font-bold">{{ formatNumber(consumables.length) }}</p>
          </div>
        </div>
      </div>
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
            <AlertTriangle class="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Low Stock</p>
            <p class="text-2xl font-bold">{{ formatNumber(lowStockCount) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters bar -->
    <div class="flex flex-wrap items-center gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Search by name or SKU..."
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
        <label class="mb-1 block text-sm font-medium">Category</label>
        <Select
          v-model="filters.category_id"
          :options="categoryOptions"
          placeholder="All categories"
        />
      </div>

      <Button variant="ghost" @click="filters = { status: '', category_id: '' }">
        Clear
      </Button>
    </div>

    <!-- Data table -->
    <DataTable
      :columns="columns"
      :data="filteredConsumables"
      :loading="isLoading"
      :searchable="false"
      empty-title="No consumables found"
      empty-description="Get started by adding your first consumable item."
      @row-click="handleRowClick"
    >
      <template #empty-action>
        <Button v-if="can('consumables', 'create')" @click="createConsumable">
          <Plus class="h-4 w-4" />
          Add Item
        </Button>
      </template>
    </DataTable>
  </div>
</template>
