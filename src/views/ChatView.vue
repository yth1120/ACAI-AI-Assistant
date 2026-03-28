<template>
  <div class="chat-view">
    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部导航 -->
      <header class="main-header">
        <div class="header-left">
          <template v-if="settingsStore.sidebarCollapsed">
            <i class="fas fa-graduation-cap brand-logo"></i>
            <div class="header-actions-group">
              <button class="header-toggle-btn" @click="toggleSidebar" title="展开侧边栏">
                <i class="fa-solid fa-bars"></i>
              </button>
              <button class="header-toggle-btn" @click="newChat" title="新建对话">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </template>
        </div>
        <h2 class="page-title">
          <i class="fa-solid fa-comments"></i>
          <span>智能对话</span>
        </h2>
      </header>

      <div class="chat-container" :class="{ 'empty-state': messages.length === 0 }">
        <!-- 初始空状态：显示欢迎和输入框 -->
        <div v-if="messages.length === 0" class="empty-center">
          <div class="empty-center-content">
            <div class="empty-center-text">
              <i class="fas fa-graduation-cap welcome-logo"></i>
              <div class="welcome-text">
                <h2>你好，我是 <span class="welcome-brand">ACAI</span>，有什么我可以帮你的吗？</h2>
              </div>
            </div>
            
            <!-- 输入框也居中显示 -->
            <div class="empty-input-wrapper">
              <textarea
                v-model="userInput"
                placeholder="输入消息... Shift+Enter换行，Enter发送"
                class="empty-input"
                rows="3"
                @keydown.enter="handleEnterKey"
                @keydown.shift.enter="handleShiftEnter"
              ></textarea>
              
              <!-- 功能按钮 -->
              <div class="empty-actions">
                <!-- 深度思考 -->
                <button 
                  class="empty-action-btn" 
                  :class="{ active: currentFunction === 'deep-thinking' }"
                  @click="toggleFunction('deep-thinking')"
                  title="深度思考"
                >
                  <i class="fas fa-brain"></i>
                </button>
                
                <!-- 联网搜索 -->
                <button 
                  class="empty-action-btn" 
                  :class="{ active: currentFunction === 'web-search' }"
                  @click="toggleFunction('web-search')"
                  title="联网搜索"
                >
                  <i class="fas fa-globe"></i>
                </button>
                
                <!-- 上传文件 -->
                <label class="empty-action-btn" title="上传文件">
                  <input 
                    type="file" 
                    multiple 
                    hidden
                    :disabled="currentFunction === 'web-search' || isProcessing"
                    @change="handleFileUpload"
                  />
                  <i class="fas fa-paperclip"></i>
                </label>
                
                <button class="empty-send-btn" @click="sendMessage" :disabled="isProcessing || !userInput.trim()">
                  <i class="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div ref="messagesContainer" class="chat-messages" :class="{ 'has-messages': messages.length > 0 }" v-show="messages.length > 0">
          <div class="messages-content">
            <div v-if="messages.length > 0" class="messages-list">
              <div v-for="(msg, index) in messages" :key="msg.id" class="message-row" :class="[msg.role]">

                <!-- 用户消息：右对齐气泡 -->
                <div v-if="msg.role === 'user'" class="user-message">
                  <div class="user-bubble">
                    <div v-if="editingMessageId === msg.id" class="edit-mode">
                      <textarea v-model="editingContent" rows="3" class="edit-textarea" @keydown.enter.ctrl="saveEdit" @keydown.escape="cancelEdit" />
                      <div class="edit-actions">
                        <button class="edit-btn save-btn" @click="saveEdit"><i class="fas fa-check" /> 保存</button>
                        <button class="edit-btn cancel-btn" @click="cancelEdit"><i class="fas fa-times" /> 取消</button>
                      </div>
                    </div>
                    <div v-else>
                      <div v-if="msg.recalled" class="recalled-message"><i class="fas fa-trash" /> 消息已撤回</div>
                      <div v-else-if="msg.content" v-html="formatMessage(msg.content)" />
                    </div>
                  </div>
                  <div v-if="!msg.recalled && editingMessageId !== msg.id" class="msg-actions user-actions">
                    <button @click="copyMessage(msg.content, msg.id)" title="复制"><i class="fas fa-copy"></i></button>
                    <button @click="quoteMessage(msg.id)" title="引用"><i class="fas fa-quote-right"></i></button>
                    <button @click="regenerateMessage(msg.id)" title="重新生成"><i class="fas fa-redo"></i></button>
                    <button @click="handleDelete(msg.id)" title="删除"><i class="fas fa-trash"></i></button>
                  </div>
                </div>

                <!-- AI 消息：无气泡，直接展示 -->
                <div v-else class="ai-message">
                  <!-- 深度思考模块 -->
                  <div v-if="msg.isThinking || (msg.thinkingContent && msg.thinkingContent.length > 0)" class="thinking-simple">
                    <div class="thinking-header-simple">
                      <i class="fas fa-brain thinking-icon"></i>
                      <span v-if="msg.thinkingDuration" class="thinking-time-simple">已深度思考（{{ msg.thinkingDuration }}s）</span>
                    </div>
                    <div v-if="msg.thinkingContent" class="thinking-content-simple">
                      <pre v-html="msg.thinkingContent" class="thinking-text-simple"></pre>
                    </div>
                  </div>

                  <!-- 联网搜索模块 -->
                  <div v-if="msg.searchStatus" class="search-simple">
                    <div class="search-header-simple">
                      <i class="fas fa-globe search-icon"></i>
                      <span class="search-status">{{ msg.searchStatus }}</span>
                    </div>
                    <div v-if="msg.searchSources && msg.searchSources.length > 0" class="search-results-simple">
                      <div class="search-links-simple">
                        <a v-for="(src, i) in msg.searchSources" :key="i" :href="src.url" class="search-link-simple" target="_blank" :title="src.title">
                          <span class="search-link-index">{{ i + 1 }}</span>
                          <span class="search-link-title">{{ src.title }}</span>
                          <span class="search-link-domain">({{ src.source }})</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- AI 正式回复正文 -->
                  <div v-if="!msg.isThinking" class="ai-reply">
                    <div v-if="editingMessageId === msg.id" class="edit-mode">
                      <textarea v-model="editingContent" rows="3" class="edit-textarea" @keydown.enter.ctrl="saveEdit" @keydown.escape="cancelEdit" />
                      <div class="edit-actions">
                        <button class="edit-btn save-btn" @click="saveEdit"><i class="fas fa-check" /> 保存</button>
                        <button class="edit-btn cancel-btn" @click="cancelEdit"><i class="fas fa-times" /> 取消</button>
                      </div>
                    </div>
                    <div v-else>
                      <div v-if="msg.recalled" class="recalled-message"><i class="fas fa-trash" /> 消息已撤回</div>
                      <div v-else-if="msg.displayContent || msg.content" class="reply-content">
                        <span v-html="formatMessage(msg.displayContent || msg.content)"></span>
                      </div>
                      <div v-else-if="msg.isGenerating || msg.isProcessingTypewriter" class="ai-typing-indicator">
                        <div class="typing-dots">
                          <span class="dot"></span>
                          <span class="dot"></span>
                          <span class="dot"></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- AI 消息操作 -->
                  <div v-if="!msg.isThinking && !msg.recalled && editingMessageId !== msg.id && msg.content" class="msg-actions ai-actions">
                    <button @click="copyMessage(msg.content, msg.id)" title="复制"><i class="fas fa-copy"></i></button>
                    <button @click="regenerateMessage(msg.id)" title="重新生成"><i class="fas fa-redo"></i></button>
                    <button @click="continueGeneration(msg.id)" title="继续生成"><i class="fas fa-plus"></i></button>
                    <button @click="handleDelete(msg.id)" title="删除"><i class="fas fa-trash"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-controls" v-if="messages.length > 0">
          <!-- 滚动控制按钮 -->
          <div v-if="messages.length > 10" class="scroll-controls">
            <button class="scroll-btn" title="滚动到顶部" @click="scrollToTop">
              <i class="fas fa-arrow-up" />
            </button>
            <button class="scroll-btn" title="滚动到底部" @click="scrollToBottom">
              <i class="fas fa-arrow-down" />
            </button>
          </div>
        </div>
      </div>

      <!-- 底部输入区 -->
      <footer v-if="messages.length > 0" class="chat-footer">
        <div class="footer-input-wrapper">
          <textarea
            v-model="userInput"
            :placeholder="
              !settingsStore.apiKey && settingsStore.apiProvider !== 'ollama'
                ? '⚠️ 请先在设置中配置 API Key'
                : '输入消息... Shift+Enter换行，Enter发送'
            "
            :disabled="!settingsStore.apiKey && settingsStore.apiProvider !== 'ollama'"
            class="footer-input"
            rows="3"
            @keydown.enter="handleEnterKey"
            @keydown.shift.enter="handleShiftEnter"
          />

          <div class="footer-actions">
            <button 
              class="empty-action-btn" 
              :class="{ active: currentFunction === 'deep-thinking' }"
              @click="toggleFunction('deep-thinking')"
              title="深度思考"
              :disabled="isProcessing"
            >
              <i class="fas fa-brain"></i>
            </button>

            <button 
              class="empty-action-btn" 
              :class="{ active: currentFunction === 'web-search' }"
              @click="toggleFunction('web-search')"
              title="联网搜索"
              :disabled="isProcessing"
            >
              <i class="fas fa-globe"></i>
            </button>

            <label class="empty-action-btn" title="上传文件">
              <input 
                type="file" 
                multiple 
                hidden
                accept=".pdf,.docx,.xlsx,.txt,.jpg,.png"
                :disabled="currentFunction === 'web-search' || isProcessing"
                @change="handleFileUpload"
              />
              <i class="fas fa-paperclip"></i>
            </label>

            <button 
              class="empty-send-btn" 
              @click="sendMessage" 
              :disabled="isProcessing || !userInput.trim() || (!settingsStore.apiKey && settingsStore.apiProvider !== 'ollama')"
            >
              <i class="fas fa-paper-plane" v-if="!isProcessing"></i>
              <i class="fas fa-spinner fa-spin" v-else></i>
            </button>
          </div>
        </div>
      </footer>
    </div>

    <!-- 设置面板弹窗 -->
    <div v-if="showSettingsPanel" class="settings-panel-overlay" @click="closeSettingsPanel">
      <div class="settings-panel" @click.stop>
        <div class="settings-header">
          <h2>个性化设置</h2>
          <button class="close-settings-btn" @click="closeSettingsPanel">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="settings-content">
          <!-- 回答长度设置 -->
          <div class="setting-section">
            <label class="setting-label">回答长度</label>
            <div class="setting-options">
              <button
                class="setting-option"
                :class="{ active: answerLength === 'short' }"
                @click="answerLength = 'short'"
              >
                简短
              </button>
              <button
                class="setting-option"
                :class="{ active: answerLength === 'standard' }"
                @click="answerLength = 'standard'"
              >
                标准
              </button>
              <button
                class="setting-option"
                :class="{ active: answerLength === 'detailed' }"
                @click="answerLength = 'detailed'"
              >
                详细
              </button>
            </div>
          </div>

          <!-- 格式偏好 -->
          <div class="setting-section">
            <label class="setting-label">格式偏好</label>
            <div class="format-preferences">
              <label class="format-option">
                <input type="checkbox" v-model="formatPreferences.codeHighlight" />
                <span>代码高亮</span>
              </label>
              <label class="format-option">
                <input type="checkbox" v-model="formatPreferences.formulaRendering" />
                <span>公式渲染</span>
              </label>
              <label class="format-option">
                <input type="checkbox" v-model="formatPreferences.tableFormatting" />
                <span>表格排版</span>
              </label>
              <label class="format-option">
                <input type="checkbox" v-model="formatPreferences.listFormatting" />
                <span>列表排版</span>
              </label>
            </div>
          </div>

          <!-- 语言设置 -->
          <div class="setting-section">
            <label class="setting-label">语言设置</label>
            <select v-model="selectedLanguage" class="language-select">
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
              <option value="ko-KR">한국어</option>
            </select>
          </div>

          <!-- 隐私设置 -->
          <div class="setting-section">
            <label class="setting-label">隐私与数据</label>
            <div class="privacy-settings">
              <label class="privacy-option">
                <span>保留会话记录</span>
                <input type="checkbox" v-model="privacySettings.keepSessionHistory" />
              </label>
              <button class="clear-data-btn" @click="clearAllData">
                <i class="fas fa-trash" /> 清除所有数据
              </button>
            </div>
          </div>
        </div>

        <div class="settings-footer">
          <button class="save-settings-btn" @click="saveSettings">
            保存设置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
import { useNotification } from '@/composables/useNotification'
import chatService from '@/services/api/chatService'
import { aiService } from '@/services/aiService'
import { isSafeInput, formatMessageSafely } from '@/utils/security'

// 引入Naive UI组件
import {
  NButton,
  NButtonGroup,
  NTooltip,
  NIcon,
  NSpin,
  NPopconfirm,
  NMessageProvider
} from 'naive-ui'

// 获取全局Vue实例以访问全局属性
import { getCurrentInstance } from 'vue'

// 使用Naive UI内置的图标
import {
  Copy20Filled,
  ArrowClockwise20Filled,
  Add20Filled,
  Edit20Filled,
  Delete20Filled,
  ArrowUndo20Filled
} from '@vicons/fluent'

const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const { error: showError, warning, success } = useNotification()

// 获取全局Vue实例
const instance = getCurrentInstance()

// Naive UI消息组件 - 使用全局的$message，提供安全包装
const rawMessage = instance?.appContext.config.globalProperties.$message

// 安全的message包装器，防止message未定义
const message = {
  success: (content, options) => {
    if (rawMessage?.success) {
      return rawMessage.success(content, options)
    } else {
      console.log('Success:', content)
      success(content)
    }
  },
  error: (content, options) => {
    if (rawMessage?.error) {
      return rawMessage.error(content, options)
    } else {
      console.error('Error:', content)
      showError(content)
    }
  },
  warning: (content, options) => {
    if (rawMessage?.warning) {
      return rawMessage.warning(content, options)
    } else {
      console.warn('Warning:', content)
      warning(content)
    }
  },
  info: (content, options) => {
    if (rawMessage?.info) {
      return rawMessage.info(content, options)
    } else {
      console.info('Info:', content)
      // 使用自定义通知的info方法
      const { info } = useNotification()
      info(content)
    }
  }
}

// 左侧边栏状态
const isSidebarCollapsed = ref(false)
const searchQuery = ref('')
const activeSessionId = ref(null)
const currentChatHistoryId = ref(null)

// 会话管理
const sessions = ref([])

// 设置面板状态
const showSettingsPanel = ref(false)
const answerLength = ref('standard')
const selectedLanguage = ref('zh-CN')
const formatPreferences = ref({
  codeHighlight: true,
  formulaRendering: true,
  tableFormatting: true,
  listFormatting: true
})

// 按钮加载状态管理
const loadingButtons = ref({
  copy: new Set(),
  regenerate: new Set(),
  continue: new Set(),
  edit: new Set(),
  delete: new Set(),
  recall: new Set()
})

// 按钮加载状态管理函数
const startLoading = (buttonType, messageId) => {
  if (loadingButtons.value[buttonType]) {
    loadingButtons.value[buttonType].add(messageId)
  }
}

const stopLoading = (buttonType, messageId) => {
  if (loadingButtons.value[buttonType]) {
    loadingButtons.value[buttonType].delete(messageId)
  }
}

const isLoading = (buttonType, messageId) => {
  return loadingButtons.value[buttonType]?.has(messageId) || false
}
const privacySettings = ref({
  keepSessionHistory: true
})

// 聊天功能状态
const userInput = ref('')
const messagesContainer = ref(null)
const messages = ref([])
const currentFunction = ref('normal')
const isProcessing = ref(false)

// 定时器引用
const activeTimers = ref([])

// 消息操作状态
const editingMessageId = ref(null)
const editingContent = ref('')

// 监听chatStore.messages变化，同步到本地messages
watch(() => chatStore.messages, (newMessages) => {
  // 避免无限循环，只在确实有变化时更新
  if (JSON.stringify(messages.value) !== JSON.stringify(newMessages)) {
    messages.value = [...newMessages]

    // 自动追踪 currentChatHistoryId（用于从侧边栏加载旧对话后继续发送）
    if (
      !isProcessing.value
      && newMessages.length > 0
      && chatStore.chatHistory.length > 0
    ) {
      const matched = chatStore.chatHistory.find(
        h => h.messages?.length > 0 && h.messages.some(hm => newMessages.some(m => m.id === hm.id))
      )
      if (matched && currentChatHistoryId.value !== matched.id) {
        currentChatHistoryId.value = matched.id
      }
    }
  }
}, { deep: true })

// 计算属性
const filteredSessions = computed(() => {
  // 确保 sessions.value 是数组
  const sessionList = Array.isArray(sessions.value) ? sessions.value : []

  if (!searchQuery.value.trim()) {
    return sessionList
  }
  const query = searchQuery.value.toLowerCase()
  return sessionList.filter(session =>
    session && session.title && session.title.toLowerCase().includes(query)
  )
})

// 左侧边栏功能
function toggleSidebar() {
  settingsStore.toggleSidebar()
}

function loadSession(sessionId) {
  loadSessionMessages(sessionId)
  success(`已加载会话: ${sessions.value.find(s => s.id === sessionId)?.title}`)
}

function deleteSession(sessionId) {
  if (confirm('确定要删除这个会话吗？')) {
    // 从 chatStore.chatHistory 中删除
    chatStore.deleteChat(sessionId)

    // 如果删除的是当前活动会话，创建一个新的会话
    if (activeSessionId.value === sessionId) {
      newChat()
      success('会话已删除，已创建新对话')
    } else {
      success('会话已删除')
    }
  }
}

// 设置功能
function openSettings() {
  showSettingsPanel.value = true
}

// 重置会话
function resetSession() {
  if (confirm('确定要重置当前会话吗？这将清空上下文，但不会删除历史记录。')) {
    messages.value = []
    chatStore.clearMessages()
    userInput.value = ''
    success('会话已重置')
  }
}

// 设置面板功能
function openSettingsPanel() {
  showSettingsPanel.value = true
}

function closeSettingsPanel() {
  showSettingsPanel.value = false
}

function saveSettings() {
  // 这里保存设置到本地存储或后端
  console.log('保存设置:', {
    answerLength: answerLength.value,
    selectedLanguage: selectedLanguage.value,
    formatPreferences: formatPreferences.value,
    privacySettings: privacySettings.value
  })
  success('设置已保存')
  closeSettingsPanel()
}

function clearAllData() {
  if (confirm('确定要清除所有数据吗？这将删除所有会话记录和设置，操作不可恢复。')) {
    sessions.value = []
    messages.value = []
    chatStore.clearMessages()
    activeSessionId.value = null
    success('所有数据已清除')
  }
}

// 导出对话
async function exportConversation() {
  if (messages.value.length === 0) {
    warning('当前没有对话内容可导出')
    return
  }

  try {
    // 询问导出格式
    const format = prompt('请选择导出格式:\n1. txt (文本格式)\n2. markdown (Markdown格式)\n3. json (JSON格式)', 'txt')

    if (!format) return // 用户取消

    let exportFormat = 'txt'
    if (format === '1' || format.toLowerCase() === 'txt') {
      exportFormat = 'txt'
    } else if (format === '2' || format.toLowerCase() === 'markdown') {
      exportFormat = 'markdown'
    } else if (format === '3' || format.toLowerCase() === 'json') {
      exportFormat = 'json'
    }

    // 使用聊天服务导出
    const result = await chatService.exportConversation(messages.value, exportFormat)

    if (result.success) {
      const blob = new Blob([result.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // 根据格式设置文件名
      const extension = exportFormat === 'markdown' ? 'md' : exportFormat
      a.download = `对话记录_${new Date().toISOString().slice(0, 10)}.${extension}`

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      success(`对话已导出为${exportFormat.toUpperCase()}格式`)
    } else {
      showError('导出失败: ' + result.error)
    }
  } catch (error) {
    console.error('导出对话失败:', error)
    showError('导出失败: ' + error.message)
  }
}

// 切换语言
function toggleLanguage() {
  const languages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR']
  const currentIndex = languages.indexOf(selectedLanguage.value)
  const nextIndex = (currentIndex + 1) % languages.length
  selectedLanguage.value = languages[nextIndex]
  success(`语言已切换为: ${getLanguageName(languages[nextIndex])}`)
}

function getLanguageName(code) {
  const names = {
    'zh-CN': '简体中文',
    'en-US': 'English',
    'ja-JP': '日本語',
    'ko-KR': '한국어'
  }
  return names[code] || code
}

// 复制消息功能
async function copyMessage(content, messageId = null) {
  if (messageId) {
    startLoading('copy', messageId)
  }

  try {
    await navigator.clipboard.writeText(content)
    // 使用更轻量的提示
    message.success('已复制', {
      duration: 1500,
      keepAliveOnHover: true
    })
  } catch (err) {
    console.error('复制失败:', err)
    message.error('复制失败')
  } finally {
    if (messageId) {
      // 更快的反馈
      setTimeout(() => {
        stopLoading('copy', messageId)
      }, 300)
    }
  }
}

// 引用消息
function quoteMessage(messageId) {
  const message = messages.value.find(m => m.id === messageId)
  if (message && message.content) {
    // 将引用内容添加到输入框
    const quotedText = `> ${message.content}\n\n`
    userInput.value = quotedText + userInput.value
    // 聚焦到输入框
    const textarea = document.querySelector('.chat-input textarea')
    if (textarea) {
      textarea.focus()
      textarea.scrollIntoView({ behavior: 'smooth' })
    }
    message.success('已引用到输入框', { duration: 1500 })
  }
}

// 重新生成消息
async function regenerateMessage(messageId) {
  startLoading('regenerate', messageId)

  try {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) {
      showError('消息不存在')
      return
    }

    const message = messages[messageIndex]
    if (message.role !== 'assistant') {
      showError('只能重新生成AI消息')
      return
    }

    // 找到对应的用户消息
    let userMessageIndex = -1
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessageIndex = i
        break
      }
    }

    if (userMessageIndex === -1) {
      showError('找不到对应的用户消息')
      return
    }

    const userMessage = messages[userMessageIndex]

    // 删除从用户消息之后的所有消息
    messages.splice(userMessageIndex + 1)

    // 重新发送用户消息
    userInput.value = userMessage.content
    await sendMessage()

    message.success('重新生成中...', { duration: 2000 })
  } catch (error) {
    console.error('重新生成失败:', error)
    message.error('重新生成失败')
  } finally {
    stopLoading('regenerate', messageId)
  }
}

// 继续生成
async function continueGeneration(messageId) {
  startLoading('continue', messageId)

  try {
    const messageIndex = messages.value.findIndex(m => m.id === messageId)
    if (messageIndex === -1) {
      showError('消息不存在')
      return
    }

    const message = messages.value[messageIndex]
    if (message.role !== 'assistant') {
      showError('只能继续生成AI消息')
      return
    }

    // 提示用户输入继续的内容
    const continuePrompt = prompt('请输入要继续生成的内容（留空则继续当前对话）：', '请继续')
    if (continuePrompt === null) return // 用户取消

    const continueMessage = {
      id: Date.now(),
      role: 'user',
      content: continuePrompt || '请继续'
    }

    messages.value.push(continueMessage)
    chatStore.addMessage(continueMessage)

    // 调用AI服务继续生成
    await sendAIResponse(continuePrompt || '请继续')

    message.success('继续生成中...', { duration: 2000 })
  } catch (error) {
    console.error('继续生成失败:', error)
    message.error('继续生成失败')
  } finally {
    stopLoading('continue', messageId)
  }
}

// 发送AI响应（辅助函数）
async function sendAIResponse(prompt) {
  try {
    // 准备消息历史
    const messageHistory = messages.value
      .filter(m => m.content)
      .map(m => ({ role: m.role, content: m.content }))

    // 创建AI消息占位符
    const aiMessageId = Date.now() + 1
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      displayContent: '',
      isThinking: false,
      isGenerating: true,
      showCursor: false,
      typewriterQueue: [],
      isProcessingTypewriter: false
    }
    messages.value.push(aiMessage)
    const aiMessageIndex = messages.value.length - 1
    const msg = messages.value[aiMessageIndex]

    // 滚动到底部
    await nextTick()
    forceScrollToBottom()

    // 调用聊天服务
    const options = {
      temperature: settingsStore.temperature || 0.7,
      maxTokens: settingsStore.maxTokens || 4096,
      deepThinking: settingsStore.deepThinking,
      webSearch: settingsStore.webSearch
    }

    let isFirstChunk = true
    const onChunkCallback = chunk => {
      // 将 chunk 添加到打字机队列
      if (!msg.typewriterQueue) {
        msg.typewriterQueue = []
      }
      msg.typewriterQueue.push(...chunk.split(''))

      // 第一个chunk到达时，启动打字机效果
      if (isFirstChunk) {
        isFirstChunk = false
      }

      if (!msg.isProcessingTypewriter) {
        processTypewriter(aiMessageIndex)
      }
    }

    await chatService.sendMessageStream(messageHistory, {
      ...options,
      onChunk: onChunkCallback
    })

    // 等待打字机效果完成
    const waitForTypewriter = () => {
      return new Promise((resolve) => {
        const checkTypewriter = () => {
          const currentMsg = messages.value[aiMessageIndex]
          if (currentMsg && currentMsg.isProcessingTypewriter) {
            setTimeout(checkTypewriter, 100)
          } else {
            resolve()
          }
        }
        checkTypewriter()
      })
    }

    await waitForTypewriter()

    // 保存到聊天历史
    chatStore.addMessage(messages.value[aiMessageIndex])
    success('已继续生成')
  } catch (error) {
    console.error('继续生成失败:', error)
    showError('继续生成失败: ' + error.message)
  }
}

// 深度思考模式
async function startDeepThinking(prompt) {
  try {
    const startTime = Date.now()

    // 显示思考过程
    const thinkingMessage = {
      id: Date.now(),
      role: 'assistant',
      content: '',
      displayContent: '',
      isThinking: true,
      isGenerating: true,
      showCursor: false,
      typewriterQueue: [],
      isProcessingTypewriter: false,
      thinkingContent: '',
      thinkingCollapsed: false,
      thinkingDuration: null
    }
    messages.value.push(thinkingMessage)
    const thinkingIndex = messages.value.length - 1
    const msg = messages.value[thinkingIndex]

    // 滚动到底部
    await nextTick()
    forceScrollToBottom()

    // 创建深度思考的提示
    const deepThinkingPrompt = `请对以下问题进行深度思考和分析：

问题："${prompt}"

请按照以下步骤进行思考：
1. 分析问题的核心要点和关键信息
2. 考虑相关的背景知识和上下文
3. 评估不同的解决方案或观点
4. 权衡各种方案的优缺点
5. 形成最终的回答和建议

请提供详细的分析过程和逻辑推理，最后给出结论。`

    // 流式调用 aiService，思考内容实时流式输出到 thinkingContent
    await aiService.sendMessage([{ role: 'user', content: deepThinkingPrompt }], (chunk) => {
      // 将 chunk 添加到打字机队列
      if (!msg.typewriterQueue) {
        msg.typewriterQueue = []
      }
      msg.typewriterQueue.push(...chunk.split(''))

      // 如果打字机未运行，启动它
      if (!msg.isProcessingTypewriter) {
        processTypewriter(thinkingIndex)
      }
    })

    // 等待打字机效果完成
    const waitForTypewriter = () => {
      return new Promise((resolve) => {
        const checkTypewriter = () => {
          const currentMsg = messages.value[thinkingIndex]
          if (currentMsg && currentMsg.isProcessingTypewriter) {
            setTimeout(checkTypewriter, 100)
          } else {
            resolve()
          }
        }
        checkTypewriter()
      })
    }

    await waitForTypewriter()

    // 思考完成，计算用时并切换到正文显示
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    msg.thinkingDuration = duration
    msg.isThinking = false
    // 确保正文有内容（打字机输出的内容已在 displayContent 中）
    if (!msg.displayContent && msg.content) {
      msg.displayContent = msg.content
    }

    // 保存到聊天历史
    chatStore.addMessage(messages.value[thinkingIndex])
    success('深度思考完成')

    // 重置深度思考模式，以便下次使用普通模式
    settingsStore.deepThinking = false
    currentFunction.value = 'normal'
    console.log('🔄 深度思考完成，已重置为普通模式')
  } catch (error) {
    console.error('深度思考失败:', error)
    showError('深度思考失败: ' + error.message)

    // 即使失败也要重置模式
    settingsStore.deepThinking = false
    currentFunction.value = 'normal'
  }
}

// 联网搜索
async function startWebSearch(query) {
  try {
    // 显示搜索过程
    const searchMessage = {
      id: Date.now(),
      role: 'assistant',
      content: '',
      displayContent: '',
      isSearching: true,
      isGenerating: true,
      showCursor: false,
      typewriterQueue: [],
      isProcessingTypewriter: false,
      searchStatus: '正在搜索相关信息',
      searchSources: []
    }
    messages.value.push(searchMessage)
    const searchIndex = messages.value.length - 1
    const msg = messages.value[searchIndex]

    // 滚动到底部
    await nextTick()
    forceScrollToBottom()

    // 更新搜索状态
    msg.searchStatus = '正在搜索...'

    // 调用真实的搜索服务
    let searchResponse
    try {
      searchResponse = await window.electronAPI.chat.webSearch(query)
      console.log('🔍 搜索结果:', searchResponse)
    } catch (searchError) {
      console.error('搜索失败:', searchError)
      msg.searchStatus = '搜索失败，使用本地知识回答'
      msg.isSearching = false
      // 继续用普通AI回答
      searchResponse = { results: [], query }
    }

    // 显示搜索结果
    const searchResults = searchResponse.results || []
    msg.searchSources = searchResults.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      source: r.source || '未知来源'
    }))
    msg.searchStatus = `搜索完成，共 ${searchResults.length} 条结果`
    msg.isSearching = false

    // 开始生成基于搜索结果的答案
    msg.isGenerating = true

    // 构建提示词
    let webSearchPrompt
    if (searchResults.length > 0) {
      const searchContext = searchResults.map((result, index) =>
        `[${index + 1}] ${result.title}
来源: ${result.source}
URL: ${result.url}
摘要: ${result.snippet}`
      ).join('\n\n')

      webSearchPrompt = `请基于以下搜索结果回答用户的问题。

用户问题："${query}"

搜索结果：
${searchContext}

请按照以下要求回答：
1. 主要基于搜索结果提供准确信息
2. 如果搜索结果中有冲突信息，请指出并分析
3. 如果搜索结果不足以完全回答问题，可以补充你的知识，但要明确说明哪些信息来自搜索结果
4. 在回答中引用相关的结果编号（如[1]、[2]）
5. 提供全面、客观的回答

请开始回答：`
    } else {
      // 搜索失败时使用普通提示
      webSearchPrompt = `用户问题："${query}"

（网络搜索暂时不可用，请基于你的知识回答这个问题。如果问题需要最新信息，请说明你的知识截止日期。）`
    }

    // 流式调用 aiService
    await aiService.sendMessage([{ role: 'user', content: webSearchPrompt }], (chunk) => {
      if (!msg.typewriterQueue) {
        msg.typewriterQueue = []
      }
      msg.typewriterQueue.push(...chunk.split(''))

      if (!msg.isProcessingTypewriter) {
        processTypewriter(searchIndex)
      }
    })

    // 等待打字机效果完成
    const waitForTypewriter = () => {
      return new Promise((resolve) => {
        const checkTypewriter = () => {
          const currentMsg = messages.value[searchIndex]
          if (currentMsg && currentMsg.isProcessingTypewriter) {
            setTimeout(checkTypewriter, 100)
          } else {
            resolve()
          }
        }
        checkTypewriter()
      })
    }

    await waitForTypewriter()

    // 保存到聊天历史
    chatStore.addMessage(messages.value[searchIndex])
    success('联网搜索完成')

    // 重置联网搜索模式，以便下次使用普通模式
    settingsStore.webSearch = false
    currentFunction.value = 'normal'

    // 重新启用文件上传
    const fileUpload = document.getElementById('file-upload')
    if (fileUpload) {
      fileUpload.disabled = false
    }

    console.log('🔄 联网搜索完成，已重置为普通模式')
  } catch (error) {
    console.error('联网搜索失败:', error)
    showError('联网搜索失败: ' + error.message)

    // 即使失败也要重置模式
    settingsStore.webSearch = false
    currentFunction.value = 'normal'

    // 重新启用文件上传
    const fileUpload = document.getElementById('file-upload')
    if (fileUpload) {
      fileUpload.disabled = false
    }
  }
}

// 文件上传处理
async function handleFileUpload(event) {
  const files = event.target.files
  if (files.length === 0) return

  // 检查是否在联网搜索模式下
  if (currentFunction.value === 'web-search') {
    warning('联网搜索模式下不支持文件上传')
    event.target.value = '' // 清空文件选择
    return
  }

  try {
    // 处理每个文件
    for (const file of files) {
      const result = await chatService.uploadFile(file)

      if (result.success) {
        // 添加文件消息到聊天
        const fileMessage = {
          id: Date.now(),
          role: 'user',
          content: `上传文件: ${result.fileName}\n文件类型: ${result.fileType}\n文件大小: ${(result.fileSize / 1024).toFixed(2)} KB\n\n${result.content}`,
          isFile: true,
          fileInfo: {
            name: result.fileName,
            type: result.fileType,
            size: result.fileSize,
            timestamp: result.timestamp
          }
        }

        messages.value.push(fileMessage)
        chatStore.addMessage(fileMessage)

        success(`已上传文件: ${result.fileName}`)
      } else {
        warning(`文件上传失败: ${result.error}`)
      }
    }
  } catch (error) {
    console.error('文件上传处理失败:', error)
    showError('文件上传失败: ' + error.message)
  } finally {
    // 清空文件选择，以便可以再次选择相同的文件
    event.target.value = ''
  }
}

// 键盘事件处理
function handleEnterKey(event) {
  if (!event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

function handleShiftEnter(event) {
  // Shift+Enter 换行，不需要特殊处理
  // 默认行为就是插入换行符
}

// 滚动控制
function scrollToTop() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = 0
    console.log('⬆️ 滚动到顶部')
  }
}

// scrollToBottom函数已存在，不需要重复定义

// 同步 chatStore.chatHistory 到 sessions
function syncSessionsFromHistory() {
  if (!Array.isArray(chatStore.chatHistory)) {
    sessions.value = []
    return
  }
  
  sessions.value = chatStore.chatHistory.map(chat => ({
    id: chat.id,
    title: chat.title || '未命名对话',
    timestamp: chat.timestamp,
    messageCount: chat.messages?.length || 0
  }))
  
  console.log('🔄 同步历史会话:', sessions.value.length, '个')
}

// 加载指定会话的消息
function loadSessionMessages(sessionId) {
  const chat = chatStore.chatHistory.find(c => c.id === sessionId)
  if (chat && chat.messages) {
    messages.value = [...chat.messages]
    chatStore.messages = [...chat.messages]
    activeSessionId.value = sessionId
    currentChatHistoryId.value = sessionId
    console.log('📂 加载会话:', chat.title, '消息数:', chat.messages.length)
  }
}

// 监听 chatStore.chatHistory 变化，自动同步到 sessions
watch(() => chatStore.chatHistory, () => {
  syncSessionsFromHistory()
}, { deep: true })

onMounted(() => {
  // 确保 sessions 是数组
  if (!Array.isArray(sessions.value)) {
    sessions.value = []
  }

  // 加载历史消息
  messages.value = [...chatStore.messages]
  
  // 同步 chatStore.chatHistory 到 sessions
  syncSessionsFromHistory()
  
  console.log('📱 ChatView mounted, 加载消息:', messages.value.length, '条')
  console.log('📱 消息详情:', messages.value)
  console.log('📱 历史会话:', sessions.value.length, '个')
})

onUnmounted(() => {
  // 清理所有定时器
  activeTimers.value.forEach(timerId => {
    clearInterval(timerId)
    clearTimeout(timerId)
  })
  activeTimers.value = []
})

function toggleFunction(func) {
  if (currentFunction.value === func) {
    // 关闭当前功能
    currentFunction.value = 'normal'
    settingsStore.deepThinking = false
    settingsStore.webSearch = false
    console.log('🔧 功能模式已关闭，返回普通模式')
  } else {
    // 切换到新功能
    currentFunction.value = func
    if (func === 'deep-thinking') {
      settingsStore.deepThinking = true
      settingsStore.webSearch = false
      console.log('🧠 已启用深度思考模式')
      success('已启用深度思考模式')
    } else if (func === 'web-search') {
      settingsStore.deepThinking = false
      settingsStore.webSearch = true
      console.log('🔍 已启用联网搜索模式')
      success('已启用联网搜索模式')

      // 在联网搜索模式下禁用文件上传
      const fileUpload = document.getElementById('file-upload')
      if (fileUpload) {
        fileUpload.disabled = true
      }
    }
  }

  // 如果切换到非联网搜索模式，启用文件上传
  if (currentFunction.value !== 'web-search') {
    const fileUpload = document.getElementById('file-upload')
    if (fileUpload) {
      fileUpload.disabled = false
    }
  }

  // 输出当前状态供调试
  console.log('当前功能状态:', {
    currentFunction: currentFunction.value,
    deepThinking: settingsStore.deepThinking,
    webSearch: settingsStore.webSearch
  })
}

async function sendMessage() {
  if (!userInput.value.trim() || isProcessing.value) {
    console.log('⏸️ 发送被阻止：输入为空或正在处理中')
    return
  }

  // 检查API Key（双重保护）
  if (!settingsStore.apiKey && settingsStore.apiProvider !== 'ollama') {
    showError('请先在设置中配置 API Key 才能使用对话功能')
    return
  }

  const content = userInput.value.trim()

  // 安全检查：验证输入是否安全
  if (!isSafeInput(content)) {
    showError('输入内容包含不安全字符，请重新输入')
    return
  }

  // 立即清空输入框，防止重复发送
  userInput.value = ''

  // 如果是新对话的第一条消息，创建历史条目
  if (!currentChatHistoryId.value) {
    const historyId = Date.now()
    currentChatHistoryId.value = historyId
    const title = content.substring(0, 50) + (content.length > 50 ? '...' : '')
    chatStore.chatHistory.unshift({
      id: historyId,
      title: title,
      timestamp: new Date().toISOString(),
      messages: []
    })
    chatStore.saveChatHistory()
  }

  // 添加用户消息
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: content
  }
  messages.value.push(userMessage)
  chatStore.addMessage(userMessage)
  console.log('👤 添加用户消息:', userMessage)

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  isProcessing.value = true

  try {
    // 根据模式选择不同的处理方式
    // 优先使用 currentFunction，与 UI 按钮状态保持一致
    if (currentFunction.value === 'deep-thinking' || settingsStore.deepThinking) {
      console.log('🧠 使用深度思考模式发送消息')
      // 深度思考模式 - startDeepThinking会创建自己的消息
      await startDeepThinking(content)
      return
    } else if (currentFunction.value === 'web-search' || settingsStore.webSearch) {
      console.log('🔍 使用联网搜索模式发送消息')
      // 联网搜索模式 - startWebSearch会创建自己的消息
      await startWebSearch(content)
      return
    }

    console.log('💬 使用普通模式发送消息')

    // 普通模式：创建AI消息并添加到消息列表
    const aiMessageId = Date.now() + 1
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      displayContent: '',
      isThinking: false,
      isGenerating: true,
      showCursor: false,
      typewriterQueue: [],
      isProcessingTypewriter: false
    }
    messages.value.push(aiMessage)
    console.log('🤖 添加AI消息占位符:', aiMessage)

    // 滚动到底部
    await nextTick()
    forceScrollToBottom()

    // 获取消息在数组中的索引（用于实时更新）
    const aiMessageIndex = messages.value.length - 1
    console.log('📊 AI消息索引:', aiMessageIndex, '总消息数:', messages.value.length)

    // 准备消息历史（不包括刚添加的空AI消息）
    const messageHistory = messages.value
      .slice(0, -1) // 排除最后一条空消息
      .filter(m => m.content)
      .map(m => ({ role: m.role, content: m.content }))

    // 调用AI服务（流式响应）
    let isFirstChunk = true
    const onChunkCallback = chunk => {
      console.log('📥 收到AI流式响应chunk:', chunk)

      // 将 chunk 添加到打字机队列
      const msg = messages.value[aiMessageIndex]
      if (!msg.typewriterQueue) {
        msg.typewriterQueue = []
      }
      msg.typewriterQueue.push(...chunk.split(''))

      // 第一个chunk到达时，开始打字机效果
      if (isFirstChunk) {
        console.log('🔄 第一个chunk到达，启动打字机效果')
        isFirstChunk = false
      }

      // 如果打字机未运行，启动它
      if (!msg.isProcessingTypewriter) {
        processTypewriter(aiMessageIndex)
      }
    }

    // 打字机效果处理函数
    function processTypewriter(index) {
      const msg = messages.value[index]
      if (!msg) {
        return
      }

      // 初始化队列（如果不存在）
      if (!msg.typewriterQueue) {
        msg.typewriterQueue = []
      }

      // 如果队列为空，停止处理
      if (msg.typewriterQueue.length === 0) {
        msg.isProcessingTypewriter = false
        msg.isGenerating = false
        return
      }

      msg.isProcessingTypewriter = true
      msg.showCursor = true

      let lastTime = 0
      const baseSpeed = 30 // 毫秒/字符

      // 使用 requestAnimationFrame 实现平滑打字
      const typeNextChar = (currentTime) => {
        const currentMsg = messages.value[index]
        if (!currentMsg) {
          return
        }

        // 确保队列存在
        if (!currentMsg.typewriterQueue) {
          currentMsg.typewriterQueue = []
        }

        // 如果队列为空，停止处理
        if (currentMsg.typewriterQueue.length === 0) {
          currentMsg.isProcessingTypewriter = false
          currentMsg.isGenerating = false
          currentMsg.showCursor = false
          return
        }

        // 控制打字速度
        if (currentTime - lastTime < baseSpeed) {
          requestAnimationFrame(typeNextChar)
          return
        }

        // 每次取一个字符
        const char = currentMsg.typewriterQueue.shift()
        currentMsg.displayContent = (currentMsg.displayContent || '') + char
        currentMsg.content = currentMsg.displayContent

        // 第一个字符显示后，清除生成状态
        if (currentMsg.displayContent.length === 1) {
          currentMsg.isGenerating = false
        }

        lastTime = currentTime

        // 实时滚动到底部（每3个字符滚动一次，避免过于频繁）
        if (currentMsg.displayContent.length % 3 === 0) {
          forceScrollToBottom()
        }

        // 如果队列中还有字符，继续打字
        if (currentMsg.typewriterQueue.length > 0) {
          requestAnimationFrame(typeNextChar)
        } else {
          currentMsg.isProcessingTypewriter = false
          currentMsg.isGenerating = false
          currentMsg.showCursor = false
          // 最终滚动到底部
          forceScrollToBottom()
        }
      }

      requestAnimationFrame(typeNextChar)
    }

    console.log('🚀 开始调用AI服务，消息历史:', messageHistory)
    try {
      // 直接使用 aiService（两种环境都用这个）
      const aiMessages = messageHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      await aiService.sendMessage(aiMessages, onChunkCallback)
      console.log('✅ AI服务调用完成')
    } catch (error) {
      console.error('❌ AI服务调用失败:', error)
      throw error
    }

    // 流式响应完成后，等待打字机效果完成
    const waitForTypewriter = () => {
      return new Promise((resolve) => {
        const checkTypewriter = () => {
          const msg = messages.value[aiMessageIndex]
          if (msg && msg.isProcessingTypewriter) {
            // 还有字符在队列中，继续等待
            setTimeout(checkTypewriter, 100)
          } else {
            // 打字机效果完成
            resolve()
          }
        }
        checkTypewriter()
      })
    }

    await waitForTypewriter()

    // 第一次成功对话后，更新API状态为已连接
    if (settingsStore.apiStatus !== 'connected') {
      settingsStore.apiStatus = 'connected'
    }

    // 保存到聊天历史
    chatStore.addMessage(messages.value[aiMessageIndex])

    // 自动保存当前对话到历史记录（每次AI回复后）
    if (messages.value.length >= 2) {
      const firstUserMessage = messages.value.find(m => m.role === 'user')

      // 优先通过 currentChatHistoryId 匹配当前对话
      let existingHistoryIndex = -1
      if (currentChatHistoryId.value) {
        existingHistoryIndex = chatStore.chatHistory.findIndex(h => h.id === currentChatHistoryId.value)
      }

      if (existingHistoryIndex !== -1) {
        // 更新现有历史记录
        chatStore.chatHistory[existingHistoryIndex].messages = [...messages.value]
        chatStore.chatHistory[existingHistoryIndex].timestamp = new Date().toISOString()
      } else {
        // 创建新的历史记录
        const historyId = Date.now()
        currentChatHistoryId.value = historyId
        chatStore.chatHistory.unshift({
          id: historyId,
          title: firstUserMessage ? firstUserMessage.content.substring(0, 50) : '新对话',
          timestamp: new Date().toISOString(),
          messages: [...messages.value]
        })
      }
      chatStore.saveChatHistory()
    }
  } catch (error) {
    messages.value[aiMessageIndex].content = `❌ 错误: ${error.message}`
    showError('发送消息失败: ' + error.message)
    console.error('❌ 发送消息失败:', error)
    console.error('错误堆栈:', error.stack)
  } finally {
    isProcessing.value = false
  }
}

function formatMessage(content) {
  // 使用安全的HTML格式化
  return formatMessageSafely(content)
}

// 格式化消息时间戳
function formatMessageTime(timestamp) {
  if (!timestamp) return '刚刚'

  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`

    // 超过一周显示具体日期
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('格式化时间戳失败:', error)
    return '未知时间'
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    // 使用平滑滚动
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

// 强制滚动到底部（不使用平滑动画，用于实时更新）
function forceScrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function newChat() {
  // 重置当前会话追踪
  currentChatHistoryId.value = null

  // 清空当前消息
  messages.value = []
  chatStore.clearMessages()
  userInput.value = ''

  success('已创建新对话')
}

// 消息操作方法
function startEditMessage(message) {
  startLoading('edit', message.id)

  try {
    editingMessageId.value = message.id
    editingContent.value = message.content
  } finally {
    // 编辑按钮的加载状态在用户开始编辑后立即结束
    setTimeout(() => {
      stopLoading('edit', message.id)
    }, 300)
  }
}

function cancelEdit() {
  editingMessageId.value = null
  editingContent.value = ''
}

function saveEdit() {
  if (!editingContent.value.trim()) {
    showError('消息内容不能为空')
    return
  }
  if (chatStore.updateMessage(editingMessageId.value, editingContent.value)) {
    // 更新本地messages数组
    const index = messages.value.findIndex(m => m.id === editingMessageId.value)
    if (index !== -1) {
      messages.value[index].content = editingContent.value
      messages.value[index].edited = true
      messages.value[index].editTimestamp = new Date().toISOString()
    }
    cancelEdit()
  } else {
    showError('更新消息失败')
  }
}

// 处理删除操作（带确认）
async function handleDelete(messageId) {
  // 使用更轻量的确认方式
  if (window.confirm('确定要删除这条消息吗？')) {
    await deleteMessage(messageId)
  }
}

async function deleteMessage(messageId) {
  startLoading('delete', messageId)

  try {
    if (!chatStore.deleteMessage(messageId)) {
      message.error('删除失败')
    } else {
      message.success('已删除', { duration: 1500 })
    }
  } catch (error) {
    console.error('删除消息失败:', error)
    message.error('删除消息失败: ' + error.message)
  } finally {
    stopLoading('delete', messageId)
  }
}

async function recallMessage(messageId) {
  startLoading('recall', messageId)

  try {
    // 检查消息是否可撤回（仅限用户消息且发送时间在2分钟内）
    const message = messages.find(m => m.id === messageId)
    if (!message) {
      showError('消息不存在')
      return
    }

    const messageTime = new Date(message.timestamp).getTime()
    const now = Date.now()
    const twoMinutes = 2 * 60 * 1000

    if (message.role !== 'user') {
      message.error('只能撤回用户消息')
      return
    }

    if (now - messageTime > twoMinutes) {
      message.error('已超过撤回时间')
      return
    }

    // 使用Promise包装确认对话框
    const confirmed = await new Promise((resolve) => {
      const result = confirm('确定要撤回这条消息吗？')
      resolve(result)
    })

    if (!confirmed) {
      return
    }

    if (!chatStore.recallMessage(messageId)) {
      message.error('撤回失败')
    } else {
      message.success('已撤回', { duration: 1500 })
    }
  } catch (error) {
    console.error('撤回消息失败:', error)
    message.error('撤回消息失败: ' + error.message)
  } finally {
    stopLoading('recall', messageId)
  }
}

</script>

<style scoped>
.chat-view {
  display: flex;
  height: 100vh;
  background: var(--color-bg-page);
  font-family: var(--font-family);
  flex-direction: row;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  height: 100%;
  position: relative;
  min-width: 0;
}

/* 顶部导航 */
.main-header {
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  position: absolute;
  left: 16px;
}

.header-actions-group {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-title i {
  color: var(--color-primary);
}

.header-toggle-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.header-toggle-btn:hover {
  background: var(--color-bg-hover);
}

.brand-logo {
  font-size: 26px;
  color: var(--color-primary);
  filter: drop-shadow(0 0 6px rgba(26, 115, 232, 0.3));
}

.brand-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.header-actions {
  display: none;
}

/* 聊天容器 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  padding: 0;
  min-height: 0;
}

/* 滚动条在最右边 */
.chat-container::-webkit-scrollbar {
  width: 6px;
}

.chat-container::-webkit-scrollbar-track {
  background: transparent;
}

.chat-container::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.chat-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

.chat-container.empty-state {
  justify-content: center;
  align-items: center;
}

/* 空状态 */
.empty-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  width: 100%;
  flex: 1;
}

.empty-center-content {
  text-align: center;
  width: 100%;
  max-width: 680px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-center-text {
  margin-bottom: 40px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

.welcome-logo {
  font-size: 36px;
  color: var(--color-primary);
  filter: drop-shadow(0 0 8px rgba(26, 115, 232, 0.3));
}

.welcome-text h2 {
  margin: 0;
  font-size: 22px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.welcome-brand {
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-text p {
  margin: 4px 0 0;
  font-size: 16px;
  color: var(--color-text-secondary);
}

.empty-input-wrapper {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  position: relative;
}

.empty-input {
  width: 100%;
  padding: 16px 120px 16px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  font-size: 16px;
  resize: none;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: border-color var(--duration-fast) var(--ease);
  min-height: 56px;
  line-height: 1.5;
}

.empty-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
}

.empty-actions {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) var(--ease);
}

.empty-action-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.empty-action-btn.active {
  background: var(--color-primary);
  color: white;
}

.empty-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-send-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) var(--ease);
}

.empty-send-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.empty-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 0;
  background: var(--color-bg-page);
  position: relative;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

.messages-content {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ============ 消息行 ============ */
.message-row {
  margin-bottom: 32px;
}

/* ============ 用户消息 ============ */
.user-message {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-bubble {
  max-width: 75%;
  padding: 12px 16px;
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary-border);
  color: var(--color-text-primary);
  border-radius: 12px 12px 4px 12px;
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
}

.user-bubble:hover {
  /* 无悬停效果 */
}

/* ============ AI 消息 ============ */
.ai-message {
  max-width: 100%;
}

.ai-reply {
  padding: 8px 0;
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text-primary);
  word-break: break-word;
}

/* -- 深度思考 -- */
.thinking-simple {
  margin-bottom: 16px;
}

.thinking-header-simple {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.thinking-icon {
  color: var(--color-primary);
  font-size: 14px;
}

.thinking-time-simple {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.thinking-content-simple {
  padding: 0;
}

.thinking-text-simple {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  font-family: inherit;
  overflow-x: auto;
}

/* 思考区域展开动画 */
.thinking-expand-enter-active,
.thinking-expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.thinking-expand-enter-from,
.thinking-expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* -- 联网搜索 -- */
.search-simple {
  margin-bottom: 16px;
}

.search-header-simple {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.search-icon {
  color: var(--color-primary);
  font-size: 14px;
}

.search-status {
  font-weight: 500;
  color: var(--color-text-primary);
}

.search-results-simple {
  margin-top: 4px;
}

.search-links-simple {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search-link-simple {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: 2px 0;
}

.search-link-simple:hover {
  color: var(--color-primary);
}

.search-link-index {
  font-size: 12px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-link-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-link-domain {
  font-size: 11px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

/* -- AI 正文回复 -- */
/* .ai-reply styles moved to glassmorphism section above */

.reply-content h1 { font-size: 1.4em; font-weight: 700; margin: 0.8em 0 0.4em; }
.reply-content h2 { font-size: 1.25em; font-weight: 600; margin: 0.7em 0 0.3em; }
.reply-content h3 { font-size: 1.1em; font-weight: 600; margin: 0.6em 0 0.3em; }
.reply-content p { margin: 0.5em 0; }
.reply-content ul, .reply-content ol { margin: 0.5em 0; padding-left: 1.5em; }
.reply-content li { margin: 0.25em 0; }
.reply-content code { background: var(--color-bg-hover); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; font-family: var(--font-mono); }
.reply-content pre { background: var(--color-bg-secondary); padding: 1em; border-radius: var(--radius-md); overflow-x: auto; margin: 0.8em 0; }
.reply-content pre code { background: transparent; padding: 0; }
.reply-content blockquote { margin: 0.8em 0; padding: 0.6em 1em; border-left: 3px solid var(--color-primary); background: var(--color-bg-page); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.reply-content table { width: 100%; border-collapse: collapse; margin: 0.8em 0; }
.reply-content th { background: var(--color-bg-hover); font-weight: 600; padding: 8px 12px; text-align: left; border: 1px solid var(--color-border); }
.reply-content td { padding: 8px 12px; border: 1px solid var(--color-border); }

/* -- 等待动画 -- */
.ai-typing-indicator {
  padding: 16px 0;
}

.typing-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: dotPulse 1.4s infinite ease-in-out;
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.16s; }
.dot:nth-child(3) { animation-delay: 0.32s; }

@keyframes dotPulse {
  0%, 60%, 100% { transform: scale(0.6); opacity: 0.4; }
  30% { transform: scale(1); opacity: 1; }
}

/* ============ 消息操作按钮 ============ */
.msg-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-row:hover .msg-actions {
  opacity: 1;
}

.msg-actions button {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all var(--duration-fast) var(--ease);
}

.msg-actions button:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.user-actions {
  justify-content: flex-end;
}

/* 撤回消息 */
.recalled-message {
  padding: 10px 14px;
  color: var(--color-text-tertiary);
  font-size: 13px;
  font-style: italic;
}
.hover-text-primary:hover {
  color: var(--color-primary) !important;
}

.hover-text-red-500:hover {
  color: var(--color-danger) !important;
}

/* 聊天控制区 */
.chat-controls {
  position: absolute;
  right: 24px;
  bottom: 100px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scroll-controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scroll-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) var(--ease);
}

.scroll-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 聊天底部 */
.chat-footer {
  padding: 16px 24px;
  background: var(--color-bg-page);
  flex-shrink: 0;
  position: relative;
}

/* 消息内容在输入框上方渐变消失 */
.chat-footer::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, transparent, var(--color-bg-page));
  pointer-events: none;
}

.footer-input-wrapper {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  position: relative;
}

.footer-input {
  width: 100%;
  padding: 16px 120px 16px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  font-size: 15px;
  resize: none;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: border-color var(--duration-fast) var(--ease);
  min-height: 56px;
  line-height: 1.5;
}

.footer-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.1);
}

.footer-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.footer-actions {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 设置面板 */
.settings-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-panel {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-card-hover);
}

.settings-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-settings-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) var(--ease);
}

.close-settings-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.settings-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.setting-section {
  margin-bottom: 24px;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.setting-options {
  display: flex;
  gap: 8px;
}

.setting-option {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease);
}

.setting-option:hover {
  border-color: var(--color-primary);
}

.setting-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.format-preferences,
.privacy-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.format-option,
.privacy-option {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.format-option input,
.privacy-option input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.language-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 14px;
}

.language-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.clear-data-btn {
  padding: 10px 16px;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-danger);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease);
}

.clear-data-btn:hover {
  background: var(--color-danger-light);
}

.settings-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.save-settings-btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease);
}

.save-settings-btn:hover {
  background: var(--color-primary-hover);
}

/* 工具类 */
.max-h-200px {
  max-height: 200px;
}

.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: var(--ease);
  transition-duration: var(--duration-fast);
}

.text-gray-700 {
  color: var(--color-text-primary);
}

.hover-bg-gray-300:hover {
  background-color: var(--color-border);
}

.hover-bg-primary-90:hover {
  opacity: 0.9;
}

.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
.pl-4 { padding-left: 1rem; }
.pr-40 { padding-right: 10rem; }
.pl-4 { padding-left: 1rem; }
.bg-gray-800 { background-color: var(--color-bg-secondary); }
.text-white { color: white; }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-tl-none { border-top-left-radius: 0; }
.overflow-x-auto { overflow-x: auto; }
.bg-yellow-50 { background-color: var(--color-warning-light); }
.border-yellow-200 { border-color: var(--color-warning-light); }
.font-medium { font-weight: 500; }
.font-bold { font-weight: 700; }
.text-yellow-700 { color: var(--color-warning); }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.space-y-2 > * + * { margin-top: 0.5rem; }
.list-decimal { list-style-type: decimal; }
.pl-5 { padding-left: 1.25rem; }
.space-y-1 > * + * { margin-top: 0.25rem; }
.bg-gray-200 { background-color: var(--color-border); }
.opacity-50 { opacity: 0.5; }
.cursor-not-allowed { cursor: not-allowed; }
.hidden { display: none; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-1 { flex: 1; }
.flex-shrink-0 { flex-shrink: 0; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.w-10 { width: 2.5rem; }
.h-10 { height: 2.5rem; }
.w-full { width: 100%; }
.min-h-80px { min-height: 80px; }
.rounded-full { border-radius: 9999px; }
.border { border-width: 1px; }
.border-gray-300 { border-color: var(--color-border); }
.focus-outline-none:focus { outline: none; }
.focus-ring-2:focus { box-shadow: 0 0 0 2px var(--color-primary-light); }
.focus-ring-primary-20 { --tw-ring-color: rgba(26, 115, 232, 0.2); }
.focus-border-primary:focus { border-color: var(--color-primary); }
.resize-none { resize: none; }
.text-gray-500 { color: var(--color-text-tertiary); }

/* 消息编辑 */
.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  resize: vertical;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.edit-btn {
  padding: 4px 12px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease);
}

.save-btn {
  background: var(--color-primary);
  color: white;
}

.save-btn:hover {
  background: var(--color-primary-hover);
}

.cancel-btn {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.cancel-btn:hover {
  background: var(--color-bg-hover);
}

/* 撤回消息 */
.recalled-message {
  color: var(--color-text-tertiary);
  font-style: italic;
}

/* 调试空消息 */
.debug-empty {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

/* 侧边栏 */
.sidebar {
  width: 256px;
  height: 100%;
  background: var(--color-bg-primary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width var(--duration-fast) var(--ease);
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 0;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.new-chat-btn {
  width: 100%;
  background: var(--color-primary);
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color var(--duration-fast) var(--ease);
}

.new-chat-btn:hover {
  background: var(--color-primary-hover);
}

.sidebar-search {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.search-container {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  font-size: 14px;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  transition: border-color var(--duration-fast) var(--ease);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
  transition: background-color var(--duration-fast) var(--ease);
}

.session-item:hover {
  background: var(--color-bg-hover);
}

.session-item.active {
  background: var(--color-primary-light);
}

.session-icon {
  color: var(--color-primary);
  font-size: 14px;
  flex-shrink: 0;
}

.session-title {
  flex: 1;
  font-size: 14px;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-actions {
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease);
}

.session-item:hover .session-actions {
  opacity: 1;
}

.session-action-btn {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-md);
  font-size: 12px;
  transition: color var(--duration-fast) var(--ease);
}

.session-action-btn:hover {
  color: var(--color-danger);
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.empty-history i {
  font-size: 24px;
  margin-bottom: 8px;
}

.empty-history p {
  font-size: 14px;
  margin: 0;
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
}

.toggle-sidebar-btn {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color var(--duration-fast) var(--ease);
}

.toggle-sidebar-btn:hover {
  background: var(--color-bg-hover);
}

.header-actions-compact {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.compact-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) var(--ease);
}

.compact-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-primary);
}

.compact-btn.primary {
  background: var(--color-primary);
  color: white;
}

.compact-btn.primary:hover {
  background: var(--color-primary-hover);
}

.compact-logo {
  color: var(--color-primary);
  font-size: 26px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.tools-dropdown {
  position: absolute;
  top: 50px;
  left: 60px;
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

.expand-sidebar-btn {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 16px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--duration-fast) var(--ease);
}

.expand-sidebar-btn:hover {
  background: var(--color-bg-hover);
}

.reset-session-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-primary);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  transition: background-color var(--duration-fast) var(--ease);
  font-weight: 500;
}

.reset-session-btn:hover {
  background: var(--color-bg-hover);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--color-bg-page);
  position: relative;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

.chat-messages.has-messages {
  justify-content: flex-start;
  align-items: stretch;
}

.settings-btn:hover,
.export-btn:hover,
.language-btn:hover {
  background: var(--color-bg-hover);
}

/* 设置面板 */
.settings-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-panel {
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid var(--color-border);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.settings-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.close-settings-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  border-radius: var(--radius-md);
  transition: color var(--duration-fast) var(--ease);
}

.close-settings-btn:hover {
  color: var(--color-text-primary);
}

.settings-content {
  padding: 24px;
}

.setting-section {
  margin-bottom: 24px;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.setting-options {
  display: flex;
  gap: 8px;
}

.setting-option {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 14px;
  transition: background-color var(--duration-fast) var(--ease);
}

.setting-option:hover {
  background: var(--color-bg-hover);
}

.setting-option.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.format-preferences {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease);
}

.format-option:hover {
  background: var(--color-bg-hover);
}

.format-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  cursor: pointer;
}

.format-option span {
  font-size: 14px;
  color: var(--color-text-primary);
}

.language-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease);
}

.language-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.privacy-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.privacy-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease);
}

.privacy-option:hover {
  background: var(--color-bg-hover);
}

.privacy-option span {
  font-size: 14px;
  color: var(--color-text-primary);
}

.privacy-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  cursor: pointer;
}

.clear-data-btn {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-danger-light);
  border-radius: var(--radius-md);
  background: var(--color-danger-light);
  color: var(--color-danger);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color var(--duration-fast) var(--ease);
}

.clear-data-btn:hover {
  background: var(--color-danger);
  color: white;
}

.settings-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.save-settings-btn {
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color var(--duration-fast) var(--ease);
}

.save-settings-btn:hover {
  background: var(--color-primary-hover);
}

/* 消息操作 */
.messages-content {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.message-content-container {
  position: relative;
  flex: 1;
  max-width: 65%;
}

.message-actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  resize: none;
  font-size: 15px;
  line-height: 1.6;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: inherit;
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.edit-btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color var(--duration-fast) var(--ease);
}

.save-btn {
  background: var(--color-success);
  color: white;
}

.save-btn:hover {
  opacity: 0.9;
}

.cancel-btn {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.cancel-btn:hover {
  background: var(--color-border);
}

.recalled-message {
  padding: 12px 16px;
  background: var(--color-danger-light);
  border: 1px solid var(--color-danger-light);
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.edited-indicator {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.debug-empty {
  padding: 12px 16px;
  background: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  color: var(--color-warning);
  font-size: 12px;
  font-family: monospace;
  margin-top: 8px;
}

/* 功能头部 */
.feature-header {
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feature-header h3 {
  font-size: 1.5em;
  color: var(--color-text-primary);
  margin-bottom: 5px;
}

.feature-header p {
  color: var(--color-text-secondary);
  font-size: 0.9em;
  margin: 0;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background-color var(--duration-fast) var(--ease);
}

.new-chat-btn:hover {
  background: var(--color-primary-hover);
}

.new-chat-btn i {
  font-size: 0.875rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--color-bg-page);
  position: relative;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

.chat-input-container {
  padding: 24px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.function-buttons {
  margin-bottom: 15px;
  padding: 0;
  background: transparent;
  border: none;
}

.function-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mode-switches {
  display: flex;
  gap: 8px;
}

.function-btn {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color var(--duration-fast) var(--ease);
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  height: 36px;
}

.function-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.function-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: transparent;
}

.current-mode-container {
  margin-bottom: 12px;
  padding: 12px 16px;
  background: var(--color-primary-light);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-primary);
}

.mode-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.mode-header i {
  color: var(--color-primary);
  font-size: 1rem;
}

.current-mode {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.875rem;
}

.mode-description {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  line-height: 1.4;
  display: block;
  margin-top: 2px;
  padding-left: 24px;
}

.input-group {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-group textarea {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  resize: none;
  font-size: 15px;
  line-height: 1.6;
  max-height: 120px;
  min-height: 60px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-weight: 500;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.04);
}

.input-group textarea::placeholder {
  color: var(--color-text-tertiary);
  transition: color 0.3s ease;
}

.input-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.input-group textarea:focus::placeholder {
  color: var(--color-border);
}

.input-group textarea:disabled {
  background: var(--color-bg-secondary);
  cursor: not-allowed;
  opacity: 0.6;
  color: var(--color-text-tertiary);
}

.input-group textarea:disabled::placeholder {
  color: var(--color-danger);
  font-weight: 500;
}

.send-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  height: 40px;
  width: 40px;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--duration-fast) var(--ease);
}

.send-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.send-btn:disabled {
  background: var(--color-text-tertiary);
  cursor: not-allowed;
  opacity: 0.5;
}

.mode-description {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  line-height: 1.4;
  display: block;
  margin-top: 2px;
  padding-left: 24px;
}

.input-group {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-group textarea {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  resize: none;
  font-size: 15px;
  line-height: 1.6;
  max-height: 120px;
  min-height: 60px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  transition: border-color var(--duration-fast) var(--ease);
}

.input-group textarea::placeholder {
  color: var(--color-text-tertiary);
}

.input-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.input-group textarea:focus::placeholder {
  color: var(--color-border);
}

.input-group textarea:disabled {
  background: var(--color-bg-secondary);
  cursor: not-allowed;
  opacity: 0.6;
  color: var(--color-text-tertiary);
}

.input-group textarea:disabled::placeholder {
  color: var(--color-danger);
  font-weight: 500;
}

.send-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  height: 40px;
  width: 40px;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--duration-fast) var(--ease);
}

.send-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.send-btn:disabled {
  background: var(--color-text-tertiary);
  cursor: not-allowed;
  opacity: 0.6;
}

.messages-content {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.message-content-container {
  position: relative;
  flex: 1;
  max-width: 65%;
}

.message-actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  resize: none;
  font-size: 15px;
  line-height: 1.6;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: inherit;
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.edit-btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color var(--duration-fast) var(--ease);
}

.save-btn {
  background: var(--color-success);
  color: white;
}

.save-btn:hover {
  opacity: 0.9;
}

.cancel-btn {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.cancel-btn:hover {
  background: var(--color-border);
}

.recalled-message {
  padding: 12px 16px;
  background: var(--color-danger-light);
  border: 1px solid var(--color-danger-light);
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.edited-indicator {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.message.user .message-content-container {
  display: flex;
  justify-content: flex-end;
}

.message.assistant .message-content-container {
  display: flex;
  justify-content: flex-start;
}

.debug-empty {
  padding: 12px 16px;
  background: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  color: var(--color-warning);
  font-size: 12px;
  font-family: monospace;
  margin-top: 8px;
}

.file-info {
  margin-top: 8px;
  padding: 8px;
  background: var(--color-info-light);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-info);
}

.file-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.file-info-header i {
  font-size: 14px;
}

.file-info-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  font-size: 11px;
  color: var(--color-info);
}

.search-results {
  margin-top: 12px;
  padding: 12px;
  background: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
}

.search-result-item {
  margin-bottom: 8px;
  padding: 8px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-warning);
}

.search-result-title {
  font-weight: 600;
  color: var(--color-warning);
  margin-bottom: 4px;
}

.search-result-snippet {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.search-result-url {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 4px;
}

.thinking-process {
  margin-top: 12px;
  padding: 12px;
  background: var(--color-info-light);
  border: 1px solid var(--color-info);
  border-radius: var(--radius-md);
}

.thinking-step {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 6px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
}

.thinking-step.completed {
  background: var(--color-success-light);
  border-left: 3px solid var(--color-success);
}

.thinking-step.current {
  background: var(--color-warning-light);
  border-left: 3px solid var(--color-warning);
}

.thinking-step-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.thinking-step.completed .thinking-step-icon {
  background: var(--color-success);
  color: white;
}

.thinking-step.current .thinking-step-icon {
  background: var(--color-warning);
  color: white;
}

.thinking-step-description {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-primary);
}

.thinking-progress {
  margin-top: 8px;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.thinking-progress-bar {
  height: 100%;
  background: var(--color-primary);
  transition: width var(--duration-fast) var(--ease);
}

.message-actions-natural {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.action-btn-natural {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease);
  user-select: none;
  white-space: nowrap;
  outline: none;
}

.action-btn-natural:hover {
  color: var(--color-primary);
}

.action-btn-natural:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn-natural.loading {
  position: relative;
  color: transparent;
}

.action-btn-natural.loading::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  margin-top: -6px;
  border: 2px solid var(--color-text-tertiary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.action-icon {
  font-size: 13px;
  line-height: 1;
}

.action-text {
  font-weight: 500;
}

.action-btn-danger {
  color: var(--color-text-secondary);
}

.action-btn-danger:hover {
  color: var(--color-danger);
}

@media (max-width: 768px) {
  .user-bubble {
    max-width: 85%;
  }

  .reply-content h1 { font-size: 1.3em; }
  .reply-content h2 { font-size: 1.15em; }
  .reply-content h3 { font-size: 1.05em; }
}

@media (max-width: 640px) {
  .user-bubble {
    max-width: 90%;
    padding: 8px 12px;
    font-size: 14px;
  }

  .ai-reply {
    padding: 6px 0;
    font-size: 15px;
  }

  .reply-content h1 { font-size: 1.2em; }
  .reply-content h2 { font-size: 1.1em; }
  .reply-content h3 { font-size: 1em; }

  .message-actions-natural {
    gap: 4px;
  }

  .action-btn-natural {
    font-size: 11px;
  }

  .action-icon {
    font-size: 12px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* ============ Dark Theme Glassmorphism ============ */
.dark-theme .user-bubble {
  background: rgba(123, 167, 226, 0.15);
  border: 1px solid rgba(123, 167, 226, 0.25);
}

.dark-theme .user-bubble:hover {
  /* 无悬停效果 */
}

.dark-theme .ai-reply {
  /* 无气泡框效果，继承文字颜色 */
}

.dark-theme .ai-reply:hover {
  /* 无气泡框效果 */
}

</style>
