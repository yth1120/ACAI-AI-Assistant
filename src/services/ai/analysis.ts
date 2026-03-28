/**
 * 文本分析服务模块
 * 提供文本分析相关的功能
 */

import { aiService } from './index'

export interface AnalysisResult {
  wordCount: WordCountResult
  tags: string[]
  emotion: EmotionResult
  summary: string
  optimizedPrompt: string
  rawResponse: string
}

export interface WordCountResult {
  total: number
  chinese: number
  english: number
  punctuation: number
  number: number
  other: number
}

export interface EmotionResult {
  positive: number
  neutral: number
  negative: number
  mainEmotion: string
}

export interface AnalysisRecord {
  id: string
  sourceText: string
  result: AnalysisResult
  mode: AnalysisMode
  timestamp: string
  favorite: boolean
}

export type AnalysisMode = 'standard' | 'deep' | 'concise'
export type AnalysisFunction = 'smart' | 'prompt' | 'wordcount' | 'tags' | 'polish'

export interface AnalysisConfig {
  mode: AnalysisMode
  function: AnalysisFunction
}

// 分析模式配置
export const ANALYSIS_MODES: { id: AnalysisMode; label: string; icon: string; prompt: string }[] = [
  {
    id: 'standard',
    label: '标准分析',
    icon: 'fa-solid fa-scale-balanced',
    prompt: '请对以下文本进行全面分析，包括字数统计、内容标签、情绪分析、内容摘要和结构分析。'
  },
  {
    id: 'deep',
    label: '深度分析',
    icon: 'fa-solid fa-magnifying-glass-chart',
    prompt: '请对以下文本进行深入分析，包括详细的字数统计、多维度内容标签、情绪分析、内容摘要、写作风格分析和改进建议。'
  },
  {
    id: 'concise',
    label: '简洁分析',
    icon: 'fa-solid fa-minimize',
    prompt: '请对以下文本进行简洁分析，仅提供关键的字数统计、核心标签和一句话摘要。'
  }
]

// 分析功能配置
export const ANALYSIS_FUNCTIONS: { id: AnalysisFunction; label: string; icon: string }[] = [
  { id: 'smart', label: '智能分析', icon: 'fa-solid fa-magic' },
  { id: 'prompt', label: '提示词优化', icon: 'fa-solid fa-bolt-lightning' },
  { id: 'wordcount', label: '字数统计', icon: 'fa-solid fa-chart-simple' },
  { id: 'tags', label: '内容标签', icon: 'fa-solid fa-flag' },
  { id: 'polish', label: '润色改写', icon: 'fa-solid fa-pen-to-square' }
]

/**
 * 文本分析服务类
 */
export class TextAnalysisService {
  private static instance: TextAnalysisService | null = null

  private constructor() {}

  static getInstance(): TextAnalysisService {
    if (!TextAnalysisService.instance) {
      TextAnalysisService.instance = new TextAnalysisService()
    }
    return TextAnalysisService.instance
  }

  /**
   * 基础字数统计
   */
  countWords(text: string): WordCountResult {
    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const english = (text.match(/[a-zA-Z]/g) || []).length
    const punctuation = (text.match(/[^\w\s\u4e00-\u9fa5]/g) || []).length
    const number = (text.match(/[0-9]/g) || []).length
    const other = text.length - chinese - english - punctuation - number

    return {
      total: text.length,
      chinese,
      english,
      punctuation,
      number,
      other
    }
  }

  /**
   * 执行文本分析
   */
  async analyze(
    text: string,
    mode: AnalysisMode = 'standard',
    onChunk?: ((chunk: string) => void) | null
  ): Promise<AnalysisResult> {
    if (!text.trim()) {
      throw new Error('请输入需要分析的文本')
    }

    const modeConfig = ANALYSIS_MODES.find(m => m.id === mode) || ANALYSIS_MODES[0]

    const prompt = `${modeConfig.prompt}

请按照以下 JSON 格式返回分析结果：
{
  "wordCount": {
    "total": 总字数，
    "chinese": 中文字数，
    "english": 英文字母数，
    "punctuation": 标点符号数，
    "number": 数字个数，
    "other": 其他字符数
  },
  "tags": ["标签 1", "标签 2", "标签 3"],
  "emotion": {
    "positive": 积极百分比 (0-100),
    "neutral": 中性百分比 (0-100),
    "negative": 消极百分比 (0-100),
    "mainEmotion": "主要情绪"
  },
  "summary": "内容摘要",
  "optimizedPrompt": "优化后的提示词"
}

需要分析的文本：
${text}

请直接返回 JSON 格式结果，不要添加任何额外说明。`

    let result = ''

    try {
      result = await aiService.sendMessage(
        [{ role: 'user', content: prompt }],
        onChunk || null
      )

      // 尝试解析 JSON 结果
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            wordCount: parsed.wordCount || this.countWords(text),
            tags: parsed.tags || [],
            emotion: parsed.emotion || { positive: 0, neutral: 100, negative: 0, mainEmotion: '中性' },
            summary: parsed.summary || '',
            optimizedPrompt: parsed.optimizedPrompt || '',
            rawResponse: result
          }
        } catch {
          // JSON 解析失败，返回基础分析结果
        }
      }

      // 解析失败或无 JSON，返回基础分析
      return {
        wordCount: this.countWords(text),
        tags: [],
        emotion: { positive: 0, neutral: 100, negative: 0, mainEmotion: '中性' },
        summary: result || '分析完成',
        optimizedPrompt: '',
        rawResponse: result
      }
    } catch (error) {
      throw new Error(`分析失败：${(error as Error).message}`)
    }
  }

  /**
   * 优化提示词
   */
  async optimizePrompt(prompt: string, onChunk?: ((chunk: string) => void) | null): Promise<string> {
    const systemPrompt = `你是一个专业的提示词优化专家。请优化用户提供的提示词，使其更加清晰、具体、有效。

优化原则：
1. 明确任务目标
2. 添加必要的上下文
3. 指定输出格式
4. 提供示例（如适用）
5. 设置约束条件

请直接返回优化后的提示词，不要添加额外说明。`

    try {
      return await aiService.sendMessage(
        [{ role: 'user', content: `${systemPrompt}\n\n需要优化的提示词：\n${prompt}` }],
        onChunk || null
      )
    } catch (error) {
      throw new Error(`优化失败：${(error as Error).message}`)
    }
  }

  /**
   * 润色改写文本
   */
  async polishText(text: string, onChunk?: ((chunk: string) => void) | null): Promise<string> {
    const systemPrompt = `你是一个专业的文本润色专家。请润色改写用户提供的文本，要求：

1. 保持原意不变
2. 提升语言流畅度
3. 修正语法错误
4. 优化表达方式
5. 使文本更加专业、清晰

请直接返回润色后的文本，不要添加额外说明。`

    try {
      return await aiService.sendMessage(
        [{ role: 'user', content: `${systemPrompt}\n\n需要润色的文本：\n${text}` }],
        onChunk || null
      )
    } catch (error) {
      throw new Error(`润色失败：${(error as Error).message}`)
    }
  }

  /**
   * 生成内容标签
   */
  async generateTags(text: string, count: number = 5, onChunk?: ((chunk: string) => void) | null): Promise<string[]> {
    const prompt = `请为以下文本生成${count}个关键词标签，标签应该简洁、准确地概括文本内容。

请直接返回标签列表，使用 JSON 数组格式，例如：["标签 1", "标签 2", "标签 3"]

文本内容：
${text}`

    let result = ''

    try {
      result = await aiService.sendMessage([{ role: 'user', content: prompt }], onChunk || null)

      const jsonMatch = result.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0])
        } catch {
          // 解析失败
        }
      }

      // 尝试从文本中提取标签
      return result.split('\n').filter(line => line.trim()).map(line => line.replace(/^[-*•]\s*/, '').trim())
    } catch (error) {
      throw new Error(`标签生成失败：${(error as Error).message}`)
    }
  }

  /**
   * 生成摘要
   */
  async summarize(text: string, maxLength: number = 200, onChunk?: ((chunk: string) => void) | null): Promise<string> {
    const prompt = `请用简洁的语言总结以下文本，控制在${maxLength}字以内。

请直接返回摘要内容，不要添加额外说明。

文本内容：
${text}`

    try {
      return await aiService.sendMessage([{ role: 'user', content: prompt }], onChunk || null)
    } catch (error) {
      throw new Error(`摘要生成失败：${(error as Error).message}`)
    }
  }
}

// 导出单例
export const analysisService = TextAnalysisService.getInstance()
