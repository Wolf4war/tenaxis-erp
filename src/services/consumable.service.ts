/* ============================================
   TENAXIS - Consumable & Stock Service
   Service layer for inventory management
   ============================================ */

import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BaseService } from './base.service';
import { COLLECTIONS } from '@/lib/constants';
import type {
  Consumable,
  ConsumableCategory,
  OfficeStock,
  StockTransaction,
} from '@/types';

// ==========================================
// CONSUMABLE SERVICE
// ==========================================

class ConsumableService extends BaseService<Consumable> {
  constructor() {
    super(COLLECTIONS.CONSUMABLES);
  }

  /**
   * Get consumables by category
   */
  async getByCategory(categoryId: string): Promise<Consumable[]> {
    return this.getAll([
      where('category_id', '==', categoryId),
      where('status', '==', 'active'),
      orderBy('name', 'asc'),
    ]);
  }

  /**
   * Get active consumables
   */
  async getActive(): Promise<Consumable[]> {
    return this.getAll([
      where('status', '==', 'active'),
      orderBy('name', 'asc'),
    ]);
  }

  /**
   * Search consumables by name or SKU
   */
  async search(searchTerm: string): Promise<Consumable[]> {
    const term = searchTerm.toUpperCase();
    
    const bySku = await this.getAll([
      where('sku', '>=', term),
      where('sku', '<=', term + '\uf8ff'),
      where('status', '==', 'active'),
    ]);

    return bySku;
  }
}

// ==========================================
// CONSUMABLE CATEGORY SERVICE
// ==========================================

class ConsumableCategoryService extends BaseService<ConsumableCategory> {
  constructor() {
    super(COLLECTIONS.CONSUMABLE_CATEGORIES);
  }

  /**
   * Get active categories
   */
  async getActive(): Promise<ConsumableCategory[]> {
    return this.getAll([
      where('status', '==', 'active'),
      orderBy('name', 'asc'),
    ]);
  }
}

// ==========================================
// STOCK SERVICE
// ==========================================

class StockService {
  private tenantId: string | null = null;

  setTenant(tenantId: string): void {
    this.tenantId = tenantId;
  }

  private getStockCollectionRef() {
    if (!this.tenantId) throw new Error('Tenant ID must be set');
    return collection(db, 'tenants', this.tenantId, COLLECTIONS.OFFICE_STOCK);
  }

  private getTransactionCollectionRef() {
    if (!this.tenantId) throw new Error('Tenant ID must be set');
    return collection(db, 'tenants', this.tenantId, COLLECTIONS.STOCK_TRANSACTIONS);
  }

  /**
   * Get stock for an office
   */
  async getOfficeStock(officeId: string): Promise<OfficeStock[]> {
    const q = query(
      this.getStockCollectionRef(),
      where('office_id', '==', officeId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OfficeStock[];
  }

  /**
   * Get stock for a specific consumable in an office
   */
  async getConsumableStock(
    officeId: string,
    consumableId: string
  ): Promise<OfficeStock | null> {
    const q = query(
      this.getStockCollectionRef(),
      where('office_id', '==', officeId),
      where('consumable_id', '==', consumableId)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty || !snapshot.docs[0]) return null;
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as OfficeStock;
  }

  /**
   * Get low stock items across all offices
   */
  async getLowStockItems(): Promise<Array<OfficeStock & { consumable?: Consumable }>> {
    if (!this.tenantId) throw new Error('Tenant ID must be set');

    // Get all consumables first to know minimum stock levels
    const consumableService = new ConsumableService();
    consumableService.setTenant(this.tenantId);
    const consumables = await consumableService.getActive();
    const consumableMap = new Map(consumables.map(c => [c.id, c]));

    // Get all stock records
    const snapshot = await getDocs(this.getStockCollectionRef());
    const allStock = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OfficeStock[];

    // Filter for low stock
    return allStock
      .filter(stock => {
        const consumable = consumableMap.get(stock.consumable_id);
        return consumable && (stock.quantity ?? 0) <= (consumable.minimum_stock ?? 0);
      })
      .map(stock => ({
        ...stock,
        consumable: consumableMap.get(stock.consumable_id),
      }));
  }

  /**
   * Restock consumable
   */
  async restock(
    officeId: string,
    consumableId: string,
    quantity: number,
    userId: string,
    notes?: string
  ): Promise<void> {
    if (!this.tenantId) throw new Error('Tenant ID must be set');

    const batch = writeBatch(db);
    const now = Timestamp.now();

    // Check if stock record exists
    const existingStock = await this.getConsumableStock(officeId, consumableId);

    if (existingStock) {
      // Update existing stock
      const stockRef = doc(this.getStockCollectionRef(), existingStock.id);
      batch.update(stockRef, {
        quantity: increment(quantity),
        last_restocked: now,
        updated_at: now,
      });
    } else {
      // Create new stock record
      const stockRef = doc(this.getStockCollectionRef());
      batch.set(stockRef, {
        tenant_id: this.tenantId,
        office_id: officeId,
        consumable_id: consumableId,
        quantity: quantity,
        last_restocked: now,
        updated_at: now,
      });
    }

    // Create transaction record
    const transactionRef = doc(this.getTransactionCollectionRef());
    const transactionData: Omit<StockTransaction, 'id'> = {
      tenant_id: this.tenantId,
      office_id: officeId,
      consumable_id: consumableId,
      type: 'restock',
      quantity: quantity,
      notes,
      created_at: now,
      created_by: userId,
    };
    batch.set(transactionRef, transactionData);

    await batch.commit();
  }

  /**
   * Issue consumable to user
   */
  async issue(
    officeId: string,
    consumableId: string,
    quantity: number,
    issuedTo: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    if (!this.tenantId) throw new Error('Tenant ID must be set');

    const existingStock = await this.getConsumableStock(officeId, consumableId);
    if (!existingStock || existingStock.quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    const batch = writeBatch(db);
    const now = Timestamp.now();

    // Update stock
    const stockRef = doc(this.getStockCollectionRef(), existingStock.id);
    batch.update(stockRef, {
      quantity: increment(-quantity),
      last_issued: now,
      updated_at: now,
    });

    // Create transaction record
    const transactionRef = doc(this.getTransactionCollectionRef());
    const transactionData: Omit<StockTransaction, 'id'> = {
      tenant_id: this.tenantId,
      office_id: officeId,
      consumable_id: consumableId,
      type: 'issue',
      quantity: quantity,
      issued_to: issuedTo,
      notes,
      created_at: now,
      created_by: userId,
    };
    batch.set(transactionRef, transactionData);

    await batch.commit();
  }

  /**
   * Transfer stock between offices
   */
  async transfer(
    fromOfficeId: string,
    toOfficeId: string,
    consumableId: string,
    quantity: number,
    userId: string,
    notes?: string
  ): Promise<void> {
    if (!this.tenantId) throw new Error('Tenant ID must be set');

    // Check source stock
    const sourceStock = await this.getConsumableStock(fromOfficeId, consumableId);
    if (!sourceStock || sourceStock.quantity < quantity) {
      throw new Error('Insufficient stock in source office');
    }

    const batch = writeBatch(db);
    const now = Timestamp.now();

    // Decrease source office stock
    const sourceRef = doc(this.getStockCollectionRef(), sourceStock.id);
    batch.update(sourceRef, {
      quantity: increment(-quantity),
      updated_at: now,
    });

    // Increase destination office stock
    const destStock = await this.getConsumableStock(toOfficeId, consumableId);
    if (destStock) {
      const destRef = doc(this.getStockCollectionRef(), destStock.id);
      batch.update(destRef, {
        quantity: increment(quantity),
        updated_at: now,
      });
    } else {
      const destRef = doc(this.getStockCollectionRef());
      batch.set(destRef, {
        tenant_id: this.tenantId,
        office_id: toOfficeId,
        consumable_id: consumableId,
        quantity: quantity,
        updated_at: now,
      });
    }

    // Create transfer out transaction
    const outTransactionRef = doc(this.getTransactionCollectionRef());
    batch.set(outTransactionRef, {
      tenant_id: this.tenantId,
      office_id: fromOfficeId,
      consumable_id: consumableId,
      type: 'transfer_out',
      quantity: quantity,
      transferred_to_office: toOfficeId,
      notes,
      created_at: now,
      created_by: userId,
    });

    // Create transfer in transaction
    const inTransactionRef = doc(this.getTransactionCollectionRef());
    batch.set(inTransactionRef, {
      tenant_id: this.tenantId,
      office_id: toOfficeId,
      consumable_id: consumableId,
      type: 'transfer_in',
      quantity: quantity,
      transferred_from_office: fromOfficeId,
      notes,
      created_at: now,
      created_by: userId,
    });

    await batch.commit();
  }

  /**
   * Adjust stock (for corrections)
   */
  async adjust(
    officeId: string,
    consumableId: string,
    newQuantity: number,
    userId: string,
    reason: string
  ): Promise<void> {
    if (!this.tenantId) throw new Error('Tenant ID must be set');

    const existingStock = await this.getConsumableStock(officeId, consumableId);
    const oldQuantity = existingStock?.quantity || 0;
    const difference = newQuantity - oldQuantity;

    const batch = writeBatch(db);
    const now = Timestamp.now();

    if (existingStock) {
      const stockRef = doc(this.getStockCollectionRef(), existingStock.id);
      batch.update(stockRef, {
        quantity: newQuantity,
        updated_at: now,
      });
    } else {
      const stockRef = doc(this.getStockCollectionRef());
      batch.set(stockRef, {
        tenant_id: this.tenantId,
        office_id: officeId,
        consumable_id: consumableId,
        quantity: newQuantity,
        updated_at: now,
      });
    }

    // Create adjustment transaction
    const transactionRef = doc(this.getTransactionCollectionRef());
    batch.set(transactionRef, {
      tenant_id: this.tenantId,
      office_id: officeId,
      consumable_id: consumableId,
      type: 'adjustment',
      quantity: difference,
      notes: `Adjusted from ${oldQuantity} to ${newQuantity}. Reason: ${reason}`,
      created_at: now,
      created_by: userId,
    });

    await batch.commit();
  }

  /**
   * Get stock transactions for an office
   */
  async getTransactions(
    officeId: string,
    limit_count: number = 50
  ): Promise<StockTransaction[]> {
    const q = query(
      this.getTransactionCollectionRef(),
      where('office_id', '==', officeId),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit_count).map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as StockTransaction[];
  }

  /**
   * Get transactions for a specific consumable
   */
  async getConsumableTransactions(consumableId: string): Promise<StockTransaction[]> {
    const q = query(
      this.getTransactionCollectionRef(),
      where('consumable_id', '==', consumableId),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as StockTransaction[];
  }
}

// ==========================================
// SINGLETON EXPORTS
// ==========================================

export const consumableService = new ConsumableService();
export const consumableCategoryService = new ConsumableCategoryService();
export const stockService = new StockService();
