/* ============================================
   TENAXIS - Services Index
   Export all service modules
   ============================================ */

// Base service
export { BaseService, buildQueryConstraints } from './base.service';

// Asset services
export { assetService, assetCategoryService } from './asset.service';

// Audit service
export { auditLogService } from './audit.service';

// Organization services
export { 
  tenantService, 
  organizationService, 
  companyService, 
  officeService, 
  departmentService 
} from './organization.service';

// User service
export { userService } from './user.service';

// Consumable services
export { consumableService, stockService } from './consumable.service';

// Maintenance service
export { maintenanceService } from './maintenance.service';

// Project service
export { projectService } from './project.service';

// Vendor service
export { vendorService } from './vendor.service';
