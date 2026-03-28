/**
 * AI 请求构建工具
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
  [key: string]: unknown
}

// API 配置接口
export interface APIConfig {
  baseUrl: string
  [key: string]: unknown
}

/**
 * 构建 API 请求体
 * @param settingsStore - 设置 store
 * @param messages - 消息数组
 * @param streamMode - 是否流式输出
 * @returns 请求体对象
 */
export function buildRequestBody(
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
export function buildHeaders(settingsStore: SettingsStore): Record<string, string> {
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
 * 构建 API 请求 URL
 * @param config - API 配置
 * @param settingsStore - 设置 store
 * @returns 请求 URL
 */
export function buildRequestUrl(config: APIConfig, settingsStore: SettingsStore): string {
  let url = config.baseUrl
  if (settingsStore.apiProvider === 'gemini') {
    url = `${config.baseUrl}${settingsStore.model}:generateContent?key=${settingsStore.apiKey}`
  }
  return url
}

export default {
  buildRequestBody,
  buildHeaders,
  buildRequestUrl
}
