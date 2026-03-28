/**
 * 流式响应处理器
 */

import { extractStreamContent } from './responseParser'

/**
 * 处理流式响应
 * @param response - Fetch 响应对象
 * @param onChunk - 数据块回调
 * @param provider - API 提供商
 * @returns 完整响应内容
 */
export async function handleStreamResponse(
  response: Response,
  onChunk: (chunk: string) => void,
  provider: string
): Promise<string> {
  if (!response.body) {
    throw new Error('响应体为空')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''
  let buffer = '' // 用于保存不完整的行

  console.log('🔄 开始处理流式响应...', '提供商:', provider)

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        console.log('✅ 流读取完成，总内容长度:', fullContent.length)
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
            console.log('📝 收到流式响应结束标记')
            continue
          }

          try {
            const parsed = JSON.parse(data) as Record<string, unknown>
            const content = extractStreamContent(parsed, provider)
            if (content) {
              fullContent += content
              console.log(
                '💬 流式内容片段:',
                content.substring(0, 50) + (content.length > 50 ? '...' : '')
              )
              if (onChunk && typeof onChunk === 'function') {
                onChunk(content)
              }
            }
          } catch (e) {
            // 跳过无效的 JSON，可能是不完整的数据
            console.debug('跳过无效数据:', data.substring(0, 50))
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
            const content = extractStreamContent(parsed, provider)
            if (content) {
              fullContent += content
              if (onChunk && typeof onChunk === 'function') {
                onChunk(content)
              }
            }
          } catch (e) {
            console.debug('缓冲区数据解析失败')
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  console.log('✅ 流式响应处理完成，总长度:', fullContent.length)
  return fullContent
}

export default {
  handleStreamResponse
}
