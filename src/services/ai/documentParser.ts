/**
 * 文档解析服务
 * 支持解析 Word 文档（.docx），提取结构化内容
 */

import mammoth from 'mammoth'

// ============ 类型定义 ============

/** 解析后的文档段落 */
export interface ParsedParagraph {
  id: string
  content: string
  level: number        // 标题层级，0 表示正文
  type: 'heading' | 'paragraph' | 'list' | 'placeholder'
  isPlaceholder: boolean  // 是否为待填充的占位符
}

/** 解析后的文档结构 */
export interface ParsedDocument {
  fileName: string
  title: string
  paragraphs: ParsedParagraph[]
  rawHtml: string
  rawText: string
  placeholderCount: number
  wordCount: number
}

/** 占位符模式 */
export type PlaceholderPattern =
  | 'bracket'       // 【待填写】、【xxx】
  | 'underscore'    // ____、______
  | 'ellipsis'      // ......、……
  | 'angle'         // <待填写>、<xxx>
  | 'curly'         // {待填写}、{xxx}
  | 'custom'        // 自定义正则

/** 占位符检测配置 */
export interface PlaceholderConfig {
  patterns: PlaceholderPattern[]
  customRegex?: string
  minLength?: number
}

// ============ 常量定义 ============

/** 默认占位符正则表达式 */
const PLACEHOLDER_REGEX: Record<PlaceholderPattern, RegExp> = {
  bracket: /【[^】]{1,50}】/g,
  underscore: /_{3,}/g,
  ellipsis: /(\.{3,}|…{1,})/g,
  angle: /<[^>]{1,50}>/g,
  curly: /\{[^}]{1,50}\}/g,
  custom: /(?:)/g
}

/** 默认检测配置 */
const DEFAULT_PLACEHOLDER_CONFIG: PlaceholderConfig = {
  patterns: ['bracket', 'underscore', 'ellipsis', 'angle', 'curly'],
  minLength: 3
}

// ============ 服务类 ============

/**
 * 文档解析服务类
 */
export class DocumentParserService {
  private static instance: DocumentParserService | null = null

  private constructor() {}

  static getInstance(): DocumentParserService {
    if (!DocumentParserService.instance) {
      DocumentParserService.instance = new DocumentParserService()
    }
    return DocumentParserService.instance
  }

  /**
   * 解析 Word 文档文件
   * @param file 上传的文件对象
   * @returns 解析后的文档结构
   */
  async parseFile(file: File): Promise<ParsedDocument> {
    // 验证文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
    const validExtensions = ['.docx', '.doc']

    const hasValidType = validTypes.includes(file.type)
    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    )

    if (!hasValidType && !hasValidExtension) {
      throw new Error('不支持的文件格式，请上传 .docx 或 .doc 文件')
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer()

    // 使用 mammoth 解析
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer })
    const textResult = await mammoth.extractRawText({ arrayBuffer })

    const rawHtml = htmlResult.value
    const rawText = textResult.value

    // 解析 HTML 结构
    const paragraphs = this.parseHtmlToParagraphs(rawHtml)

    // 检测占位符
    const placeholderCount = this.detectPlaceholders(paragraphs)

    // 提取标题
    const title = this.extractTitle(paragraphs, file.name)

    // 计算字数
    const wordCount = this.countWords(rawText)

    return {
      fileName: file.name,
      title,
      paragraphs,
      rawHtml,
      rawText,
      placeholderCount,
      wordCount
    }
  }

  /**
   * 从 ArrayBuffer 解析文档
   */
  async parseArrayBuffer(arrayBuffer: ArrayBuffer, fileName: string): Promise<ParsedDocument> {
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer })
    const textResult = await mammoth.extractRawText({ arrayBuffer })

    const rawHtml = htmlResult.value
    const rawText = textResult.value

    const paragraphs = this.parseHtmlToParagraphs(rawHtml)
    const placeholderCount = this.detectPlaceholders(paragraphs)
    const title = this.extractTitle(paragraphs, fileName)
    const wordCount = this.countWords(rawText)

    return {
      fileName,
      title,
      paragraphs,
      rawHtml,
      rawText,
      placeholderCount,
      wordCount
    }
  }

  /**
   * 解析 HTML 为段落结构
   */
  private parseHtmlToParagraphs(html: string): ParsedParagraph[] {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const elements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li')
    const paragraphs: ParsedParagraph[] = []
    let id = 0

    elements.forEach(el => {
      const content = el.textContent?.trim() || ''
      if (!content) return

      let level = 0
      let type: ParsedParagraph['type'] = 'paragraph'

      // 判断标题层级
      const tagName = el.tagName.toLowerCase()
      if (tagName.startsWith('h')) {
        level = parseInt(tagName.charAt(1)) || 1
        type = 'heading'
      } else if (tagName === 'li') {
        type = 'list'
      }

      // 检测是否为占位符
      const isPlaceholder = this.isPlaceholderContent(content)

      if (isPlaceholder) {
        type = 'placeholder'
      }

      paragraphs.push({
        id: `para_${id++}`,
        content,
        level,
        type,
        isPlaceholder
      })
    })

    return paragraphs
  }

  /**
   * 检测内容是否为占位符
   */
  private isPlaceholderContent(content: string, config?: PlaceholderConfig): boolean {
    const cfg = { ...DEFAULT_PLACEHOLDER_CONFIG, ...config }

    for (const pattern of cfg.patterns) {
      const regex = PLACEHOLDER_REGEX[pattern]
      if (regex && regex.test(content)) {
        return true
      }
    }

    // 自定义正则检测
    if (cfg.customRegex) {
      try {
        const customRegex = new RegExp(cfg.customRegex, 'g')
        if (customRegex.test(content)) {
          return true
        }
      } catch {
        console.warn('无效的自定义正则表达式')
      }
    }

    return false
  }

  /**
   * 检测所有段落中的占位符
   */
  private detectPlaceholders(paragraphs: ParsedParagraph[]): number {
    let count = 0
    paragraphs.forEach(p => {
      if (p.isPlaceholder) {
        count++
      }
    })
    return count
  }

  /**
   * 提取文档标题
   */
  private extractTitle(paragraphs: ParsedParagraph[], fileName: string): string {
    // 优先从 H1 标题获取
    const h1 = paragraphs.find(p => p.type === 'heading' && p.level === 1)
    if (h1) return h1.content

    // 其次从 H2 获取
    const h2 = paragraphs.find(p => p.type === 'heading' && p.level === 2)
    if (h2) return h2.content

    // 使用文件名
    return fileName.replace(/\.(docx?|DOCX?)$/, '')
  }

  /**
   * 统计字数
   */
  private countWords(text: string): number {
    // 中文按字计数，英文按空格分词
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0).length
    return chineseChars + englishWords
  }

  /**
   * 提取占位符内容
   */
  extractPlaceholders(paragraphs: ParsedParagraph[]): ParsedParagraph[] {
    return paragraphs.filter(p => p.isPlaceholder)
  }

  /**
   * 构建 AI 补全提示词
   * @param document 解析后的文档
   * @param userInstruction 用户的补全指令
   */
  buildCompletionPrompt(document: ParsedDocument, userInstruction: string): string {
    const placeholders = this.extractPlaceholders(document.paragraphs)

    const placeholderList = placeholders.map((p, i) => {
      return `${i + 1}. "${p.content}"`
    }).join('\n')

    const fullContent = document.paragraphs.map(p => {
      const prefix = p.type === 'heading' ? '#'.repeat(p.level) + ' ' : ''
      return prefix + p.content
    }).join('\n')

    return `你是一位专业的文档撰写助手。用户上传了一份文档模板，其中包含多个待填充的占位符。

用户的补全指令：${userInstruction}

文档标题：${document.title}

检测到的待填充位置（共 ${placeholders.length} 处）：
${placeholderList}

完整文档内容：
${fullContent}

请根据用户的指令，为每个待填充位置生成合适的内容。要求：
1. 输出严格的 JSON 格式
2. JSON 结构：{ "completions": [{ "placeholderId": "段落ID", "originalContent": "原文", "completedContent": "补全后内容" }] }
3. 补全内容要专业、准确、符合文档整体风格
4. 保持与上下文的连贯性
5. 如果原文是标题占位符，补全后也应该是标题格式

请直接输出 JSON：`
  }

  /**
   * 构建完整文档生成提示词
   * @param document 解析后的文档
   * @param userInstruction 用户指令
   */
  buildFullDocumentPrompt(document: ParsedDocument, userInstruction: string): string {
    const structure = document.paragraphs.map(p => {
      const indent = '  '.repeat(p.level)
      const marker = p.type === 'heading' ? '📌' : (p.isPlaceholder ? '❓' : '📄')
      return `${indent}${marker} [${p.type}] ${p.content}`
    }).join('\n')

    return `你是一位顶级的文档架构师。用户上传了一份文档模板，需要你根据模板结构和用户的指令，生成完整的文档内容。

用户的指令：${userInstruction}

文档模板：${document.fileName}
模板结构：
${structure}

模板原文：
${document.rawText}

请根据模板结构和用户指令，生成一份完整、专业的文档。要求：
1. 保持模板的结构和格式
2. 为每个占位符位置填充合适的内容
3. 如果某些段落内容不完整，请补充完善
4. 输出严格的 JSON 格式

JSON 结构：
{
  "fileName": "文件名（仅含中英文数字下划线）",
  "title": "文档标题",
  "sections": [
    {
      "title": "章节标题",
      "paragraphs": ["段落1", "段落2", ...]
    }
  ]
}

请直接输出 JSON：`
  }
}

// 导出单例
export const documentParser = DocumentParserService.getInstance()
