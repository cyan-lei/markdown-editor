<template>
  <div class="empty-state">
    <!-- 装饰性背景 -->
    <div class="bg-grid" aria-hidden="true"></div>
    <div class="bg-glow" aria-hidden="true"></div>

    <!-- 主内容 -->
    <div class="content">
      <div class="badge">
        <span class="badge-dot"></span>
        <span>Markdown Editor</span>
      </div>

      <h1 class="title">
        <span class="title-line">书写</span>
        <span class="title-em">即所见</span>
      </h1>

      <p class="subtitle">
        一个为专注而生的现代化 Markdown 编辑器<br>
        实时预览 · 代码高亮 · 图表与公式
      </p>

      <div class="actions">
        <button class="btn-primary" @click="$emit('open')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          打开文件
        </button>
        <div class="hint">或将 <kbd>.md</kbd> 文件拖拽至此</div>
      </div>

      <!-- 最近文件 -->
      <div class="recent-files" v-if="recentFiles.length > 0">
        <div class="recent-header">
          <span class="recent-label">最近打开</span>
          <button class="recent-clear" @click="$emit('clearRecent')">清空</button>
        </div>
        <div class="recent-list">
          <button
            v-for="(file, i) in recentFiles"
            :key="file.name"
            class="recent-item"
            :style="{ animationDelay: `${i * 40}ms` }"
            @click="$emit('openRecent', file.name)"
          >
            <span class="recent-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <svg class="recent-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span class="recent-name">{{ file.name }}</span>
            <button class="recent-remove" @click.stop="$emit('removeRecent', file.name)" aria-label="移除">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </button>
        </div>
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
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap');

.empty-state {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  overflow: hidden;
  background: var(--bg-primary);
}

/* ---- 背景装饰 ---- */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size: 48px 48px;
  opacity: 0.4;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
}

.bg-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, var(--accent-light) 0%, transparent 70%);
  opacity: 0.6;
  pointer-events: none;
  animation: pulse 6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.6; }
}

/* ---- 内容区 ---- */
.content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ---- 徽章 ---- */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
  margin-bottom: 32px;
  background: var(--bg-secondary);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ---- 标题 ---- */
.title {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 72px;
  font-weight: 300;
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
}

.title-line {
  font-weight: 300;
}

.title-em {
  font-weight: 700;
  font-style: italic;
  background: linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ---- 副标题 ---- */
.subtitle {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-tertiary);
  margin-bottom: 40px;
  font-weight: 400;
}

/* ---- 操作区 ---- */
.actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 56px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background: var(--accent);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.btn-primary:hover {
  transform: translateY(-2px);
  background: var(--accent-hover);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.btn-primary:active {
  transform: translateY(0);
}

.hint {
  font-size: 13px;
  color: var(--text-tertiary);
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 4px;
  border-bottom-width: 2px;
}

/* ---- 最近文件 ---- */
.recent-files {
  width: 100%;
  border-top: 1px solid var(--border);
  padding-top: 24px;
}

.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.recent-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.recent-clear {
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s;
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
  gap: 14px;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  border-radius: var(--radius);
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
  animation: slideIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.recent-item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.recent-index {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-tertiary);
  min-width: 20px;
}

.recent-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.recent-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.recent-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 50%;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.15s;
}

.recent-item:hover .recent-remove {
  opacity: 1;
}

.recent-remove:hover {
  background: var(--bg-tertiary);
  color: #ef4444;
}

/* ---- 响应式 ---- */
@media (max-width: 640px) {
  .title { font-size: 48px; }
  .actions { flex-direction: column; align-items: flex-start; gap: 12px; }
  .content { max-width: 100%; }
}
</style>
