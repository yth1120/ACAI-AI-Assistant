<template>
  <button
    class="base-button"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    :title="title"
    @click="handleClick"
    @mouseenter="$emit('mouseenter', $event)"
    @mouseleave="$emit('mouseleave', $event)"
    @focus="$emit('focus', $event)"
    @blur="$emit('blur', $event)"
  >
    <div v-if="loading" class="btn-spinner" />
    <i v-else-if="icon" :class="icon" class="btn-icon" />
    <span class="btn-text">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BaseButtonProps, BaseButtonEmits } from './BaseButton.types'

const props = withDefaults(defineProps<BaseButtonProps>(), {
  variant: 'primary',
  size: 'md',
  block: false,
  loading: false,
  disabled: false,
  icon: '',
  type: 'button'
})

const emit = defineEmits<BaseButtonEmits>()

const buttonClasses = computed(() => [
  `btn-${props.variant}`,
  `btn-${props.size}`,
  {
    'btn-block': props.block,
    'btn-loading': props.loading,
    'btn-disabled': props.disabled || props.loading
  }
])

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event as any)
  }
}
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  text-decoration: none;
  user-select: none;
  gap: 6px;
  transition: background var(--duration-fast) var(--ease),
              color var(--duration-fast) var(--ease),
              border-color var(--duration-fast) var(--ease),
              box-shadow var(--duration-fast) var(--ease),
              transform var(--duration-fast) var(--ease);
}

.base-button:focus {
  outline: none;
}

.base-button:active:not(.btn-disabled) {
  transform: scale(0.98);
}

/* ============ Variants ============ */
.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(.btn-disabled) {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.btn-secondary:hover:not(.btn-disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.btn-ghost:hover:not(.btn-disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.btn-link {
  background: transparent;
  color: var(--color-primary);
  text-decoration: underline;
}

.btn-link:hover:not(.btn-disabled) {
  color: var(--color-primary-hover);
}

/* ============ Sizes ============ */
.btn-xs {
  padding: 4px 8px;
  font-size: var(--text-xs);
  height: 24px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: var(--text-xs);
  height: 30px;
}

.btn-md {
  padding: 8px 16px;
  font-size: var(--text-sm);
  height: 36px;
}

.btn-lg {
  padding: 10px 20px;
  font-size: var(--text-base);
  height: 42px;
}

/* ============ Block ============ */
.btn-block {
  width: 100%;
}

/* ============ Loading ============ */
.btn-loading {
  cursor: wait;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============ Disabled ============ */
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============ Icon ============ */
.btn-icon {
  font-size: 0.95em;
}
</style>
