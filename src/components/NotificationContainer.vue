<template>
  <div class="notification-container">
    <transition-group
      name="notification"
      tag="div"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="`notification-${notification.type}`"
        @click="removeNotification(notification.id)"
      >
        <div class="notification-icon">
          <i :class="getIcon(notification.type)" />
        </div>
        <div class="notification-content">
          <p>{{ notification.message }}</p>
        </div>
        <button
          class="notification-close"
          @click.stop="removeNotification(notification.id)"
        >
          <i class="fas fa-times" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useNotification } from '@/composables/useNotification'

const { notifications, remove } = useNotification()

function getIcon(type) {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  }
  return icons[type] || icons.info
}

function removeNotification(id) {
  remove(id)
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.notification {
  min-width: 320px;
  max-width: 480px;
  padding: 16px 20px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  pointer-events: all;
  transition: all var(--duration-base) var(--ease-in-out);
  color: var(--color-text-primary);
  border-left: 4px solid var(--color-border);
}

.notification:hover {
  transform: translateX(-4px);
  box-shadow: var(--shadow-xl);
}

.notification-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-content p {
  margin: 0;
  font-size: var(--text-base);
  line-height: 1.5;
  font-weight: 500;
  word-wrap: break-word;
}

.notification-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.2s;
  border-radius: var(--radius-xs);
}

.notification-close:hover {
  opacity: 1;
  background: var(--color-bg-hover);
}

/* Success */
.notification-success {
  background: var(--color-success-light);
  color: var(--color-success);
  border-left-color: var(--color-success);
}

.notification-success .notification-icon {
  color: var(--color-success);
}

/* Error */
.notification-error {
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-left-color: var(--color-danger);
}

.notification-error .notification-icon {
  color: var(--color-danger);
}

/* Warning */
.notification-warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
  border-left-color: var(--color-warning);
}

.notification-warning .notification-icon {
  color: var(--color-warning);
}

/* Info */
.notification-info {
  background: var(--color-info-light);
  color: var(--color-info);
  border-left-color: var(--color-info);
}

.notification-info .notification-icon {
  color: var(--color-info);
}

/* Animations */
.notification-enter-active {
  animation: slideIn 0.3s ease-out;
}

.notification-leave-active {
  animation: slideOut 0.3s ease-in;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>
