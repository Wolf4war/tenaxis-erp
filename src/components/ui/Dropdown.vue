<script setup lang="ts">
/* ============================================
   TENAXIS - Dropdown Menu Component
   Flexible dropdown menu
   ============================================ */

import { ref, onMounted, onUnmounted } from 'vue';
import { cn } from '@/lib/utils';

interface Props {
  align?: 'left' | 'right';
  width?: 'auto' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  align: 'left',
  width: 'auto',
});

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const widthClasses = {
  auto: 'w-auto min-w-[160px]',
  sm: 'w-48',
  md: 'w-56',
  lg: 'w-72',
};

const alignClasses = {
  left: 'left-0',
  right: 'right-0',
};

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

// Close on outside click
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close();
  }
};

// Close on escape
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
});

// Expose methods
defineExpose({ open: () => { isOpen.value = true; }, close, toggle });
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block">
    <!-- Trigger -->
    <div @click="toggle">
      <slot name="trigger" />
    </div>
    
    <!-- Menu -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        :class="cn(
          'absolute z-50 mt-1 rounded-md border border-border bg-popover p-1 shadow-md',
          widthClasses[width],
          alignClasses[align]
        )"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>
