/**
 * 应用常量配置
 * 统一的常量定义，用于整个应用的配置
 */

// ============ API 提供商配置 ============

/** API 提供商标识 */
export const API_PROVIDERS = {
  DEEPSEEK: 'deepseek',
  OPENAI: 'openai',
  QWEN: 'qwen',
  CLAUDE: 'claude',
  KIMI: 'kimi',
  SILICONFLOW: 'siliconflow',
  OLLAMA: 'ollama',
  ZHIPU: 'zhipu',
  GEMINI: 'gemini',
  TENCENT: 'tencent'
} as const

export type ApiProvider = typeof API_PROVIDERS[keyof typeof API_PROVIDERS]

/** API 提供商详细信息 */
export interface ApiProviderConfig {
  name: string
  baseUrl: string
  models: Record<string, string>
}

export const API_PROVIDER_CONFIGS: Record<string, ApiProviderConfig> = {
  [API_PROVIDERS.DEEPSEEK]: {
    name: '深度求索',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    models: {
      'deepseek-chat': 'DeepSeek-V3',
      'deepseek-reasoner': 'DeepSeek-R1'
    }
  },
  [API_PROVIDERS.OPENAI]: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: {
      'gpt-4.1': 'GPT-4.1',
      'gpt-4.1-mini': 'GPT-4.1 Mini',
      'gpt-4.1-nano': 'GPT-4.1 Nano',
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'o3-mini': 'o3-mini'
    }
  },
  [API_PROVIDERS.CLAUDE]: {
    name: 'Claude',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    models: {
      'claude-opus-4-20250514': 'Claude Opus 4',
      'claude-sonnet-4-20250514': 'Claude Sonnet 4',
      'claude-haiku-3.5-20241022': 'Claude 3.5 Haiku'
    }
  },
  [API_PROVIDERS.QWEN]: {
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    models: {
      'qwen-max-latest': 'Qwen Max',
      'qwen-plus-latest': 'Qwen Plus',
      'qwen-turbo': 'Qwen Turbo',
      'qwen-long': 'Qwen Long'
    }
  },
  [API_PROVIDERS.KIMI]: {
    name: 'KimiAI',
    baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    models: {
      'kimi-k2-0711-preview': 'Kimi K2.5',
      'moonshot-v1-128k': 'Moonshot 128K',
      'moonshot-v1-32k': 'Moonshot 32K',
      'moonshot-v1-8k': 'Moonshot 8K'
    }
  },
  [API_PROVIDERS.SILICONFLOW]: {
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    models: {
      'Pro/zai-org/GLM-5': 'GLM-5',
      'deepseek-ai/DeepSeek-R1': 'DeepSeek-R1',
      'deepseek-ai/DeepSeek-V3': 'DeepSeek-V3',
      'Qwen/Qwen3-72B-Instruct': 'Qwen3-72B',
      'Qwen/Qwen3-32B-Instruct': 'Qwen3-32B',
      'meta-llama/Meta-Llama-3.1-70B-Instruct': 'Llama-3.1-70B'
    }
  },
  [API_PROVIDERS.OLLAMA]: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/api/chat',
    models: {
      'llama3.2': 'Llama 3.2',
      'llama3.1': 'Llama 3.1',
      'qwen3': 'Qwen 3',
      'qwen2.5': 'Qwen 2.5',
      'mistral': 'Mistral',
      'deepseek-r1': 'DeepSeek R1',
      'codegemma': 'CodeGemma'
    }
  },
  [API_PROVIDERS.ZHIPU]: {
    name: '智谱清言',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: {
      'glm-4-plus': 'GLM-4 Plus',
      'glm-4-air': 'GLM-4 Air',
      'glm-4-flash': 'GLM-4 Flash',
      'glm-4-long': 'GLM-4 Long'
    }
  },
  [API_PROVIDERS.GEMINI]: {
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/',
    models: {
      'gemini-2.5-pro-preview-05-06': 'Gemini 2.5 Pro',
      'gemini-2.0-flash': 'Gemini 2.0 Flash',
      'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite'
    }
  },
  [API_PROVIDERS.TENCENT]: {
    name: '腾讯混元',
    baseUrl: 'https://hunyuan.tencentcloudapi.com',
    models: {
      'hunyuan-turbos-latest': '混元 Turbo S',
      'hunyuan-pro-latest': '混元 Pro',
      'hunyandard': '混元标准版'
    }
  }
}

// ============ 主题配置 ============

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
} as const

export type ThemeMode = typeof THEMES[keyof typeof THEMES]

// ============ 消息角色配置 ============

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  TOOL: 'tool'
} as const

export type MessageRole = typeof MESSAGE_ROLES[keyof typeof MESSAGE_ROLES]

// ============ 功能模式配置 ============

export const FUNCTION_MODES = {
  NORMAL: 'normal',
  DEEP_THINKING: 'deep-thinking',
  WEB_SEARCH: 'web-search'
} as const

export type FunctionMode = typeof FUNCTION_MODES[keyof typeof FUNCTION_MODES]

// ============ 本地存储键名配置 ============

export const STORAGE_KEYS = {
  SETTINGS: 'aiAssistantSettings',
  CHAT_HISTORY: 'aiAssistantChatHistory',
  THEME: 'aiAssistantTheme',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
  SESSION_VISITED: 'hasVisitedPage'
} as const

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

// ============ API 请求配置 ============

export const API_CONFIG = {
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2000,
  MIN_TEMPERATURE: 0,
  MAX_TEMPERATURE: 2,
  MIN_TOKENS: 100,
  MAX_TOKENS: 8000,
  REQUEST_TIMEOUT: 60000, // 60 秒
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
} as const

// ============ 通知类型配置 ============

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]

// ============ 路由路径配置 ============

export const ROUTES = {
  HOME: '/',
  CHAT: '/chat',
  TRANSLATE: '/translate',
  CODE: '/code',
  WRITING: '/writing',
  ANALYSIS: '/analysis',
  AGENT: '/agent',
  SETTINGS: '/settings'
} as const

export type RoutePath = typeof ROUTES[keyof typeof ROUTES]

// ============ 导出格式配置 ============

export const EXPORT_FORMATS = {
  JSON: 'json',
  MARKDOWN: 'markdown',
  TEXT: 'text',
  HTML: 'html'
} as const

export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS]

// ============ 应用版本 ============

export const APP_VERSION = '2.0.0'
export const STORAGE_VERSION = '2.0.0'

// ============ 默认值配置 ============

export const DEFAULTS = {
  API_PROVIDER: API_PROVIDERS.DEEPSEEK,
  MODEL: 'deepseek-chat',
  TEMPERATURE: API_CONFIG.DEFAULT_TEMPERATURE,
  MAX_TOKENS: API_CONFIG.DEFAULT_MAX_TOKENS,
  THEME: THEMES.LIGHT,
  MAX_HISTORY_SIZE: 100,
  DEBOUNCE_MS: 300,
  ANIMATION_DURATION: 300
} as const
