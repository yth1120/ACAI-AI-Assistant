/**
 * 复制功能 Composable
 */
import { copyToClipboard } from '@/utils'
import { useNotification } from './useNotification'

export interface UseCopyReturn {
  copy: (text: string, successMessage?: string, errorMessage?: string) => Promise<boolean>
}

export function useCopy(): UseCopyReturn {
  const { success, error } = useNotification()

  /**
   * 复制文本
   * @param {string} text - 要复制的文本
   * @param {string} successMessage - 成功提示
   * @param {string} errorMessage - 失败提示
   * @returns {Promise<boolean>} 是否成功
   */
  async function copy(
    text: string,
    successMessage: string = '已复制到剪贴板',
    errorMessage: string = '复制失败，请重试'
  ): Promise<boolean> {
    if (!text) {
      error('没有可复制的内容')
      return false
    }

    const result = await copyToClipboard(text)

    if (result) {
      success(successMessage)
    } else {
      error(errorMessage)
    }

    return result
  }

  return {
    copy
  }
}
