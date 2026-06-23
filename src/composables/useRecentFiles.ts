import { ref } from 'vue'

const STORAGE_KEY = 'markdown-editor:recent-files'
const MAX_RECENT = 10

export interface RecentFile {
  name: string
  timestamp: number
}

function load(): RecentFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(files: RecentFile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
  } catch {
    // ignore
  }
}

export function useRecentFiles() {
  const recentFiles = ref<RecentFile[]>(load())

  const addRecent = (name: string) => {
    const filtered = recentFiles.value.filter(f => f.name !== name)
    filtered.unshift({ name, timestamp: Date.now() })
    recentFiles.value = filtered.slice(0, MAX_RECENT)
    persist(recentFiles.value)
  }

  const removeRecent = (name: string) => {
    recentFiles.value = recentFiles.value.filter(f => f.name !== name)
    persist(recentFiles.value)
  }

  const clearRecent = () => {
    recentFiles.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    recentFiles,
    addRecent,
    removeRecent,
    clearRecent
  }
}
