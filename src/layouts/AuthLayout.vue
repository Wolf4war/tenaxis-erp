<script setup lang="ts">
/* ============================================
   TENAXIS - Auth Layout
   Layout for authentication pages
   ============================================ */

import { RouterView } from 'vue-router';
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/50 p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-primary">Tenaxis</h1>
        <p class="mt-2 text-sm text-muted-foreground">
          Enterprise Asset & Operations Management
        </p>
      </div>

      <!-- Auth card -->
      <div class="rounded-lg border border-border bg-card p-6 shadow-sm">
        <RouterView />
      </div>

      <!-- Footer -->
      <p class="mt-6 text-center text-xs text-muted-foreground">
        &copy; {{ new Date().getFullYear() }} Tenaxis. All rights reserved.
      </p>
    </div>
  </div>
</template>
