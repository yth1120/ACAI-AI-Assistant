/**
 * AI 提供商基类
 */

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
  [key: string]: unknown
}

// API 配置接口
export interface APIConfig {
  baseUrl: string
  [key: string]: unknown
}

/**
 * AI 提供商基类
 */
export abstract class BaseAIProvider {
  protected abortController: AbortController | null = null

  constructor() {
    this.abortController = null
  }

  /**
   * 发送消息到 AI
   * @param messages - 消息历史
   * @param settingsStore - 设置 store
   * @param onChunk - 流式响应回调函数
   * @returns AI 响应内容
   * @throws API 错误
   */
  abstract sendMessage(
    messages: Message[],
    settingsStore: SettingsStore,
    onChunk?: ((chunk: string) => void) | null
  ): Promise<string>

  /**
   * 构建 API 请求体
   * @param settingsStore - 设置 store
   * @param messages - 消息数组
   * @param streamMode - 是否流式输出
   * @returns 请求体对象
   */
  abstract buildRequestBody(
    settingsStore: SettingsStore,
    messages: Message[],
    streamMode: boolean
  ): Record<string, unknown>

  /**
   * 构建 API 请求头
   * @param settingsStore - 设置 store
   * @returns 请求头对象
   */
  abstract buildHeaders(settingsStore: SettingsStore): Record<string, string>

  /**
   * 构建 API 请求 URL
   * @param config - API 配置
   * @param settingsStore - 设置 store
   * @returns 请求 URL
   */
  abstract buildRequestUrl(config: APIConfig, settingsStore: SettingsStore): string

  /**
   * 从响应数据中提取内容
   * @param data - API 响应数据
   * @returns 提取的内容
   */
  abstract extractContent(data: Record<string, unknown>): string

  /**
   * 从流式数据中提取内容
   * @param data - 流式数据块
   * @returns 提取的内容
   */
  abstract extractStreamContent(data: Record<string, unknown>): string

  /**
   * 取消当前请求
   */
  cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * 预处理消息
   * @param messages - 原始消息数组
   * @param settingsStore - 设置 store
   * @returns 处理后的消息数组
   */
  preprocessMessages(messages: Message[], _settingsStore: SettingsStore): Message[] {
    return messages
  }
}

export default BaseAIProvider
