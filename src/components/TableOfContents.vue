<template>
  <div class="toc-panel">
    <div class="toc-header">
      <span class="toc-title">目录</span>
    </div>
    <div class="toc-list">
      <a
        v-for="item in items"
        :key="item.slug"
        class="toc-item"
        :class="{ active: activeSlug === item.slug }"
        :style="{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }"
        href="#"
        @click.prevent="$emit('navigate', item.slug)"
      >
        {{ item.text }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TocItem } from '@/composables/useToc'

defineProps<{
  items: TocItem[]
  activeSlug: string
}>()

defineEmits<{
  (e: 'navigate', slug: string): void
}>()
</script>

<style scoped>
.toc-panel {
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  overflow: hidden;
  min-width: 0;
  width: 240px;
}

.toc-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}

.toc-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
}

.toc-list {
  padding: 8px 0;
  max-height: 50vh;
  overflow-y: auto;
}

.toc-list::-webkit-scrollbar {
  width: 6px;
}

.toc-list::-webkit-scrollbar-track {
  background: transparent;
}

.toc-list::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 3px;
}

.toc-list::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

.toc-item {
  display: block;
  padding: 5px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toc-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.toc-item.active {
  color: var(--accent);
  font-weight: 500;
}
</style>
