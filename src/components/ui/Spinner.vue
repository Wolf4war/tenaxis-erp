<script setup lang="ts">
/* ============================================
   TENAXIS - Spinner Component
   Loading spinner indicator
   ============================================ */

import { cn } from '@/lib/utils';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-3',
};
</script>

<template>
  <div
    :class="cn(
      'animate-spin rounded-full border-primary border-t-transparent',
      sizeClasses[size],
      props.class
    )"
  />
</template>
