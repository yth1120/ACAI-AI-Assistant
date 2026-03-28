/**
 * BaseButton组件类型定义
 */

import type { BaseButtonProps as GlobalBaseButtonProps } from '@/types'

// 按钮变体类型
export type ButtonVariant = GlobalBaseButtonProps['variant']

// 按钮尺寸类型
export type ButtonSize = GlobalBaseButtonProps['size']

// 按钮点击事件
export interface ButtonClickEvent extends MouseEvent {
  // 可以添加自定义属性
}

// 按钮Props接口
export interface BaseButtonProps {
  /** 按钮变体样式 */
  variant?: ButtonVariant
  /** 按钮尺寸 */
  size?: ButtonSize
  /** 是否块级显示 */
  block?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 图标类名 */
  icon?: string
  /** 点击事件 */
  onClick?: (event: ButtonClickEvent) => void
  /** 原生按钮类型 */
  type?: 'button' | 'submit' | 'reset'
  /** 按钮标题 */
  title?: string
  /** 自定义类名 */
  class?: string
  /** 自定义样式 */
  style?: Record<string, string | number>
}

// 按钮插槽
export interface BaseButtonSlots {
  /** 默认插槽 - 按钮文本 */
  default?: () => any
  /** 图标插槽 */
  icon?: () => any
  /** 加载中插槽 */
  loading?: () => any
}

// 按钮发射事件
export interface BaseButtonEmits {
  /** 点击事件 */
  (e: 'click', event: ButtonClickEvent): void
  /** 鼠标进入事件 */
  (e: 'mouseenter', event: MouseEvent): void
  /** 鼠标离开事件 */
  (e: 'mouseleave', event: MouseEvent): void
  /** 焦点事件 */
  (e: 'focus', event: FocusEvent): void
  /** 失焦事件 */
  (e: 'blur', event: FocusEvent): void
}