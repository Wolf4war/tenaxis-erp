/* ============================================
   TENAXIS - Auth Store
   Authentication and user session management
   ============================================ */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { userService, auditLogService, tenantService, organizationService } from '@/services';
import { hasPermission, canAccessModule, type ModuleValue, type ActionValue } from '@/lib/permissions';
import type { User, Tenant, Organization } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  // ==========================================
  // STATE
  // ==========================================
  
  const firebaseUser = ref<FirebaseUser | null>(null);
  const currentUser = ref<User | null>(null);
  const currentTenant = ref<Tenant | null>(null);
  const currentOrganization = ref<Organization | null>(null);
  const isLoading = ref(true);
  const isAuthenticated = ref(false);
  const authError = ref<string | null>(null);

  // ==========================================
  // GETTERS
  // ==========================================
  
  const userId = computed(() => currentUser.value?.id || null);
  const userEmail = computed(() => currentUser.value?.email || null);
  const userName = computed(() => currentUser.value?.display_name || 'User');
  const userRole = computed(() => currentUser.value?.role || null);
  const userAvatar = computed(() => currentUser.value?.avatar_url || null);
  const tenantId = computed(() => currentTenant.value?.id || null);
  const organizationId = computed(() => currentOrganization.value?.id || null);
  
  const isAdmin = computed(() => {
    const role = currentUser.value?.role;
    return role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN' || role === 'ORG_ADMIN';
  });

  const isSuperAdmin = computed(() => currentUser.value?.role === 'SUPER_ADMIN');
  const isTenantAdmin = computed(() => currentUser.value?.role === 'TENANT_ADMIN');

  // ==========================================
  // PERMISSION HELPERS
  // ==========================================

  function can(module: ModuleValue, action: ActionValue): boolean {
    if (!currentUser.value?.role) return false;
    return hasPermission(currentUser.value.role, module, action);
  }

  function canAccess(module: ModuleValue): boolean {
    if (!currentUser.value?.role) return false;
    return canAccessModule(currentUser.value.role, module);
  }

  function hasOfficeAccess(officeId: string): boolean {
    if (!currentUser.value) return false;
    if (isAdmin.value) return true;
    return currentUser.value.accessible_offices.includes(officeId);
  }

  function hasCompanyAccess(companyId: string): boolean {
    if (!currentUser.value) return false;
    if (isAdmin.value) return true;
    return currentUser.value.accessible_companies.includes(companyId);
  }

  // ==========================================
  // ACTIONS
  // ==========================================

  /**
   * Initialize auth state listener
   */
  function initializeAuth(): Promise<void> {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        firebaseUser.value = user;
        
        if (user) {
          try {
            await loadUserData(user);
            isAuthenticated.value = true;
          } catch (error) {
            console.error('Error loading user data:', error);
            isAuthenticated.value = false;
            currentUser.value = null;
          }
        } else {
          isAuthenticated.value = false;
          currentUser.value = null;
          currentTenant.value = null;
          currentOrganization.value = null;
        }
        
        isLoading.value = false;
        resolve();
      });
    });
  }

  /**
   * Create initial setup for first-time users (tenant, organization, user)
   */
  async function createInitialSetup(firebaseUser: FirebaseUser): Promise<string | null> {
    try {
      // Create the default tenant
      const tenantId = `tenant_${Date.now()}`;
      const tenantData: Omit<Tenant, 'id'> = {
        name: 'Default Tenant',
        slug: 'default',
        status: 'active',
        plan: 'starter',
        settings: {
          default_currency: 'USD',
          timezone: 'UTC',
          date_format: 'YYYY-MM-DD',
          features: {
            multi_company: true,
            advanced_reporting: false,
            api_access: false,
            custom_fields: false,
          },
        },
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };
      
      await tenantService.create(tenantId, tenantData);
      
      // Set tenant context for other services
      localStorage.setItem('tenaxis_current_tenant', tenantId);
      userService.setTenant(tenantId);
      organizationService.setTenant(tenantId);
      auditLogService.setTenant(tenantId);
      
      // Create default organization
      const orgData: Omit<Organization, 'id' | 'created_at' | 'created_by' | 'updated_at' | 'updated_by'> = {
        tenant_id: tenantId,
        name: 'Default Organization',
        description: 'Main organizational unit',
        status: 'active',
        settings: {
          fiscal_year_start: 1,
        },
      };
      
      const organization = await organizationService.create(orgData as Omit<Organization, 'id'>, firebaseUser.uid);
      const orgId = organization.id;
      
      // Create user using upsertFromAuth which handles all the user setup
      await userService.upsertFromAuth(
        firebaseUser.uid,
        {
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Admin User',
          photoURL: firebaseUser.photoURL || undefined,
        },
        {
          organization_id: orgId,
          role: 'SUPER_ADMIN', // First user becomes super admin
          status: 'active',
          accessible_offices: [orgId],
          accessible_companies: [],
        }
      );
      
      console.log('Initial setup completed successfully');
      return tenantId;
    } catch (error) {
      console.error('Error creating initial setup:', error);
      return null;
    }
  }

  /**
   * Load user data from Firestore
   */
  async function loadUserData(firebaseUser: FirebaseUser): Promise<void> {
    // First, get the tenant ID from somewhere (e.g., custom claims, lookup, etc.)
    // For now, we'll assume it's stored in localStorage or user's custom claims
    let storedTenantId = localStorage.getItem('tenaxis_current_tenant');
    
    // If no tenant exists, create initial setup for first-time users
    if (!storedTenantId) {
      console.log('No tenant found, creating initial setup...');
      storedTenantId = await createInitialSetup(firebaseUser);
    }
    
    if (!storedTenantId) {
      throw new Error('Could not create tenant context');
    }

    // Load tenant
    const tenant = await tenantService.getById(storedTenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    currentTenant.value = tenant;

    // Set tenant context for services
    userService.setTenant(storedTenantId);
    auditLogService.setTenant(storedTenantId);
    organizationService.setTenant(storedTenantId);

    // Load user data
    const user = await userService.getByAuthUid(firebaseUser.uid);
    if (!user) {
      // Create user if doesn't exist
      const newUser = await userService.upsertFromAuth(firebaseUser.uid, {
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
      });
      currentUser.value = newUser;
    } else {
      currentUser.value = user;
    }

    // Load organization
    if (currentUser.value?.organization_id) {
      const org = await organizationService.getById(currentUser.value.organization_id);
      currentOrganization.value = org;
    } else {
      // Get default organization
      const defaultOrg = await organizationService.getDefault();
      currentOrganization.value = defaultOrg;
    }
  }

  /**
   * Sign in with email and password
   */
  async function login(email: string, password: string): Promise<void> {
    authError.value = null;
    isLoading.value = true;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Log login event
      if (currentUser.value && currentOrganization.value) {
        await auditLogService.logLogin(
          {
            id: currentUser.value.id,
            email: currentUser.value.email,
            name: currentUser.value.display_name,
          },
          currentOrganization.value.id
        );
      }
    } catch (error: any) {
      console.error('Login error:', error);
      authError.value = getAuthErrorMessage(error.code);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Sign out
   */
  async function logout(): Promise<void> {
    try {
      // Log logout event
      if (currentUser.value && currentOrganization.value) {
        await auditLogService.logLogout(
          {
            id: currentUser.value.id,
            email: currentUser.value.email,
            name: currentUser.value.display_name,
          },
          currentOrganization.value.id
        );
      }

      await signOut(auth);
      
      // Clear state
      currentUser.value = null;
      currentTenant.value = null;
      currentOrganization.value = null;
      isAuthenticated.value = false;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async function resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      authError.value = getAuthErrorMessage(error.code);
      throw error;
    }
  }

  /**
   * Switch tenant (for multi-tenant admins)
   */
  async function switchTenant(tenantId: string): Promise<void> {
    const tenant = await tenantService.getById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    localStorage.setItem('tenaxis_current_tenant', tenantId);
    currentTenant.value = tenant;

    // Reload user data for new tenant context
    if (firebaseUser.value) {
      await loadUserData(firebaseUser.value);
    }
  }

  /**
   * Switch organization
   */
  async function switchOrganization(orgId: string): Promise<void> {
    const org = await organizationService.getById(orgId);
    if (!org) {
      throw new Error('Organization not found');
    }

    currentOrganization.value = org;
    localStorage.setItem('tenaxis_current_org', orgId);
  }

  /**
   * Get user-friendly auth error message
   */
  function getAuthErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'Invalid email address',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password is too weak',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again';
  }

  // ==========================================
  // RETURN
  // ==========================================

  return {
    // State
    firebaseUser,
    currentUser,
    currentTenant,
    currentOrganization,
    isLoading,
    isAuthenticated,
    authError,
    
    // Getters
    userId,
    userEmail,
    userName,
    userRole,
    userAvatar,
    tenantId,
    organizationId,
    isAdmin,
    isSuperAdmin,
    isTenantAdmin,
    
    // Permission helpers
    can,
    canAccess,
    hasOfficeAccess,
    hasCompanyAccess,
    
    // Actions
    initializeAuth,
    login,
    logout,
    resetPassword,
    switchTenant,
    switchOrganization,
  };
});
