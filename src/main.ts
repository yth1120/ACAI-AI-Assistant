/**
 * ACAI Assistant 主入口文件
 * 应用初始化和全局配置
 */

import { createApp, type App, type ComponentPublicInstance } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 导入全局样式
import './assets/styles/main.css'
import './assets/styles/responsive.css'

// 导入 Naive UI
import { createDiscreteApi, type MessageProvider, type NotificationProvider, type DialogProvider, type LoadingBarProvider } from 'naive-ui'
import naive from 'naive-ui'

// 导入性能监控
import performanceMonitor from './utils/performance'

// ============ 创建应用实例 ============
const app = createApp(App)
const pinia = createPinia()

// ============ Naive UI 离散 API ============
const { message, notification, dialog, loadingBar } = createDiscreteApi([
  'message',
  'notification',
  'dialog',
  'loadingBar'
])

// ============ 类型扩展 ============
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $message: MessageProvider
    $notification: NotificationProvider
    $dialog: DialogProvider
    $loadingBar: LoadingBarProvider
  }
}

// ============ 全局属性注册 ============
app.config.globalProperties.$message = message
app.config.globalProperties.$notification = notification
app.config.globalProperties.$dialog = dialog
app.config.globalProperties.$loadingBar = loadingBar

// ============ 全局错误处理 ============
app.config.errorHandler = (err: unknown, instance: ComponentPublicInstance | null, info: string) => {
  console.error('🔴 全局错误捕获:', err)
  console.error('错误组件:', instance?.$options?.name || 'Anonymous')
  console.error('错误信息:', info)

  // 记录错误到性能监控
  if (err instanceof Error) {
    performanceMonitor.recordError(err, `Component: ${instance?.$options?.name || 'Unknown'}, Info: ${info}`)
  }

  // TODO: 集成错误上报服务
  // errorReporter.report({ err, instance, info })
}

// ============ 开发环境警告处理 ============
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg: string, instance: ComponentPublicInstance | null, trace: string) => {
    console.warn('🟡 Vue 警告:', msg)
    console.warn('警告来源:', instance?.$options?.name || 'Anonymous')
    console.warn('追踪:', trace)
  }
}

// ============ 未处理的 Promise 错误捕获 ============
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  console.error('⚠️ 未处理的 Promise 错误:', event.reason)
  event.preventDefault()

  // 记录到性能监控
  performanceMonitor.recordError(
    new Error(String(event.reason)),
    `Unhandled Rejection: ${event.reason}`
  )
})

// ============ 全局错误边界 ============
window.addEventListener('error', (event: ErrorEvent) => {
  console.error('🔴 全局脚本错误:', event.error)
  console.error('位置:', `${event.filename}:${event.lineno}:${event.colno}`)

  performanceMonitor.recordError(
    event.error,
    `Global Error: ${event.message} at ${event.filename}:${event.lineno}`
  )
})

// ============ 注册插件 ============
app.use(pinia)
app.use(router)
app.use(naive)

// ============ 挂载应用 ============
app.mount('#app')

// ============ 开发环境性能报告 ============
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.printReport()
    }, 1000)
  })
}

// ============ 注册 Service Worker (生产环境) ============
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 预留 Service Worker 注册
    // navigator.serviceWorker.register('/sw.js')
    //   .then(registration => console.log('SW registered:', registration))
    //   .catch(error => console.error('SW registration failed:', error))
  })
}
