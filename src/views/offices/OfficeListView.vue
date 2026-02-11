<script setup lang="ts">
/* ============================================
   TENAXIS - Offices List View
   Office/location management
   ============================================ */

import { ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, useUIStore } from '@/stores';
import { usePermission } from '@/composables';
import { useSearch } from '@/composables/useDebounce';
import { officeService } from '@/services';
import { DataTable, Button, Badge, Input, Dropdown, DropdownItem } from '@/components/ui';
import { Plus, MoreVertical, Eye, Edit, Building2, MapPin } from 'lucide-vue-next';
import { OFFICE_STATUSES } from '@/lib/constants';
import type { Office, OfficeStatus } from '@/types';
import type { ColumnDef } from '@tanstack/vue-table';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUIStore();
const { can } = usePermission();

const isLoading = ref(true);
const offices = ref<Office[]>([]);

const { searchQuery, debouncedQuery } = useSearch(300);

// Computed offices with client-side filtering
const filteredOffices = computed(() => {
  let result = [...offices.value];

  if (debouncedQuery.value) {
    const query = debouncedQuery.value.toLowerCase();
    result = result.filter(
      (office) =>
        office.name.toLowerCase().includes(query) ||
        office.code?.toLowerCase().includes(query) ||
        office.address?.city?.toLowerCase().includes(query)
    );
  }

  return result;
});

// Status badge variant
const getStatusVariant = (status: OfficeStatus) => {
  const variants: Record<OfficeStatus, 'success' | 'secondary'> = {
    active: 'success',
    inactive: 'secondary',
  };
  return variants[status] || 'secondary';
};

// Get status label
const getStatusLabel = (status: OfficeStatus) => {
  const statusObj = OFFICE_STATUSES.find((s) => s.value === status);
  return statusObj?.label || status;
};

// Table columns
const columns: ColumnDef<Office, any>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs' }, row.original.code || '-'),
  },
  {
    accessorKey: 'name',
    header: 'Office Name',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h('div', { class: 'flex h-8 w-8 items-center justify-center rounded-lg bg-muted' }, [
          h(Building2, { class: 'h-4 w-4 text-muted-foreground' }),
        ]),
        h('div', [
          h('p', { class: 'font-medium' }, row.original.name),
          row.original.address?.city &&
            h('p', { class: 'text-xs text-muted-foreground flex items-center gap-1' }, [
              h(MapPin, { class: 'h-3 w-3' }),
              `${row.original.address.city}${row.original.address.country ? ', ' + row.original.address.country : ''}`,
            ]),
        ]),
      ]),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) =>
      h('span', { class: 'capitalize' }, row.original.type.replace('_', ' ')),
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
                  viewOffice(row.original.id!);
                },
              },
              () => [h(Eye, { class: 'h-4 w-4' }), 'View']
            ),
            can('offices', 'update') &&
              h(
                DropdownItem,
                {
                  onClick: () => {
                    close();
                    editOffice(row.original.id!);
                  },
                },
                () => [h(Edit, { class: 'h-4 w-4' }), 'Edit']
              ),
          ],
        }
      ),
  },
];

onMounted(async () => {
  if (authStore.tenantId) {
    officeService.setTenant(authStore.tenantId);
    await loadOffices();
  }
});

const loadOffices = async () => {
  isLoading.value = true;
  try {
    offices.value = await officeService.getAll();
  } catch (error) {
    uiStore.showToast({
      type: 'error',
      message: 'Failed to load offices',
    });
  } finally {
    isLoading.value = false;
  }
};

const createOffice = () => {
  router.push('/offices/new');
};

const viewOffice = (id: string) => {
  router.push(`/offices/${id}`);
};

const editOffice = (id: string) => {
  router.push(`/offices/${id}/edit`);
};

const handleRowClick = (office: Office) => {
  viewOffice(office.id!);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Offices</h1>
        <p class="text-muted-foreground">
          Manage your organization's offices and locations
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          v-if="can('offices', 'create')"
          @click="createOffice"
        >
          <Plus class="h-4 w-4" />
          Add Office
        </Button>
      </div>
    </div>

    <!-- Search bar -->
    <div class="flex items-center gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Search by name, code, or city..."
        class="max-w-xs"
      />
    </div>

    <!-- Data table -->
    <DataTable
      :columns="columns"
      :data="filteredOffices"
      :loading="isLoading"
      :searchable="false"
      empty-title="No offices found"
      empty-description="Get started by adding your first office."
      @row-click="handleRowClick"
    >
      <template #empty-action>
        <Button v-if="can('offices', 'create')" @click="createOffice">
          <Plus class="h-4 w-4" />
          Add Office
        </Button>
      </template>
    </DataTable>
  </div>
</template>
