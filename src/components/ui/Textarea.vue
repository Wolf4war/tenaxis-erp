<script setup lang="ts">
/* ============================================
   TENAXIS - Textarea Component
   Multi-line text input
   ============================================ */

import { computed } from 'vue';
import { cn } from '@/lib/utils';

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  error?: boolean;
  id?: string;
  name?: string;
  rows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
  readonly: false,
  error: false,
  rows: 3,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
}>();

const classes = computed(() =>
  cn(
    'flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    props.error ? 'border-destructive focus-visible:ring-destructive' : 'border-input'
  )
);

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :id="id"
    :name="name"
    :rows="rows"
    :class="classes"
    @input="handleInput"
    @blur="emit('blur', $event)"
  />
</template>
