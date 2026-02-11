<script setup lang="ts">
/* ============================================
   TENAXIS - Empty State Component
   Placeholder for empty lists/views
   ============================================ */

import { cn } from '@/lib/utils';
import { FileX } from 'lucide-vue-next';

interface Props {
  title?: string;
  description?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'No data found',
  description: 'There is no data to display.',
});
</script>

<template>
  <div
    :class="cn(
      'flex flex-col items-center justify-center py-12 text-center',
      props.class
    )"
  >
    <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
      <slot name="icon">
        <FileX class="h-8 w-8 text-muted-foreground" />
      </slot>
    </div>
    <h3 class="text-lg font-semibold">{{ title }}</h3>
    <p class="mt-1 max-w-sm text-sm text-muted-foreground">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
