<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="visible" @click="$emit('close')">
      <div class="modal-content" @click.stop role="dialog" aria-modal="true" aria-label="快捷键">
        <div class="modal-header">
          <span class="modal-title">快捷键速查表</span>
        </div>
        <div class="modal-body">
          <div class="shortcut-section">
            <h3 class="shortcut-category">文件操作</h3>
            <div class="shortcut-row" v-for="item in fileShortcuts" :key="item.desc">
              <span class="shortcut-desc">{{ item.desc }}</span>
              <div class="shortcut-keys">
                <kbd v-for="(key, i) in item.keys" :key="i">{{ key }}</kbd>
              </div>
            </div>
          </div>
          <div class="shortcut-section">
            <h3 class="shortcut-category">编辑格式</h3>
            <div class="shortcut-row" v-for="item in editShortcuts" :key="item.desc">
              <span class="shortcut-desc">{{ item.desc }}</span>
              <div class="shortcut-keys">
                <kbd v-for="(key, i) in item.keys" :key="i">{{ key }}</kbd>
              </div>
            </div>
          </div>
          <div class="shortcut-section">
            <h3 class="shortcut-category">搜索替换</h3>
            <div class="shortcut-row" v-for="item in searchShortcuts" :key="item.desc">
              <span class="shortcut-desc">{{ item.desc }}</span>
              <div class="shortcut-keys">
                <kbd v-for="(key, i) in item.keys" :key="i">{{ key }}</kbd>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="$emit('close')">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
}>()

defineEmits<{
  (e: 'close'): void
}>()

const fileShortcuts = [
  { desc: '新建文件', keys: ['Ctrl', 'N'] },
  { desc: '打开文件', keys: ['Ctrl', 'O'] },
  { desc: '保存文件', keys: ['Ctrl', 'S'] },
  { desc: '关闭标签页', keys: ['Ctrl', 'W'] },
  { desc: '切换标签页', keys: ['Ctrl', 'Tab'] },
]

const editShortcuts = [
  { desc: '撤销', keys: ['Ctrl', 'Z'] },
  { desc: '重做', keys: ['Ctrl', 'Y'] },
  { desc: '重做（备选）', keys: ['Ctrl', 'Shift', 'Z'] },
  { desc: '加粗', keys: ['Ctrl', 'B'] },
  { desc: '斜体', keys: ['Ctrl', 'I'] },
  { desc: '插入链接', keys: ['Ctrl', 'K'] },
]

const searchShortcuts = [
  { desc: '搜索', keys: ['Ctrl', 'F'] },
  { desc: '替换', keys: ['Ctrl', 'H'] },
  { desc: '快捷键速查', keys: ['Ctrl', '/'] },
]
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
  max-height: 80vh;
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

.shortcut-section {
  margin-bottom: 20px;
}

.shortcut-category {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}

.shortcut-desc {
  font-size: 14px;
  color: var(--text-primary);
}

.shortcut-keys {
  display: flex;
  gap: 4px;
}

.shortcut-keys kbd {
  display: inline-block;
  padding: 2px 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 4px;
  border-bottom-width: 2px;
  font-weight: 600;
}

.modal-footer {
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border);
}
</style>
