<script setup lang="ts">
/* ============================================
   TENAXIS - Users List View
   User management
   ============================================ */

import { ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, useUIStore } from '@/stores';
import { usePermission } from '@/composables';
import { useSearch } from '@/composables/useDebounce';
import { userService } from '@/services';
import { DataTable, Button, Badge, Avatar, Input, Select, Dropdown, DropdownItem } from '@/components/ui';
import { MoreVertical, Eye, Edit, UserPlus } from 'lucide-vue-next';
import { USER_ROLES, USER_STATUSES } from '@/lib/constants';
import type { User, UserRole } from '@/types';
import type { ColumnDef } from '@tanstack/vue-table';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUIStore();
const { can } = usePermission();

const isLoading = ref(true);
const users = ref<User[]>([]);
const showFilters = ref(false);

// Filter states
const filters = ref({
  role: '' as UserRole | '',
  status: '' as 'active' | 'inactive' | 'pending' | '',
});

const { searchQuery, debouncedQuery } = useSearch(300);

// Computed users with client-side filtering
const filteredUsers = computed(() => {
  let result = [...users.value];

  // Apply search
  if (debouncedQuery.value) {
    const query = debouncedQuery.value.toLowerCase();
    result = result.filter(
      (user) =>
        user.display_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }

  // Apply role filter
  if (filters.value.role) {
    result = result.filter((user) => user.role === filters.value.role);
  }

  // Apply status filter
  if (filters.value.status) {
    result = result.filter((user) => user.status === filters.value.status);
  }

  return result;
});

// Get role label
const getRoleLabel = (role: UserRole) => {
  const roleObj = USER_ROLES.find((r) => r.value === role);
  return roleObj?.label || role;
};

// Get status label and variant
const getStatusVariant = (status: 'active' | 'inactive' | 'pending') => {
  const variants: Record<string, 'success' | 'secondary' | 'warning'> = {
    active: 'success',
    inactive: 'secondary',
    pending: 'warning',
  };
  return variants[status] || 'secondary';
};

const getStatusLabel = (status: 'active' | 'inactive' | 'pending') => {
  const statusObj = USER_STATUSES.find((s) => s.value === status);
  return statusObj?.label || status;
};

// Role badge variant
const getRoleVariant = (role: UserRole) => {
  if (role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') return 'destructive';
  if (role === 'ORG_ADMIN' || role === 'IT_ADMIN') return 'default';
  return 'secondary';
};

// Table columns
const columns: ColumnDef<User, any>[] = [
  {
    accessorKey: 'display_name',
    header: 'User',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h(Avatar, {
          src: row.original.avatar_url,
          fallback: row.original.display_name.charAt(0).toUpperCase(),
          size: 'sm',
        }),
        h('div', [
          h('p', { class: 'font-medium' }, row.original.display_name),
          h('p', { class: 'text-xs text-muted-foreground' }, row.original.email),
        ]),
      ]),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) =>
      h(
        Badge,
        { variant: getRoleVariant(row.original.role) },
        () => getRoleLabel(row.original.role)
      ),
  },
  {
    accessorKey: 'job_title',
    header: 'Job Title',
    cell: ({ row }) => row.original.job_title || '-',
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
                  viewUser(row.original.id!);
                },
              },
              () => [h(Eye, { class: 'h-4 w-4' }), 'View']
            ),
            can('users', 'update') &&
              h(
                DropdownItem,
                {
                  onClick: () => {
                    close();
                    editUser(row.original.id!);
                  },
                },
                () => [h(Edit, { class: 'h-4 w-4' }), 'Edit']
              ),
          ],
        }
      ),
  },
];

// Status options
const statusOptions = USER_STATUSES.map((s) => ({
  value: s.value,
  label: s.label,
}));

// Role options
const roleOptions = USER_ROLES.map((r) => ({
  value: r.value,
  label: r.label,
}));

onMounted(async () => {
  if (authStore.tenantId) {
    userService.setTenant(authStore.tenantId);
    await loadUsers();
  }
});

const loadUsers = async () => {
  isLoading.value = true;
  try {
    users.value = await userService.getAll();
  } catch (error) {
    uiStore.showToast({
      type: 'error',
      message: 'Failed to load users',
    });
  } finally {
    isLoading.value = false;
  }
};

const createUser = () => {
  router.push('/users/new');
};

const viewUser = (id: string) => {
  router.push(`/users/${id}`);
};

const editUser = (id: string) => {
  router.push(`/users/${id}/edit`);
};

const handleRowClick = (user: User) => {
  viewUser(user.id!);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Users</h1>
        <p class="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          v-if="can('users', 'create')"
          @click="createUser"
        >
          <UserPlus class="h-4 w-4" />
          Add User
        </Button>
      </div>
    </div>

    <!-- Filters bar -->
    <div class="flex flex-wrap items-center gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Search by name or email..."
        class="max-w-xs"
      />

      <Button
        variant="outline"
        :class="{ 'border-primary': showFilters }"
        @click="showFilters = !showFilters"
      >
        Filter
      </Button>
    </div>

    <!-- Expanded filters -->
    <div
      v-if="showFilters"
      class="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-muted/30 p-4"
    >
      <div class="min-w-[180px]">
        <label class="mb-1 block text-sm font-medium">Role</label>
        <Select
          v-model="filters.role"
          :options="roleOptions"
          placeholder="All roles"
        />
      </div>

      <div class="min-w-[180px]">
        <label class="mb-1 block text-sm font-medium">Status</label>
        <Select
          v-model="filters.status"
          :options="statusOptions"
          placeholder="All statuses"
        />
      </div>

      <Button variant="ghost" @click="filters = { role: '', status: '' }">
        Clear
      </Button>
    </div>

    <!-- Data table -->
    <DataTable
      :columns="columns"
      :data="filteredUsers"
      :loading="isLoading"
      :searchable="false"
      empty-title="No users found"
      empty-description="Get started by inviting your first user."
      @row-click="handleRowClick"
    >
      <template #empty-action>
        <Button v-if="can('users', 'create')" @click="createUser">
          <UserPlus class="h-4 w-4" />
          Add User
        </Button>
      </template>
    </DataTable>
  </div>
</template>
