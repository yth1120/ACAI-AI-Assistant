/**
 * 通知系统 Composable
 */
import { ref } from 'vue'
import { NOTIFICATION_TYPES } from '@/constants'
import { generateId } from '@/utils'

export interface Notification {
  id: string
  message: string
  type: string
  visible: boolean
}

export interface UseNotificationReturn {
  notifications: Ref<Notification[]>
  show: (options: ShowNotificationOptions) => string
  remove: (id: string) => void
  clear: () => void
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
}

export interface ShowNotificationOptions {
  message: string
  type?: string
  duration?: number
}

const notifications = ref<Notification[]>([])

export function useNotification(): UseNotificationReturn {
  /**
   * 显示通知
   * @param {Object} options - 通知配置
   * @param {string} options.message - 消息内容
   * @param {string} options.type - 通知类型
   * @param {number} options.duration - 持续时间（毫秒）
   */
  function show({
    message,
    type = NOTIFICATION_TYPES.INFO,
    duration = 3000
  }: ShowNotificationOptions): string {
    const id = generateId()
    const notification: Notification = {
      id,
      message,
      type,
      visible: true
    }

    notifications.value.push(notification)

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  /**
   * 移除通知
   * @param {string} id - 通知 ID
   */
  function remove(id: string): void {
    const index = notifications.value.findIndex((n: Notification) => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * 清除所有通知
   */
  function clear(): void {
    notifications.value = []
  }

  /**
   * 显示成功通知
   * @param {string} message - 消息内容
   * @param {number} duration - 持续时间
   */
  function success(message: string, duration: number = 3000): string {
    return show({ message, type: NOTIFICATION_TYPES.SUCCESS, duration })
  }

  /**
   * 显示错误通知
   * @param {string} message - 消息内容
   * @param {number} duration - 持续时间
   */
  function error(message: string, duration: number = 5000): string {
    return show({ message, type: NOTIFICATION_TYPES.ERROR, duration })
  }

  /**
   * 显示警告通知
   * @param {string} message - 消息内容
   * @param {number} duration - 持续时间
   */
  function warning(message: string, duration: number = 4000): string {
    return show({ message, type: NOTIFICATION_TYPES.WARNING, duration })
  }

  /**
   * 显示信息通知
   * @param {string} message - 消息内容
   * @param {number} duration - 持续时间
   */
  function info(message: string, duration: number = 3000): string {
    return show({ message, type: NOTIFICATION_TYPES.INFO, duration })
  }

  return {
    notifications,
    show,
    remove,
    clear,
    success,
    error,
    warning,
    info
  }
}
