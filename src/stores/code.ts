import { defineStore } from 'pinia'
import { ref, computed, ComputedRef, Ref } from 'vue'
import { useStorage } from '@/composables/useStorage'
import { STORAGE_KEYS } from '@/constants'

/**
 * 文件节点接口
 */
export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  content?: string
  language?: string
  children?: FileNode[]
  expanded?: boolean
  modified?: boolean
}

/**
 * 终端输出项接口
 */
export interface TerminalOutput {
  id: string
  type: 'info' | 'success' | 'error' | 'warning' | 'command'
  content: string
  timestamp: number
}

/**
 * 代码助手状态接口
 */
export interface CodeAssistantState {
  workspacePath: string
  fileTree: FileNode[]
  currentFile: FileNode | null
  openFiles: FileNode[]
  activeFileId: string | null
  terminalOutputs: TerminalOutput[]
  isTerminalExpanded: boolean
  aiInstruction: string
  isProcessing: boolean
  generatedCode: string
  selectedLanguage: string
}

/**
 * 代码助手 Store
 */
export const useCodeStore = defineStore('code', () => {
  // 使用 useStorage 持久化状态
  const { data: savedWorkspace } = useStorage<string>(
    `${STORAGE_KEYS.SETTINGS}_code_workspace`,
    '',
    { debounceMs: 500 }
  )

  const { data: savedLanguage } = useStorage<string>(
    `${STORAGE_KEYS.SETTINGS}_code_language`,
    'javascript',
    { debounceMs: 500 }
  )

  // State
  const workspacePath = ref<string>(savedWorkspace.value || '')
  const fileTree = ref<FileNode[]>([])
  const currentFile = ref<FileNode | null>(null)
  const openFiles = ref<FileNode[]>([])
  const activeFileId = ref<string | null>(null)
  const terminalOutputs = ref<TerminalOutput[]>([])
  const isTerminalExpanded = ref<boolean>(true)
  const aiInstruction = ref<string>('')
  const isProcessing = ref<boolean>(false)
  const generatedCode = ref<string>('')
  const selectedLanguage = ref<string>(savedLanguage.value || 'javascript')

  // Computed
  const activeFile: ComputedRef<FileNode | null> = computed(() => {
    if (!activeFileId.value) return null
    return findFileById(fileTree.value, activeFileId.value)
  })

  const terminalVisible: ComputedRef<boolean> = computed(() => isTerminalExpanded.value)

  // Actions

  /**
   * 初始化文件树
   */
  function initializeFileTree(): void {
    fileTree.value = []
  }

  /**
   * 递归查找文件节点
   */
  function findFileById(nodes: FileNode[], id: string): FileNode | null {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findFileById(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  /**
   * 设置工作目录
   */
  function setWorkspacePath(path: string): void {
    workspacePath.value = path
    savedWorkspace.value = path
  }

  /**
   * 选择文件
   */
  function selectFile(file: FileNode): void {
    if (file.type === 'folder') {
      toggleFolder(file)
      return
    }

    activeFileId.value = file.id
    currentFile.value = file

    // 添加到打开文件列表
    const exists = openFiles.value.find(f => f.id === file.id)
    if (!exists) {
      openFiles.value.push(file)
    }
  }

  /**
   * 切换文件夹展开状态
   */
  function toggleFolder(folder: FileNode): void {
    const node = findFileById(fileTree.value, folder.id)
    if (node) {
      node.expanded = !node.expanded
    }
  }

  /**
   * 关闭打开的文件
   */
  function closeFile(fileId: string): void {
    openFiles.value = openFiles.value.filter(f => f.id !== fileId)
    if (activeFileId.value === fileId) {
      activeFileId.value = openFiles.value.length > 0 ? openFiles.value[openFiles.value.length - 1].id : null
      currentFile.value = openFiles.value.length > 0 ? openFiles.value[openFiles.value.length - 1] : null
    }
  }

  /**
   * 添加终端输出
   */
  function addTerminalOutput(
    content: string,
    type: TerminalOutput['type'] = 'info'
  ): void {
    const output: TerminalOutput = {
      id: `output_${Date.now()}`,
      type,
      content,
      timestamp: Date.now()
    }
    terminalOutputs.value.push(output)
  }

  /**
   * 清空终端
   */
  function clearTerminal(): void {
    terminalOutputs.value = []
  }

  /**
   * 设置 AI 指令
   */
  function setAiInstruction(instruction: string): void {
    aiInstruction.value = instruction
  }

  /**
   * 设置处理状态
   */
  function setProcessing(processing: boolean): void {
    isProcessing.value = processing
  }

  /**
   * 设置生成的代码
   */
  function setGeneratedCode(code: string): void {
    generatedCode.value = code
  }

  /**
   * 设置选择的语言
   */
  function setSelectedLanguage(language: string): void {
    selectedLanguage.value = language
    savedLanguage.value = language
  }

  /**
   * 切换终端展开状态
   */
  function toggleTerminal(): void {
    isTerminalExpanded.value = !isTerminalExpanded.value
  }

  /**
   * 更新文件内容
   */
  function updateFileContent(fileId: string, content: string): void {
    const node = findFileById(fileTree.value, fileId)
    if (node && node.type === 'file') {
      node.content = content
      node.modified = true
    }
    if (currentFile.value?.id === fileId) {
      currentFile.value.content = content
      currentFile.value.modified = true
    }
  }

  /**
   * 保存文件
   */
  function saveFile(fileId: string): boolean {
    const node = findFileById(fileTree.value, fileId)
    if (node && node.type === 'file') {
      node.modified = false
      if (currentFile.value?.id === fileId) {
        currentFile.value.modified = false
      }
      addTerminalOutput(`✔ 文件已保存：${node.path}`, 'success')
      return true
    }
    return false
  }

  /**
   * 运行当前文件
   */
  function runCurrentFile(): void {
    if (!currentFile.value) {
      addTerminalOutput('❌ 请先选择一个文件', 'error')
      return
    }

    const file = currentFile.value
    addTerminalOutput(`➜ 运行：${file.name}`, 'command')

    // 模拟运行
    setTimeout(() => {
      if (file.language === 'python') {
        addTerminalOutput(`✔ 运行成功：${file.name}`, 'success')
        addTerminalOutput(`Output: {"message": "AI 生成接口"}`, 'info')
      } else {
        addTerminalOutput(`⚠ 不支持运行此文件类型`, 'warning')
      }
    }, 500)
  }

  return {
    // State
    workspacePath,
    fileTree,
    currentFile,
    openFiles,
    activeFileId,
    terminalOutputs,
    isTerminalExpanded,
    aiInstruction,
    isProcessing,
    generatedCode,
    selectedLanguage,
    // Computed
    activeFile,
    terminalVisible,
    // Actions
    initializeFileTree,
    setWorkspacePath,
    selectFile,
    toggleFolder,
    closeFile,
    addTerminalOutput,
    clearTerminal,
    setAiInstruction,
    setProcessing,
    setGeneratedCode,
    setSelectedLanguage,
    toggleTerminal,
    updateFileContent,
    saveFile,
    runCurrentFile
  }
})
