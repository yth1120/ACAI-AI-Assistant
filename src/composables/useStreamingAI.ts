import { ref, Ref } from 'vue'
import { aiService } from '@/services'
import { useNotification } from './useNotification'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface StreamRequestOptions {
  onChunk?: ((chunk: string, count: number) => void) | null
  onComplete?: ((output: string, count: number) => void) | null
  onError?: ((error: Error) => void) | null
  successMessage?: string
  errorMessage?: string
  requestId?: string | null
}

export interface UseStreamingAIReturn {
  isProcessing: Ref<boolean>
  output: Ref<string>
  sendStreamRequest: (prompt: string, options?: StreamRequestOptions) => Promise<string | undefined>
  reset: () => void
}

/**
 * 通用的流式 AI 请求 composable
 * 简化各个视图中的流式输出逻辑
 */
export function useStreamingAI(): UseStreamingAIReturn {
  const { error: showError, success } = useNotification()
  const isProcessing = ref<boolean>(false)
  const output = ref<string>('')

  /**
   * 发送流式请求
   * @param {string} prompt - 用户提示
   * @param {Object} options - 选项
   * @param {Function} options.onChunk - 每个数据块的回调
   * @param {Function} options.onComplete - 完成时的回调
   * @param {Function} options.onError - 错误时的回调
   * @param {string} options.successMessage - 成功消息
   * @param {string} options.errorMessage - 错误消息前缀
   * @param {string} options.requestId - 可选的请求 ID，用于取消特定请求
   */
  async function sendStreamRequest(
    prompt: string,
    options: StreamRequestOptions = {}
  ): Promise<string | undefined> {
    const {
      onChunk = null,
      onComplete = null,
      onError = null,
      successMessage = '处理完成！',
      errorMessage = '处理失败',
      requestId = null
    } = options

    if (isProcessing.value) {
      console.warn('⚠️ 已有请求在处理中')
      return
    }

    isProcessing.value = true
    output.value = ''

    const messages: Message[] = [{ role: 'user', content: prompt }]

    console.log('🚀 开始流式请求...')
    console.log('📝 提示词长度:', prompt.length)
    if (requestId) {
      console.log(`🔑 请求 ID: ${requestId}`)
    }

    let chunkCount = 0
    let startTime = Date.now()

    try {
      await aiService.sendMessage(
        messages,
        (chunk: string, count: number) => {
          chunkCount = count
          output.value += chunk

          // 调用自定义回调
          if (onChunk && typeof onChunk === 'function') {
            onChunk(chunk, chunkCount)
          }

          // 每 50 个数据块打印一次日志，避免过多日志
          if (chunkCount % 50 === 0) {
            console.log(`📨 已收到 ${chunkCount} 个数据块...`)
          }
        },
        requestId
      )

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`✅ 流式响应完成`)
      console.log(
        `📊 统计：共 ${chunkCount} 个数据块，总长度 ${output.value.length} 字符，耗时 ${duration}s`
      )

      if (chunkCount === 0) {
        console.warn('⚠️ 警告：没有收到任何流式数据块！')
      }

      success(successMessage)

      // 调用完成回调
      if (onComplete && typeof onComplete === 'function') {
        onComplete(output.value, chunkCount)
      }

      return output.value
    } catch (err) {
      // 使用统一的错误处理
      let errorMsg = errorMessage
      let errorDetail = ''

      if ((err as Error & { userMessage?: string }).userMessage) {
        // 如果是处理过的错误
        errorMsg = (err as Error & { userMessage?: string }).userMessage!
        errorDetail = (err as Error).message
      } else {
        errorMsg = `${errorMessage}: ${(err as Error).message}`
      }

      output.value = `❌ ${errorMsg}`
      showError(errorMsg)
      console.error('❌ 请求失败:', err)

      // 调用错误回调
      if (onError && typeof onError === 'function') {
        onError(err as Error)
      }

      throw err
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 重置输出
   */
  function reset(): void {
    output.value = ''
    isProcessing.value = false
  }

  return {
    isProcessing,
    output,
    sendStreamRequest,
    reset
  }
}
