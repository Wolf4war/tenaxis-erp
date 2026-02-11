# Tenaxis - Project Manifest

> **Enterprise Asset & Operations Management Platform**  
> Multi-tenant ERP system for managing assets, consumables, maintenance, and projects.

---

## 📋 Project Overview

| Property | Value |
|----------|-------|
| **Project Name** | Tenaxis |
| **Version** | 0.1.0 (Alpha) |
| **Tech Stack** | Vue 3 + TypeScript + Vite + Firebase |
| **UI Framework** | TailwindCSS + shadcn-vue |
| **Database** | Firebase Firestore |
| **Authentication** | Firebase Auth |
| **Last Updated** | February 11, 2026 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        TENAXIS                               │
├─────────────────────────────────────────────────────────────┤
│  Frontend: Vue 3 + TypeScript + Vite                        │
│  UI: TailwindCSS + shadcn-vue components                    │
│  State: Pinia stores                                         │
│  Backend: Firebase (Auth, Firestore, Storage)               │
├─────────────────────────────────────────────────────────────┤
│  Multi-Tenant Architecture                                   │
│  ├── Tenant (Company/Organization)                          │
│  │   ├── Organizations                                       │
│  │   ├── Companies                                           │
│  │   ├── Offices                                             │
│  │   └── Departments                                         │
│  └── Role-Based Access Control (RBAC)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Completed Features

### Core Infrastructure
- [x] Vue 3 + Vite project setup
- [x] TailwindCSS v4 configuration
- [x] Firebase integration (Auth, Firestore)
- [x] TypeScript types & interfaces
- [x] Permission system (RBAC)
- [x] Multi-tenant architecture
- [x] Dark/Light theme (shadcn neutral black theme)

### Authentication
- [x] Email/password login
- [x] Forgot password flow
- [x] Auto-create tenant on first login
- [x] Profile completion modal for new users
- [x] Session persistence

### Layout & Navigation
- [x] Sidebar navigation (always dark)
- [x] Topbar with organization switcher
- [x] Theme toggle (dark/light)
- [x] Notification system with modal
- [x] User menu dropdown
- [x] Mobile responsive sidebar

### Views (Basic Structure)
- [x] Dashboard with stats cards
- [x] Assets list/detail/form views
- [x] Consumables & Stock views
- [x] Maintenance views
- [x] Projects views
- [x] Offices views
- [x] Users views
- [x] Reports view
- [x] Audit logs view
- [x] Settings view
- [x] Profile view

---

## 🚧 In Progress

### Pinia Stores
- [x] Auth store (complete)
- [x] UI store (complete)
- [ ] Asset store (needs data connection)
- [ ] Other module stores

### Services
- [x] Base service layer
- [x] User service
- [x] Organization service
- [x] Tenant service
- [ ] Connect views to real Firestore data

---

## 📝 TODO - Priority Tasks

### High Priority
1. **Connect Dashboard to Real Data**
   - Fetch actual asset counts
   - Fetch maintenance tickets
   - Fetch low stock alerts
   - Real activity feed from audit logs

2. **Asset Management Module**
   - CRUD operations with Firestore
   - Asset categories management
   - Asset assignment to offices/users
   - QR code generation for assets

3. **User Management**
   - User invitation system
   - Role assignment
   - Office/company access control

4. **Firestore Security Rules**
   - Tenant isolation rules
   - Role-based document access
   - Field-level security

### Medium Priority
5. **Consumables & Stock**
   - Stock level tracking
   - Low stock alerts
   - Stock movement history

6. **Maintenance Module**
   - Maintenance scheduling
   - Work order management
   - Technician assignment

7. **Projects Module**
   - Project creation & tracking
   - Task management
   - Budget tracking

8. **Reports Module**
   - Asset reports
   - Maintenance reports
   - Stock reports
   - Export to PDF/Excel

### Low Priority
9. **Organization Switcher**
   - Multiple organization support
   - Organization creation

10. **Notifications System**
    - Real-time notifications
    - Email notifications
    - Notification preferences

---

## 🐛 Known Issues / Bugs

| Issue | Description | Status |
|-------|-------------|--------|
| Analytics Blocked | Firebase Analytics blocked by ad blockers | ✅ Handled gracefully |
| Multiple Tenants | Demo data created multiple tenant records | 🔧 Clean up in Firebase |
| Profile Modal | Shows on every login until profile_completed is set | ✅ Working as intended |

---

## 🔮 Future Enhancements

### Phase 2
- [ ] Barcode/QR code scanning for assets
- [ ] Mobile app (Vue + Capacitor)
- [ ] Offline support with local caching
- [ ] Bulk import/export (CSV, Excel)
- [ ] Document attachments for assets
- [ ] Maintenance scheduling calendar
- [ ] Email notifications

### Phase 3
- [ ] Advanced analytics dashboard
- [ ] Custom report builder
- [ ] API access for integrations
- [ ] Audit trail exports
- [ ] Multi-language support (i18n)
- [ ] White-labeling options

### Phase 4
- [ ] IoT sensor integration
- [ ] Predictive maintenance AI
- [ ] Vendor portal
- [ ] Purchase order management
- [ ] Depreciation tracking

---

## 🗂️ Project Structure

```
src/
├── assets/           # Static assets & styles
├── components/       # Reusable Vue components
│   ├── layout/       # AppSidebar, AppTopbar
│   ├── modals/       # ProfileCompletionModal
│   └── ui/           # Button, Input, Modal, etc.
├── composables/      # Vue composables (usePermission, etc.)
├── layouts/          # MainLayout, AuthLayout
├── lib/              # Utilities (firebase, permissions, utils)
├── router/           # Vue Router configuration
├── services/         # Firestore service layer
├── stores/           # Pinia stores
├── types/            # TypeScript interfaces
└── views/            # Page components
    ├── assets/
    ├── auth/
    ├── consumables/
    ├── maintenance/
    ├── projects/
    └── ...
```

---

## 🔐 Environment Variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_DATABASE_URL=
```

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 👥 Team Notes

- **Owner**: Khaled Faiz (Super Admin)
- **Firebase Project**: tenaxis-69a27
- **Repository**: https://github.com/Wolf4war/tenaxis-erp

---

## 🏷️ Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes

### Version Commands
```bash
# Bump patch version (0.1.0 → 0.1.1)
npm version patch -m "v%s - Description"

# Bump minor version (0.1.0 → 0.2.0)
npm version minor -m "v%s - Description"

# Bump major version (0.1.0 → 1.0.0)
npm version major -m "v%s - Description"

# Push with tags
git push && git push --tags
```

---

## 📅 Changelog

### 2026-02-11
- Initial project setup
- Firebase authentication working
- Profile completion modal added
- Theme changed to shadcn neutral black
- Notification system with modal
- Basic views structure complete

---

*Last updated: February 11, 2026*
