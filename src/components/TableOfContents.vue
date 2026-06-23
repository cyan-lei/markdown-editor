<template>
  <div class="toc-panel" v-if="items.length > 0">
    <div class="toc-header">
      <span class="toc-title">大纲</span>
      <button class="toc-toggle" @click="$emit('toggle')" :title="collapsed ? '展开' : '折叠'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline v-if="collapsed" points="9 18 15 12 9 6"/>
          <polyline v-else points="6 9 12 15 18 9"/>
        </svg>
      </button>
    </div>
    <div class="toc-list" v-show="!collapsed">
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
  collapsed: boolean
  activeSlug: string
}>()

defineEmits<{
  (e: 'navigate', slug: string): void
  (e: 'toggle'): void
}>()
</script>

<style scoped>
.toc-panel {
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  overflow: hidden;
  min-width: 0;
}

.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}

.toc-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
}

.toc-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 4px;
}

.toc-toggle:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.toc-list {
  padding: 8px 0;
  max-height: 50vh;
  overflow-y: auto;
  scrollbar-width: thin;
  width: 240px;
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
