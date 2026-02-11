<script setup lang="ts">
/* ============================================
   TENAXIS - Modal/Dialog Component
   Accessible modal dialog
   ============================================ */

import { watch, onMounted, onUnmounted } from 'vue';
import { cn } from '@/lib/utils';
import { X } from 'lucide-vue-next';

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

// Handle escape key
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closable) {
    emit('close');
  }
};

// Lock body scroll when open
watch(() => props.open, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  document.body.style.overflow = '';
});

const handleBackdropClick = () => {
  if (props.closable) {
    emit('close');
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="handleBackdropClick"
        />
        
        <!-- Content -->
        <div
          :class="cn(
            'relative w-full mx-4 rounded-lg border border-border bg-background shadow-lg',
            sizeClasses[size]
          )"
          role="dialog"
          aria-modal="true"
        >
          <!-- Header -->
          <div v-if="title || closable" class="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 v-if="title" class="text-lg font-semibold">{{ title }}</h2>
              <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
            </div>
            <button
              v-if="closable"
              class="rounded-md p-1 hover:bg-muted"
              @click="emit('close')"
            >
              <X class="h-4 w-4" />
              <span class="sr-only">Close</span>
            </button>
          </div>
          
          <!-- Body -->
          <div class="p-6">
            <slot />
          </div>
          
          <!-- Footer -->
          <div v-if="$slots.footer" class="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.2s ease;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
