/* ============================================
   TENAXIS - Audit Log Service
   Service layer for audit trail operations
   ============================================ */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { AuditLog, AuditAction, QueryParams, PaginatedResponse } from '@/types';

// ==========================================
// AUDIT LOG SERVICE
// ==========================================

class AuditLogService {
  private tenantId: string | null = null;

  /**
   * Set the current tenant context
   */
  setTenant(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /**
   * Get collection reference
   */
  private getCollectionRef() {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }
    return collection(db, 'tenants', this.tenantId, COLLECTIONS.AUDIT_LOGS);
  }

  /**
   * Log an audit event
   */
  async log(params: {
    action: AuditAction;
    module: string;
    entityType: string;
    entityId: string;
    entityName?: string;
    description: string;
    changes?: { field: string; old_value: unknown; new_value: unknown }[];
    userId: string;
    userEmail: string;
    userName: string;
    organizationId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const logData: Omit<AuditLog, 'id'> = {
      tenant_id: this.tenantId!,
      organization_id: params.organizationId,
      action: params.action,
      module: params.module,
      entity_type: params.entityType,
      entity_id: params.entityId,
      entity_name: params.entityName,
      description: params.description,
      changes: params.changes,
      user_id: params.userId,
      user_email: params.userEmail,
      user_name: params.userName,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      created_at: Timestamp.now(),
    };

    await addDoc(this.getCollectionRef(), logData);
  }

  /**
   * Log a create action
   */
  async logCreate(
    module: string,
    entityType: string,
    entityId: string,
    entityName: string,
    user: { id: string; email: string; name: string },
    organizationId: string
  ): Promise<void> {
    await this.log({
      action: 'create',
      module,
      entityType,
      entityId,
      entityName,
      description: `Created ${entityType}: ${entityName}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      organizationId,
    });
  }

  /**
   * Log an update action
   */
  async logUpdate(
    module: string,
    entityType: string,
    entityId: string,
    entityName: string,
    changes: { field: string; old_value: unknown; new_value: unknown }[],
    user: { id: string; email: string; name: string },
    organizationId: string
  ): Promise<void> {
    const changedFields = changes.map(c => c.field).join(', ');
    await this.log({
      action: 'update',
      module,
      entityType,
      entityId,
      entityName,
      description: `Updated ${entityType}: ${entityName} (fields: ${changedFields})`,
      changes,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      organizationId,
    });
  }

  /**
   * Log a delete action
   */
  async logDelete(
    module: string,
    entityType: string,
    entityId: string,
    entityName: string,
    user: { id: string; email: string; name: string },
    organizationId: string
  ): Promise<void> {
    await this.log({
      action: 'delete',
      module,
      entityType,
      entityId,
      entityName,
      description: `Deleted ${entityType}: ${entityName}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      organizationId,
    });
  }

  /**
   * Log an assign action (for assets)
   */
  async logAssign(
    entityType: string,
    entityId: string,
    entityName: string,
    assignedTo: string,
    user: { id: string; email: string; name: string },
    organizationId: string
  ): Promise<void> {
    await this.log({
      action: 'assign',
      module: 'assets',
      entityType,
      entityId,
      entityName,
      description: `Assigned ${entityType}: ${entityName} to ${assignedTo}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      organizationId,
    });
  }

  /**
   * Log a transfer action
   */
  async logTransfer(
    entityType: string,
    entityId: string,
    entityName: string,
    fromOffice: string,
    toOffice: string,
    user: { id: string; email: string; name: string },
    organizationId: string
  ): Promise<void> {
    await this.log({
      action: 'transfer',
      module: 'assets',
      entityType,
      entityId,
      entityName,
      description: `Transferred ${entityType}: ${entityName} from ${fromOffice} to ${toOffice}`,
      changes: [
        { field: 'office', old_value: fromOffice, new_value: toOffice },
      ],
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      organizationId,
    });
  }

  /**
   * Log user login
   */
  async logLogin(
    user: { id: string; email: string; name: string },
    organizationId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: 'login',
      module: 'auth',
      entityType: 'user',
      entityId: user.id,
      entityName: user.name,
      description: `User logged in: ${user.email}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      organizationId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user logout
   */
  async logLogout(
    user: { id: string; email: string; name: string },
    organizationId: string
  ): Promise<void> {
    await this.log({
      action: 'logout',
      module: 'auth',
      entityType: 'user',
      entityId: user.id,
      entityName: user.name,
      description: `User logged out: ${user.email}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      organizationId,
    });
  }

  /**
   * Log export action
   */
  async logExport(
    module: string,
    exportType: string,
    recordCount: number,
    user: { id: string; email: string; name: string },
    organizationId: string
  ): Promise<void> {
    await this.log({
      action: 'export',
      module,
      entityType: exportType,
      entityId: '-',
      description: `Exported ${recordCount} ${exportType} records from ${module}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      organizationId,
    });
  }

  /**
   * Get audit logs with pagination
   */
  async getLogs(params: QueryParams & {
    module?: string;
    action?: AuditAction;
    userId?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PaginatedResponse<AuditLog>> {
    const constraints: QueryConstraint[] = [];

    // Add filters
    if (params.module) {
      constraints.push(where('module', '==', params.module));
    }
    if (params.action) {
      constraints.push(where('action', '==', params.action));
    }
    if (params.userId) {
      constraints.push(where('user_id', '==', params.userId));
    }
    if (params.entityType) {
      constraints.push(where('entity_type', '==', params.entityType));
    }
    if (params.startDate) {
      constraints.push(where('created_at', '>=', Timestamp.fromDate(params.startDate)));
    }
    if (params.endDate) {
      constraints.push(where('created_at', '<=', Timestamp.fromDate(params.endDate)));
    }

    // Add ordering
    constraints.push(orderBy('created_at', 'desc'));

    // Add limit
    const pageSize = params.page_size || 50;
    constraints.push(limit(pageSize + 1));

    const q = query(this.getCollectionRef(), ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs.slice(0, pageSize);
    const hasMore = snapshot.docs.length > pageSize;

    return {
      data: docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[],
      total: 0,
      page: params.page || 1,
      page_size: pageSize,
      has_more: hasMore,
    };
  }

  /**
   * Get logs for a specific entity
   */
  async getEntityLogs(entityType: string, entityId: string): Promise<AuditLog[]> {
    const q = query(
      this.getCollectionRef(),
      where('entity_type', '==', entityType),
      where('entity_id', '==', entityId),
      orderBy('created_at', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[];
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, days: number = 30): Promise<AuditLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
      this.getCollectionRef(),
      where('user_id', '==', userId),
      where('created_at', '>=', Timestamp.fromDate(startDate)),
      orderBy('created_at', 'desc'),
      limit(200)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[];
  }
}

// ==========================================
// SINGLETON EXPORT
// ==========================================

export const auditLogService = new AuditLogService();
