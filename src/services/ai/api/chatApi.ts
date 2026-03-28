/**
 * 基于 axios 的 AI 服务类
 * 处理与各种 AI API 提供商的通信
 */

import { useSettingsStore } from '@/stores/settings'
import { AIErrorHandler } from './AIErrorHandler'

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

// 请求映射接口
interface RequestMap {
  [key: string]: AbortController
}

// 队列项接口
interface QueueItem {
  resolve: () => void
  reqId: string
}

/**
 * AI 服务类
 */
export class AIService {
  private requestMap: RequestMap
  private requestCounter: number
  private maxConcurrentRequests: number
  private requestQueue: QueueItem[]
  private activeRequests: number

  constructor() {
    this.requestMap = new Map<string, AbortController>() // 管理多个请求，防止内存泄漏
    this.requestCounter = 0
    this.maxConcurrentRequests = 3 // 最大并发请求数
    this.requestQueue = [] // 请求队列
    this.activeRequests = 0 // 当前活跃请求数
  }

  /**
   * 验证请求参数
   * @param settingsStore - 设置 store
   * @param messages - 消息数组
   * @throws 参数验证失败
   */
  validateRequest(settingsStore: SettingsStore, messages: Message[]): void {
    // 验证 API Key（Ollama 本地模型除外）
    if (!settingsStore.apiKey && settingsStore.apiProvider !== 'ollama') {
      throw new Error('请先在设置中配置 API Key')
    }

    // 验证配置
    if (!settingsStore.currentConfig) {
      throw new Error('无效的 API 提供商配置')
    }

    // 验证消息格式
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('消息格式不正确或消息为空')
    }

    // 验证消息内容
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new Error('消息必须包含 role 和 content 字段')
      }
    }
  }

  /**
   * 构建 API 请求体
   * @param settingsStore - 设置 store
   * @param messages - 消息数组
   * @param streamMode - 是否流式输出
   * @returns 请求体对象
   */
  buildRequestBody(settingsStore: SettingsStore, messages: Message[], streamMode: boolean): Record<string, unknown> {
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

    const baseBody = {
      model: modelToUse,
      messages: messages,
      temperature: settingsStore.temperature,
      stream: streamMode
    }

    // Claude 使用 max_tokens（不是 maxTokens）
    if (settingsStore.apiProvider === 'claude') {
      return {
        ...baseBody,
        max_tokens: settingsStore.maxTokens
      }
    }

    // 其他提供商使用 max_tokens
    return {
      ...baseBody,
      max_tokens: settingsStore.maxTokens
    }
  }

  /**
   * 构建 API 请求头
   * @param settingsStore - 设置 store
   * @returns 请求头对象
   */
  buildHeaders(settingsStore: SettingsStore): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // 根据不同提供商设置认证头
    switch (settingsStore.apiProvider) {
      case 'claude':
        headers['x-api-key'] = settingsStore.apiKey
        headers['anthropic-version'] = '2023-06-01'
        break
      case 'gemini':
        // Gemini 使用 URL 参数传递 API Key
        break
      default:
        // OpenAI 兼容格式（Bearer Token）
        headers['Authorization'] = `Bearer ${settingsStore.apiKey}`
        break
    }

    return headers
  }

  /**
   * 预处理消息（添加系统提示等）
   * @param messages - 原始消息数组
   * @param settingsStore - 设置 store
   * @returns 处理后的消息数组
   */
  preprocessMessages(messages: Message[], settingsStore: SettingsStore): Message[] {
    // 复制消息数组，避免修改原数组
    let processedMessages = [...messages]

    // 构建系统提示
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

    // 如果有系统提示，添加到消息列表
    if (systemPrompts.length > 0) {
      const systemContent = systemPrompts.join('\n\n')
      console.log('✨ 系统提示内容:', systemContent.substring(0, 100) + '...')

      // Claude API 不支持 system role，需要将系统提示合并到第一条用户消息中
      if (settingsStore.apiProvider === 'claude') {
        // 找到第一条用户消息
        const firstUserMsgIndex = processedMessages.findIndex(m => m.role === 'user')
        if (firstUserMsgIndex !== -1) {
          // 在第一条用户消息前添加系统提示
          processedMessages[firstUserMsgIndex].content =
            `[系统指令]\n${systemContent}\n\n[用户问题]\n` +
            processedMessages[firstUserMsgIndex].content
          console.log('✨ 已添加系统提示（Claude 格式）')
        }
      } else {
        // 其他 API 支持 system role
        const systemMessage: Message = {
          role: 'system',
          content: systemContent
        }

        // 检查是否已有 system 消息
        const hasSystemMessage = processedMessages.some(m => m.role === 'system')

        if (hasSystemMessage) {
          // 如果已有 system 消息，合并内容
          const systemMsgIndex = processedMessages.findIndex(m => m.role === 'system')
          processedMessages[systemMsgIndex].content += '\n\n' + systemMessage.content
        } else {
          // 添加新的 system 消息到开头
          processedMessages.unshift(systemMessage)
        }

        console.log('✨ 已添加系统提示')
      }
    }

    return processedMessages
  }

  /**
   * 发送消息到 AI
   * @param messages - 消息历史
   * @param onChunk - 流式响应回调函数
   * @param requestId - 可选的请求 ID，用于取消特定请求
   * @returns AI 响应内容
   * @throws API 错误
   */
  async sendMessage(
    messages: Message[],
    onChunk: ((chunk: string, chunkCount?: number) => void) | null = null,
    requestId: string | null = null
  ): Promise<string> {
    const settingsStore = useSettingsStore()

    // 验证参数
    this.validateRequest(settingsStore, messages)

    // 生成请求 ID
    const reqId = requestId || `req_${Date.now()}_${++this.requestCounter}`

    // 检查并发限制
    if (this.activeRequests >= this.maxConcurrentRequests) {
      console.log(`⏳ 请求 ${reqId} 进入队列等待，当前活跃请求：${this.activeRequests}`)
      await new Promise<void>(resolve => {
        this.requestQueue.push({ resolve, reqId })
      })
    }

    this.activeRequests++

    // 创建 AbortController 并存储
    const abortController = new AbortController()
    this.requestMap.set(reqId, abortController)

    const config = settingsStore.currentConfig
    const streamMode = typeof onChunk === 'function'

    // 简化日志输出（仅在开发环境或启用特殊功能时输出详细信息）
    if (settingsStore.deepThinking || settingsStore.webSearch) {
      console.log(`🎯 AI 请求开始 [${reqId}]`)
      console.log('├─ 提供商:', settingsStore.apiProvider)
      console.log('├─ 模型:', settingsStore.model)
      console.log('├─ 流式模式:', streamMode)
      console.log('├─ 深度思考:', settingsStore.deepThinking)
      console.log('├─ 联网搜索:', settingsStore.webSearch)
      console.log('└─ 消息数量:', messages.length)
    }

    // 处理消息（添加系统提示等）
    const processedMessages = this.preprocessMessages(messages, settingsStore)

    // 构建请求体
    const requestBody = this.buildRequestBody(settingsStore, processedMessages, streamMode)

    // 构建请求头
    const headers = this.buildHeaders(settingsStore)

    try {
      let url = config.baseUrl
      if (settingsStore.apiProvider === 'gemini') {
        url = `${config.baseUrl}${settingsStore.model}:generateContent?key=${settingsStore.apiKey}`
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      })

      if (!response.ok) {
        let errorData: Record<string, unknown> | null = null
        try {
          errorData = await response.json()
        } catch {
          // 忽略 JSON 解析错误
        }

        // 使用统一的错误处理
        const error = {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        }

        throw error
      }

      if (onChunk) {
        // 流式响应
        if (settingsStore.deepThinking || settingsStore.webSearch) {
          console.log(`✅ 使用流式响应模式 [${reqId}]`)
          console.log('Content-Type:', response.headers.get('content-type'))
        }
        return await this.handleStreamResponse(response, onChunk, reqId)
      } else {
        // 非流式响应
        const data = await response.json()
        return this.extractContent(data, settingsStore.apiProvider)
      }
    } catch (error) {
      // 使用统一的错误处理
      const errorInfo = AIErrorHandler.handle(error, settingsStore.apiProvider, {
        requestId: reqId,
        model: settingsStore.model,
        streamMode
      })

      throw errorInfo
    } finally {
      // 清理资源
      this.requestMap.delete(reqId)
      this.activeRequests--

      // 从队列中取出下一个请求
      if (this.requestQueue.length > 0) {
        const next = this.requestQueue.shift()!
        next.resolve()
      }
    }
  }

  /**
   * 取消指定请求
   * @param requestId - 要取消的请求 ID，不传则取消所有请求
   */
  cancelRequest(requestId: string | null = null): void {
    if (requestId) {
      // 取消特定请求
      const controller = this.requestMap.get(requestId)
      if (controller) {
        controller.abort()
        this.requestMap.delete(requestId)
        console.log(`🛑 已取消请求：${requestId}`)
      }
    } else {
      // 取消所有请求
      this.requestMap.forEach((controller, id) => {
        controller.abort()
        console.log(`🛑 已取消请求：${id}`)
      })
      this.requestMap.clear()

      // 清空队列
      this.requestQueue = []
      this.activeRequests = 0
      console.log('🛑 已取消所有请求并清空队列')
    }
  }

  /**
   * 获取当前请求状态
   * @returns 请求状态信息
   */
  getRequestStatus(): {
    activeRequests: number
    queuedRequests: number
    maxConcurrentRequests: number
    requestIds: string[]
  } {
    return {
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
      maxConcurrentRequests: this.maxConcurrentRequests,
      requestIds: Array.from(this.requestMap.keys())
    }
  }

  /**
   * 设置最大并发请求数
   * @param max - 最大并发数
   */
  setMaxConcurrentRequests(max: number): void {
    if (max > 0 && max <= 10) {
      this.maxConcurrentRequests = max
      console.log(`📊 设置最大并发请求数为：${max}`)
    } else {
      console.warn(`⚠️ 无效的最大并发数：${max}，保持为 ${this.maxConcurrentRequests}`)
    }
  }

  /**
   * 处理流式响应
   * @param response - Fetch 响应对象
   * @param onChunk - 数据块回调
   * @param requestId - 请求 ID，用于检查是否被取消
   * @returns 完整响应内容
   */
  async handleStreamResponse(
    response: Response,
    onChunk: (chunk: string, chunkCount: number) => void,
    requestId: string
  ): Promise<string> {
    const settingsStore = useSettingsStore()

    if (!response.body) {
      throw new Error('响应体为空')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = '' // 用于保存不完整的行
    let chunkCount = 0
    let startTime = Date.now()

    console.log(`🔄 开始处理流式响应 [${requestId}]...`, '提供商:', settingsStore.apiProvider)

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // 检查请求是否已被取消
        if (!this.requestMap.has(requestId)) {
          console.log(`🛑 请求 ${requestId} 已被取消，停止读取流`)
          reader.cancel()
          throw new Error(`请求 ${requestId} 已取消`)
        }

        const { done, value } = await reader.read()
        if (done) {
          console.log(`✅ 流读取完成 [${requestId}]，总内容长度:`, fullContent.length)
          break
        }

        // 解码新数据并添加到缓冲区
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // 按行分割处理
        const lines = buffer.split('\n')
        // 保留最后一个可能不完整的行
        buffer = lines.pop() || ''

        // 处理完整的行
        for (const line of lines) {
          const trimmedLine = line.trim()

          // 跳过空行、注释和事件类型行
          if (!trimmedLine || trimmedLine.startsWith(':') || trimmedLine.startsWith('event:')) {
            continue
          }

          // 处理 SSE 数据行
          if (trimmedLine.startsWith('data:')) {
            const data = trimmedLine.substring(5).trim()

            // 跳过结束标记
            if (data === '[DONE]') {
              console.log(`📝 收到流式响应结束标记 [${requestId}]`)
              continue
            }

            try {
              const parsed = JSON.parse(data) as Record<string, unknown>
              const content = this.extractStreamContent(parsed, settingsStore.apiProvider)
              if (content) {
                fullContent += content
                chunkCount++

                // 每 50 个数据块打印一次日志，避免过多日志
                if (chunkCount % 50 === 0) {
                  console.log(
                    `💬 流式内容 [${requestId}]: 已收到 ${chunkCount} 个数据块，总长度 ${fullContent.length}`
                  )
                }

                if (onChunk && typeof onChunk === 'function') {
                  onChunk(content, chunkCount)
                }
              }
            } catch (e) {
              // 跳过无效的 JSON，可能是不完整的数据
              console.debug(`跳过无效数据 [${requestId}]:`, data.substring(0, 50))
            }
          }
        }
      }

      // 处理缓冲区中剩余的数据
      if (buffer.trim()) {
        const trimmedLine = buffer.trim()
        if (trimmedLine.startsWith('data:')) {
          const data = trimmedLine.substring(5).trim()
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data) as Record<string, unknown>
              const content = this.extractStreamContent(parsed, settingsStore.apiProvider)
              if (content) {
                fullContent += content
                chunkCount++
                if (onChunk && typeof onChunk === 'function') {
                  onChunk(content, chunkCount)
                }
              }
            } catch (e) {
              console.debug(`缓冲区数据解析失败 [${requestId}]`)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()

      // 清理请求映射
      this.requestMap.delete(requestId)
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(
      `✅ 流式响应处理完成 [${requestId}]，总长度：${fullContent.length}，耗时：${duration}s，数据块：${chunkCount}`
    )
    return fullContent
  }

  /**
   * 从响应数据中提取内容
   * @param data - API 响应数据
   * @param provider - 提供商标识
   * @returns 提取的内容
   */
  extractContent(data: Record<string, unknown> | null, provider: string): string {
    if (!data) return ''

    try {
      switch (provider) {
        case 'claude': {
          const content = data.content as Array<{ text?: string }> | undefined
          return content?.[0]?.text || ''
        }
        case 'gemini': {
          const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined
          return candidates?.[0]?.content?.parts?.[0]?.text || ''
        }
        default: {
          const choices = data.choices as Array<{ message?: { content?: string } }> | undefined
          return choices?.[0]?.message?.content || ''
        }
      }
    } catch (error) {
      console.error('提取内容失败:', error)
      return ''
    }
  }

  /**
   * 从流式数据中提取内容
   * @param data - 流式数据块
   * @param provider - API 提供商
   * @returns 提取的内容
   */
  extractStreamContent(data: Record<string, unknown>, provider: string): string {
    if (!data) return ''

    try {
      // Claude 格式（特殊处理）
      if (provider === 'claude') {
        // Claude 流式响应格式
        if (data.type === 'content_block_delta') {
          const delta = data.delta as { text?: string } | undefined
          return delta?.text || ''
        }
        if (data.type === 'content_block_start') {
          const contentBlock = data.content_block as { text?: string } | undefined
          return contentBlock?.text || ''
        }
        // 兼容旧格式
        const content = data.content as Array<{ text?: string }> | undefined
        if (content?.[0]?.text) {
          return content[0].text
        }
        const delta = data.delta as { text?: string } | undefined
        if (delta?.text) {
          return delta.text
        }
        return ''
      }

      // Gemini 格式
      if (provider === 'gemini') {
        const candidates = (data.candidates || []) as Array<{ content?: { parts?: Array<{ text?: string }> } }>
        if (candidates[0]?.content?.parts?.[0]?.text) {
          return candidates[0].content.parts[0].text
        }
        return ''
      }

      // OpenAI/DeepSeek/Kimi/SiliconFlow/Zhipu 等兼容 OpenAI 格式的 API
      const choices = (data.choices || []) as Array<{ delta?: { content?: string } }>
      if (choices[0]?.delta?.content) {
        return choices[0].delta.content
      }

      // Qwen 格式
      const output = data.output as { text?: string } | undefined
      if (output?.text) {
        return output.text
      }

      return ''
    } catch (error) {
      console.error('提取流式内容失败:', error, 'provider:', provider)
      return ''
    }
  }

  /**
   * 测试 API 连接
   * @returns 测试结果
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
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
   * 重试机制包装函数
   * @param fn - 要重试的异步函数
   * @param maxRetries - 最大重试次数
   * @param delay - 重试延迟（毫秒）
   * @returns 函数执行结果
   */
  async withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> {
    let lastError: unknown
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        if (i < maxRetries - 1) {
          console.log(`请求失败，${delay}ms 后重试...（${i + 1}/${maxRetries}）`)
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2 // 指数退避
        }
      }
    }
    throw lastError
  }
}

export const aiService = new AIService()
