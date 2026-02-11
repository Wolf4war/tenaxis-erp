<script setup lang="ts">
/* ============================================
   TENAXIS - Profile View
   User profile settings and preferences
   ============================================ */

import { ref, onMounted } from 'vue';
import { useAuthStore, useUIStore } from '@/stores';
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Avatar,
} from '@/components/ui';
import { Camera, Save, Key } from 'lucide-vue-next';
import { USER_ROLES } from '@/lib/constants';

const authStore = useAuthStore();
const uiStore = useUIStore();

const isSaving = ref(false);
const isChangingPassword = ref(false);

// Profile form
const profile = ref({
  display_name: '',
  email: '',
  phone: '',
  avatar_url: '',
});

// Password form
const passwordForm = ref({
  current: '',
  new: '',
  confirm: '',
});

const passwordError = ref('');

onMounted(() => {
  if (authStore.currentUser) {
    profile.value = {
      display_name: authStore.currentUser.display_name || '',
      email: authStore.currentUser.email || '',
      phone: authStore.currentUser.phone || '',
      avatar_url: authStore.currentUser.avatar_url || '',
    };
  }
});

const handleSaveProfile = async () => {
  isSaving.value = true;
  try {
    // TODO: Implement profile update through UserService
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay
    uiStore.showToast({
      type: 'success',
      message: 'Profile updated successfully',
    });
  } catch (error) {
    uiStore.showToast({
      type: 'error',
      message: 'Failed to update profile',
    });
  } finally {
    isSaving.value = false;
  }
};

const handleChangePassword = async () => {
  passwordError.value = '';

  if (passwordForm.value.new !== passwordForm.value.confirm) {
    passwordError.value = 'New passwords do not match';
    return;
  }

  if (passwordForm.value.new.length < 8) {
    passwordError.value = 'Password must be at least 8 characters';
    return;
  }

  isChangingPassword.value = true;
  try {
    // TODO: Implement password change through Firebase Auth
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay
    uiStore.showToast({
      type: 'success',
      message: 'Password changed successfully',
    });
    passwordForm.value = { current: '', new: '', confirm: '' };
  } catch (error) {
    uiStore.showToast({
      type: 'error',
      message: 'Failed to change password',
    });
  } finally {
    isChangingPassword.value = false;
  }
};

const handleAvatarUpload = () => {
  // TODO: Implement avatar upload with Firebase Storage
  uiStore.showToast({
    type: 'info',
    message: 'Avatar upload coming soon',
  });
};

// Helper to get role label
const getRoleLabel = (role: string) => {
  const roleObj = USER_ROLES.find((r) => r.value === role);
  return roleObj?.label || role;
};

// Dark mode state
const isDarkMode = ref(false);

onMounted(() => {
  isDarkMode.value = document.documentElement.classList.contains('dark');
});

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle('dark', isDarkMode.value);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold">Profile</h1>
      <p class="text-muted-foreground">
        Manage your account settings and preferences
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Left column - Profile info -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Personal Information -->
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center gap-6">
              <div class="relative">
                <Avatar :src="profile.avatar_url" :alt="profile.display_name" size="lg" />
                <button
                  class="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  @click="handleAvatarUpload"
                >
                  <Camera class="h-4 w-4" />
                </button>
              </div>
              <div>
                <p class="font-medium">{{ profile.display_name }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ authStore.currentUser?.role ? getRoleLabel(authStore.currentUser.role) : 'User' }}
                </p>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  v-model="profile.display_name"
                  placeholder="Enter your name"
                />
              </div>

              <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input
                  id="email"
                  v-model="profile.email"
                  type="email"
                  disabled
                />
                <p class="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div class="space-y-2 sm:col-span-2">
                <Label for="phone">Phone Number</Label>
                <Input
                  id="phone"
                  v-model="profile.phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button :loading="isSaving" @click="handleSaveProfile">
              <Save class="h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <!-- Change Password -->
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="current_password">Current Password</Label>
              <Input
                id="current_password"
                v-model="passwordForm.current"
                type="password"
                placeholder="Enter current password"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="new_password">New Password</Label>
                <Input
                  id="new_password"
                  v-model="passwordForm.new"
                  type="password"
                  placeholder="Enter new password"
                  :error="!!passwordError"
                />
              </div>

              <div class="space-y-2">
                <Label for="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  v-model="passwordForm.confirm"
                  type="password"
                  placeholder="Confirm new password"
                  :error="!!passwordError"
                />
              </div>
            </div>

            <p v-if="passwordError" class="text-sm text-destructive">{{ passwordError }}</p>
          </CardContent>
          <CardFooter>
            <Button :loading="isChangingPassword" @click="handleChangePassword">
              <Key class="h-4 w-4" />
              Change Password
            </Button>
          </CardFooter>
        </Card>
      </div>

      <!-- Right column - Account info -->
      <div class="space-y-6">
        <!-- Account Details -->
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <p class="text-sm text-muted-foreground">Role</p>
              <p class="font-medium">
                {{ authStore.currentUser?.role ? getRoleLabel(authStore.currentUser.role) : '-' }}
              </p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Office</p>
              <p class="font-medium">{{ authStore.currentUser?.primary_office_id || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Department</p>
              <p class="font-medium">{{ authStore.currentUser?.department_id || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Status</p>
              <p class="font-medium capitalize">{{ authStore.currentUser?.status || '-' }}</p>
            </div>
          </CardContent>
        </Card>

        <!-- Preferences -->
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Dark Mode</p>
                <p class="text-sm text-muted-foreground">Toggle dark theme</p>
              </div>
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="isDarkMode ? 'bg-primary' : 'bg-muted'"
                @click="toggleDarkMode"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="isDarkMode ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
