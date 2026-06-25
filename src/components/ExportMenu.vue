<template>
  <div class="export-menu" v-if="visible" @click.stop>
    <button class="menu-item" @click="$emit('export', 'md')">
      <AppIcon name="filePlus" :size="16" />
      <span>导出 Markdown</span>
    </button>
    <button class="menu-item" @click="$emit('export', 'html')">
      <AppIcon name="download" :size="16" />
      <span>导出 HTML</span>
    </button>
    <button class="menu-item" @click="$emit('export', 'pdf')">
      <AppIcon name="download" :size="16" />
      <span>导出 PDF</span>
    </button>
    <button class="menu-item" @click="$emit('export', 'outline')">
      <AppIcon name="filePlus" :size="16" />
      <span>导出大纲</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'

defineProps<{
  visible: boolean
}>()

defineEmits<{
  (e: 'export', format: 'md' | 'html' | 'pdf' | 'outline'): void
  (e: 'close'): void
}>()
</script>

<style scoped>
.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  z-index: 200;
  min-width: 180px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.menu-item:hover {
  background: var(--bg-tertiary);
}
</style>
