import { ref, computed, watch, type Ref } from 'vue'
import type { EditorMode } from '@/composables/usePreferences'

interface VimState {
  mode: 'normal' | 'insert' | 'visual'
  count: number
  pendingKey: string | null
  register: string
  visualAnchor: number
}

interface ModeCallbacks {
  getValue: () => string
  setValue: (val: string, cursorStart: number, cursorEnd: number) => void
  undo: () => void
  redo: () => void
  save: () => void
  close: () => void
}

export function useEditorMode(
  textareaRef: Ref<HTMLTextAreaElement | null>,
  mode: Ref<EditorMode>,
  callbacks: ModeCallbacks
) {
  const vimState = ref<VimState>({
    mode: 'normal',
    count: 0,
    pendingKey: null,
    register: '',
    visualAnchor: 0
  })

  const emacsPrefix = ref<string | null>(null)
  const emacsMark = ref<number | null>(null)

  // 重置状态（切换模式或标签时调用）
  const resetState = () => {
    vimState.value = { mode: 'normal', count: 0, pendingKey: null, register: '', visualAnchor: 0 }
    emacsPrefix.value = null
    emacsMark.value = null
  }

  watch(mode, () => resetState())

  // --- 光标与文本辅助方法 ---
  const getEl = () => textareaRef.value
  const getPos = () => {
    const el = getEl()
    return el ? el.selectionStart : 0
  }
  const setSel = (start: number, end?: number) => {
    const el = getEl()
    if (!el) return
    el.setSelectionRange(start, end ?? start)
  }
  const getText = () => callbacks.getValue()

  // 统一移动方法：normal 模式移动光标，visual 模式扩展选区
  const moveCursorTo = (pos: number) => {
    const state = vimState.value
    const clamped = Math.max(0, Math.min(getText().length, pos))
    if (state.mode === 'visual') {
      const anchor = state.visualAnchor
      setSel(Math.min(anchor, clamped), Math.max(anchor, clamped))
    } else {
      setSel(clamped)
    }
  }

  const moveBy = (delta: number) => moveCursorTo(getPos() + delta)

  const getLineCol = () => {
    const text = getText()
    const pos = getPos()
    const before = text.substring(0, pos)
    const lines = before.split('\n')
    return { line: lines.length - 1, col: lines[lines.length - 1].length }
  }

  const moveToLineCol = (line: number, col: number) => {
    const allLines = getText().split('\n')
    const targetLine = Math.max(0, Math.min(allLines.length - 1, line))
    const targetCol = Math.max(0, Math.min(allLines[targetLine].length, col))
    let pos = 0
    for (let i = 0; i < targetLine; i++) pos += allLines[i].length + 1
    pos += targetCol
    moveCursorTo(pos)
  }

  const moveToLineStart = () => {
    const text = getText()
    const pos = getPos()
    moveCursorTo(text.lastIndexOf('\n', pos - 1) + 1)
  }

  const moveToLineEnd = () => {
    const text = getText()
    const pos = getPos()
    const idx = text.indexOf('\n', pos)
    moveCursorTo(idx === -1 ? text.length : idx)
  }

  const moveToNextWord = (n: number) => {
    const text = getText()
    let pos = getPos()
    for (let i = 0; i < n; i++) {
      const ch = text[pos]
      if (ch && /[\w]/.test(ch)) {
        while (pos < text.length && /[\w]/.test(text[pos])) pos++
      } else if (ch && /[^\s\w]/.test(ch)) {
        while (pos < text.length && /[^\s\w]/.test(text[pos])) pos++
      }
      while (pos < text.length && /\s/.test(text[pos])) pos++
    }
    moveCursorTo(Math.min(pos, text.length))
  }

  const moveToPrevWord = (n: number) => {
    const text = getText()
    let pos = getPos() - 1
    for (let i = 0; i < n; i++) {
      while (pos > 0 && /\s/.test(text[pos])) pos--
      if (pos < 0) { pos = 0; break }
      const ch = text[pos]
      if (/[\w]/.test(ch)) {
        while (pos > 0 && /[\w]/.test(text[pos - 1])) pos--
      } else if (/[^\s\w]/.test(ch)) {
        while (pos > 0 && /[^\s\w]/.test(text[pos - 1])) pos--
      }
      if (i < n - 1) pos--
    }
    moveCursorTo(Math.max(0, pos))
  }

  // --- Vim 文本操作 ---
  const deleteChar = (n: number) => {
    const text = getText()
    const pos = getPos()
    const end = Math.min(text.length, pos + n)
    vimState.value.register = text.substring(pos, end)
    const newText = text.substring(0, pos) + text.substring(end)
    callbacks.setValue(newText, pos, pos)
  }

  const deleteLines = (n: number) => {
    const text = getText()
    const { line } = getLineCol()
    const allLines = text.split('\n')
    const endLine = Math.min(allLines.length - 1, line + n - 1)
    let startPos = 0
    for (let i = 0; i < line; i++) startPos += allLines[i].length + 1
    let endPos = startPos
    for (let i = line; i <= endLine; i++) endPos += allLines[i].length + 1
    vimState.value.register = text.substring(startPos, endPos)
    const newText = text.substring(0, startPos) + text.substring(endPos)
    callbacks.setValue(newText, startPos, startPos)
  }

  const yankLines = (n: number) => {
    const text = getText()
    const { line } = getLineCol()
    const allLines = text.split('\n')
    const endLine = Math.min(allLines.length - 1, line + n - 1)
    let startPos = 0
    for (let i = 0; i < line; i++) startPos += allLines[i].length + 1
    let endPos = startPos
    for (let i = line; i <= endLine; i++) endPos += allLines[i].length + 1
    vimState.value.register = text.substring(startPos, endPos)
  }

  const pasteText = (above: boolean) => {
    const text = getText()
    const pos = getPos()
    const reg = vimState.value.register
    if (!reg) return
    const insertPos = above
      ? text.lastIndexOf('\n', pos - 1) + 1
      : (text.indexOf('\n', pos) === -1 ? text.length : text.indexOf('\n', pos) + 1)
    const newText = text.substring(0, insertPos) + reg + text.substring(insertPos)
    const cursor = insertPos + reg.length
    callbacks.setValue(newText, cursor, cursor)
  }

  const openLine = (below: boolean) => {
    const text = getText()
    const pos = getPos()
    const insertPos = below
      ? (text.indexOf('\n', pos) === -1 ? text.length : text.indexOf('\n', pos))
      : text.lastIndexOf('\n', pos - 1) + 1
    const newText = text.substring(0, insertPos) + '\n' + text.substring(insertPos)
    const cursor = below ? insertPos + 1 : insertPos
    callbacks.setValue(newText, cursor, cursor)
    vimState.value.mode = 'insert'
  }

  // Visual 模式操作
  const deleteSelection = () => {
    const el = getEl()
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start === end) return
    const text = getText()
    vimState.value.register = text.substring(start, end)
    const newText = text.substring(0, start) + text.substring(end)
    callbacks.setValue(newText, start, start)
  }

  const yankSelection = () => {
    const el = getEl()
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    if (start === end) return
    vimState.value.register = getText().substring(start, end)
    setSel(start) // 收起选区
  }

  // --- Vim 键处理 ---
  const handleVimKey = (e: KeyboardEvent): boolean => {
    const state = vimState.value
    const key = e.key

    // Insert 模式：仅拦截 Escape
    if (state.mode === 'insert') {
      if (key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        moveCursorTo(getPos() - 1)
        state.mode = 'normal'
        state.count = 0
        state.pendingKey = null
        return true
      }
      return false // 放行正常输入
    }

    // Normal 和 Visual 模式：拦截所有按键
    e.preventDefault()
    e.stopImmediatePropagation()

    // Escape：取消 pending / 退出 visual
    if (key === 'Escape') {
      state.pendingKey = null
      state.count = 0
      if (state.mode === 'visual') {
        state.mode = 'normal'
        setSel(getPos())
      }
      return true
    }

    // 计数前缀（仅 normal 模式）
    if (state.mode === 'normal' && /^[1-9]$/.test(key) && !state.pendingKey) {
      state.count = state.count * 10 + parseInt(key)
      return true
    }
    const count = state.count || 1

    // 处理 pending 双键命令
    if (state.pendingKey) {
      const pk = state.pendingKey
      state.pendingKey = null
      state.count = 0
      if (pk === 'g' && key === 'g') {
        moveCursorTo(0)
        return true
      }
      if (pk === 'd' && key === 'd') {
        deleteLines(count)
        state.mode = 'normal'
        return true
      }
      if (pk === 'y' && key === 'y') {
        yankLines(count)
        return true
      }
      if (pk === ':') {
        if (key === 'w') { callbacks.save() }
        else if (key === 'q') { callbacks.close() }
        else if (key === 'x') { callbacks.save(); callbacks.close() }
        return true
      }
      return true
    }

    // Visual 模式专属操作
    if (state.mode === 'visual') {
      switch (key) {
        case 'd':
        case 'x':
          deleteSelection()
          state.mode = 'normal'
          return true
        case 'y':
          yankSelection()
          state.mode = 'normal'
          return true
      }
    }

    // 通用移动命令（normal + visual）
    switch (key) {
      case 'h': moveBy(-count); break
      case 'l': moveBy(count); break
      case 'j': { const { line, col } = getLineCol(); moveToLineCol(line + count, col); break }
      case 'k': { const { line, col } = getLineCol(); moveToLineCol(line - count, col); break }
      case 'w': moveToNextWord(count); break
      case 'b': moveToPrevWord(count); break
      case '0': moveToLineStart(); break
      case '$': moveToLineEnd(); break
      case 'G': {
        const lines = getText().split('\n')
        moveToLineCol(state.count > 0 ? state.count - 1 : lines.length - 1, 0)
        break
      }
      case 'g': state.pendingKey = 'g'; break
      // Normal 模式专属命令
      case 'i':
        if (state.mode === 'normal') state.mode = 'insert'
        break
      case 'I':
        if (state.mode === 'normal') { moveToLineStart(); state.mode = 'insert' }
        break
      case 'a':
        if (state.mode === 'normal') { moveBy(1); state.mode = 'insert' }
        break
      case 'A':
        if (state.mode === 'normal') { moveToLineEnd(); state.mode = 'insert' }
        break
      case 'o':
        if (state.mode === 'normal') openLine(true)
        break
      case 'O':
        if (state.mode === 'normal') openLine(false)
        break
      case 'x':
        if (state.mode === 'normal') deleteChar(count)
        break
      case 'd':
        if (state.mode === 'normal') state.pendingKey = 'd'
        break
      case 'y':
        if (state.mode === 'normal') state.pendingKey = 'y'
        break
      case 'p':
        if (state.mode === 'normal') pasteText(false)
        break
      case 'P':
        if (state.mode === 'normal') pasteText(true)
        break
      case 'u':
        if (state.mode === 'normal') callbacks.undo()
        break
      case 'r':
        if (e.ctrlKey && state.mode === 'normal') callbacks.redo()
        break
      case 'v':
        if (state.mode === 'normal') {
          state.mode = 'visual'
          state.visualAnchor = getPos()
        }
        break
      case ':':
        if (state.mode === 'normal') state.pendingKey = ':'
        break
      default:
        break
    }

    // 重置计数（除非有 pending 命令）
    if (!state.pendingKey) {
      state.count = 0
    }
    return true
  }

  // --- Emacs 键处理 ---
  const emacsKillRing = ref('')

  const killToEndOfLine = () => {
    const text = getText()
    const pos = getPos()
    const lineEnd = text.indexOf('\n', pos)
    const end = lineEnd === -1 ? text.length : lineEnd
    emacsKillRing.value = text.substring(pos, end)
    if (end === pos && lineEnd !== -1) {
      // 行尾无内容，删到下一行开头
      emacsKillRing.value = '\n'
      const newText = text.substring(0, pos) + text.substring(pos + 1)
      callbacks.setValue(newText, pos, pos)
    } else {
      const newText = text.substring(0, pos) + text.substring(end)
      callbacks.setValue(newText, pos, pos)
    }
  }

  const deleteWordForward = () => {
    const text = getText()
    const pos = getPos()
    let end = pos
    while (end < text.length && /\s/.test(text[end])) end++
    if (end < text.length && /[\w]/.test(text[end])) {
      while (end < text.length && /[\w]/.test(text[end])) end++
    } else {
      while (end < text.length && /[^\s\w]/.test(text[end])) end++
    }
    emacsKillRing.value = text.substring(pos, end)
    const newText = text.substring(0, pos) + text.substring(end)
    callbacks.setValue(newText, pos, pos)
  }

  const emacsYank = () => {
    if (!emacsKillRing.value) return
    const text = getText()
    const pos = getPos()
    const newText = text.substring(0, pos) + emacsKillRing.value + text.substring(pos)
    const cursor = pos + emacsKillRing.value.length
    callbacks.setValue(newText, cursor, cursor)
  }

  const cutSelection = () => {
    const el = getEl()
    if (!el || el.selectionStart === el.selectionEnd) return
    const text = getText()
    emacsKillRing.value = text.substring(el.selectionStart, el.selectionEnd)
    const newText = text.substring(0, el.selectionStart) + text.substring(el.selectionEnd)
    callbacks.setValue(newText, el.selectionStart, el.selectionStart)
  }

  const copySelection = () => {
    const el = getEl()
    if (!el || el.selectionStart === el.selectionEnd) return
    emacsKillRing.value = getText().substring(el.selectionStart, el.selectionEnd)
  }

  const pageScroll = (direction: 'down' | 'up') => {
    const el = getEl()
    if (!el) return
    const visibleLines = Math.floor(el.clientHeight / 20)
    const { line, col } = getLineCol()
    moveToLineCol(line + (direction === 'down' ? visibleLines : -visibleLines), col)
  }

  const handleEmacsKey = (e: KeyboardEvent): boolean => {
    const key = e.key.toLowerCase()
    const ctrl = e.ctrlKey || e.metaKey
    const alt = e.altKey

    // C-x 前缀命令
    if (emacsPrefix.value === 'C-x') {
      emacsPrefix.value = null
      if (ctrl && key === 's') {
        e.preventDefault(); e.stopImmediatePropagation(); callbacks.save(); return true
      }
      if (ctrl && key === 'c') {
        e.preventDefault(); e.stopImmediatePropagation(); callbacks.close(); return true
      }
      if (key === 'u') {
        e.preventDefault(); e.stopImmediatePropagation(); callbacks.undo(); return true
      }
      return false
    }

    if (ctrl && key === 'x') {
      e.preventDefault(); e.stopImmediatePropagation()
      emacsPrefix.value = 'C-x'
      return true
    }

    // 移动命令
    if (ctrl && key === 'f') { e.preventDefault(); e.stopImmediatePropagation(); moveBy(1); return true }
    if (ctrl && key === 'b') { e.preventDefault(); e.stopImmediatePropagation(); moveBy(-1); return true }
    if (ctrl && key === 'n') { e.preventDefault(); e.stopImmediatePropagation(); const { line, col } = getLineCol(); moveToLineCol(line + 1, col); return true }
    if (ctrl && key === 'p') { e.preventDefault(); e.stopImmediatePropagation(); const { line, col } = getLineCol(); moveToLineCol(line - 1, col); return true }
    if (ctrl && key === 'a') { e.preventDefault(); e.stopImmediatePropagation(); moveToLineStart(); return true }
    if (ctrl && key === 'e') { e.preventDefault(); e.stopImmediatePropagation(); moveToLineEnd(); return true }
    if (ctrl && key === 'v') { e.preventDefault(); e.stopImmediatePropagation(); pageScroll('down'); return true }
    if (alt && key === 'v') { e.preventDefault(); e.stopImmediatePropagation(); pageScroll('up'); return true }
    if (alt && key === 'f') { e.preventDefault(); e.stopImmediatePropagation(); moveToNextWord(1); return true }
    if (alt && key === 'b') { e.preventDefault(); e.stopImmediatePropagation(); moveToPrevWord(1); return true }
    if (ctrl && key === 'arrowdown') { e.preventDefault(); e.stopImmediatePropagation(); const { line, col } = getLineCol(); moveToLineCol(line + 1, col); return true }
    if (ctrl && key === 'arrowup') { e.preventDefault(); e.stopImmediatePropagation(); const { line, col } = getLineCol(); moveToLineCol(line - 1, col); return true }

    // 删除命令
    if (ctrl && key === 'd') { e.preventDefault(); e.stopImmediatePropagation(); deleteChar(1); return true }
    if (alt && key === 'd') { e.preventDefault(); e.stopImmediatePropagation(); deleteWordForward(); return true }
    if (ctrl && key === 'k') { e.preventDefault(); e.stopImmediatePropagation(); killToEndOfLine(); return true }
    if (ctrl && key === 'w') { e.preventDefault(); e.stopImmediatePropagation(); cutSelection(); return true }
    if (alt && key === 'w') { e.preventDefault(); e.stopImmediatePropagation(); copySelection(); return true }

    // Yank（粘贴）
    if (ctrl && key === 'y') { e.preventDefault(); e.stopImmediatePropagation(); emacsYank(); return true }

    // Mark（设置标记）
    if (ctrl && (key === ' ' || key === '@')) {
      e.preventDefault(); e.stopImmediatePropagation()
      emacsMark.value = getPos()
      return true
    }

    // 交换标记和光标
    if (ctrl && key === 'x' && emacsMark.value !== null) {
      e.preventDefault(); e.stopImmediatePropagation()
      const mark = emacsMark.value
      emacsMark.value = getPos()
      setSel(Math.min(mark, emacsMark.value), Math.max(mark, emacsMark.value))
      return true
    }

    // 撤销
    if (ctrl && (key === '_' || key === '/')) {
      e.preventDefault(); e.stopImmediatePropagation(); callbacks.undo(); return true
    }

    return false // 放行正常输入
  }

  // --- 主分发函数 ---
  const handleKeydown = (e: KeyboardEvent): boolean => {
    if (mode.value === 'vim') return handleVimKey(e)
    if (mode.value === 'emacs') return handleEmacsKey(e)
    return false
  }

  const vimMode = computed(() => vimState.value.mode)

  return {
    handleKeydown,
    vimMode,
    emacsPrefix,
    resetState
  }
}
