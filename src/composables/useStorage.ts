import { ref, watch, Ref } from 'vue'
import { debounce } from '@/utils'

/**
 * 增强的本地存储管理
 * 支持版本控制、数据压缩、错误恢复
 */

export interface StorageOptions<T> {
  version?: string
  compress?: boolean
  debounceMs?: number
  maxSize?: number
  onError?: ((error: Error, type: 'read' | 'write' | 'size' | 'import') => void) | null
}

export interface StorageInfo {
  key: string
  version: string
  exists: boolean
  size: number
  lastSave: number | null
  errorCount: number
  maxSize: number
  error?: string
}

export interface ExportedData<T> {
  key: string
  version: string
  timestamp: number
  data: T
  info: StorageInfo
}

export interface UseStorageReturn<T> {
  data: Ref<T>
  set: (value: T) => boolean
  get: () => T
  clear: () => void
  getInfo: () => StorageInfo
  exportData: () => ExportedData<T>
  importData: (importedData: ExportedData<T>) => boolean
  isInitialized: Ref<boolean>
  lastSaveTime: Ref<number | null>
}

export function useStorage<T>(
  key: string,
  defaultValue: T,
  options: StorageOptions<T> = {}
): UseStorageReturn<T> {
  const {
    version = '1.0.0',
    compress = false,
    debounceMs = 1000,
    maxSize = 1024 * 1024 * 5, // 5MB
    onError = null
  } = options

  const data = ref<T>(getStoredValue())
  const isInitialized = ref<boolean>(false)
  const lastSaveTime = ref<number | null>(null)
  const errorCount = ref<number>(0)
  const maxErrorCount = 3

  // 初始化
  initialize()

  /**
   * 获取存储的值
   */
  function getStoredValue(): T {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return defaultValue

      const parsed = JSON.parse(stored)

      // 检查版本
      if (parsed.version !== version) {
        console.warn(`存储版本不匹配：${parsed.version} -> ${version}，使用默认值`)
        return defaultValue
      }

      // 检查数据大小
      if (stored.length > maxSize) {
        console.warn(`存储数据过大：${stored.length} bytes，使用默认值`)
        return defaultValue
      }

      return parsed.data
    } catch (error) {
      console.error(`读取存储失败 (${key}):`, error)
      if (onError) onError(error as Error, 'read')
      return defaultValue
    }
  }

  /**
   * 保存值到存储
   */
  function saveToStorage(value: T): boolean {
    if (errorCount.value >= maxErrorCount) {
      console.error(`存储错误次数过多 (${key})，暂停保存`)
      return false
    }

    try {
      const storageData = {
        version,
        timestamp: Date.now(),
        data: value
      }

      const json = JSON.stringify(storageData)

      // 检查数据大小
      if (json.length > maxSize) {
        console.error(`存储数据过大：${json.length} bytes，超过限制 ${maxSize}`)
        if (onError) onError(new Error('Data too large'), 'size')
        return false
      }

      localStorage.setItem(key, json)
      lastSaveTime.value = Date.now()
      errorCount.value = 0
      return true
    } catch (error) {
      console.error(`保存存储失败 (${key}):`, error)
      errorCount.value++

      if (onError) onError(error as Error, 'write')

      // 尝试清理存储空间
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        clearOldData()
      }

      return false
    }
  }

  /**
   * 清理旧数据
   */
  function clearOldData(): void {
    try {
      // 获取所有存储键
      const keys = Object.keys(localStorage)
      const oldKeys = keys.filter(k => k.startsWith('aiAssistant'))

      // 按时间排序，删除最旧的数据
      oldKeys.sort((a, b) => {
        try {
          const dataA = JSON.parse(localStorage.getItem(a) || '{}')
          const dataB = JSON.parse(localStorage.getItem(b) || '{}')
          return (dataA.timestamp || 0) - (dataB.timestamp || 0)
        } catch {
          return 0
        }
      })

      // 删除前 50% 的旧数据
      const toDelete = oldKeys.slice(0, Math.floor(oldKeys.length * 0.5))
      toDelete.forEach(k => localStorage.removeItem(k))

      console.log(`清理了 ${toDelete.length} 个旧存储项`)
    } catch (error) {
      console.error('清理存储失败:', error)
    }
  }

  /**
   * 初始化
   */
  function initialize(): void {
    if (isInitialized.value) return

    // 监听存储变化（跨标签页同步）
    window.addEventListener('storage', event => {
      if (event.key === key && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue)
          if (parsed.version === version) {
            data.value = parsed.data
            console.log(`存储同步更新 (${key})`)
          }
        } catch (error) {
          console.error(`同步存储失败 (${key}):`, error)
        }
      }
    })

    isInitialized.value = true
  }

  /**
   * 设置值
   */
  function set(value: T): boolean {
    data.value = value
    return saveToStorage(value)
  }

  /**
   * 获取值
   */
  function get(): T {
    return data.value
  }

  /**
   * 清除存储
   */
  function clear(): void {
    localStorage.removeItem(key)
    data.value = defaultValue
    errorCount.value = 0
  }

  /**
   * 获取存储信息
   */
  function getInfo(): StorageInfo {
    try {
      const stored = localStorage.getItem(key)
      return {
        key,
        version,
        exists: !!stored,
        size: stored ? stored.length : 0,
        lastSave: lastSaveTime.value,
        errorCount: errorCount.value,
        maxSize
      }
    } catch (error) {
      return {
        key,
        version,
        exists: false,
        size: 0,
        lastSave: null,
        errorCount: errorCount.value,
        maxSize,
        error: (error as Error).message
      }
    }
  }

  /**
   * 导出数据
   */
  function exportData(): ExportedData<T> {
    return {
      key,
      version,
      timestamp: Date.now(),
      data: data.value,
      info: getInfo()
    }
  }

  /**
   * 导入数据
   */
  function importData(importedData: ExportedData<T>): boolean {
    try {
      if (importedData.key !== key) {
        throw new Error(`键不匹配：${importedData.key} != ${key}`)
      }

      if (importedData.version !== version) {
        console.warn(`版本不匹配：${importedData.version} -> ${version}`)
      }

      data.value = importedData.data
      return saveToStorage(importedData.data)
    } catch (error) {
      console.error(`导入数据失败 (${key}):`, error)
      if (onError) onError(error as Error, 'import')
      return false
    }
  }

  // 自动保存（防抖）
  const debouncedSave = debounce((value: T) => {
    saveToStorage(value)
  }, debounceMs)

  // 监听数据变化自动保存
  watch(
    data,
    newValue => {
      if (isInitialized.value) {
        debouncedSave(newValue)
      }
    },
    { deep: true }
  )

  return {
    data,
    set,
    get,
    clear,
    getInfo,
    exportData,
    importData,
    isInitialized,
    lastSaveTime
  }
}

/**
 * 批量存储管理
 */
export interface BatchStorageConfig<T> {
  key?: string
  defaultValue: T
  options?: StorageOptions<T>
}

export interface BatchStorageConfigs {
  [key: string]: BatchStorageConfig<unknown>
}

export interface UseBatchStorageReturn {
  storages: Record<string, UseStorageReturn<unknown>>
  exportAll: () => Record<string, ExportedData<unknown>>
  importAll: (data: Record<string, ExportedData<unknown>>) => Record<string, boolean>
  clearAll: () => void
  getAllInfo: () => Record<string, StorageInfo>
}

export function useBatchStorage(configs: BatchStorageConfigs): UseBatchStorageReturn {
  const storages: Record<string, UseStorageReturn<unknown>> = {}

  Object.entries(configs).forEach(([key, config]) => {
    storages[key] = useStorage(config.key || key, config.defaultValue, config.options || {})
  })

  /**
   * 批量导出
   */
  function exportAll(): Record<string, ExportedData<unknown>> {
    const result: Record<string, ExportedData<unknown>> = {}
    Object.entries(storages).forEach(([key, storage]) => {
      result[key] = storage.exportData()
    })
    return result
  }

  /**
   * 批量导入
   */
  function importAll(data: Record<string, ExportedData<unknown>>): Record<string, boolean> {
    const results: Record<string, boolean> = {}
    Object.entries(data).forEach(([key, item]) => {
      if (storages[key]) {
        results[key] = storages[key].importData(item)
      }
    })
    return results
  }

  /**
   * 批量清除
   */
  function clearAll(): void {
    Object.values(storages).forEach(storage => storage.clear())
  }

  /**
   * 获取所有存储信息
   */
  function getAllInfo(): Record<string, StorageInfo> {
    const info: Record<string, StorageInfo> = {}
    Object.entries(storages).forEach(([key, storage]) => {
      info[key] = storage.getInfo()
    })
    return info
  }

  return {
    storages,
    exportAll,
    importAll,
    clearAll,
    getAllInfo
  }
}
