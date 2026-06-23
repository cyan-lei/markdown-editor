<template>
  <div class="empty-state">
    <div class="empty-icon">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    </div>
    <p class="empty-title">暂无打开的文件</p>
    <p class="empty-hint">拖拽文件到此处，或点击下方按钮打开</p>
    <button class="btn-secondary" @click="$emit('open')">打开文件</button>

    <div class="recent-files" v-if="recentFiles.length > 0">
      <div class="recent-header">
        <span>最近打开</span>
        <button class="recent-clear" @click="$emit('clearRecent')">清空</button>
      </div>
      <div class="recent-list">
        <button
          v-for="file in recentFiles"
          :key="file.name"
          class="recent-item"
          @click="$emit('openRecent', file.name)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span class="recent-name">{{ file.name }}</span>
          <button class="recent-remove" @click.stop="$emit('removeRecent', file.name)">×</button>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecentFile } from '@/composables/useRecentFiles'

defineProps<{
  recentFiles: RecentFile[]
}>()

defineEmits<{
  (e: 'open'): void
  (e: 'openRecent', name: string): void
  (e: 'removeRecent', name: string): void
  (e: 'clearRecent'): void
}>()
</script>

<style scoped>
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-tertiary);
  padding: 40px;
}

.empty-icon {
  color: var(--text-tertiary);
  opacity: 0.4;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
}

.empty-hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

.recent-files {
  margin-top: 32px;
  width: 100%;
  max-width: 400px;
}

.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-clear {
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12px;
  cursor: pointer;
  text-transform: none;
}

.recent-clear:hover {
  color: var(--text-primary);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  border-radius: var(--radius);
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.recent-item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.recent-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 50%;
  font-size: 14px;
  flex-shrink: 0;
}

.recent-remove:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
</style>
