/**
 * 前端聊天服务
 * 封装与后端 Electron API 的通信
 */

// 消息接口
export interface Message {
  role: string
  content: string
  timestamp?: string
}

// 会话接口
export interface Session {
  id: string
  title: string
  messages: Message[]
  timestamp: string
}

// 文件上传结果
export interface FileUploadResult {
  success: boolean
  fileName: string
  fileType: string
  fileSize: number
  content: string
  timestamp: string
  error?: string
}

// 搜索结果
export interface SearchResult {
  title: string
  url: string
  snippet: string
}

// 深度思考步骤
export interface ThinkingStep {
  step: number
  totalSteps: number
  description: string
  progress: number
}

// 搜索状态
export interface SearchStatus {
  status: string
  message: string
  results?: SearchResult[]
}

// 导出结果
export interface ExportResult {
  success: boolean
  content?: string
  format?: string
  timestamp?: string
  error?: string
}

// 系统状态
export interface SystemStatus {
  apiProvider: string
  apiConfigured: boolean
  deepThinkingEnabled: boolean
  webSearchEnabled: boolean
  totalSessions: number
  lastActive: string
  version: string
}

// API 验证结果
export interface ApiValidationResult {
  valid: boolean
  provider: string
  message: string
}

// Electron API 类型
interface ElectronAPI {
  chat: {
    sendMessage(messages: Message[], options?: unknown): Promise<Message>
    sendMessageStream(messages: Message[], options?: unknown): Promise<Message>
    uploadFile(file: File): Promise<FileUploadResult>
    getHistory(): Promise<Session[]>
    saveSession(sessionData: unknown): Promise<unknown>
    deleteSession(sessionId: string): Promise<unknown>
    clearHistory(): Promise<unknown>
    exportConversation(messages: Message[], format: string): Promise<ExportResult>
    deepThinking(prompt: string): Promise<Message>
    webSearch(query: string): Promise<{ searchResults: SearchResult[]; aiResponse: Message }>
    validateApiConfig(): Promise<ApiValidationResult>
    getSystemStatus(): Promise<SystemStatus>
  }
}

// 消息选项
export interface MessageOptions {
  onChunk?: (chunk: string) => void
  [key: string]: unknown
}

class ChatService {
  private electronAPI: ElectronAPI | null
  private isElectron: boolean

  constructor() {
    this.electronAPI = (window as Window & { electronAPI?: ElectronAPI }).electronAPI || null
    this.isElectron = !!this.electronAPI
  }

  /**
   * 检查是否在 Electron 环境中
   */
  checkEnvironment(): boolean {
    if (!this.isElectron) {
      console.warn('不在 Electron 环境中，使用模拟 API')
      return false
    }
    return true
  }

  /**
   * 发送消息
   */
  async sendMessage(messages: Message[], options: MessageOptions = {}): Promise<Message> {
    if (!this.checkEnvironment()) {
      // 模拟响应
      return this.mockSendMessage(messages, options)
    }

    try {
      return await this.electronAPI!.chat.sendMessage(messages, options)
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }

  /**
   * 流式发送消息
   */
  async sendMessageStream(messages: Message[], options: MessageOptions = {}): Promise<Message> {
    if (!this.checkEnvironment()) {
      // 模拟流式响应
      return this.mockSendMessageStream(messages, options)
    }

    try {
      const { onChunk, ...restOptions } = options
      return await this.electronAPI!.chat.sendMessageStream(messages, onChunk)
    } catch (error) {
      console.error('流式发送消息失败:', error)
      throw error
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(file: File): Promise<FileUploadResult> {
    if (!this.checkEnvironment()) {
      // 模拟文件上传
      return this.mockUploadFile(file)
    }

    try {
      return await this.electronAPI!.chat.uploadFile(file)
    } catch (error) {
      console.error('上传文件失败:', error)
      throw error
    }
  }

  /**
   * 获取会话历史
   */
  async getHistory(): Promise<Session[]> {
    if (!this.checkEnvironment()) {
      // 模拟历史数据
      return this.mockGetHistory()
    }

    try {
      return await this.electronAPI!.chat.getHistory()
    } catch (error) {
      console.error('获取会话历史失败:', error)
      return []
    }
  }

  /**
   * 保存会话
   */
  async saveSession(sessionData: Session): Promise<unknown> {
    if (!this.checkEnvironment()) {
      // 模拟保存
      return this.mockSaveSession(sessionData)
    }

    try {
      return await this.electronAPI!.chat.saveSession(sessionData)
    } catch (error) {
      console.error('保存会话失败:', error)
      throw error
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<unknown> {
    if (!this.checkEnvironment()) {
      // 模拟删除
      return this.mockDeleteSession(sessionId)
    }

    try {
      return await this.electronAPI!.chat.deleteSession(sessionId)
    } catch (error) {
      console.error('删除会话失败:', error)
      throw error
    }
  }

  /**
   * 清空历史
   */
  async clearHistory(): Promise<unknown> {
    if (!this.checkEnvironment()) {
      // 模拟清空
      return this.mockClearHistory()
    }

    try {
      return await this.electronAPI!.chat.clearHistory()
    } catch (error) {
      console.error('清空历史失败:', error)
      throw error
    }
  }

  /**
   * 导出对话
   * @param messages - 消息列表
   * @param format - 导出格式（txt, markdown, json）
   */
  async exportConversation(messages: Message[], format: string = 'txt'): Promise<ExportResult> {
    if (!this.checkEnvironment()) {
      // 模拟导出
      return this.mockExportConversation(messages, format)
    }

    try {
      return await this.electronAPI!.chat.exportConversation(messages, format)
    } catch (error) {
      console.error('导出对话失败:', error)
      throw error
    }
  }

  /**
   * 深度思考
   */
  async deepThinking(prompt: string): Promise<Message> {
    if (!this.checkEnvironment()) {
      // 模拟深度思考
      return this.mockDeepThinking(prompt)
    }

    try {
      return await this.electronAPI!.chat.deepThinking(prompt)
    } catch (error) {
      console.error('深度思考失败:', error)
      throw error
    }
  }

  /**
   * 联网搜索
   */
  async webSearch(query: string): Promise<{ searchResults: SearchResult[]; aiResponse: Message }> {
    if (!this.checkEnvironment()) {
      // 模拟联网搜索
      return this.mockWebSearch(query)
    }

    try {
      return await this.electronAPI!.chat.webSearch(query)
    } catch (error) {
      console.error('联网搜索失败:', error)
      throw error
    }
  }

  /**
   * 验证 API 配置
   */
  async validateApiConfig(): Promise<ApiValidationResult> {
    if (!this.checkEnvironment()) {
      // 模拟验证
      return this.mockValidateApiConfig()
    }

    try {
      return await this.electronAPI!.chat.validateApiConfig()
    } catch (error) {
      console.error('验证 API 配置失败:', error)
      throw error
    }
  }

  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<SystemStatus> {
    if (!this.checkEnvironment()) {
      // 模拟系统状态
      return this.mockGetSystemStatus()
    }

    try {
      return await this.electronAPI!.chat.getSystemStatus()
    } catch (error) {
      console.error('获取系统状态失败:', error)
      return {} as SystemStatus
    }
  }

  // 模拟 API 方法
  mockSendMessage(messages: Message[], _options: MessageOptions): Promise<Message> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const lastMessage = messages[messages.length - 1]
        resolve({
          role: 'assistant',
          content: `这是对"${lastMessage.content}"的模拟回复。`,
          timestamp: new Date().toISOString()
        })
      }, 1000)
    })
  }

  mockSendMessageStream(messages: Message[], options: MessageOptions): Promise<Message> {
    return new Promise((resolve) => {
      const lastMessage = messages[messages.length - 1]
      const response = `这是对"${lastMessage.content}"的模拟流式回复。`
      const chars = response.split('') // 将响应拆分为单个字符

      let index = 0
      const interval = setInterval(() => {
        if (options.onChunk) {
          // 只发送当前字符，而不是完整前缀
          options.onChunk(chars[index])
        }
        index++

        if (index >= chars.length) {
          clearInterval(interval)
          resolve({
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString()
          })
        }
      }, 50)
    })
  }

  mockUploadFile(file: File): Promise<FileUploadResult> {
    return Promise.resolve({
      success: true,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      content: `模拟上传的文件：${file.name}`,
      timestamp: new Date().toISOString()
    })
  }

  mockGetHistory(): Promise<Session[]> {
    return Promise.resolve([
      {
        id: '1',
        title: 'Python 代码优化',
        messages: [
          { role: 'user', content: '请优化这段 Python 代码' },
          { role: 'assistant', content: '优化后的代码...' }
        ],
        timestamp: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        title: '数据分析报告',
        messages: [
          { role: 'user', content: '帮我分析这份数据' },
          { role: 'assistant', content: '数据分析结果...' }
        ],
        timestamp: '2024-01-14T15:45:00Z'
      }
    ])
  }

  mockSaveSession(_sessionData: Session): Promise<unknown> {
    return Promise.resolve({
      success: true,
      sessionId: Date.now().toString(),
      timestamp: new Date().toISOString()
    })
  }

  mockDeleteSession(sessionId: string): Promise<unknown> {
    return Promise.resolve({
      success: true,
      sessionId,
      timestamp: new Date().toISOString()
    })
  }

  mockClearHistory(): Promise<unknown> {
    return Promise.resolve({
      success: true,
      timestamp: new Date().toISOString()
    })
  }

  mockExportConversation(messages: Message[], format: string): Promise<ExportResult> {
    let content = ''
    if (format === 'markdown') {
      content = messages.map(msg => `### ${msg.role}\n\n${msg.content}\n`).join('\n')
    } else if (format === 'json') {
      content = JSON.stringify(messages, null, 2)
    } else {
      content = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
    }

    return Promise.resolve({
      success: true,
      content,
      format,
      timestamp: new Date().toISOString()
    })
  }

  mockDeepThinking(prompt: string): Promise<Message> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          role: 'assistant',
          content: `经过深度思考，我对"${prompt}"的回答是：这是一个需要深入分析的问题。`,
          thinkingSteps: [
            '分析问题核心',
            '收集相关信息',
            '构建解决方案',
            '评估各种可能性',
            '形成最终回答'
          ],
          timestamp: new Date().toISOString()
        })
      }, 3000)
    })
  }

  mockWebSearch(query: string): Promise<{ searchResults: SearchResult[]; aiResponse: Message }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          searchResults: [
            {
              title: '相关搜索结果 1',
              url: 'https://example.com/result1',
              snippet: '这是搜索结果 1 的摘要...'
            },
            {
              title: '相关搜索结果 2',
              url: 'https://example.com/result2',
              snippet: '这是搜索结果 2 的摘要...'
            }
          ],
          aiResponse: {
            role: 'assistant',
            content: `基于搜索结果，我对"${query}"的回答是：搜索结果提供了相关信息。`,
            timestamp: new Date().toISOString()
          }
        })
      }, 2000)
    })
  }

  mockValidateApiConfig(): Promise<ApiValidationResult> {
    return Promise.resolve({
      valid: true,
      provider: 'deepseek',
      message: 'API 配置有效'
    })
  }

  mockGetSystemStatus(): Promise<SystemStatus> {
    return Promise.resolve({
      apiProvider: 'deepseek',
      apiConfigured: true,
      deepThinkingEnabled: false,
      webSearchEnabled: false,
      totalSessions: 2,
      lastActive: new Date().toISOString(),
      version: '1.0.0'
    })
  }
}

// 创建单例实例
const chatService = new ChatService()

export default chatService
