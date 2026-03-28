/**
 * 导出功能工具函数
 */
import { formatDate } from './index'

/**
 * 消息类型
 */
export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string | number
}

/**
 * 聊天记录类型
 */
export interface ChatRecord {
  timestamp?: string | number
  messages: Message[]
}

/**
 * 导出数据结构
 */
export interface ExportData {
  exportDate: string
  version: string
  messageCount?: number
  totalChats?: number
  messages?: Message[]
  chats?: ChatRecord[]
}

/**
 * 导出格式类型
 */
export type ExportFormat = 'json' | 'markdown' | 'text' | 'html'

/**
 * 导出聊天记录为 JSON 文件
 * @param messages - 消息数组
 * @param fileName - 文件名（可选）
 */
export function exportChatAsJSON(messages: Message[], fileName?: string): void {
  const defaultFileName = `chat-export-${formatDate(new Date(), 'YYYY-MM-DD-HHmmss')}.json`
  const finalFileName = fileName || defaultFileName

  const data: ExportData = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    messageCount: messages.length,
    messages: messages,
  }

  const jsonString = JSON.stringify(data, null, 2)
  downloadFile(jsonString, finalFileName, 'application/json')
}

/**
 * 导出聊天记录为 Markdown 文件
 * @param messages - 消息数组
 * @param fileName - 文件名（可选）
 */
export function exportChatAsMarkdown(messages: Message[], fileName?: string): void {
  const defaultFileName = `chat-export-${formatDate(new Date(), 'YYYY-MM-DD-HHmmss')}.md`
  const finalFileName = fileName || defaultFileName

  let markdown = `# ACAI 聊天记录导出\n\n`
  markdown += `**导出时间**: ${formatDate(new Date())}\n\n`
  markdown += `**消息数量**: ${messages.length}\n\n`
  markdown += `---\n\n`

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? '👤 用户' : '🤖 AI 助手'
    const timestamp = msg.timestamp ? formatDate(msg.timestamp) : ''

    markdown += `## ${role}\n\n`
    if (timestamp) {
      markdown += `*${timestamp}*\n\n`
    }
    markdown += `${msg.content}\n\n`
    markdown += `---\n\n`
  })

  downloadFile(markdown, finalFileName, 'text/markdown')
}

/**
 * 导出聊天记录为纯文本文件
 * @param messages - 消息数组
 * @param fileName - 文件名（可选）
 */
export function exportChatAsText(messages: Message[], fileName?: string): void {
  const defaultFileName = `chat-export-${formatDate(new Date(), 'YYYY-MM-DD-HHmmss')}.txt`
  const finalFileName = fileName || defaultFileName

  let text = `ACAI 聊天记录导出\n`
  text += `${'='.repeat(50)}\n\n`
  text += `导出时间：${formatDate(new Date())}\n`
  text += `消息数量：${messages.length}\n\n`
  text += `${'='.repeat(50)}\n\n`

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? '[用户]' : '[AI 助手]'
    const timestamp = msg.timestamp ? `[${formatDate(msg.timestamp)}]` : ''

    text += `${role} ${timestamp}\n`
    text += `${msg.content}\n\n`
    text += `${'-'.repeat(50)}\n\n`
  })

  downloadFile(text, finalFileName, 'text/plain')
}

/**
 * 导出聊天记录为 HTML 文件
 * @param messages - 消息数组
 * @param fileName - 文件名（可选）
 */
export function exportChatAsHTML(messages: Message[], fileName?: string): void {
  const defaultFileName = `chat-export-${formatDate(new Date(), 'YYYY-MM-DD-HHmmss')}.html`
  const finalFileName = fileName || defaultFileName

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ACAI 聊天记录</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e2e8f0;
    }
    .header h1 {
      color: #2d3748;
      margin-bottom: 0.5rem;
    }
    .meta {
      color: #718096;
      font-size: 0.9rem;
    }
    .message {
      margin-bottom: 1.5rem;
      padding: 1rem;
      border-radius: 8px;
    }
    .message.user {
      background: #ebf4ff;
      border-left: 4px solid #4299e1;
    }
    .message.assistant {
      background: #f7fafc;
      border-left: 4px solid #805ad5;
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .message.user .role { color: #2b6cb0; }
    .message.assistant .role { color: #6b46c1; }
    .timestamp {
      color: #a0aec0;
      font-size: 0.85rem;
      font-weight: 400;
    }
    .message-content {
      color: #2d3748;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 2px solid #e2e8f0;
      color: #718096;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 ACAI 聊天记录</h1>
      <div class="meta">
        <p>导出时间：${formatDate(new Date())}</p>
        <p>消息数量：${messages.length} 条</p>
      </div>
    </div>
    <div class="messages">
      ${messages
        .map(
          (msg) => `
        <div class="message ${msg.role}">
          <div class="message-header">
            <span class="role">${msg.role === 'user' ? '👤 用户' : '🤖 AI 助手'}</span>
            ${msg.timestamp ? `<span class="timestamp">${formatDate(msg.timestamp)}</span>` : ''}
          </div>
          <div class="message-content">${escapeHtml(msg.content)}</div>
        </div>
      `
        )
        .join('')}
    </div>
    <div class="footer">
      <p>由 ACAI - 私人 AI 助手 生成</p>
    </div>
  </div>
</body>
</html>
  `

  downloadFile(html, finalFileName, 'text/html')
}

/**
 * 导出所有聊天历史记录
 * @param chatHistory - 聊天历史数组
 * @param format - 导出格式 (json/markdown/text/html)
 */
export function exportAllChatHistory(chatHistory: ChatRecord[], format: ExportFormat = 'json'): void {
  const fileName = `all-chats-export-${formatDate(new Date(), 'YYYY-MM-DD-HHmmss')}`

  const data: ExportData = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    totalChats: chatHistory.length,
    chats: chatHistory,
  }

  switch (format) {
    case 'json': {
      const jsonString = JSON.stringify(data, null, 2)
      downloadFile(jsonString, `${fileName}.json`, 'application/json')
      break
    }
    case 'markdown': {
      let markdown = `# ACAI 所有聊天记录\n\n`
      markdown += `**导出时间**: ${formatDate(new Date())}\n\n`
      markdown += `**聊天数量**: ${chatHistory.length}\n\n`
      markdown += `---\n\n`

      chatHistory.forEach((chat, index) => {
        markdown += `## 对话 ${index + 1}\n\n`
        markdown += `**时间**: ${chat.timestamp ? formatDate(chat.timestamp) : '未知'}\n\n`
        markdown += `**消息数**: ${chat.messages?.length || 0}\n\n`

        if (chat.messages) {
          chat.messages.forEach((msg) => {
            markdown += `### ${msg.role === 'user' ? '👤 用户' : '🤖 AI'}\n\n`
            markdown += `${msg.content}\n\n`
          })
        }
        markdown += `---\n\n`
      })

      downloadFile(markdown, `${fileName}.md`, 'text/markdown')
      break
    }
    default:
      downloadFile(JSON.stringify(data, null, 2), `${fileName}.json`, 'application/json')
  }
}

/**
 * 下载文件
 * @param content - 文件内容
 * @param fileName - 文件名
 * @param mimeType - MIME 类型
 */
function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 转义 HTML 特殊字符
 * @param text - 要转义的文本
 * @returns 转义后的文本
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 导入聊天记录
 * @param file - 文件对象
 * @returns 导入的数据
 */
export function importChatHistory(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('未选择文件'))
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content) as ExportData

        // 验证数据格式
        if (!data.messages && !data.chats) {
          reject(new Error('无效的聊天记录格式'))
          return
        }

        resolve(data)
      } catch (error) {
        reject(new Error('解析文件失败：' + (error as Error).message))
      }
    }

    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }

    reader.readAsText(file)
  })
}
