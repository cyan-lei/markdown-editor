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

const histories = new Map<number, HistoryStack>()
const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>()

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

    const existing = debounceTimers.get(id)
    if (existing) clearTimeout(existing)

    debounceTimers.set(id, setTimeout(() => {
      const stack = getStack(id)
      stack.past.push({ content, selectionStart, selectionEnd })
      if (stack.past.length > MAX_HISTORY) stack.past.shift()
      stack.future = []
      updateFlags(id)
      debounceTimers.delete(id)
    }, DEBOUNCE_MS))
  }

  const undo = (): HistoryEntry | null => {
    const id = tabId.value
    if (id === null) return null
    const stack = getStack(id)

    const timer = debounceTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      debounceTimers.delete(id)
    }

    const entry = stack.past.pop()
    if (!entry) return null
    // undo 时不在此处压入 future，由调用方在获取 undo 结果前
    // 通过 pushToFuture 保存当前状态
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
