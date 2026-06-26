<template>
  <Teleport to="body">
    <div class="mindmap-overlay" v-if="visible">
      <div class="mindmap-container">
        <div class="mindmap-header">
          <span class="mindmap-title">思维导图</span>
          <div class="mindmap-actions">
            <button class="btn-icon" @click="handleFit" title="适应屏幕" aria-label="适应屏幕">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4"/>
              </svg>
            </button>
            <button class="btn-icon" @click="$emit('close')" title="关闭" aria-label="关闭">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="mindmap-body" ref="containerRef"></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'

const props = defineProps<{
  visible: boolean
  content: string
}>()

defineEmits<{
  (e: 'close'): void
}>()

const containerRef = ref<HTMLElement | null>(null)
let markmapInstance: Markmap | null = null
const transformer = new Transformer()

const renderMindmap = () => {
  if (!containerRef.value || !props.content) return

  const { root } = transformer.transform(props.content)

  if (!markmapInstance) {
    markmapInstance = Markmap.create(containerRef.value, {
      duration: 300,
      maxWidth: 300,
      spacingHorizontal: 80,
      spacingVertical: 16,
      paddingX: 12
    }, root)
  } else {
    markmapInstance.setData(root)
    markmapInstance.fit()
  }
}

const handleFit = () => {
  markmapInstance?.fit()
}

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => {
      // 重置实例，确保容器重新渲染
      if (markmapInstance) {
        markmapInstance.destroy()
        markmapInstance = null
      }
      renderMindmap()
    })
  }
})

watch(() => props.content, () => {
  if (props.visible) renderMindmap()
})

onUnmounted(() => {
  if (markmapInstance) {
    markmapInstance.destroy()
    markmapInstance = null
  }
})
</script>

<style scoped>
.mindmap-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.mindmap-container {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  width: 90vw;
  height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mindmap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.mindmap-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.mindmap-actions {
  display: flex;
  gap: 8px;
}

.mindmap-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.mindmap-body :deep(svg) {
  width: 100%;
  height: 100%;
}

.mindmap-body :deep(.markmap-node text) {
  fill: var(--text-primary);
}

.mindmap-body :deep(.markmap-node circle) {
  fill: var(--accent);
}

.mindmap-body :deep(.markmap-link) {
  stroke: var(--border);
}
</style>
