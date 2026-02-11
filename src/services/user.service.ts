/* ============================================
   TENAXIS - User Service
   Service layer for user management
   ============================================ */

import {
  doc,
  setDoc,
  updateDoc,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { BaseService } from './base.service';
import { COLLECTIONS } from '@/lib/constants';
import type { User, UserRole } from '@/types';

// ==========================================
// USER SERVICE
// ==========================================

class UserService extends BaseService<User> {
  constructor() {
    super(COLLECTIONS.USERS);
  }

  /**
   * Get user by Firebase Auth UID
   */
  async getByAuthUid(uid: string): Promise<User | null> {
    // In this implementation, the user document ID matches Firebase Auth UID
    return this.getById(uid);
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<User | null> {
    const users = await this.getAll([
      where('email', '==', email.toLowerCase()),
    ]);
    return users[0] || null;
  }

  /**
   * Get users by office
   */
  async getByOffice(officeId: string): Promise<User[]> {
    return this.getAll([
      where('primary_office_id', '==', officeId),
      where('status', '==', 'active'),
      orderBy('display_name', 'asc'),
    ]);
  }

  /**
   * Get users by department
   */
  async getByDepartment(departmentId: string): Promise<User[]> {
    return this.getAll([
      where('department_id', '==', departmentId),
      where('status', '==', 'active'),
      orderBy('display_name', 'asc'),
    ]);
  }

  /**
   * Get users by role
   */
  async getByRole(role: UserRole): Promise<User[]> {
    return this.getAll([
      where('role', '==', role),
      where('status', '==', 'active'),
      orderBy('display_name', 'asc'),
    ]);
  }

  /**
   * Get all active users
   */
  async getActiveUsers(): Promise<User[]> {
    return this.getAll([
      where('status', '==', 'active'),
      orderBy('display_name', 'asc'),
    ]);
  }

  /**
   * Create or update user from Firebase Auth
   */
  async upsertFromAuth(
    uid: string,
    authData: {
      email: string;
      displayName?: string;
      photoURL?: string;
    },
    additionalData?: Partial<User>
  ): Promise<User> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const existingUser = await this.getById(uid);
    const now = Timestamp.now();

    if (existingUser) {
      // Update existing user
      await updateDoc(doc(this.getCollectionRef(), uid), {
        email: authData.email.toLowerCase(),
        display_name: authData.displayName || existingUser.display_name,
        avatar_url: authData.photoURL || existingUser.avatar_url || null,
        last_login: now,
        updated_at: now,
        ...additionalData,
      });

      return {
        ...existingUser,
        email: authData.email.toLowerCase(),
        display_name: authData.displayName || existingUser.display_name,
        last_login: now,
        ...additionalData,
      } as User;
    } else {
      // Create new user
      const userData: Omit<User, 'id'> = {
        tenant_id: this.tenantId,
        organization_id: additionalData?.organization_id || '',
        email: authData.email.toLowerCase(),
        display_name: authData.displayName || authData.email.split('@')[0],
        avatar_url: authData.photoURL || null,
        role: 'MANAGEMENT', // Default role for new users
        status: 'pending', // Require admin approval
        accessible_companies: [],
        accessible_offices: [],
        email_verified: false,
        last_login: now,
        created_at: now,
        created_by: uid,
        updated_at: now,
        updated_by: uid,
        ...additionalData,
      } as Omit<User, 'id'>;

      await setDoc(doc(this.getCollectionRef(), uid), userData);

      return { id: uid, ...userData } as User;
    }
  }

  /**
   * Update user role
   */
  async updateRole(userId: string, role: UserRole, updatedBy: string): Promise<void> {
    await this.update(userId, { role }, updatedBy);
  }

  /**
   * Update user status
   */
  async updateStatus(
    userId: string,
    status: User['status'],
    updatedBy: string
  ): Promise<void> {
    await this.update(userId, { status }, updatedBy);
  }

  /**
   * Update user office access
   */
  async updateOfficeAccess(
    userId: string,
    officeIds: string[],
    updatedBy: string
  ): Promise<void> {
    await this.update(userId, { accessible_offices: officeIds }, updatedBy);
  }

  /**
   * Update user company access
   */
  async updateCompanyAccess(
    userId: string,
    companyIds: string[],
    updatedBy: string
  ): Promise<void> {
    await this.update(userId, { accessible_companies: companyIds }, updatedBy);
  }

  /**
   * Set primary office
   */
  async setPrimaryOffice(
    userId: string,
    officeId: string,
    updatedBy: string
  ): Promise<void> {
    await this.update(userId, { primary_office_id: officeId }, updatedBy);
  }

  /**
   * Search users by name or email
   */
  async search(searchTerm: string): Promise<User[]> {
    const term = searchTerm.toLowerCase();
    
    // Search by email prefix
    const byEmail = await this.getAll([
      where('email', '>=', term),
      where('email', '<=', term + '\uf8ff'),
      where('status', '==', 'active'),
    ]);

    return byEmail;
  }

  /**
   * Get user count by status
   */
  async getCountByStatus(): Promise<Record<User['status'], number>> {
    const users = await this.getAll([]);
    
    const counts: Record<string, number> = {
      active: 0,
      inactive: 0,
      pending: 0,
    };

    for (const user of users) {
      counts[user.status] = (counts[user.status] || 0) + 1;
    }

    return counts as Record<User['status'], number>;
  }

  /**
   * Check if user has access to office
   */
  hasOfficeAccess(user: User, officeId: string): boolean {
    // Admins have access to all offices
    if (['SUPER_ADMIN', 'TENANT_ADMIN', 'ORG_ADMIN'].includes(user.role)) {
      return true;
    }

    return user.accessible_offices.includes(officeId);
  }

  /**
   * Check if user has access to company
   */
  hasCompanyAccess(user: User, companyId: string): boolean {
    // Admins have access to all companies
    if (['SUPER_ADMIN', 'TENANT_ADMIN', 'ORG_ADMIN'].includes(user.role)) {
      return true;
    }

    return user.accessible_companies.includes(companyId);
  }
}

// ==========================================
// SINGLETON EXPORT
// ==========================================

export const userService = new UserService();
