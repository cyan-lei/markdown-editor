import { ref } from 'vue'

const STORAGE_KEY = 'markdown-editor:recent-files'
const DB_NAME = 'markdown-editor-db'
const DB_STORE = 'file-handles'
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

// IndexedDB 存储 FileSystemFileHandle
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(DB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveFileHandle(name: string, handle: FileSystemFileHandle) {
  try {
    const db = await openDB()
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).put(handle, name)
    return new Promise<void>((resolve) => {
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); resolve() }
    })
  } catch {
    // IndexedDB 不可用，静默忽略
  }
}

export async function getFileHandle(name: string): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(DB_STORE, 'readonly')
    const req = tx.objectStore(DB_STORE).get(name)
    return new Promise((resolve) => {
      req.onsuccess = () => { db.close(); resolve(req.result || null) }
      req.onerror = () => { db.close(); resolve(null) }
    })
  } catch {
    return null
  }
}

export async function deleteFileHandle(name: string) {
  try {
    const db = await openDB()
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).delete(name)
    return new Promise<void>((resolve) => {
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); resolve() }
    })
  } catch {
    // ignore
  }
}

export function useRecentFiles() {
  const recentFiles = ref<RecentFile[]>(load())

  const addRecent = (name: string, handle?: FileSystemFileHandle | null) => {
    const filtered = recentFiles.value.filter(f => f.name !== name)
    filtered.unshift({ name, timestamp: Date.now() })
    recentFiles.value = filtered.slice(0, MAX_RECENT)
    persist(recentFiles.value)
    if (handle) saveFileHandle(name, handle)
  }

  const removeRecent = (name: string) => {
    recentFiles.value = recentFiles.value.filter(f => f.name !== name)
    persist(recentFiles.value)
    deleteFileHandle(name)
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
