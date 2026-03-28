<template>
  <div class="naive-ui-demo">
    <!-- 卡片组件 -->
    <n-card title="Naive UI 组件示例" size="small">
      <template #header-extra>
        <n-button quaternary circle size="small">
          <template #icon>
            <n-icon>
              <i class="fas fa-cog" />
            </n-icon>
          </template>
        </n-button>
      </template>

      <!-- 表单组件 -->
      <n-form ref="formRef" :model="formData" :rules="rules">
        <n-form-item label="用户名" path="username">
          <n-input
            v-model:value="formData.username"
            placeholder="请输入用户名"
            clearable
          />
        </n-form-item>

        <n-form-item label="邮箱" path="email">
          <n-input
            v-model:value="formData.email"
            placeholder="请输入邮箱"
            clearable
          />
        </n-form-item>

        <n-form-item label="角色" path="role">
          <n-select
            v-model:value="formData.role"
            :options="roleOptions"
            placeholder="请选择角色"
          />
        </n-form-item>

        <n-form-item label="通知" path="notifications">
          <n-checkbox-group v-model:value="formData.notifications">
            <n-space>
              <n-checkbox value="email">邮件通知</n-checkbox>
              <n-checkbox value="sms">短信通知</n-checkbox>
              <n-checkbox value="push">推送通知</n-checkbox>
            </n-space>
          </n-checkbox-group>
        </n-form-item>

        <n-form-item label="主题" path="theme">
          <n-radio-group v-model:value="formData.theme">
            <n-space>
              <n-radio value="light">浅色主题</n-radio>
              <n-radio value="dark">深色主题</n-radio>
              <n-radio value="auto">自动</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入描述"
            :rows="3"
            show-count
            :maxlength="200"
          />
        </n-form-item>
      </n-form>

      <!-- 按钮组 -->
      <n-space justify="end">
        <n-button @click="handleReset">
          重置
        </n-button>
        <n-button type="primary" :loading="submitting" @click="handleSubmit">
          提交
        </n-button>
      </n-space>
    </n-card>

    <!-- 数据表格 -->
    <n-card title="用户列表" class="mt-4">
      <n-data-table
        :columns="columns"
        :data="userData"
        :pagination="pagination"
        :bordered="false"
      />
    </n-card>

    <!-- 消息提示 -->
    <n-card title="消息提示" class="mt-4">
      <n-space>
        <n-button @click="showSuccess">
          成功提示
        </n-button>
        <n-button @click="showError">
          错误提示
        </n-button>
        <n-button @click="showWarning">
          警告提示
        </n-button>
        <n-button @click="showInfo">
          信息提示
        </n-button>
        <n-button @click="showLoading">
          加载提示
        </n-button>
      </n-space>
    </n-card>

    <!-- 模态框 -->
    <n-modal
      v-model:show="showModal"
      preset="dialog"
      title="确认操作"
      positive-text="确认"
      negative-text="取消"
      @positive-click="handleConfirm"
      @negative-click="handleCancel"
    >
      <template #icon>
        <n-icon color="#ff6b6b">
          <i class="fas fa-exclamation-triangle" />
        </n-icon>
      </template>
      确定要执行此操作吗？此操作不可撤销。
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h } from 'vue'
import {
  NButton,
  NIcon,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NCheckboxGroup,
  NCheckbox,
  NSpace,
  NRadioGroup,
  NRadio,
  NDataTable,
  NModal,
  useMessage,
  useNotification,
  useLoadingBar,
  type DataTableColumns
} from 'naive-ui'

// 消息提示
const message = useMessage()
const notification = useNotification()
const loadingBar = useLoadingBar()

// 表单数据
const formData = reactive({
  username: '',
  email: '',
  role: null,
  notifications: [],
  theme: 'light',
  description: ''
})

// 表单规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 角色选项
const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '编辑', value: 'editor' },
  { label: '查看者', value: 'viewer' },
  { label: '访客', value: 'guest' }
]

// 表格列定义
const columns: DataTableColumns = [
  {
    title: 'ID',
    key: 'id',
    width: 80
  },
  {
    title: '姓名',
    key: 'name',
    render(row) {
      return h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        h(NIcon, { size: 16 }, () => h('i', { class: 'fas fa-user' })),
        h('span', row.name)
      ])
    }
  },
  {
    title: '邮箱',
    key: 'email'
  },
  {
    title: '角色',
    key: 'role',
    render(row) {
      const roleMap: Record<string, string> = {
        admin: '管理员',
        editor: '编辑',
        viewer: '查看者',
        guest: '访客'
      }
      const typeMap: Record<string, string> = {
        admin: 'error',
        editor: 'warning',
        viewer: 'info',
        guest: 'default'
      }
      return h(NButton, {
        size: 'small',
        type: typeMap[row.role] as any,
        ghost: true
      }, { default: () => roleMap[row.role] })
    }
  },
  {
    title: '状态',
    key: 'status',
    render(row) {
      return h('div', { style: 'display: flex; align-items: center; gap: 4px;' }, [
        h('div', {
          style: `width: 8px; height: 8px; border-radius: 50%; background-color: ${row.status === 'active' ? '#52c41a' : '#ff4d4f'};`
        }),
        h('span', row.status === 'active' ? '活跃' : '禁用')
      ])
    }
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, {}, [
        h(NButton, {
          size: 'small',
          onClick: () => handleEdit(row)
        }, { default: () => '编辑' }),
        h(NButton, {
          size: 'small',
          type: 'error',
          ghost: true,
          onClick: () => handleDelete(row)
        }, { default: () => '删除' })
      ])
    }
  }
]

// 表格数据
const userData = ref([
  { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'admin', status: 'active' },
  { id: 2, name: '李四', email: 'lisi@example.com', role: 'editor', status: 'active' },
  { id: 3, name: '王五', email: 'wangwu@example.com', role: 'viewer', status: 'inactive' },
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', role: 'guest', status: 'active' }
])

// 分页配置
const pagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (page: number) => {
    pagination.page = page
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
  }
})

// 状态
const submitting = ref(false)
const showModal = ref(false)

// 表单提交
async function handleSubmit() {
  submitting.value = true
  loadingBar.start()

  // 模拟API请求
  setTimeout(() => {
    submitting.value = false
    loadingBar.finish()
    message.success('提交成功！')
    console.log('表单数据:', formData)
  }, 1500)
}

// 表单重置
function handleReset() {
  Object.assign(formData, {
    username: '',
    email: '',
    role: null,
    notifications: [],
    theme: 'light',
    description: ''
  })
  message.info('表单已重置')
}

// 消息提示方法
function showSuccess() {
  message.success('这是一个成功提示！')
}

function showError() {
  message.error('这是一个错误提示！')
}

function showWarning() {
  message.warning('这是一个警告提示！')
}

function showInfo() {
  message.info('这是一个信息提示！')
}

function showLoading() {
  const loading = message.loading('正在加载...', {
    duration: 3000
  })
  setTimeout(() => {
    loading.destroy()
    message.success('加载完成！')
  }, 3000)
}

// 表格操作
function handleEdit(row: any) {
  notification.info({
    title: '编辑用户',
    content: `正在编辑用户: ${row.name}`,
    duration: 2500
  })
}

function handleDelete(row: any) {
  showModal.value = true
  // 在实际应用中，这里会保存要删除的行数据
}

// 模态框操作
function handleConfirm() {
  message.success('操作已确认')
  showModal.value = false
}

function handleCancel() {
  message.info('操作已取消')
  showModal.value = false
}
</script>

<style scoped>
.naive-ui-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.mt-4 {
  margin-top: 16px;
}
</style>