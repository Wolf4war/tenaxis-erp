<script setup lang="ts">
/* ============================================
   TENAXIS - CardDescription Component
   Card subtitle/description text
   ============================================ */

import { cn } from '@/lib/utils';

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <p :class="cn('text-sm text-muted-foreground', props.class)">
    <slot />
  </p>
</template>
