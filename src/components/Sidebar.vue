<template>
  <div class="sidebar-wrapper">


    <!-- Full Sidebar -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <!-- Header with Brand -->
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-logo">
            <i class="fas fa-graduation-cap"></i>
          </div>
          <div class="brand-text">
            <span class="brand-name">ACAI</span>
            <span class="brand-tagline">AI Assistant</span>
          </div>
        </div>
        <button class="collapse-btn" @click="toggleSidebar" title="折叠侧边栏">
          <i class="fa-solid fa-bars"></i>
        </button>
      </div>

      <!-- New Chat Button -->
      <div class="sidebar-new-chat">
        <button class="new-chat-btn" @click="newChat">
          <i class="fa-solid fa-plus"></i>
          <span>新建对话</span>
        </button>
      </div>

      <!-- Chat History -->
      <div class="chat-history">
        <div class="history-label">历史记录</div>
        <div class="history-list">
          <div 
            v-for="chat in chatList" 
            :key="chat.id"
            class="history-item"
            :class="{ active: isCurrentChat(chat.id) }"
          >
            <button class="history-item-btn" @click="selectChat(chat.id)">
              <i class="fa-regular fa-comments"></i>
              <span class="history-title">{{ chat.title }}</span>
            </button>
            <button 
              class="history-delete-btn"
              @click.stop="deleteChat(chat.id)"
              title="删除"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- More Menu (Settings + Tools) -->
      <div class="sidebar-more">
        <button class="more-btn" :class="{ active: moreMenuOpen }" @click="moreMenuOpen = !moreMenuOpen">
          <i class="fa-solid fa-ellipsis"></i>
          <span>更多</span>
          <i class="fa-solid fa-chevron-up" :class="{ rotated: moreMenuOpen }"></i>
        </button>
        
        <Transition name="more-menu">
          <div v-if="moreMenuOpen" class="more-menu">
            <!-- Tools -->
            <div class="more-submenu">
              <div class="more-submenu-label">更多功能</div>
              <button 
                v-for="item in toolItems" 
                :key="item.path"
                class="more-item sub"
                :class="{ active: currentRoute === item.path }"
                @click="navigate(item.path)"
              >
                <i :class="item.icon"></i>
                <span>{{ item.label }}</span>
              </button>
            </div>

            <div class="more-divider"></div>
            
            <!-- Settings -->
            <button class="more-item sub" @click="openSettings">
              <i class="fa-solid fa-gear"></i>
              <span>设置</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- API Status -->
      <div class="sidebar-api-status">
        <div class="api-status-divider"></div>
        <div class="api-status-item" @click="openSettings" title="点击配置 API">
          <span class="api-status-dot" :class="settingsStore.apiStatus"></span>
          <span class="api-status-text">{{ settingsStore.apiKey ? '已配置' : '未配置' }}</span>
          <span class="api-status-provider">{{ currentProviderName }}</span>
        </div>
      </div>
    </aside>

    <!-- Settings Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="settingsModalOpen" class="settings-modal-overlay" @click="closeSettings">
          <div class="settings-modal" @click.stop>
            <!-- Header -->
            <div class="settings-header">
              <h2>设置</h2>
              <button class="close-btn" @click="closeSettings">
                <i class="fa-solid fa-times"></i>
              </button>
            </div>
            <!-- Body -->
            <div class="settings-body">
              <div class="settings-nav">
                <button 
                  v-for="item in settingsItems" 
                  :key="item.key"
                  class="settings-nav-item"
                  :class="{ active: currentSettingsTab === item.key }"
                  @click="currentSettingsTab = item.key"
                >
                  <i :class="item.icon"></i>
                  <span>{{ item.label }}</span>
                </button>
              </div>
              <div class="settings-main">
                <!-- API Settings -->
                <div v-show="currentSettingsTab === 'api'" class="settings-panel">
                  <h3>API 设置</h3>
                  <div class="form-group">
                    <label>AI 提供商</label>
                    <select v-model="apiProvider" @change="onProviderChange">
                      <option v-for="(config, key) in API_PROVIDER_CONFIGS" :key="key" :value="key">
                        {{ config.name }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>API Key</label>
                    <div class="input-with-action">
                      <input 
                        :type="showApiKey ? 'text' : 'password'" 
                        v-model="apiKey" 
                        placeholder="输入 API Key"
                      />
                      <button class="input-action" @click="showApiKey = !showApiKey" title="显示/隐藏">
                        <i :class="showApiKey ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                      </button>
                    </div>
                    <span class="api-status" :class="settingsStore.apiStatus">
                      {{ apiStatusText }}
                    </span>
                  </div>
                  <div class="form-group">
                    <label>模型</label>
                    <div class="model-row">
                      <select v-model="model" class="model-select">
                        <option v-for="(name, id) in settingsStore.availableModels" :key="id" :value="id">
                          {{ name }}
                        </option>
                      </select>
                      <button class="model-action-btn add" @click="showAddModel = true" title="添加模型">
                        <i class="fa-solid fa-plus"></i>
                      </button>
                      <button
                        v-if="isCustomModel(model)"
                        class="model-action-btn edit"
                        @click="startEditModel"
                        title="编辑模型"
                      >
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button
                        v-if="isCustomModel(model)"
                        class="model-action-btn delete"
                        @click="deleteCurrentModel"
                        title="删除模型"
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>
                    <!-- 添加/编辑模型表单 -->
                    <div v-if="showAddModel || showEditModel" class="model-form">
                      <input
                        v-model="modelFormId"
                        placeholder="模型 ID（如 gpt-4o）"
                        class="model-input"
                        :disabled="showEditModel"
                      />
                      <input
                        v-model="modelFormName"
                        placeholder="显示名称（如 GPT-4o）"
                        class="model-input"
                      />
                      <div class="model-form-actions">
                        <button class="model-form-btn save" @click="showEditModel ? confirmEditModel() : confirmAddModel()">
                          {{ showEditModel ? '保存' : '添加' }}
                        </button>
                        <button class="model-form-btn cancel" @click="cancelModelForm">取消</button>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>温度 (Temperature)：{{ temperature.toFixed(1) }}</label>
                    <input type="range" v-model.number="temperature" min="0" max="2" step="0.1" class="range-input" />
                    <div class="range-labels"><span>精确</span><span>平衡</span><span>创意</span></div>
                  </div>
                  <div class="form-group">
                    <label>最大令牌数 (Max Tokens)：{{ maxTokens }}</label>
                    <input type="range" v-model.number="maxTokens" min="100" max="8000" step="100" class="range-input" />
                    <div class="range-labels"><span>100</span><span>4000</span><span>8000</span></div>
                  </div>
                  <button class="save-btn" @click="saveSettings">保存设置</button>
                </div>
                
                <!-- History Settings -->
                <div v-show="currentSettingsTab === 'history'" class="settings-panel">
                  <h3>历史记录</h3>
                  <p class="settings-desc">管理您的对话历史记录</p>
                  <div class="history-stats">
                    <div class="stat-item">
                      <span class="stat-value">{{ chatStore.chatHistory?.length || 0 }}</span>
                      <span class="stat-label">对话总数</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ chatStore.messages?.length || 0 }}</span>
                      <span class="stat-label">当前消息</span>
                    </div>
                  </div>
                  <div class="danger-zone">
                    <h4>危险操作</h4>
                    <button class="action-btn" @click="clearHistory">清空所有历史记录</button>
                  </div>
                </div>

                <!-- Theme Settings -->
                <div v-show="currentSettingsTab === 'theme'" class="settings-panel">
                  <h3>外观设置</h3>
                  <div class="form-group">
                    <label>主题模式</label>
                    <div class="theme-options">
                      <button 
                        v-for="t in themeOptions" 
                        :key="t.value"
                        class="theme-option"
                        :class="{ active: currentTheme === t.value }"
                        @click="setTheme(t.value)"
                      >
                        <i :class="t.icon"></i>
                        <span>{{ t.label }}</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- About -->
                <div v-show="currentSettingsTab === 'about'" class="settings-panel">
                  <h3>关于 ACAI</h3>
                  <div class="about-card">
                    <div class="about-logo">
                      <i class="fas fa-graduation-cap"></i>
                    </div>
                    <div class="about-info">
                      <p class="about-name"><strong>ACAI AI Assistant</strong></p>
                      <p>版本：2.0.0</p>
                      <p>功能强大的私人 AI 助手，支持多模型对话、翻译、代码、写作等多种功能。</p>
                    </div>
                  </div>
                  <div class="about-section">
                    <h4>支持的 AI 提供商</h4>
                    <div class="provider-list">
                      <span v-for="(config, key) in API_PROVIDER_CONFIGS" :key="key" class="provider-tag">
                        {{ config.name }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useChatStore } from '@/stores/chat'
import { API_PROVIDER_CONFIGS, type ThemeMode } from '@/constants'
import { useNotification } from '@/composables/useNotification'
import { aiService } from '@/services/aiService'

const emit = defineEmits(['navigate'])
const router = useRouter()
const route = useRoute()
const settingsStore = useSettingsStore()
const chatStore = useChatStore()
const { success: notifySuccess, error: notifyError, info: notifyInfo } = useNotification()

const moreMenuOpen = ref(false)
const settingsModalOpen = ref(false)
const currentSettingsTab = ref('api')
const showApiKey = ref(false)

const isCollapsed = computed({
  get: () => settingsStore.sidebarCollapsed,
  set: (v) => { settingsStore.sidebarCollapsed = v }
})

const currentRoute = computed(() => route.path)
const chatList = computed(() => (chatStore.chatHistory || []).slice(0, 10))
const currentProviderName = computed(() => {
  return API_PROVIDER_CONFIGS[settingsStore.apiProvider]?.name || settingsStore.apiProvider
})

const apiProvider = ref(settingsStore.apiProvider)
const apiKey = ref(settingsStore.apiKey)
const model = ref(settingsStore.model)

// 模型管理
const showAddModel = ref(false)
const showEditModel = ref(false)
const modelFormId = ref('')
const modelFormName = ref('')
const temperature = ref(settingsStore.temperature)
const maxTokens = ref(settingsStore.maxTokens)
const currentTheme = ref<ThemeMode>(settingsStore.theme)

const apiStatusText = computed(() => {
  const map: Record<string, string> = {
    connected: '已连接',
    disconnected: '未连接',
    error: '连接错误',
    checking: '检测中...'
  }
  return map[settingsStore.apiStatus] || '未知'
})

const themeOptions = [
  { value: 'light' as ThemeMode, label: '浅色', icon: 'fa-solid fa-sun' },
  { value: 'dark' as ThemeMode, label: '深色', icon: 'fa-solid fa-moon' },
  { value: 'auto' as ThemeMode, label: '跟随系统', icon: 'fa-solid fa-circle-half-stroke' }
]

const toolItems = [
  { path: '/translate', label: '翻译助手', icon: 'fa-solid fa-language' },
  { path: '/code', label: '代码助手', icon: 'fa-solid fa-code' },
  { path: '/analysis', label: '文本分析', icon: 'fa-solid fa-file-lines' },
  { path: '/writing', label: '写作助手', icon: 'fa-solid fa-pen-nib' },
  { path: '/agent', label: '文档 Agent', icon: 'fa-solid fa-robot' }
]

const settingsItems = [
  { key: 'api', label: 'API 设置', icon: 'fa-solid fa-key' },
  { key: 'history', label: '历史记录', icon: 'fa-solid fa-clock-rotate-left' },
  { key: 'theme', label: '外观', icon: 'fa-solid fa-palette' },
  { key: 'about', label: '关于', icon: 'fa-solid fa-circle-info' }
]

function toggleSidebar() {
  settingsStore.toggleSidebar()
}

function handleFloatClick() {
  chatStore.startNewChat()
  router.push('/chat')
  emit('navigate')
}

function newChat() {
  chatStore.startNewChat()
  router.push('/chat')
  emit('navigate')
}

function goToChat() {
  router.push('/chat')
  emit('navigate')
}

function isCurrentChat(chatId: number): boolean {
  return false
}

function deleteChat(chatId: number) {
  if (confirm('确定要删除这个对话吗？')) {
    // 判断被删除的是否是当前正在查看的对话
    const deletingChat = chatStore.chatHistory.find(c => c.id === chatId)
    const isCurrentChat = deletingChat
      && chatStore.messages.length > 0
      && deletingChat.messages?.some(dm => chatStore.messages.some(m => m.id === dm.id))

    chatStore.deleteChat(chatId)

    // 如果删除的是当前对话，清空消息并开启新对话
    if (isCurrentChat) {
      chatStore.clearMessages()
      router.push('/chat')
      emit('navigate')
      notifySuccess('对话已删除，已开启新对话')
    } else {
      notifySuccess('对话已删除')
    }
  }
}

function selectChat(chatId: number) {
  const chat = chatStore.chatHistory.find(c => c.id === chatId)
  if (chat) {
    chatStore.messages = [...chat.messages]
  }
  router.push('/chat')
  emit('navigate')
}

function navigate(path: string) {
  router.push(path)
  moreMenuOpen.value = false
  emit('navigate')
}

function openSettings() {
  moreMenuOpen.value = false
  apiProvider.value = settingsStore.apiProvider
  apiKey.value = settingsStore.apiKey
  model.value = settingsStore.model
  temperature.value = settingsStore.temperature
  maxTokens.value = settingsStore.maxTokens
  currentTheme.value = settingsStore.theme
  settingsModalOpen.value = true
}

function closeSettings() {
  settingsModalOpen.value = false
}

async function saveSettings() {
  settingsStore.apiProvider = apiProvider.value as any
  settingsStore.setApiKey(apiKey.value)
  settingsStore.model = model.value
  settingsStore.temperature = temperature.value
  settingsStore.maxTokens = maxTokens.value
  settingsStore.saveSettings()

  // Ollama 无需测试远程连接
  if (apiProvider.value === 'ollama') {
    notifySuccess('设置已保存（本地 Ollama）')
    closeSettings()
    return
  }

  // 无 Key 时仅保存
  if (!apiKey.value.trim()) {
    notifyInfo('设置已保存，请填写 API Key 后可测试连接')
    closeSettings()
    return
  }

  // 测试连接
  notifyInfo('正在测试连接...')
  settingsStore.apiStatus = 'checking'

  const result = await aiService.testConnection()

  if (result.success) {
    settingsStore.apiStatus = 'connected'
    notifySuccess(result.message)
  } else {
    settingsStore.apiStatus = 'error'
    notifyError(result.message)
  }

  closeSettings()
}

function onProviderChange() {
  settingsStore.changeProvider(apiProvider.value as any)
  model.value = settingsStore.model
}

// 模型管理
function isCustomModel(id: string): boolean {
  const builtIn = API_PROVIDER_CONFIGS[settingsStore.apiProvider]?.models || {}
  return !(id in builtIn)
}

function startEditModel() {
  const models = settingsStore.availableModels
  modelFormId.value = model.value
  modelFormName.value = models[model.value] || model.value
  showEditModel.value = true
  showAddModel.value = false
}

function confirmAddModel() {
  const id = modelFormId.value.trim()
  const name = modelFormName.value.trim()
  if (!id || !name) {
    notifyError('模型 ID 和名称不能为空')
    return
  }
  if (settingsStore.availableModels[id]) {
    notifyError('模型 ID 已存在')
    return
  }
  settingsStore.addCustomModel(id, name)
  model.value = id
  settingsStore.model = id
  cancelModelForm()
  notifySuccess('模型已添加')
}

function confirmEditModel() {
  const name = modelFormName.value.trim()
  if (!name) {
    notifyError('模型名称不能为空')
    return
  }
  settingsStore.addCustomModel(modelFormId.value, name)
  cancelModelForm()
  notifySuccess('模型已更新')
}

function deleteCurrentModel() {
  if (confirm(`确定要删除模型 "${settingsStore.availableModels[model.value]}" 吗？`)) {
    settingsStore.removeCustomModel(model.value)
    model.value = settingsStore.model
    notifySuccess('模型已删除')
  }
}

function cancelModelForm() {
  showAddModel.value = false
  showEditModel.value = false
  modelFormId.value = ''
  modelFormName.value = ''
}

function setTheme(t: ThemeMode) {
  currentTheme.value = t
  settingsStore.theme = t
  settingsStore.applyTheme()
}

function clearHistory() {
  if (confirm('确定要清空所有历史记录吗？')) {
    chatStore.clearAllHistory()
  }
}
</script>

<style scoped>
/* ============ Sidebar Wrapper ============ */
.sidebar-wrapper {
  height: 100%;
  flex: 0 0 var(--sidebar-width);
  overflow: hidden;
  transition: flex-basis 0.3s ease;
}

.sidebar-wrapper:has(.sidebar.collapsed) {
  flex-basis: 0;
}

/* ============ Sidebar ============ */
.sidebar {
  width: var(--sidebar-width);
  height: 100%;
  background: var(--color-bg-primary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.sidebar.collapsed {
  transform: translateX(-100%);
  border-right: none;
}

/* ============ Header ============ */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  color: var(--color-primary);
  font-size: 26px;
  display: flex;
  align-items: center;
  filter: drop-shadow(0 0 6px rgba(26, 115, 232, 0.3));
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-name {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-tagline {
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) var(--ease);
}

.collapse-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

/* ============ New Chat ============ */
.sidebar-new-chat {
  padding: 0 12px 12px;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease);
}

.new-chat-btn:hover {
  background: var(--color-primary-hover);
}

/* ============ Chat History ============ */
.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.history-label {
  padding: 8px 12px;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  margin-bottom: 2px;
  border-radius: var(--radius-md);
  background: transparent;
  transition: all var(--duration-fast) var(--ease);
}

.history-item:hover {
  background: var(--color-bg-hover);
}

.history-item.active {
  background: var(--color-bg-hover);
}

.history-item-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  text-align: left;
}

.history-item.active .history-item-btn {
  color: var(--color-text-primary);
}

.history-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-delete-btn {
  opacity: 0;
  padding: 4px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--ease);
  flex-shrink: 0;
}

.history-item:hover .history-delete-btn {
  opacity: 1;
}

.history-delete-btn:hover {
  color: var(--color-danger);
  background: var(--color-danger-light);
}

/* ============ More Menu ============ */
.sidebar-more {
  padding: 8px 12px;
  position: relative;
}

.more-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease);
}

.more-btn:hover,
.more-btn.active {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.more-btn i:nth-child(3) {
  margin-left: auto;
  font-size: 10px;
  transition: transform var(--duration-fast) var(--ease);
}

.more-btn i:nth-child(3).rotated {
  transform: rotate(180deg);
}

.more-menu {
  position: absolute;
  bottom: 100%;
  left: 12px;
  right: 12px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
  padding: 4px;
  margin-bottom: 4px;
}

.more-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  text-align: left;
  transition: all var(--duration-fast) var(--ease);
}

.more-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.more-item.sub {
  padding-left: 32px;
}

.more-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: 4px 8px;
}

.more-submenu-label {
  padding: 6px 12px 4px;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}

/* ============ API Status ============ */
.sidebar-api-status {
  padding: 0 12px 12px;
}

.api-status-divider {
  height: 1px;
  background: var(--color-border-light);
  margin-bottom: 10px;
}

.api-status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease);
}

.api-status-item:hover {
  background: var(--color-bg-hover);
}

.api-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-error);
  flex-shrink: 0;
  box-shadow: 0 0 6px var(--color-error);
}

.api-status-dot.connected {
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.api-status-dot.error {
  background: var(--color-error);
  box-shadow: 0 0 6px var(--color-error);
}

.api-status-dot.checking {
  background: var(--color-warning);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.api-status-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.api-status-provider {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

/* ============ Transitions ============ */
.more-menu-enter-active,
.more-menu-leave-active {
  transition: all var(--duration-fast) var(--ease);
}

.more-menu-enter-from,
.more-menu-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ============ Settings Modal ============ */
.settings-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.settings-modal {
  width: 720px;
  height: 520px;
  max-width: 92vw;
  max-height: 85vh;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.settings-header h2 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) var(--ease);
}

.close-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

/* ============ Settings Body ============ */
.settings-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.settings-nav {
  width: 160px;
  padding: 12px;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  text-align: left;
  transition: all var(--duration-fast) var(--ease);
}

.settings-nav-item:hover {
  background: var(--color-bg-hover);
}

.settings-nav-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.settings-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  min-height: 0;
}

/* ============ Settings Panel ============ */
.settings-panel {
  animation: panel-in 0.15s ease;
}

@keyframes panel-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.settings-panel h3 {
  margin: 0 0 20px;
  font-size: var(--text-base);
  font-weight: 600;
}

.settings-panel h4 {
  margin: 0 0 12px;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

/* ============ Form Group ============ */
.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-group select,
.form-group input[type="text"],
.form-group input[type="password"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  transition: border-color var(--duration-fast) var(--ease);
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* ============ Model Management ============ */
.model-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.model-select {
  flex: 1;
  min-width: 0;
}

.model-action-btn {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  transition: all var(--duration-fast) var(--ease);
}

.model-action-btn.add:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.model-action-btn.edit:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.model-action-btn.delete:hover {
  border-color: var(--color-error);
  color: var(--color-error);
}

.model-form {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-page);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  box-sizing: border-box;
}

.model-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.model-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.model-form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.model-form-btn {
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  border: none;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease);
}

.model-form-btn.save {
  background: var(--color-primary);
  color: white;
}

.model-form-btn.save:hover {
  background: var(--color-primary-hover);
}

.model-form-btn.cancel {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.model-form-btn.cancel:hover {
  background: var(--color-bg-hover);
}

/* ============ Input with Action ============ */
.input-with-action {
  position: relative;
  display: flex;
}

.input-with-action input {
  padding-right: 40px;
}

.input-action {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  transition: color var(--duration-fast) var(--ease);
}

.input-action:hover {
  color: var(--color-primary);
}

/* ============ API Status ============ */
.api-status {
  display: inline-block;
  margin-top: 6px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.api-status.connected {
  color: var(--color-success);
  background: rgba(82, 196, 26, 0.1);
}

.api-status.disconnected {
  color: var(--color-text-tertiary);
  background: var(--color-bg-hover);
}

.api-status.error {
  color: var(--color-error);
  background: rgba(255, 77, 79, 0.1);
}

/* ============ Range Input ============ */
.range-input {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-border);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.range-input::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.15);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* ============ Buttons ============ */
.save-btn {
  padding: 10px 24px;
  border-radius: var(--radius-md);
  border: none;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  background: var(--color-primary);
  color: white;
  transition: all var(--duration-fast) var(--ease);
}

.save-btn:hover {
  background: var(--color-primary-hover);
}

.action-btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: var(--color-text-secondary);
  transition: all var(--duration-fast) var(--ease);
}

.action-btn:hover {
  border-color: var(--color-error);
  color: var(--color-error);
}

/* ============ History Stats ============ */
.settings-desc {
  color: var(--color-text-secondary);
  margin-bottom: 20px;
  font-size: var(--text-sm);
}

.history-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  flex: 1;
  padding: 16px;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 4px;
}

.danger-zone {
  padding: 16px;
  border: 1px solid rgba(255, 77, 79, 0.2);
  border-radius: var(--radius-md);
  background: rgba(255, 77, 79, 0.03);
}

/* ============ Theme Options ============ */
.theme-options {
  display: flex;
  gap: 12px;
}

.theme-option {
  flex: 1;
  padding: 16px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  transition: all var(--duration-fast) var(--ease);
}

.theme-option i {
  font-size: 20px;
}

.theme-option:hover {
  border-color: var(--color-primary);
}

.theme-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

/* ============ About ============ */
.about-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.about-logo {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.about-info p {
  margin: 0 0 4px;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.about-info .about-name {
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.about-section {
  margin-top: 16px;
}

.provider-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.provider-tag {
  padding: 4px 12px;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* ============ Modal Transition ============ */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .settings-modal,
.modal-fade-leave-active .settings-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .settings-modal,
.modal-fade-leave-to .settings-modal {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

/* ============ Mobile ============ */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 260px;
    z-index: 100;
    transform: translateX(-100%);
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.1);
  }

  .sidebar.mobile-show {
    transform: translateX(0);
  }

  .settings-content {
    flex-direction: column;
  }

  .settings-nav {
    width: 100%;
    flex-direction: row;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding: 8px;
    overflow-x: auto;
  }

  .settings-nav-item {
    flex-shrink: 0;
  }
}
</style>
