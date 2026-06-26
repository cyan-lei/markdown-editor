/**
 * Markdown 格式化服务
 * 规范化空行、统一列表缩进、对齐表格、统一代码块语言标签、清理行尾空格
 */

// 代码块语言缩写映射
const LANG_MAP: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  md: 'markdown'
}

export function formatMarkdown(content: string): string {
  let lines = content.split('\n')

  // 1. 行尾空格清理
  lines = lines.map(line => line.replace(/[ \t]+$/, ''))

  // 2. 代码块语言标签统一
  let inCodeBlock = false
  lines = lines.map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      if (inCodeBlock) {
        const lang = trimmed.slice(3).trim()
        if (lang && LANG_MAP[lang.toLowerCase()]) {
          return line.replace(trimmed.slice(3).trim(), LANG_MAP[lang.toLowerCase()])
        }
      }
    }
    return line
  })

  // 3. 表格对齐（需在代码块外处理）
  lines = alignTables(lines)

  // 4. 列表缩进规范化（统一为 2 空格）
  lines = normalizeListIndent(lines)

  // 5. 空行规范化
  lines = normalizeBlankLines(lines)

  return lines.join('\n')
}

/**
 * 对齐 GFM 表格：计算每列最大宽度，补齐空格
 */
function alignTables(lines: string[]): string[] {
  const result: string[] = []
  let i = 0
  while (i < lines.length) {
    // 检测表格起始：当前行是表格行，下一行是分隔行 |---|
    if (isTableRow(lines[i]) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const tableLines: string[] = []
      // 收集连续表格行
      let j = i
      while (j < lines.length && isTableRow(lines[j])) {
        tableLines.push(lines[j])
        j++
      }
      result.push(...alignTable(tableLines))
      i = j
    } else {
      result.push(lines[i])
      i++
    }
  }
  return result
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length >= 3
}

function isSeparatorRow(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return false
  const cells = trimmed.slice(1, -1).split('|')
  return cells.every(cell => /^\s*:?-+:?\s*$/.test(cell))
}

function alignTable(tableLines: string[]): string[] {
  const rows = tableLines.map(line => {
    const trimmed = line.trim()
    return trimmed.slice(1, -1).split('|').map(cell => cell.trim())
  })

  if (rows.length < 2) return tableLines

  const colCount = rows[0].length
  const colWidths = new Array(colCount).fill(0)

  // 计算每列最大宽度（跳过分隔行）
  for (let r = 0; r < rows.length; r++) {
    if (r === 1) continue // 分隔行
    for (let c = 0; c < colCount; c++) {
      if (rows[r][c] && rows[r][c].length > colWidths[c]) {
        colWidths[c] = rows[r][c].length
      }
    }
  }

  // 确保最小宽度为 3（分隔行至少 --- ）
  colWidths.forEach((w, i) => { if (w < 3) colWidths[i] = 3 })

  // 重新构建行
  return rows.map((row, r) => {
    if (r === 1) {
      // 分隔行
      const cells = row.map((cell, c) => {
        const left = cell.startsWith(':')
        const right = cell.endsWith(':')
        const fill = '-'.repeat(colWidths[c])
        return ` ${left ? ':' : ''}${fill}${right ? ':' : ''} `
      })
      return `|${cells.join('|')}|`
    }
    const cells = row.map((cell, c) => ` ${(cell || '').padEnd(colWidths[c])} `)
    return `|${cells.join('|')}|`
  })
}

/**
 * 列表缩进规范化：统一为 2 空格倍数
 */
function normalizeListIndent(lines: string[]): string[] {
  let inCodeBlock = false
  return lines.map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('```')) inCodeBlock = !inCodeBlock
    if (inCodeBlock) return line

    // 匹配列表项：缩进 + 列表标记
    const match = line.match(/^(\s*)([-*+]|\d+\.)\s+/)
    if (match) {
      const indent = match[1]
      // 计算 tab=4 空格，统一缩进为 2 空格的倍数
      const spaces = indent.replace(/\t/g, '    ')
      const indentCount = Math.round(spaces.length / 4) * 2
      return ' '.repeat(indentCount) + line.slice(match[0].length - match[1].length)
    }
    return line
  })
}

/**
 * 空行规范化
 */
function normalizeBlankLines(lines: string[]): string[] {
  const result: string[] = []
  let prevBlank = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isBlank = line.trim() === ''
    const isHeading = /^#{1,6}\s/.test(line.trim())

    if (isBlank) {
      // 连续空行只保留 1 个
      if (!prevBlank) {
        result.push('')
      }
      prevBlank = true
    } else {
      // 标题前确保空行（除非是第一行或前一行已是空行）
      if (isHeading && result.length > 0 && result[result.length - 1] !== '') {
        result.push('')
      }
      result.push(line)
      // 标题后确保空行（除非下一行已是空行或是最后一行）
      if (isHeading && i + 1 < lines.length && lines[i + 1].trim() !== '') {
        result.push('')
        prevBlank = true
      } else {
        prevBlank = false
      }
    }
  }

  // 去除首尾空行
  while (result.length > 0 && result[0].trim() === '') result.shift()
  while (result.length > 0 && result[result.length - 1].trim() === '') result.pop()

  return result
}
