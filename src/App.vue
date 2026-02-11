<script setup lang="ts">
/* ============================================
   TENAXIS - App Root Component
   Main application entry component
   ============================================ */

import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useAuthStore, useUIStore } from '@/stores';
import { ToastContainer, ConfirmDialog } from '@/components/ui';

const authStore = useAuthStore();
const uiStore = useUIStore();

onMounted(() => {
  // Initialize auth listener
  authStore.initializeAuth();
  
  // Initialize theme from localStorage
  uiStore.initializeTheme();
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <RouterView />
    
    <!-- Global Toast Container -->
    <ToastContainer />
    
    <!-- Global Confirm Dialog -->
    <ConfirmDialog />
  </div>
</template>
