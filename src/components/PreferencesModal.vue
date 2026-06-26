<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="visible" @click="$emit('cancel')">
      <div class="modal-content" @click.stop role="dialog" aria-modal="true" aria-label="偏好设置">
        <div class="modal-header">
          <span class="modal-title">偏好设置</span>
        </div>
        <div class="modal-body">
          <!-- 编辑器 -->
          <div class="pref-section">
            <div class="section-title">编辑器</div>
            <div class="section-grid">
              <div class="pref-item">
                <label class="pref-label">字号</label>
                <div class="pref-control">
                  <input type="range" :min="12" :max="20" :step="1" :value="local.fontSize"
                    @input="update('fontSize', Number(($event.target as HTMLInputElement).value))" />
                  <span class="pref-value">{{ local.fontSize }}px</span>
                </div>
              </div>
              <div class="pref-item">
                <label class="pref-label">行高</label>
                <div class="pref-control">
                  <input type="range" :min="1.4" :max="2.0" :step="0.1" :value="local.lineHeight"
                    @input="update('lineHeight', Number(($event.target as HTMLInputElement).value))" />
                  <span class="pref-value">{{ local.lineHeight.toFixed(1) }}</span>
                </div>
              </div>
              <div class="pref-item">
                <label class="pref-label">编辑器宽度</label>
                <div class="pref-control">
                  <input type="range" :min="20" :max="80" :step="5" :value="local.editorWidth"
                    @input="update('editorWidth', Number(($event.target as HTMLInputElement).value))" />
                  <span class="pref-value">{{ local.editorWidth }}%</span>
                </div>
              </div>
              <div class="pref-item">
                <label class="pref-label">编辑器模式</label>
                <div class="pref-control">
                  <select class="pref-select" :value="local.editorMode"
                    @change="update('editorMode', ($event.target as HTMLSelectElement).value)">
                    <option value="default">默认</option>
                    <option value="vim">Vim</option>
                    <option value="emacs">Emacs</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- 开关项 -->
          <div class="pref-section">
            <div class="section-title">功能开关</div>
            <div class="toggle-grid">
              <label class="toggle-item" :class="{ on: local.wordWrap }">
                <input type="checkbox" :checked="local.wordWrap"
                  @change="update('wordWrap', ($event.target as HTMLInputElement).checked)" />
                <span class="toggle-name">自动换行</span>
              </label>
              <label class="toggle-item" :class="{ on: local.spellcheck }">
                <input type="checkbox" :checked="local.spellcheck"
                  @change="update('spellcheck', ($event.target as HTMLInputElement).checked)" />
                <span class="toggle-name">拼写检查</span>
              </label>
              <label class="toggle-item" :class="{ on: local.scrollSync }">
                <input type="checkbox" :checked="local.scrollSync"
                  @change="update('scrollSync', ($event.target as HTMLInputElement).checked)" />
                <span class="toggle-name">滚动同步</span>
              </label>
              <label class="toggle-item" :class="{ on: local.autoSaveEnabled }">
                <input type="checkbox" :checked="local.autoSaveEnabled"
                  @change="update('autoSaveEnabled', ($event.target as HTMLInputElement).checked)" />
                <span class="toggle-name">自动保存</span>
                <input type="number" class="pref-number-sm" :min="5" :max="300" :step="5"
                  :value="local.autoSaveInterval" :disabled="!local.autoSaveEnabled"
                  @input="update('autoSaveInterval', Math.max(5, Number(($event.target as HTMLInputElement).value)))" />
                <span class="pref-value">秒</span>
              </label>
            </div>
          </div>

          <!-- 写作目标 -->
          <div class="pref-section">
            <div class="section-title">写作目标</div>
            <div class="pref-item">
              <label class="pref-label">字数目标</label>
              <div class="pref-control">
                <input type="number" class="pref-number" :min="0" :step="100" :value="local.wordGoal"
                  @input="update('wordGoal', Math.max(0, Number(($event.target as HTMLInputElement).value)))" />
                <span class="pref-value">{{ local.wordGoal > 0 ? '字' : '关闭' }}</span>
              </div>
            </div>
          </div>

          <!-- 图床配置 -->
          <div class="pref-section">
            <details class="pref-details">
              <summary class="section-title clickable">GitHub 图床配置</summary>
              <div class="pref-item" style="margin-top: 10px;">
                <label class="toggle-item" :class="{ on: local.imageConfig.enabled }" style="flex: 1;">
                  <input type="checkbox" :checked="local.imageConfig.enabled"
                    @change="updateImageConfig('enabled', ($event.target as HTMLInputElement).checked)" />
                  <span class="toggle-name">启用 GitHub 图床上传</span>
                </label>
              </div>
              <div class="section-grid" style="margin-top: 10px;">
                <div class="pref-item">
                  <label class="pref-label">GitHub Token</label>
                </div>
                <div class="pref-item">
                  <input type="password" class="pref-number" style="width: 100%;"
                    :value="local.imageConfig.token"
                    @input="updateImageConfig('token', ($event.target as HTMLInputElement).value)"
                    placeholder="ghp_xxx" />
                </div>
                <div class="pref-item">
                  <label class="pref-label">用户名</label>
                </div>
                <div class="pref-item">
                  <input type="text" class="pref-number" style="width: 100%;"
                    :value="local.imageConfig.owner"
                    @input="updateImageConfig('owner', ($event.target as HTMLInputElement).value)"
                    placeholder="cyan-lei" />
                </div>
                <div class="pref-item">
                  <label class="pref-label">仓库名</label>
                </div>
                <div class="pref-item">
                  <input type="text" class="pref-number" style="width: 100%;"
                    :value="local.imageConfig.repo"
                    @input="updateImageConfig('repo', ($event.target as HTMLInputElement).value)"
                    placeholder="markdown-editor" />
                </div>
                <div class="pref-item">
                  <label class="pref-label">分支</label>
                </div>
                <div class="pref-item">
                  <input type="text" class="pref-number" style="width: 100%;"
                    :value="local.imageConfig.branch"
                    @input="updateImageConfig('branch', ($event.target as HTMLInputElement).value)"
                    placeholder="master" />
                </div>
                <div class="pref-item">
                  <label class="pref-label">存储路径</label>
                </div>
                <div class="pref-item">
                  <input type="text" class="pref-number" style="width: 100%;"
                    :value="local.imageConfig.path"
                    @input="updateImageConfig('path', ($event.target as HTMLInputElement).value)"
                    placeholder="images" />
                </div>
              </div>
            </details>
          </div>

          <!-- 自定义 CSS -->
          <div class="pref-section">
            <details class="pref-details">
              <summary class="section-title clickable">自定义预览 CSS</summary>
              <textarea class="pref-css" :value="local.customCss"
                @input="update('customCss', ($event.target as HTMLTextAreaElement).value)"
                placeholder="/* 使用 #markdown-preview 选择器 */&#10;&#10;#markdown-preview h1 {&#10;  color: #e74c3c;&#10;}"
                rows="6"></textarea>
            </details>
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
  (e: 'update', key: keyof Preferences, value: number | string | boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const update = (key: keyof Preferences, value: number | string | boolean) => {
  emit('update', key, value)
}

const updateImageConfig = (key: keyof Preferences['imageConfig'], value: string | boolean) => {
  emit('update', 'imageConfig', { ...props.local.imageConfig, [key]: value })
}

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
  width: 520px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-body {
  padding: 12px 20px;
  overflow-y: auto;
  flex: 1;
}

/* 分区 */
.pref-section {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.pref-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-tertiary);
  margin-bottom: 10px;
}

.section-title.clickable {
  cursor: pointer;
  user-select: none;
}

.section-title.clickable:hover {
  color: var(--accent);
}

/* 滑块项：两列 */
.section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 20px;
}

.pref-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pref-label {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
}

.pref-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pref-control input[type="range"] {
  width: 72px;
  accent-color: var(--accent);
}

.pref-value {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 28px;
  text-align: right;
}

.pref-select {
  padding: 4px 8px;
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
  width: 70px;
  padding: 4px 8px;
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

.pref-number-sm {
  width: 50px;
  padding: 3px 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
}

.pref-number-sm:disabled {
  opacity: 0.4;
}

/* 开关项：2x2 网格 */
.toggle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.toggle-item:hover {
  border-color: var(--accent);
}

.toggle-item.on {
  border-color: var(--accent);
  background: var(--accent-light);
}

.toggle-item input[type="checkbox"] {
  accent-color: var(--accent);
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.toggle-name {
  font-size: 13px;
  color: var(--text-primary);
  flex: 1;
}

/* CSS 折叠区 */
.pref-details {
  margin-top: 4px;
}

.pref-details summary {
  list-style: none;
}

.pref-details summary::-webkit-details-marker {
  display: none;
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
  margin-top: 8px;
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
  flex-shrink: 0;
}
</style>
