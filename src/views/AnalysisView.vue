<template>
  <div class="analysis-view">
    <!-- 主内容区 -->
    <div class="analysis-main">
      <!-- 顶部标题栏 -->
      <div class="analysis-header">
        <div class="header-left">
          <h2 class="page-title">
            <i class="fa-solid fa-file-lines"></i>
            文本分析助手
          </h2>
        </div>
        <div class="header-actions">
          <button class="header-btn" @click="showHistory = !showHistory" title="历史记录">
            <i class="fa-solid fa-history"></i>
          </button>
          <button class="header-btn" @click="saveResult" title="保存结果">
            <i class="fa-solid fa-save"></i>
          </button>
        </div>
      </div>

      <!-- 分析主体 -->
      <div class="analysis-body">
        <!-- 左侧功能面板 -->
        <div class="analysis-sidebar">
          <div class="sidebar-section">
            <div class="section-title">分析功能</div>
            <button
              v-for="func in analysisFunctions"
              :key="func.id"
              class="function-btn"
              :class="{ active: currentFunction === func.id }"
              @click="currentFunction = func.id"
            >
              <i :class="func.icon"></i>
              <span>{{ func.label }}</span>
            </button>
          </div>

          <div class="sidebar-section mode-section">
            <div class="section-title">分析模式</div>
            <select v-model="analysisMode" class="mode-select">
              <option v-for="mode in analysisModes" :key="mode.id" :value="mode.id">
                {{ mode.label }}
              </option>
            </select>
          </div>

          <div class="sidebar-section">
            <div class="section-title">常用模式</div>
            <div class="recent-modes">
              <button
                v-for="mode in recentModes"
                :key="mode"
                class="recent-mode-btn"
                @click="analysisMode = mode as 'standard' | 'deep' | 'concise'"
              >
                {{ getModeLabel(mode) }}
              </button>
              <span v-if="recentModes.length === 0" class="empty-hint">暂无常用模式</span>
            </div>
          </div>
        </div>

        <!-- 右侧主内容区 -->
        <div class="analysis-content">
          <!-- 输入区 -->
          <div class="input-section">
            <div class="section-header">
              <label class="section-label">输入文本</label>
              <div class="section-actions">
                <button class="action-btn" @click="pasteText" title="粘贴">
                  <i class="fa-solid fa-paste"></i> 粘贴
                </button>
                <button class="action-btn" @click="clearText" title="清空">
                  <i class="fa-solid fa-trash"></i> 清空
                </button>
              </div>
            </div>
            <textarea
              v-model="sourceText"
              class="source-textarea"
              placeholder="请粘贴需要分析的文本..."
            ></textarea>
            <div class="char-count-bar">
              <span class="char-count">{{ sourceText.length }} 字符</span>
            </div>
          </div>

          <!-- 分析按钮 -->
          <div class="analyze-action">
            <button
              class="analyze-btn"
              @click="doAnalyze"
              :disabled="!sourceText.trim() || isAnalyzing"
            >
              <i :class="isAnalyzing ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-magnifying-glass-chart'"></i>
              {{ isAnalyzing ? '分析中...' : '开始分析' }}
            </button>
          </div>

          <!-- 分析结果区 -->
          <div class="result-section">
            <div class="section-header">
              <label class="section-label">分析结果</label>
              <div class="section-actions">
                <button class="action-btn" @click="copyResult" title="复制全部">
                  <i class="fa-solid fa-copy"></i> 复制全部
                </button>
              </div>
            </div>
            <div class="result-content" :class="{ loading: isAnalyzing }">
              <!-- 加载中 -->
              <div v-if="isAnalyzing" class="analyzing-state">
                <div class="analyzing-indicator">
                  <i class="fa-solid fa-circle-notch fa-spin"></i>
                  <span>正在分析中...</span>
                </div>
                <div class="analyzing-progress">
                  <span>{{ analyzingProgress }}</span>
                </div>
              </div>

              <!-- 分析结果 -->
              <div v-else-if="analysisResult" class="analysis-result">
                <!-- 字数统计 -->
                <div class="result-card">
                  <div class="card-header">
                    <i class="fa-solid fa-chart-simple card-icon"></i>
                    <span class="card-title">字数统计</span>
                  </div>
                  <div class="card-body">
                    <div class="stat-row">
                      <span class="stat-label">总字数：</span>
                      <span class="stat-value">{{ analysisResult.wordCount.total }}</span>
                    </div>
                    <div class="stat-grid">
                      <div class="stat-item">
                        <span class="stat-sublabel">中文</span>
                        <span class="stat-subvalue">{{ analysisResult.wordCount.chinese }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-sublabel">英文</span>
                        <span class="stat-subvalue">{{ analysisResult.wordCount.english }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-sublabel">标点</span>
                        <span class="stat-subvalue">{{ analysisResult.wordCount.punctuation }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-sublabel">数字</span>
                        <span class="stat-subvalue">{{ analysisResult.wordCount.number }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-sublabel">其他</span>
                        <span class="stat-subvalue">{{ analysisResult.wordCount.other }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 内容标签 -->
                <div class="result-card" v-if="analysisResult.tags.length > 0">
                  <div class="card-header">
                    <i class="fa-solid fa-flag card-icon"></i>
                    <span class="card-title">内容标签</span>
                  </div>
                  <div class="card-body">
                    <div class="tags-container">
                      <span
                        v-for="(tag, index) in analysisResult.tags"
                        :key="index"
                        class="tag-badge"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 情绪分析 -->
                <div class="result-card" v-if="analysisResult.emotion">
                  <div class="card-header">
                    <i class="fa-solid fa-face-smile card-icon"></i>
                    <span class="card-title">内容情绪</span>
                  </div>
                  <div class="card-body">
                    <div class="emotion-bars">
                      <div class="emotion-bar">
                        <span class="emotion-label">积极</span>
                        <div class="bar-bg">
                          <div
                            class="bar-fill bar-positive"
                            :style="{ width: analysisResult.emotion.positive + '%' }"
                          ></div>
                        </div>
                        <span class="emotion-value">{{ analysisResult.emotion.positive }}%</span>
                      </div>
                      <div class="emotion-bar">
                        <span class="emotion-label">中性</span>
                        <div class="bar-bg">
                          <div
                            class="bar-fill bar-neutral"
                            :style="{ width: analysisResult.emotion.neutral + '%' }"
                          ></div>
                        </div>
                        <span class="emotion-value">{{ analysisResult.emotion.neutral }}%</span>
                      </div>
                      <div class="emotion-bar">
                        <span class="emotion-label">消极</span>
                        <div class="bar-bg">
                          <div
                            class="bar-fill bar-negative"
                            :style="{ width: analysisResult.emotion.negative + '%' }"
                          ></div>
                        </div>
                        <span class="emotion-value">{{ analysisResult.emotion.negative }}%</span>
                      </div>
                    </div>
                    <div class="main-emotion">
                      主要情绪：<span class="emotion-highlight">{{ analysisResult.emotion.mainEmotion }}</span>
                    </div>
                  </div>
                </div>

                <!-- 内容摘要 -->
                <div class="result-card" v-if="analysisResult.summary">
                  <div class="card-header">
                    <i class="fa-solid fa-align-left card-icon"></i>
                    <span class="card-title">内容摘要</span>
                  </div>
                  <div class="card-body">
                    <p class="summary-text">{{ analysisResult.summary }}</p>
                  </div>
                </div>

                <!-- 优化提示词 -->
                <div class="result-card" v-if="analysisResult.optimizedPrompt">
                  <div class="card-header">
                    <i class="fa-solid fa-wand-magic-sparkles card-icon text-primary"></i>
                    <span class="card-title text-primary">优化后提示词</span>
                  </div>
                  <div class="card-body">
                    <div class="prompt-box">{{ analysisResult.optimizedPrompt }}</div>
                  </div>
                </div>

                <!-- 原始响应（调试用） -->
                <div class="result-card" v-if="showRawResponse && analysisResult.rawResponse">
                  <div class="card-header">
                    <i class="fa-solid fa-code card-icon"></i>
                    <span class="card-title">原始响应</span>
                  </div>
                  <div class="card-body">
                    <pre class="raw-response">{{ analysisResult.rawResponse }}</pre>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-else class="empty-result">
                <i class="fa-solid fa-magnifying-glass-chart empty-icon"></i>
                <span class="empty-text">分析结果将显示在这里</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录面板 -->
    <div v-show="showHistory" class="history-panel" :class="{ left: historyPosition === 'left' }">
      <div class="history-header">
        <h3>
          <i class="fa-solid fa-history"></i>
          分析历史
        </h3>
        <div class="history-actions">
          <button class="history-action-btn" @click="exportHistory" title="导出">
            <i class="fa-solid fa-download"></i>
          </button>
          <button class="history-action-btn" @click="confirmClearHistory" title="清空">
            <i class="fa-solid fa-trash-can"></i>
          </button>
          <button class="history-action-btn" @click="toggleHistoryPosition" title="切换位置">
            <i class="fa-solid fa-right-left"></i>
          </button>
          <button class="history-action-btn close-history" @click="showHistory = false" title="关闭">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
      <div class="history-list">
        <div v-if="analysisRecords.length === 0" class="empty-history">
          <i class="fa-solid fa-clipboard"></i>
          <span>暂无分析记录</span>
        </div>
        <div
          v-for="record in analysisRecords"
          :key="record.id"
          class="history-item"
          :class="{ favorite: record.favorite }"
          @click="loadHistoryRecord(record)"
        >
          <div class="history-item-header">
            <span class="history-mode">{{ getModeLabel(record.mode) }}</span>
            <div class="history-item-actions">
              <button
                class="history-icon-btn"
                @click.stop="toggleFavorite(record.id)"
                :title="record.favorite ? '取消收藏' : '收藏'"
              >
                <i :class="record.favorite ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
              </button>
              <button class="history-icon-btn" @click.stop="deleteRecord(record.id)" title="删除">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          <div class="history-item-content">
            <div class="history-source">{{ record.sourceText.substring(0, 100) }}{{ record.sourceText.length > 100 ? '...' : '' }}</div>
          </div>
          <div class="history-item-footer">
            <span class="history-time">{{ formatTime(record.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotification } from '@/composables/useNotification'
import { useAnalysisHistory } from '@/composables/useAnalysisHistory'
import { analysisService, ANALYSIS_MODES, ANALYSIS_FUNCTIONS, type AnalysisRecord } from '@/services/ai/analysis'

// Notification
const { success, error: showError } = useNotification()

// 分析历史管理
const {
  records: analysisRecords,
  recentModes,
  addRecord,
  deleteRecord,
  clearRecords,
  toggleFavorite,
  exportHistory
} = useAnalysisHistory()

// State
const sourceText = ref('')
const isAnalyzing = ref(false)
const analyzingProgress = ref('')
const analysisResult = ref<any>(null)
const showHistory = ref(false)
const historyPosition = ref<'left' | 'right'>('right')

// 当前选择的功能和模式
const currentFunction = ref<'smart' | 'prompt' | 'wordcount' | 'tags' | 'polish'>('smart')
const analysisMode = ref<'standard' | 'deep' | 'concise'>('standard')

// 配置
const analysisModes = ANALYSIS_MODES
const analysisFunctions = ANALYSIS_FUNCTIONS

// 显示原始响应（调试用）
const showRawResponse = ref(false)

// 获取模式标签
function getModeLabel(mode: string): string {
  const m = ANALYSIS_MODES.find(m => m.id === mode)
  return m?.label || mode
}

// 粘贴文本
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    sourceText.value = text
    success('已粘贴剪贴板内容')
  } catch (err) {
    showError('无法访问剪贴板')
  }
}

// 清空文本
function clearText() {
  sourceText.value = ''
  analysisResult.value = null
  success('已清空')
}

// 复制结果
async function copyResult() {
  if (!analysisResult.value) {
    showError('暂无分析结果')
    return
  }

  const result = analysisResult.value
  const text = `【字数统计】
总字数：${result.wordCount.total} | 中文：${result.wordCount.chinese} | 英文：${result.wordCount.english} | 标点：${result.wordCount.punctuation}

【内容标签】
${result.tags.join(', ') || '无'}

【内容情绪】
积极：${result.emotion.positive}% | 中性：${result.emotion.neutral}% | 消极：${result.emotion.negative}%
主要情绪：${result.emotion.mainEmotion}

【内容摘要】
${result.summary}

【优化提示词】
${result.optimizedPrompt || '无'}
`

  try {
    await navigator.clipboard.writeText(text)
    success('已复制到剪贴板')
  } catch (err) {
    showError('复制失败')
  }
}

// 保存结果
async function saveResult() {
  if (!analysisResult.value) {
    showError('暂无分析结果')
    return
  }

  // 添加到历史记录
  addRecord({
    sourceText: sourceText.value,
    result: analysisResult.value,
    mode: analysisMode.value
  })

  success('分析结果已保存到历史记录')
}

// 执行分析
async function doAnalyze() {
  if (!sourceText.value.trim()) {
    showError('请输入需要分析的文本')
    return
  }

  isAnalyzing.value = true
  analyzingProgress.value = '准备分析...'
  analysisResult.value = null

  try {
    // 根据当前功能执行不同的分析
    switch (currentFunction.value) {
      case 'prompt':
        await doOptimizePrompt()
        break
      case 'polish':
        await doPolishText()
        break
      case 'tags':
        await doGenerateTags()
        break
      default:
        await doSmartAnalysis()
    }
  } catch (err) {
    showError(`分析失败：${(err as Error).message}`)
    analysisResult.value = {
      wordCount: { total: 0, chinese: 0, english: 0, punctuation: 0, number: 0, other: 0 },
      tags: [],
      emotion: { positive: 0, neutral: 100, negative: 0, mainEmotion: '分析失败' },
      summary: `分析失败：${(err as Error).message}`,
      optimizedPrompt: '',
      rawResponse: ''
    }
  } finally {
    isAnalyzing.value = false
    analyzingProgress.value = ''
  }
}

// 智能分析
async function doSmartAnalysis() {
  analyzingProgress.value = '正在分析文本...'

  let resultText = ''
  await analysisService.analyze(sourceText.value, analysisMode.value, (chunk) => {
    resultText += chunk
    analyzingProgress.value = `接收中... ${resultText.length} 字符`
  })

  // 重新分析以获取结构化结果
  const result = await analysisService.analyze(sourceText.value, analysisMode.value)
  analysisResult.value = result

  // 添加到历史记录
  addRecord({
    sourceText: sourceText.value,
    result,
    mode: analysisMode.value
  })

  analyzingProgress.value = '分析完成'
  success('分析完成')
}

// 优化提示词
async function doOptimizePrompt() {
  analyzingProgress.value = '正在优化提示词...'

  let result = ''
  await analysisService.optimizePrompt(sourceText.value, (chunk) => {
    result += chunk
    analyzingProgress.value = `优化中... ${result.length} 字符`
  })

  analysisResult.value = {
    wordCount: analysisService.countWords(sourceText.value),
    tags: [],
    emotion: { positive: 0, neutral: 100, negative: 0, mainEmotion: '中性' },
    summary: '提示词优化完成',
    optimizedPrompt: result,
    rawResponse: result
  }

  success('提示词优化完成')
}

// 润色文本
async function doPolishText() {
  analyzingProgress.value = '正在润色文本...'

  let result = ''
  await analysisService.polishText(sourceText.value, (chunk) => {
    result += chunk
    analyzingProgress.value = `润色中... ${result.length} 字符`
  })

  analysisResult.value = {
    wordCount: {
      ...analysisService.countWords(sourceText.value),
      other: 0
    },
    tags: [],
    emotion: { positive: 0, neutral: 100, negative: 0, mainEmotion: '中性' },
    summary: '润色后的文本：\n' + result,
    optimizedPrompt: '',
    rawResponse: result
  }

  success('文本润色完成')
}

// 生成标签
async function doGenerateTags() {
  analyzingProgress.value = '正在生成标签...'

  const tags = await analysisService.generateTags(sourceText.value, 8)

  analysisResult.value = {
    wordCount: analysisService.countWords(sourceText.value),
    tags,
    emotion: { positive: 0, neutral: 100, negative: 0, mainEmotion: '中性' },
    summary: '标签生成完成',
    optimizedPrompt: '',
    rawResponse: tags.join(', ')
  }

  success(`生成了 ${tags.length} 个标签`)
}

// 加载历史记录
function loadHistoryRecord(record: AnalysisRecord) {
  sourceText.value = record.sourceText
  analysisResult.value = record.result
  analysisMode.value = record.mode
  showHistory.value = false
  success('已加载历史记录')
}

// 格式化时间
function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`

  return date.toLocaleDateString('zh-CN')
}

// 清空历史
function confirmClearHistory() {
  if (confirm('确定要清空所有分析历史吗？')) {
    clearRecords()
    success('已清空历史记录')
  }
}

// 切换历史面板位置
function toggleHistoryPosition() {
  historyPosition.value = historyPosition.value === 'left' ? 'right' : 'left'
}

// 键盘快捷键
function handleKeyDown(e: KeyboardEvent) {
  // Ctrl+Enter 执行分析
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault()
    if (!isAnalyzing.value) {
      doAnalyze()
    }
  }

  // Ctrl+H 切换历史记录
  if (e.ctrlKey && e.key === 'h') {
    e.preventDefault()
    showHistory.value = !showHistory.value
  }

  // Ctrl+L 清空文本
  if (e.ctrlKey && e.key === 'l') {
    e.preventDefault()
    clearText()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.analysis-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  overflow: hidden;
}

.dark-theme .analysis-view {
  background: var(--color-bg-primary);
}

/* 主内容区 */
.analysis-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部工具栏 */
.analysis-header {
  height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  position: relative;
}

.dark-theme .analysis-header {
  border-bottom-color: var(--color-border);
  background: var(--color-bg-primary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  position: absolute;
  right: 24px;
  display: flex;
  gap: 8px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
}

.page-title i {
  color: var(--color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.dark-theme .header-btn {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.header-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dark-theme .header-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 分析主体 */
.analysis-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧功能面板 */
.analysis-sidebar {
  width: 200px;
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 24px;
}

.dark-theme .analysis-sidebar {
  border-right-color: var(--color-border);
  background: var(--color-bg-secondary);
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark-theme .section-title {
  color: var(--color-text-tertiary);
}

.function-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.dark-theme .function-btn {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.function-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.dark-theme .function-btn:hover {
  background: var(--color-bg-secondary);
}

.function-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.function-btn.active i {
  color: white;
}

.mode-section {
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
}

.dark-theme .mode-section {
  border-top-color: var(--color-border);
}

.mode-select {
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  outline: none;
}

.dark-theme .mode-select {
  border-color: var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.mode-select:focus {
  border-color: var(--color-primary);
}

.recent-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recent-mode-btn {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.dark-theme .recent-mode-btn {
  border-color: var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-tertiary);
}

.recent-mode-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.empty-hint {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-style: italic;
}

/* 右侧主内容区 */
.analysis-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px;
  gap: 20px;
}

/* 输入区 */
.input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.dark-theme .section-label {
  color: var(--color-text-tertiary);
}

.section-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.dark-theme .action-btn {
  color: var(--color-text-tertiary);
}

.action-btn:hover {
  color: var(--color-primary);
  background: var(--color-bg-tertiary);
}

.dark-theme .action-btn:hover {
  background: var(--color-bg-secondary);
}

.source-textarea {
  width: 100%;
  height: 160px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}

.dark-theme .source-textarea {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.source-textarea:focus {
  border-color: var(--color-primary);
}

.source-textarea::placeholder {
  color: var(--color-text-tertiary);
}

.char-count-bar {
  display: flex;
  justify-content: flex-end;
}

.char-count {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* 分析按钮 */
.analyze-action {
  display: flex;
  justify-content: center;
}

.analyze-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 40px;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: white;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  background: rgba(94, 106, 210, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(94, 106, 210, 0.3);
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 结果区 */
.result-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.result-content {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-primary);
  padding: 20px;
  overflow-y: auto;
}

.dark-theme .result-content {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
}

.result-content.loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 加载状态 */
.analyzing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.analyzing-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 16px;
}

.dark-theme .analyzing-indicator {
  color: var(--color-text-tertiary);
}

.analyzing-progress {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

/* 空状态 */
.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  color: var(--color-text-tertiary);
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

/* 结果卡片 */
.analysis-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
}

.dark-theme .result-card {
  border-color: var(--color-border);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.dark-theme .card-header {
  background: var(--color-bg-primary);
  border-bottom-color: var(--color-border);
}

.card-icon {
  font-size: 16px;
  color: var(--color-primary);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.dark-theme .card-title {
  color: var(--color-text-primary);
}

.card-body {
  padding: 16px;
}

/* 字数统计 */
.stat-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.dark-theme .stat-label {
  color: var(--color-text-tertiary);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-primary);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
}

.dark-theme .stat-item {
  background: var(--color-bg-primary);
}

.stat-sublabel {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.dark-theme .stat-sublabel {
  color: var(--color-text-tertiary);
}

.stat-subvalue {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.dark-theme .stat-subvalue {
  color: var(--color-text-primary);
}

/* 标签 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-badge {
  padding: 6px 12px;
  border-radius: var(--radius-xl);
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-size: 12px;
  font-weight: 500;
}

.dark-theme .tag-badge {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

/* 情绪条 */
.emotion-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.emotion-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.emotion-label {
  width: 40px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.dark-theme .emotion-label {
  color: var(--color-text-tertiary);
}

.bar-bg {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--color-border);
  overflow: hidden;
}

.dark-theme .bar-bg {
  background: var(--color-bg-secondary);
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.bar-positive {
  background: var(--color-success);
}

.bar-neutral {
  background: var(--color-text-secondary);
}

.bar-negative {
  background: var(--color-danger);
}

.emotion-value {
  width: 45px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.dark-theme .emotion-value {
  color: var(--color-text-primary);
}

.main-emotion {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.dark-theme .main-emotion {
  color: var(--color-text-tertiary);
}

.emotion-highlight {
  font-weight: 600;
  color: var(--color-primary);
}

/* 摘要 */
.summary-text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text-primary);
}

.dark-theme .summary-text {
  color: var(--color-text-primary);
}

/* 提示词框 */
.prompt-box {
  padding: 14px;
  border-radius: var(--radius-md);
  background: rgba(94, 106, 210, 0.1);
  border: 1px solid rgba(94, 106, 210, 0.2);
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text-primary);
}

.dark-theme .prompt-box {
  background: rgba(94, 106, 210, 0.15);
  color: var(--color-text-primary);
}

/* 原始响应 */
.raw-response {
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--color-bg-secondary);
  padding: 12px;
  border-radius: var(--radius-md);
  font-family: 'Consolas', 'Monaco', monospace;
}

.dark-theme .raw-response {
  background: var(--color-bg-primary);
}

/* 历史记录面板 */
.history-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 360px;
  height: 100%;
  background: var(--color-bg-primary);
  border-left: 1px solid var(--color-border);
  z-index: 100;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
}

.dark-theme .history-panel {
  background: var(--color-bg-secondary);
  border-left-color: var(--color-border);
}

.history-panel.left {
  right: auto;
  left: 0;
  border-left: none;
  border-right: 1px solid var(--color-border);
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.dark-theme .history-header {
  border-bottom-color: var(--color-border);
}

.history-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.dark-theme .history-header h3 {
  color: var(--color-text-primary);
}

.history-header h3 i {
  color: var(--color-primary);
}

.history-actions {
  display: flex;
  gap: 4px;
}

.history-action-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.dark-theme .history-action-btn {
  color: var(--color-text-tertiary);
}

.history-action-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.dark-theme .history-action-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  color: var(--color-text-tertiary);
}

.empty-history i {
  font-size: 40px;
  opacity: 0.5;
}

.history-item {
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-bg-primary);
}

.dark-theme .history-item {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
}

.history-item:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.dark-theme .history-item:hover {
  background: var(--color-bg-secondary);
}

.history-item.favorite {
  border-color: rgba(251, 191, 36, 0.5);
  background: rgba(251, 191, 36, 0.05);
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-mode {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 500;
}

.history-item-actions {
  display: flex;
  gap: 4px;
}

.history-icon-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s;
}

.dark-theme .history-icon-btn {
  color: var(--color-text-tertiary);
}

.history-icon-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.dark-theme .history-icon-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}

.history-item-content {
  margin-bottom: 8px;
}

.history-source {
  font-size: 13px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.dark-theme .history-source {
  color: var(--color-text-tertiary);
}

.history-item-footer {
  display: flex;
  justify-content: flex-end;
}

.history-time {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.dark-theme .history-time {
  color: var(--color-text-secondary);
}

/* 深色主题适配 */
.dark-theme .text-primary {
  color: var(--color-primary);
}

</style>
