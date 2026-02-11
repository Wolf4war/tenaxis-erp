/* ============================================
   TENAXIS - useDebounce Composable
   Debounce utilities
   ============================================ */

import { ref, watch, type Ref } from 'vue';

/**
 * Debounce a ref value
 */
export function useDebouncedRef<T>(
  value: Ref<T>,
  delay: number = 300
): Ref<T> {
  const debouncedValue = ref(value.value) as Ref<T>;
  let timeoutId: ReturnType<typeof setTimeout>;

  watch(value, (newValue) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue;
    }, delay);
  });

  return debouncedValue;
}

/**
 * Create a debounced search input
 */
export function useSearch(delay: number = 300) {
  const searchQuery = ref('');
  const debouncedQuery = useDebouncedRef(searchQuery, delay);
  const isSearching = ref(false);

  watch(searchQuery, () => {
    isSearching.value = true;
  });

  watch(debouncedQuery, () => {
    isSearching.value = false;
  });

  function clearSearch(): void {
    searchQuery.value = '';
  }

  return {
    searchQuery,
    debouncedQuery,
    isSearching,
    clearSearch,
  };
}

/**
 * Create a debounced function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
