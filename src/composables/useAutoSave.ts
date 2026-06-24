import { watch, type Ref } from 'vue'
import type { Tab } from '@/types'

const STORAGE_KEY = 'markdown-editor:drafts'
const SAVE_INTERVAL = 30000 // 30 seconds

interface DraftEntry {
  name: string
  content: string
  timestamp: number
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

export function useAutoSave(tabs: Ref<Tab[]>) {
  let timer: ReturnType<typeof setInterval> | null = null

  const saveAll = () => {
    const drafts: DraftEntry[] = tabs.value
      .filter(t => t.modified || !t.fileHandle)
      .map(t => ({
        name: t.name,
        content: t.content,
        timestamp: Date.now()
      }))
    if (drafts.length > 0) {
      saveDrafts(drafts)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const start = () => {
    if (timer) clearInterval(timer)
    timer = setInterval(saveAll, SAVE_INTERVAL)
  }

  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  // 当标签的修改状态变化时立即保存
  watch(
    () => tabs.value.some(t => t.modified),
    () => saveAll()
  )

  return { start, stop, saveAll }
}
