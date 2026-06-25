<template>
  <div class="status-bar">
    <span class="status-item">Ln {{ line }}, Col {{ col }}</span>
    <span class="status-sep">|</span>
    <span class="status-item">词数: {{ wordCount }}</span>
    <span class="status-sep">|</span>
    <span class="status-item">字符: {{ charCount }}</span>
    <span class="status-sep">|</span>
    <span class="status-item">段落: {{ paragraphCount }}</span>
    <span class="status-sep">|</span>
    <span class="status-item">⏱ {{ readingTime }}</span>
    <template v-if="selectedChars > 0">
      <span class="status-sep">|</span>
      <span class="status-item">已选: {{ selectedChars }} 字符</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  line: number
  col: number
  wordCount: number
  charCount: number
  selectedChars: number
  paragraphCount: number
}>()

// 预计阅读时间（中文约 300 字/分钟，英文约 200 词/分钟）
const readingTime = computed(() => {
  const words = props.wordCount
  if (words === 0) return '0 分钟'
  const minutes = Math.ceil(words / 250)
  if (minutes < 1) return '< 1 分钟'
  return `${minutes} 分钟`
})
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
