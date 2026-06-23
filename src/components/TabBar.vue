<template>
  <div class="tab-bar" v-if="tabs.length > 0">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="tab"
      :class="{ active: activeTabId === tab.id }"
      @click="$emit('switch', tab.id)"
      @contextmenu.prevent="$emit('contextmenu', $event, tab.id)"
    >
      <span class="tab-name">{{ tab.name || '未命名' }}</span>
      <span class="tab-modified" v-if="tab.modified">●</span>
      <button class="tab-close" @click.stop="$emit('close', tab.id)" :aria-label="`关闭 ${tab.name}`">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Tab } from '@/types'

defineProps<{
  tabs: Tab[]
  activeTabId: number | null
}>()

defineEmits<{
  (e: 'switch', id: number): void
  (e: 'close', id: number): void
  (e: 'contextmenu', event: MouseEvent, tabId: number): void
}>()
</script>

<style scoped>
.tab-bar {
  position: sticky;
  top: 57px;
  z-index: 90;
  display: flex;
  gap: 2px;
  padding: 8px 24px 0;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-bar::-webkit-scrollbar {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-bottom: none;
  border-radius: var(--radius) var(--radius) 0 0;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 180px;
  transition: all 0.15s ease;
}

.tab:hover {
  background: var(--bg-secondary);
}

.tab.active {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-bottom: 1px solid var(--bg-secondary);
  margin-bottom: -1px;
}

.tab-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-modified {
  color: #ef4444;
  font-size: 10px;
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 50%;
  font-size: 14px;
}

.tab-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
</style>
