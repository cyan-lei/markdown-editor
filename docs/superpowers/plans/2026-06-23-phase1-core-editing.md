# Phase 1: Core Editing Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a formatting toolbar, custom undo/redo, search & replace, status bar, and keyboard shortcut system to the markdown editor.

**Architecture:** Three new composables (useShortcuts, useHistory, useSearch) provide pure logic. Three new Vue components (EditorToolbar, SearchBar, StatusBar) provide UI. EditorPanel integrates everything and exposes methods. EditorView wires global shortcuts.

**Tech Stack:** Vue 3 + TypeScript, Vite, existing marked/highlight.js stack.

## Global Constraints

- TypeScript strict mode (project uses `lang="ts"` in all SFCs)
- No new npm dependencies — use only vue, marked, highlight.js already installed
- Follow existing patterns: composables in `src/composables/`, components in `src/components/`
- Use `@/` alias for imports (configured in vite.config.js)
- Verification: `npm run build` must pass with exit code 0 after each task
- Existing global CSS classes `.btn-primary`, `.btn-secondary`, `.btn-icon` are available (defined in `src/styles/base.css`)

---

### Task 1: useShortcuts.ts — Keyboard Shortcut Manager

**Files:**
- Create: `src/composables/useShortcuts.ts`

**Interfaces:**
- Produces: `useShortcuts(target: 'window' | Ref<HTMLElement | null>)` → `{ register(combo, handler), unregister(combo) }`

- [ ] **Step 1: Create the composable**

```typescript
// src/composables/useShortcuts.ts
import { onMounted, onUnmounted, type Ref } from 'vue'

type ShortcutHandler = (e: KeyboardEvent) => void

function normalizeCombo(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('ctrl')
  if (e.shiftKey) parts.push('shift')
  if (e.altKey) parts.push('alt')
  const key = e.key.toLowerCase()
  // Skip pure modifier presses
  if (['control', 'shift', 'alt', 'meta'].includes(key)) return ''
  parts.push(key)
  return parts.join('+')
}

export function useShortcuts(target: 'window' | Ref<HTMLElement | null>) {
  const handlers = new Map<string, ShortcutHandler>()

  const handleKeydown = (e: KeyboardEvent) => {
    const combo = normalizeCombo(e)
    if (!combo) return
    const handler = handlers.get(combo)
    if (handler) {
      handler(e)
    }
  }

  const register = (combo: string, handler: ShortcutHandler) => {
    handlers.set(combo.toLowerCase(), handler)
  }

  const unregister = (combo: string) => {
    handlers.delete(combo.toLowerCase())
  }

  let targetEl: EventTarget

  onMounted(() => {
    if (target === 'window') {
      targetEl = window
    } else {
      targetEl = target.value || window
    }
    targetEl.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    targetEl.removeEventListener('keydown', handleKeydown)
  })

  return { register, unregister }
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: exit code 0, no errors

---

### Task 2: useHistory.ts — Per-Tab Undo/Redo

**Files:**
- Create: `src/composables/useHistory.ts`

**Interfaces:**
- Produces: `useHistory(tabId: Ref<number | null>)` → `{ push(content, selStart, selEnd), undo(): HistoryEntry | null, redo(): HistoryEntry | null, canUndo: Ref<boolean>, canRedo: Ref<boolean>, clear(id: number) }`

- [ ] **Step 1: Create the composable**

```typescript
// src/composables/useHistory.ts
import { ref, type Ref } from 'vue'

export interface HistoryEntry {
  content: string
  selectionStart: number
  selectionEnd: number
}

interface HistoryStack {
  past: HistoryEntry[]
  future: HistoryEntry[]
}

const MAX_HISTORY = 100
const DEBOUNCE_MS = 500

// Module-level: persists across component re-renders / tab switches
const histories = new Map<number, HistoryStack>()
const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>()

function getStack(tabId: number): HistoryStack {
  if (!histories.has(tabId)) {
    histories.set(tabId, { past: [], future: [] })
  }
  return histories.get(tabId)!
}

export function useHistory(tabId: Ref<number | null>) {
  const canUndo = ref(false)
  const canRedo = ref(false)

  const updateFlags = (id: number) => {
    const stack = getStack(id)
    canUndo.value = stack.past.length > 0
    canRedo.value = stack.future.length > 0
  }

  const push = (content: string, selectionStart: number, selectionEnd: number) => {
    const id = tabId.value
    if (id === null) return

    // Debounce: clear pending timer, set a new one
    const existing = debounceTimers.get(id)
    if (existing) clearTimeout(existing)

    debounceTimers.set(id, setTimeout(() => {
      const stack = getStack(id)
      stack.past.push({ content, selectionStart, selectionEnd })
      if (stack.past.length > MAX_HISTORY) stack.past.shift()
      stack.future = [] // new change invalidates redo
      updateFlags(id)
      debounceTimers.delete(id)
    }, DEBOUNCE_MS))
  }

  const undo = (): HistoryEntry | null => {
    const id = tabId.value
    if (id === null) return null
    const stack = getStack(id)

    // Flush any pending debounce first
    const timer = debounceTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      debounceTimers.delete(id)
    }

    const entry = stack.past.pop()
    if (!entry) return null
    updateFlags(id)
    return entry
  }

  const redo = (): HistoryEntry | null => {
    const id = tabId.value
    if (id === null) return null
    const stack = getStack(id)
    const entry = stack.future.pop()
    if (!entry) return null
    updateFlags(id)
    return entry
  }

  // Called by undo/redo to push the CURRENT state to the opposite stack
  const pushToFuture = (content: string, selectionStart: number, selectionEnd: number) => {
    const id = tabId.value
    if (id === null) return
    const stack = getStack(id)
    stack.future.push({ content, selectionStart, selectionEnd })
    updateFlags(id)
  }

  const pushToPast = (content: string, selectionStart: number, selectionEnd: number) => {
    const id = tabId.value
    if (id === null) return
    const stack = getStack(id)
    stack.past.push({ content, selectionStart, selectionEnd })
    if (stack.past.length > MAX_HISTORY) stack.past.shift()
    updateFlags(id)
  }

  const clear = (id: number) => {
    clearHistory(id)
  }

  return {
    push,
    undo,
    redo,
    pushToFuture,
    pushToPast,
    canUndo,
    canRedo,
    clear
  }
}

// Standalone cleanup — use when closing a tab (no need to instantiate full composable)
export function clearHistory(tabId: number) {
  histories.delete(tabId)
  const timer = debounceTimers.get(tabId)
  if (timer) {
    clearTimeout(timer)
    debounceTimers.delete(tabId)
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: exit code 0, no errors

---

### Task 3: useSearch.ts — Search & Replace Logic

**Files:**
- Create: `src/composables/useSearch.ts`

**Interfaces:**
- Produces: `useSearch(textareaRef: Ref<HTMLTextAreaElement | null>, getContent: () => string, setContent: (val: string) => void)` → `{ searchQuery, replaceQuery, caseSensitive, matchCount, currentMatch, search(), findNext(), findPrev(), replace(), replaceAll() }`

- [ ] **Step 1: Create the composable**

```typescript
// src/composables/useSearch.ts
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
  const currentMatch = ref(0) // 0-indexed, -1 means no match selected

  let matches: { start: number; end: number }[] = []

  const findMatches = (text: string, query: string, cs: boolean): { start: number; end: number }[] => {
    if (!query) return []
    const flags = cs ? 'g' : 'gi'
    // Escape regex special chars in query for literal search
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, flags)
    const result: { start: number; end: number }[] = []
    let m: RegExpExecArray | null
    while ((m = regex.exec(text)) !== null) {
      result.push({ start: m.index, end: m.index + m[0].length })
      if (m[0].length === 0) regex.lastIndex++ // avoid infinite loop on empty match
    }
    return result
  }

  const selectMatch = (index: number) => {
    const el = textareaRef.value
    if (!el || index < 0 || index >= matches.length) return
    const m = matches[index]
    el.focus()
    el.setSelectionRange(m.start, m.end)
    // Scroll to match
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

    // Recalculate matches after replacement
    const offsetDiff = replaceQuery.value.length - (m.end - m.start)
    matches = findMatches(newText, searchQuery.value, caseSensitive.value)
    matchCount.value = matches.length

    // Advance to next match, adjusting offsets
    if (matches.length > 0) {
      // Find the next match after the replacement position
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
    const escaped = searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const flags = caseSensitive.value ? 'g' : 'gi'
    const regex = new RegExp(escaped, flags)
    const newText = text.replace(regex, replaceQuery.value)
    setContent(newText)
    matches = []
    matchCount.value = 0
    currentMatch.value = -1
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
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: exit code 0, no errors

---

### Task 4: StatusBar.vue — Bottom Status Bar

**Files:**
- Create: `src/components/StatusBar.vue`

**Interfaces:**
- Consumes: props `{ line: number, col: number, wordCount: number, charCount: number, selectedChars: number }`

- [ ] **Step 1: Create the component**

```vue
<!-- src/components/StatusBar.vue -->
<template>
  <div class="status-bar">
    <span class="status-item">Ln {{ line }}, Col {{ col }}</span>
    <span class="status-sep">|</span>
    <span class="status-item">词数: {{ wordCount }}</span>
    <span class="status-sep">|</span>
    <span class="status-item">字符: {{ charCount }}</span>
    <template v-if="selectedChars > 0">
      <span class="status-sep">|</span>
      <span class="status-item">已选: {{ selectedChars }} 字符</span>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  line: number
  col: number
  wordCount: number
  charCount: number
  selectedChars: number
}>()
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.status-sep {
  color: var(--border);
}
</style>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: exit code 0, no errors

---

### Task 5: EditorToolbar.vue — Formatting Toolbar

**Files:**
- Create: `src/components/EditorToolbar.vue`

**Interfaces:**
- Produces: emits `format(action: string)` and `undo()` / `redo()` events
- Consumes: props `{ canUndo: boolean, canRedo: boolean }`

- [ ] **Step 1: Create the component**

```vue
<!-- src/components/EditorToolbar.vue -->
<template>
  <div class="editor-toolbar">
    <div class="toolbar-group">
      <button class="toolbar-btn" @click="$emit('undo')" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6.7 3L3 13"/>
        </svg>
      </button>
      <button class="toolbar-btn" @click="$emit('redo')" :disabled="!canRedo" title="重做 (Ctrl+Y)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016.7 3L21 13"/>
        </svg>
      </button>
    </div>

    <span class="toolbar-divider"></span>

    <div class="toolbar-group">
      <button class="toolbar-btn" @click="$emit('format', 'bold')" title="加粗 (Ctrl+B)">
        <span class="btn-text"><b>B</b></span>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'italic')" title="斜体 (Ctrl+I)">
        <span class="btn-text"><i>I</i></span>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'strikethrough')" title="删除线">
        <span class="btn-text"><s>S</s></span>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'code')" title="行内代码">
        <span class="btn-text"><code>&lt;/&gt;</code></span>
      </button>
    </div>

    <span class="toolbar-divider"></span>

    <div class="toolbar-group">
      <button class="toolbar-btn" @click="$emit('format', 'h1')" title="标题1">
        <span class="btn-text">H1</span>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'h2')" title="标题2">
        <span class="btn-text">H2</span>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'h3')" title="标题3">
        <span class="btn-text">H3</span>
      </button>
    </div>

    <span class="toolbar-divider"></span>

    <div class="toolbar-group">
      <button class="toolbar-btn" @click="$emit('format', 'quote')" title="引用">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1-1-2-2-2H4c-1 0-2 1-2 2v8c0 1 1 2 2 2h3"/><path d="M15 21c3 0 7-1 7-8V5c0-1-1-2-2-2h-4c-1 0-2 1-2 2v8c0 1 1 2 2 2h3"/></svg>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'ul')" title="无序列表">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5" fill="currentColor"/><circle cx="3.5" cy="12" r="1.5" fill="currentColor"/><circle cx="3.5" cy="18" r="1.5" fill="currentColor"/></svg>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'ol')" title="有序列表">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'task')" title="任务列表">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      </button>
    </div>

    <span class="toolbar-divider"></span>

    <div class="toolbar-group">
      <button class="toolbar-btn" @click="$emit('format', 'link')" title="链接 (Ctrl+K)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'image')" title="图片">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'table')" title="表格">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'hr')" title="分隔线">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="12" x2="20" y2="12"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canUndo: boolean
  canRedo: boolean
}>()

defineEmits<{
  (e: 'format', action: string): void
  (e: 'undo'): void
  (e: 'redo'): void
}>()
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-tertiary);
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.editor-toolbar::-webkit-scrollbar {
  display: none;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 4px;
  flex-shrink: 0;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.toolbar-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.btn-text {
  font-size: 13px;
  font-weight: 500;
}

.btn-text code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
</style>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: exit code 0, no errors

---

### Task 6: SearchBar.vue — Search & Replace UI

**Files:**
- Create: `src/components/SearchBar.vue`

**Interfaces:**
- Consumes: props `{ mode: 'search' | 'replace', searchQuery: string, replaceQuery: string, caseSensitive: boolean, matchCount: number, currentMatch: number }`
- Produces: emits `update:searchQuery`, `update:replaceQuery`, `update:caseSensitive`, `search`, `next`, `prev`, `replace`, `replaceAll`, `close`

- [ ] **Step 1: Create the component**

```vue
<!-- src/components/SearchBar.vue -->
<template>
  <div class="search-bar">
    <div class="search-row">
      <input
        class="search-input"
        type="text"
        :value="searchQuery"
        @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        @keydown.enter.prevent="$emit('next')"
        @keydown.esc.prevent="$emit('close')"
        placeholder="搜索..."
        ref="searchInputRef"
      />
      <button
        class="search-toggle"
        :class="{ active: caseSensitive }"
        @click="$emit('update:caseSensitive', !caseSensitive)"
        title="区分大小写"
      >Aa</button>
      <span class="match-info" v-if="searchQuery">
        {{ matchCount > 0 ? currentMatch + 1 : 0 }}/{{ matchCount }}
      </span>
      <button class="search-btn" @click="$emit('prev')" :disabled="matchCount === 0" title="上一个">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
      </button>
      <button class="search-btn" @click="$emit('next')" :disabled="matchCount === 0" title="下一个">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <button class="search-btn close-btn" @click="$emit('close')" title="关闭 (Esc)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="search-row" v-if="mode === 'replace'">
      <input
        class="search-input"
        type="text"
        :value="replaceQuery"
        @input="$emit('update:replaceQuery', ($event.target as HTMLInputElement).value)"
        @keydown.esc.prevent="$emit('close')"
        placeholder="替换为..."
      />
      <button class="replace-btn" @click="$emit('replace')" :disabled="matchCount === 0">替换</button>
      <button class="replace-btn" @click="$emit('replaceAll')" :disabled="matchCount === 0">全部替换</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  mode: 'search' | 'replace'
  searchQuery: string
  replaceQuery: string
  caseSensitive: boolean
  matchCount: number
  currentMatch: number
}>()

defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:replaceQuery', value: string): void
  (e: 'update:caseSensitive', value: boolean): void
  (e: 'search'): void
  (e: 'next'): void
  (e: 'prev'): void
  (e: 'replace'): void
  (e: 'replaceAll'): void
  (e: 'close'): void
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  searchInputRef.value?.focus()
})

// Reference props to avoid unused warning
void props
</script>

<style scoped>
.search-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-tertiary);
  flex-shrink: 0;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-input {
  flex: 1;
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 13px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
  min-width: 0;
}

.search-input:focus {
  border-color: var(--accent);
}

.search-toggle {
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}

.search-toggle.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.match-info {
  font-size: 12px;
  color: var(--text-tertiary);
  min-width: 50px;
  text-align: center;
  flex-shrink: 0;
}

.search-btn,
.replace-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.search-btn:hover:not(:disabled),
.replace-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.search-btn:disabled,
.replace-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.close-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
}
</style>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: exit code 0, no errors

---

### Task 7: EditorPanel.vue — Integration Hub

**Files:**
- Modify: `src/components/EditorPanel.vue` (full rewrite)

**Interfaces:**
- Consumes from earlier tasks: `useHistory`, `useSearch`, `useShortcuts`, `EditorToolbar`, `SearchBar`, `StatusBar`
- New props: `tabId: number` (in addition to existing `modelValue`, `charCount`)
- New emits: none new (keeps `update`, `scroll`)
- Exposes: `insertFormat(action)`, `undo()`, `redo()`, `openSearch()`, `openReplace()`, `setScrollRatio(ratio)`

- [ ] **Step 1: Rewrite EditorPanel.vue**

```vue
<!-- src/components/EditorPanel.vue -->
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
  return text.split(/\s+/).length
})

// --- History ---
const history = useHistory(computed(() => props.tabId))

// Push to history on user input (debounced inside useHistory).
// NOT using watch on modelValue — tab switches would create spurious history entries.

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
  // Push current state to future before undoing
  history.pushToFuture(el.value, el.selectionStart, el.selectionEnd)
  const entry = history.undo()
  if (entry) {
    emit('update', entry.content)
    // Restore cursor in next tick after value is updated
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
  // Push current state to past before redoing
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
    // Find start of current line
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    // Check if line already starts with the prefix
    const currentLine = value.substring(lineStart, end)
    if (currentLine.startsWith(prefix)) {
      // Remove prefix
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
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: exit code 0, no errors

- [ ] **Step 3: Check TypeScript diagnostics**

Run: GetDiagnostics on `src/components/EditorPanel.vue`
Expected: no errors

---

### Task 8: EditorView.vue — Wire Global Shortcuts

**Files:**
- Modify: `src/views/EditorView.vue` (update script section)

**Interfaces:**
- Consumes from earlier tasks: `useShortcuts` for global shortcuts
- Changes: replace manual `handleKeydown` with `useShortcuts('window')`, pass `tabId` to EditorPanel, clean history on tab close

- [ ] **Step 1: Update EditorView.vue**

Replace the `<script setup>` section. Key changes:
1. Import `useShortcuts` instead of manual keydown
2. Add `tabId` prop to EditorPanel
3. Register global shortcuts: ctrl+n, ctrl+o, ctrl+w, ctrl+tab, ctrl+s
4. Import `useHistory` for cleanup on tab close
5. Remove `handleKeydown`, `onMounted`/`onUnmounted` for keydown

```vue
<!-- src/views/EditorView.vue -->
<template>
  <div class="editor-view">
    <AppHeader>
      <template #actions>
        <button
          class="btn-icon"
          @click="themeService.toggle()"
          :title="themeService.isDark.value ? '切换浅色模式' : '切换深色模式'"
        >
          <AppIcon
            :name="themeService.isDark.value ? 'sun' : 'moon'"
            :color="themeService.isDark.value ? '#f59e0b' : '#6366f1'"
          />
        </button>
        <button class="btn-secondary" @click="handleOpenFiles">
          <AppIcon name="folderOpen" :size="16" />
          打开
        </button>
        <button class="btn-secondary" @click="handleSave">
          <AppIcon name="save" :size="16" />
          保存
        </button>
        <button class="btn-secondary" @click="handleNewFile">
          <AppIcon name="filePlus" :size="16" />
          新建
        </button>
        <button class="btn-primary" @click="handleExport">
          <AppIcon name="download" :size="16" />
          导出
        </button>
      </template>
    </AppHeader>

    <TabBar
      :tabs="tabs"
      :activeTabId="activeTabId"
      @switch="switchTab"
      @close="handleCloseTab"
    />

    <main class="main">
      <template v-if="hasTabs">
        <EditorPanel
          ref="editorPanelRef"
          :modelValue="activeTabContent"
          :charCount="charCount"
          :tabId="activeTabId!"
          @update="updateContent"
          :style="{ flex: `0 0 ${dividerPosition}%` }"
          @scroll="handleEditorScroll"
        />
        <div class="divider" @mousedown="startDrag"></div>
        <PreviewPanel
          ref="previewPanelRef"
          :html="previewHtml"
          :style="{ flex: `0 0 ${100 - dividerPosition}%` }"
        />
      </template>
      <EmptyState v-else @open="handleOpenFiles" />
    </main>

    <ConfirmModal
      :visible="showSaveModal"
      title="保存文件"
      message="确定要保存文件吗？"
      @confirm="confirmSave"
      @cancel="showSaveModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import TabBar from '@/components/TabBar.vue'
import EditorPanel from '@/components/EditorPanel.vue'
import PreviewPanel from '@/components/PreviewPanel.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { useEditor } from '@/composables/useEditor'
import { useDividerDrag } from '@/composables/useDividerDrag'
import { useShortcuts } from '@/composables/useShortcuts'
import { fileService } from '@/services/fileService'
import { themeService } from '@/services/themeService'
import { editorService } from '@/services/editorService'
import { clearHistory } from '@/composables/useHistory'

const showSaveModal = ref(false)
const editorPanelRef = ref<InstanceType<typeof EditorPanel> | null>(null)
const previewPanelRef = ref<InstanceType<typeof PreviewPanel> | null>(null)

const { dividerPosition, startDrag } = useDividerDrag()

const {
  tabs,
  activeTabId,
  activeTabContent,
  previewHtml,
  charCount,
  hasTabs,
  newFile,
  switchTab,
  closeTab,
  updateContent,
  markSaved,
  createTab,
  addTab
} = useEditor()

const handleEditorScroll = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
  const ratio = scrollHeight <= clientHeight ? 0 : scrollTop / (scrollHeight - clientHeight)
  previewPanelRef.value?.setScrollRatio(ratio)
}

const handleNewFile = () => newFile()

const handleOpenFiles = async () => {
  const newTabs = await fileService.openFiles()
  newTabs.forEach(({ name, content, fileHandle }) => {
    addTab(createTab(name, content, fileHandle))
  })
}

const handleSave = async () => {
  const tab = tabs.value.find(t => t.id === activeTabId.value)
  if (!tab) return

  if (tab.fileHandle) {
    const success = await fileService.saveFile(tab)
    if (success) markSaved()
  } else {
    await fileService.saveAsFile(tab)
  }
}

const confirmSave = async () => {
  showSaveModal.value = false
  const tab = tabs.value.find(t => t.id === activeTabId.value)
  if (!tab) return

  const success = await fileService.saveFile(tab)
  if (success) markSaved()
}

const handleCloseTab = (id: number) => {
  const tab = tabs.value.find(t => t.id === id)
  if (!tab || !editorService.closeTabWithCheck(tab)) return
  // Clean up history for this tab
  clearHistory(id)
  closeTab(id)
}

const handleExport = async () => {
  const tab = tabs.value.find(t => t.id === activeTabId.value)
  if (!tab) return
  await fileService.downloadFile(tab)
}

const switchToNextTab = () => {
  if (tabs.value.length < 2) return
  const currentIndex = tabs.value.findIndex(t => t.id === activeTabId.value)
  const nextIndex = (currentIndex + 1) % tabs.value.length
  switchTab(tabs.value[nextIndex].id)
}

// --- Global shortcuts ---
const { register } = useShortcuts('window')

register('ctrl+n', (e) => { e.preventDefault(); handleNewFile() })
register('ctrl+o', (e) => { e.preventDefault(); handleOpenFiles() })
register('ctrl+w', (e) => {
  if (activeTabId.value !== null) {
    e.preventDefault()
    handleCloseTab(activeTabId.value)
  }
})
register('ctrl+tab', (e) => { e.preventDefault(); switchToNextTab() })
register('ctrl+s', (e) => { e.preventDefault(); handleSave() })

// Initialize theme
onMounted(() => {
  themeService.init()
})
</script>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: exit code 0, no errors

- [ ] **Step 3: Check TypeScript diagnostics**

Run: GetDiagnostics on `src/views/EditorView.vue`
Expected: no errors

---

### Task 9: Final Build & Integration Verification

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: exit code 0, no errors, no warnings about missing imports

- [ ] **Step 2: Check diagnostics on all modified files**

Check EditorView.vue, EditorPanel.vue, and all new files for TypeScript errors.
Expected: zero diagnostics across all files

- [ ] **Step 3: Manual smoke test checklist**

Start dev server with `npm run dev` and verify:
1. Toolbar appears with formatting buttons — clicking Bold inserts `**粗体文本**`
2. Ctrl+Z undoes a change, Ctrl+Y redoes it
3. Ctrl+F opens search bar, typing a query highlights matches and shows count
4. Ctrl+H opens replace bar, replace and replace all work
5. Status bar shows line/col, word count, char count, selection count
6. Ctrl+N creates new tab, Ctrl+W closes tab, Ctrl+Tab switches tabs
7. Switching tabs preserves undo history
8. Ctrl+B/I/K format shortcuts work
9. Search bar Esc closes the bar
