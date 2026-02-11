/* ============================================
   TENAXIS - usePagination Composable
   Pagination utilities for lists
   ============================================ */

import { ref, computed } from 'vue';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants';

export interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  total?: number;
}

export function usePagination(options: PaginationOptions = {}) {
  const page = ref(options.initialPage || 1);
  const pageSize = ref(options.initialPageSize || DEFAULT_PAGE_SIZE);
  const total = ref(options.total || 0);

  const totalPages = computed(() => 
    Math.ceil(total.value / pageSize.value) || 1
  );

  const hasNextPage = computed(() => page.value < totalPages.value);
  const hasPrevPage = computed(() => page.value > 1);

  const startIndex = computed(() => 
    (page.value - 1) * pageSize.value
  );

  const endIndex = computed(() => 
    Math.min(startIndex.value + pageSize.value, total.value)
  );

  const pageRange = computed(() => {
    const range: number[] = [];
    const delta = 2;
    const left = page.value - delta;
    const right = page.value + delta;

    for (let i = 1; i <= totalPages.value; i++) {
      if (i === 1 || i === totalPages.value || (i >= left && i <= right)) {
        range.push(i);
      }
    }

    // Add ellipsis indicators
    const result: (number | string)[] = [];
    let prev: number | null = null;

    for (const i of range) {
      if (prev !== null && i - prev > 1) {
        result.push('...');
      }
      result.push(i);
      prev = i;
    }

    return result;
  });

  function goToPage(newPage: number): void {
    if (newPage >= 1 && newPage <= totalPages.value) {
      page.value = newPage;
    }
  }

  function nextPage(): void {
    if (hasNextPage.value) {
      page.value++;
    }
  }

  function prevPage(): void {
    if (hasPrevPage.value) {
      page.value--;
    }
  }

  function firstPage(): void {
    page.value = 1;
  }

  function lastPage(): void {
    page.value = totalPages.value;
  }

  function setPageSize(newSize: number): void {
    pageSize.value = newSize;
    page.value = 1; // Reset to first page when changing page size
    localStorage.setItem('tenaxis_table_page_size', String(newSize));
  }

  function setTotal(newTotal: number): void {
    total.value = newTotal;
    // Adjust page if current page is out of bounds
    if (page.value > totalPages.value) {
      page.value = Math.max(1, totalPages.value);
    }
  }

  function reset(): void {
    page.value = 1;
    total.value = 0;
  }

  // Load saved page size from localStorage
  const savedPageSize = localStorage.getItem('tenaxis_table_page_size');
  if (savedPageSize) {
    const parsed = parseInt(savedPageSize, 10);
    if (PAGE_SIZE_OPTIONS.includes(parsed)) {
      pageSize.value = parsed;
    }
  }

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    pageRange,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    setTotal,
    reset,
  };
}
