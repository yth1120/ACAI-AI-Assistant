<template>
  <div class="feature-container">
    <!-- 特性头部 -->
    <div
      v-if="showHeader"
      class="feature-header"
    >
      <div class="header-left">
        <h3>
          <i
            v-if="icon"
            :class="icon"
          />
          {{ title }}
        </h3>
        <p v-if="description">
          {{ description }}
        </p>
      </div>
      <div
        v-if="$slots.actions"
        class="header-actions"
      >
        <slot name="actions" />
      </div>
    </div>

    <!-- 主要内容区 -->
    <div
      class="feature-content"
      :class="contentClass"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  contentClass: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.feature-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.feature-header {
  padding: clamp(16px, 3vw, 20px);
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.header-left {
  flex: 1;
  min-width: 0;
}

.feature-header h3 {
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  color: var(--color-text-primary);
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.feature-header h3 i {
  font-size: clamp(1rem, 1.8vw, 1.25rem);
}

.feature-header p {
  color: var(--color-text-secondary);
  font-size: clamp(0.813rem, 1.5vw, 0.9rem);
  margin: 0;
}

.header-actions {
  flex-shrink: 0;
}

.feature-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: clamp(16px, 3vw, 20px);
}

/* 响应式 - 平板 */
@media (max-width: 1024px) {
  .feature-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }
}

/* 响应式 - 移动端 */
@media (max-width: 768px) {
  .feature-header {
    padding: 12px 16px;
  }

  .feature-content {
    padding: 16px;
  }

  .header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

/* 深色主题 */
.dark-theme .feature-header {
  background: var(--color-bg-secondary);
  border-bottom-color: var(--color-border);
}

.dark-theme .feature-header h3 {
  color: var(--color-text-primary);
}

.dark-theme .feature-header p {
  color: var(--color-text-secondary);
}
</style>
