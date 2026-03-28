/**
 * 通义千问 AI 提供商
 */

import { AxiosBaseAIProvider, type Message, type SettingsStore, type APIConfig } from './axiosBaseProvider'
import { preprocessMessages } from '../utils/messageProcessor'
import { handleAxiosStreamResponse } from '../utils/axiosStreamHandler'
import { handleNetworkError } from '../utils/errorHandler'

export class QwenProvider extends AxiosBaseAIProvider {
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
      throw handleNetworkError(error as Error, settingsStore.apiProvider)
    }
  }

  /**
   * 处理流式响应
   */
  async processStreamResponse(response: unknown, onChunk: (chunk: string) => void): Promise<string> {
    return await handleAxiosStreamResponse(response as Record<string, unknown>, onChunk, 'qwen')
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
      input: {
        messages: messages
      },
      parameters: {
        temperature: settingsStore.temperature,
        max_tokens: settingsStore.maxTokens,
        result_format: 'message',
        incremental_output: streamMode
      }
    }
  }

  /**
   * 构建 API 请求头
   */
  buildHeaders(settingsStore: SettingsStore): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settingsStore.apiKey}`
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
    // 通义千问新格式: output.choices[0].message.content
    const output = data.output as { choices?: Array<{ message?: { content?: string } }>; text?: string } | undefined
    if (output?.choices?.[0]?.message?.content) {
      return output.choices[0].message.content
    }
    // 兼容旧格式
    return output?.text || ''
  }

  /**
   * 从流式数据中提取内容
   */
  extractStreamContent(data: Record<string, unknown>): string {
    if (!data) return ''
    const output = data.output as { choices?: Array<{ delta?: { content?: string } }>; text?: string } | undefined
    if (output?.choices?.[0]?.delta?.content) {
      return output.choices[0].delta.content
    }
    // 兼容旧格式
    return output?.text || ''
  }

  /**
   * 预处理消息
   */
  preprocessMessages(messages: Message[], settingsStore: SettingsStore): Message[] {
    return preprocessMessages(messages, settingsStore)
  }
}

export default QwenProvider
