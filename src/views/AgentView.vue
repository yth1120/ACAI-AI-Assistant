<template>
  <div class="agent-view">
    <!-- 主内容区 -->
    <div class="agent-main">
      <!-- 顶部工具栏 -->
      <div class="agent-header">
        <div class="header-left">
          <h2 class="page-title">
            <i class="fa-solid fa-robot"></i>
            文档 Agent
          </h2>
        </div>
        <div class="header-actions">
          <button
            class="header-btn"
            @click="resetForm"
            title="重置"
            :disabled="isProcessing"
          >
            <i class="fa-solid fa-rotate-left"></i>
            <span>重置</span>
          </button>
          <button
            class="header-btn"
            @click="agentStore.showHistory = !agentStore.showHistory"
            title="历史记录"
          >
            <i class="fa-solid fa-history"></i>
          </button>
        </div>
      </div>

      <!-- 主体区域 -->
      <div class="agent-body">
        <!-- 左侧任务类型选择 -->
        <div class="agent-sidebar">
          <div class="sidebar-section">
            <div class="section-title">任务类型</div>
            <div class="task-list">
              <button
                v-for="option in taskOptions"
                :key="option.id"
                class="task-btn"
                :class="{ active: selectedTaskType === option.id }"
                @click="selectTaskType(option.id)"
              >
                <i :class="option.icon"></i>
                <span>{{ option.label }}</span>
              </button>
            </div>
          </div>

          <!-- 当前任务说明 -->
          <div class="sidebar-section task-desc">
            <div class="section-title">任务说明</div>
            <p class="desc-text">{{ currentTaskDescription }}</p>
          </div>
        </div>

        <!-- 右侧内容区 -->
        <div class="agent-content">
          <!-- 文档上传区（仅补全模式显示） -->
          <div v-if="isCompleteMode" class="upload-section">
            <div class="section-header">
              <label class="section-label">
                <i class="fa-solid fa-file-upload"></i>
                上传文档模板
              </label>
              <span v-if="uploadedFile" class="file-info">
                {{ uploadedFile.name }} ({{ formatFileSize(uploadedFile.size) }})
              </span>
            </div>

            <!-- 拖拽上传区 -->
            <div
              class="upload-area"
              :class="{ 'has-file': uploadedFile, 'drag-over': isDragOver }"
              @dragover.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
            >
              <input
                ref="fileInputRef"
                type="file"
                accept=".doc,.docx"
                @change="handleFileSelect"
                style="display: none"
              />

              <div v-if="!uploadedFile" class="upload-placeholder">
                <i class="fa-solid fa-cloud-upload-alt"></i>
                <p>拖拽 Word 文档到此处，或点击上传</p>
                <span class="upload-hint">支持 .docx、.doc 格式</span>
              </div>

              <div v-else class="file-preview">
                <div class="file-icon">
                  <i class="fa-solid fa-file-word"></i>
                </div>
                <div class="file-details">
                  <div class="file-name">{{ uploadedFile.name }}</div>
                  <div class="file-stats">
                    <span><i class="fa-solid fa-text-width"></i> {{ parsedDocument?.wordCount || 0 }} 字</span>
                    <span><i class="fa-solid fa-puzzle-piece"></i> {{ parsedDocument?.placeholderCount || 0 }} 个占位符</span>
                  </div>
                </div>
                <button class="remove-file-btn" @click.stop="removeFile">
                  <i class="fa-solid fa-times"></i>
                </button>
              </div>
            </div>

            <!-- 解析中的状态 -->
            <div v-if="isParsing" class="parsing-status">
              <i class="fa-solid fa-spinner fa-spin"></i>
              <span>正在解析文档...</span>
            </div>

            <!-- 占位符预览 -->
            <div v-if="parsedDocument && placeholders.length > 0" class="placeholders-preview">
              <div class="section-header">
                <label class="section-label">
                  <i class="fa-solid fa-puzzle-piece"></i>
                  检测到的占位符 ({{ placeholders.length }} 处)
                </label>
              </div>
              <div class="placeholder-list">
                <div
                  v-for="(p, index) in placeholders.slice(0, 5)"
                  :key="p.id"
                  class="placeholder-item"
                >
                  <span class="placeholder-index">{{ index + 1 }}</span>
                  <span class="placeholder-content">{{ p.content }}</span>
                </div>
                <div v-if="placeholders.length > 5" class="more-placeholders">
                  还有 {{ placeholders.length - 5 }} 处占位符...
                </div>
              </div>
            </div>
          </div>

          <!-- 需求输入区 -->
          <div class="requirement-section">
            <div class="section-header">
              <label class="section-label">
                <i class="fa-solid fa-pen-fancy"></i>
                {{ isCompleteMode ? '补全指令' : '需求描述' }}
              </label>
              <span class="char-count">{{ requirement.length }} 字</span>
            </div>
            <textarea
              v-model="requirement"
              class="requirement-input"
              :placeholder="getPlaceholder()"
              :disabled="isProcessing"
              @input="handleInput"
            ></textarea>
          </div>

          <!-- 生成按钮 -->
          <div class="action-bar">
            <button
              class="generate-btn"
              @click="executeTask"
              :disabled="!canGenerate"
            >
              <i v-if="isProcessing" class="fa-solid fa-circle-notch fa-spin"></i>
              <i v-else class="fa-solid fa-wand-magic-sparkles"></i>
              <span>{{ isProcessing ? '处理中...' : (isCompleteMode ? '开始补全' : '开始生成') }}</span>
            </button>
          </div>

          <!-- 生成结果区 -->
          <div v-if="hasResult || isProcessing" class="result-section">
            <div class="section-header">
              <label class="section-label">
                <i class="fa-solid fa-file-lines"></i>
                生成结果
              </label>
              <div v-if="hasResult" class="result-actions">
                <button class="result-btn" @click="downloadDoc" title="下载 Word 文档">
                  <i class="fa-solid fa-download"></i>
                  <span>下载 Word</span>
                </button>
                <button class="result-btn" @click="copyResult" title="复制内容">
                  <i class="fa-solid fa-copy"></i>
                  <span>复制</span>
                </button>
              </div>
            </div>

            <!-- 生成中状态 -->
            <div v-if="isProcessing" class="generating-status">
              <div class="status-icon">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
              </div>
              <span class="status-text">{{ processingText }}</span>
              <div class="output-preview">
                <pre>{{ output }}</pre>
              </div>
            </div>

            <!-- 生成结果预览 -->
            <div v-else-if="currentResult" class="result-preview">
              <div class="doc-preview">
                <h3 class="doc-title">{{ currentResult.title }}</h3>
                <div v-if="currentResult.subtitle" class="doc-subtitle">
                  {{ currentResult.subtitle }}
                </div>
                <div class="doc-meta">
                  <span v-if="currentResult.author">作者：{{ currentResult.author }}</span>
                  <span v-if="currentResult.date">日期：{{ currentResult.date }}</span>
                </div>
                <div
                  v-for="(section, index) in currentResult.sections"
                  :key="index"
                  class="doc-section"
                >
                  <h4 class="section-title">{{ section.title }}</h4>
                  <p
                    v-for="(para, pIndex) in section.paragraphs"
                    :key="pIndex"
                    class="section-para"
                  >
                    {{ para }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录面板 -->
    <div v-show="agentStore.showHistory" class="history-panel">
      <div class="history-header">
        <h3>
          <i class="fa-solid fa-history"></i>
          生成历史
        </h3>
        <div class="history-actions">
          <button
            class="history-action-btn"
            @click="clearHistory"
            title="清空"
          >
            <i class="fa-solid fa-trash-can"></i>
          </button>
          <button
            class="history-action-btn close-btn"
            @click="agentStore.showHistory = false"
            title="关闭"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
      <div class="history-list">
        <div v-if="agentStore.history.length === 0" class="empty-history">
          <i class="fa-solid fa-clipboard"></i>
          <span>暂无生成记录</span>
        </div>
        <div
          v-for="item in agentStore.history"
          :key="item.id"
          class="history-item"
          :class="{ favorite: item.favorite }"
        >
          <div class="history-item-header">
            <span class="history-type">
              <i :class="getTaskIcon(item.type)"></i>
              {{ getTaskLabel(item.type) }}
            </span>
            <div class="history-item-actions">
              <button
                class="history-icon-btn"
                @click="agentStore.toggleFavorite(item.id)"
                :title="item.favorite ? '取消收藏' : '收藏'"
              >
                <i :class="item.favorite ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
              </button>
              <button
                class="history-icon-btn"
                @click="loadHistoryItem(item)"
                title="载入"
              >
                <i class="fa-solid fa-download"></i>
              </button>
              <button
                class="history-icon-btn"
                @click="agentStore.deleteHistoryItem(item.id)"
                title="删除"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          <div class="history-item-title">{{ item.result.title }}</div>
          <div class="history-item-preview">{{ previewRequirement(item.requirement) }}</div>
          <div class="history-item-footer">
            <span class="history-time">{{ formatTime(item.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知组件 -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <i :class="notification.icon"></i>
      <span>{{ notification.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useAgentStore, type AgentHistoryItem } from '@/stores/agent'
import { agentService, AGENT_TASK_OPTIONS } from '@/services/ai/agent'
import { documentParser } from '@/services/ai/documentParser'
import type { AgentTaskType, DocumentConfig } from '@/services/ai/agent'
import type { ParsedDocument, ParsedParagraph } from '@/services/ai/documentParser'

// ============ Store ============

const agentStore = useAgentStore()

// ============ 状态 ============

const selectedTaskType = ref<AgentTaskType>('document')
const requirement = ref('')
const currentResult = ref<DocumentConfig | null>(null)

// 文件上传相关
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const parsedDocument = ref<ParsedDocument | null>(null)
const isParsing = ref(false)
const isDragOver = ref(false)

// 通知状态
const notification = reactive({
  show: false,
  type: 'success' as 'success' | 'error' | 'info',
  message: '',
  icon: 'fa-solid fa-check-circle'
})

// ============ 计算属性 ============

const taskOptions = computed(() => AGENT_TASK_OPTIONS)
const isProcessing = computed(() => agentStore.isProcessing)
const processingText = computed(() => agentStore.processingText)
const output = computed(() => agentStore.output)
const hasResult = computed(() => !!currentResult.value)

const isCompleteMode = computed(() => selectedTaskType.value === 'complete')

const currentTaskDescription = computed(() => {
  const option = taskOptions.value.find(o => o.id === selectedTaskType.value)
  return option?.description || ''
})

const placeholders = computed(() => {
  if (!parsedDocument.value) return []
  return documentParser.extractPlaceholders(parsedDocument.value.paragraphs)
})

const canGenerate = computed(() => {
  if (isProcessing.value) return false
  if (isCompleteMode.value) {
    return uploadedFile.value !== null && requirement.value.trim().length >= 5
  }
  return requirement.value.trim().length >= 10
})

// ============ 方法 ============

function selectTaskType(type: AgentTaskType) {
  selectedTaskType.value = type
  if (type !== 'complete') {
    removeFile()
  }
}

function getPlaceholder(): string {
  if (isCompleteMode.value) {
    return '请输入补全指令，例如：\n\n请根据上下文，为所有【待填写】位置填充合适的内容。这是一份项目申报书，请确保内容专业、数据准确...'
  }

  const placeholders: Record<string, string> = {
    document: '请描述您需要生成的文档内容，例如：\n\n为公司年度总结大会撰写一份发言稿，涵盖业绩回顾、团队建设、未来规划等内容...',
    report: '请描述报告的主题和要求，例如：\n\n撰写一份关于 2024 年人工智能行业发展趋势的分析报告...',
    proposal: '请描述方案的主题和目标，例如：\n\n制定一份企业数字化转型实施方案...',
    analysis: '请描述需要分析的内容，例如：\n\n分析新能源汽车市场在 2024 年的竞争格局...',
    summary: '请描述总结的范围，例如：\n\n撰写 Q3 季度工作总结...',
    custom: '请自由描述您的文档需求，AI 将智能理解并生成合适的文档结构...'
  }
  return placeholders[selectedTaskType.value] || ''
}

function handleInput() {
  // 可以添加输入处理逻辑
}

// ============ 文件上传相关 ============

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (files && files.length > 0) {
    await processFile(files[0])
  }
}

async function handleDrop(event: DragEvent) {
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    await processFile(files[0])
  }
}

async function processFile(file: File) {
  // 验证文件类型
  const validExtensions = ['.docx', '.doc']
  const hasValidExtension = validExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  )

  if (!hasValidExtension) {
    showNotification('error', '请上传 .docx 或 .doc 格式的 Word 文档', 'fa-solid fa-exclamation-circle')
    return
  }

  uploadedFile.value = file
  isParsing.value = true

  try {
    parsedDocument.value = await documentParser.parseFile(file)
    showNotification('success', `文档解析成功，检测到 ${parsedDocument.value.placeholderCount} 个占位符`, 'fa-solid fa-check-circle')
  } catch (err) {
    showNotification('error', `文档解析失败：${(err as Error).message}`, 'fa-solid fa-exclamation-circle')
    uploadedFile.value = null
    parsedDocument.value = null
  } finally {
    isParsing.value = false
  }
}

function removeFile() {
  uploadedFile.value = null
  parsedDocument.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ============ 核心功能 ============

async function executeTask() {
  if (!canGenerate.value) return

  currentResult.value = null

  try {
    let result: DocumentConfig | null = null

    if (isCompleteMode.value && uploadedFile.value) {
      // 文档补全模式
      result = await agentStore.completeDocument(
        uploadedFile.value,
        requirement.value.trim()
      )
    } else {
      // 普通生成模式
      result = await agentStore.executeTask(
        selectedTaskType.value,
        requirement.value.trim()
      )
    }

    if (result) {
      currentResult.value = result
      showNotification('success', isCompleteMode.value ? '文档补全成功！' : '文档生成成功！', 'fa-solid fa-check-circle')
    }
  } catch (err) {
    showNotification('error', `${isCompleteMode.value ? '补全' : '生成'}失败：${(err as Error).message}`, 'fa-solid fa-exclamation-circle')
  }
}

function downloadDoc() {
  if (!currentResult.value) return
  agentStore.downloadDocument(currentResult.value)
  showNotification('success', '文档已开始下载', 'fa-solid fa-download')
}

async function copyResult() {
  if (!currentResult.value) return

  const text = currentResult.value.sections
    .map(section => {
      const title = section.title
      const content = section.paragraphs.join('\n\n')
      return `${title}\n\n${content}`
    })
    .join('\n\n---\n\n')

  try {
    await navigator.clipboard.writeText(text)
    showNotification('success', '内容已复制到剪贴板', 'fa-solid fa-copy')
  } catch {
    showNotification('error', '复制失败，请手动复制', 'fa-solid fa-exclamation-circle')
  }
}

function resetForm() {
  requirement.value = ''
  currentResult.value = null
  removeFile()
  agentStore.resetTask()
  showNotification('info', '已重置表单', 'fa-solid fa-rotate-left')
}

function loadHistoryItem(item: AgentHistoryItem) {
  selectedTaskType.value = item.type
  requirement.value = item.requirement
  currentResult.value = item.result
  agentStore.showHistory = false
  showNotification('success', '已载入历史记录', 'fa-solid fa-download')
}

function clearHistory() {
  if (confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
    agentStore.clearHistory()
    showNotification('info', '已清空历史记录', 'fa-solid fa-trash-can')
  }
}

function getTaskIcon(type: AgentTaskType): string {
  const option = taskOptions.value.find(o => o.id === type)
  return option?.icon || 'fa-solid fa-file'
}

function getTaskLabel(type: AgentTaskType): string {
  const option = taskOptions.value.find(o => o.id === type)
  return option?.label || type
}

function previewRequirement(text: string): string {
  const maxLen = 60
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text
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
    return `${Math.floor(diff / minute)} 分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)} 天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

function showNotification(type: 'success' | 'error' | 'info', message: string, icon: string) {
  notification.type = type
  notification.message = message
  notification.icon = icon
  notification.show = true

  setTimeout(() => {
    notification.show = false
  }, 3000)
}
</script>

<style scoped>
.agent-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  position: relative;
}

.agent-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ========== 头部 ========== */
.agent-header {
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
  margin: 0;
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.header-btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
}

.header-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== 主体 ========== */
.agent-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ========== 侧边栏 ========== */
.agent-sidebar {
  width: 220px;
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  padding-left: 4px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.task-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-bg-tertiary);
}

.task-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.task-btn i {
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.task-desc {
  margin-top: auto;
}

.desc-text {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  padding: 8px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
}

/* ========== 内容区 ========== */
.agent-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
  gap: 16px;
}

/* ========== 文件上传区 ========== */
.upload-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  background: var(--color-bg-secondary);
}

.upload-area {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--color-bg-primary);
}

.upload-area:hover {
  border-color: var(--color-primary);
  background: rgba(94, 106, 210, 0.05);
}

.upload-area.drag-over {
  border-color: var(--color-primary);
  background: rgba(94, 106, 210, 0.1);
}

.upload-area.has-file {
  padding: 16px;
  text-align: left;
}

.upload-placeholder {
  color: var(--color-text-secondary);
}

.upload-placeholder i {
  font-size: 48px;
  margin-bottom: 12px;
  color: var(--color-primary);
  opacity: 0.6;
}

.upload-placeholder p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.upload-hint {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 16px;
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.file-stats i {
  margin-right: 4px;
}

.file-info {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.remove-file-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-file-btn:hover {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.parsing-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: var(--color-primary);
  font-size: 14px;
}

/* 占位符预览 */
.placeholders-preview {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.placeholder-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.placeholder-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.placeholder-index {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
}

.placeholder-content {
  color: var(--color-text-primary);
  word-break: break-all;
}

.more-placeholders {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 8px;
}

/* ========== 需求输入区 ========== */
.requirement-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 120px;
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
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-label i {
  color: var(--color-primary);
}

.char-count {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.requirement-input {
  flex: 1;
  min-height: 100px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.8;
  resize: none;
  font-family: inherit;
}

.requirement-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(94, 106, 210, 0.15);
}

.requirement-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ========== 操作栏 ========== */
.action-bar {
  display: flex;
  justify-content: center;
}

.generate-btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background var(--duration-fast) var(--ease);
}

.generate-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.generate-btn:active:not(:disabled) {
  background: var(--color-primary-active);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* ========== 结果区 ========== */
.result-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.result-section .section-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  margin-bottom: 0;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.result-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.result-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 生成中状态 */
.generating-status {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
}

.status-icon {
  font-size: 32px;
  color: var(--color-primary);
}

.status-text {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.output-preview {
  width: 100%;
  max-height: 200px;
  overflow: auto;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  padding: 12px;
}

.output-preview pre {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

/* 结果预览 */
.result-preview {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.doc-preview {
  max-width: 700px;
  margin: 0 auto;
  background: var(--color-bg-primary);
  padding: 32px;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.doc-title {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.doc-subtitle {
  font-size: 14px;
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}

.doc-meta {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.doc-meta span {
  margin: 0 8px;
}

.doc-section {
  margin-bottom: 24px;
}

.doc-section .section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
  padding-left: 0;
}

.section-para {
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text-primary);
  margin-bottom: 10px;
  text-indent: 2em;
  text-align: justify;
}

/* ========== 历史面板 ========== */
.history-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 360px;
  height: 100%;
  background: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border);
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
  border-bottom: 1px solid var(--color-border);
}

.history-header h3 {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
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
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.history-action-btn:hover {
  background: var(--color-bg-tertiary);
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
  color: var(--color-text-secondary);
}

.empty-history i {
  font-size: 48px;
  margin-bottom: 12px;
}

.history-item {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  transition: all 0.2s;
}

.history-item:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-tertiary);
}

.history-item.favorite {
  border-color: var(--color-warning);
  background: rgba(251, 191, 36, 0.05);
}

.history-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.history-type {
  font-size: 12px;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 4px;
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
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.history-icon-btn:hover {
  background: var(--color-bg-primary);
  color: var(--color-primary);
}

.history-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.history-item-preview {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: 8px;
}

.history-item-footer {
  display: flex;
  justify-content: flex-end;
}

.history-time {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* ========== 通知 ========== */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  z-index: 2000;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification.success {
  background: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success-light);
}

.notification.error {
  background: var(--color-danger-light);
  color: var(--color-danger);
  border: 1px solid var(--color-danger-light);
}

.notification.info {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border: 1px solid var(--color-primary-light);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ========== 暗色主题 ========== */
.dark-theme .doc-preview {
  background: var(--color-bg-secondary);
  box-shadow: var(--shadow-lg);
}

.dark-theme .notification.success {
  background: var(--color-success-light);
  color: var(--color-success);
  border-color: var(--color-success);
}

.dark-theme .notification.error {
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.dark-theme .notification.info {
  background: var(--color-info-light);
  color: var(--color-info);
  border-color: var(--color-info);
}
</style>
