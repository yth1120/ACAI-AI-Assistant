import { ref, watch } from 'vue'
import { useStorage } from './useStorage'
import type { AnalysisRecord } from '@/services/ai/analysis'
import type { AnalysisMode } from '@/services/ai/analysis'

const STORAGE_KEY = 'acai-analysis-history'
const SETTINGS_KEY = 'acai-analysis-settings'

export interface AnalysisHistorySettings {
  maxRecords: number
  autoSave: boolean
}

export function useAnalysisHistory() {
  // 历史记录
  const records = ref<AnalysisRecord[]>([])

  // 设置
  const settings = ref<AnalysisHistorySettings>({
    maxRecords: 100,
    autoSave: true
  })

  // 常用分析模式
  const recentModes = ref<AnalysisMode[]>([])

  // 加载历史记录
  function loadHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        records.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load analysis history:', e)
      records.value = []
    }
  }

  // 加载设置
  function loadSettings() {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        settings.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load analysis settings:', e)
    }
  }

  // 保存历史记录
  function saveHistory() {
    if (!settings.value.autoSave) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
    } catch (e) {
      console.error('Failed to save analysis history:', e)
    }
  }

  // 保存设置
  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
    } catch (e) {
      console.error('Failed to save analysis settings:', e)
    }
  }

  // 添加分析记录
  function addRecord(record: Omit<AnalysisRecord, 'id' | 'timestamp' | 'favorite'>) {
    const newRecord: AnalysisRecord = {
      ...record,
      id: generateId(),
      timestamp: new Date().toISOString(),
      favorite: false
    }

    records.value.unshift(newRecord)

    // 更新常用模式
    if (!recentModes.value.includes(record.mode)) {
      recentModes.value = [record.mode, ...recentModes.value.filter(m => m !== record.mode)].slice(0, 3)
    }

    // 限制记录数量
    if (records.value.length > settings.value.maxRecords) {
      records.value = records.value.slice(0, settings.value.maxRecords)
    }

    saveHistory()
    return newRecord
  }

  // 删除记录
  function deleteRecord(id: string) {
    const index = records.value.findIndex(r => r.id === id)
    if (index !== -1) {
      records.value.splice(index, 1)
      saveHistory()
      return true
    }
    return false
  }

  // 清空记录
  function clearRecords() {
    records.value = []
    saveHistory()
  }

  // 切换收藏
  function toggleFavorite(id: string) {
    const record = records.value.find(r => r.id === id)
    if (record) {
      record.favorite = !record.favorite
      saveHistory()
      return true
    }
    return false
  }

  // 导出历史记录
  function exportHistory(): void {
    if (records.value.length === 0) {
      console.warn('没有可导出的分析记录')
      return
    }

    const data = {
      exportTime: new Date().toISOString(),
      totalRecords: records.value.length,
      records: records.value
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `分析历史_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 生成唯一 ID
  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 监听记录变化自动保存
  watch(records, () => {
    if (settings.value.autoSave) {
      saveHistory()
    }
  }, { deep: true })

  // 初始化加载
  loadHistory()
  loadSettings()

  return {
    records,
    settings,
    recentModes,
    addRecord,
    deleteRecord,
    clearRecords,
    toggleFavorite,
    exportHistory,
    saveSettings,
    loadHistory,
    loadSettings
  }
}
