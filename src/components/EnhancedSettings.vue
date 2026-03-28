<template>
  <div class="enhanced-settings">
    <!-- 设置选项卡 -->
    <n-tabs
      v-model:value="currentTab"
      type="line"
      animated
      class="settings-tabs"
    >
      <!-- API设置 -->
      <n-tab-pane name="api" tab="API设置">
        <n-card title="AI服务配置" size="small">
          <n-form
            ref="apiFormRef"
            :model="apiForm"
            :rules="apiRules"
            label-placement="left"
            label-width="auto"
            require-mark-placement="right-hanging"
            size="medium"
          >
            <!-- AI服务提供商 -->
            <n-form-item label="服务提供商" path="provider">
              <n-select
                v-model:value="apiForm.provider"
                :options="providerOptions"
                placeholder="请选择AI服务提供商"
                clearable
                @update:value="onProviderChange"
              />
            </n-form-item>

            <!-- API密钥 -->
            <n-form-item label="API密钥" path="apiKey">
              <n-input
                v-model:value="apiForm.apiKey"
                type="password"
                placeholder="请输入API密钥"
                show-password-on="click"
                clearable
              >
                <template #password-visible-icon>
                  <n-icon :size="16">
                    <i class="fas fa-eye" />
                  </n-icon>
                </template>
                <template #password-invisible-icon>
                  <n-icon :size="16">
                    <i class="fas fa-eye-slash" />
                  </n-icon>
                </template>
              </n-input>
              <template #feedback>
                <n-text depth="3" style="font-size: 12px;">
                  您的API密钥仅存储在本地，不会上传到任何服务器
                </n-text>
              </template>
            </n-form-item>

            <!-- 模型选择 -->
            <n-form-item label="模型" path="model">
              <n-select
                v-model:value="apiForm.model"
                :options="modelOptions"
                placeholder="请选择模型"
                clearable
                :loading="loadingModels"
              />
            </n-form-item>

            <!-- 温度设置 -->
            <n-form-item label="温度" path="temperature">
              <n-slider
                v-model:value="apiForm.temperature"
                :min="0"
                :max="2"
                :step="0.1"
                :format-tooltip="formatTemperature"
              />
              <template #suffix>
                <n-text strong>{{ apiForm.temperature.toFixed(1) }}</n-text>
              </template>
            </n-form-item>

            <!-- 最大令牌数 -->
            <n-form-item label="最大令牌数" path="maxTokens">
              <n-input-number
                v-model:value="apiForm.maxTokens"
                :min="100"
                :max="8000"
                :step="100"
                placeholder="请输入最大令牌数"
              />
            </n-form-item>

            <!-- 高级选项 -->
            <n-collapse :default-expanded-names="[]">
              <n-collapse-item title="高级选项" name="advanced">
                <!-- 深度思考模式 -->
                <n-form-item label="深度思考模式" path="deepThinking">
                  <n-switch
                    v-model:value="apiForm.deepThinking"
                    size="large"
                  >
                    <template #checked>
                      <n-text strong>开启</n-text>
                    </template>
                    <template #unchecked>
                      <n-text depth="3">关闭</n-text>
                    </template>
                  </n-switch>
                  <template #feedback>
                    <n-text depth="3" style="font-size: 12px;">
                      开启后AI会进行更深入的思考，但响应时间可能变长
                    </n-text>
                  </template>
                </n-form-item>

                <!-- 联网搜索 -->
                <n-form-item label="联网搜索" path="webSearch">
                  <n-switch
                    v-model:value="apiForm.webSearch"
                    size="large"
                  >
                    <template #checked>
                      <n-text strong>开启</n-text>
                    </template>
                    <template #unchecked>
                      <n-text depth="3">关闭</n-text>
                    </template>
                  </n-switch>
                  <template #feedback>
                    <n-text depth="3" style="font-size: 12px;">
                      开启后AI可以访问网络信息（需要支持的服务商）
                    </n-text>
                  </template>
                </n-form-item>
              </n-collapse-item>
            </n-collapse>

            <!-- 操作按钮 -->
            <n-space justify="end" style="margin-top: 24px;">
              <n-button @click="resetApiForm">
                重置
              </n-button>
              <n-button
                type="primary"
                :loading="testingConnection"
                @click="testConnection"
              >
                测试连接
              </n-button>
              <n-button
                type="success"
                :loading="savingSettings"
                @click="saveApiSettings"
              >
                保存设置
              </n-button>
            </n-space>
          </n-form>
        </n-card>
      </n-tab-pane>

      <!-- 界面设置 -->
      <n-tab-pane name="ui" tab="界面设置">
        <n-card title="界面偏好" size="small">
          <n-form label-placement="left" label-width="auto">
            <!-- 主题设置 -->
            <n-form-item label="主题模式">
              <n-radio-group v-model:value="uiForm.theme">
                <n-space>
                  <n-radio value="light">
                    <n-space align="center" :size="8">
                      <n-icon size="20">
                        <i class="fas fa-sun" />
                      </n-icon>
                      <span>浅色主题</span>
                    </n-space>
                  </n-radio>
                  <n-radio value="dark">
                    <n-space align="center" :size="8">
                      <n-icon size="20">
                        <i class="fas fa-moon" />
                      </n-icon>
                      <span>深色主题</span>
                    </n-space>
                  </n-radio>
                  <n-radio value="auto">
                    <n-space align="center" :size="8">
                      <n-icon size="20">
                        <i class="fas fa-adjust" />
                      </n-icon>
                      <span>跟随系统</span>
                    </n-space>
                  </n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>

            <!-- 侧边栏 -->
            <n-form-item label="侧边栏">
              <n-switch
                v-model:value="uiForm.sidebarCollapsed"
                size="large"
              >
                <template #checked>
                  <n-space align="center" :size="8">
                    <n-icon size="16">
                      <i class="fas fa-chevron-left" />
                    </n-icon>
                    <span>收起</span>
                  </n-space>
                </template>
                <template #unchecked>
                  <n-space align="center" :size="8">
                    <n-icon size="16">
                      <i class="fas fa-chevron-right" />
                    </n-icon>
                    <span>展开</span>
                  </n-space>
                </template>
              </n-switch>
            </n-form-item>

            <!-- 动画效果 -->
            <n-form-item label="动画效果">
              <n-switch
                v-model:value="uiForm.animations"
                size="large"
              />
            </n-form-item>

            <!-- 字体大小 -->
            <n-form-item label="字体大小">
              <n-select
                v-model:value="uiForm.fontSize"
                :options="fontSizeOptions"
                placeholder="请选择字体大小"
              />
            </n-form-item>

            <!-- 保存按钮 -->
            <n-space justify="end" style="margin-top: 24px;">
              <n-button @click="resetUiForm">
                重置
              </n-button>
              <n-button type="primary" @click="saveUiSettings">
                保存设置
              </n-button>
            </n-space>
          </n-form>
        </n-card>
      </n-tab-pane>

      <!-- 快捷键设置 -->
      <n-tab-pane name="shortcuts" tab="快捷键">
        <n-card title="快捷键配置" size="small">
          <n-data-table
            :columns="shortcutColumns"
            :data="shortcutData"
            :bordered="false"
            :single-line="false"
          />
        </n-card>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import {
  NButton,
  NIcon,
  NCard,
  NTabs,
  NTabPane,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSlider,
  NInputNumber,
  NCollapse,
  NCollapseItem,
  NSwitch,
  NRadioGroup,
  NRadio,
  NSpace,
  NText,
  NDataTable,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'

// 消息提示
const message = useMessage()

// 存储
const settingsStore = useSettingsStore()

// 当前选项卡
const currentTab = ref('api')

// API表单数据
const apiForm = reactive({
  provider: settingsStore.apiProvider,
  apiKey: settingsStore.apiKey,
  model: settingsStore.model,
  temperature: settingsStore.temperature,
  maxTokens: settingsStore.maxTokens,
  deepThinking: settingsStore.deepThinking,
  webSearch: settingsStore.webSearch
})

// API表单验证规则
const apiRules = {
  provider: [
    { required: true, message: '请选择服务提供商', trigger: 'blur' }
  ],
  apiKey: [
    { required: true, message: '请输入API密钥', trigger: 'blur' },
    { min: 10, message: 'API密钥长度至少10位', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请选择模型', trigger: 'blur' }
  ]
}

// 服务提供商选项
const providerOptions = computed(() => {
  return Object.entries(settingsStore.currentConfig?.models || {}).map(([value, label]) => ({
    label: String(label),
    value
  }))
})

// 模型选项
const modelOptions = computed(() => {
  const provider = apiForm.provider
  const models = settingsStore.availableModels
  return Object.entries(models).map(([value, label]) => ({
    label: String(label),
    value
  }))
})

// 加载模型状态
const loadingModels = ref(false)

// 界面表单数据
const uiForm = reactive({
  theme: settingsStore.theme,
  sidebarCollapsed: settingsStore.sidebarCollapsed,
  animations: true,
  fontSize: 'medium'
})

// 字体大小选项
const fontSizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
  { label: '特大', value: 'xlarge' }
]

// 快捷键表格列
const shortcutColumns: DataTableColumns = [
  {
    title: '功能',
    key: 'function',
    width: 200
  },
  {
    title: '快捷键',
    key: 'shortcut',
    render(row) {
      return h('div', { class: 'shortcut-keys' }, [
        h('kbd', row.shortcut.windows),
        h('span', { style: 'margin: 0 8px; color: var(--color-text-tertiary);' }, '/'),
        h('kbd', row.shortcut.mac)
      ])
    }
  },
  {
    title: '描述',
    key: 'description'
  }
]

// 快捷键数据
const shortcutData = ref([
  {
    function: '新建对话',
    shortcut: { windows: 'Ctrl + N', mac: '⌘ + N' },
    description: '创建新的聊天对话'
  },
  {
    function: '保存对话',
    shortcut: { windows: 'Ctrl + S', mac: '⌘ + S' },
    description: '保存当前对话'
  },
  {
    function: '发送消息',
    shortcut: { windows: 'Ctrl + Enter', mac: '⌘ + ↵' },
    description: '发送当前输入的消息'
  },
  {
    function: '取消生成',
    shortcut: { windows: 'Esc', mac: 'Esc' },
    description: '取消AI正在生成的内容'
  },
  {
    function: '打开设置',
    shortcut: { windows: 'Ctrl + ,', mac: '⌘ + ,' },
    description: '打开设置面板'
  }
])

// 状态
const testingConnection = ref(false)
const savingSettings = ref(false)

// 格式化温度显示
function formatTemperature(value: number) {
  return `温度: ${value.toFixed(1)}`
}

// 服务提供商变更
function onProviderChange(value: string) {
  console.log('服务提供商变更:', value)
  // 这里可以添加加载模型列表的逻辑
}

// 测试连接
async function testConnection() {
  testingConnection.value = true
  try {
    // 模拟API测试
    await new Promise(resolve => setTimeout(resolve, 1500))
    message.success('连接测试成功！')
  } catch (error) {
    message.error('连接测试失败，请检查配置')
  } finally {
    testingConnection.value = false
  }
}

// 保存API设置
async function saveApiSettings() {
  savingSettings.value = true
  try {
    // 更新存储
    settingsStore.apiProvider = apiForm.provider
    settingsStore.apiKey = apiForm.apiKey
    settingsStore.model = apiForm.model
    settingsStore.temperature = apiForm.temperature
    settingsStore.maxTokens = apiForm.maxTokens
    settingsStore.deepThinking = apiForm.deepThinking
    settingsStore.webSearch = apiForm.webSearch

    await new Promise(resolve => setTimeout(resolve, 1000))
    message.success('API设置保存成功！')
  } catch (error) {
    message.error('保存失败，请重试')
  } finally {
    savingSettings.value = false
  }
}

// 重置API表单
function resetApiForm() {
  Object.assign(apiForm, {
    provider: settingsStore.apiProvider,
    apiKey: settingsStore.apiKey,
    model: settingsStore.model,
    temperature: settingsStore.temperature,
    maxTokens: settingsStore.maxTokens,
    deepThinking: settingsStore.deepThinking,
    webSearch: settingsStore.webSearch
  })
  message.info('表单已重置为当前设置')
}

// 保存界面设置
function saveUiSettings() {
  settingsStore.theme = uiForm.theme
  settingsStore.sidebarCollapsed = uiForm.sidebarCollapsed
  message.success('界面设置保存成功！')
}

// 重置界面表单
function resetUiForm() {
  Object.assign(uiForm, {
    theme: settingsStore.theme,
    sidebarCollapsed: settingsStore.sidebarCollapsed,
    animations: true,
    fontSize: 'medium'
  })
  message.info('界面设置已重置')
}
</script>

<style scoped>
.enhanced-settings {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.settings-tabs {
  margin-top: 20px;
}

.shortcut-keys {
  display: flex;
  align-items: center;
}

.shortcut-keys kbd {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-family: monospace;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-primary);
}
</style>