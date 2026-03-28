/**
 * 写作助手服务模块
 * 提供写作相关的 AI 功能：长文本写作、智能续写、文本润色、段落排版、错别字检查等
 */

import { aiService } from './index'

/**
 * 写作功能类型
 */
export type WritingFeature =
  | 'long-text'      // 长文本写作
  | 'continue'       // 智能续写
  | 'polish'         // 文本润色
  | 'format'         // 段落排版
  | 'spell-check'    // 错别字检查
  | 'expand'         // 内容扩写
  | 'summarize'      // 内容摘要
  | 'translate-style' // 风格转换

/**
 * 写作模板类型
 */
export type WritingTemplate =
  | 'free'           // 自由写作
  | 'essay'          // 文章随笔
  | 'report'         // 工作汇报
  | 'notice'         // 通知公告
  | 'composition'    // 作文写作
  | 'copywriting'    // 文案编辑
  | 'story'          // 故事创作
  | 'poetry'         // 诗歌创作

/**
 * 写作风格选项
 */
export interface WritingStyle {
  id: string
  label: string
  icon: string
  description: string
}

/**
 * 写作模板选项
 */
export interface WritingTemplateOption {
  id: WritingTemplate
  label: string
  icon: string
  prompt: string
}

/**
 * 写作功能选项
 */
export interface WritingFeatureOption {
  id: WritingFeature
  label: string
  icon: string
  description: string
}

/**
 * 写作风格定义
 */
export const WRITING_STYLES: WritingStyle[] = [
  { id: 'neutral', label: '中性', icon: 'fa-solid fa-font', description: '平实自然的写作风格' },
  { id: 'formal', label: '正式', icon: 'fa-solid fa-briefcase', description: '正式严谨的写作风格' },
  { id: 'casual', label: '随意', icon: 'fa-solid fa-comment', description: '轻松随意的写作风格' },
  { id: 'literary', label: '文学', icon: 'fa-solid fa-book', description: '富有文学性的写作风格' },
  { id: 'academic', label: '学术', icon: 'fa-solid fa-graduation-cap', description: '学术专业的写作风格' },
  { id: 'creative', label: '创意', icon: 'fa-solid fa-lightbulb', description: '富有创意的写作风格' },
  { id: 'humorous', label: '幽默', icon: 'fa-solid fa-face-laugh', description: '幽默风趣的写作风格' },
  { id: 'persuasive', label: '说服', icon: 'fa-solid fa-bullhorn', description: '具有说服力的写作风格' }
]

/**
 * 写作模板定义
 */
export const WRITING_TEMPLATES: WritingTemplateOption[] = [
  {
    id: 'free',
    label: '自由写作',
    icon: 'fa-solid fa-pen-nib',
    prompt: '请帮我继续写作以下内容，保持文风一致，自然流畅：\n\n{content}'
  },
  {
    id: 'essay',
    label: '文章随笔',
    icon: 'fa-solid fa-scroll',
    prompt: '请帮我撰写一篇文章随笔，主题为"{title}"。要求：观点清晰，文笔流畅，富有思考性。字数约{wordCount}字。\n\n参考内容：{content}'
  },
  {
    id: 'report',
    label: '工作汇报',
    icon: 'fa-solid fa-clipboard-list',
    prompt: '请帮我撰写一份工作汇报，主题为"{title}"。要求：结构清晰，重点突出，数据详实。包含工作完成情况、存在问题、下一步计划等部分。\n\n参考内容：{content}'
  },
  {
    id: 'notice',
    label: '通知公告',
    icon: 'fa-solid fa-bell',
    prompt: '请帮我撰写一份通知公告，主题为"{title}"。要求：格式规范，信息完整，语言简洁明了。\n\n参考内容：{content}'
  },
  {
    id: 'composition',
    label: '作文写作',
    icon: 'fa-solid fa-book-open',
    prompt: '请帮我写一篇作文，题目为"{title}"。要求：立意明确，结构完整，语言生动，字数约{wordCount}字。\n\n参考内容：{content}'
  },
  {
    id: 'copywriting',
    label: '文案编辑',
    icon: 'fa-solid fa-pen-fancy',
    prompt: '请帮我撰写一份文案，主题为"{title}"。要求：吸引眼球，突出卖点，有感染力，适合{target}阅读。\n\n参考内容：{content}'
  },
  {
    id: 'story',
    label: '故事创作',
    icon: 'fa-solid fa-book-journal-whills',
    prompt: '请帮我创作一个故事，主题为"{title}"。要求：情节生动，人物鲜明，有起承转合。字数约{wordCount}字。\n\n参考内容：{content}'
  },
  {
    id: 'poetry',
    label: '诗歌创作',
    icon: 'fa-solid fa-feather',
    prompt: '请帮我创作一首诗歌，主题为"{title}"。要求：意境优美，韵律和谐，富有诗意。\n\n参考内容：{content}'
  }
]

/**
 * 写作功能定义
 */
export const WRITING_FEATURES: WritingFeatureOption[] = [
  {
    id: 'long-text',
    label: '长文本写作',
    icon: 'fa-solid fa-scroll',
    description: '支持长篇内容的创作和编辑'
  },
  {
    id: 'continue',
    label: '智能续写',
    icon: 'fa-solid fa-wand-magic-sparkles',
    description: '根据已有内容智能续写'
  },
  {
    id: 'polish',
    label: '文本润色',
    icon: 'fa-solid fa-pen-to-square',
    description: '优化文字表达，提升文采'
  },
  {
    id: 'format',
    label: '段落排版',
    icon: 'fa-solid fa-list-ol',
    description: '整理段落结构，优化排版'
  },
  {
    id: 'spell-check',
    label: '错别字检查',
    icon: 'fa-solid fa-spell-check',
    description: '检查并纠正错别字和语病'
  },
  {
    id: 'expand',
    label: '内容扩写',
    icon: 'fa-solid fa-expand',
    description: '扩展内容，增加细节'
  },
  {
    id: 'summarize',
    label: '内容摘要',
    icon: 'fa-solid fa-compress',
    description: '提取核心内容，生成摘要'
  },
  {
    id: 'translate-style',
    label: '风格转换',
    icon: 'fa-solid fa-palette',
    description: '转换文本的写作风格'
  }
]

/**
 * 写作提示词模板
 */
export const WRITING_PROMPT_TEMPLATES: Record<WritingFeature, string> = {
  'long-text': '请帮我撰写以下内容，要求：结构清晰，逻辑严密，文笔流畅，内容充实。\n\n主题：{title}\n要求：{requirements}\n\n参考内容：{content}',
  'continue': '请根据以下内容的文风和逻辑，自然地继续写作，保持连贯性和一致性：\n\n{content}',
  'polish': '请对以下文本进行润色，优化表达方式，提升文采，但不要改变原意：\n\n{content}',
  'format': '请对以下文本进行排版整理，合理分段，添加必要的标题和序号，使其结构更清晰：\n\n{content}',
  'spell-check': '请检查以下文本中的错别字、语病和标点错误，并给出修改建议：\n\n{content}',
  'expand': '请对以下内容进行扩展，增加更多细节、例子和论述，使内容更充实：\n\n{content}',
  'summarize': '请对以下内容进行摘要，提取核心要点，用简洁的语言概括：\n\n{content}',
  'translate-style': '请将以下文本改写成{style}风格，保持原意但改变表达方式：\n\n{content}'
}

/**
 * 写作助手服务类
 */
export class WritingService {
  private static instance: WritingService | null = null

  private constructor() {}

  static getInstance(): WritingService {
    if (!WritingService.instance) {
      WritingService.instance = new WritingService()
    }
    return WritingService.instance
  }

  /**
   * 获取功能名称
   */
  getFeatureName(feature: WritingFeature): string {
    const featureOption = WRITING_FEATURES.find(f => f.id === feature)
    return featureOption?.label || feature
  }

  /**
   * 获取模板名称
   */
  getTemplateName(template: WritingTemplate): string {
    const templateOption = WRITING_TEMPLATES.find(t => t.id === template)
    return templateOption?.label || template
  }

  /**
   * 获取风格名称
   */
  getStyleName(styleId: string): string {
    const style = WRITING_STYLES.find(s => s.id === styleId)
    return style?.label || styleId
  }

  /**
   * 构建写作提示词
   */
  buildWritingPrompt(
    feature: WritingFeature,
    options: {
      title?: string
      content?: string
      requirements?: string
      style?: string
      wordCount?: number
      target?: string
    }
  ): string {
    const template = WRITING_PROMPT_TEMPLATES[feature]
    let prompt = template

    if (options.title !== undefined) {
      prompt = prompt.replace('{title}', options.title || '')
    }
    if (options.content !== undefined) {
      prompt = prompt.replace('{content}', options.content || '')
    }
    if (options.requirements !== undefined) {
      prompt = prompt.replace('{requirements}', options.requirements || '')
    }
    if (options.style !== undefined) {
      prompt = prompt.replace('{style}', this.getStyleName(options.style))
    }
    if (options.wordCount !== undefined) {
      prompt = prompt.replace('{wordCount}', String(options.wordCount))
    }
    if (options.target !== undefined) {
      prompt = prompt.replace('{target}', options.target || '')
    }

    return prompt
  }

  /**
   * 执行写作功能
   * @param feature 写作功能
   * @param options 选项
   * @param onChunk 流式输出回调
   * @returns 写作结果
   */
  async write(
    feature: WritingFeature,
    options: {
      title?: string
      content?: string
      requirements?: string
      style?: string
      wordCount?: number
      target?: string
    },
    onChunk?: ((chunk: string, count: number) => void) | null
  ): Promise<string> {
    const prompt = this.buildWritingPrompt(feature, options)
    return await aiService.sendMessage(
      [{ role: 'user', content: prompt }],
      onChunk
    )
  }

  /**
   * 智能续写
   */
  async continueWriting(
    content: string,
    onChunk?: ((chunk: string, count: number) => void) | null
  ): Promise<string> {
    return this.write('continue', { content }, onChunk)
  }

  /**
   * 文本润色
   */
  async polishText(
    content: string,
    onChunk?: ((chunk: string, count: number) => void) | null
  ): Promise<string> {
    return this.write('polish', { content }, onChunk)
  }

  /**
   * 段落排版
   */
  async formatText(
    content: string,
    onChunk?: ((chunk: string, count: number) => void) | null
  ): Promise<string> {
    return this.write('format', { content }, onChunk)
  }

  /**
   * 错别字检查
   */
  async checkSpelling(
    content: string,
    onChunk?: ((chunk: string, count: number) => void) | null
  ): Promise<string> {
    return this.write('spell-check', { content }, onChunk)
  }

  /**
   * 内容扩写
   */
  async expandContent(
    content: string,
    onChunk?: ((chunk: string, count: number) => void) | null
  ): Promise<string> {
    return this.write('expand', { content }, onChunk)
  }

  /**
   * 内容摘要
   */
  async summarizeContent(
    content: string,
    onChunk?: ((chunk: string, count: number) => void) | null
  ): Promise<string> {
    return this.write('summarize', { content }, onChunk)
  }

  /**
   * 风格转换
   */
  async convertStyle(
    content: string,
    style: string,
    onChunk?: ((chunk: string, count: number) => void) | null
  ): Promise<string> {
    return this.write('translate-style', { content, style }, onChunk)
  }

  /**
   * 使用模板写作
   */
  async writeWithTemplate(
    template: WritingTemplate,
    options: {
      title?: string
      content?: string
      wordCount?: number
      target?: string
    },
    onChunk?: ((chunk: string, count: number) => void) | null
  ): Promise<string> {
    const templateOption = WRITING_TEMPLATES.find(t => t.id === template)
    if (!templateOption) {
      throw new Error(`未知的写作模板：${template}`)
    }

    let prompt = templateOption.prompt
    if (options.title !== undefined) {
      prompt = prompt.replace('{title}', options.title || '')
    }
    if (options.content !== undefined) {
      prompt = prompt.replace('{content}', options.content || '')
    }
    if (options.wordCount !== undefined) {
      prompt = prompt.replace('{wordCount}', String(options.wordCount))
    }
    if (options.target !== undefined) {
      prompt = prompt.replace('{target}', options.target || '')
    }

    return await aiService.sendMessage(
      [{ role: 'user', content: prompt }],
      onChunk
    )
  }
}

// 导出单例
export const writingService = WritingService.getInstance()
