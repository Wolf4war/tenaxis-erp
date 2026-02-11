<script setup lang="ts">
/* ============================================
   TENAXIS - CardFooter Component
   Card footer section
   ============================================ */

import { cn } from '@/lib/utils';

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div :class="cn('flex items-center p-6 pt-0', props.class)">
    <slot />
  </div>
</template>
