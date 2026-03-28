/**
 * AI 服务工厂
 * 根据提供商创建对应的 AI 服务实例
 */

import OpenAICompatibleProvider from './providers/openaiCompatible'
import ClaudeProvider from './providers/claude'
import GeminiProvider from './providers/gemini'
import QwenProvider from './providers/qwen'
import OllamaProvider from './providers/ollama'

// AI 提供商基类接口
export interface BaseAIProvider {
  sendMessage(
    messages: Array<{ role: string; content: string }>,
    settingsStore: unknown,
    onChunk?: ((chunk: string) => void) | null
  ): Promise<string>
  cancelRequest(): void
  preprocessMessages?(
    messages: Array<{ role: string; content: string }>,
    settingsStore: unknown
  ): Array<{ role: string; content: string }>
}

// 提供商类型
export type ProviderType =
  | 'deepseek'
  | 'openai'
  | 'claude'
  | 'qwen'
  | 'kimi'
  | 'siliconflow'
  | 'zhipu'
  | 'gemini'
  | 'ollama'
  | 'tencent'

/**
 * 创建 AI 服务实例
 * @param provider - 提供商标识
 * @returns AI 服务实例
 */
export function createAIProvider(provider: ProviderType): BaseAIProvider {
  switch (provider) {
    case 'claude':
      return new ClaudeProvider()
    case 'gemini':
      return new GeminiProvider()
    case 'qwen':
      return new QwenProvider()
    case 'ollama':
      return new OllamaProvider()
    case 'deepseek':
    case 'openai':
    case 'kimi':
    case 'siliconflow':
    case 'zhipu':
    case 'tencent':
    default:
      // 默认使用 OpenAI 兼容提供商
      return new OpenAICompatibleProvider()
  }
}

/**
 * 获取所有支持的提供商列表
 * @returns 提供商列表
 */
export function getSupportedProviders(): ProviderType[] {
  return [
    'deepseek',
    'openai',
    'claude',
    'qwen',
    'kimi',
    'siliconflow',
    'zhipu',
    'gemini',
    'ollama',
    'tencent'
  ]
}

export default {
  createAIProvider,
  getSupportedProviders
}
