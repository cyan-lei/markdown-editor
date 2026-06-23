import { ref, computed, watch } from 'vue'
import type { Tab } from '@/types'
import { renderMarkdown } from '@/services/markdownService'

let tabIdCounter = 0

export function useEditor() {
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<number | null>(null)

  const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value))
  const activeTabContent = computed(() => activeTab.value?.content || '')
  const previewHtml = computed(() => {
    if (!activeTab.value) return ''
    return renderMarkdown(activeTab.value.content)
  })
  const charCount = computed(() => activeTab.value?.content.length || 0)
  const hasTabs = computed(() => tabs.value.length > 0)
  const hasUnsavedChanges = computed(() => tabs.value.some(t => t.modified))

  // Sync document.title with active tab
  watch([activeTab, hasUnsavedChanges], () => {
    const tab = activeTab.value
    const prefix = tab?.modified ? '● ' : ''
    document.title = tab ? `${prefix}${tab.name} — Markdown Editor` : 'Markdown Editor'
  })

  const createTab = (
    name = '未命名.md',
    content = '',
    fileHandle: FileSystemFileHandle | null = null
  ): Tab => ({
    id: ++tabIdCounter,
    name,
    content,
    fileHandle,
    modified: false
  })

  const addTab = (tab: Tab) => {
    tabs.value.push(tab)
    activeTabId.value = tab.id
  }

  const newFile = () => addTab(createTab())

  const switchTab = (id: number) => {
    activeTabId.value = id
  }

  const closeTab = (id: number) => {
    const index = tabs.value.findIndex(t => t.id === id)
    if (index === -1) return

    tabs.value.splice(index, 1)

    if (activeTabId.value === id) {
      activeTabId.value = tabs.value.length > 0
        ? tabs.value[Math.max(0, index - 1)].id
        : null
    }
  }

  const updateContent = (content: string) => {
    if (activeTab.value) {
      activeTab.value.content = content
      activeTab.value.modified = true
    }
  }

  const markSaved = () => {
    if (activeTab.value) {
      activeTab.value.modified = false
    }
  }

  return {
    tabs,
    activeTabId,
    activeTabContent,
    previewHtml,
    charCount,
    hasTabs,
    hasUnsavedChanges,
    newFile,
    switchTab,
    closeTab,
    updateContent,
    markSaved,
    createTab,
    addTab
  }
}
