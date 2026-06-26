<template>
  <div class="editor-panel">
    <div class="panel-header">
      <span class="panel-title">EDITOR</span>
      <div class="panel-header-right">
        <span v-if="modeBadge" class="mode-badge" :class="'mode-' + modeBadge.toLowerCase()">{{ modeBadge }}</span>
        <span class="file-info">{{ charCount }} 字符</span>
      </div>
    </div>
    <EditorToolbar
      :canUndo="history.canUndo.value"
      :canRedo="history.canRedo.value"
      @format="insertFormat"
      @undo="undo"
      @redo="redo"
    />
    <SearchBar
      v-if="searchVisible"
      :mode="searchMode"
      :searchQuery="search.searchQuery.value"
      :replaceQuery="search.replaceQuery.value"
      :caseSensitive="search.caseSensitive.value"
      :useRegex="search.useRegex.value"
      :matchCount="search.matchCount.value"
      :currentMatch="search.currentMatch.value"
      :history="search.searchHistory.value"
      @update:searchQuery="onSearchQueryChange"
      @update:replaceQuery="search.replaceQuery.value = $event"
      @update:caseSensitive="onCaseSensitiveChange"
      @update:useRegex="search.useRegex.value = $event; search.search()"
      @next="search.findNext()"
      @prev="search.findPrev()"
      @replace="search.replace()"
      @replaceAll="search.replaceAll()"
      @close="closeSearch"
      @clearHistory="search.clearHistory"
    />
    <div class="goto-line-bar" v-if="gotoLineVisible">
      <input
        ref="gotoInputRef"
        class="goto-input"
        type="number"
        v-model="gotoLineNum"
        @keydown.enter.prevent="jumpToLine"
        @keydown.esc.prevent="gotoLineVisible = false"
        placeholder="跳转到行..."
      />
      <button class="goto-btn" @click="jumpToLine">跳转</button>
      <button class="goto-btn" @click="gotoLineVisible = false">取消</button>
    </div>
    <div class="editor-wrap">
      <div class="search-highlight-layer" ref="highlightLayerRef" aria-hidden="true"></div>
      <div class="current-line-highlight" ref="currentLineRef" aria-hidden="true"></div>
      <div class="line-numbers" ref="lineNumbersRef">{{ lineNumbersText }}</div>
      <textarea
        ref="textareaRef"
        class="editor"
        :class="{ 'no-wrap': !wordWrap }"
        :value="modelValue"
        :style="{ fontSize: fontSize ? `${fontSize}px` : undefined, lineHeight: lineHeight ?? undefined }"
        :wrap="wordWrap === false ? 'off' : 'soft'"
        @input="onInput"
        @keydown="onKeydown"
        @paste="onPaste"
        @scroll="onScroll"
        @keyup="updateCursor"
        @click="updateCursor"
        @select="updateCursor"
        :spellcheck="spellcheck ?? true"
        placeholder="开始编写您的Markdown..."
      ></textarea>
    </div>
    <StatusBar
      :line="cursorInfo.line"
      :col="cursorInfo.col"
      :wordCount="wordCount"
      :charCount="charCount"
      :selectedChars="cursorInfo.selectedChars"
      :paragraphCount="paragraphCount"
      :wordGoal="wordGoal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import EditorToolbar from '@/components/EditorToolbar.vue'
import SearchBar from '@/components/SearchBar.vue'
import StatusBar from '@/components/StatusBar.vue'
import { useHistory } from '@/composables/useHistory'
import { useSearch } from '@/composables/useSearch'
import { useShortcuts } from '@/composables/useShortcuts'
import { useEditorMode } from '@/composables/useEditorMode'
import type { EditorMode } from '@/composables/usePreferences'

const props = defineProps<{
  modelValue: string
  charCount: number
  tabId: number
  fontSize?: number
  lineHeight?: number
  editorMode?: EditorMode
  wordGoal?: number
  wordWrap?: boolean
  spellcheck?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', value: string): void
  (e: 'scroll', scrollTop: number, scrollHeight: number, clientHeight: number): void
  (e: 'save'): void
  (e: 'close'): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const lineNumbersRef = ref<HTMLElement | null>(null)
const highlightLayerRef = ref<HTMLElement | null>(null)
const currentLineRef = ref<HTMLElement | null>(null)

// 行号
const lineNumbersText = computed(() => {
  const lines = props.modelValue.split('\n').length
  return Array.from({ length: lines }, (_, i) => i + 1).join('\n')
})

// --- Cursor tracking ---
const cursorInfo = ref({ line: 1, col: 1, selectedChars: 0 })

const updateCursor = () => {
  const el = textareaRef.value
  if (!el) return
  const pos = el.selectionStart
  const before = el.value.substring(0, pos)
  const lines = before.split('\n')
  cursorInfo.value = {
    line: lines.length,
    col: lines[lines.length - 1].length + 1,
    selectedChars: el.selectionEnd - el.selectionStart
  }
  updateCurrentLineHighlight()
}

// 当前行高亮
const updateCurrentLineHighlight = () => {
  const el = textareaRef.value
  const hl = currentLineRef.value
  if (!el || !hl) return
  const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 24
  const lineIdx = cursorInfo.value.line - 1
  hl.style.top = `${lineIdx * lineHeight - el.scrollTop + 16}px`
  hl.style.height = `${lineHeight}px`
}

const wordCount = computed(() => {
  const text = props.modelValue.trim()
  if (!text) return 0
  // 统计英文单词数 + 中文字符数，支持中英混排
  const englishWords = text.match(/[a-zA-Z0-9]+/g)?.length || 0
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0
  return englishWords + chineseChars
})

// 段落数：非空行数
const paragraphCount = computed(() => {
  const text = props.modelValue.trim()
  if (!text) return 0
  return text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
})

// --- History ---
const history = useHistory(computed(() => props.tabId))

// --- Editor mode (Vim/Emacs) ---
const modeRef = computed(() => props.editorMode ?? 'default')

const { handleKeydown: modeKeydown, vimMode, emacsPrefix, resetState: resetModeState } = useEditorMode(
  textareaRef,
  modeRef,
  {
    getValue: () => textareaRef.value?.value ?? props.modelValue,
    setValue: (val: string, start: number, end: number) => {
      const el = textareaRef.value
      if (!el) return
      emit('update', val)
      el.value = val
      el.setSelectionRange(start, end)
      history.push(val, start, end)
      updateCursor()
    },
    undo: () => undo(),
    redo: () => redo(),
    save: () => emit('save'),
    close: () => emit('close')
  }
)

const modeBadge = computed(() => {
  if (modeRef.value === 'vim') {
    const m = vimMode.value
    return m === 'insert' ? 'INSERT' : m === 'visual' ? 'VISUAL' : 'NORMAL'
  }
  if (modeRef.value === 'emacs') {
    return emacsPrefix.value === 'C-x' ? 'C-x-' : 'EMACS'
  }
  return ''
})

// --- Search ---
const searchVisible = ref(false)
const searchMode = ref<'search' | 'replace'>('search')

const search = useSearch(
  textareaRef,
  () => props.modelValue,
  (val: string) => emit('update', val)
)

const onSearchQueryChange = (val: string) => {
  search.searchQuery.value = val
  search.search()
}

const onCaseSensitiveChange = (val: boolean) => {
  search.caseSensitive.value = val
  search.search()
}

const openSearch = () => {
  searchMode.value = 'search'
  searchVisible.value = true
}

const openReplace = () => {
  searchMode.value = 'replace'
  searchVisible.value = true
}

const closeSearch = () => {
  searchVisible.value = false
  // 焦点回到编辑器
  requestAnimationFrame(() => textareaRef.value?.focus())
}

const updateSearchHighlights = () => {
  const layer = highlightLayerRef.value
  const el = textareaRef.value
  if (!layer || !el) return
  layer.innerHTML = ''
  if (!search.searchQuery.value || search.matchCount.value === 0) return
  const matches = search.getMatches()
  const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 24
  const charWidth = parseFloat(getComputedStyle(el).fontFamily) || 0
  // Use a mirror approach: measure character position
  const value = el.value
  for (const m of matches) {
    const beforeMatch = value.substring(0, m.start)
    const lines = beforeMatch.split('\n')
    const lineIdx = lines.length - 1
    const colIdx = lines[lines.length - 1].length
    const matchText = value.substring(m.start, m.end)
    const matchLines = matchText.split('\n')

    for (let i = 0; i < matchLines.length; i++) {
      const top = (lineIdx + i) * lineHeight - el.scrollTop
      const left = (i === 0 ? colIdx : 0)
      // Approximate char width using monospace font
      const charWidthApprox = parseFloat(getComputedStyle(el).fontSize) * 0.6
      const leftPx = left * charWidthApprox - el.scrollLeft + 16 // 16px padding
      const width = matchLines[i].length * charWidthApprox
      const highlight = document.createElement('div')
      highlight.className = 'search-highlight'
      highlight.style.top = `${top + 16}px`
      highlight.style.left = `${leftPx}px`
      highlight.style.width = `${width}px`
      highlight.style.height = `${lineHeight}px`
      layer.appendChild(highlight)
    }
  }
}

watch(() => search.matchCount.value, () => updateSearchHighlights())

// --- 跳转到行 ---
const gotoLineVisible = ref(false)
const gotoLineNum = ref(1)
const gotoInputRef = ref<HTMLInputElement | null>(null)

const openGotoLine = () => {
  gotoLineNum.value = cursorInfo.value.line
  gotoLineVisible.value = true
  requestAnimationFrame(() => gotoInputRef.value?.select())
}

const jumpToLine = () => {
  const el = textareaRef.value
  if (!el) return
  const targetLine = Math.max(1, gotoLineNum.value)
  const lines = el.value.split('\n')
  const targetLineIndex = Math.min(targetLine - 1, lines.length - 1)
  let pos = 0
  for (let i = 0; i < targetLineIndex; i++) pos += lines[i].length + 1
  el.setSelectionRange(pos, pos)
  const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 24
  el.scrollTop = (targetLineIndex) * lineHeight - el.clientHeight / 2
  gotoLineVisible.value = false
  el.focus()
  updateCursor()
}

// --- Shortcuts ---
const { register } = useShortcuts(textareaRef)

register('ctrl+b', (e) => { e.preventDefault(); insertFormat('bold') })
register('ctrl+i', (e) => { e.preventDefault(); insertFormat('italic') })
register('ctrl+k', (e) => { e.preventDefault(); insertFormat('link') })
register('ctrl+f', (e) => { e.preventDefault(); openSearch() })
register('ctrl+h', (e) => { e.preventDefault(); openReplace() })
register('ctrl+g', (e) => { e.preventDefault(); openGotoLine() })

// --- Undo/Redo ---
const undo = () => {
  const el = textareaRef.value
  if (!el) return
  // flush pending debounce，确保 canUndo 是最新状态
  history.flush()
  // 没有可撤销的内容，直接返回（避免误清空）
  if (!history.canUndo.value) return
  // 保存当前状态到 future
  history.pushToFuture(el.value, el.selectionStart, el.selectionEnd)
  const entry = history.undo()
  if (entry) {
    emit('update', entry.content)
    // 直接设置，不用 requestAnimationFrame，避免被 Vue 重新渲染覆盖
    el.value = entry.content
    el.setSelectionRange(entry.selectionStart, entry.selectionEnd)
    updateCursor()
  }
}

const redo = () => {
  const el = textareaRef.value
  if (!el) return
  if (!history.canRedo.value) return
  const entry = history.redo()
  if (entry) {
    emit('update', entry.content)
    el.value = entry.content
    el.setSelectionRange(entry.selectionStart, entry.selectionEnd)
    updateCursor()
  }
}

// --- Formatting ---
const insertFormat = (action: string) => {
  const el = textareaRef.value
  if (!el) return

  const start = el.selectionStart
  const end = el.selectionEnd
  const value = el.value
  const selected = value.substring(start, end)

  const inlineActions: Record<string, { wrap: string[]; placeholder: string }> = {
    bold: { wrap: ['**', '**'], placeholder: '粗体文本' },
    italic: { wrap: ['*', '*'], placeholder: '斜体文本' },
    strikethrough: { wrap: ['~~', '~~'], placeholder: '删除线文本' },
    code: { wrap: ['`', '`'], placeholder: '代码' },
    link: { wrap: ['[', '](https://)'], placeholder: '链接文本' },
    image: { wrap: ['![', '](https://)'], placeholder: '图片描述' },
  }

  const blockActions: Record<string, { prefix: string; placeholder: string }> = {
    h1: { prefix: '# ', placeholder: '标题1' },
    h2: { prefix: '## ', placeholder: '标题2' },
    h3: { prefix: '### ', placeholder: '标题3' },
    quote: { prefix: '> ', placeholder: '引用文本' },
    ul: { prefix: '- ', placeholder: '列表项' },
    ol: { prefix: '1. ', placeholder: '列表项' },
    task: { prefix: '- [ ] ', placeholder: '任务项' },
  }

  let newValue: string
  let newCursorStart: number
  let newCursorEnd: number

  if (inlineActions[action]) {
    const { wrap, placeholder } = inlineActions[action]
    const text = selected || placeholder
    newValue = value.substring(0, start) + wrap[0] + text + wrap[1] + value.substring(end)
    newCursorStart = start + wrap[0].length
    newCursorEnd = newCursorStart + text.length
  } else if (blockActions[action]) {
    const { prefix, placeholder } = blockActions[action]
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const currentLine = value.substring(lineStart, end)
    if (currentLine.startsWith(prefix)) {
      newValue = value.substring(0, lineStart) + currentLine.substring(prefix.length) + value.substring(end)
      newCursorStart = start - prefix.length
      newCursorEnd = end - prefix.length
    } else {
      const text = selected || placeholder
      newValue = value.substring(0, lineStart) + prefix + text + value.substring(end)
      newCursorStart = lineStart + prefix.length
      newCursorEnd = newCursorStart + text.length
    }
  } else if (action === 'table') {
    const table = '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n'
    newValue = value.substring(0, start) + table + value.substring(end)
    newCursorStart = newCursorEnd = start + table.length
  } else if (action === 'hr') {
    const hr = '\n---\n'
    newValue = value.substring(0, start) + hr + value.substring(end)
    newCursorStart = newCursorEnd = start + hr.length
  } else {
    return
  }

  emit('update', newValue)
  // 格式化操作也记录到历史
  history.push(newValue, newCursorStart, newCursorEnd)
  requestAnimationFrame(() => {
    el.value = newValue
    el.setSelectionRange(newCursorStart, newCursorEnd)
    el.focus()
    updateCursor()
  })
}

// --- 自动补全 ---
const handleAutoComplete = (e: KeyboardEvent) => {
  const el = textareaRef.value
  if (!el) return

  const pos = el.selectionStart
  const value = el.value
  const before = value.substring(0, pos)

  // 输入 ``` 后回车 → 补全代码块
  if (e.key === 'Enter' && /```\w*$/.test(before)) {
    const match = before.match(/```(\w*)$/)
    if (match) {
      e.preventDefault()
      const lang = match[1]
      const insert = `\n\n\`\`\`${lang ? '' : ''}\n`
      const newValue = value.substring(0, pos) + insert + value.substring(pos)
      emit('update', newValue)
      el.value = newValue
      const cursorPos = pos + 1
      el.setSelectionRange(cursorPos, cursorPos)
      history.push(newValue, cursorPos, cursorPos)
      updateCursor()
      return
    }
  }

  // 输入 | 后在表格行 → 自动补全列分隔
  if (e.key === '|' && before.split('\n').pop()?.includes('|')) {
    // 表格行已有一个 |，不再特殊处理
  }

  // 列表/任务项回车自动续行
  if (e.key === 'Enter' && !e.shiftKey) {
    const lineStart = value.lastIndexOf('\n', pos - 1) + 1
    const currentLine = value.substring(lineStart, pos)
    // 匹配列表标记：- / * / + / 1. / - [ ] / - [x]
    const listMatch = currentLine.match(/^(\s*)([-*+]\s+(?:\[[ x]\]\s+)?|\d+\.\s+)(.*)/)
    if (listMatch) {
      const indent = listMatch[1]
      const marker = listMatch[2]
      const content = listMatch[3]
      // 空列表项回车 → 取消列表标记
      if (content.trim() === '') {
        e.preventDefault()
        const newValue = value.substring(0, lineStart) + indent + value.substring(pos)
        emit('update', newValue)
        el.value = newValue
        el.setSelectionRange(lineStart + indent.length, lineStart + indent.length)
        history.push(newValue, lineStart + indent.length, lineStart + indent.length)
        updateCursor()
        return
      }
      // 续行：生成下一个列表标记
      e.preventDefault()
      let newMarker: string
      // 有序列表：序号+1
      const orderedMatch = marker.match(/^(\d+)\.\s+/)
      if (orderedMatch) {
        newMarker = `${parseInt(orderedMatch[1]) + 1}. `
      } else {
        // 任务列表：重置为未完成
        newMarker = marker.replace(/\[[x]\]/, '[ ]')
      }
      const insert = '\n' + indent + newMarker
      const newValue = value.substring(0, pos) + insert + value.substring(pos)
      emit('update', newValue)
      el.value = newValue
      const cursorPos = pos + insert.length
      el.setSelectionRange(cursorPos, cursorPos)
      history.push(newValue, cursorPos, cursorPos)
      updateCursor()
      return
    }
  }
}

// --- Paste handler: 图片粘贴 + URL 自动转 Markdown 链接/图片 ---
const onPaste = (e: ClipboardEvent) => {
  const clipboardData = e.clipboardData
  if (!clipboardData) return

  // 优先检测剪贴板中的图片文件（如截图）
  const imageItem = Array.from(clipboardData.items).find(
    item => item.type.startsWith('image/')
  )
  if (imageItem) {
    const file = imageItem.getAsFile()
    if (file) {
      e.preventDefault()
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        const el = textareaRef.value
        if (!el) return
        const start = el.selectionStart
        const end = el.selectionEnd
        const insert = `![图片](${base64})`
        const newValue = el.value.substring(0, start) + insert + el.value.substring(end)
        emit('update', newValue)
        el.value = newValue
        const cursorPos = start + insert.length
        el.setSelectionRange(cursorPos, cursorPos)
        history.push(newValue, cursorPos, cursorPos)
        updateCursor()
      }
      reader.readAsDataURL(file)
      return
    }
  }

  // 纯文本粘贴：检测 URL 自动转链接
  const text = clipboardData.getData('text/plain')
  if (!text) return

  // 判断是否是 URL（http/https 开头，无换行）
  const trimmed = text.trim()
  const isUrl = /^https?:\/\/\S+$/i.test(trimmed)
  if (!isUrl) return

  const el = textareaRef.value
  if (!el) return

  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = el.value.substring(start, end)

  e.preventDefault()

  // 判断是否是图片 URL（常见图片扩展名）
  const isImage = /\.(png|jpe?g|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(trimmed)

  let insert: string
  let cursorStart: number
  let cursorEnd: number

  if (isImage) {
    // 图片：![](url)，光标定位在 alt 文本处
    insert = `![${selected || '图片描述'}](${trimmed})`
    cursorStart = start + 2
    cursorEnd = cursorStart + (selected || '图片描述').length
  } else {
    // 链接：[文本](url)，有选中文本用它，无则光标定位在文本处
    const linkText = selected || '链接文本'
    insert = `[${linkText}](${trimmed})`
    cursorStart = start + 1
    cursorEnd = cursorStart + linkText.length
  }

  const newValue = el.value.substring(0, start) + insert + el.value.substring(end)
  emit('update', newValue)
  el.value = newValue
  el.setSelectionRange(cursorStart, cursorEnd)
  history.push(newValue, cursorStart, cursorEnd)
  updateCursor()
}

// --- Existing handlers ---
const onInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  // 确保输入前的内容（初始内容）在历史栈中，解决竞态条件
  history.ensureInitial(props.modelValue, target.selectionStart, target.selectionEnd)
  emit('update', target.value)
  history.push(target.value, target.selectionStart, target.selectionEnd)
  updateCursor()
}

const onKeydown = (e: KeyboardEvent) => {
  // 编辑器模式（Vim/Emacs）优先处理
  if (modeRef.value !== 'default' && modeKeydown(e)) return

  // 拦截撤销/重做，防止 textarea 原生行为冲突
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
    return
  }
  if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
    e.preventDefault()
    redo()
    return
  }

  // 自动配对符号（非 Vim/Emacs 模式，且无修饰键）
  if (modeRef.value === 'default' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (handleAutoPair(e)) return
    if (handleMarkdownWrap(e)) return
  }

  handleAutoComplete(e)
}

// --- Markdown 标记自动包裹 ---
const MD_WRAP_KEYS: Record<string, string> = {
  '*': '*',
  '~': '~',
  '`': '`',
  '_': '_',
}

const handleMarkdownWrap = (e: KeyboardEvent): boolean => {
  const el = textareaRef.value
  if (!el) return false

  const key = e.key
  if (!MD_WRAP_KEYS[key]) return false

  const start = el.selectionStart
  const end = el.selectionEnd
  if (start === end) return false // 无选区不处理（由自动配对处理）

  e.preventDefault()
  const value = el.value
  const selected = value.substring(start, end)
  const wrap = MD_WRAP_KEYS[key]
  const newValue = value.substring(0, start) + wrap + selected + wrap + value.substring(end)
  emit('update', newValue)
  el.value = newValue
  const newStart = start + wrap.length
  const newEnd = end + wrap.length
  el.setSelectionRange(newStart, newEnd)
  history.push(newValue, newStart, newEnd)
  updateCursor()
  return true
}

// --- 自动配对符号 ---
const PAIR_MAP: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
}

const handleAutoPair = (e: KeyboardEvent): boolean => {
  const el = textareaRef.value
  if (!el) return false

  const key = e.key
  const start = el.selectionStart
  const end = el.selectionEnd
  const value = el.value

  // 1) 输入开括号 → 自动补全闭括号
  if (PAIR_MAP[key]) {
    const close = PAIR_MAP[key]
    // 引号类：如果光标后已是闭引号或非空白，不自动配对
    if (key === close && (key === '"' || key === "'" || key === '`')) {
      // 输入与闭合相同（引号）：如果前面有未配对的开引号则闭合，否则配对
      const before = value.substring(0, start)
      const lastUnmatched = before.lastIndexOf(key)
      const afterMatch = before.substring(lastUnmatched + 1)
      if (lastUnmatched !== -1 && afterMatch.split(key).length % 2 === 1) {
        // 有未配对的开引号，不自动配对，让用户手动闭合
        return false
      }
    }

    e.preventDefault()
    const selected = value.substring(start, end)
    const insert = key + selected + close
    const newValue = value.substring(0, start) + insert + value.substring(end)
    emit('update', newValue)
    el.value = newValue
    if (selected) {
      el.setSelectionRange(start + 1, start + 1 + selected.length)
    } else {
      el.setSelectionRange(start + 1, start + 1)
    }
    history.push(newValue, el.selectionStart, el.selectionEnd)
    updateCursor()
    return true
  }

  // 2) 按 Backspace 且光标在配对符号中间 → 同时删除两个
  if (e.key === 'Backspace' && start === end && start > 0) {
    const prev = value[start - 1]
    const next = value[start]
    if (PAIR_MAP[prev] && PAIR_MAP[prev] === next) {
      e.preventDefault()
      const newValue = value.substring(0, start - 1) + value.substring(start + 1)
      emit('update', newValue)
      el.value = newValue
      el.setSelectionRange(start - 1, start - 1)
      history.push(newValue, start - 1, start - 1)
      updateCursor()
      return true
    }
  }

  // 3) Tab/Shift+Tab 多行缩进（有选区时）
  if (e.key === 'Tab' && start !== end) {
    e.preventDefault()
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const selectedText = value.substring(lineStart, end)
    const lines = selectedText.split('\n')

    if (e.shiftKey) {
      // 反向缩进：移除每行开头的 2 空格或 1 tab
      const newLines = lines.map(line => line.replace(/^(\t| {1,2})/, ''))
      const newText = newLines.join('\n')
      const newValue = value.substring(0, lineStart) + newText + value.substring(end)
      emit('update', newValue)
      el.value = newValue
      const removed = selectedText.length - newText.length
      el.setSelectionRange(lineStart, end - removed)
      history.push(newValue, lineStart, end - removed)
    } else {
      // 正向缩进：每行开头加 2 空格
      const newLines = lines.map(line => '  ' + line)
      const newText = newLines.join('\n')
      const newValue = value.substring(0, lineStart) + newText + value.substring(end)
      emit('update', newValue)
      el.value = newValue
      const added = newText.length - selectedText.length
      el.setSelectionRange(lineStart, end + added)
      history.push(newValue, lineStart, end + added)
    }
    updateCursor()
    return true
  }

  // 4) 按 Tab 在配对符号中间 → 跳出到闭括号后
  if (e.key === 'Tab' && start === end && start > 0) {
    const prev = value[start - 1]
    const next = value[start]
    if (PAIR_MAP[prev] && PAIR_MAP[prev] === next) {
      e.preventDefault()
      el.setSelectionRange(start + 1, start + 1)
      return true
    }
  }

  return false
}

const onScroll = () => {
  const el = textareaRef.value
  if (el) {
    emit('scroll', el.scrollTop, el.scrollHeight, el.clientHeight)
    // 同步行号滚动
    if (lineNumbersRef.value) {
      lineNumbersRef.value.scrollTop = el.scrollTop
    }
  }
  updateSearchHighlights()
  updateCurrentLineHighlight()
}

// Update cursor when tab changes，并初始化历史记录
watch(() => props.tabId, () => {
  resetModeState()
  requestAnimationFrame(() => {
    updateCursor()
    // 切换标签时，将当前内容作为历史初始状态（同步 push，不走 debounce）
    const el = textareaRef.value
    if (el) {
      history.pushToPast(el.value, el.selectionStart, el.selectionEnd)
    }
  })
})

defineExpose({
  setScrollRatio: (ratio: number) => {
    const el = textareaRef.value
    if (el) {
      const scrollHeight = el.scrollHeight - el.clientHeight
      if (scrollHeight > 0) {
        el.scrollTop = ratio * scrollHeight
      }
    }
  },
  insertFormat,
  undo,
  redo,
  openSearch,
  openReplace
})
</script>

<style scoped>
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  overflow: hidden;
  min-height: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
}

.file-info {
  font-size: 12px;
  color: var(--text-tertiary);
}

.panel-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
}

.mode-badge.mode-normal {
  color: #6366f1;
  border-color: #6366f1;
}

.mode-badge.mode-insert {
  color: #10b981;
  border-color: #10b981;
}

.mode-badge.mode-visual {
  color: #f59e0b;
  border-color: #f59e0b;
}

.mode-badge.mode-emacs,
.mode-badge.mode-c-x- {
  color: #3b82f6;
  border-color: #3b82f6;
}

.editor-wrap {
  flex: 1;
  display: flex;
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.search-highlight-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.current-line-highlight {
  position: absolute;
  left: 0;
  right: 0;
  background: var(--bg-tertiary);
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

.search-highlight {
  position: absolute;
  background: rgba(255, 213, 79, 0.3);
  border-radius: 2px;
}

.line-numbers {
  flex-shrink: 0;
  padding: 16px 8px 16px 12px;
  text-align: right;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  overflow: hidden;
  user-select: none;
  white-space: pre;
  border-right: 1px solid var(--border);
}

.editor {
  flex: 1;
  padding: 16px;
  border: none;
  resize: none;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
  background: transparent;
  outline: none;
  min-height: 0;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.editor::placeholder {
  color: var(--text-tertiary);
}

.editor.no-wrap {
  white-space: pre;
  overflow-x: auto;
}

.editor.no-wrap {
  white-space: pre;
  overflow-x: auto;
}

.goto-line-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-tertiary);
  flex-shrink: 0;
}

.goto-input {
  width: 100px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 13px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
}

.goto-input:focus {
  border-color: var(--accent);
}

.goto-btn {
  padding: 4px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
}

.goto-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
</style>
