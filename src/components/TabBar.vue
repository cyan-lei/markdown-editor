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
        :class="{ active: activeTabId === tab.id, dragging: dragId === tab.id, dragover: dragOverId === tab.id }"
        draggable="true"
        @click="$emit('switch', tab.id)"
        @contextmenu.prevent="$emit('contextmenu', $event, tab.id)"
        @dragstart="onDragStart($event, tab.id)"
        @dragover.prevent="onDragOver($event, tab.id)"
        @drop.prevent="onDrop($event, tab.id)"
        @dragend="onDragEnd"
      >
        <span class="tab-name">{{ tab.name || '未命名' }}</span>
        <span class="tab-modified" v-if="tab.modified">●</span>
        <button
          class="tab-pin"
          :class="{ pinned: tab.pinned }"
          @click.stop="$emit('togglePin', tab.id)"
          :title="tab.pinned ? '取消固定' : '固定标签'"
          :aria-label="tab.pinned ? '取消固定' : '固定标签'"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 17v5"/>
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
          </svg>
        </button>
        <button class="tab-close" @click.stop="$emit('close', tab.id)" :aria-label="`关闭 ${tab.name}`">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Tab } from '@/types'

defineProps<{
  tabs: Tab[]
  activeTabId: number | null
  tocVisible: boolean
}>()

const emit = defineEmits<{
  (e: 'switch', id: number): void
  (e: 'close', id: number): void
  (e: 'contextmenu', event: MouseEvent, tabId: number): void
  (e: 'toggleToc'): void
  (e: 'togglePin', id: number): void
  (e: 'reorder', fromId: number, toId: number): void
}>()

// 拖拽排序
const dragId = ref<number | null>(null)
const dragOverId = ref<number | null>(null)

const onDragStart = (e: DragEvent, id: number) => {
  dragId.value = id
  e.dataTransfer?.setData('text/plain', String(id))
  e.dataTransfer!.effectAllowed = 'move'
}

const onDragOver = (e: DragEvent, id: number) => {
  if (dragId.value !== null && dragId.value !== id) {
    dragOverId.value = id
    e.dataTransfer!.dropEffect = 'move'
  }
}

const onDrop = (e: DragEvent, id: number) => {
  if (dragId.value !== null && dragId.value !== id) {
    emit('reorder', dragId.value, id)
  }
  dragId.value = null
  dragOverId.value = null
}

const onDragEnd = () => {
  dragId.value = null
  dragOverId.value = null
}
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

.tab.dragging {
  opacity: 0.4;
}

.tab.dragover {
  border-top: 2px solid var(--accent);
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

.tab-pin {
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
  opacity: 0;
  transition: all 0.15s ease;
}

.tab:hover .tab-pin {
  opacity: 1;
}

.tab-pin:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.tab-pin.pinned {
  opacity: 1;
  color: var(--accent);
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
