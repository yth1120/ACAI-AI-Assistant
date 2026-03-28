/**
 * 基于 VueUse 的全局快捷键管理
 * 使用@vueuse/core 的 useEventListener 和逻辑组合
 */

import { useEventListener, tryOnScopeDispose } from '@vueuse/core'
import { ref, computed, ComputedRef, Ref } from 'vue'

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
  COPY_LAST_MESSAGE: { key: 'c', ctrl: true, shift: true, description: '复制最后条消息' },

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

export interface LastTriggered {
  shortcut: string
  timestamp: number
  description?: string
}

export interface ShortcutItem {
  key: string
  description?: string
}

export interface UseShortcutsReturn {
  activeShortcuts: ComputedRef<ShortcutItem[]>
  lastTriggered: Ref<LastTriggered | null>
  isActive: (shortcutKey: string) => boolean
  disable: () => void
  enable: () => void
  registerShortcut: (key: string, config: ShortcutConfig, handler: (event: KeyboardEvent) => void) => void
  unregisterShortcut: (key: string) => void
}

export interface UseShortcutsOptions {
  target?: EventTarget
  preventDefault?: boolean
  enabled?: boolean
}

/**
 * 检查快捷键是否匹配
 * @param {KeyboardEvent} event - 键盘事件
 * @param {Object} shortcut - 快捷键配置
 * @returns {boolean} 是否匹配
 */
function isShortcutMatch(event: KeyboardEvent, shortcut: ShortcutConfig): boolean {
  // 检查按键
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false
  }

  // 检查 Ctrl/Cmd 键
  if (shortcut.ctrl && !(event.ctrlKey || event.metaKey)) {
    return false
  }

  // 检查 Shift 键
  if (shortcut.shift && !event.shiftKey) {
    return false
  }

  // 检查 Alt 键
  if (shortcut.alt && !event.altKey) {
    return false
  }

  // 确保没有额外的修饰键
  if (!shortcut.ctrl && (event.ctrlKey || event.metaKey)) {
    return false
  }

  if (!shortcut.shift && event.shiftKey) {
    return false
  }

  if (!shortcut.alt && event.altKey) {
    return false
  }

  return true
}

/**
 * 使用快捷键
 * @param {Object} shortcuts - 快捷键配置对象 { shortcutKey: handler }
 * @param {Object} options - 配置选项
 */
export function useShortcuts(
  shortcuts: ShortcutsConfig,
  options: UseShortcutsOptions = {}
): UseShortcutsReturn {
  const {
    target = window,
    preventDefault = true,
    enabled = true
  } = options

  const activeShortcuts = ref<Set<string>>(new Set())
  const lastTriggered = ref<LastTriggered | null>(null)

  /**
   * 处理键盘按下事件
   */
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (!enabled) return

    // 忽略输入框中的按键
    const targetElement = event.target as HTMLElement
    if (
      targetElement.tagName === 'INPUT' ||
      targetElement.tagName === 'TEXTAREA' ||
      targetElement.isContentEditable
    ) {
      return
    }

    for (const [shortcutKey, handler] of Object.entries(shortcuts)) {
      const shortcut = SHORTCUTS[shortcutKey]
      if (!shortcut) continue

      if (isShortcutMatch(event, shortcut)) {
        if (preventDefault) {
          event.preventDefault()
          event.stopPropagation()
        }

        // 记录激活的快捷键
        activeShortcuts.value.add(shortcutKey)
        lastTriggered.value = {
          shortcut: shortcutKey,
          timestamp: Date.now(),
          description: shortcut.description
        }

        // 执行处理函数
        if (typeof handler === 'function') {
          handler(event)
        }

        break
      }
    }
  }

  /**
   * 处理键盘释放事件
   */
  const handleKeyUp = (event: KeyboardEvent): void => {
    for (const shortcutKey of Object.keys(shortcuts)) {
      const shortcut = SHORTCUTS[shortcutKey]
      if (!shortcut) continue

      if (event.key.toLowerCase() === shortcut.key.toLowerCase()) {
        activeShortcuts.value.delete(shortcutKey)
      }
    }
  }

  // 使用 VueUse 的 useEventListener
  const { stop: stopKeyDown } = useEventListener(target as EventTarget, 'keydown', handleKeyDown)
  const { stop: stopKeyUp } = useEventListener(target as EventTarget, 'keyup', handleKeyUp)

  /**
   * 禁用快捷键
   */
  function disable(): void {
    stopKeyDown()
    stopKeyUp()
  }

  /**
   * 启用快捷键
   */
  function enable(): void {
    // 重新注册事件监听器
    useEventListener(target as EventTarget, 'keydown', handleKeyDown)
    useEventListener(target as EventTarget, 'keyup', handleKeyUp)
  }

  /**
   * 检查快捷键是否激活
   * @param {string} shortcutKey - 快捷键键名
   * @returns {boolean} 是否激活
   */
  function isActive(shortcutKey: string): boolean {
    return activeShortcuts.value.has(shortcutKey)
  }

  /**
   * 获取所有激活的快捷键
   */
  const activeShortcutsList = computed<ShortcutItem[]>(() => {
    return Array.from(activeShortcuts.value).map(key => ({
      key,
      ...SHORTCUTS[key]
    }))
  })

  /**
   * 注册新的快捷键
   * @param {string} key - 快捷键键名
   * @param {Object} config - 快捷键配置
   * @param {Function} handler - 处理函数
   */
  function registerShortcut(
    key: string,
    config: ShortcutConfig,
    handler: (event: KeyboardEvent) => void
  ): void {
    SHORTCUTS[key] = config
    shortcuts[key] = handler
  }

  /**
   * 注销快捷键
   * @param {string} key - 快捷键键名
   */
  function unregisterShortcut(key: string): void {
    delete SHORTCUTS[key]
    delete shortcuts[key]
    activeShortcuts.value.delete(key)
  }

  // 组件卸载时清理
  tryOnScopeDispose(() => {
    stopKeyDown()
    stopKeyUp()
  })

  return {
    activeShortcuts: activeShortcutsList,
    lastTriggered,
    isActive,
    disable,
    enable,
    registerShortcut,
    unregisterShortcut
  }
}

export interface ShortcutManager {
  activeShortcuts: ComputedRef<ShortcutItem[]>
  lastTriggered: Ref<LastTriggered | null>
  isActive: (shortcutKey: string) => boolean
  disable: () => void
  enable: () => void
  registerShortcut: (
    key: string,
    config: ShortcutConfig,
    handler: (event: KeyboardEvent) => void
  ) => void
  unregisterShortcut: (key: string) => void
}

export interface ShortcutManagerReturn {
  register: (shortcuts: ShortcutsConfig, options?: UseShortcutsOptions) => ShortcutManager
  disableAll: () => void
  enableAll: () => void
  getAllShortcuts: () => { key: string; config: ShortcutConfig; handler: string }[]
  SHORTCUTS: Record<string, ShortcutConfig>
}

/**
 * 创建全局快捷键管理器
 */
export function createShortcutManager(): ShortcutManagerReturn {
  const globalShortcuts: ShortcutsConfig = {}
  const managers: ShortcutManager[] = []

  /**
   * 注册全局快捷键
   * @param {Object} shortcuts - 快捷键配置
   * @param {Object} options - 配置选项
   * @returns {Object} 快捷键管理器
   */
  function register(shortcuts: ShortcutsConfig, options: UseShortcutsOptions = {}): ShortcutManager {
    Object.assign(globalShortcuts, shortcuts)

    const manager = useShortcuts(shortcuts, options)
    managers.push(manager)

    return manager
  }

  /**
   * 禁用所有快捷键
   */
  function disableAll(): void {
    managers.forEach(manager => manager.disable())
  }

  /**
   * 启用所有快捷键
   */
  function enableAll(): void {
    managers.forEach(manager => manager.enable())
  }

  /**
   * 获取所有注册的快捷键
   */
  function getAllShortcuts(): { key: string; config: ShortcutConfig; handler: string }[] {
    return Object.entries(globalShortcuts).map(([key, handler]) => ({
      key,
      config: SHORTCUTS[key],
      handler: handler.toString()
    }))
  }

  return {
    register,
    disableAll,
    enableAll,
    getAllShortcuts,
    SHORTCUTS
  }
}
