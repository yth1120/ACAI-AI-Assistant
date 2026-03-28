/**
 * 翻译服务模块
 * 提供翻译相关的功能
 */

import { aiService } from './index'

// 语言代码映射
export const LANGUAGE_MAP: Record<string, string> = {
  zh: '中文',
  en: '英语',
  ja: '日语',
  ko: '韩语',
  fr: '法语',
  de: '德语',
  es: '西班牙语',
  ru: '俄语',
  pt: '葡萄牙语',
  ar: '阿拉伯语',
  it: '意大利语',
  th: '泰语',
  vi: '越南语',
  id: '印尼语',
  ms: '马来语',
  tl: '菲律宾语',
  hi: '印地语',
  bn: '孟加拉语',
  ur: '乌尔都语',
  fa: '波斯语',
  tr: '土耳其语',
  pl: '波兰语',
  uk: '乌克兰语',
  ro: '罗马尼亚语',
  hu: '匈牙利语',
  cs: '捷克语',
  sk: '斯洛伐克语',
  bg: '保加利亚语',
  hr: '克罗地亚语',
  sr: '塞尔维亚语',
  sl: '斯洛文尼亚语',
  et: '爱沙尼亚语',
  lv: '拉脱维亚语',
  lt: '立陶宛语',
  fi: '芬兰语',
  sv: '瑞典语',
  no: '挪威语',
  da: '丹麦语',
  nl: '荷兰语',
  el: '希腊语',
  he: '希伯来语',
  sw: '斯瓦希里语',
  af: '南非荷兰语',
  sq: '阿尔巴尼亚语',
  am: '阿姆哈拉语',
  hy: '亚美尼亚语',
  az: '阿塞拜疆语',
  eu: '巴斯克语',
  be: '白俄罗斯语',
  bs: '波斯尼亚语',
  ca: '加泰罗尼亚语',
  ceb: '宿务语',
  ny: '契切尼语',
  co: '科西嘉语',
  eo: '世界语',
  fy: '弗里西亚语',
  gl: '加利西亚语',
  ka: '格鲁吉亚语',
  gu: '古吉拉特语',
  ht: '海地克里奥尔语',
  ha: '豪萨语',
  haw: '夏威夷语',
  hmn: '苗语',
  is: '冰岛语',
  ig: '伊博语',
  ga: '爱尔兰语',
  jw: '爪哇语',
  kn: '卡纳达语',
  kk: '哈萨克语',
  km: '高棉语',
  rw: '卢旺达语',
  ku: '库尔德语',
  ky: '吉尔吉斯语',
  lo: '老挝语',
  la: '拉丁语',
  lb: '卢森堡语',
  mk: '马其顿语',
  mg: '马尔加什语',
  ml: '马拉雅拉姆语',
  mt: '马耳他语',
  mi: '毛利语',
  mr: '马拉地语',
  mn: '蒙古语',
  my: '缅甸语',
  ne: '尼泊尔语',
  or: '奥里亚语',
  ps: '普什图语',
  pa: '旁遮普语',
  sm: '萨摩亚语',
  gd: '苏格兰盖尔语',
  st: '塞索托语',
  sn: '绍纳语',
  sd: '信德语',
  si: '僧伽罗语',
  so: '索马里语',
  su: '巽他语',
  tg: '塔吉克语',
  ta: '泰米尔语',
  tt: '鞑靼语',
  te: '泰卢固语',
  uz: '乌兹别克语',
  cy: '威尔士语',
  xh: '科萨语',
  yi: '意第绪语',
  yo: '约鲁巴语',
  zu: '祖鲁语'
}

// 常用语言列表
export const COMMON_LANGUAGES = ['en', 'ja', 'ko', 'fr', 'de', 'es', 'ru', 'pt']

// 翻译提示词模板
export const TRANSLATE_PROMPT_TEMPLATES: Record<string, string> = {
  default: '请将以下文本翻译成{targetLang}，只输出翻译结果，不要添加任何解释或额外内容：\n\n{sourceText}',
  formal: '请将以下文本以正式的口吻翻译成{targetLang}，只输出翻译结果：\n\n{sourceText}',
  casual: '请将以下文本以口语化的方式翻译成{targetLang}，只输出翻译结果：\n\n{sourceText}',
  literary: '请将以下文本以文学性的方式翻译成{targetLang}，只输出翻译结果：\n\n{sourceText}',
  technical: '请将以下技术文本准确翻译成{targetLang}，保持专业术语的准确性，只输出翻译结果：\n\n{sourceText}',
  business: '请将以下商务文本翻译成{targetLang}，保持商务语气，只输出翻译结果：\n\n{sourceText}'
}

// 翻译风格选项
export interface TranslateStyle {
  id: string
  label: string
  icon: string
}

export const TRANSLATE_STYLES: TranslateStyle[] = [
  { id: 'default', label: '标准', icon: 'fa-solid fa-font' },
  { id: 'formal', label: '正式', icon: 'fa-solid fa-briefcase' },
  { id: 'casual', label: '口语', icon: 'fa-solid fa-comment' },
  { id: 'literary', label: '文学', icon: 'fa-solid fa-book' },
  { id: 'technical', label: '技术', icon: 'fa-solid fa-code' },
  { id: 'business', label: '商务', icon: 'fa-solid fa-handshake' }
]

/**
 * 翻译服务类
 */
export class TranslateService {
  private static instance: TranslateService | null = null

  private constructor() {}

  static getInstance(): TranslateService {
    if (!TranslateService.instance) {
      TranslateService.instance = new TranslateService()
    }
    return TranslateService.instance
  }

  /**
   * 获取语言名称
   */
  getLanguageName(code: string): string {
    return LANGUAGE_MAP[code] || code
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return Object.entries(LANGUAGE_MAP).map(([code, name]) => ({ code, name }))
  }

  /**
   * 构建翻译提示词
   */
  buildTranslatePrompt(
    sourceText: string,
    targetLang: string,
    style: string = 'default'
  ): string {
    const template = TRANSLATE_PROMPT_TEMPLATES[style] || TRANSLATE_PROMPT_TEMPLATES.default
    const targetLangName = this.getLanguageName(targetLang)
    return template.replace('{targetLang}', targetLangName).replace('{sourceText}', sourceText)
  }

  /**
   * 执行翻译
   * @param sourceText 源文本
   * @param sourceLang 源语言代码
   * @param targetLang 目标语言代码
   * @param style 翻译风格
   * @param onChunk 流式输出回调
   * @returns 翻译结果
   */
  async translate(
    sourceText: string,
    sourceLang: string,
    targetLang: string,
    style: string = 'default',
    onChunk?: ((chunk: string, count: number) => void) | null
  ): Promise<string> {
    const prompt = this.buildTranslatePrompt(sourceText, targetLang, style)
    return await aiService.sendMessage(
      [{ role: 'user', content: prompt }],
      onChunk
    )
  }

  /**
   * 批量翻译
   * @param texts 文本数组
   * @param sourceLang 源语言代码
   * @param targetLang 目标语言代码
   * @param style 翻译风格
   * @returns 翻译结果数组
   */
  async batchTranslate(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    style: string = 'default'
  ): Promise<string[]> {
    const results: string[] = []
    for (const text of texts) {
      try {
        const result = await this.translate(text, sourceLang, targetLang, style)
        results.push(result)
      } catch (error) {
        console.error('批量翻译失败:', error)
        results.push(`[翻译失败：${(error as Error).message}]`)
      }
    }
    return results
  }

  /**
   * 检测语言（使用 AI 推断）
   * @param text 待检测文本
   * @returns 语言代码
   */
  async detectLanguage(text: string): Promise<string> {
    const prompt = `请检测以下文本使用的语言，只返回语言代码（如 zh、en、ja、ko 等），不要其他内容：\n\n${text}`
    try {
      const result = await aiService.sendMessage([{ role: 'user', content: prompt }])
      const detectedCode = result.trim().toLowerCase()
      // 验证语言代码是否有效
      if (LANGUAGE_MAP[detectedCode]) {
        return detectedCode
      }
      // 尝试匹配部分名称
      for (const [code, name] of Object.entries(LANGUAGE_MAP)) {
        if (name.toLowerCase().includes(detectedCode) || detectedCode.includes(code)) {
          return code
        }
      }
      return 'zh' // 默认返回中文
    } catch (error) {
      console.error('语言检测失败:', error)
      return 'zh'
    }
  }
}

// 导出单例
export const translateService = TranslateService.getInstance()
