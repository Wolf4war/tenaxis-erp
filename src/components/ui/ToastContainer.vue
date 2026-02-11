<script setup lang="ts">
/* ============================================
   TENAXIS - Toast Container
   Global toast notifications
   ============================================ */

import { useUIStore, type Toast } from '@/stores/ui.store';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-vue-next';

const uiStore = useUIStore();

const getIcon = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
    default:
      return Info;
  }
};

const getColorClass = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200';
    case 'error':
      return 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200';
    case 'warning':
      return 'border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
    case 'info':
    default:
      return 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
  }
};

const getIconColorClass = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    case 'info':
    default:
      return 'text-blue-500';
  }
};
</script>

<template>
  <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="toast in uiStore.toasts"
        :key="toast.id"
        class="flex w-80 items-start gap-3 rounded-lg border-l-4 p-4 shadow-lg"
        :class="getColorClass(toast.type)"
      >
        <component
          :is="getIcon(toast.type)"
          class="h-5 w-5 shrink-0"
          :class="getIconColorClass(toast.type)"
        />
        <div class="min-w-0 flex-1">
          <p class="font-medium">{{ toast.title }}</p>
          <p v-if="toast.message" class="mt-1 text-sm opacity-80">
            {{ toast.message }}
          </p>
        </div>
        <button
          class="shrink-0 opacity-60 hover:opacity-100"
          @click="uiStore.removeToast(toast.id)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
