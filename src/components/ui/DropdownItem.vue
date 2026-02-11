<script setup lang="ts">
/* ============================================
   TENAXIS - Dropdown Item Component
   Menu item within dropdown
   ============================================ */

import { cn } from '@/lib/utils';

interface Props {
  disabled?: boolean;
  destructive?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  destructive: false,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event);
  }
};
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="cn(
      'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
      'focus:bg-accent focus:text-accent-foreground',
      disabled 
        ? 'pointer-events-none opacity-50' 
        : 'hover:bg-accent hover:text-accent-foreground',
      destructive && 'text-destructive focus:bg-destructive/10 hover:bg-destructive/10',
      props.class
    )"
    @click="handleClick"
  >
    <slot />
  </button>
</template>
