<script setup lang="ts">
/* ============================================
   TENAXIS - CardTitle Component
   Card title text
   ============================================ */

import { cn } from '@/lib/utils';

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <h3 :class="cn('text-2xl font-semibold leading-none tracking-tight', props.class)">
    <slot />
  </h3>
</template>
