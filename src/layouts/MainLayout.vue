<script setup lang="ts">
/* ============================================
   TENAXIS - Main Layout
   Primary application layout with sidebar and topbar
   ============================================ */

import { computed, onMounted, ref, watch } from 'vue';
import { RouterView } from 'vue-router';
import { useUIStore, useAuthStore } from '@/stores';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import ToastContainer from '@/components/ui/ToastContainer.vue';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';
import ProfileCompletionModal from '@/components/modals/ProfileCompletionModal.vue';

const uiStore = useUIStore();
const authStore = useAuthStore();

// Profile completion modal state
const showProfileModal = ref(false);

const mainContentClass = computed(() => {
  return {
    'lg:ml-64': !uiStore.sidebarCollapsed,
    'lg:ml-20': uiStore.sidebarCollapsed,
  };
});

// Check if user needs to complete profile
const needsProfileCompletion = computed(() => {
  const user = authStore.currentUser;
  if (!user) return false;
  // Show modal if profile is not completed (no first/last name)
  return !user.profile_completed && (!user.first_name || !user.last_name);
});

// Watch for profile completion requirement
watch(needsProfileCompletion, (needs) => {
  if (needs) {
    showProfileModal.value = true;
  }
}, { immediate: true });

function handleProfileCompleted() {
  showProfileModal.value = false;
}

onMounted(() => {
  uiStore.initialize();
});
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Mobile sidebar overlay -->
    <div
      v-if="uiStore.sidebarMobileOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="uiStore.closeMobileSidebar"
    />

    <!-- Main content area -->
    <div
      class="flex min-h-screen flex-col transition-all duration-300"
      :class="mainContentClass"
    >
      <!-- Topbar -->
      <AppTopbar />

      <!-- Page content -->
      <main class="flex-1 p-4 lg:p-6">
        <RouterView v-slot="{ Component, route }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </main>

      <!-- Footer -->
      <footer class="border-t border-border px-4 py-3 text-center text-sm text-muted-foreground">
        <p>&copy; {{ new Date().getFullYear() }} Tenaxis. All rights reserved.</p>
      </footer>
    </div>

    <!-- Global UI components -->
    <ToastContainer />
    <ConfirmDialog />

    <!-- Profile Completion Modal -->
    <ProfileCompletionModal 
      v-model:open="showProfileModal" 
      @completed="handleProfileCompleted" 
    />

    <!-- Global loading overlay -->
    <Transition name="fade">
      <div
        v-if="uiStore.globalLoading"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center gap-4">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p v-if="uiStore.loadingMessage" class="text-sm text-muted-foreground">
            {{ uiStore.loadingMessage }}
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
