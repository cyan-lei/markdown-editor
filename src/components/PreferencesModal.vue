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
  (e: 'update', key: keyof Preferences, value: number): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const update = (key: keyof Preferences, value: number) => {
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
  max-width: 520px;
  overflow: hidden;
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

.modal-footer {
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border);
}
</style>
