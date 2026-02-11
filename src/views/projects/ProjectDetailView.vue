<script setup lang="ts">
/* ============================================
   TENAXIS - Project Detail View (Placeholder)
   View project details
   ============================================ */

import { useRouter } from 'vue-router';
import { Button } from '@/components/ui';
import { ArrowLeft, Construction } from 'lucide-vue-next';

const router = useRouter();
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="router.back()">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <div>
        <h1 class="text-2xl font-bold">Project Details</h1>
        <p class="text-muted-foreground">View project information</p>
      </div>
    </div>

    <div class="flex flex-col items-center justify-center py-16 text-center">
      <Construction class="h-16 w-16 text-muted-foreground mb-4" />
      <h2 class="text-xl font-semibold">Coming Soon</h2>
      <p class="text-muted-foreground mt-2">This page is under development.</p>
    </div>
  </div>
</template>
