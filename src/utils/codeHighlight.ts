/**
 * 代码高亮工具函数
 * 简单的语法高亮，不依赖外部库
 */

/**
 * 语言类型
 */
export type Language =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'cpp'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown'
  | 'sql'
  | 'shell'
  | 'yaml'
  | 'xml'
  | 'unknown'

/**
 * 根据文件扩展名获取语言类型
 */
export function getLanguageFromExtension(extension: string): Language {
  const ext = extension.toLowerCase()
  const map: Record<string, Language> = {
    js: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    h: 'cpp',
    hpp: 'cpp',
    html: 'html',
    htm: 'html',
    xhtml: 'html',
    css: 'css',
    scss: 'css',
    sass: 'css',
    less: 'css',
    json: 'json',
    md: 'markdown',
    markdown: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    svg: 'xml',
    vue: 'html'
  }
  return map[ext] || 'unknown'
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (c) => map[c])
}

/**
 * 简单的代码高亮函数
 * 使用正则表达式进行基本的语法高亮
 */
export function highlightCode(code: string, language: Language = 'unknown'): string {
  if (!code) return ''

  // 先转义 HTML
  let highlighted = escapeHtml(code)

  // 根据不同的语言进行高亮
  switch (language) {
    case 'javascript':
    case 'typescript':
      return highlightJavaScript(highlighted)
    case 'python':
      return highlightPython(highlighted)
    case 'java':
      return highlightJava(highlighted)
    case 'go':
      return highlightGo(highlighted)
    case 'rust':
      return highlightRust(highlighted)
    case 'cpp':
      return highlightCpp(highlighted)
    case 'html':
      return highlightHtml(highlighted)
    case 'css':
      return highlightCss(highlighted)
    case 'json':
      return highlightJson(highlighted)
    case 'markdown':
      return highlightMarkdown(highlighted)
    case 'sql':
      return highlightSql(highlighted)
    case 'shell':
      return highlightShell(highlighted)
    case 'yaml':
      return highlightYaml(highlighted)
    default:
      return highlighted
  }
}

/**
 * JavaScript/TypeScript 高亮
 */
function highlightJavaScript(code: string): string {
  // 字符串
  code = code.replace(/(['"`])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="code-string">$&</span>')
  // 注释
  code = code.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$&</span>')
  // 关键字
  const jsKeywords = ['const', 'let', 'var', 'function', 'class', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'extends', 'import', 'export', 'from', 'default', 'async', 'await', 'yield', 'typeof', 'instanceof', 'in', 'of', 'delete', 'void']
  jsKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g')
    code = code.replace(regex, '<span class="code-keyword">$1</span>')
  })
  // 数字
  code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>')
  // 函数调用
  code = code.replace(/(\w+)(?=\()/g, '<span class="code-function">$1</span>')
  return code
}

/**
 * Python 高亮
 */
function highlightPython(code: string): string {
  // 字符串
  code = code.replace(/(['"])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="code-string">$&</span>')
  code = code.replace(/('''[\s\S]*?'''|"""[\s\S]*?""")/g, '<span class="code-string">$&</span>')
  // 注释
  code = code.replace(/(#.*)/g, '<span class="code-comment">$&</span>')
  // 关键字
  const pyKeywords = ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'do', 'break', 'continue', 'try', 'except', 'finally', 'raise', 'throw', 'import', 'from', 'as', 'with', 'lambda', 'yield', 'pass', 'global', 'nonlocal', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'assert', 'async', 'await']
  pyKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g')
    code = code.replace(regex, '<span class="code-keyword">$1</span>')
  })
  // 数字
  code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>')
  // 函数定义和调用
  code = code.replace(/(\w+)(?=\()/g, '<span class="code-function">$1</span>')
  return code
}

/**
 * Java 高亮
 */
function highlightJava(code: string): string {
  // 字符串
  code = code.replace(/(["'])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="code-string">$&</span>')
  // 注释
  code = code.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$&</span>')
  // 关键字
  const javaKeywords = ['public', 'private', 'protected', 'static', 'final', 'class', 'interface', 'extends', 'implements', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws', 'new', 'this', 'super', 'import', 'package', 'void', 'int', 'long', 'short', 'byte', 'float', 'double', 'boolean', 'char', 'String', 'null', 'true', 'false']
  javaKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g')
    code = code.replace(regex, '<span class="code-keyword">$1</span>')
  })
  // 数字
  code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>')
  return code
}

/**
 * Go 高亮
 */
function highlightGo(code: string): string {
  // 字符串
  code = code.replace(/(["'])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="code-string">$&</span>')
  code = code.replace(/(`[\s\S]*?`)/g, '<span class="code-string">$&</span>')
  // 注释
  code = code.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$&</span>')
  // 关键字
  const goKeywords = ['func', 'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'fallthrough', 'break', 'continue', 'goto', 'select', 'var', 'const', 'type', 'struct', 'interface', 'map', 'chan', 'go', 'defer', 'import', 'package', 'nil', 'true', 'false', 'iota']
  goKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g')
    code = code.replace(regex, '<span class="code-keyword">$1</span>')
  })
  // 数字
  code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>')
  return code
}

/**
 * Rust 高亮
 */
function highlightRust(code: string): string {
  // 字符串
  code = code.replace(/(["'])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="code-string">$&</span>')
  code = code.replace(/(r#?"[^"]*")/g, '<span class="code-string">$&</span>')
  // 注释
  code = code.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$&</span>')
  // 关键字
  const rustKeywords = ['fn', 'return', 'if', 'else', 'for', 'while', 'loop', 'match', 'break', 'continue', 'try', 'catch', 'throw', 'let', 'const', 'mut', 'ref', 'pub', 'mod', 'use', 'extern', 'crate', 'struct', 'enum', 'impl', 'trait', 'type', 'where', 'self', 'Self', 'as', 'in', 'move', 'ref', 'static', 'unsafe', 'async', 'await', 'dyn', 'true', 'false', 'Option', 'Some', 'None', 'Result', 'Ok', 'Err']
  rustKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g')
    code = code.replace(regex, '<span class="code-keyword">$1</span>')
  })
  // 数字
  code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>')
  return code
}

/**
 * C++ 高亮
 */
function highlightCpp(code: string): string {
  // 字符串
  code = code.replace(/(["'])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="code-string">$&</span>')
  // 注释
  code = code.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$&</span>')
  // 关键字
  const cppKeywords = ['public', 'private', 'protected', 'class', 'struct', 'namespace', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'throw', 'new', 'delete', 'this', 'template', 'typename', 'class', 'virtual', 'override', 'final', 'const', 'static', 'inline', 'int', 'long', 'short', 'byte', 'float', 'double', 'char', 'bool', 'void', 'auto', 'nullptr', 'true', 'false']
  cppKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g')
    code = code.replace(regex, '<span class="code-keyword">$1</span>')
  })
  // 数字
  code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>')
  return code
}

/**
 * HTML 高亮
 */
function highlightHtml(code: string): string {
  // 标签
  code = code.replace(/(&lt;\/?)(\w+)([^&]*?)(&gt;)/g, (match, open, tag, attrs, close) => {
    // 高亮属性
    const highlightedAttrs = attrs.replace(/(\w+)=/g, '<span class="code-attr">$1</span>=')
    return `${open}<span class="code-tag">${tag}</span>${highlightedAttrs}${close}`
  })
  // 注释
  code = code.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="code-comment">$1</span>')
  return code
}

/**
 * CSS 高亮
 */
function highlightCss(code: string): string {
  // 注释
  code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
  // 选择器
  code = code.replace(/^([^{]+){/gm, '<span class="code-selector">$1</span>{')
  // 属性名
  code = code.replace(/([a-zA-Z-]+)(?=:)/g, '<span class="code-attr">$1</span>')
  // 值
  code = code.replace(/:([^;]+);/g, ':<span class="code-string">$1</span>;')
  return code
}

/**
 * JSON 高亮
 */
function highlightJson(code: string): string {
  // 键
  code = code.replace(/"([^"]+)":/g, '<span class="code-attr">"$1"</span>:')
  // 字符串值
  code = code.replace(/: "([^"]*)"/g, ': <span class="code-string">"$1"</span>')
  // 数字
  code = code.replace(/: (\d+)/g, ': <span class="code-number">$1</span>')
  // 布尔值
  code = code.replace(/: (true|false)/g, ': <span class="code-keyword">$1</span>')
  // null
  code = code.replace(/: null/g, ': <span class="code-keyword">null</span>')
  return code
}

/**
 * Markdown 高亮
 */
function highlightMarkdown(code: string): string {
  // 标题
  code = code.replace(/^(#+\s.*)$/gm, '<span class="code-keyword">$1</span>')
  // 粗体
  code = code.replace(/(\*\*.*?\*\*)/g, '<span class="code-string">$1</span>')
  // 斜体
  code = code.replace(/(\*.*?\*)/g, '<span class="code-attr">$1</span>')
  // 代码块
  code = code.replace(/(`[^`]+`)/g, '<span class="code-string">$1</span>')
  // 链接
  code = code.replace(/(\[.*?\]\(.*?\))/g, '<span class="code-keyword">$1</span>')
  return code
}

/**
 * SQL 高亮
 */
function highlightSql(code: string): string {
  // 注释
  code = code.replace(/(--[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
  // 字符串
  code = code.replace(/('[^']*')/g, '<span class="code-string">$1</span>')
  // 关键字
  const sqlKeywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'AS', 'NULL', 'NOT', 'AND', 'OR', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'ASC', 'DESC']
  sqlKeywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw.toUpperCase()})\\b`, 'gi')
    code = code.replace(regex, '<span class="code-keyword">$1</span>')
  })
  // 数字
  code = code.replace(/\b(\d+)\b/g, '<span class="code-number">$1</span>')
  return code
}

/**
 * Shell 高亮
 */
function highlightShell(code: string): string {
  // 注释
  code = code.replace(/(#[^\n]*)/g, '<span class="code-comment">$1</span>')
  // 字符串
  code = code.replace(/(["'])(?:(?!\1)[^\\]|\\.)*?\1/g, '<span class="code-string">$&</span>')
  // 命令
  code = code.replace(/^(\s*)(\w+)/gm, '$1<span class="code-keyword">$2</span>')
  // 变量
  code = code.replace(/(\$[\w{][\w}]*)/g, '<span class="code-attr">$1</span>')
  return code
}

/**
 * YAML 高亮
 */
function highlightYaml(code: string): string {
  // 注释
  code = code.replace(/(#[^\n]*)/g, '<span class="code-comment">$1</span>')
  // 键
  code = code.replace(/^(\s*)([\w.-]+)(\s*:)/gm, '$1<span class="code-attr">$2</span>$3')
  // 值
  code = code.replace(/:\s*([^\n#]+)/g, ': <span class="code-string">$1</span>')
  return code
}

/**
 * 获取高亮样式
 */
export function getCodeHighlightStyles(): string {
  return `
    .code-keyword { color: #c678dd; }
    .code-string { color: #98c379; }
    .code-number { color: #d19a66; }
    .code-comment { color: #5c6370; font-style: italic; }
    .code-function { color: #61afef; }
    .code-attr { color: #e06c75; }
    .code-tag { color: #e06c75; }
    .code-selector { color: #e5c07b; }
  `
}
