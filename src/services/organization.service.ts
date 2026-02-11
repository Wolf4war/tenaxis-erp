/* ============================================
   TENAXIS - Organization Service
   Service layer for organization hierarchy
   ============================================ */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BaseService } from './base.service';
import { COLLECTIONS } from '@/lib/constants';
import type { Tenant, Organization, Company, Office, Department } from '@/types';

// ==========================================
// TENANT SERVICE
// ==========================================

class TenantService {
  /**
   * Get tenant by ID
   */
  async getById(tenantId: string): Promise<Tenant | null> {
    const docRef = doc(db, COLLECTIONS.TENANTS, tenantId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() } as Tenant;
  }

  /**
   * Create a new tenant
   */
  async create(tenantId: string, data: Omit<Tenant, 'id'>): Promise<Tenant> {
    const docRef = doc(db, COLLECTIONS.TENANTS, tenantId);
    await setDoc(docRef, {
      ...data,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });
    
    return { id: tenantId, ...data } as Tenant;
  }

  /**
   * Update tenant settings
   */
  async update(tenantId: string, data: Partial<Tenant>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TENANTS, tenantId);
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now(),
    });
  }

  /**
   * Get tenant settings
   */
  async getSettings(tenantId: string): Promise<Tenant['settings'] | null> {
    const tenant = await this.getById(tenantId);
    return tenant?.settings || null;
  }
}

// ==========================================
// ORGANIZATION SERVICE
// ==========================================

class OrganizationService extends BaseService<Organization> {
  constructor() {
    super(COLLECTIONS.ORGANIZATIONS);
  }

  /**
   * Get all organizations for current tenant
   */
  async getAll(): Promise<Organization[]> {
    return super.getAll([
      where('status', '==', 'active'),
      orderBy('name', 'asc'),
    ]);
  }

  /**
   * Get default organization
   */
  async getDefault(): Promise<Organization | null> {
    const orgs = await this.getAll();
    return orgs[0] || null;
  }
}

// ==========================================
// COMPANY SERVICE
// ==========================================

class CompanyService extends BaseService<Company> {
  constructor() {
    super(COLLECTIONS.COMPANIES);
  }

  /**
   * Get companies by organization
   */
  async getByOrganization(organizationId: string): Promise<Company[]> {
    return this.getAll([
      where('organization_id', '==', organizationId),
      where('status', '==', 'active'),
      orderBy('name', 'asc'),
    ]);
  }

  /**
   * Get default company for organization
   */
  async getDefault(organizationId: string): Promise<Company | null> {
    const companies = await this.getAll([
      where('organization_id', '==', organizationId),
      where('is_default', '==', true),
    ]);
    
    return companies[0] || null;
  }

  /**
   * Create default company for simple tenants
   */
  async createDefault(organizationId: string, userId: string): Promise<Company> {
    return this.create({
      organization_id: organizationId,
      name: 'Main',
      is_default: true,
      status: 'active',
    } as Omit<Company, 'id'>, userId);
  }
}

// ==========================================
// OFFICE SERVICE
// ==========================================

class OfficeService extends BaseService<Office> {
  constructor() {
    super(COLLECTIONS.OFFICES);
  }

  /**
   * Get offices by company
   */
  async getByCompany(companyId: string): Promise<Office[]> {
    return this.getAll([
      where('company_id', '==', companyId),
      where('status', '==', 'active'),
      orderBy('name', 'asc'),
    ]);
  }

  /**
   * Get offices by organization
   */
  async getByOrganization(organizationId: string): Promise<Office[]> {
    return this.getAll([
      where('organization_id', '==', organizationId),
      where('status', '==', 'active'),
      orderBy('name', 'asc'),
    ]);
  }

  /**
   * Get offices accessible by user
   */
  async getAccessibleByUser(officeIds: string[]): Promise<Office[]> {
    if (officeIds.length === 0) return [];
    
    // Firestore 'in' query has a limit of 30 items
    const chunks: string[][] = [];
    for (let i = 0; i < officeIds.length; i += 30) {
      chunks.push(officeIds.slice(i, i + 30));
    }
    
    const results: Office[] = [];
    for (const chunk of chunks) {
      const offices = await this.getAll([
        where('__name__', 'in', chunk),
        where('status', '==', 'active'),
      ]);
      results.push(...offices);
    }
    
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get headquarters office
   */
  async getHeadquarters(companyId: string): Promise<Office | null> {
    const offices = await this.getAll([
      where('company_id', '==', companyId),
      where('type', '==', 'headquarters'),
      where('status', '==', 'active'),
    ]);
    
    return offices[0] || null;
  }
}

// ==========================================
// DEPARTMENT SERVICE
// ==========================================

class DepartmentService extends BaseService<Department> {
  constructor() {
    super(COLLECTIONS.DEPARTMENTS);
  }

  /**
   * Get departments by office
   */
  async getByOffice(officeId: string): Promise<Department[]> {
    return this.getAll([
      where('office_id', '==', officeId),
      where('status', '==', 'active'),
      orderBy('name', 'asc'),
    ]);
  }

  /**
   * Get department tree for an office
   */
  async getDepartmentTree(officeId: string): Promise<Department[]> {
    const departments = await this.getByOffice(officeId);
    
    // Build tree structure
    const rootDepartments = departments.filter(d => !d.parent_id);
    
    const buildTree = (parent: Department): Department & { children?: Department[] } => {
      const children = departments.filter(d => d.parent_id === parent.id);
      return {
        ...parent,
        children: children.length > 0 ? children.map(buildTree) : undefined,
      };
    };
    
    return rootDepartments.map(buildTree);
  }
}

// ==========================================
// SINGLETON EXPORTS
// ==========================================

export const tenantService = new TenantService();
export const organizationService = new OrganizationService();
export const companyService = new CompanyService();
export const officeService = new OfficeService();
export const departmentService = new DepartmentService();
