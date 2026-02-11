<script setup lang="ts">
/* ============================================
   TENAXIS - Login View
   User authentication page
   ============================================ */

import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);

const isFormValid = computed(() => 
  email.value.trim() !== '' && password.value.trim() !== ''
);

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    await authStore.login(email.value, password.value);
    
    // Redirect to intended destination or dashboard
    const redirect = route.query.redirect as string;
    router.push(redirect || '/');
  } catch (err: any) {
    error.value = authStore.authError || 'Login failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold">Welcome back</h2>
    <p class="mt-1 text-sm text-muted-foreground">
      Sign in to your account to continue
    </p>

    <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
      <!-- Error message -->
      <div
        v-if="error"
        class="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
      >
        {{ error }}
      </div>

      <!-- Email field -->
      <div>
        <label for="email" class="block text-sm font-medium">
          Email
        </label>
        <div class="relative mt-1">
          <Mail class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            required
            class="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <!-- Password field -->
      <div>
        <div class="flex items-center justify-between">
          <label for="password" class="block text-sm font-medium">
            Password
          </label>
          <router-link
            to="/auth/forgot-password"
            class="text-xs text-primary hover:underline"
          >
            Forgot password?
          </router-link>
        </div>
        <div class="relative mt-1">
          <Lock class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            required
            class="w-full rounded-md border border-input bg-background py-2 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Submit button -->
      <button
        type="submit"
        :disabled="!isFormValid || isLoading"
        class="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
        <span>{{ isLoading ? 'Signing in...' : 'Sign in' }}</span>
      </button>
    </form>
  </div>
</template>
