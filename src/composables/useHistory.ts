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
const DEBOUNCE_MS = 400

const histories = new Map<number, HistoryStack>()
const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>()
// 记录 debounce 中待 push 的内容
const pendingContent = new Map<number, HistoryEntry>()

function getStack(tabId: number): HistoryStack {
  if (!histories.has(tabId)) {
    histories.set(tabId, { past: [], future: [] })
  }
  return histories.get(tabId)!
}

export function clearHistory(tabId: number) {
  histories.delete(tabId)
  const timer = debounceTimers.get(tabId)
  if (timer) {
    clearTimeout(timer)
    debounceTimers.delete(tabId)
  }
  pendingContent.delete(tabId)
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

    // 记录待 push 的内容
    pendingContent.set(id, { content, selectionStart, selectionEnd })

    const existing = debounceTimers.get(id)
    if (existing) clearTimeout(existing)

    debounceTimers.set(id, setTimeout(() => {
      const stack = getStack(id)
      const entry = pendingContent.get(id)
      if (entry) {
        // 避免连续 push 相同内容
        const last = stack.past[stack.past.length - 1]
        if (!last || last.content !== entry.content) {
          stack.past.push(entry)
          if (stack.past.length > MAX_HISTORY) stack.past.shift()
        }
        stack.future = []
        pendingContent.delete(id)
      }
      updateFlags(id)
      debounceTimers.delete(id)
    }, DEBOUNCE_MS))
  }

  // flush：如果有 pending debounce，立即执行 push
  const flush = () => {
    const id = tabId.value
    if (id === null) return
    const timer = debounceTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      debounceTimers.delete(id)
      // 立即执行 pending push
      const entry = pendingContent.get(id)
      if (entry) {
        const stack = getStack(id)
        const last = stack.past[stack.past.length - 1]
        if (!last || last.content !== entry.content) {
          stack.past.push(entry)
          if (stack.past.length > MAX_HISTORY) stack.past.shift()
        }
        stack.future = []
        pendingContent.delete(id)
        updateFlags(id)
      }
    }
  }

  const undo = (): HistoryEntry | null => {
    const id = tabId.value
    if (id === null) return null
    const stack = getStack(id)

    // 弹出当前状态
    stack.past.pop()
    // 返回前一个状态（past 栈顶），如果没有则返回空状态
    const prev = stack.past[stack.past.length - 1]
    updateFlags(id)
    if (prev) return prev
    // past 为空，返回空状态
    return { content: '', selectionStart: 0, selectionEnd: 0 }
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
    clear,
    flush
  }
}
