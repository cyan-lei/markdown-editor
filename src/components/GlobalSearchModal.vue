<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="visible" @click="$emit('close')">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <span class="modal-title">跨文件搜索</span>
        </div>
        <div class="search-body">
          <div class="search-input-row">
            <input
              ref="inputRef"
              class="search-input"
              type="text"
              v-model="query"
              @keydown.enter.prevent="doSearch"
              @keydown.esc.prevent="$emit('close')"
              placeholder="在所有打开的文件中搜索..."
            />
            <button class="search-btn-primary" @click="doSearch">搜索</button>
          </div>
          <div class="search-results" v-if="results.length > 0">
            <div
              v-for="result in results"
              :key="result.tabId + '-' + result.line"
              class="result-item"
              @click="$emit('navigate', result.tabId, result.line)"
            >
              <div class="result-header">
                <span class="result-file">{{ result.tabName }}</span>
                <span class="result-line">第 {{ result.line }} 行</span>
              </div>
              <div class="result-text">{{ result.preview }}</div>
            </div>
          </div>
          <div class="search-empty" v-else-if="searched">
            <span>未找到匹配结果</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { Tab } from '@/types'

export interface GlobalSearchResult {
  tabId: number
  tabName: string
  line: number
  preview: string
  matchStart: number
}

const props = defineProps<{
  visible: boolean
  tabs: Tab[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'navigate', tabId: number, line: number): void
}>()

const query = ref('')
const results = ref<GlobalSearchResult[]>([])
const searched = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

watch(() => props.visible, (val) => {
  if (val) {
    query.value = ''
    results.value = []
    searched.value = false
    nextTick(() => inputRef.value?.focus())
  }
})

const doSearch = () => {
  results.value = []
  searched.value = true
  if (!query.value.trim()) return

  const q = query.value.toLowerCase()
  for (const tab of props.tabs) {
    const lines = tab.content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase()
      const idx = lowerLine.indexOf(q)
      if (idx !== -1) {
        // 生成预览：匹配位置前后各取一些字符
        const start = Math.max(0, idx - 20)
        const end = Math.min(lines[i].length, idx + q.length + 30)
        let preview = lines[i].substring(start, end)
        if (start > 0) preview = '...' + preview
        if (end < lines[i].length) preview = preview + '...'
        results.value.push({
          tabId: tab.id,
          tabName: tab.name,
          line: i + 1,
          preview,
          matchStart: idx
        })
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  min-width: 480px;
  max-width: 640px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.search-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.search-input-row {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  outline: none;
}

.search-input:focus {
  border-color: var(--accent);
}

.search-btn-primary {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: white;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.result-item {
  padding: 10px 12px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s ease;
  border: 1px solid transparent;
}

.result-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--border);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.result-file {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}

.result-line {
  font-size: 11px;
  color: var(--text-tertiary);
}

.result-text {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-empty {
  text-align: center;
  padding: 24px;
  color: var(--text-tertiary);
  font-size: 13px;
}
</style>
