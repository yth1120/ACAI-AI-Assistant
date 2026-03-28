/**
 * Gemini AI 提供商
 */

import { AxiosBaseAIProvider, type Message, type SettingsStore, type APIConfig } from './axiosBaseProvider'
import { preprocessMessages } from '../utils/messageProcessor'
import { handleAxiosStreamResponse } from '../utils/axiosStreamHandler'
import { handleNetworkError } from '../utils/errorHandler'

export class GeminiProvider extends AxiosBaseAIProvider {
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
    const url = this.buildRequestUrl(config, settingsStore, streamMode)

    try {
      if (onChunk) {
        return await this.sendStreamRequest(url, requestBody, headers, onChunk)
      } else {
        const data = await this.sendHttpRequest(url, requestBody, headers)
        return this.extractContent(data as Record<string, unknown>)
      }
    } catch (error) {
      throw handleNetworkError(error as Error, settingsStore.apiProvider)
    }
  }

  /**
   * 处理流式响应
   */
  async processStreamResponse(response: unknown, onChunk: (chunk: string) => void): Promise<string> {
    return await handleAxiosStreamResponse(response as Record<string, unknown>, onChunk, 'gemini')
  }

  /**
   * 构建 API 请求体
   */
  buildRequestBody(
    settingsStore: SettingsStore,
    messages: Message[],
    _streamMode: boolean
  ): Record<string, unknown> {
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    return {
      contents: contents,
      generationConfig: {
        temperature: settingsStore.temperature,
        maxOutputTokens: settingsStore.maxTokens
      }
    }
  }

  /**
   * 构建 API 请求头
   */
  buildHeaders(settingsStore: SettingsStore): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-goog-api-key': settingsStore.apiKey
    }
  }

  /**
   * 构建 API 请求 URL
   */
  buildRequestUrl(config: APIConfig, settingsStore: SettingsStore, streamMode = false): string {
    const action = streamMode ? 'streamGenerateContent' : 'generateContent'
    return `${config.baseUrl}${settingsStore.model}:${action}${streamMode ? '?alt=sse' : ''}`
  }

  /**
   * 从响应数据中提取内容
   */
  extractContent(data: Record<string, unknown>): string {
    if (!data) return ''
    const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined
    return candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  /**
   * 从流式数据中提取内容
   */
  extractStreamContent(data: Record<string, unknown>): string {
    if (!data) return ''
    const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined
    return candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  /**
   * 预处理消息
   */
  preprocessMessages(messages: Message[], settingsStore: SettingsStore): Message[] {
    return preprocessMessages(messages, settingsStore)
  }
}

export default GeminiProvider
