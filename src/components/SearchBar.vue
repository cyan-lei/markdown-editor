<template>
  <div class="search-bar">
    <div class="search-row">
      <div class="search-input-wrap">
        <input
          class="search-input"
          type="text"
          :value="searchQuery"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          @keydown.enter.prevent="$emit('next')"
          @keydown.esc.prevent="$emit('close')"
          @focus="showHistory = true"
          placeholder="搜索..."
          ref="searchInputRef"
        />
        <div class="search-history" v-if="showHistory && history.length > 0" @click.stop>
          <div class="history-header">
            <span>搜索历史</span>
            <button class="history-clear" @click="$emit('clearHistory'); showHistory = false">清空</button>
          </div>
          <button
            v-for="item in history"
            :key="item"
            class="history-item"
            @click="$emit('update:searchQuery', item); $emit('next'); showHistory = false"
          >{{ item }}</button>
        </div>
      </div>
      <button
        class="search-toggle"
        :class="{ active: caseSensitive }"
        @click="$emit('update:caseSensitive', !caseSensitive)"
        title="区分大小写"
      >Aa</button>
      <button
        class="search-toggle"
        :class="{ active: useRegex }"
        @click="$emit('update:useRegex', !useRegex)"
        title="正则表达式"
      >.*</button>
      <span class="match-info" v-if="searchQuery">
        {{ matchCount > 0 ? currentMatch + 1 : 0 }}/{{ matchCount }}
      </span>
      <button class="search-btn" @click="$emit('prev')" :disabled="matchCount === 0" title="上一个">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
      </button>
      <button class="search-btn" @click="$emit('next')" :disabled="matchCount === 0" title="下一个">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <button class="search-btn close-btn" @click="$emit('close')" title="关闭 (Esc)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="search-row" v-if="mode === 'replace'">
      <input
        class="search-input"
        type="text"
        :value="replaceQuery"
        @input="$emit('update:replaceQuery', ($event.target as HTMLInputElement).value)"
        @keydown.esc.prevent="$emit('close')"
        placeholder="替换为..."
      />
      <button class="replace-btn" @click="$emit('replace')" :disabled="matchCount === 0">替换</button>
      <button class="replace-btn" @click="$emit('replaceAll')" :disabled="matchCount === 0">全部替换</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  mode: 'search' | 'replace'
  searchQuery: string
  replaceQuery: string
  caseSensitive: boolean
  useRegex: boolean
  matchCount: number
  currentMatch: number
  history: string[]
}>()

defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:replaceQuery', value: string): void
  (e: 'update:caseSensitive', value: boolean): void
  (e: 'update:useRegex', value: boolean): void
  (e: 'search'): void
  (e: 'next'): void
  (e: 'prev'): void
  (e: 'replace'): void
  (e: 'replaceAll'): void
  (e: 'close'): void
  (e: 'clearHistory'): void
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)
const showHistory = ref(false)

onMounted(() => {
  searchInputRef.value?.focus()
})

onUnmounted(() => {
  showHistory.value = false
})
</script>

<style scoped>
.search-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-tertiary);
  flex-shrink: 0;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-input {
  flex: 1;
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 13px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
  min-width: 0;
}

.search-input:focus {
  border-color: var(--accent);
}

.search-input-wrap {
  flex: 1;
  position: relative;
  min-width: 0;
}

.search-history {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  font-size: 11px;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border);
}

.history-clear {
  border: none;
  background: none;
  color: var(--text-tertiary);
  font-size: 11px;
  cursor: pointer;
  padding: 0;
}

.history-clear:hover {
  color: var(--accent);
}

.history-item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.search-toggle {
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}

.search-toggle.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.match-info {
  font-size: 12px;
  color: var(--text-tertiary);
  min-width: 50px;
  text-align: center;
  flex-shrink: 0;
}

.search-btn,
.replace-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.search-btn:hover:not(:disabled),
.replace-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.search-btn:disabled,
.replace-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.close-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
}
</style>
