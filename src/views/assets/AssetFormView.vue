<script setup lang="ts">
/* ============================================
   TENAXIS - Asset Form View
   Create and edit asset form
   ============================================ */

import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAssetStore, useAuthStore } from '@/stores';
import {
  Button,
  Input,
  Label,
  Select,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@/components/ui';
import { ArrowLeft, Save } from 'lucide-vue-next';
import { ASSET_STATUSES, ASSET_CONDITIONS, CURRENCIES } from '@/lib/constants';
import { generateAssetTag } from '@/lib/utils';
import type { AssetStatus, AssetCondition } from '@/types';

const route = useRoute();
const router = useRouter();
const assetStore = useAssetStore();
const authStore = useAuthStore();

const isLoading = ref(false);
const isSaving = ref(false);
const isEditMode = computed(() => !!route.params.id);
const assetId = computed(() => route.params.id as string | undefined);

// Form state - matching Asset interface
const form = ref({
  name: '',
  asset_tag: '',
  description: '',
  category_id: '',
  brand: '',
  model: '',
  serial_number: '',
  status: 'available' as AssetStatus,
  condition: 'good' as AssetCondition,
  purchase_price: undefined as number | undefined,
  currency: 'USD',
  vendor_id: '',
  invoice_number: '',
});

// Validation errors
const errors = ref<Record<string, string>>({});

// Options for selects
const statusOptions = ASSET_STATUSES.map((s) => ({
  value: s.value,
  label: s.label,
}));

const conditionOptions = ASSET_CONDITIONS.map((c) => ({
  value: c.value,
  label: c.label,
}));

const currencyOptions = CURRENCIES.map((c) => ({
  value: c.value,
  label: c.label,
}));

onMounted(async () => {
  if (isEditMode.value && assetId.value) {
    await loadAsset();
  } else {
    // Generate asset tag for new assets
    form.value.asset_tag = generateAssetTag();
  }
});

const loadAsset = async () => {
  isLoading.value = true;
  try {
    const asset = await assetStore.fetchAsset(assetId.value!);
    if (asset) {
      form.value = {
        name: asset.name,
        asset_tag: asset.asset_tag,
        description: asset.description || '',
        category_id: asset.category_id,
        brand: asset.brand || '',
        model: asset.model || '',
        serial_number: asset.serial_number || '',
        status: asset.status,
        condition: asset.condition,
        purchase_price: asset.purchase_price,
        currency: asset.currency || 'USD',
        vendor_id: asset.vendor_id || '',
        invoice_number: asset.invoice_number || '',
      };
    } else {
      router.push('/assets');
    }
  } finally {
    isLoading.value = false;
  }
};

const validate = (): boolean => {
  errors.value = {};

  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required';
  }

  if (!form.value.asset_tag.trim()) {
    errors.value.asset_tag = 'Asset tag is required';
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;

  isSaving.value = true;
  try {
    const data = {
      ...form.value,
      tenant_id: authStore.tenantId!,
      organization_id: authStore.currentUser?.organization_id || '',
      company_id: authStore.currentUser?.accessible_companies?.[0] || '',
      office_id: authStore.currentUser?.primary_office_id || '',
    };

    if (isEditMode.value && assetId.value) {
      await assetStore.updateAsset(assetId.value, data);
    } else {
      await assetStore.createAsset(data as any);
    }

    router.push('/assets');
  } finally {
    isSaving.value = false;
  }
};

const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="sm" @click="goBack">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <div>
        <h1 class="text-2xl font-bold">
          {{ isEditMode ? 'Edit Asset' : 'New Asset' }}
        </h1>
        <p class="text-muted-foreground">
          {{ isEditMode ? 'Update asset information' : 'Register a new asset' }}
        </p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>

    <!-- Form -->
    <form v-else class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Basic Information -->
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="name" required>Name</Label>
              <Input
                id="name"
                v-model="form.name"
                placeholder="Enter asset name"
                :error="!!errors.name"
              />
              <p v-if="errors.name" class="text-sm text-destructive">
                {{ errors.name }}
              </p>
            </div>

            <div class="space-y-2">
              <Label for="asset_tag">Asset Tag</Label>
              <Input
                id="asset_tag"
                v-model="form.asset_tag"
                placeholder="Auto-generated"
                class="font-mono"
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="status" required>Status</Label>
              <Select
                id="status"
                v-model="form.status"
                :options="statusOptions"
              />
            </div>

            <div class="space-y-2">
              <Label for="condition">Condition</Label>
              <Select
                id="condition"
                v-model="form.condition"
                :options="conditionOptions"
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <div class="space-y-2">
              <Label for="brand">Brand</Label>
              <Input
                id="brand"
                v-model="form.brand"
                placeholder="e.g., Dell"
              />
            </div>

            <div class="space-y-2">
              <Label for="model">Model</Label>
              <Input
                id="model"
                v-model="form.model"
                placeholder="e.g., Latitude 5520"
              />
            </div>

            <div class="space-y-2">
              <Label for="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                v-model="form.serial_number"
                placeholder="Enter serial number"
                class="font-mono"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="description">Description</Label>
            <Textarea
              id="description"
              v-model="form.description"
              placeholder="Additional details about the asset..."
              :rows="3"
            />
          </div>
        </CardContent>
      </Card>

      <!-- Financial Information -->
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="space-y-2">
              <Label for="purchase_price">Purchase Price</Label>
              <Input
                id="purchase_price"
                v-model.number="form.purchase_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div class="space-y-2">
              <Label for="currency">Currency</Label>
              <Select
                id="currency"
                v-model="form.currency"
                :options="currencyOptions"
              />
            </div>

            <div class="space-y-2">
              <Label for="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                v-model="form.invoice_number"
                placeholder="Enter invoice number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Form actions -->
      <div class="flex justify-end gap-3">
        <Button type="button" variant="outline" @click="goBack">
          Cancel
        </Button>
        <Button type="submit" :loading="isSaving">
          <Save class="h-4 w-4" />
          {{ isEditMode ? 'Update Asset' : 'Create Asset' }}
        </Button>
      </div>
    </form>
  </div>
</template>
