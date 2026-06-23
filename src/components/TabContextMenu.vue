<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="context-menu-overlay"
      @click="$emit('close')"
      @contextmenu.prevent="$emit('close')"
    >
      <div
        class="context-menu"
        :style="{ top: `${y}px`, left: `${x}px` }"
        @click.stop
      >
        <button class="menu-item" @click="emitAction('close')">
          关闭
        </button>
        <button class="menu-item" @click="emitAction('closeOthers')">
          关闭其他
        </button>
        <button class="menu-item" @click="emitAction('closeRight')">
          关闭右侧
        </button>
        <hr class="menu-sep" />
        <button class="menu-item" @click="emitAction('copyName')">
          复制文件名
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  x: number
  y: number
}>()

const emit = defineEmits<{
  (e: 'action', action: string): void
  (e: 'close'): void
}>()

const emitAction = (action: string) => {
  emit('action', action)
  emit('close')
}
</script>

<style scoped>
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1100;
}

.context-menu {
  position: fixed;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  min-width: 160px;
  overflow: hidden;
  padding: 4px 0;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.menu-item:hover {
  background: var(--bg-tertiary);
}

.menu-sep {
  border: none;
  border-top: 1px solid var(--border);
  margin: 4px 0;
}
</style>
