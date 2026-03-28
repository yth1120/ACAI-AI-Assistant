import { defineStore } from 'pinia'
import { ref, computed, watch, Ref, ComputedRef } from 'vue'
import { STORAGE_KEYS, API_PROVIDER_CONFIGS, ApiProvider, ThemeMode } from '@/constants'
import { encrypt, decrypt } from '@/utils/security'
import { validateApiKey } from '@/utils'

/**
 * API 状态类型
 */
export type ApiStatus = 'connected' | 'disconnected' | 'error' | 'checking'

/**
 * 设置状态接口
 */
export interface SettingsState {
  apiProvider: ApiProvider
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  deepThinking: boolean
  webSearch: boolean
  theme: ThemeMode
  sidebarCollapsed: boolean
  apiStatus: ApiStatus
  customModels: Record<string, Record<string, string>>
}

/**
 * Settings Store 接口
 */
export interface SettingsStore {
  // State
  apiProvider: Ref<ApiProvider>
  apiKey: Ref<string>
  model: Ref<string>
  temperature: Ref<number>
  maxTokens: Ref<number>
  deepThinking: Ref<boolean>
  webSearch: Ref<boolean>
  theme: Ref<ThemeMode>
  sidebarCollapsed: Ref<boolean>
  apiStatus: Ref<ApiStatus>
  customModels: Ref<Record<string, Record<string, string>>>
  // Computed
  currentConfig: ComputedRef<any>
  availableModels: ComputedRef<Record<string, string>>
  currentModelName: ComputedRef<string>
  // Actions
  loadSettings: () => void
  saveSettings: () => void
  applyTheme: () => void
  applySidebarState: () => void
  toggleSidebar: () => void
  changeProvider: (newProvider: ApiProvider) => void
  validateCurrentApiKey: () => boolean
  setApiKey: (key: string) => boolean
  resetSettings: () => void
  addCustomModel: (id: string, name: string) => void
  removeCustomModel: (id: string) => void
}

/**
 * 默认设置
 */
const DEFAULT_SETTINGS: Omit<SettingsState, 'apiKey' | 'apiStatus'> = {
  apiProvider: 'deepseek',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2000,
  deepThinking: false,
  webSearch: false,
  theme: 'light',
  sidebarCollapsed: false,
  customModels: {}
}

export const useSettingsStore = defineStore('settings', () => {
  // ============ State ============
  const apiProvider = ref<ApiProvider>(DEFAULT_SETTINGS.apiProvider)
  const apiKey = ref<string>('')
  const model = ref<string>(DEFAULT_SETTINGS.model)
  const temperature = ref<number>(DEFAULT_SETTINGS.temperature)
  const maxTokens = ref<number>(DEFAULT_SETTINGS.maxTokens)
  const deepThinking = ref<boolean>(DEFAULT_SETTINGS.deepThinking)
  const webSearch = ref<boolean>(DEFAULT_SETTINGS.webSearch)
  const theme = ref<ThemeMode>(DEFAULT_SETTINGS.theme)
  const sidebarCollapsed = ref<boolean>(DEFAULT_SETTINGS.sidebarCollapsed)
  const apiStatus = ref<ApiStatus>('disconnected')
  const customModels = ref<Record<string, Record<string, string>>>({})

  // ============ Computed ============
  const currentConfig = computed(() => API_PROVIDER_CONFIGS[apiProvider.value])

  const availableModels = computed(() => {
    const config = currentConfig.value
    const builtIn = config?.models || {}
    const custom = customModels.value[apiProvider.value] || {}
    return { ...builtIn, ...custom }
  })

  const currentModelName = computed(() => {
    const models = availableModels.value
    return models[model.value] || model.value
  })

  // ============ Actions ============

  /**
   * 加载设置
   */
  function loadSettings(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (!saved) {
        // 无保存设置，应用默认值
        applyTheme()
        applySidebarState()
        return
      }

      const settings = JSON.parse(saved) as Partial<SettingsState>

      // 恢复设置
      apiProvider.value = settings.apiProvider || DEFAULT_SETTINGS.apiProvider
      model.value = settings.model || getDefaultModelForProvider(apiProvider.value)
      temperature.value = settings.temperature ?? DEFAULT_SETTINGS.temperature
      maxTokens.value = settings.maxTokens ?? DEFAULT_SETTINGS.maxTokens
      deepThinking.value = settings.deepThinking ?? DEFAULT_SETTINGS.deepThinking
      webSearch.value = settings.webSearch ?? DEFAULT_SETTINGS.webSearch
      theme.value = settings.theme || DEFAULT_SETTINGS.theme
      sidebarCollapsed.value = settings.sidebarCollapsed ?? DEFAULT_SETTINGS.sidebarCollapsed
      apiStatus.value = settings.apiStatus || 'disconnected'
      if (settings.customModels) {
        customModels.value = settings.customModels
      }

      // 解密 API Key
      if (settings.apiKey) {
        const decryptedKey = decrypt(settings.apiKey)
        apiKey.value = decryptedKey || ''
      }

      // 验证并修正模型设置
      validateModelSetting()

      // 应用设置
      applyTheme()
      applySidebarState()
    } catch (error) {
      console.error('加载设置失败:', error)
      // 发生错误时使用默认设置
      resetSettings()
    }
  }

  /**
   * 保存设置
   */
  function saveSettings(): void {
    try {
      const settings: SettingsState = {
        apiProvider: apiProvider.value,
        apiKey: encrypt(apiKey.value),
        model: model.value,
        temperature: temperature.value,
        maxTokens: maxTokens.value,
        deepThinking: deepThinking.value,
        webSearch: webSearch.value,
        theme: theme.value,
        sidebarCollapsed: sidebarCollapsed.value,
        apiStatus: apiStatus.value,
        customModels: customModels.value
      }
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  /**
   * 应用主题
   */
  function applyTheme(): void {
    const root = document.documentElement
    root.classList.remove('light-theme', 'dark-theme')

    let effectiveTheme: ThemeMode = theme.value
    if (theme.value === 'auto') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    root.classList.add(`${effectiveTheme}-theme`)
  }

  /**
   * 应用侧边栏状态
   */
  function applySidebarState(): void {
    document.documentElement.classList.toggle('sidebar-collapsed', sidebarCollapsed.value)
  }

  /**
   * 切换侧边栏
   */
  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
    applySidebarState()
  }

  /**
   * 切换 API 提供商
   */
  function changeProvider(newProvider: ApiProvider): void {
    apiProvider.value = newProvider
    model.value = getDefaultModelForProvider(newProvider)
  }

  /**
   * 验证 API Key
   */
  function validateCurrentApiKey(): boolean {
    return validateApiKey(apiKey.value, apiProvider.value)
  }

  /**
   * 设置 API Key
   */
  function setApiKey(key: string): boolean {
    if (validateApiKey(key, apiProvider.value)) {
      apiKey.value = key
      apiStatus.value = 'connected'
      return true
    }
    apiStatus.value = 'error'
    return false
  }

  /**
   * 验证模型设置
   */
  function validateModelSetting(): void {
    const models = Object.keys(availableModels.value)
    if (models.length === 0) return

    if (!models.includes(model.value)) {
      // 当前模型不在可用列表中，切换到默认模型
      console.warn(`模型 ${model.value} 不再可用，切换到默认模型`)
      model.value = models[0]
    }
  }

  /**
   * 获取提供商的默认模型
   */
  function getDefaultModelForProvider(provider: ApiProvider): string {
    const config = API_PROVIDER_CONFIGS[provider]
    const models = config?.models
    if (!models) return DEFAULT_SETTINGS.model

    const modelKeys = Object.keys(models)
    return modelKeys[0] || DEFAULT_SETTINGS.model
  }

  /**
   * 添加自定义模型
   */
  function addCustomModel(id: string, name: string): void {
    const provider = apiProvider.value
    if (!customModels.value[provider]) {
      customModels.value[provider] = {}
    }
    customModels.value[provider][id] = name
    saveSettings()
  }

  /**
   * 删除自定义模型
   */
  function removeCustomModel(id: string): void {
    const provider = apiProvider.value
    if (customModels.value[provider]) {
      delete customModels.value[provider][id]
      // 如果当前选中的模型被删除，切换到第一个可用模型
      if (model.value === id) {
        const models = Object.keys(availableModels.value)
        model.value = models[0] || DEFAULT_SETTINGS.model
      }
      saveSettings()
    }
  }

  /**
   * 重置设置为默认值
   */
  function resetSettings(): void {
    apiProvider.value = DEFAULT_SETTINGS.apiProvider
    model.value = DEFAULT_SETTINGS.model
    temperature.value = DEFAULT_SETTINGS.temperature
    maxTokens.value = DEFAULT_SETTINGS.maxTokens
    deepThinking.value = DEFAULT_SETTINGS.deepThinking
    webSearch.value = DEFAULT_SETTINGS.webSearch
    theme.value = DEFAULT_SETTINGS.theme
    sidebarCollapsed.value = DEFAULT_SETTINGS.sidebarCollapsed
    apiKey.value = ''
    apiStatus.value = 'disconnected'

    applyTheme()
    applySidebarState()
  }

  // ============ Watchers ============

  /**
   * 监听设置变化自动保存
   */
  watch(
    [
      apiProvider,
      apiKey,
      model,
      temperature,
      maxTokens,
      deepThinking,
      webSearch,
      theme,
      sidebarCollapsed,
      customModels
    ],
    () => {
      saveSettings()
    },
    { deep: true }
  )

  /**
   * 监听系统主题变化
   */
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'auto') {
        applyTheme()
      }
    })
  }

  return {
    // State
    apiProvider,
    apiKey,
    model,
    temperature,
    maxTokens,
    deepThinking,
    webSearch,
    theme,
    sidebarCollapsed,
    apiStatus,
    customModels,
    // Computed
    currentConfig,
    availableModels,
    currentModelName,
    // Actions
    loadSettings,
    saveSettings,
    applyTheme,
    applySidebarState,
    toggleSidebar,
    changeProvider,
    validateCurrentApiKey,
    setApiKey,
    resetSettings,
    addCustomModel,
    removeCustomModel
  }
})
