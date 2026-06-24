<template>
  <div class="editor-panel">
    <div class="panel-header">
      <span class="panel-title">EDITOR</span>
      <span class="file-info">{{ charCount }} 字符</span>
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
      :matchCount="search.matchCount.value"
      :currentMatch="search.currentMatch.value"
      @update:searchQuery="onSearchQueryChange"
      @update:replaceQuery="search.replaceQuery.value = $event"
      @update:caseSensitive="onCaseSensitiveChange"
      @next="search.findNext()"
      @prev="search.findPrev()"
      @replace="search.replace()"
      @replaceAll="search.replaceAll()"
      @close="closeSearch"
    />
    <textarea
      ref="textareaRef"
      class="editor"
      :value="modelValue"
      :style="{ fontSize: fontSize ? `${fontSize}px` : undefined, lineHeight: lineHeight ?? undefined }"
      @input="onInput"
      @scroll="onScroll"
      @keyup="updateCursor"
      @click="updateCursor"
      @select="updateCursor"
      placeholder="开始编写您的Markdown..."
    ></textarea>
    <StatusBar
      :line="cursorInfo.line"
      :col="cursorInfo.col"
      :wordCount="wordCount"
      :charCount="charCount"
      :selectedChars="cursorInfo.selectedChars"
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

const props = defineProps<{
  modelValue: string
  charCount: number
  tabId: number
  fontSize?: number
  lineHeight?: number
}>()

const emit = defineEmits<{
  (e: 'update', value: string): void
  (e: 'scroll', scrollTop: number, scrollHeight: number, clientHeight: number): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

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
}

const wordCount = computed(() => {
  const text = props.modelValue.trim()
  if (!text) return 0
  // 统计英文单词数 + 中文字符数，支持中英混排
  const englishWords = text.match(/[a-zA-Z0-9]+/g)?.length || 0
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0
  return englishWords + chineseChars
})

// --- History ---
const history = useHistory(computed(() => props.tabId))

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
}

// --- Shortcuts ---
const { register } = useShortcuts(textareaRef)

register('ctrl+b', (e) => { e.preventDefault(); insertFormat('bold') })
register('ctrl+i', (e) => { e.preventDefault(); insertFormat('italic') })
register('ctrl+k', (e) => { e.preventDefault(); insertFormat('link') })
register('ctrl+f', (e) => { e.preventDefault(); openSearch() })
register('ctrl+h', (e) => { e.preventDefault(); openReplace() })
register('ctrl+z', (e) => { e.preventDefault(); undo() })
register('ctrl+y', (e) => { e.preventDefault(); redo() })
register('ctrl+shift+z', (e) => { e.preventDefault(); redo() })

// --- Undo/Redo ---
const undo = () => {
  const el = textareaRef.value
  if (!el) return
  history.pushToFuture(el.value, el.selectionStart, el.selectionEnd)
  const entry = history.undo()
  if (entry) {
    emit('update', entry.content)
    requestAnimationFrame(() => {
      el.value = entry.content
      el.setSelectionRange(entry.selectionStart, entry.selectionEnd)
      updateCursor()
    })
  }
}

const redo = () => {
  const el = textareaRef.value
  if (!el) return
  history.pushToPast(el.value, el.selectionStart, el.selectionEnd)
  const entry = history.redo()
  if (entry) {
    emit('update', entry.content)
    requestAnimationFrame(() => {
      el.value = entry.content
      el.setSelectionRange(entry.selectionStart, entry.selectionEnd)
      updateCursor()
    })
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
  requestAnimationFrame(() => {
    el.value = newValue
    el.setSelectionRange(newCursorStart, newCursorEnd)
    el.focus()
    updateCursor()
  })
}

// --- Existing handlers ---
const onInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  emit('update', target.value)
  history.push(target.value, target.selectionStart, target.selectionEnd)
  updateCursor()
}

const onScroll = () => {
  const el = textareaRef.value
  if (el) {
    emit('scroll', el.scrollTop, el.scrollHeight, el.clientHeight)
  }
}

// Update cursor when tab changes
watch(() => props.tabId, () => {
  requestAnimationFrame(updateCursor)
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
}

.editor::placeholder {
  color: var(--text-tertiary);
}
</style>
