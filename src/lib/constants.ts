/* ============================================
   TENAXIS - Constants
   Application-wide constant definitions
   ============================================ */

// ==========================================
// APPLICATION INFO
// ==========================================

export const APP_NAME = 'Tenaxis';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Multi-Tenant ERP Platform';

// ==========================================
// ASSET CONSTANTS
// ==========================================

export const ASSET_STATUSES = [
  { value: 'available', label: 'Available', color: 'green' },
  { value: 'in_use', label: 'In Use', color: 'blue' },
  { value: 'under_maintenance', label: 'Under Maintenance', color: 'yellow' },
  { value: 'disposed', label: 'Disposed', color: 'gray' },
  { value: 'lost', label: 'Lost', color: 'red' },
  { value: 'reserved', label: 'Reserved', color: 'purple' },
] as const;

export const ASSET_CONDITIONS = [
  { value: 'new', label: 'New', color: 'green' },
  { value: 'excellent', label: 'Excellent', color: 'emerald' },
  { value: 'good', label: 'Good', color: 'blue' },
  { value: 'fair', label: 'Fair', color: 'yellow' },
  { value: 'poor', label: 'Poor', color: 'red' },
] as const;

// ==========================================
// MAINTENANCE CONSTANTS
// ==========================================

export const MAINTENANCE_STATUSES = [
  { value: 'open', label: 'Open', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'yellow' },
  { value: 'waiting_parts', label: 'Waiting Parts', color: 'orange' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' },
] as const;

export const MAINTENANCE_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'critical', label: 'Critical', color: 'red' },
] as const;

export const MAINTENANCE_TYPES = [
  { value: 'preventive', label: 'Preventive' },
  { value: 'corrective', label: 'Corrective' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'inspection', label: 'Inspection' },
] as const;

// ==========================================
// PROJECT CONSTANTS
// ==========================================

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', color: 'gray' },
  { value: 'in_progress', label: 'In Progress', color: 'blue' },
  { value: 'on_hold', label: 'On Hold', color: 'yellow' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
] as const;

export const PROJECT_TYPES = [
  { value: 'office_setup', label: 'Office Setup' },
  { value: 'relocation', label: 'Relocation' },
  { value: 'infrastructure_upgrade', label: 'Infrastructure Upgrade' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'other', label: 'Other' },
] as const;

// ==========================================
// OFFICE CONSTANTS
// ==========================================

export const OFFICE_TYPES = [
  { value: 'headquarters', label: 'Headquarters' },
  { value: 'branch', label: 'Branch' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'remote', label: 'Remote' },
] as const;

export const OFFICE_STATUSES = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
] as const;

// ==========================================
// VENDOR CONSTANTS
// ==========================================

export const VENDOR_TYPES = [
  { value: 'supplier', label: 'Supplier' },
  { value: 'service_provider', label: 'Service Provider' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'other', label: 'Other' },
] as const;

// ==========================================
// USER CONSTANTS
// ==========================================

export const USER_STATUSES = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
  { value: 'pending', label: 'Pending', color: 'yellow' },
] as const;

export const USER_ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Administrator' },
  { value: 'TENANT_ADMIN', label: 'Tenant Administrator' },
  { value: 'ORG_ADMIN', label: 'Organization Administrator' },
  { value: 'IT_ADMIN', label: 'IT Administrator' },
  { value: 'IT_TECHNICIAN', label: 'IT Technician' },
  { value: 'OFFICE_ADMIN', label: 'Office Administrator' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'MANAGEMENT', label: 'Management' },
] as const;

// ==========================================
// STOCK CONSTANTS
// ==========================================

export const CONSUMABLE_STATUSES = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'discontinued', label: 'Discontinued', color: 'gray' },
] as const;

export const CONSUMABLE_CATEGORIES = [
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'cleaning', label: 'Cleaning Supplies' },
  { value: 'safety', label: 'Safety Equipment' },
  { value: 'tools', label: 'Tools' },
  { value: 'other', label: 'Other' },
] as const;

export const STOCK_TRANSACTION_TYPES = [
  { value: 'restock', label: 'Restock', icon: 'plus' },
  { value: 'issue', label: 'Issue', icon: 'minus' },
  { value: 'transfer_out', label: 'Transfer Out', icon: 'arrow-right' },
  { value: 'transfer_in', label: 'Transfer In', icon: 'arrow-left' },
  { value: 'adjustment', label: 'Adjustment', icon: 'edit' },
  { value: 'return', label: 'Return', icon: 'rotate-ccw' },
] as const;

export const CONSUMABLE_UNITS = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'set', label: 'Set' },
  { value: 'roll', label: 'Roll' },
  { value: 'ream', label: 'Ream' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'liter', label: 'Liter' },
] as const;

// ==========================================
// PAGINATION DEFAULTS
// ==========================================

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ==========================================
// DATE FORMATS
// ==========================================

export const DATE_FORMATS = {
  SHORT: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MMM d, yyyy h:mm a',
  ISO: 'yyyy-MM-dd',
} as const;

// ==========================================
// CURRENCY CODES
// ==========================================

export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'AED', label: 'UAE Dirham', symbol: 'د.إ' },
  { value: 'SAR', label: 'Saudi Riyal', symbol: '﷼' },
  { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { value: 'PKR', label: 'Pakistani Rupee', symbol: '₨' },
] as const;

// ==========================================
// COUNTRIES
// ==========================================

export const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'IN', label: 'India' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'EG', label: 'Egypt' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'KE', label: 'Kenya' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
] as const;

// ==========================================
// COLLECTION NAMES
// ==========================================

export const COLLECTIONS = {
  TENANTS: 'tenants',
  ORGANIZATIONS: 'organizations',
  COMPANIES: 'companies',
  OFFICES: 'offices',
  DEPARTMENTS: 'departments',
  USERS: 'users',
  ASSETS: 'assets',
  ASSET_EVENTS: 'events',
  ASSET_CATEGORIES: 'asset_categories',
  CONSUMABLES: 'consumables',
  CONSUMABLE_CATEGORIES: 'consumable_categories',
  OFFICE_STOCK: 'office_stock',
  STOCK_TRANSACTIONS: 'stock_transactions',
  MAINTENANCE: 'maintenance',
  MAINTENANCE_COMMENTS: 'comments',
  PROJECTS: 'projects',
  PROJECT_MILESTONES: 'milestones',
  PROJECT_EXPENSES: 'expenses',
  VENDORS: 'vendors',
  AUDIT_LOGS: 'audit_logs',
  NOTIFICATIONS: 'notifications',
} as const;

// ==========================================
// LOCAL STORAGE KEYS
// ==========================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'tenaxis_auth_token',
  CURRENT_TENANT: 'tenaxis_current_tenant',
  CURRENT_ORG: 'tenaxis_current_org',
  THEME: 'tenaxis_theme',
  SIDEBAR_COLLAPSED: 'tenaxis_sidebar_collapsed',
  TABLE_PAGE_SIZE: 'tenaxis_table_page_size',
} as const;
