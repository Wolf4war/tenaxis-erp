<script setup lang="ts" generic="T">
/* ============================================
   TENAXIS - DataTable Component
   Advanced data table with sorting, filtering
   Uses TanStack Table for headless functionality
   ============================================ */

import { ref, computed, watch } from 'vue';
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  FlexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/vue-table';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import Input from './Input.vue';
import Select from './Select.vue';
import EmptyState from './EmptyState.vue';
import Spinner from './Spinner.vue';

interface Props {
  columns: ColumnDef<T, any>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  selectable?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  searchable: true,
  searchPlaceholder: 'Search...',
  pageSize: 10,
  pageSizeOptions: () => [10, 20, 50, 100],
  selectable: false,
  emptyTitle: 'No results found',
  emptyDescription: 'Try adjusting your search or filter criteria.',
});

const emit = defineEmits<{
  (e: 'rowClick', row: T): void;
  (e: 'selectionChange', rows: T[]): void;
}>();

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const globalFilter = ref('');
const rowSelection = ref({});

const table = useVueTable({
  get data() { return props.data; },
  get columns() { return props.columns; },
  state: {
    get sorting() { return sorting.value; },
    get columnFilters() { return columnFilters.value; },
    get globalFilter() { return globalFilter.value; },
    get rowSelection() { return rowSelection.value; },
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater;
  },
  onColumnFiltersChange: (updater) => {
    columnFilters.value = typeof updater === 'function' ? updater(columnFilters.value) : updater;
  },
  onGlobalFilterChange: (updater) => {
    globalFilter.value = typeof updater === 'function' ? updater(globalFilter.value) : updater;
  },
  onRowSelectionChange: (updater) => {
    rowSelection.value = typeof updater === 'function' ? updater(rowSelection.value) : updater;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  enableRowSelection: props.selectable,
  initialState: {
    pagination: {
      pageSize: props.pageSize,
    },
  },
});

// Watch for selection changes
watch(
  () => rowSelection.value,
  () => {
    if (props.selectable) {
      const selectedRows = table.getSelectedRowModel().rows.map(r => r.original);
      emit('selectionChange', selectedRows);
    }
  },
  { deep: true }
);

const pageSizeSelectOptions = computed(() =>
  props.pageSizeOptions.map(size => ({ value: size, label: `${size} per page` }))
);

const handlePageSizeChange = (value: string | number) => {
  table.setPageSize(Number(value));
};

const handleRowClick = (row: T) => {
  emit('rowClick', row);
};
</script>

<template>
  <div class="space-y-4">
    <!-- Search & Actions -->
    <div class="flex items-center justify-between gap-4">
      <div v-if="searchable" class="flex-1 max-w-sm">
        <Input
          v-model="globalFilter"
          :placeholder="searchPlaceholder"
          class="w-full"
        />
      </div>
      <slot name="actions" />
    </div>

    <!-- Table -->
    <div class="rounded-md border border-border">
      <div class="relative overflow-x-auto">
        <!-- Loading overlay -->
        <div
          v-if="loading"
          class="absolute inset-0 z-10 flex items-center justify-center bg-background/80"
        >
          <Spinner size="lg" />
        </div>

        <table class="w-full caption-bottom text-sm">
          <thead class="bg-muted/50">
            <tr
              v-for="headerGroup in table.getHeaderGroups()"
              :key="headerGroup.id"
              class="border-b border-border"
            >
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                :class="cn(
                  'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
                  header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground'
                )"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                <div class="flex items-center gap-2">
                  <FlexRender
                    v-if="!header.isPlaceholder"
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                  <template v-if="header.column.getCanSort()">
                    <ChevronUp v-if="header.column.getIsSorted() === 'asc'" class="h-4 w-4" />
                    <ChevronDown v-else-if="header.column.getIsSorted() === 'desc'" class="h-4 w-4" />
                    <ChevronsUpDown v-else class="h-4 w-4 opacity-50" />
                  </template>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :class="cn(
                'border-b border-border transition-colors hover:bg-muted/50',
                row.getIsSelected() && 'bg-muted'
              )"
              @click="handleRowClick(row.original)"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="p-4 align-middle"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty state -->
        <div v-if="!loading && table.getRowModel().rows.length === 0" class="py-8">
          <EmptyState :title="emptyTitle" :description="emptyDescription">
            <template #action>
              <slot name="empty-action" />
            </template>
          </EmptyState>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between">
      <div class="text-sm text-muted-foreground">
        {{ table.getFilteredSelectedRowModel().rows.length }} of {{ table.getFilteredRowModel().rows.length }} row(s)
        <span v-if="selectable && table.getFilteredSelectedRowModel().rows.length > 0">
          selected
        </span>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">Rows per page</span>
          <Select
            :model-value="table.getState().pagination.pageSize"
            :options="pageSizeSelectOptions"
            class="w-[120px]"
            @update:model-value="handlePageSizeChange"
          />
        </div>

        <div class="flex items-center gap-1">
          <span class="text-sm text-muted-foreground">
            Page {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() }}
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            class="rounded-md p-2 hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            :disabled="!table.getCanPreviousPage()"
            @click="table.previousPage()"
          >
            <ChevronLeft class="h-4 w-4" />
            <span class="sr-only">Previous page</span>
          </button>
          <button
            class="rounded-md p-2 hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            :disabled="!table.getCanNextPage()"
            @click="table.nextPage()"
          >
            <ChevronRight class="h-4 w-4" />
            <span class="sr-only">Next page</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
