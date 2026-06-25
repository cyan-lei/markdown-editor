<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="visible" @click="$emit('cancel')">
      <div class="modal-content" @click.stop role="dialog" aria-modal="true" aria-label="偏好设置">
        <div class="modal-header">
          <span class="modal-title">偏好设置</span>
        </div>
        <div class="modal-body">
          <div class="pref-row">
            <label class="pref-label">编辑器字号</label>
            <div class="pref-control">
              <input
                type="range"
                :min="12"
                :max="20"
                :step="1"
                :value="local.fontSize"
                @input="update('fontSize', Number(($event.target as HTMLInputElement).value))"
              />
              <span class="pref-value">{{ local.fontSize }}px</span>
            </div>
          </div>
          <div class="pref-row">
            <label class="pref-label">行高</label>
            <div class="pref-control">
              <input
                type="range"
                :min="1.4"
                :max="2.0"
                :step="0.1"
                :value="local.lineHeight"
                @input="update('lineHeight', Number(($event.target as HTMLInputElement).value))"
              />
              <span class="pref-value">{{ local.lineHeight.toFixed(1) }}</span>
            </div>
          </div>
          <div class="pref-row">
            <label class="pref-label">编辑器宽度</label>
            <div class="pref-control">
              <input
                type="range"
                :min="20"
                :max="80"
                :step="5"
                :value="local.editorWidth"
                @input="update('editorWidth', Number(($event.target as HTMLInputElement).value))"
              />
              <span class="pref-value">{{ local.editorWidth }}%</span>
            </div>
          </div>
          <div class="pref-row">
            <label class="pref-label">字数目标</label>
            <div class="pref-control">
              <input
                type="number"
                class="pref-number"
                :min="0"
                :step="100"
                :value="local.wordGoal"
                @input="update('wordGoal', Math.max(0, Number(($event.target as HTMLInputElement).value)))"
              />
              <span class="pref-value">{{ local.wordGoal > 0 ? '字' : '关闭' }}</span>
            </div>
          </div>
          <div class="pref-row">
            <label class="pref-label">编辑器模式</label>
            <div class="pref-control">
              <select
                class="pref-select"
                :value="local.editorMode"
                @change="update('editorMode', ($event.target as HTMLSelectElement).value)"
              >
                <option value="default">默认</option>
                <option value="vim">Vim</option>
                <option value="emacs">Emacs</option>
              </select>
            </div>
          </div>
          <div class="pref-row pref-row-column">
            <label class="pref-label">自定义预览 CSS</label>
            <textarea
              class="pref-css"
              :value="local.customCss"
              @input="update('customCss', ($event.target as HTMLTextAreaElement).value)"
              placeholder="/* 在此编写自定义 CSS，作用于预览区 */&#10;/* 使用 #markdown-preview 选择器 */&#10;&#10;#markdown-preview h1 {&#10;  color: #e74c3c;&#10;}&#10;#markdown-preview p {&#10;  font-size: 16px;&#10;}"
              rows="8"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="$emit('cancel')">取消</button>
          <button class="btn-primary" @click="$emit('confirm')">确定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Preferences } from '@/composables/usePreferences'

const props = defineProps<{
  visible: boolean
  local: Preferences
}>()

const emit = defineEmits<{
  (e: 'update', key: keyof Preferences, value: number | string): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const update = (key: keyof Preferences, value: number | string) => {
  emit('update', key, value)
}

// Reference props to avoid unused warning
void props
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  min-width: 420px;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.pref-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.pref-label {
  font-size: 14px;
  color: var(--text-primary);
  min-width: 100px;
}

.pref-control {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.pref-control input[type="range"] {
  flex: 1;
  accent-color: var(--accent);
}

.pref-value {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 50px;
  text-align: right;
}

.pref-select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  outline: none;
}

.pref-select:focus {
  border-color: var(--accent);
}

.pref-number {
  width: 80px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.pref-number:focus {
  border-color: var(--accent);
}

.pref-row-column {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.pref-css {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
}

.pref-css:focus {
  border-color: var(--accent);
}

.modal-footer {
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border);
}
</style>
