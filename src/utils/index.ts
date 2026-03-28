/**
 * 工具函数集合
 * 提供常用的工具函数，支持链式调用和组合使用
 */

// ============ 函数控制 ============

/**
 * 防抖函数 - 在最后一次调用后延迟执行
 * @param func - 要防抖的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined
  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数 - 限制函数在指定时间内只执行一次
 * @param func - 要节流的函数
 * @param limit - 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit = 300
): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastArgs: Parameters<T> | null = null
  let shouldCallAgain = false

  const execute = () => {
    func(...(lastArgs as Parameters<T>))
    inThrottle = false
    if (shouldCallAgain) {
      shouldCallAgain = false
      lastArgs = null
      throttledFunction()
    }
  }

  const throttledFunction = function executedFunction(this: unknown, ...args: Parameters<T>) {
    lastArgs = args
    if (!inThrottle) {
      inThrottle = true
      func(...args)
      setTimeout(execute, limit)
    } else {
      shouldCallAgain = true
    }
  }

  return throttledFunction
}

// ============ 日期格式化 ============

/**
 * 日期格式化选项
 */
export type DateFormatPattern = string

/**
 * 格式化日期时间
 * @param date - 日期对象、字符串或时间戳
 * @param format - 格式化模板 (默认：'YYYY-MM-DD HH:mm:ss')
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string | number, format = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Invalid Date'

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化相对时间（如：3 分钟前、1 小时前）
 * @param date - 日期对象、字符串或时间戳
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = Date.now()
  const diff = now - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  if (seconds > 0) return `${seconds}秒前`
  return '刚刚'
}

// ============ 剪贴板操作 ============

/**
 * 复制文本到剪贴板
 * @param text - 要复制的文本
 * @returns 是否成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 降级方案
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    } catch {
      return false
    }
  }
}

// ============ JSON 处理 ============

/**
 * 安全地解析 JSON
 * @param jsonString - JSON 字符串
 * @param defaultValue - 解析失败时的默认值
 * @returns 解析结果或默认值
 */
export function safeJsonParse<T = unknown>(jsonString: string, defaultValue: T | null = null): T | null {
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return defaultValue
  }
}

/**
 * 安全地字符串化对象
 * @param obj - 要字符串化的对象
 * @param defaultValue - 失败时的默认值
 * @returns JSON 字符串或默认值
 */
export function safeJsonStringify<T = unknown>(obj: unknown, defaultValue: string | null = null): string | null {
  try {
    return JSON.stringify(obj)
  } catch {
    return defaultValue
  }
}

// ============ ID 生成 ============

/**
 * 生成唯一 ID
 * @param prefix - ID 前缀（可选）
 * @returns 唯一 ID
 */
export function generateId(prefix = ''): string {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 11)
  return prefix ? `${prefix}_${id}` : id
}

// ============ 文本格式化 ============

/**
 * 格式化 Markdown 文本为 HTML（简易版本）
 * @param text - Markdown 文本
 * @returns HTML 字符串
 */
export function formatMarkdown(text: string): string {
  if (!text) return ''

  return (
    text
      // 代码块
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // 行内代码
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // 粗体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // 换行
      .replace(/\n/g, '<br>')
  )
}

/**
 * 截断文本
 * @param text - 文本
 * @param maxLength - 最大长度
 * @param suffix - 后缀
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength = 100, suffix = '...'): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * 去除 HTML 标签
 * @param html - HTML 字符串
 * @returns 纯文本
 */
export function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

// ============ 验证函数 ============

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
 * 检查是否为有效的 URL
 * @param url - URL 字符串
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 检查是否为有效的邮箱
 * @param email - 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// ============ 对象工具 ============

/**
 * 深度克隆对象
 * @param obj - 要克隆的对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (obj instanceof Object) {
    const clonedObj: Record<string, unknown> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone((obj as Record<string, unknown>)[key])
      }
    }
    return clonedObj as T
  }
  return obj
}

/**
 * 深度合并对象
 * @param target - 目标对象
 * @param sources - 源对象数组
 * @returns 合并后的对象
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, ...sources: Array<Partial<T>>): T {
  const result = deepClone(target)

  for (const source of sources) {
    if (!source || typeof source !== 'object') continue

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key]
        const targetValue = (result as Record<string, unknown>)[key]

        if (
          sourceValue &&
          typeof sourceValue === 'object' &&
          targetValue &&
          typeof targetValue === 'object'
        ) {
          ;(result as Record<string, unknown>)[key] = deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>
          )
        } else {
          ;(result as Record<string, unknown>)[key] = sourceValue
        }
      }
    }
  }

  return result
}

// ============ 延迟控制 ============

/**
 * 延迟执行
 * @param ms - 延迟时间（毫秒）
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 带超时的 Promise
 * @param promise - 原始 Promise
 * @param timeout - 超时时间（毫秒）
 * @param errorMessage - 超时错误消息
 * @returns 带超时的 Promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeout))
  ])
}

// ============ 数组工具 ============

/**
 * 数组去重
 * @param arr - 数组
 * @param keyFn - 用于比较的函数（可选）
 * @returns 去重后的数组
 */
export function uniqueArray<T>(arr: T[], keyFn?: (item: T) => unknown): T[] {
  if (!keyFn) {
    return Array.from(new Set(arr))
  }
  const seen = new Set<unknown>()
  return arr.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * 数组分块
 * @param arr - 数组
 * @param size - 每块大小
 * @returns 分块后的二维数组
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

// ============ 数字工具 ============

/**
 * 限制数字范围
 * @param num - 数字
 * @param min - 最小值
 * @param max - 最大值
 * @returns 限制后的数字
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max)
}

/**
 * 格式化数字为千分位
 * @param num - 数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}
