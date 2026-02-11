<script setup lang="ts">
/* ============================================
   TENAXIS - Card Component
   Container component with header and content
   ============================================ */

import { cn } from '@/lib/utils';

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div :class="cn('rounded-lg border border-border bg-card text-card-foreground shadow-sm', props.class)">
    <slot />
  </div>
</template>
