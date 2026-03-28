<template>
  <div class="code-view">
    <!-- 顶部工具栏 -->
    <div class="code-header">
      <div class="header-left">
        <h2 class="page-title">
          <i class="fa-solid fa-code"></i>
          代码助手
        </h2>
      </div>
      <div class="header-actions">
        <button class="header-btn" @click="saveAllFiles">
          <i class="fa-solid fa-save"></i>
          <span>保存全部</span>
        </button>
        <button class="header-btn primary" @click="runCurrentFile">
          <i class="fa-solid fa-play"></i>
          <span>运行</span>
        </button>
      </div>
    </div>

    <div class="code-content">
      <!-- 左侧工作区 -->
      <div class="sidebar">
        <div class="sidebar-section">
          <div class="section-title">工作区</div>

          <!-- 工作目录 -->
          <div class="workspace-input">
            <div class="input-label">工作目录</div>
            <input
              v-model="workspacePath"
              type="text"
              class="workspace-path-input"
              placeholder="选择项目根目录..."
              @keyup.enter="loadWorkspace"
            />
          </div>

          <!-- 选择文件夹按钮 -->
          <div class="workspace-actions">
            <button class="workspace-btn" @click="selectWorkspace">
              <i class="fa-solid fa-folder-open"></i>
              <span>选择文件夹</span>
            </button>
          </div>

          <!-- 文件结构树 -->
          <div class="file-tree-section">
            <div class="section-title small">文件结构</div>
            <div class="file-tree">
              <FileTreeNode
                v-for="node in codeStore.fileTree"
                :key="node.id"
                :node="node"
                :active-id="codeStore.activeFileId"
                @select="handleFileSelect"
                @toggle="handleFolderToggle"
              />
              <div v-if="codeStore.fileTree.length === 0" class="empty-tree">
                <i class="fa-solid fa-folder-open"></i>
                <span>暂无文件</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="main-content">
        <!-- AI 指令输入区 -->
        <div class="ai-instruction-section">
          <div class="section-title">AI 指令</div>
          <textarea
            v-model="codeStore.aiInstruction"
            class="instruction-textarea"
            placeholder="输入指令，例如：帮我写接口、自动运行、修改代码、构建项目..."
            rows="3"
          ></textarea>
          <div class="instruction-actions">
            <div class="language-selector">
              <label class="lang-label">语言：</label>
              <select v-model="codeStore.selectedLanguage" class="lang-select">
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="cpp">C++</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
              </select>
            </div>
            <button
              class="execute-btn"
              :class="{ processing: codeStore.isProcessing }"
              @click="executeAITask"
              :disabled="codeStore.isProcessing || !codeStore.aiInstruction.trim()"
            >
              <i :class="codeStore.isProcessing ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-magic'"></i>
              <span>{{ codeStore.isProcessing ? '执行中...' : '执行任务' }}</span>
            </button>
          </div>
        </div>

        <!-- 代码编辑器区域 -->
        <div class="editor-section">
          <!-- 文件标签页 -->
          <div class="file-tabs" v-if="codeStore.openFiles.length > 0">
            <div
              v-for="file in codeStore.openFiles"
              :key="file.id"
              class="file-tab"
              :class="{ active: codeStore.activeFileId === file.id }"
              @click="switchToFile(file.id)"
            >
              <i :class="getFileIcon(file)"></i>
              <span class="tab-name">{{ file.name }}</span>
              <span v-if="file.modified" class="modified-indicator"></span>
              <button class="tab-close" @click.stop="closeFileTab(file.id)">
                <i class="fa-solid fa-times"></i>
              </button>
            </div>
          </div>

          <!-- 代码编辑器 -->
          <div class="editor-container">
            <div v-if="!codeStore.currentFile" class="empty-editor">
              <i class="fa-solid fa-file-code"></i>
              <span>请从左侧选择或创建一个文件</span>
            </div>
            <div v-else class="code-editor-wrapper">
              <div class="editor-header">
                <div class="file-info">
                  <i :class="getFileIcon(codeStore.currentFile)"></i>
                  <span class="file-path">{{ codeStore.currentFile.path }}</span>
                </div>
                <div class="editor-actions">
                  <button class="editor-action-btn" @click="saveCurrentFile" title="保存">
                    <i class="fa-solid fa-save"></i>
                  </button>
                  <button class="editor-action-btn run-btn" @click="runCurrentFile" title="运行">
                    <i class="fa-solid fa-play"></i>
                    <span>运行</span>
                  </button>
                </div>
              </div>
              <div class="code-content-area">
                <textarea
                  ref="codeEditorRef"
                  v-model="editorContent"
                  class="code-textarea"
                  :disabled="codeStore.isProcessing"
                  @input="handleCodeChange"
                  spellcheck="false"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- 终端输出 -->
        <div class="terminal-section" :class="{ expanded: codeStore.isTerminalExpanded }" :style="{ height: terminalHeight + 'px' }">
          <!-- 拖动手柄 -->
          <div class="terminal-resize-handle" @mousedown="startResize">
            <i class="fa-solid fa-grip-lines"></i>
          </div>
          <div class="terminal-header">
            <div class="terminal-title">
              <i class="fa-solid fa-terminal"></i>
              <span>终端输出</span>
            </div>
            <div class="terminal-actions">
              <button class="terminal-action-btn" @click="clearTerminal" title="清空">
                <i class="fa-solid fa-trash"></i>
              </button>
              <button class="terminal-action-btn" @click="codeStore.toggleTerminal" title="折叠/展开">
                <i :class="codeStore.isTerminalExpanded ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up'"></i>
              </button>
            </div>
          </div>
          <div v-show="codeStore.isTerminalExpanded" class="terminal-content" ref="terminalRef">
            <div
              v-for="output in codeStore.terminalOutputs"
              :key="output.id"
              class="terminal-line"
              :class="`terminal-${output.type}`"
            >
              <span class="terminal-prefix">{{ getTerminalPrefix(output.type) }}</span>
              <span class="terminal-text">{{ output.content }}</span>
            </div>
            <div v-if="codeStore.terminalOutputs.length === 0" class="terminal-empty">
              <span>暂无输出</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useCodeStore } from '@/stores/code'
import { useSettingsStore } from '@/stores/settings'
import { useStreamingAI } from '@/composables/useStreamingAI'
import { useNotification } from '@/composables/useNotification'
import FileTreeNode from '@/components/FileTreeNode.vue'

const codeStore = useCodeStore()
const settingsStore = useSettingsStore()
const { success, error: showError, warning } = useNotification()
const { sendStreamRequest } = useStreamingAI()

// 本地状态
const workspacePath = ref<string>('')
const editorContent = ref<string>('')
const terminalRef = ref<HTMLElement | null>(null)
const terminalHeight = ref<number>(200)
const isResizing = ref<boolean>(false)

/**
 * 开始调整终端大小
 */
function startResize(e: MouseEvent): void {
  isResizing.value = true
  const startY = e.clientY
  const startHeight = terminalHeight.value

  function onMouseMove(moveEvent: MouseEvent): void {
    const deltaY = startY - moveEvent.clientY
    let newHeight = startHeight + deltaY
    // 限制最小和最大高度
    newHeight = Math.max(120, Math.min(newHeight, 600))
    terminalHeight.value = newHeight
  }

  function onMouseUp(): void {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 同步状态
watch(() => settingsStore.apiKey, (newKey) => {
  if (!newKey) {
    warning('请先在设置中配置 API Key')
  }
})

watch(() => codeStore.currentFile, (file) => {
  if (file?.content) {
    editorContent.value = file.content
  } else {
    editorContent.value = ''
  }
}, { immediate: true })

// 监听终端输出变化，自动滚动
watch(() => codeStore.terminalOutputs, () => {
  nextTick(() => {
    scrollToTerminalBottom()
  })
}, { deep: true })

// 初始化
onMounted(() => {
  codeStore.initializeFileTree()
  codeStore.addTerminalOutput('➜ 代码助手已就绪', 'success')
  codeStore.addTerminalOutput('提示：选择文件夹开始工作', 'info')
})

// 组件卸载时清理
onUnmounted(() => {
  // 如果在调整大小中，强制触发 mouseup 来清理
  if (isResizing.value) {
    isResizing.value = false
  }
})

// 方法

/**
 * 获取文件图标
 */
function getFileIcon(file: { name: string; type?: string }): string {
  const name = file.name.toLowerCase()
  if (name.endsWith('.py')) return 'fa-solid fa-file-code text-yellow-400'
  if (name.endsWith('.js') || name.endsWith('.mjs')) return 'fa-solid fa-file-code text-yellow-300'
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'fa-solid fa-file-code text-blue-400'
  if (name.endsWith('.vue')) return 'fa-solid fa-file-code text-green-400'
  if (name.endsWith('.html')) return 'fa-solid fa-file-code text-orange-400'
  if (name.endsWith('.css') || name.endsWith('.scss')) return 'fa-solid fa-file-code text-cyan-400'
  if (name.endsWith('.json')) return 'fa-solid fa-file-code text-green-300'
  if (name.endsWith('.md')) return 'fa-solid fa-file-text text-blue-300'
  if (name.endsWith('.txt')) return 'fa-solid fa-file-text text-gray-400'
  if (name.endsWith('.yaml') || name.endsWith('.yml')) return 'fa-solid fa-file-code text-red-400'
  return 'fa-solid fa-file text-dark-muted'
}

/**
 * 获取终端前缀
 */
function getTerminalPrefix(type: string): string {
  switch (type) {
    case 'success': return '✔'
    case 'error': return '✖'
    case 'warning': return '⚠'
    case 'command': return '➜'
    default: return '•'
  }
}

/**
 * 选择工作区
 */
async function selectWorkspace(): Promise<void> {
  // 模拟文件选择器
  const path = prompt('请输入项目目录路径:', workspacePath.value || '/Users/me/project')
  if (path) {
    workspacePath.value = path
    codeStore.setWorkspacePath(path)
    codeStore.addTerminalOutput(`工作目录：${path}`, 'info')
    // 模拟加载文件树
    setTimeout(() => {
      codeStore.addTerminalOutput('✔ 文件树已加载', 'success')
    }, 300)
  }
}

/**
 * 加载工作区
 */
function loadWorkspace(): void {
  if (workspacePath.value.trim()) {
    codeStore.setWorkspacePath(workspacePath.value.trim())
    codeStore.addTerminalOutput(`工作目录：${workspacePath.value}`, 'info')
    success('工作区已加载')
  }
}

/**
 * 处理文件选择
 */
function handleFileSelect(node: { id: string; name: string; type: string; path: string; content?: string }): void {
  codeStore.selectFile(node as any)
  if (node.type !== 'folder') {
    codeStore.addTerminalOutput(`打开文件：${node.name}`, 'info')
  }
}

/**
 * 处理文件夹切换
 */
function handleFolderToggle(node: { id: string; type: string }): void {
  if (node.type === 'folder') {
    codeStore.toggleFolder(node as any)
  }
}

/**
 * 切换到文件
 */
function switchToFile(fileId: string): void {
  const file = codeStore.openFiles.find(f => f.id === fileId)
  if (file) {
    codeStore.selectFile(file)
  }
}

/**
 * 关闭文件标签页
 */
function closeFileTab(fileId: string): void {
  codeStore.closeFile(fileId)
}

/**
 * 处理代码变化
 */
function handleCodeChange(): void {
  if (codeStore.currentFile) {
    codeStore.updateFileContent(codeStore.currentFile.id, editorContent.value)
  }
}

/**
 * 保存当前文件
 */
function saveCurrentFile(): void {
  if (codeStore.currentFile) {
    codeStore.saveFile(codeStore.currentFile.id)
  }
}

/**
 * 保存全部文件
 */
function saveAllFiles(): void {
  codeStore.openFiles.forEach(file => {
    codeStore.saveFile(file.id)
  })
  success('所有文件已保存')
}

/**
 * 运行当前文件
 */
function runCurrentFile(): void {
  codeStore.runCurrentFile()
}

/**
 * 清空终端
 */
function clearTerminal(): void {
  codeStore.clearTerminal()
}

/**
 * 滚动终端到底部
 */
function scrollToTerminalBottom(): void {
  if (terminalRef.value) {
    // 检查元素是否可见
    const isVisible = terminalRef.value.offsetParent !== null
    if (isVisible) {
      nextTick(() => {
        if (terminalRef.value) {
          terminalRef.value.scrollTop = terminalRef.value.scrollHeight
        }
      })
    }
  }
}

/**
 * 执行 AI 任务
 */
async function executeAITask(): Promise<void> {
  const instruction = codeStore.aiInstruction.trim()
  if (!instruction) {
    warning('请输入 AI 指令')
    return
  }

  if (!settingsStore.apiKey && settingsStore.apiProvider !== 'ollama') {
    showError('请先在设置中配置 API Key')
    return
  }

  codeStore.setProcessing(true)
  codeStore.addTerminalOutput(`➜ 执行 AI 任务：${instruction}`, 'command')

  // 构建提示词
  const context = codeStore.currentFile
    ? `当前编辑的文件：${codeStore.currentFile.path}\n语言：${codeStore.currentFile.language || codeStore.selectedLanguage}\n内容：\n${editorContent.value}\n\n`
    : ''

  const systemPrompt = `你是一个专业的编程助手，擅长各种编程语言的代码生成、修改和解释。
请根据用户的指令完成任务，直接输出代码结果，不需要过多解释。
如果是指令是修改代码，请输出完整的修改后代码。`

  const prompt = `${systemPrompt}\n\n${context}用户指令：${instruction}`

  try {
    const result = await sendStreamRequest(prompt, {
      onComplete: (code: string) => {
        codeStore.setGeneratedCode(code)
        // 如果有当前文件，更新编辑器内容
        if (codeStore.currentFile) {
          editorContent.value = code
          codeStore.updateFileContent(codeStore.currentFile.id, code)
        }
        codeStore.addTerminalOutput('✔ AI 任务执行完成', 'success')
      },
      onError: (err: Error) => {
        console.error('AI 任务执行失败:', err)
      }
    })

    if (result) {
      editorContent.value = result
      if (codeStore.currentFile) {
        codeStore.updateFileContent(codeStore.currentFile.id, result)
      }
      codeStore.addTerminalOutput('✔ 代码已生成', 'success')
    }
  } catch (err) {
    codeStore.addTerminalOutput(`✖ 执行失败：${(err as Error).message}`, 'error')
  } finally {
    codeStore.setProcessing(false)
  }
}
</script>

<style scoped>
.code-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  overflow: hidden;
}

/* 顶部工具栏 */
.code-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
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
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.header-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-text-tertiary);
}

.header-btn.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.header-btn.primary:hover {
  background: var(--color-primary-hover);
}

/* 主内容区 */
.code-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧边栏 */
.sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
}

.sidebar-section {
  padding: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-title.small {
  font-size: 12px;
  margin-top: 16px;
}

/* 工作区输入 */
.workspace-input {
  margin-bottom: 12px;
}

.input-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.workspace-path-input {
  width: 100%;
  padding: 8px 10px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.workspace-path-input:focus {
  border-color: var(--color-primary);
}

.workspace-path-input::placeholder {
  color: var(--color-text-tertiary);
}

/* 工作区操作按钮 */
.workspace-actions {
  margin-bottom: 16px;
}

.workspace-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.workspace-btn:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-primary);
}

/* 文件树 */
.file-tree-section {
  flex: 1;
  overflow: hidden;
}

.file-tree {
  padding-left: 4px;
}

.empty-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.empty-tree i {
  font-size: 32px;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* AI 指令区 */
.ai-instruction-section {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.instruction-textarea {
  width: 100%;
  padding: 12px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 14px;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.instruction-textarea:focus {
  border-color: var(--color-primary);
}

.instruction-textarea::placeholder {
  color: var(--color-text-tertiary);
}

.instruction-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.language-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.lang-select {
  padding: 6px 12px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.lang-select:focus {
  border-color: var(--color-primary);
}

.execute-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-inverse);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.execute-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.execute-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 编辑器区域 */
.editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg-primary);
}

.file-tabs {
  display: flex;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}

.file-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.file-tab:hover {
  background: var(--color-bg-tertiary);
}

.file-tab.active {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-bottom: 2px solid var(--color-primary);
}

.tab-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modified-indicator {
  width: 8px;
  height: 8px;
  background: var(--color-warning);
  border-radius: 50%;
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.tab-close:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--color-text-secondary);
}

.empty-editor i {
  font-size: 48px;
}

.code-editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.file-info i {
  font-size: 16px;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.editor-action-btn:hover {
  background: var(--color-bg-tertiary);
}

.editor-action-btn.run-btn {
  background: var(--color-success);
  border-color: var(--color-success);
  color: var(--color-text-inverse);
}

.editor-action-btn.run-btn:hover {
  background: var(--color-success);
}

.code-content-area {
  flex: 1;
  overflow: hidden;
  padding: 16px;
  background: var(--color-bg-primary);
}

.code-textarea {
  width: 100%;
  height: 100%;
  padding: 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  overflow: auto;
}

.code-textarea:focus {
  border-color: var(--color-primary);
}

/* 终端区域 */
.terminal-section {
  height: 200px;
  min-height: 120px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  position: relative;
}

/* 拖动手柄 */
.terminal-resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  z-index: 10;
}

.terminal-resize-handle:hover {
  background: var(--color-border);
}

.terminal-resize-handle i {
  font-size: 10px;
  color: var(--color-text-tertiary);
  opacity: 0;
  transition: opacity 0.2s;
}

.terminal-resize-handle:hover i {
  opacity: 1;
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
}

.terminal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.terminal-actions {
  display: flex;
  gap: 4px;
}

.terminal-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.terminal-action-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.terminal-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: var(--color-bg-secondary);
}

.terminal-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4px;
}

.terminal-prefix {
  flex-shrink: 0;
  width: 16px;
}

.terminal-text {
  word-break: break-all;
}

.terminal-info .terminal-text { color: var(--color-text-secondary); }
.terminal-success .terminal-text { color: var(--color-success); }
.terminal-error .terminal-text { color: var(--color-danger); }
.terminal-warning .terminal-text { color: var(--color-warning); }
.terminal-command .terminal-text { color: var(--color-primary); }

.terminal-info .terminal-prefix { color: var(--color-text-secondary); }
.terminal-success .terminal-prefix { color: var(--color-success); }
.terminal-error .terminal-prefix { color: var(--color-danger); }
.terminal-warning .terminal-prefix { color: var(--color-warning); }
.terminal-command .terminal-prefix { color: var(--color-primary); }

.terminal-empty {
  color: var(--color-text-tertiary);
  font-size: 13px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-tertiary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}
</style>
