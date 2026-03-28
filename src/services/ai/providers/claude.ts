/**
 * Claude AI 提供商
 * 使用 axios 进行 HTTP 请求
 */

import { AxiosBaseAIProvider, type Message, type SettingsStore, type APIConfig } from './axiosBaseProvider'
import { handleAxiosStreamResponse } from '../utils/axiosStreamHandler'
import { sanitizeContent } from '../utils/responseParser'
import { handleNetworkError } from '../utils/errorHandler'

export class ClaudeProvider extends AxiosBaseAIProvider {
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

    // 处理消息（Claude 特殊处理）
    const processedMessages = this.preprocessMessages(messages, settingsStore)

    // 提取系统消息
    const systemMessage = this.extractSystemMessage(processedMessages)
    const chatMessages = processedMessages.filter(m => m.role !== 'system')

    // 构建请求
    const requestBody = this.buildRequestBody(settingsStore, chatMessages, streamMode, systemMessage)
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
      return handleNetworkError(error)
    }
  }

  /**
   * 提取系统消息内容
   */
  private extractSystemMessage(messages: Message[]): string | undefined {
    const systemMsg = messages.find(m => m.role === 'system')
    return systemMsg?.content
  }

  /**
   * 处理流式响应
   */
  async processStreamResponse(response: unknown, onChunk: (chunk: string) => void): Promise<string> {
    return await handleAxiosStreamResponse(response as Record<string, unknown>, onChunk, 'claude')
  }

  /**
   * 构建 API 请求体
   */
  buildRequestBody(
    settingsStore: SettingsStore,
    messages: Message[],
    streamMode: boolean,
    systemMessage?: string
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: settingsStore.model,
      messages: messages,
      temperature: settingsStore.temperature,
      max_tokens: settingsStore.maxTokens,
      stream: streamMode
    }

    // Claude 原生支持 system 字段
    if (systemMessage) {
      body.system = systemMessage
    }

    return body
  }

  /**
   * 构建 API 请求头
   */
  buildHeaders(settingsStore: SettingsStore): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': settingsStore.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
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
    const content = data.content as Array<{ text?: string }> | undefined
    return sanitizeContent(content?.[0]?.text || '')
  }

  /**
   * 从流式数据中提取内容
   */
  extractStreamContent(data: Record<string, unknown>): string {
    if (!data) return ''

    if (data.type === 'content_block_delta') {
      const delta = data.delta as { text?: string } | undefined
      return sanitizeContent(delta?.text || '')
    }
    if (data.type === 'content_block_start') {
      const contentBlock = data.content_block as { text?: string } | undefined
      return sanitizeContent(contentBlock?.text || '')
    }
    const content = data.content as Array<{ text?: string }> | undefined
    if (content?.[0]?.text) {
      return sanitizeContent(content[0].text)
    }
    return ''
  }

  /**
   * 预处理消息
   */
  preprocessMessages(messages: Message[], settingsStore: SettingsStore): Message[] {
    const processedMessages = [...messages]
    const systemPrompts: string[] = []

    if (settingsStore.deepThinking) {
      systemPrompts.push(
        '请使用深度思考模式，详细分析问题的各个方面，展示你的推理过程。在回答时：\n' +
          '1. 分析问题的核心要点\n' +
          '2. 考虑多个可能的角度和方案\n' +
          '3. 评估每个方案的优缺点\n' +
          '4. 给出经过深思熟虑的结论'
      )
    }

    if (settingsStore.webSearch) {
      systemPrompts.push(
        '请以联网搜索模式回答。假设你可以访问最新的互联网信息。在回答时：\n' +
          '1. 考虑最新的信息和趋势\n' +
          '2. 提供具体的数据和事实\n' +
          '3. 如果涉及时效性内容，请说明是基于最新信息\n' +
          '4. 必要时提供相关的参考来源建议'
      )
    }

    // 将系统提示作为 system 消息添加（Claude 原生支持）
    if (systemPrompts.length > 0) {
      processedMessages.unshift({
        role: 'system',
        content: systemPrompts.join('\n\n')
      })
    }

    return processedMessages
  }
}

export default ClaudeProvider
