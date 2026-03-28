/**
 * 联网搜索服务
 * 使用 DuckDuckGo 进行真实搜索
 */

import { search, SearchOptions, SearchResult } from 'duck-duck-scrape'

// 搜索结果接口
export interface WebSearchResult {
  title: string
  url: string
  snippet: string
  source?: string
}

// 搜索响应接口
export interface WebSearchResponse {
  results: WebSearchResult[]
  query: string
  totalResults?: number
}

// 搜索配置接口
export interface SearchConfig {
  maxResults: number
  safeSearch: 'off' | 'moderate' | 'strict'
  timeRange?: 'd' | 'w' | 'm' | 'y' // day, week, month, year
}

// 默认搜索配置
const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxResults: 5,
  safeSearch: 'moderate'
}

/**
 * 执行网页搜索
 * @param query - 搜索查询
 * @param config - 搜索配置
 * @returns 搜索结果
 */
export async function performWebSearch(
  query: string,
  config: Partial<SearchConfig> = {}
): Promise<WebSearchResponse> {
  const mergedConfig = { ...DEFAULT_SEARCH_CONFIG, ...config }

  console.log('🔍 开始搜索:', query)

  try {
    const searchOptions: SearchOptions = {
      safeSearch: mergedConfig.safeSearch,
      time: mergedConfig.timeRange
    }

    const results = await search(query, searchOptions)

    // 提取并格式化结果
    const formattedResults: WebSearchResult[] = results.results
      .slice(0, mergedConfig.maxResults)
      .map((result: SearchResult) => ({
        title: result.title,
        url: result.url,
        snippet: result.description,
        source: new URL(result.url).hostname
      }))

    console.log(`✅ 搜索完成，找到 ${formattedResults.length} 条结果`)

    return {
      results: formattedResults,
      query,
      totalResults: results.results.length
    }
  } catch (error) {
    console.error('❌ 搜索失败:', error)
    throw new Error(`搜索失败: ${(error as Error).message}`)
  }
}

/**
 * 格式化搜索结果为提示词
 * @param searchResponse - 搜索响应
 * @returns 格式化后的提示词
 */
export function formatSearchResultsForPrompt(searchResponse: WebSearchResponse): string {
  const { results, query } = searchResponse

  if (results.length === 0) {
    return `用户问题："${query}"\n\n（未找到相关搜索结果）`
  }

  let prompt = `基于以下搜索结果，请回答用户的问题："${query}"\n\n搜索结果：\n\n`

  results.forEach((result, index) => {
    prompt += `[${index + 1}] ${result.title}\n`
    prompt += `来源：${result.source}\n`
    prompt += `摘要：${result.snippet}\n`
    prompt += `链接：${result.url}\n\n`
  })

  prompt += `\n请根据以上搜索结果提供准确、全面的回答。如果搜索结果不足以回答问题，请说明。`

  return prompt
}

/**
 * 检查搜索服务是否可用
 * @returns 是否可用
 */
export async function checkSearchAvailability(): Promise<boolean> {
  try {
    const testResult = await performWebSearch('test', { maxResults: 1 })
    return testResult.results.length > 0
  } catch {
    return false
  }
}

export default {
  performWebSearch,
  formatSearchResultsForPrompt,
  checkSearchAvailability
}
