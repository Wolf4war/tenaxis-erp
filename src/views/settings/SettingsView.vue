<script setup lang="ts">
/* ============================================
   TENAXIS - Settings View
   System settings and configuration
   ============================================ */

import { ref, onMounted } from 'vue';
import { useUIStore } from '@/stores';
import {
  Button,
  Input,
  Label,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui';
import { Save, Building2, Globe, Shield, Bell, Palette } from 'lucide-vue-next';
import { CURRENCIES } from '@/lib/constants';

const uiStore = useUIStore();

const isSaving = ref(false);
const activeTab = ref('general');

// Settings form
const settings = ref({
  // General
  organization_name: '',
  timezone: 'UTC',
  date_format: 'YYYY-MM-DD',
  currency: 'USD',
  
  // Notifications
  email_notifications: true,
  maintenance_alerts: true,
  stock_alerts: true,
  
  // Security
  session_timeout: 30,
  require_2fa: false,
});

const tabs = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'localization', label: 'Localization', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

const currencyOptions = CURRENCIES.map((c) => ({
  value: c.value,
  label: `${c.label} (${c.symbol})`,
}));

const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const dateFormatOptions = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-01-15)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (15/01/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (01/15/2024)' },
  { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY (15-Jan-2024)' },
];

const handleSave = async () => {
  isSaving.value = true;
  try {
    // TODO: Implement settings save through TenantService
    await new Promise((resolve) => setTimeout(resolve, 1000));
    uiStore.showToast({
      type: 'success',
      message: 'Settings saved successfully',
    });
  } catch (error) {
    uiStore.showToast({
      type: 'error',
      message: 'Failed to save settings',
    });
  } finally {
    isSaving.value = false;
  }
};

// Dark mode
const isDarkMode = ref(false);

onMounted(() => {
  isDarkMode.value = document.documentElement.classList.contains('dark');
});

const setTheme = (dark: boolean) => {
  isDarkMode.value = dark;
  document.documentElement.classList.toggle('dark', dark);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold">Settings</h1>
      <p class="text-muted-foreground">
        Configure system settings and preferences
      </p>
    </div>

    <div class="flex flex-col gap-6 lg:flex-row">
      <!-- Sidebar tabs -->
      <nav class="w-full shrink-0 lg:w-64">
        <ul class="space-y-1">
          <li v-for="tab in tabs" :key="tab.id">
            <button
              class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
              :class="
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              "
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" class="h-4 w-4" />
              {{ tab.label }}
            </button>
          </li>
        </ul>
      </nav>

      <!-- Content area -->
      <div class="flex-1 space-y-6">
        <!-- General Settings -->
        <Card v-if="activeTab === 'general'">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic organization configuration</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="org_name">Organization Name</Label>
              <Input
                id="org_name"
                v-model="settings.organization_name"
                placeholder="Enter organization name"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button :loading="isSaving" @click="handleSave">
              <Save class="h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <!-- Localization Settings -->
        <Card v-if="activeTab === 'localization'">
          <CardHeader>
            <CardTitle>Localization</CardTitle>
            <CardDescription>Regional and format settings</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="timezone">Timezone</Label>
                <Select
                  id="timezone"
                  v-model="settings.timezone"
                  :options="timezoneOptions"
                />
              </div>

              <div class="space-y-2">
                <Label for="date_format">Date Format</Label>
                <Select
                  id="date_format"
                  v-model="settings.date_format"
                  :options="dateFormatOptions"
                />
              </div>

              <div class="space-y-2">
                <Label for="currency">Default Currency</Label>
                <Select
                  id="currency"
                  v-model="settings.currency"
                  :options="currencyOptions"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button :loading="isSaving" @click="handleSave">
              <Save class="h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <!-- Notification Settings -->
        <Card v-if="activeTab === 'notifications'">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure alert preferences</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Email Notifications</p>
                <p class="text-sm text-muted-foreground">
                  Receive important updates via email
                </p>
              </div>
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="settings.email_notifications ? 'bg-primary' : 'bg-muted'"
                @click="settings.email_notifications = !settings.email_notifications"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="settings.email_notifications ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Maintenance Alerts</p>
                <p class="text-sm text-muted-foreground">
                  Get notified about critical maintenance issues
                </p>
              </div>
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="settings.maintenance_alerts ? 'bg-primary' : 'bg-muted'"
                @click="settings.maintenance_alerts = !settings.maintenance_alerts"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="settings.maintenance_alerts ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Low Stock Alerts</p>
                <p class="text-sm text-muted-foreground">
                  Get notified when inventory is running low
                </p>
              </div>
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="settings.stock_alerts ? 'bg-primary' : 'bg-muted'"
                @click="settings.stock_alerts = !settings.stock_alerts"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="settings.stock_alerts ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
          </CardContent>
          <CardFooter>
            <Button :loading="isSaving" @click="handleSave">
              <Save class="h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <!-- Security Settings -->
        <Card v-if="activeTab === 'security'">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Security and access settings</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="space-y-2">
              <Label for="session_timeout">Session Timeout (minutes)</Label>
              <Input
                id="session_timeout"
                v-model.number="settings.session_timeout"
                type="number"
                min="5"
                max="480"
              />
              <p class="text-xs text-muted-foreground">
                Users will be logged out after this period of inactivity
              </p>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Require Two-Factor Authentication</p>
                <p class="text-sm text-muted-foreground">
                  Enforce 2FA for all users
                </p>
              </div>
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="settings.require_2fa ? 'bg-primary' : 'bg-muted'"
                @click="settings.require_2fa = !settings.require_2fa"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="settings.require_2fa ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>
          </CardContent>
          <CardFooter>
            <Button :loading="isSaving" @click="handleSave">
              <Save class="h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <!-- Appearance Settings -->
        <Card v-if="activeTab === 'appearance'">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div>
              <p class="mb-3 font-medium">Theme</p>
              <div class="grid gap-3 sm:grid-cols-3">
                <button
                  class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:bg-muted"
                  :class="{ 'border-primary': !isDarkMode }"
                  @click="setTheme(false)"
                >
                  <div class="h-10 w-10 rounded-full bg-white border border-border" />
                  <span class="text-sm">Light</span>
                </button>

                <button
                  class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:bg-muted"
                  :class="{ 'border-primary': isDarkMode }"
                  @click="setTheme(true)"
                >
                  <div class="h-10 w-10 rounded-full bg-zinc-900" />
                  <span class="text-sm">Dark</span>
                </button>

                <button
                  class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:bg-muted opacity-50 cursor-not-allowed"
                  disabled
                >
                  <div class="h-10 w-10 rounded-full bg-gradient-to-r from-white to-zinc-900" />
                  <span class="text-sm">System</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
