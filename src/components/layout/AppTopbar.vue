<script setup lang="ts">
/* ============================================
   TENAXIS - App Topbar
   Main application header
   ============================================ */

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUIStore, useAuthStore } from '@/stores';
import Modal from '@/components/ui/Modal.vue';
import Button from '@/components/ui/Button.vue';
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  Building,
  ChevronDown,
  Check,
  X,
} from 'lucide-vue-next';

const router = useRouter();
const uiStore = useUIStore();
const authStore = useAuthStore();

const isUserMenuOpen = ref(false);
const isNotificationsOpen = ref(false);
const isOrgSwitcherOpen = ref(false);
const selectedNotification = ref<{ id: string; message: string; time: string; details?: string } | null>(null);

// Placeholder for notifications - will be connected to real data later
const unreadNotifications = ref([
  { id: '1', message: 'Test notification', time: 'Just now', details: 'This is a test notification to verify the notification system is working correctly.' }
]);

const hasUnreadNotifications = computed(() => unreadNotifications.value.length > 0);

// Notification actions
const openNotification = (notification: typeof unreadNotifications.value[0]) => {
  selectedNotification.value = notification;
  isNotificationsOpen.value = false;
};

const markAsRead = () => {
  if (selectedNotification.value) {
    unreadNotifications.value = unreadNotifications.value.filter(
      n => n.id !== selectedNotification.value?.id
    );
    selectedNotification.value = null;
  }
};

const markAllAsRead = () => {
  unreadNotifications.value = [];
  isNotificationsOpen.value = false;
};

const closeNotificationModal = () => {
  selectedNotification.value = null;
};

// Handle user menu actions
const goToProfile = () => {
  isUserMenuOpen.value = false;
  router.push('/profile');
};

const goToSettings = () => {
  isUserMenuOpen.value = false;
  router.push('/settings');
};

const handleLogout = async () => {
  isUserMenuOpen.value = false;
  await authStore.logout();
  router.push('/auth/login');
};

// Close dropdowns when clicking outside
const closeDropdowns = () => {
  isUserMenuOpen.value = false;
  isNotificationsOpen.value = false;
  isOrgSwitcherOpen.value = false;
};
</script>

<template>
  <header class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
    <!-- Left section -->
    <div class="flex items-center gap-4">
      <!-- Mobile menu button -->
      <button
        class="rounded-md p-2 hover:bg-muted lg:hidden"
        @click="uiStore.toggleSidebar"
      >
        <Menu class="h-5 w-5" />
      </button>

      <!-- Organization switcher -->
      <div class="relative">
        <button
          class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-muted"
          @click="isOrgSwitcherOpen = !isOrgSwitcherOpen"
        >
          <Building class="h-4 w-4 text-muted-foreground" />
          <span class="font-medium">{{ authStore.currentOrganization?.name || 'Organization' }}</span>
          <ChevronDown class="h-4 w-4 text-muted-foreground" />
        </button>

        <!-- Dropdown (placeholder) -->
        <div
          v-if="isOrgSwitcherOpen"
          class="absolute left-0 top-full mt-1 w-64 rounded-md border border-border bg-card p-2 shadow-lg"
        >
          <p class="px-2 py-1.5 text-xs text-muted-foreground">
            Organization switching coming soon
          </p>
        </div>
      </div>
    </div>

    <!-- Right section -->
    <div class="flex items-center gap-2">
      <!-- Search button -->
      <button
        class="rounded-md p-2 hover:bg-muted"
        @click="uiStore.openCommandPalette"
        title="Search (⌘K)"
      >
        <Search class="h-5 w-5 text-muted-foreground" />
      </button>

      <!-- Theme toggle -->
      <button
        class="rounded-md p-2 hover:bg-muted"
        @click="uiStore.toggleDarkMode"
        :title="uiStore.isDarkMode ? 'Light Mode' : 'Dark Mode'"
      >
        <Sun v-if="uiStore.isDarkMode" class="h-5 w-5 text-muted-foreground" />
        <Moon v-else class="h-5 w-5 text-muted-foreground" />
      </button>

      <!-- Notifications -->
      <div class="relative">
        <button
          class="relative rounded-md p-2 hover:bg-muted"
          @click="isNotificationsOpen = !isNotificationsOpen"
        >
          <Bell class="h-5 w-5 text-muted-foreground" />
          <!-- Notification badge - only show when there are unread notifications -->
          <span
            v-if="hasUnreadNotifications"
            class="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive"
          />
        </button>

        <!-- Notifications dropdown -->
        <div
          v-if="isNotificationsOpen"
          class="absolute right-0 top-full mt-1 w-80 rounded-md border border-border bg-card shadow-lg"
        >
          <div class="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 class="font-semibold">Notifications</h3>
            <button
              v-if="unreadNotifications.length > 0"
              class="text-xs text-primary hover:underline"
              @click="markAllAsRead"
            >
              Mark all as read
            </button>
          </div>
          <div class="max-h-80 overflow-y-auto">
            <!-- Show notifications if any -->
            <div v-if="unreadNotifications.length > 0">
              <button
                v-for="notification in unreadNotifications"
                :key="notification.id"
                class="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted transition-colors"
                @click="openNotification(notification)"
              >
                <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{{ notification.message }}</p>
                  <p class="text-xs text-muted-foreground">{{ notification.time }}</p>
                </div>
              </button>
            </div>
            <!-- Empty state -->
            <div v-else class="px-4 py-8 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          </div>
        </div>
      </div>

      <!-- User menu -->
      <div class="relative">
        <button
          class="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted"
          @click="isUserMenuOpen = !isUserMenuOpen"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
          >
            {{ authStore.userName.charAt(0).toUpperCase() }}
          </div>
          <ChevronDown class="h-4 w-4 text-muted-foreground" />
        </button>

        <!-- User dropdown -->
        <div
          v-if="isUserMenuOpen"
          class="absolute right-0 top-full mt-1 w-56 rounded-md border border-border bg-card py-1 shadow-lg"
        >
          <div class="border-b border-border px-4 py-3">
            <p class="font-medium">{{ authStore.userName }}</p>
            <p class="text-sm text-muted-foreground">{{ authStore.userEmail }}</p>
          </div>
          
          <div class="py-1">
            <button
              class="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted"
              @click="goToProfile"
            >
              <User class="h-4 w-4" />
              Profile
            </button>
            <button
              class="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted"
              @click="goToSettings"
            >
              <Settings class="h-4 w-4" />
              Settings
            </button>
          </div>

          <div class="border-t border-border py-1">
            <button
              class="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-muted"
              @click="handleLogout"
            >
              <LogOut class="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Click outside handler -->
  <div
    v-if="isUserMenuOpen || isNotificationsOpen || isOrgSwitcherOpen"
    class="fixed inset-0 z-30"
    @click="closeDropdowns"
  />

  <!-- Notification Detail Modal -->
  <Modal
    :open="!!selectedNotification"
    title="Notification"
    size="sm"
    @close="closeNotificationModal"
  >
    <div v-if="selectedNotification" class="space-y-4">
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bell class="h-5 w-5 text-primary" />
        </div>
        <div class="flex-1">
          <h4 class="font-semibold">{{ selectedNotification.message }}</h4>
          <p class="text-sm text-muted-foreground">{{ selectedNotification.time }}</p>
        </div>
      </div>
      
      <p v-if="selectedNotification.details" class="text-sm text-muted-foreground">
        {{ selectedNotification.details }}
      </p>
      
      <div class="flex gap-2 pt-2">
        <Button class="flex-1" @click="markAsRead">
          <Check class="mr-2 h-4 w-4" />
          Mark as Read
        </Button>
        <Button variant="outline" @click="closeNotificationModal">
          <X class="mr-2 h-4 w-4" />
          Close
        </Button>
      </div>
    </div>
  </Modal>
</template>
