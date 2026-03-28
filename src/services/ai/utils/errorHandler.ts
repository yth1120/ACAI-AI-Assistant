/**
 * AI 服务错误处理工具
 */

/**
 * 等待指定时间
 * @param ms - 等待时间（毫秒）
 * @returns Promise
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 重试选项接口
 */
export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  shouldRetry?: (error: Error) => boolean
}

/**
 * 错误处理器接口
 */
export interface ErrorHandlerOptions {
  maxRetries?: number
  baseDelay?: number
  onError?: (error: Error) => void
}

/**
 * 错误处理器对象
 */
export interface ErrorHandler {
  execute<T>(fn: () => Promise<T>): Promise<T>
  wrap<T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T
}

/**
 * AI 错误类型
 */
export type ErrorType =
  | 'network'
  | 'authentication'
  | 'rate_limit'
  | 'quota'
  | 'model_not_found'
  | 'invalid_request'
  | 'server_error'
  | 'timeout'
  | 'stream_error'
  | 'client_error'
  | 'unknown'

/**
 * AI 错误类
 */
export class AIError extends Error {
  public type: ErrorType
  public details: Record<string, unknown>
  public timestamp: number

  constructor(message: string, type: ErrorType = 'unknown', details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'AIError'
    this.type = type
    this.details = details
    this.timestamp = Date.now()
  }

  /**
   * 转换为用户友好的错误消息
   * @returns 用户友好的错误消息
   */
  toUserMessage(): string {
    switch (this.type) {
      case 'network':
        return '网络连接失败，请检查网络设置'
      case 'authentication':
        return 'API Key 无效或已过期，请检查设置'
      case 'rate_limit':
        return '请求过于频繁，请稍后再试'
      case 'quota':
        return 'API 额度已用完，请检查账户余额'
      case 'model_not_found':
        return '模型不存在或不可用'
      case 'invalid_request':
        return '请求参数无效，请检查输入内容'
      case 'server_error':
        return 'AI 服务暂时不可用，请稍后再试'
      case 'timeout':
        return '请求超时，请检查网络连接'
      default:
        return 'AI 服务暂时不可用，请稍后再试'
    }
  }

  /**
   * 从 HTTP 响应创建 AIError
   * @param response - HTTP 响应
   * @param data - 响应数据
   * @returns AI 错误对象
   */
  static fromResponse(response: Response, data: Record<string, unknown> = {}): AIError {
    const status = response.status
    let type: ErrorType = 'unknown'
    let message = (data.error as { message?: string })?.message || response.statusText || '未知错误'

    switch (status) {
      case 400:
        type = 'invalid_request'
        break
      case 401:
      case 403:
        type = 'authentication'
        break
      case 404:
        type = 'model_not_found'
        break
      case 408:
        type = 'timeout'
        break
      case 429:
        type = 'rate_limit'
        break
      case 500:
      case 502:
      case 503:
      case 504:
        type = 'server_error'
        break
      default:
        if (status >= 400 && status < 500) {
          type = 'client_error'
        } else if (status >= 500) {
          type = 'server_error'
        }
    }

    return new AIError(message, type, {
      status,
      statusText: response.statusText,
      url: response.url,
      ...data
    })
  }

  /**
   * 从网络错误创建 AIError
   * @param error - 原始错误
   * @returns AI 错误对象
   */
  static fromNetworkError(error: Error): AIError {
    let type: ErrorType = 'network'
    let message = error.message

    if (error.name === 'AbortError') {
      type = 'timeout'
      message = '请求被取消或超时'
    } else if (error.name === 'TimeoutError') {
      type = 'timeout'
      message = '请求超时'
    }

    // Axios 特定错误
    const axiosError = error as Error & { code?: string; response?: { status?: number } }
    if (axiosError.code === 'ECONNREFUSED') {
      type = 'network'
      message = '无法连接到服务（Ollama 未启动？）'
    } else if (axiosError.code === 'ERR_NETWORK') {
      type = 'network'
      message = '网络连接失败，请检查网络设置'
    } else if (axiosError.response?.status) {
      // 从 axios response 提取状态码
      const status = axiosError.response.status
      if (status === 401 || status === 403) {
        type = 'authentication'
        message = 'API Key 无效或已过期'
      } else if (status === 429) {
        type = 'rate_limit'
        message = '请求过于频繁，请稍后再试'
      } else if (status >= 500) {
        type = 'server_error'
        message = 'AI 服务暂时不可用，请稍后再试'
      }
    }

    return new AIError(message, type, {
      originalError: error,
      name: error.name,
      code: axiosError.code
    })
  }
}

/**
 * 默认的重试判断函数
 * @param error - 错误对象
 * @returns 是否应该重试
 */
function defaultShouldRetry(error: Error): boolean {
  const retryableErrors = ['NetworkError', 'TimeoutError', 'AbortError', 'TypeError']
  const retryableCodes = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ERR_NETWORK']
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504]

  if (retryableErrors.includes(error.name)) return true

  const axiosError = error as Error & { code?: string; status?: number }
  if (axiosError.code && retryableCodes.includes(axiosError.code)) return true
  if (axiosError.status && retryableStatusCodes.includes(axiosError.status)) return true

  const retryableMessages = ['network', 'timeout', 'abort', 'connection', 'server', 'gateway', 'service unavailable']
  const errorMessage = error.message?.toLowerCase() || ''
  return retryableMessages.some(msg => errorMessage.includes(msg))
}

/**
 * 重试机制包装器
 * @param fn - 要重试的函数
 * @param options - 重试选项
 * @returns 函数执行结果
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, shouldRetry = defaultShouldRetry } = options

  let lastError: unknown
  let retryCount = 0

  while (retryCount <= maxRetries) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      retryCount++

      // 检查是否应该重试
      if (retryCount > maxRetries || !shouldRetry(error as Error)) {
        break
      }

      // 计算延迟时间（指数退避）
      const delay = baseDelay * Math.pow(2, retryCount - 1)
      console.log(`请求失败，第 ${retryCount} 次重试，延迟 ${delay}ms:`, (error as Error).message)

      // 等待延迟
      await sleep(delay)
    }
  }

  // 所有重试都失败，抛出最后一个错误
  throw lastError
}

/**
 * 处理 API 响应错误
 * @param response - HTTP 响应
 * @returns AI 错误对象
 */
export async function handleApiResponseError(response: Response): Promise<AIError> {
  try {
    const data = await response.json()
    return AIError.fromResponse(response, data)
  } catch {
    return AIError.fromResponse(response)
  }
}

/**
 * 处理网络错误
 * @param error - 原始错误
 * @param provider - API 提供商
 * @returns AI 错误对象
 */
export function handleNetworkError(error: Error | unknown, provider?: string): AIError {
  const aiError = AIError.fromNetworkError(error as Error)
  if (provider) {
    aiError.details.provider = provider
  }
  return aiError
}

/**
 * 处理流错误
 * @param error - 流错误
 * @param stream - 流对象
 * @returns AI 错误对象
 */
export function handleStreamError(error: Error | Response, stream: unknown = null): AIError {
  let aiError: AIError

  if (error instanceof Response) {
    aiError = AIError.fromResponse(error)
  } else if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    aiError = new AIError('请求被取消或超时', 'timeout', {
      originalError: error
    })
  } else {
    aiError = new AIError((error as Error).message || '流处理错误', 'stream_error', {
      originalError: error,
      stream: !!stream
    })
  }

  // 如果流存在，尝试取消
  if (stream && typeof (stream as { cancel?: () => void }).cancel === 'function') {
    try {
      ;(stream as { cancel: () => void }).cancel()
    } catch {
      // 忽略取消错误
    }
  }

  return aiError
}

/**
 * 创建错误处理器
 * @param options - 选项
 * @returns 错误处理器
 */
export function createErrorHandler(options: ErrorHandlerOptions = {}): ErrorHandler {
  const { maxRetries = 3, baseDelay = 1000, onError = null } = options

  return {
    /**
     * 执行函数并处理错误
     * @param fn - 要执行的函数
     * @returns 执行结果
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
      try {
        return await withRetry(fn, { maxRetries, baseDelay })
      } catch (error) {
        if (onError) {
          onError(error as Error)
        }
        throw error
      }
    },

    /**
     * 包装函数
     * @param fn - 要包装的函数
     * @returns 包装后的函数
     */
    wrap<T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T {
      return ((...args: unknown[]) => this.execute(() => fn(...args))) as T
    }
  }
}

/**
 * 错误处理中间件
 * @param fn - 要包装的函数
 * @returns 包装后的函数
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async function (...args: Parameters<T>): Promise<ReturnType<T>> {
    try {
      return await fn(...args)
    } catch (error) {
      // 如果已经是 AIError，直接抛出
      if (error instanceof AIError) {
        throw error
      }

      // 转换错误类型
      let aiError: AIError
      if (error instanceof Response) {
        try {
          const data = await error.json()
          aiError = AIError.fromResponse(error, data)
        } catch {
          aiError = AIError.fromResponse(error)
        }
      } else if ((error as Error).name === 'TypeError' && (error as Error).message.includes('fetch')) {
        aiError = AIError.fromNetworkError(error as Error)
      } else {
        aiError = new AIError((error as Error).message, 'unknown', {
          originalError: error
        })
      }

      console.error('AI 服务错误:', aiError)
      throw aiError
    }
  }
}

export default {
  withRetry,
  handleApiResponseError,
  handleNetworkError,
  handleStreamError,
  createErrorHandler,
  withErrorHandling,
  AIError
}
