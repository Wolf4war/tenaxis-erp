/* ============================================
   TENAXIS - Asset Store
   State management for asset module
   ============================================ */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { assetService, assetCategoryService, auditLogService } from '@/services';
import { useAuthStore } from './auth.store';
import type { Asset, AssetCategory, AssetEvent, AssetStatus, QueryParams } from '@/types';

export const useAssetStore = defineStore('assets', () => {
  // ==========================================
  // STATE
  // ==========================================

  const assets = ref<Asset[]>([]);
  const categories = ref<AssetCategory[]>([]);
  const currentAsset = ref<Asset | null>(null);
  const assetEvents = ref<AssetEvent[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Filters
  const filters = ref<{
    status?: AssetStatus;
    categoryId?: string;
    officeId?: string;
    search?: string;
  }>({});

  // Pagination
  const pagination = ref({
    page: 1,
    pageSize: 25,
    total: 0,
    hasMore: false,
  });

  // ==========================================
  // GETTERS
  // ==========================================

  const assetCount = computed(() => assets.value.length);
  
  const assetsByStatus = computed(() => {
    const grouped: Record<AssetStatus, Asset[]> = {
      available: [],
      in_use: [],
      under_maintenance: [],
      disposed: [],
      lost: [],
      reserved: [],
    };
    
    for (const asset of assets.value) {
      grouped[asset.status].push(asset);
    }
    
    return grouped;
  });

  const availableAssets = computed(() => 
    assets.value.filter(a => a.status === 'available')
  );

  const assetsInUse = computed(() => 
    assets.value.filter(a => a.status === 'in_use')
  );

  const categoryOptions = computed(() => 
    categories.value.map(c => ({ value: c.id, label: c.name }))
  );

  // ==========================================
  // ACTIONS
  // ==========================================

  const authStore = useAuthStore();

  /**
   * Initialize store with tenant context
   */
  function initialize(tenantId: string): void {
    assetService.setTenant(tenantId);
    assetCategoryService.setTenant(tenantId);
  }

  /**
   * Fetch all assets
   */
  async function fetchAssets(params?: QueryParams): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await assetService.getPaginated(params || {});
      assets.value = result.data;
      pagination.value = {
        page: result.page,
        pageSize: result.page_size,
        total: result.total,
        hasMore: result.has_more,
      };
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch assets';
      console.error('Fetch assets error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch assets by office
   */
  async function fetchByOffice(officeId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      assets.value = await assetService.getByOffice(officeId);
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch assets';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch single asset by ID
   */
  async function fetchAsset(assetId: string): Promise<Asset | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const asset = await assetService.getById(assetId);
      currentAsset.value = asset;
      
      if (asset) {
        assetEvents.value = await assetService.getEvents(assetId);
      }
      
      return asset;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch asset';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Fetch asset categories
   */
  async function fetchCategories(): Promise<void> {
    try {
      categories.value = await assetCategoryService.getActive();
    } catch (err: any) {
      console.error('Fetch categories error:', err);
    }
  }

  /**
   * Create new asset
   */
  async function createAsset(data: Omit<Asset, 'id'>): Promise<Asset | null> {
    isLoading.value = true;
    error.value = null;

    try {
      const userId = authStore.userId!;
      const asset = await assetService.createWithEvent(data, userId);
      
      // Log audit
      await auditLogService.logCreate(
        'assets',
        'asset',
        asset.id,
        asset.name,
        {
          id: userId,
          email: authStore.userEmail!,
          name: authStore.userName,
        },
        authStore.organizationId!
      );

      assets.value.unshift(asset);
      return asset;
    } catch (err: any) {
      error.value = err.message || 'Failed to create asset';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update asset
   */
  async function updateAsset(
    assetId: string,
    data: Partial<Asset>
  ): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const userId = authStore.userId!;
      const oldAsset = assets.value.find(a => a.id === assetId);
      
      await assetService.update(assetId, data, userId);

      // Log audit with changes
      const changes = Object.keys(data).map(key => ({
        field: key,
        old_value: oldAsset ? (oldAsset as any)[key] : null,
        new_value: (data as any)[key],
      }));

      await auditLogService.logUpdate(
        'assets',
        'asset',
        assetId,
        oldAsset?.name || '',
        changes,
        {
          id: userId,
          email: authStore.userEmail!,
          name: authStore.userName,
        },
        authStore.organizationId!
      );

      // Update local state
      const index = assets.value.findIndex(a => a.id === assetId);
      if (index !== -1) {
        assets.value[index] = { ...assets.value[index], ...data } as Asset;
      }

      if (currentAsset.value?.id === assetId) {
        currentAsset.value = { ...currentAsset.value, ...data } as Asset;
      }

      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to update asset';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Assign asset to user
   */
  async function assignAsset(assetId: string, userId: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const assignedBy = authStore.userId!;
      await assetService.assignToUser(assetId, userId, assignedBy);

      // Update local state
      const index = assets.value.findIndex(a => a.id === assetId);
      if (index !== -1 && assets.value[index]) {
        const asset = assets.value[index];
        asset.assigned_to = userId;
        asset.status = 'in_use';
      }

      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to assign asset';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Unassign asset
   */
  async function unassignAsset(assetId: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const unassignedBy = authStore.userId!;
      await assetService.unassign(assetId, unassignedBy);

      // Update local state
      const index = assets.value.findIndex(a => a.id === assetId);
      if (index !== -1 && assets.value[index]) {
        const asset = assets.value[index];
        asset.assigned_to = undefined;
        asset.status = 'available';
      }

      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to unassign asset';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Transfer asset to another office
   */
  async function transferAsset(
    assetId: string,
    toOfficeId: string,
    notes?: string
  ): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const transferredBy = authStore.userId!;
      await assetService.transferToOffice(assetId, toOfficeId, transferredBy, notes);

      // Update local state
      const index = assets.value.findIndex(a => a.id === assetId);
      if (index !== -1 && assets.value[index]) {
        const asset = assets.value[index];
        asset.office_id = toOfficeId;
        asset.assigned_to = undefined;
        asset.status = 'available';
      }

      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to transfer asset';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Dispose asset
   */
  async function disposeAsset(
    assetId: string,
    reason: string,
    disposalValue?: number
  ): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const disposedBy = authStore.userId!;
      await assetService.dispose(assetId, reason, disposalValue, disposedBy);

      // Update local state
      const index = assets.value.findIndex(a => a.id === assetId);
      if (index !== -1 && assets.value[index]) {
        assets.value[index].status = 'disposed';
      }

      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to dispose asset';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Search assets
   */
  async function searchAssets(searchTerm: string): Promise<void> {
    if (!searchTerm.trim()) {
      await fetchAssets();
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      assets.value = await assetService.search(searchTerm);
    } catch (err: any) {
      error.value = err.message || 'Search failed';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Get statistics
   */
  async function getStatistics(): Promise<{
    total: number;
    byStatus: Record<AssetStatus, number>;
    byCondition: Record<string, number>;
  } | null> {
    try {
      return await assetService.getStatistics();
    } catch (err) {
      console.error('Get statistics error:', err);
      return null;
    }
  }

  /**
   * Set filters
   */
  function setFilters(newFilters: typeof filters.value): void {
    filters.value = { ...filters.value, ...newFilters };
  }

  /**
   * Clear filters
   */
  function clearFilters(): void {
    filters.value = {};
  }

  /**
   * Reset store
   */
  function $reset(): void {
    assets.value = [];
    categories.value = [];
    currentAsset.value = null;
    assetEvents.value = [];
    isLoading.value = false;
    error.value = null;
    filters.value = {};
    pagination.value = {
      page: 1,
      pageSize: 25,
      total: 0,
      hasMore: false,
    };
  }

  // ==========================================
  // RETURN
  // ==========================================

  return {
    // State
    assets,
    categories,
    currentAsset,
    assetEvents,
    isLoading,
    error,
    filters,
    pagination,

    // Getters
    assetCount,
    assetsByStatus,
    availableAssets,
    assetsInUse,
    categoryOptions,

    // Actions
    initialize,
    fetchAssets,
    fetchByOffice,
    fetchAsset,
    fetchCategories,
    createAsset,
    updateAsset,
    assignAsset,
    unassignAsset,
    transferAsset,
    disposeAsset,
    searchAssets,
    getStatistics,
    setFilters,
    clearFilters,
    $reset,
  };
});
