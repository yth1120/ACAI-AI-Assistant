/**
 * AI 响应解析工具
 */

// 消息接口
export interface Message {
  role: string
  content: string
}

/**
 * 过滤内容中的特殊符号
 * @param content - 原始内容
 * @returns 过滤后的内容
 */
export function sanitizeContent(content: string): string {
  if (!content) return ''

  return content
    // 移除 Markdown 标题符号
    .replace(/^#+\s*/gm, '')
    // 移除粗体和斜体符号
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/___([^_]+)___/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // 移除行内代码符号
    .replace(/`([^`]+)`/g, '$1')
    // 移除代码块符号
    .replace(/```[\s\S]*?```/g, (match) => {
      // 保留代码块内容，只去掉 ```
      return match.replace(/```(\w+)?\n?/g, '').replace(/```$/, '')
    })
    // 移除链接格式 [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 移除图片格式 ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // 移除 HTML 标签
    .replace(/<[^>]+>/g, '')
    // 移除分隔线
    .replace(/^-{3,}$/gm, '')
    .replace(/^\*{3,}$/gm, '')
    // 移除引用符号
    .replace(/^>\s*/gm, '')
    // 移除无序列表符号
    .replace(/^[-*+]\s+/gm, '')
    // 移除有序列表符号
    .replace(/^\d+\.\s+/gm, '')
    // 移除转义反斜杠
    .replace(/\\([`*_{}[\]()#+\-.!])/g, '$1')
}

/**
 * 从响应数据中提取内容
 * @param data - API 响应数据
 * @param provider - 提供商标识
 * @returns 提取的内容
 */
export function extractContent(data: Record<string, unknown> | null, provider: string): string {
  if (!data) return ''

  try {
    switch (provider) {
      case 'claude': {
        const content = data.content as Array<{ text?: string }> | undefined
        return sanitizeContent(content?.[0]?.text || '')
      }
      case 'gemini': {
        const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined
        return sanitizeContent(candidates?.[0]?.content?.parts?.[0]?.text || '')
      }
      default: {
        const choices = data.choices as Array<{ message?: { content?: string } }> | undefined
        return sanitizeContent(choices?.[0]?.message?.content || '')
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

// 定义类型别名以避免 esbuild 解析问题
interface StreamChoice {
  delta?: {
    content?: string
  }
}

export function extractStreamContent(data: Record<string, unknown>, provider: string): string {
  if (!data) return ''

  try {
    // Claude 格式（特殊处理）
    if (provider === 'claude') {
      // Claude 流式响应格式
      if (data.type === 'content_block_delta') {
        const delta = data.delta as { text?: string } | undefined
        return sanitizeContent(delta?.text || '')
      }
      if (data.type === 'content_block_start') {
        const contentBlock = data.content_block as { text?: string } | undefined
        return sanitizeContent(contentBlock?.text || '')
      }
      // 兼容旧格式
      const content = data.content as Array<{ text?: string }> | undefined
      if (content?.[0]?.text) {
        return sanitizeContent(content[0].text)
      }
      const delta = data.delta as { text?: string } | undefined
      if (delta?.text) {
        return sanitizeContent(delta.text)
      }
      return ''
    }

    // Gemini 格式
    if (provider === 'gemini') {
      const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined
      if (candidates?.[0]?.content?.parts?.[0]?.text) {
        return sanitizeContent(candidates[0].content.parts[0].text)
      }
      return ''
    }

    // OpenAI/DeepSeek/Kimi/SiliconFlow/Zhipu 等兼容 OpenAI 格式的 API
    const choices = data.choices as StreamChoice[] | undefined
    if (choices?.[0]?.delta?.content) {
      return sanitizeContent(choices[0].delta.content)
    }

    // Qwen 格式
    const output = data.output as { text?: string } | undefined
    if (output?.text) {
      return sanitizeContent(output.text)
    }

    return ''
  } catch (error) {
    console.error('提取流式内容失败:', error, 'provider:', provider)
    return ''
  }
}

export default {
  extractContent,
  extractStreamContent
}
