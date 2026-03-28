/**
 * 基于 VueUse 的存储管理
 * 使用@vueuse/core 的 useStorage，并添加增强功能
 */

import { useStorage as vueUseStorage, useDebounceFn } from '@vueuse/core'
import { ref, watch, Ref, WatchSource } from 'vue'

export interface StorageOptions<T> {
  version?: string
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
  set: (value: T) => void
  get: () => T
  clear: () => void
  getInfo: () => StorageInfo
  exportData: () => ExportedData<T>
  importData: (importedData: ExportedData<T>) => boolean
  isInitialized: Ref<boolean>
  lastSaveTime: Ref<number | null>
}

export interface Serializer<T> {
  read: (v: string) => T
  write: (v: T) => string
}

/**
 * 增强的本地存储管理（基于 VueUse）
 * @param {string} key - 存储键
 * @param {any} defaultValue - 默认值
 * @param {object} options - 配置选项
 * @returns {object} 存储管理对象
 */
export function useStorage<T>(
  key: string,
  defaultValue: T,
  options: StorageOptions<T> = {}
): UseStorageReturn<T> {
  const {
    version = '1.0.0',
    debounceMs = 1000,
    maxSize = 1024 * 1024 * 5, // 5MB
    onError = null
  } = options

  // 使用 VueUse 的 useStorage
  const { data, set } = vueUseStorage<T>(key, defaultValue, localStorage, {
    serializer: {
      read: (v: string): T => {
        try {
          if (!v) return defaultValue
          const parsed = JSON.parse(v)

          // 检查版本
          if (parsed.version !== version) {
            console.warn(`存储版本不匹配：${parsed.version} -> ${version}，使用默认值`)
            return defaultValue
          }

          // 检查数据大小
          if (v.length > maxSize) {
            console.warn(`存储数据过大：${v.length} bytes，使用默认值`)
            return defaultValue
          }

          return parsed.data
        } catch (error) {
          console.error(`读取存储失败 (${key}):`, error)
          if (onError) onError(error as Error, 'read')
          return defaultValue
        }
      },
      write: (v: T): string => {
        try {
          const storageData = {
            version,
            timestamp: Date.now(),
            data: v
          }

          const json = JSON.stringify(storageData)

          // 检查数据大小
          if (json.length > maxSize) {
            console.error(`存储数据过大：${json.length} bytes，超过限制 ${maxSize}`)
            if (onError) onError(new Error('Data too large'), 'size')
            return JSON.stringify({ version, timestamp: Date.now(), data: defaultValue })
          }

          return json
        } catch (error) {
          console.error(`保存存储失败 (${key}):`, error)
          if (onError) onError(error as Error, 'write')
          return JSON.stringify({ version, timestamp: Date.now(), data: defaultValue })
        }
      }
    }
  })

  const isInitialized = ref<boolean>(false)
  const lastSaveTime = ref<number | null>(null)
  const errorCount = ref<number>(0)
  const maxErrorCount = 3

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

      set(importedData.data)
      lastSaveTime.value = Date.now()
      return true
    } catch (error) {
      console.error(`导入数据失败 (${key}):`, error)
      if (onError) onError(error as Error, 'import')
      return false
    }
  }

  /**
   * 清除存储
   */
  function clear(): void {
    localStorage.removeItem(key)
    set(defaultValue)
    errorCount.value = 0
  }

  // 防抖保存
  const debouncedSet = useDebounceFn((value: T) => {
    try {
      set(value)
      lastSaveTime.value = Date.now()
      errorCount.value = 0
    } catch (error) {
      console.error(`保存失败 (${key}):`, error)
      errorCount.value++
    }
  }, debounceMs)

  // 监听数据变化自动保存
  watch(
    data as WatchSource<T>,
    (newValue: T) => {
      if (isInitialized.value) {
        debouncedSet(newValue)
      }
    },
    { deep: true }
  )

  // 初始化
  isInitialized.value = true

  return {
    data,
    set: debouncedSet,
    get: () => data.value,
    clear,
    getInfo,
    exportData,
    importData,
    isInitialized,
    lastSaveTime
  }
}

/**
 * 批量存储管理（基于 VueUse）
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
