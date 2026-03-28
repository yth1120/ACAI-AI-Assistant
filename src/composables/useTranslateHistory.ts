/**
 * 翻译历史管理 composable
 * 管理翻译历史记录、常用语言记忆等功能
 */

import { ref, Ref, watch } from 'vue'
import { useStorage } from './useStorage'

export interface TranslateRecord {
  id: number
  sourceText: string
  targetText: string
  sourceLang: string
  targetLang: string
  style: string
  timestamp: string
  favorite?: boolean
}

export interface TranslateHistory {
  version: string
  records: TranslateRecord[]
  settings: {
    maxRecords: number
    autoSave: boolean
    recentLanguages: string[]
    sidebarPosition: 'left' | 'right'
    sidebarWidth: number
    shortcut: string
  }
  timestamp?: number
}

export interface UseTranslateHistoryReturn {
  // State
  records: Ref<TranslateRecord[]>
  recentLanguages: Ref<string[]>
  sidebarPosition: Ref<'left' | 'right'>
  sidebarWidth: Ref<number>
  shortcut: Ref<string>
  // Actions
  addRecord: (record: Omit<TranslateRecord, 'id' | 'timestamp'>) => TranslateRecord
  deleteRecord: (id: number) => boolean
  clearRecords: () => void
  toggleFavorite: (id: number) => boolean
  getFavorites: () => TranslateRecord[]
  updateRecentLanguages: (lang: string) => void
  exportHistory: () => void
  importHistory: (data: unknown) => boolean
  loadHistory: () => void
  saveSettings: () => void
}

/**
 * 翻译历史管理
 */
export function useTranslateHistory(): UseTranslateHistoryReturn {
  // 使用增强的存储管理
  const translateStorage = useStorage<TranslateHistory>(
    'aiAssistantTranslateHistory',
    {
      version: '1.0.0',
      records: [],
      settings: {
        maxRecords: 100,
        autoSave: true,
        recentLanguages: ['en', 'ja', 'ko'],
        sidebarPosition: 'right',
        sidebarWidth: 280,
        shortcut: 'Ctrl+Shift+T'
      }
    },
    {
      version: '1.0.0',
      debounceMs: 1000,
      maxSize: 1024 * 1024 * 5, // 5MB
      onError: (error: Error, type: string) => {
        console.error(`翻译历史存储${type}错误:`, error)
      }
    }
  )

  // State
  const records = ref<TranslateRecord[]>(translateStorage.data.value?.records || [])
  const recentLanguages = ref<string[]>(translateStorage.data.value?.settings.recentLanguages || ['en', 'ja', 'ko'])
  const sidebarPosition = ref<'left' | 'right'>(
    (translateStorage.data.value?.settings.sidebarPosition as 'left' | 'right') || 'right'
  )
  const sidebarWidth = ref<number>(translateStorage.data.value?.settings.sidebarWidth || 280)
  const shortcut = ref<string>(translateStorage.data.value?.settings.shortcut || 'Ctrl+Shift+T')

  // 自动保存
  watch(
    [records, recentLanguages, sidebarPosition, sidebarWidth, shortcut],
    () => {
      if (translateStorage.data.value?.settings.autoSave) {
        if (translateStorage.data.value) {
          translateStorage.data.value.records = records.value
          translateStorage.data.value.settings.recentLanguages = recentLanguages.value
          translateStorage.data.value.settings.sidebarPosition = sidebarPosition.value
          translateStorage.data.value.settings.sidebarWidth = sidebarWidth.value
          translateStorage.data.value.settings.shortcut = shortcut.value
          translateStorage.data.value.timestamp = Date.now()
        }
      }
    },
    { deep: true, debounce: 500 }
  )

  /**
   * 添加翻译记录
   */
  function addRecord(record: Omit<TranslateRecord, 'id' | 'timestamp'>): TranslateRecord {
    const newRecord: TranslateRecord = {
      ...record,
      id: Date.now(),
      timestamp: new Date().toISOString()
    }

    records.value.unshift(newRecord)

    // 限制记录数量
    const maxRecords = translateStorage.data.value?.settings.maxRecords || 100
    if (records.value.length > maxRecords) {
      records.value = records.value.slice(0, maxRecords)
    }

    return newRecord
  }

  /**
   * 删除翻译记录
   */
  function deleteRecord(id: number): boolean {
    const index = records.value.findIndex(r => r.id === id)
    if (index !== -1) {
      records.value.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * 清空所有记录
   */
  function clearRecords(): void {
    records.value = []
  }

  /**
   * 切换收藏状态
   */
  function toggleFavorite(id: number): boolean {
    const record = records.value.find(r => r.id === id)
    if (record) {
      record.favorite = !record.favorite
      return record.favorite
    }
    return false
  }

  /**
   * 获取所有收藏
   */
  function getFavorites(): TranslateRecord[] {
    return records.value.filter(r => r.favorite)
  }

  /**
   * 更新常用语言
   */
  function updateRecentLanguages(lang: string): void {
    // 移除已存在的语言
    recentLanguages.value = recentLanguages.value.filter(l => l !== lang)
    // 添加到开头
    recentLanguages.value.unshift(lang)
    // 只保留前 3 个
    recentLanguages.value = recentLanguages.value.slice(0, 3)
  }

  /**
   * 导出历史记录
   */
  function exportHistory(): void {
    if (records.value.length === 0) {
      console.warn('没有可导出的翻译记录')
      return
    }

    const data = {
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      totalRecords: records.value.length,
      records: records.value
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `翻译历史_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 导入历史记录
   */
  function importHistory(data: unknown): boolean {
    try {
      const importData = data as { records?: TranslateRecord[] }
      if (importData.records && Array.isArray(importData.records)) {
        records.value = [...importData.records, ...records.value]
        return true
      }
      return false
    } catch (error) {
      console.error('导入翻译历史失败:', error)
      return false
    }
  }

  /**
   * 加载历史记录
   */
  function loadHistory(): void {
    records.value = translateStorage.data.value?.records || []
    recentLanguages.value = translateStorage.data.value?.settings.recentLanguages || ['en', 'ja', 'ko']
    sidebarPosition.value =
      (translateStorage.data.value?.settings.sidebarPosition as 'left' | 'right') || 'right'
    sidebarWidth.value = translateStorage.data.value?.settings.sidebarWidth || 280
    shortcut.value = translateStorage.data.value?.settings.shortcut || 'Ctrl+Shift+T'
    console.log('翻译历史加载完成:', {
      count: records.value.length,
      recentLanguages: recentLanguages.value
    })
  }

  /**
   * 保存设置
   */
  function saveSettings(): void {
    if (translateStorage.data.value) {
      translateStorage.data.value.settings.recentLanguages = recentLanguages.value
      translateStorage.data.value.settings.sidebarPosition = sidebarPosition.value
      translateStorage.data.value.settings.sidebarWidth = sidebarWidth.value
      translateStorage.data.value.settings.shortcut = shortcut.value
      translateStorage.data.value.timestamp = Date.now()
    }
  }

  return {
    records,
    recentLanguages,
    sidebarPosition,
    sidebarWidth,
    shortcut,
    addRecord,
    deleteRecord,
    clearRecords,
    toggleFavorite,
    getFavorites,
    updateRecentLanguages,
    exportHistory,
    importHistory,
    loadHistory,
    saveSettings
  }
}
