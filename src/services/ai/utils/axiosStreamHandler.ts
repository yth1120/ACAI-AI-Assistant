/**
 * 基于 axios 和 eventsource-parser 的流式响应处理器
 */

import { createParser } from 'eventsource-parser'
import { extractStreamContent } from './responseParser'

/**
 * 处理 axios 流式响应
 * @param response - axios 响应对象
 * @param onChunk - 数据块回调
 * @param provider - API 提供商
 * @returns 完整响应内容
 */
export async function handleAxiosStreamResponse(
  response: Record<string, unknown>,
  onChunk: (chunk: string) => void,
  provider: string
): Promise<string> {
  if (!response.data) {
    throw new Error('响应体为空')
  }

  // 检查是否在浏览器环境中
  const isBrowser = typeof window !== 'undefined'

  let fullContent = ''

  console.debug('🔄 开始处理 axios 流式响应...', '提供商:', provider, '环境:', isBrowser ? '浏览器' : 'Node.js')

  // 调试信息：打印响应数据类型
  console.debug('🔍 响应数据类型:', typeof response.data)
  console.debug('🔍 响应数据内容:', response.data?.toString().substring(0, 200) + '...')
  console.debug('🔍 响应对象结构:', {
    hasData: !!response.data,
    dataType: response.data?.constructor?.name,
    hasOn: response.data && typeof response.data.on === 'function',
    hasGetReader: response.data && typeof response.data.getReader === 'function',
    isString: typeof response.data === 'string'
  })

  // 如果是文本响应，直接处理 SSE 格式
  if (isBrowser && typeof response.data === 'string') {
    console.debug('🔄 检测到文本响应，按 SSE 格式处理')
    return handleTextResponse(response.data, onChunk, provider)
  }

  if (isBrowser) {
    // 浏览器环境：检查是 ReadableStream (Web API) 还是 NodeJS 流
    const data = response.data

    // 检查是否是 NodeJS 流
    if (data && typeof data === 'object' && 'on' in data && typeof data.on === 'function') {
      // Node.js 流（在浏览器环境中使用 axios responseType: 'stream' 时）
      console.debug('🔄 检测到 Node.js 流（浏览器环境）')
      return handleNodeJSStream(data, onChunk, provider)
    }

    // 检查是否是 Web API ReadableStream
    if (data && typeof data === 'object' && typeof data.getReader === 'function') {
      console.debug('🔄 检测到 Web API ReadableStream')
      const stream = data as ReadableStream<Uint8Array>

      return new Promise(async (resolve, reject) => {
        try {
          const reader = stream.getReader()
          const decoder = new TextDecoder()
          const parser = createParser((event) => {
            if (event.type === 'event') {
              const data = event.data

              // 跳过结束标记
              if (data === '[DONE]') {
                console.debug('📝 收到流式响应结束标记')
                return
              }

              try {
                const parsed = JSON.parse(data) as Record<string, unknown>
                const content = extractStreamContent(parsed, provider)

                if (content) {
                  fullContent += content
                  console.debug(
                    '💬 流式内容片段:',
                    content.substring(0, 50) + (content.length > 50 ? '...' : '')
                  )

                  if (onChunk && typeof onChunk === 'function') {
                    onChunk(content)
                  }
                }
              } catch (e) {
                console.debug('跳过无效数据:', data.substring(0, 50))
              }
            }
          })

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                console.debug('✅ 流式响应处理完成，总长度:', fullContent.length)
                resolve(fullContent)
                break
              }

              const text = decoder.decode(value)
              parser.feed(text)
            }
          } catch (error) {
            console.error('❌ 读取流时出错:', error)
            reject(new Error(`读取流时出错：${error.message}`))
          } finally {
            reader.releaseLock()
          }
        } catch (error) {
          console.error('❌ 处理浏览器流时出错:', error)
          reject(new Error(`处理浏览器流时出错：${error.message}`))
        }
      })
    }

    throw new Error(`不支持的响应类型。数据类型: ${typeof data}, 数据结构: ${data ? data.constructor?.name : 'null'}`)
  }

  /**
   * 处理文本响应（SSE 格式）
   */
  function handleTextResponse(
    data: string,
    onChunk: (chunk: string) => void,
    provider: string
  ): Promise<string> {
    let fullContent = ''

    console.debug('🔄 开始处理 SSE 文本响应...')

    return new Promise((resolve, reject) => {
      try {
        const lines = data.split('\n')
        let buffer = ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              console.debug('📝 收到流式响应结束标记')
              continue
            }

            try {
              const parsed = JSON.parse(data) as Record<string, unknown>
              const content = extractStreamContent(parsed, provider)

              if (content) {
                fullContent += content
                console.debug(
                  '💬 流式内容片段:',
                  content.substring(0, 50) + (content.length > 50 ? '...' : '')
                )

                if (onChunk && typeof onChunk === 'function') {
                  onChunk(content)
                }
              }
            } catch (e) {
              console.debug('跳过无效数据:', data.substring(0, 50))
            }
          }
        }

        console.debug('✅ SSE 文本处理完成，总长度:', fullContent.length)
        resolve(fullContent)
      } catch (error) {
        console.error('❌ 处理 SSE 文本时出错:', error)
        reject(new Error(`处理 SSE 文本时出错：${error.message}`))
      }
    })
  }

  /**
   * 处理 NodeJS 流（在浏览器环境中）
   */
  function handleNodeJSStream(
    stream: NodeJS.ReadableStream,
    onChunk: (chunk: string) => void,
    provider: string
  ): Promise<string> {
    let fullContent = ''

    return new Promise((resolve, reject) => {
      const parser = createParser((event) => {
        if (event.type === 'event') {
          const data = event.data

          // 跳过结束标记
          if (data === '[DONE]') {
            console.debug('📝 收到流式响应结束标记')
            return
          }

          try {
            const parsed = JSON.parse(data) as Record<string, unknown>
            const content = extractStreamContent(parsed, provider)

            if (content) {
              fullContent += content
              console.debug(
                '💬 流式内容片段:',
                content.substring(0, 50) + (content.length > 50 ? '...' : '')
              )

              if (onChunk && typeof onChunk === 'function') {
                onChunk(content)
              }
            }
          } catch (e) {
            console.debug('跳过无效数据:', data.substring(0, 50))
          }
        }
      })

      stream.on('error', (error) => {
        console.error('❌ Node.js 流错误:', error)
        reject(new Error(`Node.js 流错误：${error.message}`))
      })

      stream.on('data', (chunk: Buffer) => {
        try {
          parser.feed(chunk.toString())
        } catch (error) {
          console.error('❌ 解析器错误:', error)
          reject(new Error(`解析器错误：${error.message}`))
        }
      })

      stream.on('end', () => {
        console.debug('✅ Node.js 流处理完成，总长度:', fullContent.length)
        resolve(fullContent)
      })

      stream.on('close', () => {
        console.debug('🔒 Node.js 流已关闭')
      })
    })
  }

  if (!isBrowser) {
    // Node.js 环境：使用原来的处理方式
    const stream = response.data as NodeJS.ReadableStream

    return new Promise((resolve, reject) => {
      // 创建 eventsource 解析器
      const parser = createParser((event) => {
        if (event.type === 'event') {
          const data = event.data

          // 跳过结束标记
          if (data === '[DONE]') {
            console.debug('📝 收到流式响应结束标记')
            return
          }

          try {
            const parsed = JSON.parse(data) as Record<string, unknown>
            const content = extractStreamContent(parsed, provider)

            if (content) {
              fullContent += content
              console.debug(
                '💬 流式内容片段:',
                content.substring(0, 50) + (content.length > 50 ? '...' : '')
              )

              if (onChunk && typeof onChunk === 'function') {
                onChunk(content)
              }
            }
          } catch (e) {
            console.debug('跳过无效数据:', data.substring(0, 50))
          }
        }
      })

      // 错误处理
      stream.on('error', (error) => {
        console.error('❌ 流式响应错误:', error)
        reject(new Error(`流式响应错误：${error.message}`))
      })

      // 数据接收
      stream.on('data', (chunk: Buffer) => {
        try {
          parser.feed(chunk.toString())
        } catch (error) {
          console.error('❌ 解析器错误:', error)
          reject(new Error(`解析器错误：${error.message}`))
        }
      })

      // 流结束
      stream.on('end', () => {
        console.debug('✅ 流式响应处理完成，总长度:', fullContent.length)
        resolve(fullContent)
      })

      // 流关闭
      stream.on('close', () => {
        console.debug('🔒 流已关闭')
      })
    })
  }
}

/**
 * 处理文本流响应（非 SSE 格式）
 * @param response - axios 响应对象
 * @param onChunk - 数据块回调
 * @returns 完整响应内容
 */
export async function handleTextStreamResponse(
  response: Record<string, unknown>,
  onChunk: (chunk: string) => void
): Promise<string> {
  if (!response.data) {
    throw new Error('响应体为空')
  }

  const stream = response.data as NodeJS.ReadableStream
  let fullContent = ''

  console.debug('🔄 开始处理文本流式响应...')

  return new Promise((resolve, reject) => {
    // 错误处理
    stream.on('error', (error) => {
      console.error('❌ 文本流错误:', error)
      reject(new Error(`文本流错误：${error.message}`))
    })

    // 数据接收
    stream.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      fullContent += text

      if (onChunk && typeof onChunk === 'function') {
        onChunk(text)
      }
    })

    // 流结束
    stream.on('end', () => {
      console.debug('✅ 文本流处理完成，总长度:', fullContent.length)
      resolve(fullContent)
    })
  })
}

export default {
  handleAxiosStreamResponse,
  handleTextStreamResponse
}
