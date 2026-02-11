/* ============================================
   TENAXIS - Asset Service
   Service layer for asset management operations
   ============================================ */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BaseService } from './base.service';
import { COLLECTIONS } from '@/lib/constants';
import type {
  Asset,
  AssetEvent,
  AssetEventType,
  AssetStatus,
  AssetCategory,
} from '@/types';

// ==========================================
// ASSET SERVICE
// ==========================================

class AssetService extends BaseService<Asset> {
  constructor() {
    super(COLLECTIONS.ASSETS);
  }

  /**
   * Get assets by office
   */
  async getByOffice(officeId: string): Promise<Asset[]> {
    return this.getAll([
      where('office_id', '==', officeId),
      orderBy('created_at', 'desc'),
    ]);
  }

  /**
   * Get assets by status
   */
  async getByStatus(status: AssetStatus): Promise<Asset[]> {
    return this.getAll([
      where('status', '==', status),
      orderBy('created_at', 'desc'),
    ]);
  }

  /**
   * Get assets assigned to a user
   */
  async getByAssignedUser(userId: string): Promise<Asset[]> {
    return this.getAll([
      where('assigned_to', '==', userId),
      where('status', '==', 'in_use'),
      orderBy('assigned_at', 'desc'),
    ]);
  }

  /**
   * Get assets by category
   */
  async getByCategory(categoryId: string): Promise<Asset[]> {
    return this.getAll([
      where('category_id', '==', categoryId),
      orderBy('created_at', 'desc'),
    ]);
  }

  /**
   * Get assets with expiring warranty
   */
  async getExpiringWarranty(daysAhead: number = 30): Promise<Asset[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return this.getAll([
      where('warranty_expires', '<=', Timestamp.fromDate(futureDate)),
      where('warranty_expires', '>', Timestamp.now()),
      orderBy('warranty_expires', 'asc'),
    ]);
  }

  /**
   * Search assets by asset tag or name
   */
  async search(searchTerm: string): Promise<Asset[]> {
    // Search by asset tag (prefix match)
    const byTag = await this.getAll([
      where('asset_tag', '>=', searchTerm.toUpperCase()),
      where('asset_tag', '<=', searchTerm.toUpperCase() + '\uf8ff'),
      limit(20),
    ]);
    
    return byTag;
  }

  /**
   * Create asset with initial event
   */
  async createWithEvent(
    data: Omit<Asset, 'id'>,
    userId: string
  ): Promise<Asset> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const batch = writeBatch(db);
    
    // Create asset document
    const assetRef = doc(collection(db, 'tenants', this.tenantId, COLLECTIONS.ASSETS));
    const now = Timestamp.now();
    const assetData = {
      ...data,
      tenant_id: this.tenantId,
      created_at: now,
      created_by: userId,
      updated_at: now,
      updated_by: userId,
    };
    batch.set(assetRef, assetData);
    
    // Create initial event
    const eventRef = doc(collection(assetRef, COLLECTIONS.ASSET_EVENTS));
    const eventData: Omit<AssetEvent, 'id'> = {
      tenant_id: this.tenantId,
      asset_id: assetRef.id,
      event_type: 'created',
      description: `Asset ${data.asset_tag} created`,
      created_at: now,
      created_by: userId,
    };
    batch.set(eventRef, eventData);
    
    await batch.commit();
    
    return { id: assetRef.id, ...assetData } as Asset;
  }

  /**
   * Assign asset to user
   */
  async assignToUser(
    assetId: string,
    userId: string,
    assignedBy: string
  ): Promise<void> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const batch = writeBatch(db);
    const now = Timestamp.now();
    
    // Get current asset data
    const asset = await this.getById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }
    
    // Update asset
    const assetRef = doc(db, 'tenants', this.tenantId, COLLECTIONS.ASSETS, assetId);
    batch.update(assetRef, {
      assigned_to: userId,
      assigned_at: now,
      status: 'in_use',
      updated_at: now,
      updated_by: assignedBy,
    });
    
    // Create assignment event
    const eventRef = doc(collection(assetRef, COLLECTIONS.ASSET_EVENTS));
    const eventData: Omit<AssetEvent, 'id'> = {
      tenant_id: this.tenantId,
      asset_id: assetId,
      event_type: 'assigned',
      description: `Asset assigned to user`,
      from_user_id: asset.assigned_to || undefined,
      to_user_id: userId,
      created_at: now,
      created_by: assignedBy,
    };
    batch.set(eventRef, eventData);
    
    await batch.commit();
  }

  /**
   * Unassign asset from user
   */
  async unassign(assetId: string, unassignedBy: string): Promise<void> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const batch = writeBatch(db);
    const now = Timestamp.now();
    
    // Get current asset data
    const asset = await this.getById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }
    
    // Update asset
    const assetRef = doc(db, 'tenants', this.tenantId, COLLECTIONS.ASSETS, assetId);
    batch.update(assetRef, {
      assigned_to: null,
      assigned_at: null,
      status: 'available',
      updated_at: now,
      updated_by: unassignedBy,
    });
    
    // Create unassignment event
    const eventRef = doc(collection(assetRef, COLLECTIONS.ASSET_EVENTS));
    const eventData: Omit<AssetEvent, 'id'> = {
      tenant_id: this.tenantId,
      asset_id: assetId,
      event_type: 'unassigned',
      description: `Asset unassigned from user`,
      from_user_id: asset.assigned_to || undefined,
      created_at: now,
      created_by: unassignedBy,
    };
    batch.set(eventRef, eventData);
    
    await batch.commit();
  }

  /**
   * Transfer asset to another office
   */
  async transferToOffice(
    assetId: string,
    toOfficeId: string,
    transferredBy: string,
    notes?: string
  ): Promise<void> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const batch = writeBatch(db);
    const now = Timestamp.now();
    
    // Get current asset data
    const asset = await this.getById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }
    
    const fromOfficeId = asset.office_id;
    
    // Update asset
    const assetRef = doc(db, 'tenants', this.tenantId, COLLECTIONS.ASSETS, assetId);
    batch.update(assetRef, {
      office_id: toOfficeId,
      assigned_to: null, // Unassign when transferring
      assigned_at: null,
      status: 'available',
      updated_at: now,
      updated_by: transferredBy,
    });
    
    // Create transfer event
    const eventRef = doc(collection(assetRef, COLLECTIONS.ASSET_EVENTS));
    const eventData: Omit<AssetEvent, 'id'> = {
      tenant_id: this.tenantId,
      asset_id: assetId,
      event_type: 'transferred',
      description: notes || `Asset transferred to another office`,
      from_office_id: fromOfficeId,
      to_office_id: toOfficeId,
      created_at: now,
      created_by: transferredBy,
    };
    batch.set(eventRef, eventData);
    
    await batch.commit();
  }

  /**
   * Dispose of an asset
   */
  async dispose(
    assetId: string,
    reason: string,
    disposalValue: number | undefined,
    disposedBy: string
  ): Promise<void> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const batch = writeBatch(db);
    const now = Timestamp.now();
    
    // Update asset
    const assetRef = doc(db, 'tenants', this.tenantId, COLLECTIONS.ASSETS, assetId);
    batch.update(assetRef, {
      status: 'disposed',
      disposal_date: now,
      disposal_reason: reason,
      disposal_value: disposalValue || null,
      assigned_to: null,
      assigned_at: null,
      updated_at: now,
      updated_by: disposedBy,
    });
    
    // Create disposal event
    const eventRef = doc(collection(assetRef, COLLECTIONS.ASSET_EVENTS));
    const eventData: Omit<AssetEvent, 'id'> = {
      tenant_id: this.tenantId,
      asset_id: assetId,
      event_type: 'disposed',
      description: reason,
      metadata: { disposal_value: disposalValue },
      created_at: now,
      created_by: disposedBy,
    };
    batch.set(eventRef, eventData);
    
    await batch.commit();
  }

  /**
   * Get asset events/history
   */
  async getEvents(assetId: string): Promise<AssetEvent[]> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const eventsRef = collection(
      db,
      'tenants',
      this.tenantId,
      COLLECTIONS.ASSETS,
      assetId,
      COLLECTIONS.ASSET_EVENTS
    );
    
    const q = query(eventsRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AssetEvent[];
  }

  /**
   * Log a custom event
   */
  async logEvent(
    assetId: string,
    eventType: AssetEventType,
    description: string,
    userId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const eventsRef = collection(
      db,
      'tenants',
      this.tenantId,
      COLLECTIONS.ASSETS,
      assetId,
      COLLECTIONS.ASSET_EVENTS
    );
    
    await addDoc(eventsRef, {
      tenant_id: this.tenantId,
      asset_id: assetId,
      event_type: eventType,
      description,
      metadata,
      created_at: Timestamp.now(),
      created_by: userId,
    });
  }

  /**
   * Get asset statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<AssetStatus, number>;
    byCondition: Record<string, number>;
  }> {
    const assets = await this.getAll([]);
    
    const byStatus: Record<string, number> = {};
    const byCondition: Record<string, number> = {};
    
    for (const asset of assets) {
      byStatus[asset.status] = (byStatus[asset.status] || 0) + 1;
      byCondition[asset.condition] = (byCondition[asset.condition] || 0) + 1;
    }
    
    return {
      total: assets.length,
      byStatus: byStatus as Record<AssetStatus, number>,
      byCondition,
    };
  }
}

// ==========================================
// ASSET CATEGORY SERVICE
// ==========================================

class AssetCategoryService extends BaseService<AssetCategory> {
  constructor() {
    super(COLLECTIONS.ASSET_CATEGORIES);
  }

  /**
   * Get active categories
   */
  async getActive(): Promise<AssetCategory[]> {
    return this.getAll([
      where('status', '==', 'active'),
      orderBy('name', 'asc'),
    ]);
  }

  /**
   * Get categories as tree structure
   */
  async getCategoryTree(): Promise<AssetCategory[]> {
    const categories = await this.getActive();
    
    // Build tree structure
    const rootCategories = categories.filter(c => !c.parent_id);
    
    const buildTree = (parent: AssetCategory): AssetCategory & { children?: AssetCategory[] } => {
      const children = categories.filter(c => c.parent_id === parent.id);
      return {
        ...parent,
        children: children.length > 0 ? children.map(buildTree) : undefined,
      };
    };
    
    return rootCategories.map(buildTree);
  }
}

// ==========================================
// SINGLETON EXPORTS
// ==========================================

export const assetService = new AssetService();
export const assetCategoryService = new AssetCategoryService();
