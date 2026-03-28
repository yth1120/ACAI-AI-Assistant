/**
 * 基于 axios 的 AI 提供商基类
 */

import axios from 'axios'
import axiosInstance from '@/utils/axiosConfig'
import { createCancelableRequest } from '@/utils/axiosConfig'

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

// Axios 响应类型
export interface AxiosResponse {
  data: unknown
  status: number
  statusText: string
  headers: Record<string, string>
}

// 取消令牌源
export interface CancelTokenSource {
  token: unknown
  cancel: (reason?: string) => void
}

/**
 * 基于 axios 的 AI 提供商基类
 */
export abstract class AxiosBaseAIProvider {
  protected cancelSource: CancelTokenSource | null = null

  constructor() {
    this.cancelSource = null
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
   * 处理流式响应
   * @param response - axios 响应对象
   * @param onChunk - 数据块回调
   * @returns 完整响应内容
   */
  abstract processStreamResponse(
    response: AxiosResponse,
    onChunk: (chunk: string) => void
  ): Promise<string>

  /**
   * 发送普通 HTTP 请求（非流式）
   * @param url - 请求 URL
   * @param data - 请求数据
   * @param headers - 请求头
   * @returns 响应数据
   */
  async sendHttpRequest(
    url: string,
    data: Record<string, unknown>,
    headers: Record<string, string>
  ): Promise<Record<string, unknown>> {
    const { request, cancel } = createCancelableRequest(url, {
      method: 'POST',
      data,
      headers
    })

    this.cancelSource = cancel

    try {
      const response = await request
      return response.data as Record<string, unknown>
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('请求已被取消')
        throw new Error('请求已取消')
      }
      throw error
    } finally {
      this.cancelSource = null
    }
  }

  /**
   * 发送流式 HTTP 请求（浏览器使用 Fetch API 实现真正流式）
   * @param url - 请求 URL
   * @param data - 请求数据
   * @param headers - 请求头
   * @param onChunk - 数据块回调
   * @returns 完整响应内容
   */
  async sendStreamRequest(
    url: string,
    data: Record<string, unknown>,
    headers: Record<string, string>,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    // 浏览器环境使用 Fetch API 实现真正流式
    if (typeof window !== 'undefined') {
      return this.sendFetchRequest(url, data, headers, onChunk)
    }

    // Node.js 环境使用 axios
    const { request, cancel } = createCancelableRequest(url, {
      method: 'POST',
      data,
      headers,
      responseType: 'stream'
    })

    this.cancelSource = cancel

    try {
      const response = await request
      return await this.processStreamResponse(response, onChunk)
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('流式请求已被取消')
        throw new Error('请求已取消')
      }
      throw error
    } finally {
      this.cancelSource = null
    }
  }

  /**
   * 使用 Fetch API 发送流式请求（浏览器环境）
   */
  private async sendFetchRequest(
    url: string,
    data: Record<string, unknown>,
    headers: Record<string, string>,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const { createParser } = await import('eventsource-parser')
    const { extractStreamContent } = await import('../utils/responseParser')

    let fullContent = ''
    let aborted = false

    this.cancelSource = {
      token: null,
      cancel: () => { aborted = true }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      const parser = createParser((event) => {
        if (event.type === 'event') {
          const eventData = event.data
          if (eventData === '[DONE]') return

          try {
            const parsed = JSON.parse(eventData) as Record<string, unknown>
            const content = extractStreamContent(parsed, 'openai-compatible')
            if (content) {
              fullContent += content
              onChunk(content)
            }
          } catch {
            // 忽略解析错误
          }
        }
      })

      while (true) {
        if (aborted) {
          reader.cancel()
          throw new Error('请求已取消')
        }

        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        parser.feed(text)
      }

      return fullContent
    } finally {
      this.cancelSource = null
    }
  }

  /**
   * 取消当前请求
   */
  cancelRequest(): void {
    if (this.cancelSource) {
      this.cancelSource.cancel('用户取消请求')
      this.cancelSource = null
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

export default AxiosBaseAIProvider
