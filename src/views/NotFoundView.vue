<script setup lang="ts">
/* ============================================
   TENAXIS - 404 Not Found View
   ============================================ */

import { useRouter } from 'vue-router';
import { Button } from '@/components/ui';
import { Home, ArrowLeft } from 'lucide-vue-next';

const router = useRouter();

const goHome = () => {
  router.push('/');
};

const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-muted-foreground/30">404</h1>
      <h2 class="mt-4 text-2xl font-bold">Page Not Found</h2>
      <p class="mt-2 text-muted-foreground">
        Sorry, the page you're looking for doesn't exist or has been moved.
      </p>
      <div class="mt-8 flex items-center justify-center gap-4">
        <Button variant="outline" @click="goBack">
          <ArrowLeft class="h-4 w-4" />
          Go Back
        </Button>
        <Button @click="goHome">
          <Home class="h-4 w-4" />
          Go Home
        </Button>
      </div>
    </div>
  </div>
</template>
