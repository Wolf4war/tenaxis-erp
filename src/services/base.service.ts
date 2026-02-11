/* ============================================
   TENAXIS - Base Firestore Service
   Abstract service layer for Firestore operations
   ============================================ */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  Timestamp,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type CollectionReference,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { QueryParams, PaginatedResponse, AuditFields } from '@/types';

// ==========================================
// BASE SERVICE CLASS
// ==========================================

export abstract class BaseService<T extends { id: string }> {
  protected collectionName: string;
  protected tenantId: string | null = null;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Set the current tenant context
   */
  setTenant(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /**
   * Get the collection reference for the current tenant
   */
  protected getCollectionRef(): CollectionReference<DocumentData> {
    if (!this.tenantId) {
      throw new Error('Tenant ID must be set before performing operations');
    }
    return collection(db, 'tenants', this.tenantId, this.collectionName);
  }

  /**
   * Get a document reference
   */
  protected getDocRef(id: string): DocumentReference<DocumentData> {
    return doc(this.getCollectionRef(), id);
  }

  /**
   * Add audit fields to a document
   */
  protected addAuditFields(
    data: Partial<T>,
    userId: string,
    isNew: boolean = true
  ): Partial<T> & Partial<AuditFields> {
    const now = Timestamp.now();
    
    if (isNew) {
      return {
        ...data,
        tenant_id: this.tenantId,
        created_at: now,
        created_by: userId,
        updated_at: now,
        updated_by: userId,
      };
    }
    
    return {
      ...data,
      updated_at: now,
      updated_by: userId,
    };
  }

  /**
   * Get a single document by ID
   */
  async getById(id: string): Promise<T | null> {
    const docRef = this.getDocRef(id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() } as T;
  }

  /**
   * Get all documents with optional constraints
   */
  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const collectionRef = this.getCollectionRef();
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  }

  /**
   * Get documents with pagination
   */
  async getPaginated(
    params: QueryParams,
    additionalConstraints: QueryConstraint[] = []
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, page_size = 25, sort } = params;
    
    const constraints: QueryConstraint[] = [...additionalConstraints];
    
    // Add sorting
    if (sort) {
      constraints.push(orderBy(sort.field, sort.direction));
    } else {
      constraints.push(orderBy('created_at', 'desc'));
    }
    
    // Add limit
    constraints.push(limit(page_size + 1)); // +1 to check if there's more
    
    const collectionRef = this.getCollectionRef();
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const docs = querySnapshot.docs.slice(0, page_size);
    const hasMore = querySnapshot.docs.length > page_size;
    
    return {
      data: docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[],
      total: 0, // Would need a separate count query
      page,
      page_size,
      has_more: hasMore,
    };
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id'>, userId: string): Promise<T> {
    const docData = this.addAuditFields(data as Partial<T>, userId, true);
    const docRef = await addDoc(this.getCollectionRef(), docData);
    
    return { id: docRef.id, ...docData } as T;
  }

  /**
   * Update an existing document
   */
  async update(id: string, data: Partial<T>, userId: string): Promise<void> {
    const docRef = this.getDocRef(id);
    const updateData = this.addAuditFields(data, userId, false);
    await updateDoc(docRef, updateData as DocumentData);
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    const docRef = this.getDocRef(id);
    await deleteDoc(docRef);
  }

  /**
   * Perform a batch write
   */
  async batchWrite(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      id?: string;
      data?: Partial<T>;
      userId?: string;
    }>
  ): Promise<void> {
    const batch = writeBatch(db);
    
    for (const op of operations) {
      if (op.type === 'create' && op.data && op.userId) {
        const docRef = doc(this.getCollectionRef());
        const docData = this.addAuditFields(op.data, op.userId, true);
        batch.set(docRef, docData);
      } else if (op.type === 'update' && op.id && op.data && op.userId) {
        const docRef = this.getDocRef(op.id);
        const updateData = this.addAuditFields(op.data, op.userId, false);
        batch.update(docRef, updateData as DocumentData);
      } else if (op.type === 'delete' && op.id) {
        const docRef = this.getDocRef(op.id);
        batch.delete(docRef);
      }
    }
    
    await batch.commit();
  }
}

// ==========================================
// QUERY BUILDER HELPER
// ==========================================

export function buildQueryConstraints(params: QueryParams): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  
  // Add filters
  if (params.filters) {
    for (const filter of params.filters) {
      switch (filter.operator) {
        case 'eq':
          constraints.push(where(filter.field, '==', filter.value));
          break;
        case 'neq':
          constraints.push(where(filter.field, '!=', filter.value));
          break;
        case 'gt':
          constraints.push(where(filter.field, '>', filter.value));
          break;
        case 'gte':
          constraints.push(where(filter.field, '>=', filter.value));
          break;
        case 'lt':
          constraints.push(where(filter.field, '<', filter.value));
          break;
        case 'lte':
          constraints.push(where(filter.field, '<=', filter.value));
          break;
        case 'in':
          constraints.push(where(filter.field, 'in', filter.value));
          break;
        case 'contains':
          // Firestore doesn't support contains directly
          // This is a workaround for prefix matching
          const searchValue = filter.value as string;
          constraints.push(where(filter.field, '>=', searchValue));
          constraints.push(where(filter.field, '<=', searchValue + '\uf8ff'));
          break;
      }
    }
  }
  
  // Add sorting
  if (params.sort) {
    constraints.push(orderBy(params.sort.field, params.sort.direction));
  }
  
  // Add pagination limit
  if (params.page_size) {
    constraints.push(limit(params.page_size));
  }
  
  return constraints;
}
