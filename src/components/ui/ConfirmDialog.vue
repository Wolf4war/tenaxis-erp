<script setup lang="ts">
/* ============================================
   TENAXIS - Confirm Dialog
   Global confirmation dialog
   ============================================ */

import { ref } from 'vue';
import { useUIStore } from '@/stores/ui.store';
import { AlertTriangle, X } from 'lucide-vue-next';

const uiStore = useUIStore();
const isProcessing = ref(false);

const handleConfirm = async () => {
  if (!uiStore.confirmDialog?.onConfirm) return;
  
  isProcessing.value = true;
  try {
    await uiStore.confirmDialog.onConfirm();
  } finally {
    isProcessing.value = false;
    uiStore.closeConfirmDialog();
  }
};

const handleCancel = () => {
  if (uiStore.confirmDialog?.onCancel) {
    uiStore.confirmDialog.onCancel();
  }
  uiStore.closeConfirmDialog();
};
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="uiStore.isConfirmDialogOpen && uiStore.confirmDialog"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="handleCancel"
        />

        <!-- Dialog -->
        <div class="relative w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
          <!-- Close button -->
          <button
            class="absolute right-4 top-4 rounded-md p-1 hover:bg-muted"
            @click="handleCancel"
          >
            <X class="h-4 w-4" />
          </button>

          <!-- Icon -->
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            :class="[
              uiStore.confirmDialog.variant === 'destructive'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary',
            ]"
          >
            <AlertTriangle class="h-6 w-6" />
          </div>

          <!-- Content -->
          <div class="text-center">
            <h3 class="text-lg font-semibold">
              {{ uiStore.confirmDialog.title }}
            </h3>
            <p class="mt-2 text-sm text-muted-foreground">
              {{ uiStore.confirmDialog.message }}
            </p>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex gap-3">
            <button
              class="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              :disabled="isProcessing"
              @click="handleCancel"
            >
              {{ uiStore.confirmDialog.cancelText || 'Cancel' }}
            </button>
            <button
              class="flex-1 rounded-md px-4 py-2 text-sm font-medium text-white"
              :class="[
                uiStore.confirmDialog.variant === 'destructive'
                  ? 'bg-destructive hover:bg-destructive/90'
                  : 'bg-primary hover:bg-primary/90',
              ]"
              :disabled="isProcessing"
              @click="handleConfirm"
            >
              <span v-if="isProcessing">Processing...</span>
              <span v-else>{{ uiStore.confirmDialog.confirmText || 'Confirm' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .relative,
.dialog-leave-to .relative {
  transform: scale(0.95);
}
</style>
