/**
 * Vue 错误处理组件
 * 用于捕获和显示组件错误
 */
<template>
  <div
    v-if="hasError"
    class="error-boundary"
  >
    <div class="error-container">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle" />
      </div>
      <h2>哎呀，出错了</h2>
      <p class="error-message">
        {{ errorMessage }}
      </p>
      <div class="error-actions">
        <button
          class="btn-primary"
          @click="reload"
        >
          <i class="fas fa-redo" /> 重新加载
        </button>
        <button
          class="btn-secondary"
          @click="goHome"
        >
          <i class="fas fa-home" /> 返回首页
        </button>
      </div>
      <details
        v-if="errorDetails"
        class="error-details"
      >
        <summary>查看详细信息</summary>
        <pre>{{ errorDetails }}</pre>
      </details>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')

onErrorCaptured((err, instance, info) => {
  console.error('捕获到组件错误:', err)
  console.error('错误信息:', info)
  
  hasError.value = true
  errorMessage.value = err.message || '未知错误'
  errorDetails.value = `错误堆栈:
${err.stack}

组件信息:
${info}`
  
  // 阻止错误继续向上传播
  return false
})

function reload() {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  window.location.reload()
}

function goHome() {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  router.push('/')
}
</script>

<style scoped>
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  padding: 2rem;
}

.error-container {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  padding: 3rem;
  max-width: 600px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-xl);
}

.error-icon {
  font-size: 4rem;
  color: var(--color-danger);
  margin-bottom: 1.5rem;
}

.error-container h2 {
  font-size: var(--text-2xl);
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.error-message {
  color: var(--color-text-secondary);
  font-size: var(--text-md);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-in-out);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--brand-gradient);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow);
}

.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background: var(--color-bg-hover);
}

.error-details {
  text-align: left;
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.error-details summary {
  font-weight: 500;
  color: var(--color-text-secondary);
  user-select: none;
}

.error-details pre {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-code-bg);
  color: var(--color-text-primary);
  border-radius: var(--radius-sm);
  overflow-x: auto;
  font-size: var(--text-sm);
  line-height: 1.5;
}
</style>
