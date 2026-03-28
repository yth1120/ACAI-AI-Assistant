/**
 * 主 AI 服务类
 * 重构后的 AI 服务，使用模块化设计
 */

import { useSettingsStore } from '@/stores/settings'
import { validateRequest } from './utils/validation'
import { createAIProvider } from './aiServiceFactory'
import { withRetry } from './utils/errorHandler'

// 消息接口
export interface Message {
  role: string
  content: string
}

// 设置 Store 类型
export interface SettingsStore {
  apiProvider: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  deepThinking: boolean
  webSearch: boolean
  currentConfig: APIConfig
}

// API 配置接口
export interface APIConfig {
  baseUrl: string
  [key: string]: unknown
}

// AI 提供商基类接口
export interface BaseAIProvider {
  sendMessage(
    messages: Message[],
    settingsStore: SettingsStore,
    onChunk?: ((chunk: string) => void) | null
  ): Promise<string>
  cancelRequest(): void
  preprocessMessages?(messages: Message[], settingsStore: SettingsStore): Message[]
}

// 连接测试结果
export interface ConnectionTestResult {
  success: boolean
  message: string
}

/**
 * AI 服务类
 */
export class AIService {
  private currentProvider: BaseAIProvider | null = null
  private abortController: AbortController | null = null

  /**
   * 获取当前 AI 提供商实例
   * @param provider - 提供商标识
   * @returns AI 提供商实例
   */
  getProvider(provider: string): BaseAIProvider {
    if (!this.currentProvider || this.currentProvider.constructor.name !== provider + 'Provider') {
      this.currentProvider = createAIProvider(provider)
    }
    return this.currentProvider
  }

  /**
   * 发送消息到 AI
   * @param messages - 消息历史
   * @param onChunk - 流式响应回调函数
   * @returns AI 响应内容
   * @throws API 错误
   */
  async sendMessage(
    messages: Message[],
    onChunk: ((chunk: string, chunkCount?: number) => void) | null = null
  ): Promise<string> {
    const settingsStore = useSettingsStore()

    // 验证参数
    validateRequest(settingsStore, messages)

    // 获取当前提供商
    const provider = this.getProvider(settingsStore.apiProvider)

    // 取消之前的请求
    this.cancelRequest()

    // 创建新的 AbortController
    this.abortController = new AbortController()

    // 使用重试机制
    return await withRetry(async () => {
      return await provider.sendMessage(messages, settingsStore, onChunk)
    })
  }

  /**
   * 取消当前请求
   */
  cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    if (this.currentProvider) {
      this.currentProvider.cancelRequest()
    }
  }

  /**
   * 测试 API 连接
   * @returns 测试结果
   */
  async testConnection(): Promise<ConnectionTestResult> {
    const settingsStore = useSettingsStore()

    try {
      console.log('🔌 开始测试连接...')

      // 临时禁用深度思考和联网搜索以加快测试
      const originalDeepThinking = settingsStore.deepThinking
      const originalWebSearch = settingsStore.webSearch
      settingsStore.deepThinking = false
      settingsStore.webSearch = false

      // 使用简单的测试消息，设置超时
      const testMessages: Message[] = [{ role: 'user', content: 'Hi' }]

      // 创建一个带超时的 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('连接超时（15 秒）')), 15000)
      })

      // 竞速：哪个先完成就用哪个
      await Promise.race([this.sendMessage(testMessages), timeoutPromise])

      // 恢复原始设置
      settingsStore.deepThinking = originalDeepThinking
      settingsStore.webSearch = originalWebSearch

      console.log('✅ 连接测试成功')
      return { success: true, message: '连接成功！API Key 有效。' }
    } catch (error) {
      console.error('❌ 连接测试失败:', error)
      return {
        success: false,
        message: (error as Error).message || '连接失败，请检查 API Key 和网络连接'
      }
    }
  }

  /**
   * 获取所有支持的提供商
   * @returns 提供商列表
   */
  getSupportedProviders(): string[] {
    return [
      'deepseek',
      'openai',
      'claude',
      'qwen',
      'kimi',
      'siliconflow',
      'zhipu',
      'gemini',
      'ollama',
      'tencent'
    ]
  }
}

// 创建单例实例
export const aiService = new AIService()
