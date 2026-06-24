<template>
  <div class="tab-bar" v-if="tabs.length > 0">
    <button class="toc-btn" @click="$emit('toggleToc')" :class="{ active: tocVisible }" :title="tocVisible ? '隐藏目录' : '显示目录'" aria-label="目录">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    </button>
    <div class="tab-scroll">
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
  </div>
</template>

<script setup lang="ts">
import type { Tab } from '@/types'

defineProps<{
  tabs: Tab[]
  activeTabId: number | null
  tocVisible: boolean
}>()

defineEmits<{
  (e: 'switch', id: number): void
  (e: 'close', id: number): void
  (e: 'contextmenu', event: MouseEvent, tabId: number): void
  (e: 'toggleToc'): void
}>()
</script>

<style scoped>
.tab-bar {
  position: sticky;
  top: 57px;
  z-index: 90;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 24px 0;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border);
}

.tab-scroll {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  flex: 1;
}

.tab-scroll::-webkit-scrollbar {
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
  flex-shrink: 0;
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

.toc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: var(--radius);
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.toc-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.toc-btn.active {
  color: var(--accent);
  background: var(--accent-light);
}
</style>
