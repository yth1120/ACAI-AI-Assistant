<template>
  <div class="settings-view">
    <!-- API Settings -->
    <div v-if="currentTab === 'api'" class="settings-panel">
      <div class="panel-header">
        <h3>API 设置</h3>
        <p>配置 AI 服务提供商和模型参数</p>
      </div>

      <div class="panel-body">
        <div class="form-group">
          <label for="theme">主题设置</label>
          <select id="theme" v-model="settingsStore.theme" @change="onThemeChange">
            <option value="light">浅色主题</option>
            <option value="dark">深色主题</option>
            <option value="auto">跟随系统</option>
          </select>
        </div>

        <div class="form-group">
          <label for="apiProvider">AI 服务提供商</label>
          <select id="apiProvider" v-model="settingsStore.apiProvider" @change="onProviderChange">
            <option value="deepseek">深度求索</option>
            <option value="openai">OpenAI</option>
            <option value="qwen">通义千问</option>
            <option value="claude">Claude</option>
            <option value="kimi">KimiAI</option>
            <option value="siliconflow">硅基流动</option>
            <option value="ollama">Ollama</option>
            <option value="zhipu">智谱清言</option>
            <option value="gemini">Gemini</option>
            <option value="tencent">腾讯混元</option>
          </select>
        </div>

        <div v-if="settingsStore.apiProvider !== 'ollama'" class="form-group">
          <label for="apiKey">API Key</label>
          <div class="input-with-action">
            <input
              id="apiKey"
              v-model="settingsStore.apiKey"
              :type="showApiKey ? 'text' : 'password'"
              placeholder="请输入 API Key"
            />
            <button class="input-action" @click="showApiKey = !showApiKey" title="显示/隐藏">
              <i :class="showApiKey ? 'fas fa-eye-slash' : 'fas fa-eye'" />
            </button>
          </div>
          <small v-if="!settingsStore.apiKey" class="hint-danger">请输入 API Key 才能使用 AI 功能</small>
        </div>

        <div class="form-group">
          <label for="model">模型</label>
          <select id="model" v-model="settingsStore.model">
            <option v-for="(label, value) in settingsStore.availableModels" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="temperature">
            温度 (Temperature): {{ settingsStore.temperature.toFixed(1) }}
          </label>
          <input
            id="temperature"
            v-model.number="settingsStore.temperature"
            type="range"
            min="0"
            max="2"
            step="0.1"
          />
          <small>较低的值使输出更确定，较高的值增加创造性</small>
        </div>

        <div class="form-group">
          <label for="maxTokens">
            最大令牌数 (Max Tokens): {{ settingsStore.maxTokens }}
          </label>
          <input
            id="maxTokens"
            v-model.number="settingsStore.maxTokens"
            type="range"
            min="100"
            max="8000"
            step="100"
          />
          <small>控制生成文本的最大长度</small>
        </div>

        <div class="form-actions">
          <button :disabled="isTesting" class="btn btn-secondary" @click="testConnection">
            <i :class="isTesting ? 'fas fa-spinner fa-spin' : 'fas fa-plug'" />
            {{ isTesting ? '测试中...' : '测试连接' }}
          </button>
          <button class="btn btn-primary" @click="saveSettings">
            <i class="fas fa-save" /> 保存设置
          </button>
        </div>
      </div>
    </div>

    <!-- History -->
    <div v-else-if="currentTab === 'history'" class="settings-panel">
      <div class="panel-header">
        <h3>历史记录</h3>
        <p>查看和管理您的对话历史</p>
      </div>

      <div class="panel-body">
        <div v-if="chatStore.chatHistory.length > 0" class="export-section">
          <h4>导出选项</h4>
          <div class="export-grid">
            <button class="btn btn-outline" @click="exportChat('json')">JSON</button>
            <button class="btn btn-outline" @click="exportChat('markdown')">Markdown</button>
            <button class="btn btn-outline" @click="exportChat('html')">HTML</button>
            <button class="btn btn-outline" @click="exportChat('text')">文本</button>
          </div>
          <button class="btn btn-primary export-all" @click="exportAllChats">
            <i class="fas fa-download" /> 导出所有历史记录
          </button>
        </div>

        <div v-if="chatStore.chatHistory.length === 0" class="empty-state">
          <i class="fas fa-inbox" />
          <p>暂无历史记录</p>
          <small>开始对话后，历史记录将显示在这里</small>
        </div>

        <div v-else class="history-list">
          <div v-for="item in chatStore.chatHistory" :key="item.id" class="history-card">
            <div class="history-header">
              <span class="history-time">{{ formatTime(item.timestamp) }}</span>
              <div class="history-actions">
                <button class="btn btn-sm" @click="loadHistory(item)">查看</button>
                <button class="btn btn-sm btn-danger-ghost" @click="deleteHistory(item.id)">删除</button>
              </div>
            </div>
            <div class="history-preview">{{ getPreviewText(item) }}</div>
            <div class="history-meta">
              <span>{{ item.messages?.length || 0 }} 条消息</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- About -->
    <div v-else-if="currentTab === 'about'" class="settings-panel">
      <div class="panel-header">
        <h3>版本说明</h3>
        <p>关于 ACAI 开发助手</p>
      </div>

      <div class="panel-body">
        <div class="about-section">
          <h4>应用信息</h4>
          <div class="info-row"><span class="info-label">应用名称</span><span class="info-value">ACAI 开发助手</span></div>
          <div class="info-row"><span class="info-label">版本号</span><span class="info-value">2.0.0</span></div>
          <div class="info-row"><span class="info-label">构建日期</span><span class="info-value">2024-12-05</span></div>
        </div>

        <div class="about-section">
          <h4>快捷键</h4>
          <div class="shortcuts-grid">
            <div v-for="shortcut in shortcuts" :key="shortcut.key" class="shortcut-item">
              <span class="shortcut-keys">{{ shortcut.display }}</span>
              <span class="shortcut-desc">{{ shortcut.description }}</span>
            </div>
          </div>
        </div>

        <div class="about-section">
          <h4>功能特性</h4>
          <ul class="feature-list">
            <li>支持多种 AI 服务提供商</li>
            <li>智能对话与深度思考</li>
            <li>代码生成与分析</li>
            <li>翻译与写作助手</li>
            <li>文本分析与创意生成</li>
            <li>流式响应实时显示</li>
            <li>历史记录管理</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useChatStore } from '@/stores/chat'
import { useNotification } from '@/composables/useNotification'
import { aiService } from '@/services'
import { getAllShortcuts } from '@/composables/useShortcuts'

const router = useRouter()
const route = useRoute()
const settingsStore = useSettingsStore()
const chatStore = useChatStore()
const { success, error, info } = useNotification()

const showApiKey = ref(false)
const isTesting = ref(false)

const currentTab = computed(() => route.query.tab || 'api')

const shortcuts = computed(() => {
  const allShortcuts = getAllShortcuts()
  return allShortcuts.filter(s =>
    ['NEW_CHAT', 'SEND_MESSAGE', 'TOGGLE_SIDEBAR', 'SETTINGS', 'EXPORT_CHAT', 'TOGGLE_DEEP_THINKING', 'TOGGLE_WEB_SEARCH'].includes(s.key)
  )
})

onMounted(() => {
  settingsStore.loadSettings()
  chatStore.loadChatHistory()
  if (!route.query.tab) {
    router.replace({ path: '/settings', query: { tab: 'api' } })
  }
})

function onProviderChange() {
  settingsStore.changeProvider(settingsStore.apiProvider)
  info(`已切换到 ${settingsStore.currentConfig.name}`)
}

function onThemeChange() {
  settingsStore.applyTheme()
  success('主题设置已应用')
}

async function testConnection() {
  if (!settingsStore.apiKey && settingsStore.apiProvider !== 'ollama') {
    error('请先输入 API Key')
    return
  }
  isTesting.value = true
  try {
    const result = await aiService.testConnection()
    if (result.success) {
      settingsStore.apiStatus = 'connected'
      success(result.message)
    } else {
      settingsStore.apiStatus = 'disconnected'
      error(result.message)
    }
  } catch (err) {
    settingsStore.apiStatus = 'disconnected'
    error('连接测试失败：' + err.message)
  } finally {
    isTesting.value = false
  }
}

function saveSettings() {
  settingsStore.saveSettings()
  success('设置已保存')
  setTimeout(() => router.push('/chat'), 500)
}

function loadHistory(historyItem) {
  chatStore.messages = [...historyItem.messages]
  success('历史记录已加载')
  setTimeout(() => router.push('/chat'), 500)
}

function deleteHistory(historyId) {
  if (confirm('确定要删除这条历史记录吗？')) {
    chatStore.deleteChat(historyId)
    success('历史记录已删除')
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function getPreviewText(item) {
  if (item.messages && item.messages.length > 0) {
    const firstUserMsg = item.messages.find(m => m.role === 'user')
    if (firstUserMsg) {
      return firstUserMsg.content.substring(0, 100) + (firstUserMsg.content.length > 100 ? '...' : '')
    }
  }
  return '空对话'
}

function exportChat(format) {
  try {
    chatStore.exportAllChats(format)
    success(`已导出为 ${format.toUpperCase()} 格式`)
  } catch (err) {
    error('导出失败：' + err.message)
  }
}

function exportAllChats() {
  try {
    chatStore.exportAllChats('json')
    success('已导出所有历史记录')
  } catch (err) {
    error('导出失败：' + err.message)
  }
}
</script>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.settings-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ============ Panel Header ============ */
.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  flex-shrink: 0;
}

.panel-header h3 {
  font-size: var(--text-xl);
  color: var(--color-text-primary);
  margin: 0 0 4px 0;
  font-weight: 600;
}

.panel-header p {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin: 0;
}

/* ============ Panel Body ============ */
.panel-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

/* ============ Form Groups ============ */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: var(--text-sm);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--color-input-bg);
  color: var(--color-text-primary);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.form-group input[type='range'] {
  padding: 0;
  height: 4px;
  cursor: pointer;
  border: none;
  background: var(--color-border);
  -webkit-appearance: none;
  appearance: none;
  border-radius: var(--radius-full);
}

.form-group input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
}

.form-group small {
  display: block;
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
  margin-top: 4px;
}

.hint-danger {
  color: var(--color-danger) !important;
}

/* ============ Input With Action ============ */
.input-with-action {
  position: relative;
}

.input-with-action input {
  padding-right: 40px;
}

.input-action {
  position: absolute;
  right: 1px;
  top: 1px;
  bottom: 1px;
  width: 36px;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.input-action:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

/* ============ Form Actions ============ */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

/* ============ Buttons ============ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  flex: 1;
}

.btn-sm {
  padding: 6px 12px;
  font-size: var(--text-xs);
  flex: 0;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-outline {
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}

.btn-outline:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-danger-ghost {
  background: transparent;
  color: var(--color-danger);
  border-color: transparent;
}

.btn-danger-ghost:hover {
  background: var(--color-danger-light);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============ Export Section ============ */
.export-section {
  padding: 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  margin-bottom: 20px;
}

.export-section h4 {
  font-size: var(--text-base);
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
  font-weight: 600;
}

.export-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.export-all {
  width: 100%;
}

/* ============ Empty State ============ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.4;
}

.empty-state p {
  margin: 0 0 4px 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.empty-state small {
  font-size: var(--text-sm);
}

/* ============ History List ============ */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-time {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.history-actions {
  display: flex;
  gap: 6px;
}

.history-preview {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.history-meta {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  padding-top: 8px;
  border-top: 1px solid var(--color-border-light);
}

/* ============ About ============ */
.about-section {
  padding: 20px 0;
  border-bottom: 1px solid var(--color-border);
}

.about-section:last-child {
  border-bottom: none;
}

.about-section h4 {
  font-size: var(--text-md);
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
  font-weight: 600;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
  font-size: var(--text-sm);
}

.info-label {
  color: var(--color-text-secondary);
  min-width: 80px;
}

.info-value {
  color: var(--color-text-primary);
  font-weight: 500;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  padding: 6px 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  position: relative;
  padding-left: 16px;
}

.feature-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-primary);
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.shortcut-keys {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-bg-primary);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  white-space: nowrap;
}

.shortcut-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-left: 8px;
}
</style>
