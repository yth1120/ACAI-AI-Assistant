/**
 * AI 错误处理统一机制
 * 支持多 AI 服务商的错误分类、翻译和恢复策略
 */

// 错误类型枚举
export const AIErrorType = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  RATE_LIMIT: 'rate_limit',
  QUOTA_EXCEEDED: 'quota_exceeded',
  INVALID_REQUEST: 'invalid_request',
  SERVER_ERROR: 'server_error',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
  UNKNOWN: 'unknown'
} as const

export type AIErrorTypeValue = typeof AIErrorType[keyof typeof AIErrorType]

// 错误严重级别
export const ErrorSeverity = {
  LOW: 'low', // 可忽略的错误
  MEDIUM: 'medium', // 需要用户注意
  HIGH: 'high', // 需要立即处理
  CRITICAL: 'critical' // 应用无法继续
} as const

export type ErrorSeverityValue = typeof ErrorSeverity[keyof typeof ErrorSeverity]

// 错误信息接口
export interface ParsedError {
  type: AIErrorTypeValue
  message: string
  originalError: unknown
  statusCode: number
  errorData?: unknown
}

// 错误恢复策略接口
export interface RecoveryStrategy {
  retry: boolean
  maxRetries?: number
  retryDelay?: number
  userAction: string
}

// 错误处理结果接口
export interface ErrorHandleResult {
  type: AIErrorTypeValue
  message: string
  originalError: unknown
  statusCode: number
  errorData?: unknown
  recovery: RecoveryStrategy
  severity: ErrorSeverityValue
  userMessage: string
  timestamp: number
  context: ErrorContext
}

// 错误上下文接口
export interface ErrorContext {
  provider?: string
  isCritical?: boolean
  attempt?: number
  maxRetries?: number
  functionName?: string
  [key: string]: unknown
}

// 错误信息映射接口
export interface ErrorInfo {
  type: AIErrorTypeValue
  message: string
}

// 提供商错误码映射类型
export interface ProviderErrorMap {
  [code: number]: ErrorInfo
}

// 错误恢复策略映射类型
export interface RecoveryStrategyMap {
  [key: string]: RecoveryStrategy
}

// AI 服务商错误码映射
const providerErrorMaps: Record<string, ProviderErrorMap> = {
  deepseek: {
    400: { type: AIErrorType.INVALID_REQUEST, message: '请求参数错误' },
    401: { type: AIErrorType.AUTHENTICATION, message: 'API Key 无效或已过期' },
    403: { type: AIErrorType.AUTHENTICATION, message: '权限不足' },
    429: { type: AIErrorType.RATE_LIMIT, message: '请求过于频繁，请稍后重试' },
    500: { type: AIErrorType.SERVER_ERROR, message: 'DeepSeek 服务器内部错误' },
    502: { type: AIErrorType.NETWORK, message: '网络网关错误' },
    503: { type: AIErrorType.SERVER_ERROR, message: '服务暂时不可用' },
    504: { type: AIErrorType.TIMEOUT, message: '网关超时' }
  },

  openai: {
    400: { type: AIErrorType.INVALID_REQUEST, message: '请求参数错误' },
    401: { type: AIErrorType.AUTHENTICATION, message: 'API Key 无效' },
    403: { type: AIErrorType.AUTHENTICATION, message: '权限不足' },
    429: { type: AIErrorType.RATE_LIMIT, message: '请求频率超限' },
    500: { type: AIErrorType.SERVER_ERROR, message: 'OpenAI 服务器错误' },
    502: { type: AIErrorType.NETWORK, message: '网络错误' },
    503: { type: AIErrorType.SERVER_ERROR, message: '服务过载' },
    504: { type: AIErrorType.TIMEOUT, message: '请求超时' }
  },

  claude: {
    400: { type: AIErrorType.INVALID_REQUEST, message: '无效的请求' },
    401: { type: AIErrorType.AUTHENTICATION, message: '认证失败' },
    403: { type: AIErrorType.AUTHENTICATION, message: '访问被拒绝' },
    429: { type: AIErrorType.RATE_LIMIT, message: '请求过多' },
    500: { type: AIErrorType.SERVER_ERROR, message: 'Claude 服务器错误' },
    529: { type: AIErrorType.QUOTA_EXCEEDED, message: '额度已用完' }
  },

  gemini: {
    400: { type: AIErrorType.INVALID_REQUEST, message: '请求格式错误' },
    401: { type: AIErrorType.AUTHENTICATION, message: 'API Key 无效' },
    403: { type: AIErrorType.AUTHENTICATION, message: '项目未启用 API' },
    429: { type: AIErrorType.RATE_LIMIT, message: '配额超限' },
    500: { type: AIErrorType.SERVER_ERROR, message: 'Google 服务器错误' },
    503: { type: AIErrorType.SERVER_ERROR, message: '服务不可用' }
  },

  qwen: {
    400: { type: AIErrorType.INVALID_REQUEST, message: '请求参数错误' },
    401: { type: AIErrorType.AUTHENTICATION, message: 'API Key 无效' },
    429: { type: AIErrorType.RATE_LIMIT, message: '请求频率超限' },
    500: { type: AIErrorType.SERVER_ERROR, message: '通义千问服务器错误' }
  },

  kimi: {
    400: { type: AIErrorType.INVALID_REQUEST, message: '请求格式错误' },
    401: { type: AIErrorType.AUTHENTICATION, message: '认证失败' },
    429: { type: AIErrorType.RATE_LIMIT, message: '请求频率超限' },
    500: { type: AIErrorType.SERVER_ERROR, message: 'Kimi 服务器错误' }
  },

  default: {
    400: { type: AIErrorType.INVALID_REQUEST, message: '请求参数错误' },
    401: { type: AIErrorType.AUTHENTICATION, message: '认证失败' },
    429: { type: AIErrorType.RATE_LIMIT, message: '请求过于频繁' },
    500: { type: AIErrorType.SERVER_ERROR, message: '服务器内部错误' },
    502: { type: AIErrorType.NETWORK, message: '网络错误' },
    503: { type: AIErrorType.SERVER_ERROR, message: '服务不可用' },
    504: { type: AIErrorType.TIMEOUT, message: '请求超时' }
  }
}

// 错误恢复策略
const recoveryStrategies: RecoveryStrategyMap = {
  [AIErrorType.NETWORK]: {
    retry: true,
    maxRetries: 3,
    retryDelay: 1000,
    userAction: '检查网络连接后重试'
  },

  [AIErrorType.AUTHENTICATION]: {
    retry: false,
    userAction: '检查并更新 API Key'
  },

  [AIErrorType.RATE_LIMIT]: {
    retry: true,
    maxRetries: 2,
    retryDelay: 5000,
    userAction: '等待一段时间后重试'
  },

  [AIErrorType.QUOTA_EXCEEDED]: {
    retry: false,
    userAction: '检查 API 额度或升级套餐'
  },

  [AIErrorType.INVALID_REQUEST]: {
    retry: false,
    userAction: '检查请求参数是否正确'
  },

  [AIErrorType.SERVER_ERROR]: {
    retry: true,
    maxRetries: 2,
    retryDelay: 3000,
    userAction: '稍后重试或联系服务商'
  },

  [AIErrorType.TIMEOUT]: {
    retry: true,
    maxRetries: 2,
    retryDelay: 2000,
    userAction: '检查网络连接后重试'
  },

  [AIErrorType.CANCELLED]: {
    retry: false,
    userAction: '请求已被取消'
  },

  [AIErrorType.UNKNOWN]: {
    retry: true,
    maxRetries: 1,
    retryDelay: 1000,
    userAction: '未知错误，请稍后重试'
  }
}

// 提供商名称映射
export const providerNames: Record<string, string> = {
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  claude: 'Claude',
  gemini: 'Gemini',
  qwen: '通义千问',
  kimi: 'Kimi',
  siliconflow: '硅基流动',
  zhipu: '智谱 AI',
  ollama: 'Ollama'
}

/**
 * AI 错误处理类
 */
export class AIErrorHandler {
  /**
   * 处理 AI 错误
   * @param error - 原始错误对象
   * @param provider - AI 服务提供商
   * @param context - 错误上下文信息
   * @returns 处理后的错误信息
   */
  static handle(error: Error | unknown | string, provider: string = 'unknown', context: ErrorContext = {}): ErrorHandleResult {
    // 解析错误信息
    const parsedError = this.parseError(error, provider)

    // 获取恢复策略
    const recovery = recoveryStrategies[parsedError.type] || recoveryStrategies[AIErrorType.UNKNOWN]

    // 确定错误严重级别
    const severity = this.determineSeverity(parsedError.type, context)

    // 构建用户友好的错误消息
    const userMessage = this.buildUserMessage(parsedError, provider, context)

    // 记录错误日志
    this.logError(parsedError, provider, context, severity)

    return {
      ...parsedError,
      recovery,
      severity,
      userMessage,
      timestamp: Date.now(),
      context: {
        provider,
        ...context
      }
    }
  }

  /**
   * 解析错误信息
   */
  static parseError(error: Error | unknown | string, provider: string): ParsedError {
    // 如果是字符串错误
    if (typeof error === 'string') {
      return {
        type: AIErrorType.UNKNOWN,
        message: error,
        originalError: error,
        statusCode: 0
      }
    }

    // 如果是 Error 对象
    if (error instanceof Error) {
      // 检查是否为取消错误
      if (error.name === 'AbortError' || error.message.includes('取消')) {
        return {
          type: AIErrorType.CANCELLED,
          message: '请求已被取消',
          originalError: error,
          statusCode: 0
        }
      }

      // 检查是否为超时错误
      if (
        error.name === 'TimeoutError' ||
        error.message.includes('超时') ||
        error.message.includes('timeout')
      ) {
        return {
          type: AIErrorType.TIMEOUT,
          message: '请求超时',
          originalError: error,
          statusCode: 0
        }
      }

      // 检查网络错误
      if (
        error.message.includes('network') ||
        error.message.includes('Network') ||
        error.message.includes('fetch') ||
        error.message.includes('Fetch')
      ) {
        return {
          type: AIErrorType.NETWORK,
          message: '网络连接错误',
          originalError: error,
          statusCode: 0
        }
      }

      return {
        type: AIErrorType.UNKNOWN,
        message: error.message || '未知错误',
        originalError: error,
        statusCode: 0
      }
    }

    // 如果是 HTTP 响应错误
    const errorObj = error as Record<string, unknown>
    if (errorObj.status || errorObj.statusCode) {
      const status = (errorObj.status || errorObj.statusCode) as number
      const errorMap = providerErrorMaps[provider] || providerErrorMaps.default
      const errorInfo = errorMap[status] || {
        type: AIErrorType.UNKNOWN,
        message: `HTTP ${status}: ${errorObj.statusText || '未知错误'}`
      }

      return {
        type: errorInfo.type,
        message: errorInfo.message,
        originalError: error,
        statusCode: status,
        errorData: errorObj.error || errorObj.data
      }
    }

    // 默认情况
    const errorLike = error as Partial<Error>
    return {
      type: AIErrorType.UNKNOWN,
      message: errorLike.message || '未知错误',
      originalError: error,
      statusCode: 0
    }
  }

  /**
   * 确定错误严重级别
   */
  static determineSeverity(errorType: AIErrorTypeValue, context: ErrorContext): ErrorSeverityValue {
    switch (errorType) {
      case AIErrorType.CANCELLED:
        return ErrorSeverity.LOW

      case AIErrorType.RATE_LIMIT:
      case AIErrorType.TIMEOUT:
        return ErrorSeverity.MEDIUM

      case AIErrorType.AUTHENTICATION:
      case AIErrorType.QUOTA_EXCEEDED:
        return ErrorSeverity.HIGH

      case AIErrorType.NETWORK:
        // 如果是关键操作且网络错误，则提高严重级别
        if (context.isCritical) {
          return ErrorSeverity.HIGH
        }
        return ErrorSeverity.MEDIUM

      case AIErrorType.SERVER_ERROR:
        return ErrorSeverity.HIGH

      default:
        return ErrorSeverity.MEDIUM
    }
  }

  /**
   * 构建用户友好的错误消息
   */
  static buildUserMessage(parsedError: ParsedError, provider: string, context: ErrorContext): string {
    let baseMessage = parsedError.message

    // 添加提供商信息
    const providerName = providerNames[provider] || provider

    // 根据错误类型添加建议
    let suggestion = ''
    const recovery = recoveryStrategies[parsedError.type]

    if (recovery && recovery.userAction) {
      suggestion = `建议：${recovery.userAction}`
    }

    // 构建完整消息
    let fullMessage = `${providerName}：${baseMessage}`
    if (suggestion) {
      fullMessage += `\n${suggestion}`
    }

    // 如果是认证错误，添加具体指导
    if (parsedError.type === AIErrorType.AUTHENTICATION) {
      fullMessage += '\n请前往设置页面检查并更新 API Key。'
    }

    // 如果是额度错误
    if (parsedError.type === AIErrorType.QUOTA_EXCEEDED) {
      fullMessage += '\n请检查 API 额度或考虑升级套餐。'
    }

    return fullMessage
  }

  /**
   * 记录错误日志
   */
  static logError(parsedError: ParsedError, provider: string, context: ErrorContext, severity: ErrorSeverityValue): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      provider,
      errorType: parsedError.type,
      severity,
      message: parsedError.message,
      statusCode: parsedError.statusCode,
      context,
      stack: (parsedError.originalError as Error)?.stack
    }

    // 根据严重级别决定日志级别
    if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
      console.error('🔴 AI 严重错误:', logEntry)
    } else if (severity === ErrorSeverity.MEDIUM) {
      console.warn('🟡 AI 警告:', logEntry)
    } else {
      console.log('🔵 AI 信息:', logEntry)
    }

    // 可以在这里添加错误上报逻辑
    // this.reportToMonitoring(logEntry)
  }

  /**
   * 检查是否应该重试
   */
  static shouldRetry(errorInfo: ErrorHandleResult, retryCount: number): boolean {
    if (!errorInfo.recovery || !errorInfo.recovery.retry) {
      return false
    }

    if (retryCount >= (errorInfo.recovery.maxRetries || 0)) {
      return false
    }

    // 某些错误类型不应该重试
    const noRetryTypes: AIErrorTypeValue[] = [
      AIErrorType.AUTHENTICATION,
      AIErrorType.QUOTA_EXCEEDED,
      AIErrorType.CANCELLED
    ]
    if (noRetryTypes.includes(errorInfo.type)) {
      return false
    }

    return true
  }

  /**
   * 获取重试延迟时间
   */
  static getRetryDelay(errorInfo: ErrorHandleResult, retryCount: number): number {
    if (!errorInfo.recovery || !errorInfo.recovery.retryDelay) {
      return 1000 // 默认 1 秒
    }

    // 指数退避
    const baseDelay = errorInfo.recovery.retryDelay
    return baseDelay * Math.pow(2, retryCount)
  }

  /**
   * 创建重试包装器
   */
  static createRetryWrapper<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    options: {
      maxRetries?: number
      onRetry?: (errorInfo: ErrorHandleResult, attempt: number, delay: number) => void
      onError?: (errorInfo: ErrorHandleResult, attempt: number) => void
      provider?: string
    } = {}
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    const { maxRetries = 3, onRetry = null, onError = null } = options

    return async function (...args: Parameters<T>): Promise<ReturnType<T>> {
      let lastError: unknown = null

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn(...args) as ReturnType<T>
        } catch (error) {
          lastError = error

          // 处理错误
          const errorInfo = this.handle(error, options.provider || 'unknown', {
            attempt,
            maxRetries,
            functionName: fn.name
          })

          // 调用错误回调
          if (onError) {
            onError(errorInfo, attempt)
          }

          // 检查是否应该重试
          if (!this.shouldRetry(errorInfo, attempt) || attempt === maxRetries) {
            throw errorInfo
          }

          // 获取重试延迟
          const delay = this.getRetryDelay(errorInfo, attempt)

          // 调用重试回调
          if (onRetry) {
            onRetry(errorInfo, attempt, delay)
          }

          console.log(`🔄 重试 ${attempt + 1}/${maxRetries}，等待 ${delay}ms...`)

          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      throw lastError
    }.bind(this)
  }

  /**
   * 获取错误统计
   */
  static getErrorStats(): {
    totalErrors: number
    byType: Record<string, number>
    byProvider: Record<string, number>
    recentErrors: ErrorHandleResult[]
  } {
    // 这里可以实现错误统计功能
    return {
      totalErrors: 0,
      byType: {},
      byProvider: {},
      recentErrors: []
    }
  }

  /**
   * 重置错误统计
   */
  static resetStats(): void {
    // 实现重置逻辑
  }
}

// 导出单例实例
export const aiErrorHandler = new AIErrorHandler()
