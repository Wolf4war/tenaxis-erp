/* ============================================
   TENAXIS - Maintenance Service
   Service layer for maintenance ticket management
   ============================================ */

import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BaseService } from './base.service';
import { COLLECTIONS } from '@/lib/constants';
import { generateTicketNumber } from '@/lib/utils';
import type {
  MaintenanceTicket,
  MaintenanceComment,
  MaintenanceStatus,
  MaintenancePriority,
} from '@/types';

// ==========================================
// MAINTENANCE SERVICE
// ==========================================

class MaintenanceService extends BaseService<MaintenanceTicket> {
  constructor() {
    super(COLLECTIONS.MAINTENANCE);
  }

  /**
   * Get tickets by office
   */
  async getByOffice(officeId: string): Promise<MaintenanceTicket[]> {
    return this.getAll([
      where('office_id', '==', officeId),
      orderBy('created_at', 'desc'),
    ]);
  }

  /**
   * Get tickets by status
   */
  async getByStatus(status: MaintenanceStatus): Promise<MaintenanceTicket[]> {
    return this.getAll([
      where('status', '==', status),
      orderBy('created_at', 'desc'),
    ]);
  }

  /**
   * Get open tickets (not completed or cancelled)
   */
  async getOpen(): Promise<MaintenanceTicket[]> {
    return this.getAll([
      where('status', 'in', ['open', 'in_progress', 'waiting_parts']),
      orderBy('priority', 'desc'),
      orderBy('created_at', 'asc'),
    ]);
  }

  /**
   * Get tickets by priority
   */
  async getByPriority(priority: MaintenancePriority): Promise<MaintenanceTicket[]> {
    return this.getAll([
      where('priority', '==', priority),
      where('status', 'in', ['open', 'in_progress', 'waiting_parts']),
      orderBy('created_at', 'desc'),
    ]);
  }

  /**
   * Get tickets assigned to a technician
   */
  async getAssignedTo(technicianId: string): Promise<MaintenanceTicket[]> {
    return this.getAll([
      where('assigned_to', '==', technicianId),
      where('status', 'in', ['open', 'in_progress', 'waiting_parts']),
      orderBy('created_at', 'desc'),
    ]);
  }

  /**
   * Get tickets for a specific asset
   */
  async getByAsset(assetId: string): Promise<MaintenanceTicket[]> {
    return this.getAll([
      where('asset_id', '==', assetId),
      orderBy('created_at', 'desc'),
    ]);
  }

  /**
   * Get overdue tickets
   */
  async getOverdue(): Promise<MaintenanceTicket[]> {
    return this.getAll([
      where('due_date', '<', Timestamp.now()),
      where('status', 'in', ['open', 'in_progress', 'waiting_parts']),
      orderBy('due_date', 'asc'),
    ]);
  }

  /**
   * Create a new ticket
   */
  async createTicket(
    data: Omit<MaintenanceTicket, 'id' | 'ticket_number' | 'reported_at'>,
    userId: string
  ): Promise<MaintenanceTicket> {
    const ticketNumber = generateTicketNumber('TKT');
    const now = Timestamp.now();

    const ticketData = {
      ...data,
      ticket_number: ticketNumber,
      reported_at: now,
      reported_by: userId,
      status: data.status || 'open',
    };

    return this.create(ticketData as Omit<MaintenanceTicket, 'id'>, userId);
  }

  /**
   * Assign ticket to technician
   */
  async assign(
    ticketId: string,
    technicianId: string,
    assignedBy: string
  ): Promise<void> {
    await this.update(
      ticketId,
      {
        assigned_to: technicianId,
        assigned_at: Timestamp.now(),
        status: 'in_progress',
      },
      assignedBy
    );
  }

  /**
   * Start working on a ticket
   */
  async startWork(ticketId: string, userId: string): Promise<void> {
    await this.update(
      ticketId,
      {
        status: 'in_progress',
        started_at: Timestamp.now(),
      },
      userId
    );
  }

  /**
   * Mark ticket as waiting for parts
   */
  async waitingForParts(ticketId: string, userId: string): Promise<void> {
    await this.update(ticketId, { status: 'waiting_parts' }, userId);
  }

  /**
   * Complete a ticket
   */
  async complete(
    ticketId: string,
    resolutionNotes: string,
    actualCost: number | undefined,
    rootCause: string | undefined,
    userId: string
  ): Promise<void> {
    await this.update(
      ticketId,
      {
        status: 'completed',
        completed_at: Timestamp.now(),
        resolution_notes: resolutionNotes,
        actual_cost: actualCost,
        root_cause: rootCause,
      },
      userId
    );
  }

  /**
   * Cancel a ticket
   */
  async cancel(ticketId: string, reason: string, userId: string): Promise<void> {
    await this.update(
      ticketId,
      {
        status: 'cancelled',
        resolution_notes: `Cancelled: ${reason}`,
      },
      userId
    );
  }

  /**
   * Add a comment to a ticket
   */
  async addComment(
    ticketId: string,
    content: string,
    userId: string,
    attachments?: string[]
  ): Promise<MaintenanceComment> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const commentsRef = collection(
      db,
      'tenants',
      this.tenantId,
      COLLECTIONS.MAINTENANCE,
      ticketId,
      COLLECTIONS.MAINTENANCE_COMMENTS
    );

    const commentData: Omit<MaintenanceComment, 'id'> = {
      ticket_id: ticketId,
      content,
      attachments,
      created_at: Timestamp.now(),
      created_by: userId,
    };

    const docRef = await addDoc(commentsRef, commentData);
    return { id: docRef.id, ...commentData };
  }

  /**
   * Get comments for a ticket
   */
  async getComments(ticketId: string): Promise<MaintenanceComment[]> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const commentsRef = collection(
      db,
      'tenants',
      this.tenantId,
      COLLECTIONS.MAINTENANCE,
      ticketId,
      COLLECTIONS.MAINTENANCE_COMMENTS
    );

    const q = query(commentsRef, orderBy('created_at', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as MaintenanceComment[];
  }

  /**
   * Get maintenance statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<MaintenanceStatus, number>;
    byPriority: Record<MaintenancePriority, number>;
    averageResolutionTime: number;
    totalCost: number;
  }> {
    const tickets = await this.getAll([]);

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let totalCost = 0;
    let totalResolutionTime = 0;
    let completedCount = 0;

    for (const ticket of tickets) {
      byStatus[ticket.status] = (byStatus[ticket.status] || 0) + 1;
      byPriority[ticket.priority] = (byPriority[ticket.priority] || 0) + 1;

      if (ticket.actual_cost) {
        totalCost += ticket.actual_cost;
      }

      if (ticket.status === 'completed' && ticket.completed_at && ticket.reported_at) {
        const resolutionTime =
          ticket.completed_at.seconds - ticket.reported_at.seconds;
        totalResolutionTime += resolutionTime;
        completedCount++;
      }
    }

    return {
      total: tickets.length,
      byStatus: byStatus as Record<MaintenanceStatus, number>,
      byPriority: byPriority as Record<MaintenancePriority, number>,
      averageResolutionTime:
        completedCount > 0 ? totalResolutionTime / completedCount : 0,
      totalCost,
    };
  }

  /**
   * Get monthly cost summary
   */
  async getMonthlyCostSummary(months: number = 12): Promise<
    Array<{ month: string; cost: number; count: number }>
  > {
    const tickets = await this.getAll([
      where('status', '==', 'completed'),
      orderBy('completed_at', 'desc'),
    ]);

    const summary: Map<string, { cost: number; count: number }> = new Map();

    for (const ticket of tickets) {
      if (!ticket.completed_at) continue;

      const date = new Date(ticket.completed_at.seconds * 1000);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const existing = summary.get(monthKey) || { cost: 0, count: 0 };
      summary.set(monthKey, {
        cost: existing.cost + (ticket.actual_cost || 0),
        count: existing.count + 1,
      });
    }

    return Array.from(summary.entries())
      .slice(0, months)
      .map(([month, data]) => ({
        month,
        cost: data.cost,
        count: data.count,
      }));
  }
}

// ==========================================
// SINGLETON EXPORT
// ==========================================

export const maintenanceService = new MaintenanceService();
