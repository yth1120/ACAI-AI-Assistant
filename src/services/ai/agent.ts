/**
 * 文档 Agent 服务模块
 * 提供智能文档生成、结构化内容输出、Word 文档导出等功能
 */

import { aiService } from './index'
import { documentParser } from './documentParser'
import type { ParsedDocument } from './documentParser'

// ============ 类型定义 ============

/** 文档段落 */
export interface DocumentParagraph {
  content: string
  style?: 'normal' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'quote'
}

/** 文档章节 */
export interface DocumentSection {
  title: string
  paragraphs: string[]
}

/** 文档配置 */
export interface DocumentConfig {
  fileName: string
  title: string
  subtitle?: string
  author?: string
  date?: string
  sections: DocumentSection[]
}

/** 补全结果项 */
export interface CompletionItem {
  placeholderId: string
  originalContent: string
  completedContent: string
}

/** 补全响应 */
export interface CompletionResponse {
  completions: CompletionItem[]
}

/** Agent 任务类型 */
export type AgentTaskType =
  | 'document'      // 文档生成
  | 'report'        // 报告撰写
  | 'proposal'      // 方案策划
  | 'analysis'      // 分析报告
  | 'summary'       // 总结文档
  | 'complete'      // 文档补全
  | 'custom'        // 自定义

/** Agent 任务状态 */
export type AgentTaskStatus = 'idle' | 'planning' | 'generating' | 'completed' | 'error'

/** Agent 任务 */
export interface AgentTask {
  id: string
  type: AgentTaskType
  requirement: string
  status: AgentTaskStatus
  result?: DocumentConfig
  error?: string
  createdAt: number
  completedAt?: number
}

/** Agent 任务选项 */
export interface AgentTaskOption {
  id: AgentTaskType
  label: string
  icon: string
  description: string
  promptTemplate: string
}

// ============ 常量定义 ============

/** 任务类型选项 */
export const AGENT_TASK_OPTIONS: AgentTaskOption[] = [
  {
    id: 'document',
    label: '文档生成',
    icon: 'fa-solid fa-file-word',
    description: '根据需求生成结构化文档',
    promptTemplate: `你是一位顶级的商业与技术文档架构师。请根据用户的需求，生成一份结构严谨、内容详实的文档。

要求：
1. 输出严格的 JSON 格式
2. 包含 fileName（文件名，仅含中英文数字下划线）、title（标题）、sections（章节数组）
3. 每个 section 包含 title（章节标题）和 paragraphs（段落数组，每个段落独立）
4. 章节至少 3-5 个，内容充实专业
5. 段落要切分为独立元素，不要塞在一起

用户需求：{requirement}

请直接输出 JSON，不要包含其他内容：`
  },
  {
    id: 'complete',
    label: '文档补全',
    icon: 'fa-solid fa-file-circle-plus',
    description: '上传文档模板，AI 自动填充内容',
    promptTemplate: ''
  },
  {
    id: 'report',
    label: '报告撰写',
    icon: 'fa-solid fa-chart-bar',
    description: '生成专业的分析报告',
    promptTemplate: `你是一位专业的报告撰写专家。请根据用户需求，生成一份结构清晰、数据详实的专业报告。

要求：
1. 输出严格的 JSON 格式
2. 包含 fileName（文件名）、title（标题）、sections（章节数组）
3. 包含背景分析、现状评估、问题诊断、建议方案、总结展望等章节
4. 每个 section 的 paragraphs 要切分为独立段落
5. 内容要专业、有深度

用户需求：{requirement}

请直接输出 JSON：`
  },
  {
    id: 'proposal',
    label: '方案策划',
    icon: 'fa-solid fa-lightbulb',
    description: '制定详细的实施方案',
    promptTemplate: `你是一位资深的方案策划专家。请根据用户需求，制定一份完整、可执行的实施方案。

要求：
1. 输出严格的 JSON 格式
2. 包含 fileName（文件名）、title（标题）、sections（章节数组）
3. 包含项目背景、目标设定、实施路径、资源规划、风险控制、预期成果等章节
4. 每个 section 的 paragraphs 要切分为独立段落
5. 方案要具体、可操作

用户需求：{requirement}

请直接输出 JSON：`
  },
  {
    id: 'analysis',
    label: '分析报告',
    icon: 'fa-solid fa-magnifying-glass-chart',
    description: '深度分析与研究',
    promptTemplate: `你是一位专业的分析研究员。请根据用户需求，生成一份深入、全面的分析报告。

要求：
1. 输出严格的 JSON 格式
2. 包含 fileName（文件名）、title（标题）、sections（章节数组）
3. 包含研究背景、方法论、数据分析、核心发现、结论建议等章节
4. 每个 section 的 paragraphs 要切分为独立段落
5. 分析要深入、逻辑严密

用户需求：{requirement}

请直接输出 JSON：`
  },
  {
    id: 'summary',
    label: '总结文档',
    icon: 'fa-solid fa-clipboard-list',
    description: '生成工作总结与汇报',
    promptTemplate: `你是一位高效的文档撰写助手。请根据用户需求，生成一份条理清晰的总结文档。

要求：
1. 输出严格的 JSON 格式
2. 包含 fileName（文件名）、title（标题）、sections（章节数组）
3. 包含工作概述、完成情况、亮点成果、问题反思、下一步计划等章节
4. 每个 section 的 paragraphs 要切分为独立段落
5. 总结要精炼、重点突出

用户需求：{requirement}

请直接输出 JSON：`
  },
  {
    id: 'custom',
    label: '自定义',
    icon: 'fa-solid fa-wand-magic-sparkles',
    description: '自由描述文档需求',
    promptTemplate: `你是一位顶级的文档架构师。请根据用户的描述，智能理解需求并生成合适的文档结构。

要求：
1. 输出严格的 JSON 格式
2. 包含 fileName（文件名）、title（标题）、sections（章节数组）
3. 根据需求智能设计章节结构（3-5个章节）
4. 每个 section 包含 title 和 paragraphs（段落数组）
5. 段落要切分为独立元素，内容专业充实

用户需求：{requirement}

请直接输出 JSON：`
  }
]

// ============ 服务类 ============

/**
 * Agent 文档服务类
 */
export class AgentService {
  private static instance: AgentService | null = null

  private constructor() {}

  static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService()
    }
    return AgentService.instance
  }

  /**
   * 获取任务类型配置
   */
  getTaskOption(type: AgentTaskType): AgentTaskOption | undefined {
    return AGENT_TASK_OPTIONS.find(opt => opt.id === type)
  }

  /**
   * 构建提示词
   */
  buildPrompt(type: AgentTaskType, requirement: string): string {
    const option = this.getTaskOption(type)
    if (!option) {
      throw new Error(`未知的任务类型：${type}`)
    }
    return option.promptTemplate.replace('{requirement}', requirement)
  }

  /**
   * 执行 Agent 任务
   * @param type 任务类型
   * @param requirement 用户需求
   * @param onChunk 流式输出回调
   * @returns 文档配置
   */
  async executeTask(
    type: AgentTaskType,
    requirement: string,
    onChunk?: ((chunk: string, count: number) => void) | null
  ): Promise<DocumentConfig> {
    const prompt = this.buildPrompt(type, requirement)

    let fullResponse = ''

    await aiService.sendMessage(
      [{ role: 'user', content: prompt }],
      (chunk: string, count?: number) => {
        fullResponse += chunk
        if (onChunk && count !== undefined) {
          onChunk(chunk, count)
        }
      }
    )

    // 解析 JSON 响应
    return this.parseResponse(fullResponse)
  }

  /**
   * 补全文档内容
   * @param file 上传的文档文件
   * @param instruction 用户的补全指令
   * @param onChunk 流式输出回调
   * @returns 补全后的文档配置
   */
  async completeDocument(
    file: File,
    instruction: string,
    onChunk?: ((chunk: string, count: number) => void) | null
  ): Promise<DocumentConfig> {
    // 解析上传的文档
    const parsedDoc = await documentParser.parseFile(file)

    // 检测是否有占位符
    const placeholders = documentParser.extractPlaceholders(parsedDoc.paragraphs)

    let prompt: string

    if (placeholders.length > 0) {
      // 有占位符，使用占位符补全模式
      prompt = documentParser.buildCompletionPrompt(parsedDoc, instruction)
    } else {
      // 没有占位符，使用完整文档生成模式
      prompt = documentParser.buildFullDocumentPrompt(parsedDoc, instruction)
    }

    let fullResponse = ''

    await aiService.sendMessage(
      [{ role: 'user', content: prompt }],
      (chunk: string, count?: number) => {
        fullResponse += chunk
        if (onChunk && count !== undefined) {
          onChunk(chunk, count)
        }
      }
    )

    // 解析响应
    if (placeholders.length > 0) {
      // 解析补全结果并合并到原文
      return this.parseCompletionResponse(fullResponse, parsedDoc)
    } else {
      // 解析完整文档响应
      return this.parseResponse(fullResponse)
    }
  }

  /**
   * 解析补全响应并合并到原文
   */
  private parseCompletionResponse(response: string, originalDoc: ParsedDocument): DocumentConfig {
    try {
      let jsonStr = response.trim()

      // 处理 markdown 代码块
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim()
      }

      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      }

      const parsed = JSON.parse(jsonStr) as CompletionResponse

      if (!parsed.completions || !Array.isArray(parsed.completions)) {
        throw new Error('补全响应格式不正确')
      }

      // 合并补全结果到原文
      const completedParagraphs = originalDoc.paragraphs.map(para => {
        const completion = parsed.completions.find(c => c.placeholderId === para.id)
        if (completion) {
          return {
            ...para,
            content: completion.completedContent,
            isPlaceholder: false,
            type: 'paragraph' as const
          }
        }
        return para
      })

      // 转换为 DocumentConfig 格式
      const sections: DocumentSection[] = []
      let currentSection: DocumentSection = {
        title: '正文',
        paragraphs: []
      }

      completedParagraphs.forEach(para => {
        if (para.type === 'heading') {
          if (currentSection.paragraphs.length > 0) {
            sections.push(currentSection)
          }
          currentSection = {
            title: para.content,
            paragraphs: []
          }
        } else {
          currentSection.paragraphs.push(para.content)
        }
      })

      if (currentSection.paragraphs.length > 0) {
        sections.push(currentSection)
      }

      return {
        fileName: originalDoc.fileName.replace(/\.(docx?|DOCX?)$/, '_completed'),
        title: originalDoc.title,
        sections
      }
    } catch (err) {
      console.error('解析补全响应失败:', err)
      throw new Error(`解析补全响应失败：${(err as Error).message}`)
    }
  }

  /**
   * 解析 AI 响应
   */
  parseResponse(response: string): DocumentConfig {
    try {
      // 尝试提取 JSON 内容
      let jsonStr = response.trim()

      // 处理 markdown 代码块
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim()
      }

      // 尝试找到 JSON 对象
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      }

      const parsed = JSON.parse(jsonStr) as DocumentConfig

      // 验证必要字段
      if (!parsed.fileName || !parsed.title || !parsed.sections) {
        throw new Error('响应格式不正确：缺少必要字段')
      }

      // 确保 sections 是数组
      if (!Array.isArray(parsed.sections)) {
        throw new Error('sections 必须是数组')
      }

      // 确保每个 section 都有 paragraphs
      parsed.sections.forEach((section, index) => {
        if (!section.title) {
          section.title = `章节 ${index + 1}`
        }
        if (!Array.isArray(section.paragraphs)) {
          section.paragraphs = []
        }
      })

      return parsed
    } catch (err) {
      console.error('解析响应失败:', err)
      console.error('原始响应:', response)
      throw new Error(`解析 AI 响应失败：${(err as Error).message}`)
    }
  }

  /**
   * 生成 Word 文档（HTML 格式，可直接下载为 .doc）
   * @param config 文档配置
   * @returns HTML 内容
   */
  generateWordDocument(config: DocumentConfig): string {
    const sectionsHtml = config.sections.map(section => {
      const paragraphsHtml = section.paragraphs
        .map(p => `<p style="text-indent: 2em; margin: 8px 0; line-height: 1.8;">${this.escapeHtml(p)}</p>`)
        .join('\n')

      return `
        <h2 style="font-size: 16pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px; color: #1a1a1a;">
          ${this.escapeHtml(section.title)}
        </h2>
        ${paragraphsHtml}
      `
    }).join('\n')

    const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="ACAI Assistant">
  <meta name="Originator" content="ACAI Assistant">
  <title>${this.escapeHtml(config.title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <o:DocumentProperties>
      <o:Title>${this.escapeHtml(config.title)}</o:Title>
      ${config.author ? `<o:Author>${this.escapeHtml(config.author)}</o:Author>` : ''}
      ${config.date ? `<o:LastSaved>${this.escapeHtml(config.date)}</o:LastSaved>` : ''}
    </o:DocumentProperties>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4;
      margin: 2.54cm 3.18cm 2.54cm 3.18cm;
    }
    body {
      font-family: "SimSun", "宋体", "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #000000;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      font-size: 22pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 8px;
      color: #1a1a1a;
    }
    .subtitle {
      font-size: 14pt;
      text-align: center;
      color: #666666;
      margin-bottom: 24px;
    }
    .meta-info {
      text-align: center;
      font-size: 10.5pt;
      color: #999999;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    h2 {
      font-size: 16pt;
      font-weight: bold;
      margin-top: 28px;
      margin-bottom: 12px;
      color: #1a1a1a;
      page-break-after: avoid;
    }
    p {
      text-indent: 2em;
      margin: 10px 0;
      line-height: 1.8;
      text-align: justify;
    }
    .separator {
      border: none;
      border-top: 2px solid #e0e0e0;
      margin: 32px 0;
    }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(config.title)}</h1>
  ${config.subtitle ? `<div class="subtitle">${this.escapeHtml(config.subtitle)}</div>` : ''}
  <div class="meta-info">
    ${config.author ? `<span>作者：${this.escapeHtml(config.author)}</span>` : ''}
    ${config.author && config.date ? '<span> | </span>' : ''}
    ${config.date ? `<span>日期：${this.escapeHtml(config.date)}</span>` : ''}
  </div>
  <hr class="separator">
  ${sectionsHtml}
</body>
</html>`

    return html
  }

  /**
   * HTML 转义
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }

  /**
   * 下载文档
   * @param config 文档配置
   */
  downloadDocument(config: DocumentConfig): void {
    const html = this.generateWordDocument(config)
    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${config.fileName}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 生成任务 ID
   */
  generateTaskId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}

// 导出单例
export const agentService = AgentService.getInstance()
