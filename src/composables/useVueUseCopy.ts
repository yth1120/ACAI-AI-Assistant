/**
 * 基于 VueUse 的复制功能
 * 使用@vueuse/core 的 useClipboard
 */

import { useClipboard, usePermission } from '@vueuse/core'
import { useNotification } from './useNotification'
import { Ref } from 'vue'

export interface UseCopyReturn {
  copy: (
    textToCopy: string,
    successMessage?: string,
    errorMessage?: string
  ) => Promise<boolean>
  copyHtml: (html: string, plainText?: string) => Promise<boolean>
  copyJson: (data: Record<string, unknown>, formatted?: boolean) => Promise<boolean>
  copyCode: (code: string, language?: string) => Promise<boolean>
  isSupported: Ref<boolean>
  permission: Ref<string | null>
  currentText: Ref<string>
}

export function useCopy(): UseCopyReturn {
  const { success, error } = useNotification()

  // 使用 VueUse 的剪贴板功能
  const { copy: vueUseCopy, isSupported, text } = useClipboard()

  // 检查剪贴板权限
  const permission = usePermission('clipboard-write')

  /**
   * 复制文本
   * @param {string} text - 要复制的文本
   * @param {string} successMessage - 成功提示
   * @param {string} errorMessage - 失败提示
   * @returns {Promise<boolean>} 是否成功
   */
  async function copy(
    textToCopy: string,
    successMessage: string = '已复制到剪贴板',
    errorMessage: string = '复制失败，请重试'
  ): Promise<boolean> {
    if (!textToCopy) {
      error('没有可复制的内容')
      return false
    }

    // 检查浏览器支持
    if (!isSupported.value) {
      error('您的浏览器不支持剪贴板 API')
      return false
    }

    // 检查权限
    if (permission.value !== 'granted' && permission.value !== 'prompt') {
      console.warn('剪贴板写入权限:', permission.value)
    }

    try {
      await vueUseCopy(textToCopy)

      // 验证是否复制成功
      if (text.value === textToCopy) {
        success(successMessage)
        return true
      } else {
        error(errorMessage)
        return false
      }
    } catch (err) {
      console.error('复制失败:', err)
      error(errorMessage)
      return false
    }
  }

  /**
   * 复制富文本（HTML 格式）
   * @param {string} html - HTML 内容
   * @param {string} plainText - 纯文本回退
   * @returns {Promise<boolean>} 是否成功
   */
  async function copyHtml(html: string, plainText?: string): Promise<boolean> {
    try {
      // 创建临时元素
      const tempElement = document.createElement('div')
      tempElement.innerHTML = html

      // 使用 Clipboard API
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText || html], { type: 'text/plain' })
      })

      await navigator.clipboard.write([clipboardItem])
      success('富文本已复制到剪贴板')
      return true
    } catch (err) {
      console.error('富文本复制失败，回退到纯文本:', err)
      // 回退到纯文本复制
      return copy(plainText || html, '文本已复制到剪贴板', '复制失败')
    }
  }

  /**
   * 复制 JSON 数据
   * @param {object} data - JSON 数据
   * @param {boolean} formatted - 是否格式化
   * @returns {Promise<boolean>} 是否成功
   */
  async function copyJson(
    data: Record<string, unknown>,
    formatted: boolean = true
  ): Promise<boolean> {
    try {
      const jsonString = formatted
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data)

      return copy(jsonString, 'JSON 数据已复制到剪贴板', 'JSON 复制失败')
    } catch (err) {
      console.error('JSON 复制失败:', err)
      error('JSON 数据复制失败')
      return false
    }
  }

  /**
   * 复制代码片段
   * @param {string} code - 代码内容
   * @param {string} language - 编程语言
   * @returns {Promise<boolean>} 是否成功
   */
  async function copyCode(code: string, language: string = ''): Promise<boolean> {
    const codeWithLanguage = language ? `// ${language}\n${code}` : code
    return copy(codeWithLanguage, '代码已复制到剪贴板', '代码复制失败')
  }

  return {
    copy,
    copyHtml,
    copyJson,
    copyCode,
    isSupported,
    permission,
    currentText: text
  }
}
