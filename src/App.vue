<template>
  <div class="app-container" :class="{ 'dark-theme': isDarkTheme }">
    <!-- Loading -->
    <Transition name="loading-fade">
      <div v-if="isLoading" class="loading-screen">
        <div class="loading-content">
          <div class="loading-logo">
            <i class="fas fa-graduation-cap"></i>
          </div>
          <h1 class="loading-title">ACAI</h1>
          <div class="loading-bar">
            <div class="loading-bar-fill" :style="{ width: progressWidth + '%' }"></div>
          </div>
          <p class="loading-tip">{{ loadingTip }}</p>
        </div>
      </div>
    </Transition>

    <!-- Main App -->
    <div v-show="!isLoading" class="app-main">
      <ErrorBoundary>
        <DefaultLayout />
      </ErrorBoundary>
    </div>

    <!-- Global Components -->
    <NotificationContainer />
    <LoadingOverlay />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from './stores/settings'
import { useChatStore } from './stores/chat'
import DefaultLayout from './layouts/DefaultLayout.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import NotificationContainer from './components/NotificationContainer.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'

const settingsStore = useSettingsStore()
const chatStore = useChatStore()

const isLoading = ref(true)
const progressWidth = ref(0)
const loadingTip = ref('正在初始化...')

const loadingTips = [
  '正在初始化...',
  '加载设置...',
  '准备聊天历史...',
  '即将完成...'
]

const isDarkTheme = computed(() => settingsStore.theme === 'dark')

onMounted(async () => {
  const startTime = performance.now()

  try {
    await tick(15, 1)
    settingsStore.loadSettings()

    await tick(45, 2)
    chatStore.loadChatHistory()

    await tick(75, 3)
    settingsStore.applyTheme()
    settingsStore.applySidebarState()

    await tick(95, 4)

    const elapsed = performance.now() - startTime
    if (elapsed < 400) {
      await new Promise(r => setTimeout(r, 400 - elapsed))
    }

    progressWidth.value = 100
    await new Promise(r => setTimeout(r, 150))
    isLoading.value = false
  } catch (error) {
    console.error('应用初始化失败:', error)
    isLoading.value = false
  }
})

async function tick(width: number, tipIndex: number): Promise<void> {
  progressWidth.value = width
  loadingTip.value = loadingTips[tipIndex] || loadingTips[0]
  await new Promise(r => setTimeout(r, 60))
}
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: var(--color-bg-page);
  overflow: hidden;
  position: relative;
}

.app-main {
  width: 100%;
  height: 100%;
}

/* ============ Loading Screen ============ */
.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-page);
}

.loading-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-logo {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.loading-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: 0.08em;
  margin: 0;
}

.loading-bar {
  width: 160px;
  height: 3px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.loading-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.3s var(--ease);
}

.loading-tip {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin: 0;
}

/* ============ Transition ============ */
.loading-fade-leave-active {
  transition: opacity 0.3s var(--ease);
}
.loading-fade-leave-to {
  opacity: 0;
}

/* ============ Responsive ============ */
@media (max-width: 768px) {
  .loading-logo {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
  .loading-title {
    font-size: 1.25rem;
  }
  .loading-bar {
    width: 120px;
  }
}
</style>
