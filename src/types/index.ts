/**
 * 项目类型定义
 */

// AI消息类型
export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
  id?: string
}

// AI提供商配置
export interface AIProviderConfig {
  name: string
  baseUrl: string
  models: Record<string, string>
  headers: (apiKey: string) => Record<string, string>
  defaultModel: string
  supportsStreaming: boolean
}

// 设置存储类型
export interface SettingsState {
  apiProvider: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  deepThinking: boolean
  webSearch: boolean
  theme: 'light' | 'dark' | 'auto'
  sidebarCollapsed: boolean
  apiStatus: 'disconnected' | 'connected' | 'testing'
}

// 聊天存储类型
export interface ChatState {
  messages: AIMessage[]
  currentConversationId: string | null
  conversations: Record<string, AIMessage[]>
  isProcessing: boolean
  error: string | null
}

// Axios请求配置
export interface AxiosRequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  headers?: Record<string, string>
  timeout?: number
  responseType?: 'json' | 'stream' | 'arraybuffer' | 'blob' | 'document' | 'text'
}

// 流式响应处理器类型
export interface StreamHandler {
  (response: any, onChunk: (chunk: string) => void, provider: string): Promise<string>
}

// AI提供商接口
export interface AIProvider {
  sendMessage(messages: AIMessage[], settingsStore: any, onChunk?: (chunk: string) => void): Promise<string>
  cancelRequest(): void
  preprocessMessages(messages: AIMessage[], settingsStore: any): AIMessage[]
}

// 快捷键配置
export interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
}

// 存储配置
export interface StorageConfig {
  key: string
  defaultValue: any
  options?: {
    version?: string
    debounceMs?: number
    maxSize?: number
    onError?: (error: Error, type: 'read' | 'write' | 'size' | 'import') => void
  }
}

// 通知类型
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
  timestamp: number
}

// 导出格式
export type ExportFormat = 'json' | 'markdown' | 'html' | 'txt'

// 性能监控数据
export interface PerformanceMetrics {
  pageLoadTime: number
  apiResponseTime: number
  memoryUsage: number
  componentRenderCount: number
  longTasks: Array<{
    name: string
    duration: number
    startTime: number
  }>
}

// 组件Props类型
export interface BaseButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost' | 'link'
  size?: 'small' | 'medium' | 'large'
  block?: boolean
  loading?: boolean
  disabled?: boolean
  icon?: string
}

// 路由元信息
export interface RouteMeta {
  title: string
  icon?: string
  requiresAuth?: boolean
  keepAlive?: boolean
}

// API响应类型
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: number
}

// 流式响应数据块
export interface StreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      content?: string
      role?: string
    }
    finish_reason: string | null
  }>
}