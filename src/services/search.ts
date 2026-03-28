/**
 * 联网搜索服务
 * 使用 duck-duck-scrape 进行网页搜索
 */

import { search, SafeSearchType } from 'duck-duck-scrape'

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
  source: string
}

export interface WebSearchResponse {
  query: string
  results: WebSearchResult[]
}

export interface SearchOptions {
  maxResults?: number
  safeSearch?: SafeSearchType
}

/**
 * 执行网页搜索
 * @param query 搜索查询
 * @param options 搜索选项
 * @returns 搜索结果
 */
export async function performWebSearch(query: string, options: SearchOptions = {}): Promise<WebSearchResponse> {
  const { maxResults = 5, safeSearch = SafeSearchType.MODERATE } = options

  try {
    console.log(`🔍 开始搜索: "${query}"`)

    // 调用 duck-duck-scrape 进行搜索
    const searchResults = await search(query, {
      safeSearch,
      locale: 'zh-cn'
    })

    console.log(`🔍 搜索完成，找到 ${searchResults.results.length} 个结果`)

    // 处理搜索结果
    const results: WebSearchResult[] = searchResults.results
      .slice(0, maxResults)
      .map((result: any, index: number) => {
        // 提取域名作为来源，优先使用hostname，如果没有则从URL提取
        let source = result.hostname || '未知来源'
        if (!source || source === '未知来源') {
          try {
            if (result.url) {
              const urlObj = new URL(result.url)
              source = urlObj.hostname.replace('www.', '')
            }
          } catch (e) {
            // 如果URL解析失败，使用默认来源
          }
        }

        // 清理标题中的HTML标签
        let title = result.title || '无标题'
        title = title.replace(/<[^>]*>/g, '').trim()

        // 使用description作为摘要，如果没有则使用rawDescription
        let snippet = result.description || result.rawDescription || '无描述'

        // 清理HTML标签（如<b>标签）
        snippet = snippet.replace(/<[^>]*>/g, '').trim()

        return {
          title: title,
          url: result.url || '#',
          snippet: snippet,
          source: source,
          index: index + 1
        }
      })

    return {
      query,
      results
    }
  } catch (error) {
    console.error('❌ 搜索失败:', error)

    // 返回空结果而不是抛出错误，让前端可以降级处理
    return {
      query,
      results: []
    }
  }
}

/**
 * 格式化搜索结果用于提示词
 * @param results 搜索结果
 * @returns 格式化后的搜索上下文
 */
export function formatSearchResultsForPrompt(results: WebSearchResult[]): string {
  if (results.length === 0) {
    return '未找到相关的搜索结果。'
  }

  const formattedResults = results.map((result, index) => {
    return `[${index + 1}] ${result.title} (来源: ${result.source})
URL: ${result.url}
摘要: ${result.snippet}`
  }).join('\n\n')

  return `以下是从网络搜索到的相关信息：

${formattedResults}

请基于以上搜索结果回答问题。如果搜索结果不足以回答问题，请结合你的知识回答，并说明哪些信息来自搜索结果。`
}

/**
 * 测试搜索功能
 * 注意：这会进行真实的网络搜索
 */
export async function testSearch(): Promise<void> {
  try {
    console.log('🧪 开始真实搜索测试...')
    console.log('⚠️  注意：这将进行真实的网络搜索，需要网络连接')

    const testQuery = '人工智能最新发展'
    console.log(`🔍 搜索查询: "${testQuery}"`)

    const results = await performWebSearch(testQuery, { maxResults: 3 })

    if (results.results.length === 0) {
      console.log('❌ 未找到搜索结果，可能是网络问题或API限制')
      console.log('💡 建议：检查网络连接，或稍后重试')
      return
    }

    console.log(`✅ 搜索测试成功，查询: "${results.query}"`)
    console.log(`📊 找到 ${results.results.length} 个真实结果:`)

    results.results.forEach((result, index) => {
      console.log(`\n  ${index + 1}. ${result.title}`)
      console.log(`     来源: ${result.source}`)
      console.log(`     URL: ${result.url}`)
      console.log(`     摘要: ${result.snippet.substring(0, 120)}...`)
    })

    console.log('\n🎉 搜索功能测试完成！')
  } catch (error) {
    console.error('❌ 搜索测试失败:', error)
    console.log('💡 可能的原因：')
    console.log('  1. 网络连接问题')
    console.log('  2. DuckDuckGo API限制')
    console.log('  3. 防火墙或代理设置')
  }
}