<!-- ============================================
   TENAXIS - Profile Completion Modal
   First-time user profile setup
   ============================================ -->

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { userService } from '@/services';
import Modal from '@/components/ui/Modal.vue';
import Button from '@/components/ui/Button.vue';
import Input from '@/components/ui/Input.vue';
import Label from '@/components/ui/Label.vue';
import Select from '@/components/ui/Select.vue';
import { Loader2, User, Phone, Building2 } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'completed'): void;
}>();

const authStore = useAuthStore();

// Form state
const isSubmitting = ref(false);
const formData = ref({
  first_name: '',
  last_name: '',
  phone: '',
  job_title: '',
  department: '',
});

const formErrors = ref<Record<string, string>>({});

// Department options
const departmentOptions = [
  { value: 'operations', label: 'Operations' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'it', label: 'IT' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'procurement', label: 'Procurement' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'management', label: 'Management' },
  { value: 'other', label: 'Other' },
];

// Computed
const isFormValid = computed(() => {
  return formData.value.first_name.trim() !== '' && 
         formData.value.last_name.trim() !== '';
});

const displayName = computed(() => {
  const first = formData.value.first_name.trim();
  const last = formData.value.last_name.trim();
  return `${first} ${last}`.trim();
});

// Methods
function validateForm(): boolean {
  formErrors.value = {};
  
  if (!formData.value.first_name.trim()) {
    formErrors.value.first_name = 'First name is required';
  }
  
  if (!formData.value.last_name.trim()) {
    formErrors.value.last_name = 'Last name is required';
  }
  
  return Object.keys(formErrors.value).length === 0;
}

async function handleSubmit() {
  if (!validateForm()) return;
  
  isSubmitting.value = true;
  
  try {
    const userId = authStore.currentUser?.id;
    if (!userId) {
      throw new Error('User not found');
    }
    
    // Update user profile
    await userService.update(userId, {
      first_name: formData.value.first_name.trim(),
      last_name: formData.value.last_name.trim(),
      display_name: displayName.value,
      phone: formData.value.phone.trim() || null,
      job_title: formData.value.job_title.trim() || null,
      department_name: formData.value.department || null,
      profile_completed: true,
    }, userId);
    
    // Update the store
    if (authStore.currentUser) {
      authStore.currentUser.first_name = formData.value.first_name.trim();
      authStore.currentUser.last_name = formData.value.last_name.trim();
      authStore.currentUser.display_name = displayName.value;
      authStore.currentUser.profile_completed = true;
    }
    
    emit('completed');
    emit('update:open', false);
  } catch (error) {
    console.error('Error updating profile:', error);
    formErrors.value.submit = 'Failed to update profile. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  // Don't allow closing - profile completion is mandatory
}
</script>

<template>
  <Modal 
    :open="open" 
    size="md"
    :closable="false"
    @close="handleClose"
  >
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6 -mt-2">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <User class="h-6 w-6 text-primary" />
      </div>
      <div>
        <h2 class="text-xl font-semibold">Complete Your Profile</h2>
        <p class="text-sm text-muted-foreground">
          Let's set up your profile to get started
        </p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Name Fields -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="first_name">
            First Name <span class="text-destructive">*</span>
          </Label>
          <Input
            id="first_name"
            v-model="formData.first_name"
            placeholder="John"
            :error="!!formErrors.first_name"
          />
          <p v-if="formErrors.first_name" class="text-xs text-destructive">
            {{ formErrors.first_name }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="last_name">
            Last Name <span class="text-destructive">*</span>
          </Label>
          <Input
            id="last_name"
            v-model="formData.last_name"
            placeholder="Doe"
            :error="!!formErrors.last_name"
          />
          <p v-if="formErrors.last_name" class="text-xs text-destructive">
            {{ formErrors.last_name }}
          </p>
        </div>
      </div>

      <!-- Phone -->
      <div class="space-y-2">
        <Label for="phone" class="flex items-center gap-2">
          <Phone class="h-4 w-4 text-muted-foreground" />
          Phone Number
        </Label>
        <Input
          id="phone"
          v-model="formData.phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <!-- Job Title -->
      <div class="space-y-2">
        <Label for="job_title" class="flex items-center gap-2">
          <Building2 class="h-4 w-4 text-muted-foreground" />
          Job Title
        </Label>
        <Input
          id="job_title"
          v-model="formData.job_title"
          placeholder="e.g. Operations Manager"
        />
      </div>

      <!-- Department -->
      <div class="space-y-2">
        <Label for="department">Department</Label>
        <Select
          id="department"
          v-model="formData.department"
          :options="departmentOptions"
          placeholder="Select department"
        />
      </div>

      <!-- Error Message -->
      <p v-if="formErrors.submit" class="text-sm text-destructive text-center">
        {{ formErrors.submit }}
      </p>

      <!-- Preview -->
      <div v-if="displayName" class="rounded-lg bg-muted/50 p-3">
        <p class="text-sm text-muted-foreground">
          You'll appear as: <span class="font-medium text-foreground">{{ displayName }}</span>
        </p>
      </div>

      <!-- Submit Button -->
      <Button 
        type="submit" 
        class="w-full" 
        :disabled="!isFormValid || isSubmitting"
      >
        <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
        {{ isSubmitting ? 'Saving...' : 'Complete Setup' }}
      </Button>
    </form>
  </Modal>
</template>
