<template>
  <div class="layout-container">
    <!-- Mobile Header -->
    <div v-if="isMobile" class="mobile-header">
      <button class="mobile-btn" @click="toggleMobileSidebar">
        <i class="fas fa-bars"></i>
      </button>
      <h1 class="mobile-title">ACAI</h1>
      <button class="mobile-btn" @click="goToSettings">
        <i class="fas fa-plus"></i>
      </button>
    </div>

    <!-- Tools Menu Dropdown -->
    <div v-if="showToolsMenu && !isMobile" class="tools-dropdown">
      <button class="tool-item" @click="goToChat(); showToolsMenu = false">
        <i class="fa-solid fa-comments"></i>
        <span>智能对话</span>
      </button>
      <button class="tool-item" @click="goToPage('/translate')">
        <i class="fa-solid fa-language"></i>
        <span>翻译助手</span>
      </button>
      <button class="tool-item" @click="goToPage('/code')">
        <i class="fa-solid fa-code"></i>
        <span>代码助手</span>
      </button>
      <button class="tool-item" @click="goToPage('/analysis')">
        <i class="fa-solid fa-file-lines"></i>
        <span>文本分析</span>
      </button>
      <button class="tool-item" @click="goToPage('/writing')">
        <i class="fa-solid fa-pen-nib"></i>
        <span>写作助手</span>
      </button>
      <button class="tool-item" @click="goToPage('/agent')">
        <i class="fa-solid fa-robot"></i>
        <span>文档 Agent</span>
      </button>
    </div>
    <div v-if="showToolsMenu && !isMobile" class="tools-overlay" @click="showToolsMenu = false"></div>

    <!-- Mobile Overlay -->
    <div
      v-if="isMobile && showMobileSidebar"
      class="mobile-overlay"
      @click="toggleMobileSidebar"
    ></div>

    <!-- Sidebar -->
    <Sidebar
      ref="sidebarRef"
      :class="{ 'mobile-show': showMobileSidebar }"
      @navigate="handleNavigate"
    />

    <!-- Floating Expand Button (when sidebar collapsed, except chat page) -->
    <button
      v-if="settingsStore.sidebarCollapsed && !isMobile && route.path !== '/chat'"
      class="expand-sidebar-float"
      @click="settingsStore.toggleSidebar()"
      title="展开侧边栏"
    >
      <i class="fa-solid fa-bars"></i>
    </button>

    <!-- Main Area -->
    <div class="layout-main">
      <main class="layout-content">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const route = useRoute()
const settingsStore = useSettingsStore()
const sidebarRef = ref<InstanceType<typeof Sidebar> | null>(null)

const windowWidth = ref(window.innerWidth)
const showMobileSidebar = ref(false)
const showToolsMenu = ref(false)

const isMobile = computed(() => windowWidth.value < 768)

function handleResize() {
  windowWidth.value = window.innerWidth
  if (windowWidth.value >= 768) {
    showMobileSidebar.value = false
  }
}

function toggleMobileSidebar() {
  showMobileSidebar.value = !showMobileSidebar.value
}

function handleNavigate() {
  if (isMobile.value) {
    showMobileSidebar.value = false
  }
  showToolsMenu.value = false
}

function goToSettings() {
  router.push('/chat')
}

function goToChat() {
  router.push('/chat')
}

function goToPage(path: string) {
  router.push(path)
  showToolsMenu.value = false
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

/* ============ Floating Expand Button ============ */
.expand-sidebar-float {
  position: fixed;
  top: 12px;
  left: 12px;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  font-size: 16px;
  transition: all 0.2s;
}

.expand-sidebar-float:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

/* ============ Main ============ */
.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-page);
  min-width: 0;
  position: relative;
}

.layout-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ============ Mobile Header ============ */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
}

.mobile-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.mobile-title {
  font-size: var(--text-lg);
  font-weight: 700;
  margin: 0;
  color: var(--color-primary);
}

/* ============ Tools Menu Dropdown ============ */
.tools-dropdown {
  position: fixed;
  top: 52px;
  left: 8px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 4px;
  z-index: 100;
}

.tools-dropdown .tool-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
}

.tools-dropdown .tool-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.tools-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
}

/* ============ Mobile Overlay ============ */
.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 99;
}

/* ============ Responsive ============ */
@media (max-width: 768px) {
  .layout-main {
    padding-top: var(--header-height);
  }

  .layout-content {
    height: calc(100vh - var(--header-height));
  }
}
</style>
