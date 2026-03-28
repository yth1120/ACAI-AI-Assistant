/**
 * 安全相关工具函数
 * 提供加密、解密、验证等安全功能
 */

// 加密密钥（用于简单混淆）
const SECRET_KEY = 'acai-assistant-secret-key-2024'

/**
 * 简单的加密函数（Base64 编码 + 简单混淆）
 * 注意：这不是强加密，仅用于避免明文存储
 * @param text - 要加密的文本
 * @returns 加密后的文本
 */
export function encrypt(text: string): string {
  if (!text) return ''
  try {
    // 简单混淆：添加密钥前缀后 Base64 编码
    const mixed = btoa(encodeURIComponent(text))
    return SECRET_KEY.substring(0, 8) + '_' + mixed
  } catch (error) {
    console.error('加密失败:', error)
    return text
  }
}

/**
 * 解密函数
 * @param encryptedText - 加密的文本
 * @returns 解密后的文本
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  try {
    // 检查是否是旧版本（无密钥前缀）
    if (!encryptedText.includes('_')) {
      return decodeURIComponent(atob(encryptedText))
    }
    // 移除密钥前缀并解码
    const mixed = encryptedText.split('_')[1]
    return decodeURIComponent(atob(mixed))
  } catch (error) {
    console.error('解密失败:', error)
    return encryptedText
  }
}

/**
 * API 提供商类型
 */
export type ApiProvider = 'openai' | 'deepseek' | 'claude' | string

/**
 * 验证 API Key 格式
 * @param apiKey - API Key
 * @param provider - 提供商
 * @returns 是否有效
 */
export function validateApiKey(apiKey: string, provider: ApiProvider): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false
  if (apiKey.length < 10) return false

  // 根据不同提供商进行特定验证
  switch (provider) {
    case 'openai':
    case 'deepseek':
      return apiKey.startsWith('sk-')
    case 'claude':
      return apiKey.startsWith('sk-ant-')
    default:
      return true
  }
}

/**
 * 生成安全的随机字符串
 * @param length - 长度
 * @param includeSpecial - 是否包含特殊字符
 * @returns 随机字符串
 */
export function generateSecureRandom(length = 32, includeSpecial = false): string {
  const baseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const chars = includeSpecial ? baseChars + specialChars : baseChars

  const result: string[] = []
  const crypto = window.crypto || (window as any).msCrypto

  if (crypto && crypto.getRandomValues) {
    const values = new Uint32Array(length)
    crypto.getRandomValues(values)
    for (let i = 0; i < length; i++) {
      result.push(chars[values[i] % chars.length])
    }
  } else {
    // 降级方案
    for (let i = 0; i < length; i++) {
      result.push(chars[Math.floor(Math.random() * chars.length)])
    }
  }

  return result.join('')
}

/**
 * 安全字符串比较（避免时序攻击）
 * @param a - 字符串 A
 * @param b - 字符串 B
 * @returns 是否相等
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * 检查输入是否安全（XSS 防护）
 * @param input - 输入文本
 * @param options - 验证选项
 * @returns 是否安全
 */
export interface SafetyCheckOptions {
  maxLength?: number
  allowHtml?: boolean
  allowCode?: boolean
}

export function isSafeInput(input: string, options: SafetyCheckOptions = {}): boolean {
  const { maxLength = 10000, allowHtml = false, allowCode = false } = options

  if (!input || typeof input !== 'string') return false
  if (input.length > maxLength) return false

  // 如果不允许 HTML，检查危险标签
  if (!allowHtml) {
    const dangerousPatterns: RegExp[] = [
      /<script\b[^>]*>/i,
      /<\/script>/i,
      /javascript:/i,
      /data:text\/html/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        return false
      }
    }
  }

  // 检查特殊字符比例（防止注入攻击）
  if (!allowCode) {
    const specialChars = input.match(/[<>'"`{}[\]();&|\\]/g)
    if (specialChars && specialChars.length > input.length * 0.1) {
      return false
    }
  }

  return true
}

/**
 * 转义 HTML 特殊字符
 * @param text - 原始文本
 * @returns 转义后的文本
 */
export function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }

  return text.replace(/[&<>"'`=/]/g, char => escapeMap[char])
}

/**
 * 去除 HTML 标签
 * @param html - HTML 字符串
 * @returns 纯文本
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

/**
 * 安全地格式化消息内容（支持 Markdown）
 * @param content - 消息内容
 * @param options - 格式化选项
 * @returns 格式化后的安全 HTML
 */
export interface FormatMessageOptions {
  escapeHtml?: boolean
  allowCode?: boolean
  preserveLineBreaks?: boolean
}

export function formatMessageSafely(content: string, options: FormatMessageOptions = {}): string {
  const { escapeHtml: doEscape = true, allowCode = true, preserveLineBreaks = true } = options

  if (!content) return ''

  let result = content

  // 首先处理代码块（在转义之前）
  if (allowCode) {
    // 处理代码块（```language code ```）
    result = result.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      const encodedCode = escapeHtml(code.trim())
      const langClass = language ? ` class="language-${language}"` : ''
      return `<pre><code${langClass}>${encodedCode}</code></pre>`
    })

    // 处理行内代码
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>')
  }

  // 转义 HTML
  if (doEscape) {
    result = escapeHtml(result)
  }

  // 处理粗体
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // 处理斜体
  result = result.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // 保留换行
  if (preserveLineBreaks) {
    result = result.replace(/\n/g, '<br>')
  }

  return result
}

/**
 * 生成消息的哈希值（用于去重和验证）
 * 使用浏览器原生的 SubtleCrypto API
 * @param message - 消息内容
 * @returns 哈希值（16 进制字符串）
 */
export async function hashMessage(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 验证消息完整性
 * @param message - 消息内容
 * @param expectedHash - 期望的哈希值
 * @returns 是否匹配
 */
export async function verifyMessageIntegrity(message: string, expectedHash: string): Promise<boolean> {
  const actualHash = await hashMessage(message)
  return secureCompare(actualHash, expectedHash)
}

/**
 * 对敏感信息进行脱敏
 * @param data - 敏感数据
 * @param visibleChars - 两端保留的字符数
 * @returns 脱敏后的字符串
 */
export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (!data || data.length <= visibleChars * 2) return '***'

  const start = data.substring(0, visibleChars)
  const end = data.substring(data.length - visibleChars)
  return `${start}${'*'.repeat(Math.max(0, data.length - visibleChars * 2))}${end}`
}

/**
 * 清理潜在的 XSS 攻击内容
 * @param html - 可能不安全的 HTML
 * @returns 清理后的安全 HTML
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  // 移除 script 标签及其内容
  let sanitized = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  // 移除事件处理器
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')
  // 移除 javascript: 链接
  sanitized = sanitized.replace(/javascript:/gi, 'blocked:')

  return sanitized
}
