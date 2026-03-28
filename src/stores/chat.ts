import { defineStore } from 'pinia'
import { ref, watch, Ref, computed, ComputedRef } from 'vue'
import { STORAGE_KEYS, EXPORT_FORMATS, STORAGE_VERSION, type ExportFormat, type MessageRole } from '@/constants'
import {
  exportChatAsJSON,
  exportChatAsMarkdown,
  exportChatAsText,
  exportChatAsHTML,
  exportAllChatHistory,
  importChatHistory
} from '@/utils/export'

/** 聊天历史文件名 */
const CHAT_HISTORY_FILE = 'chat-history.json'

/** 文件保存防抖计时器 */
let fileSaveTimer: ReturnType<typeof setTimeout> | null = null

/** 文件路径缓存 */
let cachedFilePath: string | null = null

/**
 * 聊天功能类型
 */
export type ChatFunctionType = 'normal' | 'deep-thinking' | 'web-search'

/**
 * 消息接口
 */
export interface Message {
  id: number
  role: MessageRole
  content: string
  timestamp: string
  edited?: boolean
  editTimestamp?: string
  recalled?: boolean
  recallTimestamp?: string
  isThinking?: boolean
  thinkingContent?: string
  thinkingDuration?: number
  thinkingCollapsed?: boolean
  searchStatus?: string
  searchSources?: Array<{ title: string; url: string }>
  isSearching?: boolean
  isGenerating?: boolean
  displayContent?: string
  [key: string]: unknown
}

/**
 * 聊天历史接口
 */
export interface ChatHistory {
  id: number
  title?: string
  timestamp: string
  messages: Message[]
  [key: string]: unknown
}

/**
 * 聊天设置接口
 */
export interface ChatSettings {
  maxHistorySize: number
  autoSave: boolean
  compression: boolean
}

/**
 * 聊天存储数据结构
 */
export interface ChatStorageData {
  version: string
  chats: ChatHistory[]
  settings: ChatSettings
  timestamp?: number
}

/**
 * 存储信息接口
 */
export interface StorageInfo {
  size: number
  count: number
  lastUpdated?: number
  usagePercent?: number
  [key: string]: unknown
}

/**
 * 压缩结果接口
 */
export interface CompressionResult {
  originalCount: number
  compressedCount: number
  removed: number
}

export interface CompressionError {
  error: string
}

/**
 * Chat Store 接口
 */
export interface ChatStore {
  // State
  messages: Ref<Message[]>
  chatHistory: Ref<ChatHistory[]>
  isProcessing: Ref<boolean>
  currentFunction: Ref<ChatFunctionType>
  storageInfo: Ref<StorageInfo>
  // Computed
  hasMessages: ComputedRef<boolean>
  messageCount: ComputedRef<number>
  // Actions - 消息管理
  addMessage: (message: { role: MessageRole; content: string }) => Message
  updateMessage: (id: number, newContent: string) => boolean
  deleteMessage: (id: number) => boolean
  recallMessage: (id: number) => boolean
  clearMessages: () => void
  setProcessing: (status: boolean) => void
  setCurrentFunction: (func: ChatFunctionType) => void
  // Actions - 历史管理
  loadChatHistory: () => Promise<void>
  saveChatHistory: () => void
  addToHistory: (conversation: Partial<ChatHistory>) => ChatHistory
  deleteChat: (chatId: number) => boolean
  clearAllHistory: () => Promise<boolean>
  // Actions - 导出导入
  exportCurrentChat: (format?: ExportFormat) => void
  exportAllChats: (format?: ExportFormat) => void
  importChats: (file: File) => Promise<boolean>
  // Actions - 存储管理
  getStorageInfo: () => StorageInfo
  exportStorageData: () => unknown
  importStorageData: (data: unknown) => unknown
  clearStorage: () => Promise<boolean>
  updateStorageSettings: (settings: Partial<ChatSettings>) => ChatSettings
  compressHistory: () => CompressionResult | CompressionError
}

/**
 * 默认聊天设置
 */
const DEFAULT_SETTINGS: ChatSettings = {
  maxHistorySize: 100,
  autoSave: true,
  compression: false
}

/**
 * 默认存储数据
 */
const DEFAULT_STORAGE_DATA: ChatStorageData = {
  version: '2.0.0',
  chats: [],
  settings: DEFAULT_SETTINGS
}

export const useChatStore = defineStore('chat', () => {
  // ============ State ============
  const messages = ref<Message[]>([])
  const chatHistory = ref<ChatHistory[]>([])
  const isProcessing = ref<boolean>(false)
  const currentFunction = ref<ChatFunctionType>('normal')
  const storageInfo = ref<StorageInfo>({ size: 0, count: 0 })

  // ============ Computed ============
  const hasMessages = computed(() => messages.value.length > 0)
  const messageCount = computed(() => messages.value.length)

  // ============ 文件持久化辅助 ============

  /**
   * 获取聊天历史文件的绝对路径
   */
  async function getHistoryFilePath(): Promise<string> {
    if (cachedFilePath) return cachedFilePath

    try {
      const userDataPath = await window.electronAPI.app.getPath('userData')
      cachedFilePath = userDataPath + '/' + CHAT_HISTORY_FILE
    } catch {
      cachedFilePath = CHAT_HISTORY_FILE
    }
    return cachedFilePath
  }

  /**
   * 从文件加载聊天历史
   */
  async function loadFromFile(): Promise<ChatStorageData | null> {
    try {
      if (!window.electronAPI?.file?.read) return null

      const filePath = await getHistoryFilePath()
      const content = await window.electronAPI.file.read(filePath)
      if (!content) return null

      const data = JSON.parse(content) as ChatStorageData
      if (data.chats && Array.isArray(data.chats)) {
        return data
      }
    } catch {
      // 文件不存在或格式错误，返回 null
    }
    return null
  }

  /**
   * 将聊天历史保存到文件（防抖）
   */
  function scheduleFileSave(): void {
    if (fileSaveTimer) clearTimeout(fileSaveTimer)
    fileSaveTimer = setTimeout(async () => {
      await saveToFile()
    }, 2000)
  }

  /**
   * 立即将聊天历史保存到文件
   */
  async function saveToFile(): Promise<void> {
    try {
      if (!window.electronAPI?.file?.write) return

      const filePath = await getHistoryFilePath()
      const data: ChatStorageData = {
        version: STORAGE_VERSION,
        chats: chatHistory.value,
        settings: DEFAULT_SETTINGS,
        timestamp: Date.now()
      }
      await window.electronAPI.file.write(filePath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('文件保存失败:', error)
    }
  }

  // ============ Actions - 消息管理 ============

  /**
   * 添加消息
   */
  function addMessage(message: { role: MessageRole; content: string }): Message {
    const newMessage: Message = {
      id: Date.now(),
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString()
    }
    messages.value.push(newMessage)
    return newMessage
  }

  /**
   * 更新消息
   */
  function updateMessage(id: number, newContent: string): boolean {
    const msg = messages.value.find(m => m.id === id)
    if (!msg) return false

    msg.content = newContent
    msg.edited = true
    msg.editTimestamp = new Date().toISOString()

    updateMessageInHistory(id, newContent)
    return true
  }

  /**
   * 删除消息
   */
  function deleteMessage(id: number): boolean {
    const index = messages.value.findIndex(m => m.id === id)
    if (index === -1) return false

    messages.value.splice(index, 1)
    deleteMessageFromHistory(id)
    return true
  }

  /**
   * 撤回消息
   */
  function recallMessage(id: number): boolean {
    const msg = messages.value.find(m => m.id === id)
    if (!msg) return false

    msg.recalled = true
    msg.recallTimestamp = new Date().toISOString()

    recallMessageInHistory(id)
    return true
  }

  /**
   * 清空消息
   */
  function clearMessages(): void {
    messages.value = []
  }

  /**
   * 设置处理状态
   */
  function setProcessing(status: boolean): void {
    isProcessing.value = status
  }

  /**
   * 设置当前功能
   */
  function setCurrentFunction(func: ChatFunctionType): void {
    currentFunction.value = func
  }

  // ============ Actions - 历史管理 ============

  /**
   * 加载聊天历史（优先从文件，回退到 localStorage）
   */
  async function loadChatHistory(): Promise<void> {
    try {
      // 优先从文件加载
      const fileData = await loadFromFile()
      if (fileData && fileData.chats.length > 0) {
        chatHistory.value = fileData.chats
        // 同步写入 localStorage 作为缓存
        localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(fileData))
        updateStorageInfo()
        return
      }

      // 回退到 localStorage
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY)
      if (saved) {
        const data = JSON.parse(saved) as ChatStorageData
        chatHistory.value = data.chats || []
      }
      updateStorageInfo()
    } catch (error) {
      console.error('加载聊天历史失败:', error)
      chatHistory.value = []
    }
  }

  /**
   * 保存聊天历史（localStorage + 文件）
   */
  function saveChatHistory(): void {
    try {
      const data: ChatStorageData = {
        version: STORAGE_VERSION,
        chats: chatHistory.value,
        settings: DEFAULT_SETTINGS,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(data))
      updateStorageInfo()

      // 防抖写入文件
      scheduleFileSave()
    } catch (error) {
      console.error('保存聊天历史失败:', error)
    }
  }

  /**
   * 开始新对话（保存当前对话并清空消息）
   */
  function startNewChat(): void {
    clearMessages()
  }

  /**
   * 添加到历史
   */
  function addToHistory(conversation: Partial<ChatHistory>): ChatHistory {
    const newChat: ChatHistory = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      messages: [...messages.value],
      title: conversation.title || `对话 ${new Date().toLocaleDateString()}`
    }

    chatHistory.value.unshift(newChat)

    // 限制历史记录大小
    const maxSize = DEFAULT_SETTINGS.maxHistorySize
    if (chatHistory.value.length > maxSize) {
      chatHistory.value = chatHistory.value.slice(0, maxSize)
    }

    saveChatHistory()
    return newChat
  }

  /**
   * 删除聊天
   */
  function deleteChat(chatId: number): boolean {
    const index = chatHistory.value.findIndex(c => c.id === chatId)
    if (index === -1) return false

    chatHistory.value.splice(index, 1)
    saveChatHistory()
    return true
  }

  /**
   * 清空所有历史
   */
  async function clearAllHistory(): Promise<boolean> {
    chatHistory.value = []
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY)

    // 同步删除文件
    try {
      if (window.electronAPI?.file?.delete) {
        const filePath = await getHistoryFilePath()
        await window.electronAPI.file.delete(filePath)
      }
    } catch {
      // 文件不存在忽略
    }

    updateStorageInfo()
    return true
  }

  // ============ Actions - 导出导入 ============

  /**
   * 导出当前聊天
   */
  function exportCurrentChat(format: ExportFormat = 'json'): void {
    if (messages.value.length === 0) {
      throw new Error('当前没有聊天记录')
    }

    const exportFnMap: Record<ExportFormat, typeof exportChatAsJSON> = {
      json: exportChatAsJSON,
      markdown: exportChatAsMarkdown,
      text: exportChatAsText,
      html: exportChatAsHTML
    }

    const exportFn = exportFnMap[format] || exportChatAsJSON
    exportFn(messages.value)
  }

  /**
   * 导出所有聊天
   */
  function exportAllChats(format: ExportFormat = 'json'): void {
    if (chatHistory.value.length === 0) {
      throw new Error('没有聊天历史记录')
    }
    exportAllChatHistory(chatHistory.value, format)
  }

  /**
   * 导入聊天
   */
  async function importChats(file: File): Promise<boolean> {
    try {
      const data = await importChatHistory(file)

      if ('messages' in data && Array.isArray(data.messages)) {
        // 导入单个聊天
        messages.value = data.messages
        addToHistory({ title: '导入的聊天' })
      } else if ('chats' in data && Array.isArray(data.chats)) {
        // 导入多个聊天
        chatHistory.value = [...data.chats, ...chatHistory.value]
        saveChatHistory()
      }

      return true
    } catch (error) {
      console.error('导入聊天失败:', error)
      return false
    }
  }

  // ============ Actions - 存储管理 ============

  /**
   * 更新存储信息
   */
  function updateStorageInfo(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY)
      const size = saved ? saved.length : 0
      storageInfo.value = {
        size,
        count: chatHistory.value.length,
        lastUpdated: Date.now(),
        usagePercent: saved ? (size / (1024 * 1024 * 5)) * 100 : 0 // 假设 5MB 限制
      }
    } catch {
      storageInfo.value = { size: 0, count: 0 }
    }
  }

  /**
   * 获取存储信息
   */
  function getStorageInfo(): StorageInfo {
    updateStorageInfo()
    return storageInfo.value
  }

  /**
   * 导出存储数据
   */
  function exportStorageData(): unknown {
    return {
      version: '2.0.0',
      timestamp: Date.now(),
      chats: chatHistory.value,
      settings: DEFAULT_SETTINGS
    }
  }

  /**
   * 导入存储数据
   */
  function importStorageData(data: unknown): unknown {
    const imported = data as Partial<ChatStorageData>
    if (imported.chats && Array.isArray(imported.chats)) {
      chatHistory.value = imported.chats
      saveChatHistory()
    }
    return data
  }

  /**
   * 清空存储
   */
  async function clearStorage(): Promise<boolean> {
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY)
    chatHistory.value = []
    messages.value = []

    try {
      if (window.electronAPI?.file?.delete) {
        const filePath = await getHistoryFilePath()
        await window.electronAPI.file.delete(filePath)
      }
    } catch {
      // 忽略
    }

    updateStorageInfo()
    return true
  }

  /**
   * 更新存储设置
   */
  function updateStorageSettings(settings: Partial<ChatSettings>): ChatSettings {
    // 当前实现使用默认设置，可以扩展到持久化
    return { ...DEFAULT_SETTINGS, ...settings }
  }

  /**
   * 压缩历史
   */
  function compressHistory(): CompressionResult | CompressionError {
    try {
      const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
      const originalCount = chatHistory.value.length

      chatHistory.value = chatHistory.value.filter(chat => {
        const chatTime = new Date(chat.timestamp).getTime()
        return chatTime > oneMonthAgo
      })

      const compressedCount = chatHistory.value.length
      saveChatHistory()

      return {
        originalCount,
        compressedCount,
        removed: originalCount - compressedCount
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '压缩失败'
      }
    }
  }

  // ============ 内部辅助函数 ============

  /**
   * 更新历史记录中的消息
   */
  function updateMessageInHistory(messageId: number, newContent: string): void {
    if (messages.value.length === 0) return

    const historyIndex = findCurrentChatHistoryIndex()
    if (historyIndex === -1) return

    const historyMsg = chatHistory.value[historyIndex].messages.find(m => m.id === messageId)
    if (historyMsg) {
      historyMsg.content = newContent
      historyMsg.edited = true
      historyMsg.editTimestamp = new Date().toISOString()
      saveChatHistory()
    }
  }

  /**
   * 从历史记录中删除消息
   */
  function deleteMessageFromHistory(messageId: number): void {
    if (messages.value.length === 0) return

    const historyIndex = findCurrentChatHistoryIndex()
    if (historyIndex === -1) return

    const historyMessages = chatHistory.value[historyIndex].messages
    const msgIndex = historyMessages.findIndex(m => m.id === messageId)
    if (msgIndex !== -1) {
      historyMessages.splice(msgIndex, 1)
      saveChatHistory()
    }
  }

  /**
   * 撤回历史记录中的消息
   */
  function recallMessageInHistory(messageId: number): void {
    if (messages.value.length === 0) return

    const historyIndex = findCurrentChatHistoryIndex()
    if (historyIndex === -1) return

    const historyMsg = chatHistory.value[historyIndex].messages.find(m => m.id === messageId)
    if (historyMsg) {
      historyMsg.recalled = true
      historyMsg.recallTimestamp = new Date().toISOString()
      saveChatHistory()
    }
  }

  /**
   * 通过消息 ID 直接查找历史记录索引（避免内容匹配歧义）
   */
  function findHistoryIndexByMessageId(): number {
    return chatHistory.value.findIndex(h => {
      if (!h.messages?.length) return false
      return h.messages.some(msg => messages.value.some(m => m.id === msg.id))
    })
  }

  /**
   * 查找当前聊天在历史中的索引
   */
  function findCurrentChatHistoryIndex(): number {
    if (messages.value.length === 0) return -1

    // 优先通过消息 ID 匹配（更可靠，不会因相同首条消息产生歧义）
    const idMatchIndex = findHistoryIndexByMessageId()
    if (idMatchIndex !== -1) return idMatchIndex

    // 回退：匹配第一个用户消息内容（兼容旧数据）
    return chatHistory.value.findIndex(h => {
      if (!h.messages?.length) return false
      const firstUserMessage = messages.value.find(m => m.role === 'user')
      if (firstUserMessage) {
        const historyFirstUser = h.messages.find(m => m.role === 'user')
        if (historyFirstUser && historyFirstUser.content === firstUserMessage.content) {
          return true
        }
      }
      return false
    })
  }

  // ============ Watchers ============

  /**
   * 监听聊天历史变化自动保存
   */
  watch(
    chatHistory,
    () => {
      if (DEFAULT_SETTINGS.autoSave) {
        saveChatHistory()
      }
    },
    { deep: true }
  )

  return {
    // State
    messages,
    chatHistory,
    isProcessing,
    currentFunction,
    storageInfo,
    // Computed
    hasMessages,
    messageCount,
    // Actions
    addMessage,
    updateMessage,
    deleteMessage,
    recallMessage,
    clearMessages,
    startNewChat,
    setProcessing,
    setCurrentFunction,
    loadChatHistory,
    saveChatHistory,
    addToHistory,
    deleteChat,
    clearAllHistory,
    exportCurrentChat,
    exportAllChats,
    importChats,
    getStorageInfo,
    exportStorageData,
    importStorageData,
    clearStorage,
    updateStorageSettings,
    compressHistory
  }
})
