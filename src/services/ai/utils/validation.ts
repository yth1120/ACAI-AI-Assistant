/**
 * AI 请求验证工具
 */

// 消息接口
export interface Message {
  role: string
  content: string
}

// 设置 Store 类型
export interface SettingsStore {
  apiKey: string
  apiProvider: string
  currentConfig: APIConfig | null
  [key: string]: unknown
}

// API 配置接口
export interface APIConfig {
  baseUrl: string
  [key: string]: unknown
}

/**
 * 验证请求参数
 * @param settingsStore - 设置 store
 * @param messages - 消息数组
 * @throws 参数验证失败
 */
export function validateRequest(settingsStore: SettingsStore, messages: Message[]): void {
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
 * 验证 API Key 格式
 * @param apiKey - API Key
 * @param provider - API 提供商
 * @returns 是否有效
 */
export function validateApiKey(apiKey: string | null | undefined, provider: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }

  // 去除空格
  const trimmedKey = apiKey.trim()

  // 通用验证：长度至少为 10 个字符
  if (trimmedKey.length < 10) {
    return false
  }

  // 提供商特定验证
  switch (provider) {
    case 'deepseek':
      // DeepSeek API Key 通常以'sk-'开头
      return trimmedKey.startsWith('sk-')
    case 'openai':
      // OpenAI API Key 通常以'sk-'开头
      return trimmedKey.startsWith('sk-')
    case 'claude':
      // Claude API Key 通常以'sk-ant-'开头
      return trimmedKey.startsWith('sk-ant-')
    case 'qwen':
      // 通义千问 API Key 通常以'sk-'开头
      return trimmedKey.startsWith('sk-')
    case 'kimi':
      // Kimi API Key 通常以'sk-'开头
      return trimmedKey.startsWith('sk-')
    case 'zhipu':
      // 智谱清言 API Key 通常包含'.'
      return trimmedKey.includes('.')
    case 'gemini':
      // Gemini API Key 通常以'AIza'开头
      return trimmedKey.startsWith('AIza')
    case 'ollama':
      // Ollama 本地运行，不需要 API Key 验证
      return true
    default:
      // 其他提供商：基本格式验证
      return trimmedKey.length >= 10
  }
}

export default {
  validateRequest,
  validateApiKey
}
