<template>
  <div class="search-bar">
    <div class="search-row">
      <input
        class="search-input"
        type="text"
        :value="searchQuery"
        @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        @keydown.enter.prevent="$emit('next')"
        @keydown.esc.prevent="$emit('close')"
        placeholder="搜索..."
        ref="searchInputRef"
      />
      <button
        class="search-toggle"
        :class="{ active: caseSensitive }"
        @click="$emit('update:caseSensitive', !caseSensitive)"
        title="区分大小写"
      >Aa</button>
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
import { ref, onMounted } from 'vue'

defineProps<{
  mode: 'search' | 'replace'
  searchQuery: string
  replaceQuery: string
  caseSensitive: boolean
  matchCount: number
  currentMatch: number
}>()

defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:replaceQuery', value: string): void
  (e: 'update:caseSensitive', value: boolean): void
  (e: 'search'): void
  (e: 'next'): void
  (e: 'prev'): void
  (e: 'replace'): void
  (e: 'replaceAll'): void
  (e: 'close'): void
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  searchInputRef.value?.focus()
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
