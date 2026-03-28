/**
 * 服务入口文件
 * 导出所有服务
 */

// AI 服务
export { aiService } from './ai/index'

// 翻译服务
export {
  translateService,
  TranslateService,
  LANGUAGE_MAP,
  COMMON_LANGUAGES,
  TRANSLATE_PROMPT_TEMPLATES,
  TRANSLATE_STYLES
} from './ai/translate'

// 导出其他服务（如果有）
// export { otherService } from './otherService.js'
