<template>
  <transition name="fade">
    <div
      v-if="isLoading"
      class="loading-overlay"
    >
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner" />
        </div>
        <p class="loading-text">
          {{ loadingText }}
        </p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useLoading } from '@/composables/useLoading'

const { isLoading, loadingText } = useLoading()
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
}

.loading-content {
  background: var(--color-bg-primary);
  padding: 40px 60px;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 400px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
}

.spinner {
  width: 100%;
  height: 100%;
  border: 4px solid var(--color-bg-tertiary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin: 0;
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
