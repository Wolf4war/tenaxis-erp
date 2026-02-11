/* ============================================
   TENAXIS - UI Store
   Global UI state management
   ============================================ */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface ConfirmDialog {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export const useUIStore = defineStore('ui', () => {
  // ==========================================
  // STATE
  // ==========================================

  // Sidebar
  const sidebarCollapsed = ref(false);
  const sidebarMobileOpen = ref(false);

  // Theme
  const isDarkMode = ref(false);

  // Loading
  const globalLoading = ref(false);
  const loadingMessage = ref<string | null>(null);

  // Toasts
  const toasts = ref<Toast[]>([]);

  // Confirm dialog
  const confirmDialog = ref<ConfirmDialog | null>(null);
  const isConfirmDialogOpen = ref(false);

  // Command palette
  const isCommandPaletteOpen = ref(false);

  // Mobile
  const isMobile = ref(false);

  // ==========================================
  // GETTERS
  // ==========================================

  const theme = computed(() => (isDarkMode.value ? 'dark' : 'light'));

  // ==========================================
  // ACTIONS
  // ==========================================

  /**
   * Initialize UI state from localStorage
   */
  function initialize(): void {
    // Load sidebar state
    const savedSidebarState = localStorage.getItem('tenaxis_sidebar_collapsed');
    if (savedSidebarState !== null) {
      sidebarCollapsed.value = savedSidebarState === 'true';
    }

    // Load theme
    const savedTheme = localStorage.getItem('tenaxis_theme');
    if (savedTheme) {
      isDarkMode.value = savedTheme === 'dark';
    } else {
      // Check system preference
      isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Apply theme
    applyTheme();

    // Check mobile
    checkMobile();
    window.addEventListener('resize', checkMobile);
  }

  /**
   * Check if mobile viewport
   */
  function checkMobile(): void {
    isMobile.value = window.innerWidth < 768;
    if (!isMobile.value) {
      sidebarMobileOpen.value = false;
    }
  }

  /**
   * Toggle sidebar
   */
  function toggleSidebar(): void {
    if (isMobile.value) {
      sidebarMobileOpen.value = !sidebarMobileOpen.value;
    } else {
      sidebarCollapsed.value = !sidebarCollapsed.value;
      localStorage.setItem('tenaxis_sidebar_collapsed', String(sidebarCollapsed.value));
    }
  }

  /**
   * Close mobile sidebar
   */
  function closeMobileSidebar(): void {
    sidebarMobileOpen.value = false;
  }

  /**
   * Toggle dark mode
   */
  function toggleDarkMode(): void {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem('tenaxis_theme', isDarkMode.value ? 'dark' : 'light');
    applyTheme();
  }

  /**
   * Apply theme to document
   */
  function applyTheme(): void {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  /**
   * Show global loading
   */
  function showLoading(message?: string): void {
    globalLoading.value = true;
    loadingMessage.value = message || null;
  }

  /**
   * Hide global loading
   */
  function hideLoading(): void {
    globalLoading.value = false;
    loadingMessage.value = null;
  }

  /**
   * Add a toast notification
   */
  function addToast(toast: Omit<Toast, 'id'>): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    
    toasts.value.push(newToast);

    // Auto remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  /**
   * Remove a toast
   */
  function removeToast(id: string): void {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  }

  /**
   * Show success toast
   */
  function showSuccess(title: string, message?: string): void {
    addToast({ type: 'success', title, message });
  }

  /**
   * Show error toast
   */
  function showError(title: string, message?: string): void {
    addToast({ type: 'error', title, message, duration: 8000 });
  }

  /**
   * Show warning toast
   */
  function showWarning(title: string, message?: string): void {
    addToast({ type: 'warning', title, message });
  }

  /**
   * Show info toast
   */
  function showInfo(title: string, message?: string): void {
    addToast({ type: 'info', title, message });
  }

  /**
   * Show confirm dialog
   */
  function confirm(options: ConfirmDialog): void {
    confirmDialog.value = options;
    isConfirmDialogOpen.value = true;
  }

  /**
   * Close confirm dialog
   */
  function closeConfirmDialog(): void {
    isConfirmDialogOpen.value = false;
    confirmDialog.value = null;
  }

  /**
   * Confirm delete action helper
   */
  function confirmDelete(
    itemName: string,
    onConfirm: () => void | Promise<void>
  ): void {
    confirm({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm,
    });
  }

  /**
   * Toggle command palette
   */
  function toggleCommandPalette(): void {
    isCommandPaletteOpen.value = !isCommandPaletteOpen.value;
  }

  /**
   * Open command palette
   */
  function openCommandPalette(): void {
    isCommandPaletteOpen.value = true;
  }

  /**
   * Close command palette
   */
  function closeCommandPalette(): void {
    isCommandPaletteOpen.value = false;
  }

  /**
   * Initialize theme from localStorage (alias for initialize)
   */
  function initializeTheme(): void {
    initialize();
  }

  /**
   * Show toast - simplified API
   */
  function showToast(options: { type: Toast['type']; title?: string; message: string }): void {
    addToast({
      type: options.type,
      title: options.title || options.type.charAt(0).toUpperCase() + options.type.slice(1),
      message: options.message,
    });
  }

  /**
   * Show confirm dialog with promise-based API
   */
  async function showConfirmDialog(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive';
  }): Promise<boolean> {
    return new Promise((resolve) => {
      confirm({
        title: options.title,
        message: options.message,
        confirmText: options.confirmLabel || 'Confirm',
        cancelText: options.cancelLabel || 'Cancel',
        variant: options.variant || 'default',
        onConfirm: () => {
          closeConfirmDialog();
          resolve(true);
        },
        onCancel: () => {
          closeConfirmDialog();
          resolve(false);
        },
      });
    });
  }

  // ==========================================
  // RETURN
  // ==========================================

  return {
    // State
    sidebarCollapsed,
    sidebarMobileOpen,
    isDarkMode,
    globalLoading,
    loadingMessage,
    toasts,
    confirmDialog,
    isConfirmDialogOpen,
    isCommandPaletteOpen,
    isMobile,

    // Getters
    theme,

    // Actions
    initialize,
    initializeTheme,
    toggleSidebar,
    closeMobileSidebar,
    toggleDarkMode,
    showLoading,
    hideLoading,
    addToast,
    removeToast,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    confirm,
    closeConfirmDialog,
    showConfirmDialog,
    confirmDelete,
    toggleCommandPalette,
    openCommandPalette,
    closeCommandPalette,
  };
});
