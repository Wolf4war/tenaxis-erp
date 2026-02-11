<script setup lang="ts">
/* ============================================
   TENAXIS - Forgot Password View
   Password reset request page
   ============================================ */

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const isLoading = ref(false);
const isSuccess = ref(false);
const error = ref<string | null>(null);

const isFormValid = computed(() => email.value.trim() !== '');

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    await authStore.resetPassword(email.value);
    isSuccess.value = true;
  } catch (err: any) {
    error.value = authStore.authError || 'Failed to send reset email. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div>
    <!-- Back link -->
    <router-link
      to="/auth/login"
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to login
    </router-link>

    <h2 class="mt-4 text-xl font-semibold">Reset password</h2>
    <p class="mt-1 text-sm text-muted-foreground">
      Enter your email and we'll send you a reset link
    </p>

    <!-- Success state -->
    <div v-if="isSuccess" class="mt-6">
      <div class="flex items-center gap-3 rounded-md bg-green-50 p-4 dark:bg-green-950">
        <CheckCircle class="h-5 w-5 text-green-600" />
        <div>
          <p class="font-medium text-green-800 dark:text-green-200">
            Check your email
          </p>
          <p class="mt-1 text-sm text-green-700 dark:text-green-300">
            We've sent a password reset link to {{ email }}
          </p>
        </div>
      </div>
      
      <button
        class="mt-4 w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
        @click="router.push('/auth/login')"
      >
        Return to login
      </button>
    </div>

    <!-- Form -->
    <form v-else class="mt-6 space-y-4" @submit.prevent="handleSubmit">
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

      <!-- Submit button -->
      <button
        type="submit"
        :disabled="!isFormValid || isLoading"
        class="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
        <span>{{ isLoading ? 'Sending...' : 'Send reset link' }}</span>
      </button>
    </form>
  </div>
</template>
