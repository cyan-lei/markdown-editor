import { ref, type Ref } from 'vue'

export function useSearch(
  textareaRef: Ref<HTMLTextAreaElement | null>,
  getContent: () => string,
  setContent: (val: string) => void
) {
  const searchQuery = ref('')
  const replaceQuery = ref('')
  const caseSensitive = ref(false)
  const matchCount = ref(0)
  const currentMatch = ref(0)

  let matches: { start: number; end: number }[] = []

  // 转义正则表达式特殊字符，确保用户输入被当作普通字符串处理
  const escapeRegExp = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const findMatches = (text: string, query: string, cs: boolean): { start: number; end: number }[] => {
    if (!query) return []
    const flags = cs ? 'g' : 'gi'
    const escaped = escapeRegExp(query)
    const regex = new RegExp(escaped, flags)
    const result: { start: number; end: number }[] = []
    let m: RegExpExecArray | null
    while ((m = regex.exec(text)) !== null) {
      result.push({ start: m.index, end: m.index + m[0].length })
      if (m[0].length === 0) regex.lastIndex++
    }
    return result
  }

  const selectMatch = (index: number) => {
    const el = textareaRef.value
    if (!el || index < 0 || index >= matches.length) return
    const m = matches[index]
    el.focus()
    el.setSelectionRange(m.start, m.end)
    const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 24
    const linesBefore = el.value.substring(0, m.start).split('\n').length
    el.scrollTop = (linesBefore - 1) * lineHeight - el.clientHeight / 2
  }

  const search = () => {
    const text = getContent()
    matches = findMatches(text, searchQuery.value, caseSensitive.value)
    matchCount.value = matches.length
    currentMatch.value = matches.length > 0 ? 0 : -1
    if (currentMatch.value >= 0) selectMatch(0)
  }

  const findNext = () => {
    if (matches.length === 0) return
    currentMatch.value = (currentMatch.value + 1) % matches.length
    selectMatch(currentMatch.value)
  }

  const findPrev = () => {
    if (matches.length === 0) return
    currentMatch.value = currentMatch.value <= 0 ? matches.length - 1 : currentMatch.value - 1
    selectMatch(currentMatch.value)
  }

  const replace = () => {
    if (currentMatch.value < 0 || currentMatch.value >= matches.length) return
    const m = matches[currentMatch.value]
    const text = getContent()
    const newText = text.substring(0, m.start) + replaceQuery.value + text.substring(m.end)
    setContent(newText)

    matches = findMatches(newText, searchQuery.value, caseSensitive.value)
    matchCount.value = matches.length

    if (matches.length > 0) {
      const replaceEnd = m.start + replaceQuery.value.length
      const nextIdx = matches.findIndex(mh => mh.start >= replaceEnd)
      currentMatch.value = nextIdx >= 0 ? nextIdx : 0
      selectMatch(currentMatch.value)
    } else {
      currentMatch.value = -1
    }
  }

  const replaceAll = () => {
    if (matches.length === 0) return
    const text = getContent()
    const escaped = escapeRegExp(searchQuery.value)
    const flags = caseSensitive.value ? 'g' : 'gi'
    const regex = new RegExp(escaped, flags)
    const newText = text.replace(regex, replaceQuery.value)
    setContent(newText)
    // 重新计算匹配，而不是直接清空
    matches = findMatches(newText, searchQuery.value, caseSensitive.value)
    matchCount.value = matches.length
    currentMatch.value = matches.length > 0 ? 0 : -1
    if (currentMatch.value >= 0) selectMatch(0)
  }

  return {
    searchQuery,
    replaceQuery,
    caseSensitive,
    matchCount,
    currentMatch,
    search,
    findNext,
    findPrev,
    replace,
    replaceAll
  }
}
