/* ============================================
   TENAXIS - Vendor Service
   Service layer for vendor management
   ============================================ */

import { where, orderBy } from 'firebase/firestore';
import { BaseService } from './base.service';
import { COLLECTIONS } from '@/lib/constants';
import type { Vendor } from '@/types';

// ==========================================
// VENDOR SERVICE
// ==========================================

class VendorService extends BaseService<Vendor> {
  constructor() {
    super(COLLECTIONS.VENDORS);
  }

  /**
   * Get active vendors
   */
  async getActive(): Promise<Vendor[]> {
    return this.getAll([
      where('status', '==', 'active'),
      orderBy('name', 'asc'),
    ]);
  }

  /**
   * Get vendors by type
   */
  async getByType(type: Vendor['type']): Promise<Vendor[]> {
    return this.getAll([
      where('type', '==', type),
      where('status', '==', 'active'),
      orderBy('name', 'asc'),
    ]);
  }

  /**
   * Search vendors by name
   */
  async search(searchTerm: string): Promise<Vendor[]> {
    const term = searchTerm.toLowerCase();
    
    return this.getAll([
      where('name', '>=', term),
      where('name', '<=', term + '\uf8ff'),
      where('status', '==', 'active'),
    ]);
  }

  /**
   * Get suppliers (for procurement)
   */
  async getSuppliers(): Promise<Vendor[]> {
    return this.getByType('supplier');
  }

  /**
   * Get service providers (for maintenance)
   */
  async getServiceProviders(): Promise<Vendor[]> {
    return this.getByType('service_provider');
  }

  /**
   * Update vendor rating
   */
  async updateRating(
    vendorId: string,
    rating: number,
    userId: string
  ): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    await this.update(vendorId, { rating }, userId);
  }

  /**
   * Deactivate vendor
   */
  async deactivate(vendorId: string, userId: string): Promise<void> {
    await this.update(vendorId, { status: 'inactive' }, userId);
  }

  /**
   * Reactivate vendor
   */
  async reactivate(vendorId: string, userId: string): Promise<void> {
    await this.update(vendorId, { status: 'active' }, userId);
  }
}

// ==========================================
// SINGLETON EXPORT
// ==========================================

export const vendorService = new VendorService();
