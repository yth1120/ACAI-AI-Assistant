<template>
  <div class="writing-view">
    <!-- 主内容区 -->
    <div class="writing-main">
      <!-- 顶部工具栏 -->
      <div class="writing-header">
        <div class="header-left">
          <h2 class="page-title">
            <i class="fa-solid fa-pen-nib"></i>
            写作助手
          </h2>
        </div>
        <div class="header-actions">
          <button class="header-btn" @click.stop="saveDraft()" title="保存草稿">
            <i class="fa-solid fa-save"></i>
            <span>保存草稿</span>
          </button>
          <button class="header-btn" @click="showHistory = !showHistory" title="历史记录">
            <i class="fa-solid fa-history"></i>
          </button>
          <button class="header-btn" @click="showSettings = true" title="设置">
            <i class="fa-solid fa-gear"></i>
          </button>
        </div>
      </div>

      <!-- 写作主体 -->
      <div class="writing-body">
        <!-- 左侧功能面板 -->
        <div class="writing-sidebar">
          <div class="sidebar-section">
            <div class="section-title">写作功能</div>
            <div class="feature-list">
              <button
                v-for="feature in writingFeatures"
                :key="feature.id"
                class="feature-btn"
                :class="{ active: currentFeature === feature.id }"
                @click="selectFeature(feature.id)"
              >
                <i :class="feature.icon"></i>
                <span>{{ feature.label }}</span>
              </button>
            </div>
          </div>

          <!-- 长文本设置 -->
          <div class="sidebar-section" v-if="currentFeature === 'long-text'">
            <div class="section-title">长文本设置</div>
            <div class="setting-list">
              <div class="setting-item">
                <span class="setting-label">自动保存</span>
                <label class="switch">
                  <input type="checkbox" v-model="autoSaveEnabled" checked />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="setting-item">
                <span class="setting-label">字数提醒</span>
                <label class="switch">
                  <input type="checkbox" v-model="wordCountAlertEnabled" checked />
                  <span class="slider"></span>
                </label>
              </div>
              <div class="setting-item">
                <span class="setting-label">目标字数</span>
                <input
                  type="number"
                  v-model="targetWordCount"
                  class="setting-input"
                  placeholder="1000"
                />
              </div>
            </div>
          </div>

          <!-- 写作模板 -->
          <div class="sidebar-section mt-auto">
            <div class="section-title">常用模板</div>
            <select v-model="selectedTemplate" class="template-select">
              <option
                v-for="template in writingTemplates"
                :key="template.id"
                :value="template.id"
              >
                {{ template.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 主编辑区 -->
        <div class="writing-editor">
          <!-- 标题输入 -->
          <div class="editor-section">
            <div class="section-header">
              <label class="section-label">文章标题</label>
              <button class="section-action" @click="smartGenerateTitle" title="智能拟题">
                <i class="fa-solid fa-magic"></i>
                智能拟题
              </button>
            </div>
            <input
              v-model="articleTitle"
              type="text"
              class="title-input"
              placeholder="输入文章标题..."
            />
          </div>

          <!-- 内容编辑区 -->
          <div class="editor-section flex-1">
            <div class="section-header">
              <label class="section-label">写作内容</label>
              <div class="section-actions">
                <button class="section-action" @click="pasteContent" title="粘贴">
                  <i class="fa-solid fa-paste"></i> 粘贴
                </button>
                <button class="section-action" @click="clearContent" title="清空">
                  <i class="fa-solid fa-trash"></i> 清空
                </button>
                <button class="section-action" @click="fullscreenEdit" title="全屏编辑">
                  <i class="fa-solid fa-expand"></i> 全屏编辑
                </button>
              </div>
            </div>
            <div class="textarea-container">
              <textarea
                ref="editorRef"
                v-model="articleContent"
                class="content-textarea"
                :placeholder="getPlaceholder()"
                @input="handleContentInput"
              ></textarea>
            </div>
            <!-- 字数统计 -->
            <div class="word-count-bar" :class="{ 'reached': wordCountReached }">
              <i class="fa-solid fa-info-circle"></i>
              <span>{{ autoSaveStatus }}（每 30 秒一次），当前字数：{{ currentWordCount }}/{{ targetWordCount }}</span>
              <span v-if="wordCountReached" class="reached-badge">
                <i class="fa-solid fa-check-circle"></i> 已达标
              </span>
            </div>
          </div>

          <!-- 快捷操作栏 -->
          <div class="quick-actions">
            <button
              class="quick-action-btn"
              @click="continueWriting"
              :disabled="!articleContent.trim() || isProcessing"
            >
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>智能续写</span>
            </button>
            <button
              class="quick-action-btn"
              @click="polishText"
              :disabled="!articleContent.trim() || isProcessing"
            >
              <i class="fa-solid fa-pen-to-square"></i>
              <span>文本润色</span>
            </button>
            <button
              class="quick-action-btn"
              @click="formatText"
              :disabled="!articleContent.trim() || isProcessing"
            >
              <i class="fa-solid fa-list-ol"></i>
              <span>段落排版</span>
            </button>
            <button
              class="quick-action-btn"
              @click="checkSpelling"
              :disabled="!articleContent.trim() || isProcessing"
            >
              <i class="fa-solid fa-spell-check"></i>
              <span>错别字检查</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录面板 -->
    <div v-show="showHistory" class="history-panel">
      <div class="history-header">
        <h3>
          <i class="fa-solid fa-history"></i>
          写作历史
        </h3>
        <div class="history-actions">
          <button class="history-action-btn" @click="exportHistory" title="导出">
            <i class="fa-solid fa-download"></i>
          </button>
          <button class="history-action-btn" @click="clearHistory" title="清空">
            <i class="fa-solid fa-trash-can"></i>
          </button>
          <button class="history-action-btn close-history" @click="showHistory = false" title="关闭">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
      <div class="history-list">
        <div v-if="writingRecords.length === 0" class="empty-history">
          <i class="fa-solid fa-clipboard"></i>
          <span>暂无写作记录</span>
        </div>
        <div
          v-for="record in writingRecords"
          :key="record.id"
          class="history-item"
          :class="{ favorite: record.favorite }"
        >
          <div class="history-item-header">
            <span class="history-title">{{ record.title || '无标题' }}</span>
            <div class="history-item-actions">
              <button
                class="history-icon-btn"
                @click="toggleFavorite(record.id)"
                :title="record.favorite ? '取消收藏' : '收藏'"
              >
                <i :class="record.favorite ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
              </button>
              <button class="history-icon-btn" @click="loadHistoryRecord(record)" title="载入">
                <i class="fa-solid fa-download"></i>
              </button>
              <button class="history-icon-btn" @click="deleteRecord(record.id)" title="删除">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          <div class="history-item-content">
            <div class="history-preview">{{ previewContent(record.content) }}</div>
          </div>
          <div class="history-item-footer">
            <span class="history-time">{{ formatTime(record.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <div v-show="showSettings" class="modal-overlay" @click="closeSettings">
      <div class="settings-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fa-solid fa-gear"></i>
            写作助手设置
          </h3>
          <button class="modal-close" @click="closeSettings">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="setting-group">
            <label class="setting-label">自动保存间隔（秒）</label>
            <input
              v-model="autoSaveInterval"
              type="number"
              class="setting-input"
              min="10"
              max="300"
            />
          </div>
          <div class="setting-group">
            <label class="setting-label">历史记录保留数量</label>
            <input
              v-model="historyLimit"
              type="number"
              class="setting-input"
              min="10"
              max="500"
            />
          </div>
          <div class="setting-group">
            <label class="setting-label">默认写作风格</label>
            <select v-model="defaultStyle" class="setting-select">
              <option
                v-for="style in writingStyles"
                :key="style.id"
                :value="style.id"
              >
                {{ style.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="saveSettings">保存设置</button>
        </div>
      </div>
    </div>

    <!-- 加载提示 -->
    <div v-if="isProcessing" class="processing-overlay">
      <div class="processing-content">
        <i class="fa-solid fa-circle-notch fa-spin"></i>
        <span>{{ processingText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useNotification } from '@/composables/useNotification'
import { writingService, WRITING_FEATURES, WRITING_TEMPLATES, WRITING_STYLES, WritingFeature } from '@/services/ai/writing'
import type { WritingStyle, WritingTemplateOption, WritingFeatureOption } from '@/services/ai/writing'

// 类型定义
interface WritingHistoryRecord {
  id: string
  title: string
  content: string
  timestamp: number
  favorite: boolean
  feature: string
}

// Store
const { success, error: showError, info } = useNotification()

// 响应式数据
const currentFeature = ref<WritingFeature>('long-text')
const articleTitle = ref('')
const articleContent = ref('')
const selectedTemplate = ref<WritingTemplateOption['id']>('free')
const writingFeatures = ref<WritingFeatureOption[]>(WRITING_FEATURES)
const writingTemplates = ref<WritingTemplateOption[]>(WRITING_TEMPLATES)
const writingStyles = ref<WritingStyle[]>(WRITING_STYLES)

// 长文本设置
const autoSaveEnabled = ref(true)
const wordCountAlertEnabled = ref(true)
const targetWordCount = ref(1000)
const currentWordCount = ref(0)
const wordCountReached = ref(false)
const autoSaveStatus = ref('已开启自动保存')

// 状态
const isProcessing = ref(false)
const processingText = ref('处理中...')
const showHistory = ref(false)
const showSettings = ref(false)
const writingRecords = ref<WritingHistoryRecord[]>([])
const defaultStyle = ref('neutral')
const autoSaveInterval = ref(30)
const historyLimit = ref(50)

// 计算属性
const editorRef = ref<HTMLTextAreaElement | null>(null)

// 自动保存定时器
let autoSaveTimer: number | null = null

// 生命周期
onMounted(() => {
  loadHistory()
  startAutoSave()
})

onUnmounted(() => {
  stopAutoSave()
})

// 字数统计
function handleContentInput() {
  currentWordCount.value = articleContent.value.length
  wordCountReached.value = currentWordCount.value >= targetWordCount.value

  if (wordCountReached.value && wordCountAlertEnabled.value) {
    info(`已达到目标字数 ${targetWordCount.value} 字！`)
  }
}

// 获取占位符
function getPlaceholder(): string {
  const template = writingTemplates.value.find(t => t.id === selectedTemplate.value)
  const templateName = template?.label || '自由写作'
  return `请开始你的${templateName}，支持长文本输入、自动保存、智能续写...\n\n示例：本周工作围绕项目推进展开，主要完成了以下几项任务：\n1. 对接需求方，确认项目核心功能点；\n2. 协调团队资源，推进开发进度；\n3. 梳理项目难点，制定解决方案...\n\n（可输入数千字，自动适配滚动，支持拉伸调整高度）`
}

// 选择功能
function selectFeature(feature: WritingFeature) {
  currentFeature.value = feature
}

// 智能拟题
async function smartGenerateTitle() {
  if (!articleContent.value.trim()) {
    showError('请先输入内容再生成标题')
    return
  }

  isProcessing.value = true
  processingText.value = '智能拟题中...'

  try {
    const prompt = `请为以下内容生成 3 个合适的标题，每个标题一行，简洁明了：\n\n${articleContent.value.substring(0, 1000)}`
    const result = await writingService.write('long-text', {
      title: '生成标题',
      content: prompt,
      requirements: '生成 3 个简洁的标题'
    })

    articleTitle.value = result.split('\n')[0].replace(/^\d+[.、]\s*/, '') || articleTitle.value
    success('标题生成成功！')
  } catch (err) {
    showError(`生成标题失败：${(err as Error).message}`)
  } finally {
    isProcessing.value = false
  }
}

// 智能续写
async function continueWriting() {
  if (!articleContent.value.trim()) {
    showError('请先输入内容再续写')
    return
  }

  isProcessing.value = true
  processingText.value = '智能续写中...'

  try {
    await writingService.continueWriting(articleContent.value, (chunk) => {
      articleContent.value += chunk
      handleContentInput()
    })
    success('续写完成！')
  } catch (err) {
    showError(`续写失败：${(err as Error).message}`)
  } finally {
    isProcessing.value = false
  }
}

// 文本润色
async function polishText() {
  if (!articleContent.value.trim()) {
    showError('请先输入内容再润色')
    return
  }

  isProcessing.value = true
  processingText.value = '文本润色中...'

  const originalContent = articleContent.value

  try {
    articleContent.value = ''

    await writingService.polishText(originalContent, (chunk) => {
      articleContent.value += chunk
      handleContentInput()
    })
    success('润色完成！')
  } catch (err) {
    articleContent.value = originalContent
    showError(`润色失败：${(err as Error).message}`)
  } finally {
    isProcessing.value = false
  }
}

// 段落排版
async function formatText() {
  if (!articleContent.value.trim()) {
    showError('请先输入内容再排版')
    return
  }

  isProcessing.value = true
  processingText.value = '段落排版中...'

  const originalContent = articleContent.value

  try {
    articleContent.value = ''

    await writingService.formatText(originalContent, (chunk) => {
      articleContent.value += chunk
      handleContentInput()
    })
    success('排版完成！')
  } catch (err) {
    articleContent.value = originalContent
    showError(`排版失败：${(err as Error).message}`)
  } finally {
    isProcessing.value = false
  }
}

// 错别字检查
async function checkSpelling() {
  if (!articleContent.value.trim()) {
    showError('请先输入内容再检查')
    return
  }

  isProcessing.value = true
  processingText.value = '错别字检查中...'

  try {
    const result = await writingService.checkSpelling(articleContent.value)

    // 显示检查结果
    showSpellingResult(result)
    success('检查完成！')
  } catch (err) {
    showError(`检查失败：${(err as Error).message}`)
  } finally {
    isProcessing.value = false
  }
}

// 显示错别字检查结果
function showSpellingResult(result: string) {
  const newWindow = window.open('', '_blank')
  if (newWindow) {
    newWindow.document.write(`
      <html>
        <head>
          <title>错别字检查结果</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; line-height: 1.6; }
            h2 { color: var(--color-text-primary); }
            pre { white-space: pre-wrap; background: var(--color-bg-tertiary); padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h2>错别字检查结果</h2>
          <pre>${result}</pre>
        </body>
      </html>
    `)
  }
}

// 粘贴内容
async function pasteContent() {
  try {
    const text = await navigator.clipboard.readText()
    articleContent.value = text
    handleContentInput()
    success('粘贴成功！')
  } catch (err) {
    showError('粘贴失败，请手动粘贴')
  }
}

// 清空内容
function clearContent() {
  if (!articleContent.value.trim()) {
    info('内容已经为空')
    return
  }

  if (confirm('确定要清空所有内容吗？')) {
    articleContent.value = ''
    articleTitle.value = ''
    currentWordCount.value = 0
    wordCountReached.value = false
    success('已清空内容')
  }
}

// 全屏编辑
function fullscreenEdit() {
  const textarea = editorRef.value
  if (!textarea) return

  if (textarea.requestFullscreen) {
    textarea.requestFullscreen()
  }
}

// 自动保存
function startAutoSave() {
  stopAutoSave()

  autoSaveTimer = window.setInterval(() => {
    if (autoSaveEnabled.value && articleContent.value.trim()) {
      saveDraft(true)
    }
  }, autoSaveInterval.value * 1000)
}

function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// 保存草稿
function saveDraft(isAutoSave = false) {
  if (!articleContent.value.trim() && !articleTitle.value.trim()) {
    if (!isAutoSave) {
      info('没有可保存的内容')
    }
    return
  }

  const record: WritingHistoryRecord = {
    id: Date.now().toString(),
    title: articleTitle.value || '无标题',
    content: articleContent.value,
    timestamp: Date.now(),
    favorite: false,
    feature: currentFeature.value
  }

  writingRecords.value.unshift(record)

  // 限制历史记录数量
  if (writingRecords.value.length > historyLimit.value) {
    writingRecords.value = writingRecords.value.slice(0, historyLimit.value)
  }

  saveHistory()

  if (!isAutoSave) {
    success('草稿保存成功！')
  } else {
    autoSaveStatus.value = '已自动保存'
    setTimeout(() => {
      autoSaveStatus.value = '已开启自动保存'
    }, 2000)
  }
}

// 历史记录管理
function saveHistory() {
  localStorage.setItem('writing_history', JSON.stringify(writingRecords.value))
}

function loadHistory() {
  try {
    const saved = localStorage.getItem('writing_history')
    if (saved) {
      writingRecords.value = JSON.parse(saved)
    }
  } catch (err) {
    console.error('加载历史记录失败:', err)
  }
}

function previewContent(content: string): string {
  const maxLength = 100
  if (content.length <= maxLength) {
    return content
  }
  return content.substring(0, maxLength) + '...'
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

function toggleFavorite(id: string) {
  const record = writingRecords.value.find(r => r.id === id)
  if (record) {
    record.favorite = !record.favorite
    saveHistory()
  }
}

function loadHistoryRecord(record: WritingHistoryRecord) {
  articleTitle.value = record.title
  articleContent.value = record.content
  currentFeature.value = record.feature as WritingFeature
  handleContentInput()
  showHistory.value = false
  success('已载入历史记录')
}

function deleteRecord(id: string) {
  if (confirm('确定要删除这条记录吗？')) {
    writingRecords.value = writingRecords.value.filter(r => r.id !== id)
    saveHistory()
    success('已删除记录')
  }
}

function clearHistory() {
  if (confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
    writingRecords.value = []
    saveHistory()
    success('已清空历史记录')
  }
}

function exportHistory() {
  const data = JSON.stringify(writingRecords.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `写作历史_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  success('导出成功！')
}

// 设置管理
function closeSettings() {
  showSettings.value = false
}

function saveSettings() {
  const settings = {
    autoSaveInterval: autoSaveInterval.value,
    historyLimit: historyLimit.value,
    defaultStyle: defaultStyle.value
  }
  localStorage.setItem('writing_settings', JSON.stringify(settings))
  showSettings.value = false
  startAutoSave()
  success('设置保存成功！')
}

// 加载设置
function loadSettings() {
  try {
    const saved = localStorage.getItem('writing_settings')
    if (saved) {
      const settings = JSON.parse(saved)
      autoSaveInterval.value = settings.autoSaveInterval || 30
      historyLimit.value = settings.historyLimit || 50
      defaultStyle.value = settings.defaultStyle || 'neutral'
    }
  } catch (err) {
    console.error('加载设置失败:', err)
  }
}

// 监听设置变化
watch(autoSaveInterval, () => {
  startAutoSave()
})

// 初始化加载设置
loadSettings()
</script>

<style scoped>
.writing-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  --bg-color: var(--color-text-inverse);
  --card-bg: var(--color-bg-secondary);
  --border-color: var(--color-border);
  --text-color: var(--color-text-primary);
  --text-color-secondary: var(--color-text-secondary);
  --hover-bg: var(--color-bg-tertiary);
  --primary-color: var(--color-primary);
  --primary-light: var(--color-primary-light);
  --success-color: var(--color-success);
}

.writing-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部 */
.writing-header {
  height: 56px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background: var(--color-bg-primary);
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  position: absolute;
  right: 16px;
  display: flex;
  gap: 8px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-title i {
  color: var(--color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-btn {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.header-btn:hover {
  background: var(--hover-bg);
}

/* 主体 */
.writing-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 侧边栏 */
.writing-sidebar {
  width: 220px;
  border-right: 1px solid var(--border-color);
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 16px;
}

.sidebar-section.mt-auto {
  margin-top: auto;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 8px;
  padding-left: 4px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feature-btn {
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

.feature-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-bg-hover);
}

.feature-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.feature-btn i {
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.dark-theme .feature-btn {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.dark-theme .feature-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-bg-tertiary);
}

.dark-theme .feature-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

/* 设置列表 */
.setting-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.setting-label {
  font-size: 13px;
  color: var(--text-color-secondary);
}

.setting-input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 13px;
}

/* 开关 */
.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border-light);
  transition: 0.3s;
  border-radius: var(--radius-xl);
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: var(--color-text-inverse);
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(16px);
}

/* 模板选择 */
.template-select {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 13px;
  cursor: pointer;
}

/* 编辑区 */
.writing-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.editor-section {
  margin-bottom: 16px;
}

.editor-section.flex-1 {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.section-actions {
  display: flex;
  gap: 8px;
}

.section-action {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.section-action:hover {
  background: var(--hover-bg);
  color: var(--primary-color);
}

/* 标题输入 */
.title-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 16px;
  font-weight: 500;
}

.title-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

/* 文本域 */
.textarea-container {
  flex: 1;
  display: flex;
  min-height: 0;
}

.content-textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 15px;
  line-height: 1.8;
  resize: none;
  font-family: inherit;
}

.content-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

/* 字数统计栏 */
.word-count-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
  color: var(--primary-color);
}

.word-count-bar.reached {
  color: var(--success-color);
}

.reached-badge {
  margin-left: auto;
  font-weight: 500;
}

/* 快捷操作栏 */
.quick-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--border-color);
}

.quick-action-btn {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.quick-action-btn:hover:not(:disabled) {
  background: var(--hover-bg);
}

.quick-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 历史面板 */
.history-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 360px;
  height: 100%;
  background: var(--card-bg);
  border-left: 1px solid var(--border-color);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.history-header h3 {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-actions {
  display: flex;
  gap: 4px;
}

.history-action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.history-action-btn:hover {
  background: var(--hover-bg);
}

.close-history {
  margin-left: 8px;
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
  padding: 40px;
  color: var(--text-color-secondary);
}

.empty-history i {
  font-size: 48px;
  margin-bottom: 12px;
}

.history-item {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  transition: all 0.2s;
}

.history-item:hover {
  border-color: var(--primary-color);
  background: var(--hover-bg);
}

.history-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.history-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.history-item-actions {
  display: flex;
  gap: 4px;
}

.history-icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.history-icon-btn:hover {
  background: var(--card-bg);
  color: var(--primary-color);
}

.history-item-content {
  margin-bottom: 8px;
}

.history-preview {
  font-size: 13px;
  color: var(--text-color-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.history-item-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-color-secondary);
}

/* 设置弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-modal {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.modal-close:hover {
  background: var(--hover-bg);
}

.modal-body {
  padding: 20px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 8px;
}

.setting-input,
.setting-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 14px;
}

.setting-input:focus,
.setting-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

/* 加载覆盖层 */
.processing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.processing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--text-color);
  font-size: 16px;
}

.processing-content i {
  font-size: 32px;
  color: var(--primary-color);
}

/* 滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: var(--color-text-tertiary);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}

/* 暗色主题适配 */
.dark-theme .writing-view {
  --primary-light: rgba(123, 167, 226, 0.2);
}

.dark-theme .content-textarea {
  background: var(--bg-color);
}

.dark-theme .title-input {
  background: var(--bg-color);
}

.dark-theme .history-item {
  background: var(--card-bg);
}

.dark-theme .history-item:hover {
  background: var(--hover-bg);
}

.dark-theme .processing-overlay {
  background: rgba(0, 0, 0, 0.6);
}
</style>
