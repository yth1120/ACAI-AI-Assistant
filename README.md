# ACAI - 私人AI助手

一款功能强大的桌面AI助手应用，支持多种AI服务提供商，提供智能对话、代码辅助、文本翻译、内容分析等多种功能。

## 功能特性

- **智能对话** - 与AI进行自然语言对话
- **代码助手** - 代码生成、解释、调试和优化
- **文本翻译** - 多语言互译
- **内容分析** - 文本分析和总结
- **智能写作** - 辅助写作和文本润色
- **Agent模式** - 支持多步骤任务执行
- **联网搜索** - 集成DuckDuckGo搜索功能

## 技术栈

- **前端**: Vue 3 + TypeScript + Naive UI
- **后端**: Electron
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router

## 支持的AI提供商

- DeepSeek
- OpenAI
- Claude (Anthropic)
- 其他兼容OpenAI API的服务

## 系统要求

- Windows 10/11 (64位)
- macOS 10.15+
- Linux (Ubuntu 20.04+)

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run dev
```

### 构建应用

**Windows:**
```bash
npm run build-win
```

**macOS:**
```bash
npm run build-mac
```

**Linux:**
```bash
npm run build-linux
```

### 测试

```bash
npm run test
```

## 项目结构

```
acai-assistant/
├── src/
│   ├── components/     # 通用组件
│   ├── views/          # 页面视图
│   ├── services/       # API服务
│   ├── stores/         # 状态管理
│   ├── router/         # 路由配置
│   ├── utils/          # 工具函数
│   └── types/          # TypeScript类型定义
├── main.ts             # Electron主进程
├── preload.ts          # 预加载脚本
├── assets/             # 静态资源
└── electron-builder.config.js  # 打包配置
```

## 配置说明

复制 `.env.example` 为 `.env.local` 并根据需要修改配置：

```bash
cp .env.example .env.local
```

主要配置项：
- `VITE_APP_TITLE` - 应用标题
- `VITE_DEV_SERVER_PORT` - 开发服务器端口
- `VITE_ELECTRON_WINDOW_WIDTH` - 窗口宽度
- `VITE_ELECTRON_WINDOW_HEIGHT` - 窗口高度

## License

MIT
