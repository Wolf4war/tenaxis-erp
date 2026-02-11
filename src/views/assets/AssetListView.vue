<script setup lang="ts">
/* ============================================
   TENAXIS - Asset List View
   Main asset registry with table and filters
   ============================================ */

import { ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { useAssetStore, useAuthStore } from '@/stores';
import { usePermission, useSearch } from '@/composables';
import { DataTable, Button, Badge, Input, Select, Dropdown, DropdownItem } from '@/components/ui';
import { Plus, Filter, Download, MoreVertical, Eye, Edit, Trash2 } from 'lucide-vue-next';
import { ASSET_STATUSES, ASSET_CONDITIONS } from '@/lib/constants';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Asset, AssetStatus, AssetCondition } from '@/types';
import type { ColumnDef } from '@tanstack/vue-table';

const router = useRouter();
const assetStore = useAssetStore();
const authStore = useAuthStore();
const { can } = usePermission();

// Search
const { searchQuery, debouncedQuery } = useSearch(300);

const isLoading = ref(true);
const showFilters = ref(false);

// Filter states
const filters = ref({
  status: '' as AssetStatus | '',
  condition: '' as AssetCondition | '',
  office_id: '',
});

// Computed assets with client-side filtering
const filteredAssets = computed(() => {
  let result = [...assetStore.assets];

  // Apply search
  if (debouncedQuery.value) {
    const query = debouncedQuery.value.toLowerCase();
    result = result.filter(
      (asset) =>
        asset.name.toLowerCase().includes(query) ||
        asset.asset_tag?.toLowerCase().includes(query) ||
        asset.serial_number?.toLowerCase().includes(query)
    );
  }

  // Apply status filter
  if (filters.value.status) {
    result = result.filter((asset) => asset.status === filters.value.status);
  }

  // Apply condition filter
  if (filters.value.condition) {
    result = result.filter((asset) => asset.condition === filters.value.condition);
  }

  return result;
});

// Status options for select
const statusOptions = ASSET_STATUSES.map((s) => ({
  value: s.value,
  label: s.label,
}));

const conditionOptions = ASSET_CONDITIONS.map((c) => ({
  value: c.value,
  label: c.label,
}));

// Get status label
const getStatusLabel = (status: AssetStatus): string => {
  const found = ASSET_STATUSES.find((s) => s.value === status);
  return found?.label || status;
};

// Get condition label
const getConditionLabel = (condition: AssetCondition): string => {
  const found = ASSET_CONDITIONS.find((c) => c.value === condition);
  return found?.label || condition;
};

// Status badge variant mapper
const getStatusVariant = (status: AssetStatus): 'success' | 'default' | 'warning' | 'destructive' | 'secondary' => {
  const variants: Record<string, 'success' | 'default' | 'warning' | 'destructive' | 'secondary'> = {
    available: 'success',
    in_use: 'default',
    under_maintenance: 'warning',
    lost: 'destructive',
    disposed: 'secondary',
    reserved: 'secondary',
  };
  return variants[status] || 'default';
};

// Table columns
const columns: ColumnDef<Asset, any>[] = [
  {
    accessorKey: 'asset_tag',
    header: 'Asset Tag',
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs' }, row.original.asset_tag || '-'),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) =>
      h('div', [
        h('p', { class: 'font-medium' }, row.original.name),
        row.original.brand &&
          h('p', { class: 'text-xs text-muted-foreground' }, `${row.original.brand} ${row.original.model || ''}`),
      ]),
  },
  {
    accessorKey: 'condition',
    header: 'Condition',
    cell: ({ row }) => getConditionLabel(row.original.condition),
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
    accessorKey: 'purchase_price',
    header: 'Value',
    cell: ({ row }) =>
      row.original.purchase_price
        ? formatCurrency(row.original.purchase_price, row.original.currency)
        : '-',
  },
  {
    accessorKey: 'purchase_date',
    header: 'Purchased',
    cell: ({ row }) =>
      row.original.purchase_date
        ? formatDate(row.original.purchase_date as any)
        : '-',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) =>
      h(
        Dropdown,
        { align: 'right' },
        {
          trigger: () =>
            h(
              'button',
              { class: 'rounded-md p-1 hover:bg-muted' },
              h(MoreVertical, { class: 'h-4 w-4' })
            ),
          default: ({ close }: { close: () => void }) => [
            h(
              DropdownItem,
              {
                onClick: () => {
                  close();
                  viewAsset(row.original.id!);
                },
              },
              () => [h(Eye, { class: 'h-4 w-4' }), 'View']
            ),
            can('assets', 'update') &&
              h(
                DropdownItem,
                {
                  onClick: () => {
                    close();
                    editAsset(row.original.id!);
                  },
                },
                () => [h(Edit, { class: 'h-4 w-4' }), 'Edit']
              ),
            can('assets', 'delete') &&
              h(
                DropdownItem,
                {
                  destructive: true,
                  onClick: () => {
                    close();
                    deleteAsset(row.original);
                  },
                },
                () => [h(Trash2, { class: 'h-4 w-4' }), 'Delete']
              ),
          ],
        }
      ),
  },
];

onMounted(async () => {
  if (authStore.tenantId) {
    assetStore.initialize(authStore.tenantId);
    await loadAssets();
  }
});

const loadAssets = async () => {
  isLoading.value = true;
  try {
    const assetFilters: Record<string, any> = {};
    if (filters.value.status) assetFilters.status = filters.value.status;
    if (filters.value.condition) assetFilters.condition = filters.value.condition;
    if (filters.value.office_id) assetFilters.office_id = filters.value.office_id;

    await assetStore.fetchAssets(assetFilters);
  } finally {
    isLoading.value = false;
  }
};

const createAsset = () => {
  router.push('/assets/new');
};

const viewAsset = (id: string) => {
  router.push(`/assets/${id}`);
};

const editAsset = (id: string) => {
  router.push(`/assets/${id}/edit`);
};

const deleteAsset = async (asset: Asset) => {
  if (confirm(`Are you sure you want to dispose "${asset.name}"?`)) {
    await assetStore.disposeAsset(asset.id!, 'User requested deletion');
  }
};

const clearFilters = () => {
  filters.value = {
    status: '',
    condition: '',
    office_id: '',
  };
  loadAssets();
};

const handleRowClick = (asset: Asset) => {
  viewAsset(asset.id!);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Assets</h1>
        <p class="text-muted-foreground">
          Manage your organization's asset registry
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          v-if="can('assets', 'create')"
          @click="createAsset"
        >
          <Plus class="h-4 w-4" />
          Add Asset
        </Button>
      </div>
    </div>

    <!-- Filters bar -->
    <div class="flex flex-wrap items-center gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Search by name, tag, or serial..."
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

      <Button variant="outline" @click="loadAssets">
        <Download class="h-4 w-4" />
        Export
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
        <label class="mb-1 block text-sm font-medium">Condition</label>
        <Select
          v-model="filters.condition"
          :options="conditionOptions"
          placeholder="All conditions"
        />
      </div>

      <div class="flex gap-2">
        <Button @click="loadAssets">Apply</Button>
        <Button variant="ghost" @click="clearFilters">Clear</Button>
      </div>
    </div>

    <!-- Data table -->
    <DataTable
      :columns="columns"
      :data="filteredAssets"
      :loading="isLoading"
      :searchable="false"
      empty-title="No assets found"
      empty-description="Get started by adding your first asset."
      @row-click="handleRowClick"
    >
      <template #empty-action>
        <Button v-if="can('assets', 'create')" @click="createAsset">
          <Plus class="h-4 w-4" />
          Add Asset
        </Button>
      </template>
    </DataTable>
  </div>
</template>
