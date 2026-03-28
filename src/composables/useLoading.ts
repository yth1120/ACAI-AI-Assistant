/**
 * 加载状态管理 Composable
 */
import { ref } from 'vue'

export interface UseLoadingReturn {
  isLoading: Ref<boolean>
  loadingText: Ref<string>
  startLoading: (text?: string) => void
  stopLoading: () => void
  withLoading: <T>(asyncFn: () => Promise<T>, text?: string) => Promise<T>
}

export function useLoading(initialState: boolean = false): UseLoadingReturn {
  const isLoading = ref<boolean>(initialState)
  const loadingText = ref<string>('加载中...')

  /**
   * 开始加载
   * @param {string} text - 加载提示文本
   */
  function startLoading(text: string = '加载中...'): void {
    isLoading.value = true
    loadingText.value = text
  }

  /**
   * 停止加载
   */
  function stopLoading(): void {
    isLoading.value = false
  }

  /**
   * 包装异步函数，自动管理加载状态
   * @param {Function} asyncFn - 异步函数
   * @param {string} text - 加载提示文本
   * @returns {Promise<*>} 异步函数的返回值
   */
  async function withLoading<T>(asyncFn: () => Promise<T>, text: string = '处理中...'): Promise<T> {
    try {
      startLoading(text)
      return await asyncFn()
    } finally {
      stopLoading()
    }
  }

  return {
    isLoading,
    loadingText,
    startLoading,
    stopLoading,
    withLoading
  }
}
