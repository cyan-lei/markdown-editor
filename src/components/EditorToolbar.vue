<template>
  <div class="editor-toolbar">
    <div class="toolbar-group">
      <button class="toolbar-btn" @click="$emit('undo')" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6.7 3L3 13"/>
        </svg>
      </button>
      <button class="toolbar-btn" @click="$emit('redo')" :disabled="!canRedo" title="重做 (Ctrl+Y)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016.7 3L21 13"/>
        </svg>
      </button>
    </div>

    <span class="toolbar-divider"></span>

    <div class="toolbar-group">
      <button class="toolbar-btn" @click="$emit('format', 'bold')" title="加粗 (Ctrl+B)">
        <span class="btn-text"><b>B</b></span>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'italic')" title="斜体 (Ctrl+I)">
        <span class="btn-text"><i>I</i></span>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'strikethrough')" title="删除线">
        <span class="btn-text"><s>S</s></span>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'code')" title="行内代码">
        <span class="btn-text"><code>&lt;/&gt;</code></span>
      </button>
    </div>

    <span class="toolbar-divider"></span>

    <div class="toolbar-group">
      <button class="toolbar-btn" @click="$emit('format', 'h1')" title="标题1">
        <span class="btn-text">H1</span>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'h2')" title="标题2">
        <span class="btn-text">H2</span>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'h3')" title="标题3">
        <span class="btn-text">H3</span>
      </button>
    </div>

    <span class="toolbar-divider"></span>

    <div class="toolbar-group">
      <button class="toolbar-btn" @click="$emit('format', 'quote')" title="引用">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1-1-2-2-2H4c-1 0-2 1-2 2v8c0 1 1 2 2 2h3"/><path d="M15 21c3 0 7-1 7-8V5c0-1-1-2-2-2h-4c-1 0-2 1-2 2v8c0 1 1 2 2 2h3"/></svg>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'ul')" title="无序列表">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5" fill="currentColor"/><circle cx="3.5" cy="12" r="1.5" fill="currentColor"/><circle cx="3.5" cy="18" r="1.5" fill="currentColor"/></svg>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'ol')" title="有序列表">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'task')" title="任务列表">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
      </button>
    </div>

    <span class="toolbar-divider"></span>

    <div class="toolbar-group">
      <button class="toolbar-btn" @click="$emit('format', 'link')" title="链接 (Ctrl+K)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'image')" title="图片">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'table')" title="表格">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
      </button>
      <button class="toolbar-btn" @click="$emit('format', 'hr')" title="分隔线">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="12" x2="20" y2="12"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canUndo: boolean
  canRedo: boolean
}>()

defineEmits<{
  (e: 'format', action: string): void
  (e: 'undo'): void
  (e: 'redo'): void
}>()
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-tertiary);
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.editor-toolbar::-webkit-scrollbar {
  display: none;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 4px;
  flex-shrink: 0;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.toolbar-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.btn-text {
  font-size: 13px;
  font-weight: 500;
}

.btn-text code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
</style>
