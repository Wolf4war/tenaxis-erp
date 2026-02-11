<script setup lang="ts">
/* ============================================
   TENAXIS - Asset Detail View
   View asset details
   ============================================ */

import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAssetStore, useAuthStore } from '@/stores';
import { usePermission } from '@/composables';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@/components/ui';
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-vue-next';
import { ASSET_STATUSES, ASSET_CONDITIONS } from '@/lib/constants';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Asset, AssetStatus } from '@/types';

const route = useRoute();
const router = useRouter();
const assetStore = useAssetStore();
const authStore = useAuthStore();
const { can } = usePermission();

const isLoading = ref(true);
const asset = ref<Asset | null>(null);

const assetId = computed(() => route.params.id as string);

// Get status label
const getStatusLabel = (status: AssetStatus): string => {
  const found = ASSET_STATUSES.find((s) => s.value === status);
  return found?.label || status;
};

// Get condition label
const getConditionLabel = (condition: string): string => {
  const found = ASSET_CONDITIONS.find((c) => c.value === condition);
  return found?.label || condition;
};

// Status badge variant mapper
const getStatusVariant = (status: AssetStatus): 'success' | 'default' | 'warning' | 'destructive' | 'secondary' => {
  const variants: Record<string, 'success' | 'default' | 'warning' | 'destructive' | 'secondary'> = {
    available: 'success',
    in_use: 'default',
    under_maintenance: 'warning',
    lost: 'destructive',
    disposed: 'secondary',
    reserved: 'secondary',
  };
  return variants[status] || 'default';
};

onMounted(async () => {
  if (authStore.tenantId) {
    assetStore.initialize(authStore.tenantId);
    await loadAsset();
  }
});

const loadAsset = async () => {
  isLoading.value = true;
  try {
    asset.value = await assetStore.fetchAsset(assetId.value);
    if (!asset.value) {
      router.push('/assets');
    }
  } finally {
    isLoading.value = false;
  }
};

const editAsset = () => {
  router.push(`/assets/${assetId.value}/edit`);
};

const deleteAsset = async () => {
  if (asset.value && confirm(`Are you sure you want to dispose "${asset.value.name}"?`)) {
    await assetStore.disposeAsset(asset.value.id!, 'User requested deletion');
    router.push('/assets');
  }
};

const goBack = () => {
  router.push('/assets');
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="sm" @click="goBack">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <div>
          <h1 class="text-2xl font-bold">Asset Details</h1>
          <p class="text-muted-foreground">
            View asset information
          </p>
        </div>
      </div>

      <div v-if="asset" class="flex items-center gap-2">
        <Button
          v-if="can('assets', 'update')"
          variant="outline"
          @click="editAsset"
        >
          <Edit class="h-4 w-4" />
          Edit
        </Button>
        <Button
          v-if="can('assets', 'delete')"
          variant="destructive"
          @click="deleteAsset"
        >
          <Trash2 class="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>

    <!-- Asset details -->
    <template v-else-if="asset">
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Basic Information -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Package class="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted-foreground">Name</p>
                <p class="font-medium">{{ asset.name }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Asset Tag</p>
                <p class="font-mono font-medium">{{ asset.asset_tag }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Status</p>
                <Badge :variant="getStatusVariant(asset.status)">
                  {{ getStatusLabel(asset.status) }}
                </Badge>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Condition</p>
                <p class="font-medium">{{ getConditionLabel(asset.condition) }}</p>
              </div>
              <div v-if="asset.brand">
                <p class="text-sm text-muted-foreground">Brand</p>
                <p class="font-medium">{{ asset.brand }}</p>
              </div>
              <div v-if="asset.model">
                <p class="text-sm text-muted-foreground">Model</p>
                <p class="font-medium">{{ asset.model }}</p>
              </div>
              <div v-if="asset.serial_number" class="col-span-2">
                <p class="text-sm text-muted-foreground">Serial Number</p>
                <p class="font-mono font-medium">{{ asset.serial_number }}</p>
              </div>
            </div>

            <div v-if="asset.description">
              <p class="text-sm text-muted-foreground">Description</p>
              <p>{{ asset.description }}</p>
            </div>
          </CardContent>
        </Card>

        <!-- Financial Information -->
        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div v-if="asset.purchase_price">
                <p class="text-sm text-muted-foreground">Purchase Price</p>
                <p class="font-medium">
                  {{ formatCurrency(asset.purchase_price, asset.currency) }}
                </p>
              </div>
              <div v-if="asset.purchase_date">
                <p class="text-sm text-muted-foreground">Purchase Date</p>
                <p class="font-medium">{{ formatDate(asset.purchase_date as any) }}</p>
              </div>
              <div v-if="asset.invoice_number">
                <p class="text-sm text-muted-foreground">Invoice Number</p>
                <p class="font-mono font-medium">{{ asset.invoice_number }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Warranty Information -->
        <Card v-if="asset.warranty_expires">
          <CardHeader>
            <CardTitle>Warranty</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted-foreground">Warranty Expires</p>
                <p class="font-medium">{{ formatDate(asset.warranty_expires as any) }}</p>
              </div>
              <div v-if="asset.warranty_provider">
                <p class="text-sm text-muted-foreground">Provider</p>
                <p class="font-medium">{{ asset.warranty_provider }}</p>
              </div>
            </div>
            <div v-if="asset.warranty_notes">
              <p class="text-sm text-muted-foreground">Notes</p>
              <p>{{ asset.warranty_notes }}</p>
            </div>
          </CardContent>
        </Card>

        <!-- Audit Information -->
        <Card>
          <CardHeader>
            <CardTitle>Audit Trail</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted-foreground">Created At</p>
                <p class="font-medium">{{ formatDate(asset.created_at as any) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">Updated At</p>
                <p class="font-medium">{{ formatDate(asset.updated_at as any) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>

    <!-- Not found -->
    <template v-else>
      <Card>
        <CardContent class="py-12 text-center">
          <p class="text-muted-foreground">Asset not found</p>
          <Button class="mt-4" @click="goBack">
            Back to Assets
          </Button>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
