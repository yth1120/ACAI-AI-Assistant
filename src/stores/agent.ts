/**
 * Agent Store
 * 管理文档 Agent 的状态和历史记录
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AgentTask, AgentTaskType, DocumentConfig } from '@/services/ai/agent'
import { agentService } from '@/services/ai/agent'

/** 存储键名 */
const STORAGE_KEY = 'agent_task_history'

/** 历史记录项 */
export interface AgentHistoryItem {
  id: string
  type: AgentTaskType
  requirement: string
  result: DocumentConfig
  createdAt: number
  favorite: boolean
}

export const useAgentStore = defineStore('agent', () => {
  // ============ State ============

  const currentTask = ref<AgentTask | null>(null)
  const isProcessing = ref(false)
  const processingText = ref('')
  const output = ref('')
  const history = ref<AgentHistoryItem[]>([])
  const showHistory = ref(false)

  // ============ Computed ============

  const hasResult = computed(() => !!currentTask.value?.result)
  const favoriteItems = computed(() => history.value.filter(item => item.favorite))

  // ============ Actions ============

  /**
   * 执行 Agent 任务
   */
  async function executeTask(
    type: AgentTaskType,
    requirement: string
  ): Promise<DocumentConfig | null> {
    if (isProcessing.value) {
      console.warn('已有任务在处理中')
      return null
    }

    isProcessing.value = true
    processingText.value = 'AI 正在思考文档结构...'
    output.value = ''

    const task: AgentTask = {
      id: agentService.generateTaskId(),
      type,
      requirement,
      status: 'planning',
      createdAt: Date.now()
    }
    currentTask.value = task

    try {
      const result = await agentService.executeTask(type, requirement, (chunk, count) => {
        output.value += chunk
        if (count <= 5) {
          processingText.value = 'AI 正在规划文档大纲...'
        } else if (count <= 20) {
          processingText.value = 'AI 正在生成文档内容...'
        } else {
          processingText.value = 'AI 正在完善细节...'
        }
      })

      task.status = 'completed'
      task.result = result
      task.completedAt = Date.now()

      processingText.value = '文档生成完成！'

      // 保存到历史记录
      saveToHistory(task)

      return result
    } catch (err) {
      task.status = 'error'
      task.error = (err as Error).message
      processingText.value = `生成失败：${task.error}`
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 补全文档
   */
  async function completeDocument(
    file: File,
    instruction: string
  ): Promise<DocumentConfig | null> {
    if (isProcessing.value) {
      console.warn('已有任务在处理中')
      return null
    }

    isProcessing.value = true
    processingText.value = '正在解析文档...'
    output.value = ''

    const task: AgentTask = {
      id: agentService.generateTaskId(),
      type: 'complete',
      requirement: instruction,
      status: 'planning',
      createdAt: Date.now()
    }
    currentTask.value = task

    try {
      const result = await agentService.completeDocument(file, instruction, (chunk, count) => {
        output.value += chunk
        if (count <= 5) {
          processingText.value = 'AI 正在分析文档结构...'
        } else if (count <= 15) {
          processingText.value = 'AI 正在理解上下文...'
        } else {
          processingText.value = 'AI 正在生成补全内容...'
        }
      })

      task.status = 'completed'
      task.result = result
      task.completedAt = Date.now()

      processingText.value = '文档补全完成！'

      // 保存到历史记录
      saveToHistory(task)

      return result
    } catch (err) {
      task.status = 'error'
      task.error = (err as Error).message
      processingText.value = `补全失败：${task.error}`
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 下载文档
   */
  function downloadDocument(config: DocumentConfig): void {
    agentService.downloadDocument(config)
  }

  /**
   * 保存到历史记录
   */
  function saveToHistory(task: AgentTask): void {
    if (!task.result) return

    const item: AgentHistoryItem = {
      id: task.id,
      type: task.type,
      requirement: task.requirement,
      result: task.result,
      createdAt: task.createdAt,
      favorite: false
    }

    history.value.unshift(item)

    // 限制历史记录数量
    if (history.value.length > 50) {
      history.value = history.value.slice(0, 50)
    }

    persistHistory()
  }

  /**
   * 从历史记录加载
   */
  function loadFromHistory(id: string): AgentHistoryItem | null {
    return history.value.find(item => item.id === id) || null
  }

  /**
   * 删除历史记录
   */
  function deleteHistoryItem(id: string): void {
    history.value = history.value.filter(item => item.id !== id)
    persistHistory()
  }

  /**
   * 切换收藏状态
   */
  function toggleFavorite(id: string): void {
    const item = history.value.find(i => i.id === id)
    if (item) {
      item.favorite = !item.favorite
      persistHistory()
    }
  }

  /**
   * 清空历史记录
   */
  function clearHistory(): void {
    history.value = []
    persistHistory()
  }

  /**
   * 重置当前任务
   */
  function resetTask(): void {
    currentTask.value = null
    output.value = ''
    processingText.value = ''
  }

  // ============ 持久化 ============

  function persistHistory(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
    } catch (err) {
      console.error('保存历史记录失败:', err)
    }
  }

  function loadHistory(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        history.value = JSON.parse(saved)
      }
    } catch (err) {
      console.error('加载历史记录失败:', err)
    }
  }

  // 初始化
  loadHistory()

  return {
    // State
    currentTask,
    isProcessing,
    processingText,
    output,
    history,
    showHistory,
    // Computed
    hasResult,
    favoriteItems,
    // Actions
    executeTask,
    completeDocument,
    downloadDocument,
    loadFromHistory,
    deleteHistoryItem,
    toggleFavorite,
    clearHistory,
    resetTask
  }
})
