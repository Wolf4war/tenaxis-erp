/* ============================================
   TENAXIS - TypeScript Type Definitions
   Core domain types for the ERP platform
   ============================================ */

// ==========================================
// BASE TYPES
// ==========================================

export type Timestamp = {
  seconds: number;
  nanoseconds: number;
};

export type AuditFields = {
  created_at: Timestamp;
  created_by: string;
  updated_at: Timestamp;
  updated_by: string;
};

// ==========================================
// TENANT & ORGANIZATION HIERARCHY
// ==========================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'trial';
  plan: 'starter' | 'professional' | 'enterprise';
  settings: TenantSettings;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface TenantSettings {
  default_currency: string;
  timezone: string;
  date_format: string;
  logo_url?: string;
  primary_color?: string;
  features: {
    multi_company: boolean;
    advanced_reporting: boolean;
    api_access: boolean;
    custom_fields: boolean;
  };
}

export interface Organization extends AuditFields {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  fiscal_year_start: number; // Month 1-12
  default_office_id?: string;
}

export interface Company extends AuditFields {
  id: string;
  tenant_id: string;
  organization_id: string;
  name: string;
  legal_name?: string;
  registration_number?: string;
  tax_id?: string;
  is_default: boolean;
  status: 'active' | 'inactive';
  address?: Address;
  contact?: ContactInfo;
}

export type OfficeStatus = 'active' | 'inactive';
export type OfficeType = 'headquarters' | 'branch' | 'warehouse' | 'remote';

export interface Office extends AuditFields {
  id: string;
  tenant_id: string;
  organization_id: string;
  company_id: string;
  name: string;
  code: string;
  type: OfficeType;
  status: OfficeStatus;
  address: Address;
  contact?: ContactInfo;
  manager_id?: string;
}

export interface Department extends AuditFields {
  id: string;
  tenant_id: string;
  organization_id: string;
  office_id: string;
  name: string;
  code: string;
  parent_id?: string;
  manager_id?: string;
  status: 'active' | 'inactive';
}

// ==========================================
// COMMON TYPES
// ==========================================

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
}

// ==========================================
// USER & PERMISSIONS
// ==========================================

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'TENANT_ADMIN'
  | 'ORG_ADMIN'
  | 'IT_ADMIN'
  | 'IT_TECHNICIAN'
  | 'OFFICE_ADMIN'
  | 'FINANCE'
  | 'MANAGEMENT';

export interface User extends AuditFields {
  id: string;
  tenant_id: string;
  organization_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name: string;
  avatar_url?: string | null;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  
  // Access scope
  accessible_companies: string[];
  accessible_offices: string[];
  primary_office_id?: string;
  department_id?: string;
  
  // Profile
  job_title?: string | null;
  phone?: string | null;
  employee_id?: string;
  department_name?: string | null;
  profile_completed?: boolean;
  
  // Auth
  auth_uid?: string;
  last_login?: Timestamp;
  email_verified: boolean;
  
  // Preferences
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: boolean;
  language?: string;
}

export interface Permission {
  module: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'export')[];
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// ==========================================
// ASSET MANAGEMENT
// ==========================================

export type AssetStatus = 
  | 'available'
  | 'in_use'
  | 'under_maintenance'
  | 'disposed'
  | 'lost'
  | 'reserved';

export type AssetCondition = 
  | 'new'
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor';

export interface AssetCategory extends AuditFields {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  depreciation_rate?: number;
  useful_life_months?: number;
  status: 'active' | 'inactive';
}

export interface Asset extends AuditFields {
  id: string;
  tenant_id: string;
  organization_id: string;
  company_id: string;
  office_id: string;
  department_id?: string;
  
  // Identification
  asset_tag: string;
  name: string;
  description?: string;
  category_id: string;
  
  // Details
  brand?: string;
  model?: string;
  serial_number?: string;
  
  // Status
  status: AssetStatus;
  condition: AssetCondition;
  
  // Assignment
  assigned_to?: string; // User ID
  assigned_at?: Timestamp;
  
  // Financial
  purchase_date?: Timestamp;
  purchase_price?: number;
  currency?: string;
  vendor_id?: string;
  invoice_number?: string;
  
  // Warranty
  warranty_expires?: Timestamp;
  warranty_provider?: string;
  warranty_notes?: string;
  
  // Lifecycle
  disposal_date?: Timestamp;
  disposal_reason?: string;
  disposal_value?: number;
  
  // Custom fields
  custom_fields?: Record<string, unknown>;
  
  // Media
  images?: string[];
  documents?: AssetDocument[];
}

export interface AssetDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  uploaded_at: Timestamp;
  uploaded_by: string;
}

export type AssetEventType = 
  | 'created'
  | 'updated'
  | 'assigned'
  | 'unassigned'
  | 'transferred'
  | 'maintenance_started'
  | 'maintenance_completed'
  | 'disposed'
  | 'condition_changed'
  | 'status_changed';

export interface AssetEvent {
  id: string;
  tenant_id: string;
  asset_id: string;
  event_type: AssetEventType;
  description: string;
  
  // Context
  from_office_id?: string;
  to_office_id?: string;
  from_user_id?: string;
  to_user_id?: string;
  
  // Metadata
  metadata?: Record<string, unknown>;
  
  created_at: Timestamp;
  created_by: string;
}

// ==========================================
// CONSUMABLES & STOCK
// ==========================================

export interface ConsumableCategory extends AuditFields {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  parent_id?: string;
  status: 'active' | 'inactive';
}

export interface Consumable extends AuditFields {
  id: string;
  tenant_id: string;
  organization_id: string;
  
  // Identification
  sku: string;
  name: string;
  description?: string;
  category_id: string;
  
  // Details
  brand?: string;
  model?: string;
  unit: string; // e.g., 'pcs', 'box', 'pack'
  
  // Stock settings
  minimum_stock: number;
  reorder_quantity?: number;
  
  // Status
  status: 'active' | 'discontinued';
  
  // Images
  image_url?: string;
}

export interface OfficeStock {
  id: string;
  tenant_id: string;
  office_id: string;
  consumable_id: string;
  quantity: number;
  last_restocked?: Timestamp;
  last_issued?: Timestamp;
  updated_at: Timestamp;
}

export type StockTransactionType = 
  | 'restock'
  | 'issue'
  | 'transfer_out'
  | 'transfer_in'
  | 'adjustment'
  | 'return';

export interface StockTransaction {
  id: string;
  tenant_id: string;
  office_id: string;
  consumable_id: string;
  type: StockTransactionType;
  quantity: number;
  
  // Context
  issued_to?: string; // User ID
  transferred_to_office?: string;
  transferred_from_office?: string;
  reference_number?: string;
  notes?: string;
  
  created_at: Timestamp;
  created_by: string;
}

// ==========================================
// MAINTENANCE & REPAIRS
// ==========================================

export type MaintenanceStatus = 
  | 'open'
  | 'in_progress'
  | 'waiting_parts'
  | 'completed'
  | 'cancelled';

export type MaintenancePriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type MaintenanceType = 
  | 'preventive'
  | 'corrective'
  | 'emergency'
  | 'inspection';

export interface MaintenanceTicket extends AuditFields {
  id: string;
  tenant_id: string;
  organization_id: string;
  office_id: string;
  
  // Ticket info
  ticket_number: string;
  title: string;
  description: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  
  // Related asset
  asset_id?: string;
  
  // Assignment
  assigned_to?: string; // Technician ID
  assigned_at?: Timestamp;
  
  // Vendor
  vendor_id?: string;
  vendor_reference?: string;
  
  // Timing
  reported_at: Timestamp;
  reported_by: string;
  started_at?: Timestamp;
  completed_at?: Timestamp;
  due_date?: Timestamp;
  
  // Cost
  estimated_cost?: number;
  actual_cost?: number;
  currency?: string;
  
  // Resolution
  resolution_notes?: string;
  root_cause?: string;
  
  // Parts used
  parts_used?: MaintenancePart[];
}

export interface MaintenancePart {
  consumable_id?: string;
  name: string;
  quantity: number;
  unit_cost?: number;
}

export interface MaintenanceComment {
  id: string;
  ticket_id: string;
  content: string;
  attachments?: string[];
  created_at: Timestamp;
  created_by: string;
}

// ==========================================
// PROJECTS
// ==========================================

export type ProjectStatus = 
  | 'planning'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type ProjectType = 
  | 'office_setup'
  | 'relocation'
  | 'infrastructure_upgrade'
  | 'renovation'
  | 'other';

export interface Project extends AuditFields {
  id: string;
  tenant_id: string;
  organization_id: string;
  office_id?: string;
  
  // Project info
  project_number: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  
  // Team
  project_manager_id?: string;
  team_members?: string[];
  
  // Timeline
  planned_start_date?: Timestamp;
  planned_end_date?: Timestamp;
  actual_start_date?: Timestamp;
  actual_end_date?: Timestamp;
  
  // Budget
  budget: number;
  actual_cost: number;
  currency: string;
  
  // Progress
  progress_percentage: number;
  
  // Related
  related_assets?: string[];
}

export interface ProjectMilestone extends AuditFields {
  id: string;
  project_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  due_date?: Timestamp;
  completed_at?: Timestamp;
  status: 'pending' | 'completed' | 'overdue';
  order: number;
}

export interface ProjectExpense extends AuditFields {
  id: string;
  project_id: string;
  tenant_id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  vendor_id?: string;
  invoice_number?: string;
  expense_date: Timestamp;
  receipt_url?: string;
}

// ==========================================
// VENDORS
// ==========================================

export interface Vendor extends AuditFields {
  id: string;
  tenant_id: string;
  organization_id: string;
  
  name: string;
  code: string;
  type: 'supplier' | 'service_provider' | 'contractor' | 'other';
  status: 'active' | 'inactive';
  
  // Contact
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  
  // Address
  address?: Address;
  
  // Financial
  payment_terms?: string;
  tax_id?: string;
  bank_details?: string;
  
  // Performance
  rating?: number;
  notes?: string;
}

// ==========================================
// AUDIT LOG
// ==========================================

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'assign'
  | 'transfer'
  | 'login'
  | 'logout'
  | 'export'
  | 'import';

export interface AuditLog {
  id: string;
  tenant_id: string;
  organization_id: string;
  
  // Event
  action: AuditAction;
  module: string;
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  
  // Changes
  changes?: {
    field: string;
    old_value: unknown;
    new_value: unknown;
  }[];
  
  // Context
  description: string;
  ip_address?: string;
  user_agent?: string;
  
  // Actor
  user_id: string;
  user_email: string;
  user_name: string;
  
  created_at: Timestamp;
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export type NotificationType = 
  | 'info'
  | 'warning'
  | 'error'
  | 'success';

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  
  type: NotificationType;
  title: string;
  message: string;
  
  // Link
  action_url?: string;
  action_label?: string;
  
  // Status
  read: boolean;
  read_at?: Timestamp;
  
  created_at: Timestamp;
}

// ==========================================
// DASHBOARD & REPORTING
// ==========================================

export interface DashboardStats {
  total_assets: number;
  assets_in_use: number;
  assets_available: number;
  assets_under_maintenance: number;
  
  total_consumables: number;
  low_stock_alerts: number;
  
  open_tickets: number;
  critical_tickets: number;
  
  active_projects: number;
  
  total_users: number;
  
  total_offices: number;
}

export interface AssetDistribution {
  category_id: string;
  category_name: string;
  count: number;
  value: number;
}

export interface MaintenanceCostSummary {
  period: string;
  total_cost: number;
  ticket_count: number;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ==========================================
// FORM TYPES
// ==========================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface FilterOption {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: unknown;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryParams {
  page?: number;
  page_size?: number;
  filters?: FilterOption[];
  sort?: SortOption;
  search?: string;
}
