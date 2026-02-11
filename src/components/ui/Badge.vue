<script setup lang="ts">
/* ============================================
   TENAXIS - Badge Component
   Status indicators and labels
   ============================================ */

import { computed } from 'vue';
import { cn } from '@/lib/utils';

interface Props {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
});

const classes = computed(() => {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors';
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'border border-input text-foreground',
    success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  };
  
  return cn(base, variants[props.variant], props.class);
});
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
