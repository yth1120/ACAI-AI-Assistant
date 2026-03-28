/**
 * 消息预处理工具
 */

// 消息接口
export interface Message {
  role: string
  content: string
}

// 设置 Store 类型
export interface SettingsStore {
  apiProvider: string
  deepThinking: boolean
  webSearch: boolean
  [key: string]: unknown
}

/**
 * 预处理消息（添加系统提示等）
 * @param messages - 原始消息数组
 * @param settingsStore - 设置 store
 * @returns 处理后的消息数组
 */
export function preprocessMessages(messages: Message[], settingsStore: SettingsStore): Message[] {
  // 复制消息数组，避免修改原数组
  let processedMessages = [...messages]

  // 构建系统提示
  const systemPrompts: string[] = []

  if (settingsStore.deepThinking) {
    systemPrompts.push(
      '请使用深度思考模式，详细分析问题的各个方面，展示你的推理过程。在回答时：\n' +
        '1. 分析问题的核心要点\n' +
        '2. 考虑多个可能的角度和方案\n' +
        '3. 评估每个方案的优缺点\n' +
        '4. 给出经过深思熟虑的结论'
    )
  }

  if (settingsStore.webSearch) {
    systemPrompts.push(
      '请以联网搜索模式回答。假设你可以访问最新的互联网信息。在回答时：\n' +
        '1. 考虑最新的信息和趋势\n' +
        '2. 提供具体的数据和事实\n' +
        '3. 如果涉及时效性内容，请说明是基于最新信息\n' +
        '4. 必要时提供相关的参考来源建议'
    )
  }

  // 如果有系统提示，添加到消息列表
  if (systemPrompts.length > 0) {
    const systemContent = systemPrompts.join('\n\n')
    console.log('✨ 系统提示内容:', systemContent.substring(0, 100) + '...')

    // Claude API 不支持 system role，需要将系统提示合并到第一条用户消息中
    if (settingsStore.apiProvider === 'claude') {
      // 找到第一条用户消息
      const firstUserMsgIndex = processedMessages.findIndex(m => m.role === 'user')
      if (firstUserMsgIndex !== -1) {
        // 在第一条用户消息前添加系统提示
        processedMessages[firstUserMsgIndex].content =
          `[系统指令]\n${systemContent}\n\n[用户问题]\n` +
          processedMessages[firstUserMsgIndex].content
        console.log('✨ 已添加系统提示（Claude 格式）')
      }
    } else {
      // 其他 API 支持 system role
      const systemMessage: Message = {
        role: 'system',
        content: systemContent
      }

      // 检查是否已有 system 消息
      const hasSystemMessage = processedMessages.some(m => m.role === 'system')

      if (hasSystemMessage) {
        // 如果已有 system 消息，合并内容
        const systemMsgIndex = processedMessages.findIndex(m => m.role === 'system')
        processedMessages[systemMsgIndex].content += '\n\n' + systemMessage.content
      } else {
        // 添加新的 system 消息到开头
        processedMessages.unshift(systemMessage)
      }

      console.log('✨ 已添加系统提示')
    }
  }

  return processedMessages
}

export default {
  preprocessMessages
}
