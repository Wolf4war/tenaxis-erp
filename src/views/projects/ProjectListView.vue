<script setup lang="ts">
/* ============================================
   TENAXIS - Projects List View
   Project management
   ============================================ */

import { ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, useUIStore } from '@/stores';
import { usePermission } from '@/composables';
import { useSearch } from '@/composables/useDebounce';
import { projectService } from '@/services';
import { DataTable, Button, Badge, Input, Select } from '@/components/ui';
import { Plus, Filter, FolderKanban, Calendar } from 'lucide-vue-next';
import { PROJECT_STATUSES, PROJECT_TYPES } from '@/lib/constants';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Project, ProjectStatus, ProjectType } from '@/types';
import type { ColumnDef } from '@tanstack/vue-table';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUIStore();
const { can } = usePermission();

const isLoading = ref(true);
const projects = ref<Project[]>([]);
const showFilters = ref(false);

// Filter states
const filters = ref({
  status: '' as ProjectStatus | '',
  type: '' as ProjectType | '',
});

const { searchQuery, debouncedQuery } = useSearch(300);

// Computed projects with client-side filtering
const filteredProjects = computed(() => {
  let result = [...projects.value];

  // Apply search
  if (debouncedQuery.value) {
    const query = debouncedQuery.value.toLowerCase();
    result = result.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.project_number?.toLowerCase().includes(query)
    );
  }

  // Apply status filter
  if (filters.value.status) {
    result = result.filter((project) => project.status === filters.value.status);
  }

  // Apply type filter
  if (filters.value.type) {
    result = result.filter((project) => project.type === filters.value.type);
  }

  return result;
});

// Stats
const activeCount = computed(() =>
  projects.value.filter((p) => p.status === 'in_progress').length
);

// Get status variant
const getStatusVariant = (status: ProjectStatus) => {
  const variants: Record<ProjectStatus, 'default' | 'success' | 'warning' | 'secondary' | 'destructive'> = {
    planning: 'secondary',
    in_progress: 'default',
    on_hold: 'warning',
    completed: 'success',
    cancelled: 'destructive',
  };
  return variants[status] || 'default';
};

const getStatusLabel = (status: ProjectStatus) => {
  const statusObj = PROJECT_STATUSES.find((s) => s.value === status);
  return statusObj?.label || status;
};

const getTypeLabel = (type: ProjectType) => {
  const typeObj = PROJECT_TYPES.find((t) => t.value === type);
  return typeObj?.label || type;
};

// Table columns
const columns: ColumnDef<Project, any>[] = [
  {
    accessorKey: 'project_number',
    header: 'Project #',
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs' }, row.original.project_number || '-'),
  },
  {
    accessorKey: 'name',
    header: 'Project',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h('div', { class: 'flex h-8 w-8 items-center justify-center rounded-lg bg-muted' }, [
          h(FolderKanban, { class: 'h-4 w-4 text-muted-foreground' }),
        ]),
        h('div', [
          h('p', { class: 'font-medium' }, row.original.name),
          h('p', { class: 'text-xs text-muted-foreground' }, getTypeLabel(row.original.type)),
        ]),
      ]),
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
    accessorKey: 'progress_percentage',
    header: 'Progress',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h('div', { class: 'h-2 w-24 rounded-full bg-muted overflow-hidden' }, [
          h('div', {
            class: 'h-full bg-primary transition-all',
            style: { width: `${row.original.progress_percentage}%` },
          }),
        ]),
        h('span', { class: 'text-sm text-muted-foreground' }, `${row.original.progress_percentage}%`),
      ]),
  },
  {
    accessorKey: 'budget',
    header: 'Budget',
    cell: ({ row }) => formatCurrency(row.original.budget, row.original.currency),
  },
  {
    accessorKey: 'planned_end_date',
    header: 'Due Date',
    cell: ({ row }) =>
      row.original.planned_end_date ? formatDate(row.original.planned_end_date) : '-',
  },
];

// Status options
const statusOptions = PROJECT_STATUSES.map((s) => ({
  value: s.value,
  label: s.label,
}));

// Type options
const typeOptions = PROJECT_TYPES.map((t) => ({
  value: t.value,
  label: t.label,
}));

onMounted(async () => {
  if (authStore.tenantId) {
    projectService.setTenant(authStore.tenantId);
    await loadProjects();
  }
});

const loadProjects = async () => {
  isLoading.value = true;
  try {
    projects.value = await projectService.getAll();
  } catch (error) {
    uiStore.showToast({
      type: 'error',
      message: 'Failed to load projects',
    });
  } finally {
    isLoading.value = false;
  }
};

const createProject = () => {
  router.push('/projects/new');
};

const handleRowClick = (project: Project) => {
  router.push(`/projects/${project.id}`);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Projects</h1>
        <p class="text-muted-foreground">
          Track and manage projects
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          v-if="can('projects', 'create')"
          @click="createProject"
        >
          <Plus class="h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FolderKanban class="h-5 w-5 text-primary" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Total Projects</p>
            <p class="text-2xl font-bold">{{ projects.length }}</p>
          </div>
        </div>
      </div>
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Calendar class="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Active</p>
            <p class="text-2xl font-bold">{{ activeCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters bar -->
    <div class="flex flex-wrap items-center gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Search projects..."
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
        <label class="mb-1 block text-sm font-medium">Type</label>
        <Select
          v-model="filters.type"
          :options="typeOptions"
          placeholder="All types"
        />
      </div>

      <Button variant="ghost" @click="filters = { status: '', type: '' }">
        Clear
      </Button>
    </div>

    <!-- Data table -->
    <DataTable
      :columns="columns"
      :data="filteredProjects"
      :loading="isLoading"
      :searchable="false"
      empty-title="No projects found"
      empty-description="Get started by creating your first project."
      @row-click="handleRowClick"
    >
      <template #empty-action>
        <Button v-if="can('projects', 'create')" @click="createProject">
          <Plus class="h-4 w-4" />
          New Project
        </Button>
      </template>
    </DataTable>
  </div>
</template>
