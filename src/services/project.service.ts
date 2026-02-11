/* ============================================
   TENAXIS - Project Service
   Service layer for project management
   ============================================ */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BaseService } from './base.service';
import { COLLECTIONS } from '@/lib/constants';
import type {
  Project,
  ProjectMilestone,
  ProjectExpense,
  ProjectStatus,
} from '@/types';

// ==========================================
// PROJECT SERVICE
// ==========================================

class ProjectService extends BaseService<Project> {
  constructor() {
    super(COLLECTIONS.PROJECTS);
  }

  /**
   * Get projects by office
   */
  async getByOffice(officeId: string): Promise<Project[]> {
    return this.getAll([
      where('office_id', '==', officeId),
      orderBy('created_at', 'desc'),
    ]);
  }

  /**
   * Get projects by status
   */
  async getByStatus(status: ProjectStatus): Promise<Project[]> {
    return this.getAll([
      where('status', '==', status),
      orderBy('created_at', 'desc'),
    ]);
  }

  /**
   * Get active projects
   */
  async getActive(): Promise<Project[]> {
    return this.getAll([
      where('status', 'in', ['planning', 'in_progress']),
      orderBy('planned_end_date', 'asc'),
    ]);
  }

  /**
   * Get projects by manager
   */
  async getByManager(managerId: string): Promise<Project[]> {
    return this.getAll([
      where('project_manager_id', '==', managerId),
      orderBy('created_at', 'desc'),
    ]);
  }

  /**
   * Get overdue projects
   */
  async getOverdue(): Promise<Project[]> {
    return this.getAll([
      where('planned_end_date', '<', Timestamp.now()),
      where('status', 'in', ['planning', 'in_progress']),
      orderBy('planned_end_date', 'asc'),
    ]);
  }

  /**
   * Update project status
   */
  async updateStatus(
    projectId: string,
    status: ProjectStatus,
    userId: string
  ): Promise<void> {
    const updateData: Partial<Project> = { status };

    if (status === 'in_progress') {
      updateData.actual_start_date = Timestamp.now();
    } else if (status === 'completed') {
      updateData.actual_end_date = Timestamp.now();
      updateData.progress_percentage = 100;
    }

    await this.update(projectId, updateData, userId);
  }

  /**
   * Update project progress
   */
  async updateProgress(
    projectId: string,
    progressPercentage: number,
    userId: string
  ): Promise<void> {
    await this.update(projectId, { progress_percentage: progressPercentage }, userId);
  }

  /**
   * Add project milestone
   */
  async addMilestone(
    projectId: string,
    data: Omit<ProjectMilestone, 'id' | 'project_id' | 'tenant_id'>,
    userId: string
  ): Promise<ProjectMilestone> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const milestonesRef = collection(
      db,
      'tenants',
      this.tenantId,
      COLLECTIONS.PROJECTS,
      projectId,
      COLLECTIONS.PROJECT_MILESTONES
    );

    const milestoneData = {
      ...data,
      project_id: projectId,
      tenant_id: this.tenantId,
      created_at: Timestamp.now(),
      created_by: userId,
      updated_at: Timestamp.now(),
      updated_by: userId,
    };

    const docRef = await addDoc(milestonesRef, milestoneData);
    return { id: docRef.id, ...milestoneData } as ProjectMilestone;
  }

  /**
   * Get project milestones
   */
  async getMilestones(projectId: string): Promise<ProjectMilestone[]> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const milestonesRef = collection(
      db,
      'tenants',
      this.tenantId,
      COLLECTIONS.PROJECTS,
      projectId,
      COLLECTIONS.PROJECT_MILESTONES
    );

    const q = query(milestonesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ProjectMilestone[];
  }

  /**
   * Complete a milestone
   */
  async completeMilestone(
    projectId: string,
    milestoneId: string,
    userId: string
  ): Promise<void> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const milestoneRef = doc(
      db,
      'tenants',
      this.tenantId,
      COLLECTIONS.PROJECTS,
      projectId,
      COLLECTIONS.PROJECT_MILESTONES,
      milestoneId
    );

    await updateDoc(milestoneRef, {
      status: 'completed',
      completed_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      updated_by: userId,
    });

    // Update project progress based on completed milestones
    await this.recalculateProgress(projectId, userId);
  }

  /**
   * Recalculate project progress based on milestones
   */
  private async recalculateProgress(
    projectId: string,
    userId: string
  ): Promise<void> {
    const milestones = await this.getMilestones(projectId);
    if (milestones.length === 0) return;

    const completedCount = milestones.filter(m => m.status === 'completed').length;
    const progress = Math.round((completedCount / milestones.length) * 100);

    await this.updateProgress(projectId, progress, userId);
  }

  /**
   * Add project expense
   */
  async addExpense(
    projectId: string,
    data: Omit<ProjectExpense, 'id' | 'project_id' | 'tenant_id'>,
    userId: string
  ): Promise<ProjectExpense> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const expensesRef = collection(
      db,
      'tenants',
      this.tenantId,
      COLLECTIONS.PROJECTS,
      projectId,
      COLLECTIONS.PROJECT_EXPENSES
    );

    const expenseData = {
      ...data,
      project_id: projectId,
      tenant_id: this.tenantId,
      created_at: Timestamp.now(),
      created_by: userId,
      updated_at: Timestamp.now(),
      updated_by: userId,
    };

    const docRef = await addDoc(expensesRef, expenseData);

    // Update project actual cost
    await this.recalculateActualCost(projectId, userId);

    return { id: docRef.id, ...expenseData } as ProjectExpense;
  }

  /**
   * Get project expenses
   */
  async getExpenses(projectId: string): Promise<ProjectExpense[]> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set');
    }

    const expensesRef = collection(
      db,
      'tenants',
      this.tenantId,
      COLLECTIONS.PROJECTS,
      projectId,
      COLLECTIONS.PROJECT_EXPENSES
    );

    const q = query(expensesRef, orderBy('expense_date', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ProjectExpense[];
  }

  /**
   * Recalculate actual cost from expenses
   */
  private async recalculateActualCost(
    projectId: string,
    userId: string
  ): Promise<void> {
    const expenses = await this.getExpenses(projectId);
    const actualCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    await this.update(projectId, { actual_cost: actualCost }, userId);
  }

  /**
   * Get project statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<ProjectStatus, number>;
    totalBudget: number;
    totalActualCost: number;
    onTimePercentage: number;
  }> {
    const projects = await this.getAll([]);

    const byStatus: Record<string, number> = {};
    let totalBudget = 0;
    let totalActualCost = 0;
    let onTimeCount = 0;
    let completedCount = 0;

    for (const project of projects) {
      byStatus[project.status] = (byStatus[project.status] || 0) + 1;
      totalBudget += project.budget || 0;
      totalActualCost += project.actual_cost || 0;

      if (project.status === 'completed') {
        completedCount++;
        if (
          project.actual_end_date &&
          project.planned_end_date &&
          project.actual_end_date.seconds <= project.planned_end_date.seconds
        ) {
          onTimeCount++;
        }
      }
    }

    return {
      total: projects.length,
      byStatus: byStatus as Record<ProjectStatus, number>,
      totalBudget,
      totalActualCost,
      onTimePercentage: completedCount > 0 ? (onTimeCount / completedCount) * 100 : 0,
    };
  }

  /**
   * Get budget vs actual summary
   */
  async getBudgetSummary(): Promise<
    Array<{
      projectId: string;
      projectName: string;
      budget: number;
      actual: number;
      variance: number;
      variancePercentage: number;
    }>
  > {
    const projects = await this.getActive();

    return projects.map(project => ({
      projectId: project.id,
      projectName: project.name,
      budget: project.budget,
      actual: project.actual_cost,
      variance: project.budget - project.actual_cost,
      variancePercentage:
        project.budget > 0
          ? ((project.budget - project.actual_cost) / project.budget) * 100
          : 0,
    }));
  }
}

// ==========================================
// SINGLETON EXPORT
// ==========================================

export const projectService = new ProjectService();
