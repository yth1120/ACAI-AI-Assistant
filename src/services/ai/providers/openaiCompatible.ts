/**
 * OpenAI 兼容提供商（DeepSeek, OpenAI, Kimi, SiliconFlow, Zhipu 等）
 * 使用 axios 进行 HTTP 请求
 */

import { AxiosBaseAIProvider, type Message, type SettingsStore, type APIConfig } from './axiosBaseProvider'
import { preprocessMessages } from '../utils/messageProcessor'
import { handleAxiosStreamResponse } from '../utils/axiosStreamHandler'
import { sanitizeContent } from '../utils/responseParser'
import {
  handleApiResponseError,
  handleNetworkError,
  handleStreamError
} from '../utils/errorHandler'

export class OpenAICompatibleProvider extends AxiosBaseAIProvider {
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

    // 简化日志输出
    if (settingsStore.deepThinking || settingsStore.webSearch) {
      console.log('🎯 OpenAI 兼容请求开始 (使用 axios)')
      console.log('├─ 提供商:', settingsStore.apiProvider)
      console.log('├─ 模型:', settingsStore.model)
      console.log('├─ 流式模式:', streamMode)
    }

    // 处理消息（添加系统提示等）
    const processedMessages = this.preprocessMessages(messages, settingsStore)

    // 构建请求
    const requestBody = this.buildRequestBody(settingsStore, processedMessages, streamMode)
    const headers = this.buildHeaders(settingsStore)
    const url = this.buildRequestUrl(config, settingsStore)

    try {
      if (onChunk) {
        // 流式响应
        return await this.sendStreamRequest(url, requestBody, headers, onChunk)
      } else {
        // 非流式响应
        const data = await this.sendHttpRequest(url, requestBody, headers)
        return this.extractContent(data as Record<string, unknown>)
      }
    } catch (error) {
      throw handleNetworkError(error as Error, settingsStore.apiProvider)
    }
  }

  /**
   * 处理流式响应
   * @param response - axios 响应对象
   * @param onChunk - 数据块回调
   * @returns 完整响应内容
   */
  async processStreamResponse(response: unknown, onChunk: (chunk: string) => void): Promise<string> {
    return await handleAxiosStreamResponse(response as Record<string, unknown>, onChunk, 'openai-compatible')
  }

  /**
   * 构建 API 请求体
   */
  buildRequestBody(
    settingsStore: SettingsStore,
    messages: Message[],
    streamMode: boolean
  ): Record<string, unknown> {
    // 确定使用的模型
    let modelToUse = settingsStore.model

    // DeepSeek 深度思考模式：自动使用 reasoner 模型
    if (
      settingsStore.deepThinking &&
      settingsStore.apiProvider === 'deepseek' &&
      !modelToUse.includes('reasoner')
    ) {
      modelToUse = 'deepseek-reasoner'
      console.log('🧠 深度思考模式：切换到', modelToUse)
    }

    return {
      model: modelToUse,
      messages: messages,
      temperature: settingsStore.temperature,
      max_tokens: settingsStore.maxTokens,
      stream: streamMode
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
    const choices = data.choices as Array<{ message?: { content?: string } }> | undefined
    return sanitizeContent(choices?.[0]?.message?.content || '')
  }

  /**
   * 从流式数据中提取内容
   */
  extractStreamContent(data: Record<string, unknown>): string {
    if (!data) return ''
    const choices = data.choices as Array<{ delta?: { content?: string } }> | undefined
    return sanitizeContent(choices?.[0]?.delta?.content || '')
  }

  /**
   * 预处理消息
   */
  preprocessMessages(messages: Message[], settingsStore: SettingsStore): Message[] {
    return preprocessMessages(messages, settingsStore)
  }
}

export default OpenAICompatibleProvider
