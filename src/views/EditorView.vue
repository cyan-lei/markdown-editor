<template>
  <div class="editor-view" :class="{ 'focus-mode': focusMode, 'reading-mode': readingMode }" @dragover.prevent @drop.prevent="handleDrop">
    <AppHeader>
      <template #actions>
        <div class="theme-switcher" @click.stop>
          <button
            class="btn-icon"
            @click="showThemeMenu = !showThemeMenu"
            title="切换主题"
            aria-label="切换主题"
          >
            <AppIcon
              :name="themeService.currentTheme.value === 'light' ? 'sun' : themeService.currentTheme.value === 'dark' ? 'moon' : 'duck'"
              :color="themeService.currentTheme.value === 'duck' ? '#fbbf24' : themeService.isDark.value ? '#f59e0b' : '#6366f1'"
            />
          </button>
          <div class="theme-menu" v-if="showThemeMenu" @click.stop>
            <button
              v-for="opt in themeOptions"
              :key="opt.name"
              class="theme-menu-item"
              :class="{ active: themeService.currentTheme.value === opt.name }"
              @click="themeService.setTheme(opt.name); showThemeMenu = false"
            >
              <span class="theme-menu-dot" :class="'dot-' + opt.name"></span>
              {{ opt.label }}
              <span v-if="themeService.currentTheme.value === opt.name" class="theme-check">✓</span>
            </button>
          </div>
        </div>
        <button class="btn-icon" @click="handleOpenFiles" title="打开文件" aria-label="打开文件">
          <AppIcon name="folderOpen" :size="18" />
        </button>
        <button class="btn-icon" @click="handleSave" title="保存文件" aria-label="保存文件">
          <AppIcon name="save" :size="18" />
        </button>
        <button class="btn-icon" @click="handleNewFile" title="新建文件" aria-label="新建文件">
          <AppIcon name="filePlus" :size="18" />
        </button>
        <div class="export-wrapper">
          <button class="btn-icon" @click.stop="showExportMenu = !showExportMenu" title="导出" aria-label="导出">
            <AppIcon name="download" :size="18" />
          </button>
          <ExportMenu
            :visible="showExportMenu"
            @export="handleExport"
            @close="showExportMenu = false"
          />
        </div>
        <button class="btn-icon" @click="handleFormat" title="格式化文档" aria-label="格式化文档">
          <AppIcon name="wand" :size="18" />
        </button>
        <button class="btn-icon" @click="showMindmap = true" title="思维导图" aria-label="思维导图">
          <AppIcon name="mindmap" :size="18" />
        </button>
        <button class="btn-icon" @click="showPreferences = true" aria-label="偏好设置" title="偏好设置">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
      </template>
    </AppHeader>

    <TabBar
      :tabs="sortedTabs"
      :activeTabId="activeTabId"
      :tocVisible="tocVisible"
      @switch="switchTab"
      @close="handleCloseTab"
      @contextmenu="handleTabContextMenu"
      @toggleToc="tocVisible = !tocVisible"
      @togglePin="handleTogglePin"
      @reorder="handleReorder"
    />

    <main class="main">
      <template v-if="hasTabs">
        <TableOfContents
          v-if="tocVisible && tocItems.length > 0"
          :items="tocItems"
          :activeSlug="activeTocSlug"
          @navigate="handleTocNavigate"
        />
        <EditorPanel
          ref="editorPanelRef"
          :modelValue="activeTabContent"
          :charCount="charCount"
          :tabId="activeTabId!"
          :fontSize="preferences.fontSize"
          :lineHeight="preferences.lineHeight"
          :editorMode="preferences.editorMode"
          :wordGoal="preferences.wordGoal"
          :wordWrap="preferences.wordWrap"
          :spellcheck="preferences.spellcheck"
          @update="updateContent"
          @save="handleSave"
          @close="handleCloseTab(activeTabId!)"
          :style="{ flex: `0 0 ${dividerPosition}%` }"
          @scroll="handleEditorScroll"
        />
        <div class="divider" @mousedown="startDrag"></div>
        <PreviewPanel
          ref="previewPanelRef"
          :html="previewHtml"
          :style="{ flex: `0 0 ${100 - dividerPosition}%` }"
          @toggleTask="handleToggleTask"
          @tableAction="handleTableAction"
          @scroll="handlePreviewScroll"
        />
      </template>
      <EmptyState
        v-else
        :recentFiles="recentFiles"
        @open="handleOpenFiles"
        @openRecent="handleOpenRecent"
        @removeRecent="removeRecent"
        @clearRecent="clearRecent"
      />
    </main>

    <PreferencesModal
      :visible="showDraftModal"
      title="恢复草稿"
      :message="`发现 ${drafts.length} 个未保存的草稿，是否恢复？`"
      @confirm="restoreDrafts"
      @cancel="discardDrafts"
    />

    <PreferencesModal
      :visible="showPreferences"
      :local="prefLocal"
      @update="updatePrefLocal"
      @confirm="applyPreferences"
      @cancel="cancelPreferences"
    />

    <TabContextMenu
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :isPinned="contextMenuPinned"
      @action="handleContextAction"
      @close="contextMenu.visible = false"
    />

    <ShortcutsModal
      :visible="showShortcuts"
      @close="showShortcuts = false"
    />

    <TemplateModal
      :visible="showTemplateModal"
      @select="handleSelectTemplate"
      @close="showTemplateModal = false"
    />

    <GlobalSearchModal
      :visible="showGlobalSearch"
      :tabs="tabs"
      @navigate="handleGlobalSearchNavigate"
      @close="showGlobalSearch = false"
    />

    <ConfirmModal
      :visible="showCloseConfirm"
      title="未保存的更改"
      :message="`是否保存对 ${pendingCloseTabName} 的更改？`"
      confirmLabel="保存"
      tertiaryLabel="不保存"
      @confirm="handleCloseConfirmSave"
      @tertiary="handleCloseConfirmDiscard"
      @cancel="handleCloseConfirmCancel"
    />

    <MindmapModal
      :visible="showMindmap"
      :content="activeTabContent"
      @close="showMindmap = false"
    />

    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import TabBar from '@/components/TabBar.vue'
import EditorPanel from '@/components/EditorPanel.vue'
import PreviewPanel from '@/components/PreviewPanel.vue'
import ShortcutsModal from '@/components/ShortcutsModal.vue'
import EmptyState from '@/components/EmptyState.vue'
import ExportMenu from '@/components/ExportMenu.vue'
import PreferencesModal from '@/components/PreferencesModal.vue'
import TableOfContents from '@/components/TableOfContents.vue'
import TabContextMenu from '@/components/TabContextMenu.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import TemplateModal, { type DocTemplate } from '@/components/TemplateModal.vue'
import GlobalSearchModal from '@/components/GlobalSearchModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import MindmapModal from '@/components/MindmapModal.vue'
import { useEditor } from '@/composables/useEditor'
import { useDividerDrag } from '@/composables/useDividerDrag'
import { useShortcuts } from '@/composables/useShortcuts'
import { useAutoSave, getDrafts, clearDrafts } from '@/composables/useAutoSave'
import { useRecentFiles, getFileHandle } from '@/composables/useRecentFiles'
import { usePreferences, type Preferences } from '@/composables/usePreferences'
import { useToc } from '@/composables/useToc'
import { useToast } from '@/composables/useToast'
import { fileService } from '@/services/fileService'
import { themeService, themeOptions } from '@/services/themeService'
import { formatMarkdown } from '@/services/formatService'
import { clearHistory } from '@/composables/useHistory'

// --- Refs ---
const showPreferences = ref(false)
const showExportMenu = ref(false)
const showDraftModal = ref(false)
const showThemeMenu = ref(false)
const showShortcuts = ref(false)
const focusMode = ref(false)
const readingMode = ref(false)
const showTemplateModal = ref(false)
const showGlobalSearch = ref(false)
const showCloseConfirm = ref(false)
const showMindmap = ref(false)
const pendingCloseTabId = ref<number | null>(null)
const drafts = ref(getDrafts())
const editorPanelRef = ref<InstanceType<typeof EditorPanel> | null>(null)
const previewPanelRef = ref<InstanceType<typeof PreviewPanel> | null>(null)

// --- Composables ---
const { preferences, reset: resetPrefs } = usePreferences()
const { dividerPosition, startDrag } = useDividerDrag(20, 80, preferences.value.editorWidth)
const { recentFiles, addRecent, removeRecent, clearRecent } = useRecentFiles()
const { showToast } = useToast()

const {
  tabs,
  activeTabId,
  activeTabContent,
  previewHtml,
  charCount,
  hasTabs,
  hasUnsavedChanges,
  switchTab,
  closeTab,
  updateContent,
  markSaved,
  createTab,
  addTab,
  moveTab
} = useEditor()

const { toc: tocItems } = useToc(activeTabContent)

// 固定标签排序：pinned 标签排在前面，内部保持原有顺序
const sortedTabs = computed(() => {
  const pinned = tabs.value.filter(t => t.pinned)
  const unpinned = tabs.value.filter(t => !t.pinned)
  return [...pinned, ...unpinned]
})

// 切换标签固定状态
const handleTogglePin = (id: number) => {
  const tab = tabs.value.find(t => t.id === id)
  if (tab) {
    tab.pinned = !tab.pinned
  }
}

// 拖拽排序
const handleReorder = (fromId: number, toId: number) => {
  moveTab(fromId, toId)
}

// --- Auto-save ---
const autoSaveEnabled = computed(() => preferences.value.autoSaveEnabled)
const autoSaveInterval = computed(() => preferences.value.autoSaveInterval * 1000)

const { start: startAutoSave, stop: stopAutoSave } = useAutoSave(tabs, activeTabId, {
  enabled: autoSaveEnabled,
  interval: autoSaveInterval
})

// --- Preferences local state ---
const prefLocal = ref<Preferences>({ ...preferences.value })
const updatePrefLocal = (key: keyof Preferences, value: number | string | boolean) => {
  prefLocal.value = { ...prefLocal.value, [key]: value }
}
const applyPreferences = () => {
  preferences.value = { ...prefLocal.value }
  dividerPosition.value = prefLocal.value.editorWidth
  showPreferences.value = false
}

// 取消时重置 prefLocal 为当前已保存的 preferences，避免未保存的修改残留
const cancelPreferences = () => {
  prefLocal.value = { ...preferences.value }
  showPreferences.value = false
}

// --- TOC ---
const tocVisible = ref(true)
const activeTocSlug = ref('')

const handleTocNavigate = (slug: string) => {
  activeTocSlug.value = slug
  previewPanelRef.value?.scrollToHeading(slug)
}

// --- Editor scroll sync (双向) ---
// 锁防止循环触发：编辑器滚动→同步预览→预览滚动事件→同步编辑器→...
let isScrolling = false

const handleEditorScroll = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
  if (!preferences.value.scrollSync) return
  if (isScrolling) return
  isScrolling = true
  const ratio = scrollHeight <= clientHeight ? 0 : scrollTop / (scrollHeight - clientHeight)
  previewPanelRef.value?.setScrollRatio(ratio)
  requestAnimationFrame(() => { isScrolling = false })
}

const handlePreviewScroll = (scrollTop: number, scrollHeight: number, clientHeight: number) => {
  if (!preferences.value.scrollSync) return
  if (isScrolling) return
  isScrolling = true
  const ratio = scrollHeight <= clientHeight ? 0 : scrollTop / (scrollHeight - clientHeight)
  editorPanelRef.value?.setScrollRatio(ratio)
  // 更新 TOC 高亮
  const slug = previewPanelRef.value?.getActiveHeadingSlug()
  if (slug) activeTocSlug.value = slug
  requestAnimationFrame(() => { isScrolling = false })
}

// --- Task list toggle ---
const handleToggleTask = (checkboxIndex: number) => {
  const tab = tabs.value.find(t => t.id === activeTabId.value)
  if (!tab) return
  // Find the nth task list item in the markdown
  const lines = tab.content.split('\n')
  let count = 0
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\s*-\s*\[)([ x])(\]\s.*)/)
    if (match) {
      if (count === checkboxIndex) {
        const isChecked = match[2] === 'x'
        lines[i] = lines[i].replace(/^(\s*-\s*\[)([ x])(\]\s.*)/, `$1${isChecked ? ' ' : 'x'}$3`)
        updateContent(lines.join('\n'))
        break
      }
      count++
    }
  }
}

// --- 表格可视化编辑 ---
const handleTableAction = (action: 'addRow' | 'addCol' | 'delRow' | 'delCol', tableIndex: number) => {
  const tab = tabs.value.find(t => t.id === activeTabId.value)
  if (!tab) return
  const lines = tab.content.split('\n')
  // 找到第 tableIndex 个表格的行范围
  let tableCount = -1
  let tableStart = -1
  let tableEnd = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\|.*\|/)) {
      if (tableStart === -1) {
        tableCount++
        if (tableCount === tableIndex) tableStart = i
      }
    } else {
      if (tableStart !== -1) {
        tableEnd = i - 1
        break
      }
    }
  }
  if (tableStart === -1) return
  if (tableEnd === -1) tableEnd = lines.length - 1

  // 确保跳过分隔行（第二行是 |---|---|）
  const separatorLine = tableStart + 1
  const dataStart = separatorLine + 1
  const colCount = lines[tableStart].split('|').filter((_, i, a) => i > 0 && i < a.length - 1).length

  if (action === 'addRow') {
    const newRow = '| ' + Array(colCount).fill('内容').join(' | ') + ' |'
    lines.splice(tableEnd + 1, 0, newRow)
  } else if (action === 'addCol') {
    for (let i = tableStart; i <= tableEnd; i++) {
      const cells = lines[i].split('|')
      if (i === separatorLine) {
        cells.splice(cells.length - 1, 0, ' --- ')
      } else {
        cells.splice(cells.length - 1, 0, ' 内容 ')
      }
      lines[i] = cells.join('|')
    }
  } else if (action === 'delRow') {
    if (tableEnd > dataStart) {
      lines.splice(tableEnd, 1)
    }
  } else if (action === 'delCol') {
    if (colCount > 1) {
      for (let i = tableStart; i <= tableEnd; i++) {
        const cells = lines[i].split('|')
        cells.splice(cells.length - 2, 1)
        lines[i] = cells.join('|')
      }
    }
  }

  updateContent(lines.join('\n'))
}

// --- File operations ---
const handleNewFile = () => { showTemplateModal.value = true }

const handleSelectTemplate = (tpl: DocTemplate) => {
  showTemplateModal.value = false
  addTab(createTab(tpl.fileName, tpl.content))
}

const handleOpenFiles = async () => {
  const newTabs = await fileService.openFiles()
  newTabs.forEach(({ name, content, fileHandle }) => {
    addTab(createTab(name, content, fileHandle))
    addRecent(name, fileHandle)
  })
}

const handleOpenRecent = async (name: string) => {
  // 尝试从 IndexedDB 恢复 FileSystemFileHandle
  const handle = await getFileHandle(name)
  if (handle) {
    try {
      const file = await handle.getFile()
      const content = await file.text()
      addTab(createTab(name, content, handle))
      addRecent(name, handle)
      showToast(`已打开 ${name}`, 'success')
      return
    } catch {
      // 权限被拒绝或文件已删除，回退到文件选择器
      showToast('文件无法访问，请重新选择', 'info')
    }
  }
  // 回退：弹出文件选择器
  const newTabs = await fileService.openFiles()
  newTabs.forEach(({ name: fileName, content, fileHandle }) => {
    addTab(createTab(fileName, content, fileHandle))
    addRecent(fileName, fileHandle)
  })
}

const handleSave = async () => {
  const tab = tabs.value.find(t => t.id === activeTabId.value)
  if (!tab) return

  if (tab.fileHandle) {
    const success = await fileService.saveFile(tab)
    if (success) {
      markSaved()
      showToast('保存成功', 'success')
    } else {
      showToast('保存失败', 'error')
    }
  } else {
    // 无 fileHandle（新建文件或回退打开），不弹浏览器保存框
    // 内容已由自动保存草稿保留
    markSaved()
    showToast('已保存为草稿', 'success')
  }
}

const handleCloseTab = async (id: number) => {
  const tab = tabs.value.find(t => t.id === id)
  if (!tab) return
  // 固定标签不允许关闭
  if (tab.pinned) {
    showToast('已固定的标签无法关闭，请先取消固定', 'info')
    return
  }
  // 有未保存更改：弹窗让用户选择
  if (tab.modified) {
    pendingCloseTabId.value = id
    showCloseConfirm.value = true
    return
  }
  clearHistory(id)
  closeTab(id)
}

// 关闭确认弹窗回调
const handleCloseConfirmSave = async () => {
  const id = pendingCloseTabId.value
  showCloseConfirm.value = false
  pendingCloseTabId.value = null
  if (id === null) return
  const tab = tabs.value.find(t => t.id === id)
  if (!tab) return
  if (tab.fileHandle) {
    const saved = await fileService.saveFile(tab)
    if (saved) {
      markSaved()
      showToast('已保存并关闭', 'success')
    } else {
      showToast('保存失败', 'error')
      return
    }
  } else {
    // 无 fileHandle，保存为草稿
    showToast('已关闭，内容已保存为草稿', 'info')
  }
  clearHistory(id)
  closeTab(id)
}

const handleCloseConfirmDiscard = () => {
  const id = pendingCloseTabId.value
  showCloseConfirm.value = false
  pendingCloseTabId.value = null
  if (id === null) return
  clearHistory(id)
  closeTab(id)
  showToast('已关闭且未保存', 'info')
}

const handleCloseConfirmCancel = () => {
  showCloseConfirm.value = false
  pendingCloseTabId.value = null
}


const handleExport = (format: 'md' | 'html' | 'pdf' | 'outline') => {
  showExportMenu.value = false
  const tab = tabs.value.find(t => t.id === activeTabId.value)
  if (!tab) return

  if (format === 'md') {
    fileService.downloadFile(tab)
    showToast(`已导出 ${tab.name}`, 'success')
  } else if (format === 'html') {
    fileService.exportHTML(tab, preferences.value.customCss)
    showToast(`已导出 ${tab.name.replace(/\.md$/, '.html')}`, 'success')
  } else if (format === 'pdf') {
    fileService.exportPDF(tab, preferences.value.customCss)
    showToast(`已导出 ${tab.name.replace(/\.md$/, '.pdf')}`, 'success')
  } else if (format === 'outline') {
    fileService.exportOutline(tab)
    showToast(`已导出 ${tab.name.replace(/\.md$/, '-outline.md')}`, 'success')
  }
}

// --- 打印 ---
const handlePrint = () => {
  const tab = tabs.value.find(t => t.id === activeTabId.value)
  if (!tab) return
  fileService.exportPDF(tab, preferences.value.customCss)
}

// --- 格式化文档 ---
const handleFormat = () => {
  const tab = tabs.value.find(t => t.id === activeTabId.value)
  if (!tab) return
  const formatted = formatMarkdown(tab.content)
  if (formatted !== tab.content) {
    updateContent(formatted)
    showToast('文档已格式化', 'success')
  } else {
    showToast('文档已是规范格式', 'info')
  }
}

// --- Drag and drop ---
const handleDrop = async (e: DragEvent) => {
  const files = e.dataTransfer?.files
  if (!files) return

  for (const file of files) {
    if (file.name.match(/\.(md|markdown|txt)$/i)) {
      const content = await file.text()
      addTab(createTab(file.name, content))
      addRecent(file.name, null)
    } else if (file.type.startsWith('image/')) {
      // 拖拽图片 → 转 base64 插入当前标签
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        const insert = `![${file.name.replace(/\.[^.]+$/, '')}](${base64})`
        const tab = tabs.value.find(t => t.id === activeTabId.value)
        if (tab) {
          updateContent(tab.content + (tab.content ? '\n' : '') + insert)
          showToast('图片已插入', 'success')
        }
      }
      reader.readAsDataURL(file)
    }
  }
}

// --- Tab context menu ---
const contextMenu = ref({ visible: false, x: 0, y: 0, tabId: 0 })
const contextMenuPinned = computed(() => {
  const tab = tabs.value.find(t => t.id === contextMenu.value.tabId)
  return tab?.pinned ?? false
})

const pendingCloseTabName = computed(() => {
  const tab = tabs.value.find(t => t.id === pendingCloseTabId.value)
  return tab?.name || '未命名'
})

const handleTabContextMenu = (e: MouseEvent, tabId: number) => {
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, tabId }
}

const handleContextAction = (action: string) => {
  const { tabId } = contextMenu.value
  const tab = tabs.value.find(t => t.id === tabId)
  if (!tab) return

  if (action === 'close') {
    handleCloseTab(tabId)
  } else if (action === 'closeOthers') {
    tabs.value.filter(t => t.id !== tabId && !t.pinned).forEach(t => {
      clearHistory(t.id)
      closeTab(t.id)
    })
  } else if (action === 'closeRight') {
    const index = tabs.value.findIndex(t => t.id === tabId)
    tabs.value.slice(index + 1).filter(t => !t.pinned).forEach(t => {
      clearHistory(t.id)
      closeTab(t.id)
    })
  } else if (action === 'closeLeft') {
    const index = tabs.value.findIndex(t => t.id === tabId)
    tabs.value.slice(0, index).filter(t => !t.pinned).forEach(t => {
      clearHistory(t.id)
      closeTab(t.id)
    })
  } else if (action === 'closeAll') {
    tabs.value.filter(t => !t.pinned).forEach(t => {
      clearHistory(t.id)
      closeTab(t.id)
    })
  } else if (action === 'togglePin') {
    handleTogglePin(tabId)
  } else if (action === 'duplicate') {
    const dupTab = createTab(tab.name.replace(/\.md$/, '-copy.md'), tab.content, null)
    dupTab.modified = true
    addTab(dupTab)
    showToast('已复制标签', 'success')
  } else if (action === 'copyName') {
    navigator.clipboard?.writeText(tab.name)
  }
}

// --- Draft restore ---
const restoreDrafts = () => {
  showDraftModal.value = false
  let activeName: string | null = null
  drafts.value.forEach(draft => {
    const tab = createTab(draft.name, draft.content)
    tab.pinned = draft.pinned
    if (draft.active) activeName = draft.name
    addTab(tab)
  })
  // 恢复活动标签
  if (activeName) {
    const activeTab = tabs.value.find(t => t.name === activeName)
    if (activeTab) switchTab(activeTab.id)
  }
  showToast(`已恢复 ${drafts.value.length} 个草稿`, 'info')
  clearDrafts()
}

const discardDrafts = () => {
  showDraftModal.value = false
  clearDrafts()
}

// --- Tab switching ---
const switchToNextTab = () => {
  if (tabs.value.length < 2) return
  const currentIndex = tabs.value.findIndex(t => t.id === activeTabId.value)
  const nextIndex = (currentIndex + 1) % tabs.value.length
  switchTab(tabs.value[nextIndex].id)
}

// --- 全局搜索导航 ---
const handleGlobalSearchNavigate = (tabId: number, _line: number) => {
  showGlobalSearch.value = false
  switchTab(tabId)
}

// --- beforeunload ---
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = ''
  }
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
register('ctrl+/', (e) => { e.preventDefault(); showShortcuts.value = true })
register('ctrl+shift+f', (e) => { e.preventDefault(); focusMode.value = !focusMode.value })
register('ctrl+shift+h', (e) => { e.preventDefault(); showGlobalSearch.value = true })
register('ctrl+shift+r', (e) => { e.preventDefault(); readingMode.value = !readingMode.value })
register('ctrl+p', (e) => { e.preventDefault(); handlePrint() })

// --- Close menus on outside click ---
const handleOutsideClick = () => {
  showExportMenu.value = false
  showThemeMenu.value = false
}

// --- Lifecycle ---
onMounted(() => {
  themeService.init()
  startAutoSave()
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('click', handleOutsideClick)
  if (drafts.value.length > 0) {
    showDraftModal.value = true
  }
})

onUnmounted(() => {
  stopAutoSave()
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('click', handleOutsideClick)
})

// Watch for preference changes to update divider
watch(() => preferences.value.editorWidth, (val) => {
  dividerPosition.value = val
})

// 注入自定义 CSS 到预览区
watch(() => preferences.value.customCss, (css) => {
  let styleEl = document.getElementById('user-custom-css') as HTMLStyleElement | null
  if (!css) {
    styleEl?.remove()
    return
  }
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'user-custom-css'
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = css
}, { immediate: true })
</script>

<style>
/* 焦点模式：隐藏 header、tabBar、目录、分隔条、预览区，编辑器全屏 */
.focus-mode :deep(.header),
.focus-mode :deep(.tab-bar),
.focus-mode :deep(.toc-panel),
.focus-mode .divider {
  display: none !important;
}

.focus-mode .main {
  padding: 0;
}

.focus-mode :deep(.editor-panel) {
  flex: 1 1 100% !important;
  border-radius: 0;
  border: none;
  box-shadow: none;
}

.focus-mode :deep(.preview-panel) {
  display: none !important;
}

.reading-mode :deep(.editor-panel),
.reading-mode .divider,
.reading-mode :deep(.toc-panel) {
  display: none !important;
}

.reading-mode :deep(.preview-panel) {
  flex: 1 1 100% !important;
}

.export-wrapper {
  position: relative;
}

.theme-switcher {
  position: relative;
}

.theme-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 200;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 4px;
  min-width: 140px;
}

.theme-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  border-radius: var(--radius);
  transition: all 0.15s ease;
  text-align: left;
}

.theme-menu-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.theme-menu-item.active {
  color: var(--text-primary);
  font-weight: 500;
}

.theme-menu-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid var(--border);
}

.theme-menu-dot.dot-light {
  background: #fafafa;
}

.theme-menu-dot.dot-dark {
  background: #1a1a1a;
}

.theme-menu-dot.dot-duck {
  background: #fbbf24;
}

.theme-check {
  margin-left: auto;
  color: var(--accent);
  font-size: 14px;
}
</style>
