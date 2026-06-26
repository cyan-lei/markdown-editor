<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="visible" @click="$emit('close')">
      <div class="modal-content" @click.stop role="dialog" aria-modal="true" aria-label="快捷键">
        <div class="modal-header">
          <span class="modal-title">快捷键速查表</span>
        </div>
        <div class="modal-body">
          <div class="shortcut-columns">
            <div class="shortcut-col">
              <div class="shortcut-category">文件操作</div>
              <div class="shortcut-row" v-for="item in fileShortcuts" :key="item.desc">
                <span class="shortcut-desc">{{ item.desc }}</span>
                <div class="shortcut-keys">
                  <kbd v-for="(key, i) in item.keys" :key="i">{{ key }}</kbd>
                </div>
              </div>
              <div class="shortcut-category">编辑格式</div>
              <div class="shortcut-row" v-for="item in editShortcuts" :key="item.desc">
                <span class="shortcut-desc">{{ item.desc }}</span>
                <div class="shortcut-keys">
                  <kbd v-for="(key, i) in item.keys" :key="i">{{ key }}</kbd>
                </div>
              </div>
            </div>
            <div class="shortcut-col">
              <div class="shortcut-category">搜索导航</div>
              <div class="shortcut-row" v-for="item in searchShortcuts" :key="item.desc">
                <span class="shortcut-desc">{{ item.desc }}</span>
                <div class="shortcut-keys">
                  <kbd v-for="(key, i) in item.keys" :key="i">{{ key }}</kbd>
                </div>
              </div>
              <div class="shortcut-category">视图模式</div>
              <div class="shortcut-row" v-for="item in viewShortcuts" :key="item.desc">
                <span class="shortcut-desc">{{ item.desc }}</span>
                <div class="shortcut-keys">
                  <kbd v-for="(key, i) in item.keys" :key="i">{{ key }}</kbd>
                </div>
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
defineProps<{ visible: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const fileShortcuts = [
  { desc: '新建文件', keys: ['Ctrl', 'N'] },
  { desc: '打开文件', keys: ['Ctrl', 'O'] },
  { desc: '保存文件', keys: ['Ctrl', 'S'] },
  { desc: '打印', keys: ['Ctrl', 'P'] },
  { desc: '关闭标签', keys: ['Ctrl', 'W'] },
  { desc: '切换标签', keys: ['Ctrl', 'Tab'] },
]

const editShortcuts = [
  { desc: '撤销', keys: ['Ctrl', 'Z'] },
  { desc: '重做', keys: ['Ctrl', 'Y'] },
  { desc: '加粗', keys: ['Ctrl', 'B'] },
  { desc: '斜体', keys: ['Ctrl', 'I'] },
  { desc: '插入链接', keys: ['Ctrl', 'K'] },
  { desc: '多行缩进', keys: ['Tab'] },
  { desc: '反向缩进', keys: ['Shift', 'Tab'] },
]

const searchShortcuts = [
  { desc: '搜索', keys: ['Ctrl', 'F'] },
  { desc: '替换', keys: ['Ctrl', 'H'] },
  { desc: '跳转到行', keys: ['Ctrl', 'G'] },
  { desc: '跨文件搜索', keys: ['Ctrl', 'Shift', 'H'] },
  { desc: '快捷键速查', keys: ['Ctrl', '/'] },
]

const viewShortcuts = [
  { desc: '焦点模式', keys: ['Ctrl', 'Shift', 'F'] },
  { desc: '阅读模式', keys: ['Ctrl', 'Shift', 'R'] },
]
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
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
  width: 560px;
  max-width: 90vw;
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
}

.shortcut-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
}

.shortcut-col {
  min-width: 0;
}

.shortcut-category {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-tertiary);
  margin: 12px 0 6px;
}

.shortcut-col .shortcut-category:first-child {
  margin-top: 0;
}

.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.shortcut-desc {
  font-size: 13px;
  color: var(--text-primary);
}

.shortcut-keys {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.shortcut-keys kbd {
  display: inline-block;
  padding: 1px 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 3px;
  border-bottom-width: 2px;
  font-weight: 600;
  line-height: 1.5;
}

.modal-footer {
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
</style>
