/**
 * 全局快捷键管理 Composable
 */
import { onMounted, onUnmounted } from 'vue'

const registeredShortcuts = new Map<string, (event: KeyboardEvent) => void>()

export interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description?: string
}

export interface ShortcutsConfig {
  [key: string]: (event: KeyboardEvent) => void
}

/**
 * 快捷键配置
 */
export const SHORTCUTS: Record<string, ShortcutConfig> = {
  // 通用快捷键
  NEW_CHAT: { key: 'n', ctrl: true, description: '新建对话' },
  SAVE_CHAT: { key: 's', ctrl: true, description: '保存对话' },
  EXPORT_CHAT: { key: 'e', ctrl: true, shift: true, description: '导出对话' },
  SETTINGS: { key: ',', ctrl: true, description: '打开设置' },

  // 导航快捷键
  TOGGLE_SIDEBAR: { key: 'b', ctrl: true, description: '切换侧边栏' },
  SEARCH: { key: 'k', ctrl: true, description: '搜索' },

  // 消息快捷键
  SEND_MESSAGE: { key: 'Enter', ctrl: true, description: '发送消息' },
  CANCEL_GENERATION: { key: 'Escape', description: '取消生成' },
  COPY_LAST_MESSAGE: { key: 'c', ctrl: true, shift: true, description: '复制最后一条消息' },

  // 功能快捷键
  TOGGLE_DEEP_THINKING: { key: 'd', ctrl: true, shift: true, description: '切换深度思考' },
  TOGGLE_WEB_SEARCH: { key: 'w', ctrl: true, shift: true, description: '切换联网搜索' },

  // 视图快捷键
  ZOOM_IN: { key: '=', ctrl: true, description: '放大' },
  ZOOM_OUT: { key: '-', ctrl: true, description: '缩小' },
  ZOOM_RESET: { key: '0', ctrl: true, description: '重置缩放' },

  // 开发者快捷键
  TOGGLE_DEVTOOLS: { key: 'F12', description: '开发者工具' },
  RELOAD: { key: 'r', ctrl: true, description: '重新加载' }
}

export interface UseShortcutsReturn {
  registeredShortcuts: Map<string, (event: KeyboardEvent) => void>
}

export function useShortcuts(shortcuts: ShortcutsConfig): UseShortcutsReturn {
  const handleKeyDown = (event: KeyboardEvent): void => {
    for (const [shortcutKey, handler] of Object.entries(shortcuts)) {
      const shortcut = SHORTCUTS[shortcutKey]
      if (!shortcut) continue

      const matches = checkShortcutMatch(event, shortcut)
      if (matches) {
        event.preventDefault()
        handler(event)
        break
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)

    // 注册快捷键
    Object.keys(shortcuts).forEach(key => {
      registeredShortcuts.set(key, shortcuts[key])
    })
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)

    // 注销快捷键
    Object.keys(shortcuts).forEach(key => {
      registeredShortcuts.delete(key)
    })
  })

  return {
    registeredShortcuts
  }
}

/**
 * 检查快捷键是否匹配
 * @param {KeyboardEvent} event - 键盘事件
 * @param {Object} shortcut - 快捷键配置
 * @returns {boolean} 是否匹配
 */
function checkShortcutMatch(event: KeyboardEvent, shortcut: ShortcutConfig): boolean {
  const key = event.key.toLowerCase()
  const targetKey = shortcut.key.toLowerCase()

  // 检查主键
  if (key !== targetKey) return false

  // 检查修饰键
  const ctrlMatch = shortcut.ctrl
    ? (event.ctrlKey || event.metaKey)
    : (!event.ctrlKey && !event.metaKey)
  const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
  const altMatch = shortcut.alt ? event.altKey : !event.altKey

  return ctrlMatch && shiftMatch && altMatch
}

/**
 * 格式化快捷键显示文本
 * @param {Object} shortcut - 快捷键配置
 * @returns {string} 格式化的快捷键文本
 */
export function formatShortcut(shortcut: ShortcutConfig): string {
  if (!shortcut) return ''

  const parts: string[] = []

  if (shortcut.ctrl) {
    parts.push(isMac() ? '⌘' : 'Ctrl')
  }
  if (shortcut.shift) {
    parts.push(isMac() ? '⇧' : 'Shift')
  }
  if (shortcut.alt) {
    parts.push(isMac() ? '⌥' : 'Alt')
  }

  // 特殊键名映射
  const keyMap: Record<string, string> = {
    'Enter': '↵',
    'Escape': 'Esc',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    ' ': 'Space'
  }

  const displayKey = keyMap[shortcut.key] || shortcut.key.toUpperCase()
  parts.push(displayKey)

  return parts.join(isMac() ? '' : '+')
}

/**
 * 检查是否为 macOS
 * @returns {boolean}
 */
function isMac(): boolean {
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}

export interface ShortcutItem {
  key: string
  shortcut: ShortcutConfig
  display: string
  description?: string
}

/**
 * 获取所有已注册的快捷键
 * @returns {Array} 快捷键列表
 */
export function getAllShortcuts(): ShortcutItem[] {
  return Object.entries(SHORTCUTS).map(([key, shortcut]) => ({
    key,
    shortcut,
    display: formatShortcut(shortcut),
    description: shortcut.description
  }))
}

export interface GlobalShortcutCallbacks {
  newChat?: () => void
  saveChat?: () => void
  exportChat?: () => void
  openSettings?: () => void
  toggleSidebar?: () => void
  sendMessage?: () => void
  cancelGeneration?: () => void
  copyLastMessage?: () => void
  toggleDeepThinking?: () => void
  toggleWebSearch?: () => void
}

/**
 * 全局快捷键监听器（在主应用中使用）
 */
export function setupGlobalShortcuts(callbacks: GlobalShortcutCallbacks): UseShortcutsReturn {
  const shortcuts: ShortcutsConfig = {
    NEW_CHAT: callbacks.newChat || (() => {}),
    SAVE_CHAT: callbacks.saveChat || (() => {}),
    EXPORT_CHAT: callbacks.exportChat || (() => {}),
    SETTINGS: callbacks.openSettings || (() => {}),
    TOGGLE_SIDEBAR: callbacks.toggleSidebar || (() => {}),
    SEND_MESSAGE: callbacks.sendMessage || (() => {}),
    CANCEL_GENERATION: callbacks.cancelGeneration || (() => {}),
    COPY_LAST_MESSAGE: callbacks.copyLastMessage || (() => {}),
    TOGGLE_DEEP_THINKING: callbacks.toggleDeepThinking || (() => {}),
    TOGGLE_WEB_SEARCH: callbacks.toggleWebSearch || (() => {})
  }

  return useShortcuts(shortcuts)
}
