<template>
  <div class="status-bar">
    <span class="status-item">Ln {{ line }}, Col {{ col }}</span>
    <span class="status-sep">|</span>
    <span class="status-item">词数: {{ wordCount }}</span>
    <span class="status-sep">|</span>
    <span class="status-item">字符: {{ charCount }}</span>
    <template v-if="selectedChars > 0">
      <span class="status-sep">|</span>
      <span class="status-item">已选: {{ selectedChars }} 字符</span>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  line: number
  col: number
  wordCount: number
  charCount: number
  selectedChars: number
}>()
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.status-sep {
  color: var(--border);
}
</style>
