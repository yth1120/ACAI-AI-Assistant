/**
 * Ollama 本地 AI 提供商
 */

import { AxiosBaseAIProvider, type Message, type SettingsStore, type APIConfig } from './axiosBaseProvider'
import { preprocessMessages } from '../utils/messageProcessor'
import { handleAxiosStreamResponse } from '../utils/axiosStreamHandler'
import { sanitizeContent } from '../utils/responseParser'
import { handleNetworkError } from '../utils/errorHandler'

export class OllamaProvider extends AxiosBaseAIProvider {
  constructor() {
    super()
  }

  /**
   * 发送消息到 AI
   */
  async sendMessage(
    messages: Message[],
    settingsStore: SettingsStore,
    onChunk: ((chunk: string) => void) | null = null
  ): Promise<string> {
    const config = settingsStore.currentConfig
    const streamMode = typeof onChunk === 'function'

    const processedMessages = this.preprocessMessages(messages, settingsStore)
    const requestBody = this.buildRequestBody(settingsStore, processedMessages, streamMode)
    const headers = this.buildHeaders(settingsStore)
    const url = this.buildRequestUrl(config, settingsStore)

    try {
      if (onChunk) {
        return await this.sendStreamRequest(url, requestBody, headers, onChunk)
      } else {
        const data = await this.sendHttpRequest(url, requestBody, headers)
        return this.extractContent(data as Record<string, unknown>)
      }
    } catch (error) {
      throw handleNetworkError(error as Error, 'ollama')
    }
  }

  /**
   * 处理流式响应
   */
  async processStreamResponse(response: unknown, onChunk: (chunk: string) => void): Promise<string> {
    return await handleAxiosStreamResponse(response as Record<string, unknown>, onChunk, 'ollama')
  }

  /**
   * 构建 API 请求体
   */
  buildRequestBody(
    settingsStore: SettingsStore,
    messages: Message[],
    streamMode: boolean
  ): Record<string, unknown> {
    return {
      model: settingsStore.model,
      messages: messages,
      options: {
        temperature: settingsStore.temperature,
        num_predict: settingsStore.maxTokens
      },
      stream: streamMode
    }
  }

  /**
   * 构建 API 请求头
   */
  buildHeaders(_settingsStore: SettingsStore): Record<string, string> {
    return {
      'Content-Type': 'application/json'
    }
  }

  /**
   * 构建 API 请求 URL
   */
  buildRequestUrl(config: APIConfig, _settingsStore: SettingsStore): string {
    return config.baseUrl
  }

  /**
   * 从响应数据中提取内容
   */
  extractContent(data: Record<string, unknown>): string {
    if (!data) return ''
    const message = data.message as { content?: string } | undefined
    return sanitizeContent(message?.content || '')
  }

  /**
   * 从流式数据中提取内容
   */
  extractStreamContent(data: Record<string, unknown>): string {
    if (!data) return ''
    const message = data.message as { content?: string } | undefined
    return sanitizeContent(message?.content || (data.response as string) || '')
  }

  /**
   * 预处理消息
   */
  preprocessMessages(messages: Message[], settingsStore: SettingsStore): Message[] {
    return preprocessMessages(messages, settingsStore)
  }
}

export default OllamaProvider
