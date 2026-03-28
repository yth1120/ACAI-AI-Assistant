/**
 * 性能监控工具
 */

/**
 * 页面加载性能指标
 */
export interface PageLoadMetrics {
  dns: number
  tcp: number
  request: number
  response: number
  domParsing: number
  domContentLoaded: number
  onLoad: number
  total: number
}

/**
 * API 调用记录
 */
export interface ApiCallRecord {
  api: string
  duration: number
  success: boolean
  timestamp: number
}

/**
 * 渲染时间记录
 */
export interface RenderTimeRecord {
  component: string
  duration: number
  timestamp: number
}

/**
 * 内存使用记录
 */
export interface MemoryUsageRecord {
  usedJSHeapSize: string
  totalJSHeapSize: string
  jsHeapSizeLimit: string
  timestamp: number
}

/**
 * 错误记录
 */
export interface ErrorRecord {
  message: string
  stack?: string
  context: string
  timestamp: number
}

/**
 * 性能指标集合
 */
export interface PerformanceMetrics {
  pageLoad: PageLoadMetrics | null
  apiCalls: ApiCallRecord[]
  renderTime: RenderTimeRecord[]
  memoryUsage: MemoryUsageRecord[]
  errors: ErrorRecord[]
}

/**
 * API 统计信息
 */
export interface ApiStats {
  total: number
  success: number
  failed: number
  avgDuration: string
  minDuration: string
  maxDuration: string
}

/**
 * 渲染统计信息
 */
export interface RenderStats {
  total: number
  avgDuration: string
  minDuration: string
  maxDuration: string
}

/**
 * 内存统计信息
 */
export interface MemoryStats {
  current: string
  total: string
  limit: string
  usage: string
}

/**
 * 性能报告
 */
export interface PerformanceReport {
  pageLoad: PageLoadMetrics | null
  api: ApiStats | null
  render: RenderStats | null
  memory: MemoryStats | null
  errors: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics
  private observers: Map<string, PerformanceObserver>

  constructor() {
    this.metrics = {
      pageLoad: null,
      apiCalls: [],
      renderTime: [],
      memoryUsage: [],
      errors: [],
    }
    this.observers = new Map()
  }

  /**
   * 初始化性能监控
   */
  init(): void {
    this.monitorPageLoad()
    this.monitorMemory()
    this.monitorLongTasks()
    this.monitorResourceTiming()
  }

  /**
   * 监控页面加载性能
   */
  private monitorPageLoad(): void {
    if ('performance' in window && 'getEntriesByType' in window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          if (perfData) {
            this.metrics.pageLoad = {
              dns: perfData.domainLookupEnd - perfData.domainLookupStart,
              tcp: perfData.connectEnd - perfData.connectStart,
              request: perfData.responseStart - perfData.requestStart,
              response: perfData.responseEnd - perfData.responseStart,
              domParsing: perfData.domInteractive - perfData.responseEnd,
              domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
              onLoad: perfData.loadEventEnd - perfData.loadEventStart,
              total: perfData.loadEventEnd - perfData.fetchStart,
            }
            console.log('📊 页面加载性能:', this.metrics.pageLoad)
          }
        }, 0)
      })
    }
  }

  /**
   * 监控内存使用
   */
  private monitorMemory(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = {
          usedJSHeapSize: ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2),
          totalJSHeapSize: ((performance as any).memory.totalJSHeapSize / 1048576).toFixed(2),
          jsHeapSizeLimit: ((performance as any).memory.jsHeapSizeLimit / 1048576).toFixed(2),
          timestamp: Date.now(),
        } as MemoryUsageRecord

        this.metrics.memoryUsage.push(memory)

        // 只保留最近 100 条记录
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage.shift()
        }

        // 内存使用超过警告阈值
        const usagePercent =
          (((performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit) * 100)
        if (usagePercent > 90) {
          console.warn('⚠️ 内存使用率过高:', usagePercent.toFixed(2) + '%')
        }
      }, 10000) // 每 10 秒检查一次
    }
  }

  /**
   * 监控长任务
   */
  private monitorLongTasks(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.warn('⚠️ 检测到长任务:', {
              duration: entry.duration.toFixed(2) + 'ms',
              startTime: entry.startTime.toFixed(2) + 'ms',
            })
          }
        })
        observer.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', observer)
      } catch (e) {
        // 某些浏览器可能不支持 longtask
        console.debug('Long Task API 不支持')
      }
    }
  }

  /**
   * 监控资源加载时间
   */
  private monitorResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // 只记录加载时间较长的资源
          if (entry.duration > 1000) {
            console.warn('⚠️ 资源加载缓慢:', {
              name: entry.name,
              duration: entry.duration.toFixed(2) + 'ms',
              size: entry.transferSize ? (entry.transferSize / 1024).toFixed(2) + 'KB' : 'N/A',
            })
          }
        }
      })
      observer.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', observer)
    }
  }

  /**
   * 记录 API 调用性能
   * @param api - API 名称
   * @param duration - 持续时间
   * @param success - 是否成功
   */
  recordApiCall(api: string, duration: number, success = true): void {
    this.metrics.apiCalls.push({
      api,
      duration,
      success,
      timestamp: Date.now(),
    })

    // 只保留最近 500 条记录
    if (this.metrics.apiCalls.length > 500) {
      this.metrics.apiCalls.shift()
    }

    // API 响应时间过长警告
    if (duration > 10000) {
      console.warn('⚠️ API 响应缓慢:', api, duration.toFixed(2) + 'ms')
    }
  }

  /**
   * 记录渲染时间
   * @param component - 组件名称
   * @param duration - 渲染时间
   */
  recordRenderTime(component: string, duration: number): void {
    this.metrics.renderTime.push({
      component,
      duration,
      timestamp: Date.now(),
    })

    // 只保留最近 200 条记录
    if (this.metrics.renderTime.length > 200) {
      this.metrics.renderTime.shift()
    }

    // 渲染时间过长警告
    if (duration > 100) {
      console.warn('⚠️ 组件渲染缓慢:', component, duration.toFixed(2) + 'ms')
    }
  }

  /**
   * 记录错误
   * @param error - 错误对象
   * @param context - 错误上下文
   */
  recordError(error: Error, context = ''): void {
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
    })

    // 只保留最近 100 条记录
    if (this.metrics.errors.length > 100) {
      this.metrics.errors.shift()
    }
  }

  /**
   * 获取性能报告
   * @returns 性能报告
   */
  getReport(): PerformanceReport {
    const apiStats = this.getApiStats()
    const renderStats = this.getRenderStats()
    const memoryStats = this.getMemoryStats()

    return {
      pageLoad: this.metrics.pageLoad,
      api: apiStats,
      render: renderStats,
      memory: memoryStats,
      errors: this.metrics.errors.length,
      timestamp: Date.now(),
    }
  }

  /**
   * 获取 API 调用统计
   */
  private getApiStats(): ApiStats | null {
    if (this.metrics.apiCalls.length === 0) return null

    const durations = this.metrics.apiCalls.map((call) => call.duration)
    const successCount = this.metrics.apiCalls.filter((call) => call.success).length

    return {
      total: this.metrics.apiCalls.length,
      success: successCount,
      failed: this.metrics.apiCalls.length - successCount,
      avgDuration: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
      minDuration: Math.min(...durations).toFixed(2),
      maxDuration: Math.max(...durations).toFixed(2),
    }
  }

  /**
   * 获取渲染统计
   */
  private getRenderStats(): RenderStats | null {
    if (this.metrics.renderTime.length === 0) return null

    const durations = this.metrics.renderTime.map((r) => r.duration)

    return {
      total: this.metrics.renderTime.length,
      avgDuration: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2),
      minDuration: Math.min(...durations).toFixed(2),
      maxDuration: Math.max(...durations).toFixed(2),
    }
  }

  /**
   * 获取内存统计
   */
  private getMemoryStats(): MemoryStats | null {
    if (this.metrics.memoryUsage.length === 0) return null

    const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1]
    return {
      current: latest.usedJSHeapSize + 'MB',
      total: latest.totalJSHeapSize + 'MB',
      limit: latest.jsHeapSizeLimit + 'MB',
      usage: ((parseFloat(latest.usedJSHeapSize) / parseFloat(latest.jsHeapSizeLimit)) * 100).toFixed(2) + '%',
    }
  }

  /**
   * 打印性能报告
   */
  printReport(): void {
    const report = this.getReport()
    console.group('📊 性能监控报告')
    console.log('页面加载:', report.pageLoad)
    console.log('API 统计:', report.api)
    console.log('渲染统计:', report.render)
    console.log('内存使用:', report.memory)
    console.log('错误数量:', report.errors)
    console.groupEnd()
  }

  /**
   * 清理监控器
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers.clear()
  }

  /**
   * 导出性能数据
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2)
  }
}

// 创建单例
const performanceMonitor = new PerformanceMonitor()

// 自动初始化
if (typeof window !== 'undefined') {
  performanceMonitor.init()
}

export { performanceMonitor }
export default performanceMonitor
