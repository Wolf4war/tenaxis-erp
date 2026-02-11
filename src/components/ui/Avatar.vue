<script setup lang="ts">
/* ============================================
   TENAXIS - Avatar Component
   User profile image with fallback
   ============================================ */

import { computed } from 'vue';
import { cn } from '@/lib/utils';

interface Props {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
};

const initials = computed(() => {
  if (props.fallback) return props.fallback.slice(0, 2).toUpperCase();
  if (props.alt) {
    const words = props.alt.split(' ');
    const first = words[0]?.[0] || '';
    const second = words[1]?.[0] || '';
    if (first && second) {
      return (first + second).toUpperCase();
    }
    return props.alt.slice(0, 2).toUpperCase();
  }
  return '?';
});
</script>

<template>
  <div
    :class="cn(
      'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted',
      sizeClasses[size],
      props.class
    )"
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt || 'Avatar'"
      class="h-full w-full object-cover"
      @error="($event.target as HTMLImageElement).style.display = 'none'"
    />
    <span v-else class="font-medium text-muted-foreground">
      {{ initials }}
    </span>
  </div>
</template>
