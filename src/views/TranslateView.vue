<template>
  <div class="translate-view">
    <!-- 主内容区 -->
    <div class="translate-main">
      <!-- 顶部工具栏 -->
      <div class="translate-header">
        <div class="header-left">
          <h2 class="page-title">
            <i class="fa-solid fa-language"></i>
            翻译助手
          </h2>
        </div>
        <div class="header-actions">
          <button class="header-btn" @click="showHistory = !showHistory" title="历史记录">
            <i class="fa-solid fa-history"></i>
          </button>
          <button class="header-btn" @click="showSettings = true" title="设置">
            <i class="fa-solid fa-gear"></i>
          </button>
        </div>
      </div>

      <!-- 翻译主体 -->
      <div class="translate-body">
        <div class="translate-panel">
          <!-- 源语言区域 -->
          <div class="translate-section">
            <div class="section-header">
              <span class="section-label">源语言</span>
              <select v-model="sourceLang" class="lang-select">
                <option value="auto">自动检测</option>
                <option v-for="lang in commonLanguages" :key="lang.code" :value="lang.code">
                  {{ lang.name }}
                </option>
                <optgroup label="更多语言">
                  <option v-for="lang in moreLanguages" :key="lang.code" :value="lang.code">
                    {{ lang.name }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="text-input-container">
              <textarea
                v-model="sourceText"
                class="source-textarea"
                placeholder="输入或粘贴需要翻译的文本..."
                @input="handleSourceInput"
              ></textarea>
              <div class="text-actions">
                <button class="text-action-btn" @click="clearSourceText" title="清空">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
                <button class="text-action-btn" @click="pasteSourceText" title="粘贴">
                  <i class="fa-solid fa-paste"></i>
                </button>
                <span class="char-count">{{ sourceText.length }} 字符</span>
              </div>
            </div>
          </div>

          <!-- 交换语言按钮 -->
          <button class="swap-lang-btn" @click="swapLanguages" title="交换语言">
            <i class="fa-solid fa-arrow-right-arrow-left"></i>
          </button>

          <!-- 目标语言区域 -->
          <div class="translate-section">
            <div class="section-header">
              <span class="section-label">目标语言</span>
              <select v-model="targetLang" class="lang-select" @change="handleTargetLangChange">
                <option v-for="lang in commonLanguages" :key="lang.code" :value="lang.code">
                  {{ lang.name }}
                </option>
                <optgroup label="更多语言">
                  <option v-for="lang in moreLanguages" :key="lang.code" :value="lang.code">
                    {{ lang.name }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="text-input-container">
              <div class="result-textarea" :class="{ loading: isTranslating }">
                <div v-if="isTranslating" class="empty-result-container">
                  <div class="translating-indicator">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <span>翻译中...</span>
                  </div>
                </div>
                <div v-else-if="targetText" class="translate-result" v-html="formattedResult"></div>
                <div v-else class="empty-result-container">
                  <div class="empty-result">
                    <i class="fa-solid fa-language"></i>
                    <span>翻译结果将显示在这里</span>
                  </div>
                </div>
              </div>
              <div class="text-actions">
                <button
                  class="text-action-btn"
                  @click="copyResult"
                  title="复制"
                  :disabled="!targetText || isTranslating"
                >
                  <i class="fa-solid fa-copy"></i>
                </button>
                <span v-if="targetText" class="char-count">{{ targetText.length }} 字符</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 翻译风格选择 -->
        <div class="translate-style-bar">
          <span class="style-label">翻译风格：</span>
          <div class="style-options">
            <button
              v-for="style in translateStyles"
              :key="style.id"
              class="style-option"
              :class="{ active: translateStyle === style.id }"
              @click="translateStyle = style.id"
            >
              <i :class="style.icon"></i>
              <span>{{ style.label }}</span>
            </button>
          </div>
        </div>

        <!-- 翻译按钮 -->
        <div class="translate-action-bar">
          <button
            class="translate-btn"
            @click="doTranslate"
            :disabled="!sourceText.trim() || isTranslating"
          >
            <i class="fa-solid fa-right-left"></i>
            {{ isTranslating ? '翻译中...' : '立即翻译' }}
          </button>
        </div>

        <!-- 常用语言快速选择 -->
        <div class="recent-languages">
          <span class="recent-label">常用语言：</span>
          <div class="recent-lang-list">
            <button
              v-for="lang in recentLanguages"
              :key="lang"
              class="recent-lang-btn"
              :class="{ active: targetLang === lang }"
              @click="targetLang = lang"
            >
              {{ getLanguageName(lang) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷侧边栏 -->
    <div
      v-show="showSidebar"
      class="translate-sidebar"
      :class="[sidebarPosition, { collapsed: isSidebarCollapsed }]"
      :style="{ width: sidebarWidth + 'px' }"
    >
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <div class="sidebar-title">
          <i class="fa-solid fa-language"></i>
          <span>快捷翻译</span>
        </div>
        <div class="sidebar-actions">
          <button class="sidebar-btn" @click="toggleSidebarCollapse" title="收起/展开">
            <i :class="isSidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
          </button>
          <button class="sidebar-btn close-btn" @click="closeSidebar" title="关闭">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- 快速语言选择 -->
      <div class="sidebar-quick-lang">
        <button
          v-for="lang in recentLanguages"
          :key="lang"
          class="quick-lang-btn"
          :class="{ active: sidebarTargetLang === lang }"
          @click="sidebarTargetLang = lang"
        >
          {{ getLanguageName(lang) }}
        </button>
      </div>

      <!-- 侧边栏输入区 -->
      <div class="sidebar-body" v-show="!isSidebarCollapsed">
        <textarea
          v-model="sidebarSourceText"
          class="sidebar-source-text"
          placeholder="输入文本快速翻译..."
        ></textarea>

        <!-- 操作按钮 -->
        <div class="sidebar-actions-bar">
          <button
            class="sidebar-translate-btn"
            @click="doSidebarTranslate"
            :disabled="!sidebarSourceText.trim() || isSidebarTranslating"
          >
            <i class="fa-solid fa-magic"></i>
            {{ isSidebarTranslating ? '翻译中...' : '翻译' }}
          </button>
          <button
            class="sidebar-copy-btn"
            @click="copySidebarResult"
            :disabled="!sidebarTargetText || isSidebarTranslating"
          >
            <i class="fa-solid fa-copy"></i>
          </button>
        </div>

        <!-- 翻译结果 -->
        <div class="sidebar-result">
          <div v-if="isSidebarTranslating" class="sidebar-translating">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span>翻译中...</span>
          </div>
          <div v-else-if="sidebarTargetText" class="sidebar-result-text">
            {{ sidebarTargetText }}
          </div>
          <div v-else class="sidebar-empty">
            <span>翻译结果</span>
          </div>
        </div>
      </div>

      <!-- 拖拽条 -->
      <div
        v-show="!isSidebarCollapsed"
        class="sidebar-resize"
        @mousedown="startResize"
      ></div>
    </div>

    <!-- 收起的侧边栏触发器 -->
    <button
      v-show="!showSidebar && !isSidebarCollapsed"
      class="sidebar-trigger"
      :class="sidebarPosition"
      @click="openSidebar"
    >
      <i class="fa-solid fa-language"></i>
    </button>

    <!-- 历史记录面板 -->
    <div v-show="showHistory" class="history-panel" :class="{ left: sidebarPosition === 'left' }">
      <div class="history-header">
        <h3>
          <i class="fa-solid fa-history"></i>
          翻译历史
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
        <div v-if="translateRecords.length === 0" class="empty-history">
          <i class="fa-solid fa-clipboard"></i>
          <span>暂无翻译记录</span>
        </div>
        <div
          v-for="record in translateRecords"
          :key="record.id"
          class="history-item"
          :class="{ favorite: record.favorite }"
        >
          <div class="history-item-header">
            <span class="history-lang-pair">
              {{ getLanguageName(record.sourceLang) }} → {{ getLanguageName(record.targetLang) }}
            </span>
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
            <div class="history-source">{{ record.sourceText }}</div>
            <div class="history-target">{{ record.targetText }}</div>
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
            翻译助手设置
          </h3>
          <button class="modal-close" @click="closeSettings">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- 快捷键设置 -->
          <div class="setting-group">
            <label class="setting-label">全局快捷键</label>
            <div class="setting-input-group">
              <input
                v-model="shortcutKey"
                type="text"
                class="setting-input"
                placeholder="快捷键"
              />
              <button class="setting-btn" @click="resetShortcut">
                <i class="fa-solid fa-rotate-left"></i>
                恢复默认
              </button>
            </div>
            <p class="setting-hint">按下快捷键可快速唤起侧边栏</p>
          </div>

          <!-- 侧边栏位置 -->
          <div class="setting-group">
            <label class="setting-label">侧边栏位置</label>
            <div class="setting-button-group">
              <button
                class="setting-option-btn"
                :class="{ active: sidebarPosition === 'left' }"
                @click="sidebarPosition = 'left'"
              >
                <i class="fa-solid fa-align-left"></i>
                左侧
              </button>
              <button
                class="setting-option-btn"
                :class="{ active: sidebarPosition === 'right' }"
                @click="sidebarPosition = 'right'"
              >
                <i class="fa-solid fa-align-right"></i>
                右侧
              </button>
            </div>
          </div>

          <!-- 历史记录数量 -->
          <div class="setting-group">
            <label class="setting-label">最大历史记录数</label>
            <div class="setting-input-group">
              <input
                v-model.number="maxHistoryRecords"
                type="number"
                class="setting-input"
                min="10"
                max="500"
                step="10"
              />
              <span class="setting-suffix">条</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="save-settings-btn" @click="saveSettings">
            <i class="fa-solid fa-check"></i>
            保存设置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotification } from '@/composables/useNotification'
import { useTranslateHistory, TranslateRecord } from '@/composables/useTranslateHistory'
import { translateService, TRANSLATE_STYLES } from '@/services/ai/translate'

// Notification
const { success, error: showError } = useNotification()

// 翻译历史管理
const {
  records: translateRecords,
  recentLanguages,
  sidebarPosition,
  sidebarWidth,
  shortcut,
  addRecord,
  deleteRecord,
  clearRecords,
  toggleFavorite,
  exportHistory,
  saveSettings: saveHistorySettings
} = useTranslateHistory()

// State
const sourceText = ref('')
const targetText = ref('')
const sourceLang = ref('auto')
const targetLang = ref('en')
const isTranslating = ref(false)
const translateStyle = ref('default')
const showHistory = ref(false)
const showSettings = ref(false)

// 侧边栏相关
const showSidebar = ref(false)
const isSidebarCollapsed = ref(false)
const sidebarSourceText = ref('')
const sidebarTargetText = ref('')
const sidebarTargetLang = ref('en')
const isSidebarTranslating = ref(false)

// 设置相关
const shortcutKey = ref('Ctrl+Shift+T')
const maxHistoryRecords = ref(100)

// 语言列表
const commonLanguages = computed(() => {
  return [
    { code: 'zh', name: '中文' },
    { code: 'en', name: '英语' },
    { code: 'ja', name: '日语' },
    { code: 'ko', name: '韩语' },
    { code: 'fr', name: '法语' },
    { code: 'de', name: '德语' },
    { code: 'es', name: '西班牙语' },
    { code: 'ru', name: '俄语' },
    { code: 'pt', name: '葡萄牙语' }
  ]
})

const moreLanguages = computed(() => {
  const commonCodes = commonLanguages.value.map(l => l.code)
  return translateService
    .getSupportedLanguages()
    .filter(lang => !commonCodes.includes(lang.code))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
})

// 翻译风格
const translateStyles = TRANSLATE_STYLES

// 格式化翻译结果（支持简单 Markdown）
const formattedResult = computed(() => {
  if (!targetText.value) return ''
  return targetText.value
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
})

// 获取语言名称
function getLanguageName(code: string): string {
  return translateService.getLanguageName(code)
}

// 处理源文本输入
function handleSourceInput() {
  // 可以在这里添加自动翻译逻辑
}

// 处理目标语言变化
function handleTargetLangChange() {
  recentLanguages.value = recentLanguages.value // 触发更新
}

// 清空源文本
function clearSourceText() {
  sourceText.value = ''
  targetText.value = ''
}

// 粘贴源文本
async function pasteSourceText() {
  try {
    const text = await navigator.clipboard.readText()
    sourceText.value = text
  } catch (err) {
    showError('无法访问剪贴板')
  }
}

// 交换语言
function swapLanguages() {
  if (sourceLang.value === 'auto') {
    showError('自动检测模式下无法交换语言')
    return
  }
  const temp = sourceLang.value
  sourceLang.value = targetLang.value
  targetLang.value = temp

  // 交换文本
  const tempText = sourceText.value
  sourceText.value = targetText.value
  targetText.value = tempText
}

// 复制结果
async function copyResult() {
  if (!targetText.value) return
  try {
    await navigator.clipboard.writeText(targetText.value)
    success('已复制到剪贴板')
  } catch (err) {
    showError('复制失败')
  }
}

// 执行翻译
async function doTranslate() {
  if (!sourceText.value.trim()) {
    showError('请输入要翻译的文本')
    return
  }

  isTranslating.value = true
  targetText.value = ''

  try {
    let actualSourceLang = sourceLang.value
    if (sourceLang.value === 'auto') {
      // 自动检测语言
      actualSourceLang = await translateService.detectLanguage(sourceText.value)
    }

    let result = ''
    await translateService.translate(
      sourceText.value,
      actualSourceLang,
      targetLang.value,
      translateStyle.value,
      (chunk) => {
        result += chunk
        targetText.value = result
      }
    )

    // 保存历史记录
    if (result) {
      addRecord({
        sourceText: sourceText.value,
        targetText: result,
        sourceLang: actualSourceLang,
        targetLang: targetLang.value,
        style: translateStyle.value,
        favorite: false
      })

      // 更新常用语言
      if (targetLang.value !== recentLanguages.value[0]) {
        recentLanguages.value = [
          targetLang.value,
          ...recentLanguages.value.filter(l => l !== targetLang.value)
        ].slice(0, 3)
      }

      success('翻译完成')
    }
  } catch (err) {
    showError(`翻译失败：${(err as Error).message}`)
    targetText.value = `❌ 翻译失败：${(err as Error).message}`
  } finally {
    isTranslating.value = false
  }
}

// 侧边栏相关函数
function openSidebar() {
  showSidebar.value = true
  isSidebarCollapsed.value = false
}

function closeSidebar() {
  showSidebar.value = false
}

function toggleSidebarCollapse() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 侧边栏翻译
async function doSidebarTranslate() {
  if (!sidebarSourceText.value.trim()) return

  isSidebarTranslating.value = true
  sidebarTargetText.value = ''

  try {
    let result = ''
    await translateService.translate(
      sidebarSourceText.value,
      'zh',
      sidebarTargetLang.value,
      'default',
      (chunk) => {
        result += chunk
        sidebarTargetText.value = result
      }
    )
  } catch (err) {
    sidebarTargetText.value = `翻译失败：${(err as Error).message}`
  } finally {
    isSidebarTranslating.value = false
  }
}

// 复制侧边栏结果
async function copySidebarResult() {
  if (!sidebarTargetText.value) return
  try {
    await navigator.clipboard.writeText(sidebarTargetText.value)
    success('已复制到剪贴板')
  } catch (err) {
    showError('复制失败')
  }
}

// 侧边栏拖拽调整宽度
let isResizing = false
function startResize(e: MouseEvent) {
  isResizing = true
  document.addEventListener('mousemove', resize)
  document.addEventListener('mouseup', stopResize)
  e.preventDefault()
}

function resize(e: MouseEvent) {
  if (!isResizing) return
  const newWidth = sidebarPosition.value === 'left'
    ? e.clientX
    : window.innerWidth - e.clientX
  sidebarWidth.value = Math.max(200, Math.min(newWidth, 400))
}

function stopResize() {
  isResizing = false
  document.removeEventListener('mousemove', resize)
  document.removeEventListener('mouseup', stopResize)
}

// 历史记录相关
function clearHistory() {
  if (confirm('确定要清空所有翻译历史吗？')) {
    clearRecords()
    success('已清空历史记录')
  }
}

function loadHistoryRecord(record: TranslateRecord) {
  sourceText.value = record.sourceText
  targetText.value = record.targetText
  sourceLang.value = record.sourceLang
  targetLang.value = record.targetLang
  translateStyle.value = record.style
  showHistory.value = false
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN')
}

// 设置相关
function resetShortcut() {
  shortcutKey.value = 'Ctrl+Shift+T'
}

function saveSettings() {
  shortcut.value = shortcutKey.value
  maxHistoryRecords.value = Math.max(10, Math.min(500, maxHistoryRecords.value))
  saveHistorySettings()
  showSettings.value = false
  success('设置已保存')
}

function closeSettings() {
  showSettings.value = false
}

// 全局快捷键监听
function handleGlobalShortcut(e: KeyboardEvent) {
  const shortcutParts = shortcutKey.value.split('+').map(s => s.trim().toLowerCase())
  const needCtrl = shortcutParts.includes('ctrl')
  const needShift = shortcutParts.includes('shift')
  const needAlt = shortcutParts.includes('alt')
  const key = shortcutParts.find(p => !['ctrl', 'shift', 'alt'].includes(p))

  if (
    (needCtrl === e.ctrlKey) &&
    (needShift === e.shiftKey) &&
    (needAlt === e.altKey) &&
    key &&
    e.key.toLowerCase() === key
  ) {
    e.preventDefault()
    if (!showSidebar.value) {
      openSidebar()
    } else if (isSidebarCollapsed.value) {
      isSidebarCollapsed.value = false
    }
    // 聚焦侧边栏输入框
    setTimeout(() => {
      const input = document.querySelector('.sidebar-source-text') as HTMLTextAreaElement
      input?.focus()
    }, 100)
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleGlobalShortcut)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalShortcut)
  document.removeEventListener('mousemove', resize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.translate-view {
  height: 100%;
  display: flex;
  position: relative;
  background: var(--color-bg-primary);
}

.dark-theme .translate-view {
  background: var(--color-bg-primary);
}

/* 主内容区 */
.translate-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部工具栏 */
.translate-header {
  height: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border);
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

.header-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 翻译主体 */
.translate-body {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.translate-panel {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: start;
}

.translate-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.lang-select {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  outline: none;
}

.lang-select:focus {
  border-color: var(--color-primary);
}

.text-input-container {
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-primary);
  overflow: hidden;
  height: 248px;
  display: flex;
  flex-direction: column;
}

.source-textarea {
  width: 100%;
  height: calc(100% - 48px);
  padding: 16px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}

.source-textarea::placeholder {
  color: var(--color-text-tertiary);
}

.result-textarea {
  width: 100%;
  height: calc(100% - 48px);
  overflow-y: auto;
  padding: 16px;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.6;
  box-sizing: border-box;
}

.result-textarea.loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-result-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 152px;
  width: 100%;
}

.translate-result {
  min-height: 152px;
}

.translating-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-tertiary);
}

.empty-result i {
  font-size: 32px;
  opacity: 0.5;
}

.translate-result {
  min-height: 152px;
  line-height: 1.8;
  color: var(--color-text-primary);
}

.text-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.text-action-btn {
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

.text-action-btn:hover:not(:disabled) {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.text-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.char-count {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* 交换语言按钮 */
.swap-lang-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-top: 24px;
}

.swap-lang-btn:hover {
  background: var(--color-primary);
  color: white;
}

/* 翻译风格栏 */
.translate-style-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.style-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.style-options {
  display: flex;
  gap: 8px;
}

.style-option {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.style-option:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.style-option.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* 翻译按钮 */
.translate-action-bar {
  display: flex;
  justify-content: center;
}

.translate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 32px;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-primary);
  color: white;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.translate-btn:hover:not(:disabled) {
  background: rgba(94, 106, 210, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(94, 106, 210, 0.3);
}

.translate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 常用语言 */
.recent-languages {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.recent-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.recent-lang-list {
  display: flex;
  gap: 8px;
}

.recent-lang-btn {
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.recent-lang-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.recent-lang-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* 快捷侧边栏 */
.translate-sidebar {
  position: fixed;
  top: 0;
  height: 100%;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  z-index: 100;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.translate-sidebar.left {
  left: 0;
  border-left: none;
}

.translate-sidebar.right {
  right: 0;
  border-right: none;
}

.translate-sidebar.collapsed {
  width: 48px !important;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding: 0 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.sidebar-title i {
  color: var(--color-primary);
}

.sidebar-actions {
  display: flex;
  gap: 4px;
}

.sidebar-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
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

.sidebar-btn:hover {
  background: var(--color-bg-tertiary);
}

.sidebar-btn.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.sidebar-quick-lang {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
}

.quick-lang-btn {
  flex: 1;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-lang-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.quick-lang-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.sidebar-body {
  display: flex;
  flex-direction: column;
  height: calc(100% - 100px);
  padding: 12px;
  gap: 12px;
}

.sidebar-source-text {
  width: 100%;
  height: 100px;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 13px;
  resize: none;
  outline: none;
}

.sidebar-source-text:focus {
  border-color: var(--color-primary);
}

.sidebar-source-text::placeholder {
  color: var(--color-text-tertiary);
}

.sidebar-actions-bar {
  display: flex;
  gap: 8px;
}

.sidebar-translate-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-translate-btn:hover:not(:disabled) {
  background: rgba(94, 106, 210, 0.9);
}

.sidebar-translate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sidebar-copy-btn {
  width: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.sidebar-copy-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.sidebar-copy-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sidebar-result {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  padding: 10px;
  overflow-y: auto;
}

.sidebar-translating {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: var(--color-text-secondary);
}

.sidebar-result-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.sidebar-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.sidebar-resize {
  position: absolute;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;
}

.translate-sidebar.left .sidebar-resize {
  right: 0;
}

.translate-sidebar.right .sidebar-resize {
  left: 0;
}

.sidebar-resize:hover {
  background: var(--color-primary);
  opacity: 0.3;
}

/* 侧边栏触发器 */
.sidebar-trigger {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 80px;
  border: none;
  border-radius: 12px 0 0 12px;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  z-index: 99;
  transition: all 0.2s;
  box-shadow: 0 0 10px rgba(94, 106, 210, 0.3);
}

.sidebar-trigger.left {
  left: 0;
  border-radius: 0 12px 12px 0;
}

.sidebar-trigger.right {
  right: 0;
  border-radius: 12px 0 0 12px;
}

.sidebar-trigger:hover {
  padding-left: 4px;
  background: rgba(94, 106, 210, 0.9);
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
  z-index: 101;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
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

.history-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
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

.history-action-btn:hover {
  background: var(--color-bg-tertiary);
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

.history-item:hover {
  border-color: var(--color-primary);
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

.history-lang-pair {
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

.history-icon-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.history-item-content {
  margin-bottom: 8px;
}

.history-source {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.history-target {
  font-size: 13px;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.history-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-time {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* 设置弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-modal {
  width: 420px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.modal-header h3 i {
  color: var(--color-primary);
}

.modal-close {
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
  font-size: 16px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--color-bg-tertiary);
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
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.setting-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-input {
  flex: 1;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
}

.setting-input:focus {
  border-color: var(--color-primary);
}

.setting-suffix {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.setting-btn {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.setting-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.setting-hint {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 6px;
}

.setting-button-group {
  display: flex;
  gap: 8px;
}

.setting-option-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.setting-option-btn:hover {
  border-color: var(--color-primary);
}

.setting-option-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.save-settings-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-settings-btn:hover {
  background: rgba(94, 106, 210, 0.9);
}

/* ======================================
   深色主题支持
   ====================================== */

.dark-theme .translate-main {
  background: var(--color-bg-primary);
}

.dark-theme .translate-header {
  border-bottom-color: var(--color-border);
  background: var(--color-bg-primary);
}

.dark-theme .page-title {
  color: var(--color-text-primary);
}

.dark-theme .header-btn {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.dark-theme .header-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dark-theme .section-label {
  color: var(--color-text-tertiary);
}

.dark-theme .lang-select {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.dark-theme .lang-select:focus {
  border-color: var(--color-primary);
}

.dark-theme .text-input-container {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
}

.dark-theme .source-textarea,
.dark-theme .result-textarea {
  color: var(--color-text-primary);
}

.dark-theme .source-textarea::placeholder {
  color: var(--color-text-secondary);
}

.dark-theme .translating-indicator {
  color: var(--color-text-tertiary);
}

.dark-theme .empty-result {
  color: var(--color-text-secondary);
}

.dark-theme .translate-result {
  color: var(--color-text-primary);
}

.dark-theme .text-actions {
  border-top-color: var(--color-border);
  background: var(--color-bg-secondary);
}

.dark-theme .text-action-btn {
  color: var(--color-text-tertiary);
}

.dark-theme .text-action-btn:hover:not(:disabled) {
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}

.dark-theme .char-count {
  color: var(--color-text-secondary);
}

.dark-theme .swap-lang-btn {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}

.dark-theme .swap-lang-btn:hover {
  background: var(--color-primary);
  color: white;
}

.dark-theme .translate-style-bar {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

.dark-theme .style-label {
  color: var(--color-text-tertiary);
}

.dark-theme .style-option {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-tertiary);
}

.dark-theme .style-option:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dark-theme .style-option.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.dark-theme .recent-languages {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

.dark-theme .recent-label {
  color: var(--color-text-tertiary);
}

.dark-theme .recent-lang-btn {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-tertiary);
}

.dark-theme .recent-lang-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dark-theme .recent-lang-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.dark-theme .translate-sidebar {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

.dark-theme .sidebar-header {
  border-bottom-color: var(--color-border);
  background: var(--color-bg-primary);
}

.dark-theme .sidebar-title {
  color: var(--color-text-primary);
}

.dark-theme .sidebar-btn {
  color: var(--color-text-tertiary);
}

.dark-theme .sidebar-btn:hover {
  background: var(--color-bg-secondary);
}

.dark-theme .sidebar-btn.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.dark-theme .sidebar-quick-lang {
  border-bottom-color: var(--color-border);
}

.dark-theme .quick-lang-btn {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-tertiary);
}

.dark-theme .quick-lang-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dark-theme .quick-lang-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.dark-theme .sidebar-source-text {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.dark-theme .sidebar-source-text:focus {
  border-color: var(--color-primary);
}

.dark-theme .sidebar-source-text::placeholder {
  color: var(--color-text-secondary);
}

.dark-theme .sidebar-copy-btn {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-tertiary);
}

.dark-theme .sidebar-copy-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dark-theme .sidebar-result {
  border-color: var(--color-border);
  background: var(--color-bg-primary);
}

.dark-theme .sidebar-translating {
  color: var(--color-text-tertiary);
}

.dark-theme .sidebar-result-text {
  color: var(--color-text-primary);
}

.dark-theme .sidebar-empty {
  color: var(--color-text-secondary);
}

.dark-theme .history-panel {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

.dark-theme .history-header {
  border-bottom-color: var(--color-border);
}

.dark-theme .history-header h3 {
  color: var(--color-text-primary);
}

.dark-theme .history-action-btn {
  color: var(--color-text-tertiary);
}

.dark-theme .history-action-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}

.dark-theme .empty-history {
  color: var(--color-text-secondary);
}

.dark-theme .history-item {
  border-color: var(--color-border);
  background: var(--color-bg-secondary);
}

.dark-theme .history-item:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.dark-theme .history-item.favorite {
  border-color: rgba(251, 191, 36, 0.5);
  background: rgba(251, 191, 36, 0.05);
}

.dark-theme .history-lang-pair {
  color: var(--color-primary);
}

.dark-theme .history-icon-btn {
  color: var(--color-text-tertiary);
}

.dark-theme .history-icon-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-primary);
}

.dark-theme .history-source {
  color: var(--color-text-tertiary);
}

.dark-theme .history-target {
  color: var(--color-text-primary);
}

.dark-theme .history-time {
  color: var(--color-text-secondary);
}

.dark-theme .modal-overlay {
  background: rgba(0, 0, 0, 0.7);
}

.dark-theme .settings-modal {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

.dark-theme .modal-header {
  border-bottom-color: var(--color-border);
}

.dark-theme .modal-header h3 {
  color: var(--color-text-primary);
}

.dark-theme .modal-close {
  color: var(--color-text-tertiary);
}

.dark-theme .modal-close:hover {
  background: var(--color-bg-secondary);
}

.dark-theme .setting-label {
  color: var(--color-text-primary);
}

.dark-theme .setting-input {
  border-color: var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.dark-theme .setting-input:focus {
  border-color: var(--color-primary);
}

.dark-theme .setting-suffix {
  color: var(--color-text-tertiary);
}

.dark-theme .setting-btn {
  border-color: var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-tertiary);
}

.dark-theme .setting-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dark-theme .setting-hint {
  color: var(--color-text-secondary);
}

.dark-theme .setting-option-btn {
  border-color: var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-tertiary);
}

.dark-theme .setting-option-btn:hover {
  border-color: var(--color-primary);
}

.dark-theme .setting-option-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.dark-theme .modal-footer {
  border-top-color: var(--color-border);
}

/* 响应式 */
@media (max-width: 768px) {
  .translate-panel {
    grid-template-columns: 1fr;
  }

  .swap-lang-btn {
    margin: 0 auto;
    transform: rotate(90deg);
  }

  .history-panel {
    width: 100%;
  }

  .settings-modal {
    width: calc(100% - 32px);
    margin: 16px;
  }
}
</style>
