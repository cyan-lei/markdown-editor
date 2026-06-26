import { watch, type Ref } from 'vue'
import type { Tab } from '@/types'

const STORAGE_KEY = 'markdown-editor:drafts'

export interface DraftEntry {
  name: string
  content: string
  timestamp: number
  pinned?: boolean
  active?: boolean
}

function loadDrafts(): DraftEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveDrafts(drafts: DraftEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function getDrafts(): DraftEntry[] {
  return loadDrafts()
}

export function clearDrafts() {
  localStorage.removeItem(STORAGE_KEY)
}

export function clearDraft(name: string) {
  const drafts = loadDrafts().filter(d => d.name !== name)
  saveDrafts(drafts)
}

export function useAutoSave(
  tabs: Ref<Tab[]>,
  activeTabId: Ref<number | null>,
  options?: { enabled: Ref<boolean>; interval: Ref<number> }
) {
  let timer: ReturnType<typeof setInterval> | null = null

  const saveAll = () => {
    if (options?.enabled && !options.enabled.value) return
    const drafts: DraftEntry[] = tabs.value
      .filter(t => t.modified || !t.fileHandle)
      .map(t => ({
        name: t.name,
        content: t.content,
        timestamp: Date.now(),
        pinned: t.pinned,
        active: t.id === activeTabId.value
      }))
    if (drafts.length > 0) {
      saveDrafts(drafts)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const start = () => {
    if (timer) clearInterval(timer)
    const interval = options?.interval?.value ?? 30000
    timer = setInterval(saveAll, interval)
  }

  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const restart = () => {
    stop()
    start()
  }

  // 当标签的修改状态变化时立即保存
  watch(
    () => tabs.value.some(t => t.modified),
    () => saveAll()
  )

  // 当间隔或开关变化时重启定时器
  if (options) {
    watch([options.enabled, options.interval], () => restart())
  }

  return { start, stop, saveAll }
}
