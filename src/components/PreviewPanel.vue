<template>
  <div class="preview-panel">
    <div class="panel-header">
      <span class="panel-title">PREVIEW</span>
    </div>
    <div class="preview" ref="previewRef" v-html="html" @scroll="onScroll" @click="handleClick"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { renderExtensions } from '@/services/markdownService'

const props = defineProps<{
  html: string
}>()

const emit = defineEmits<{
  (e: 'scroll', scrollTop: number, scrollHeight: number, clientHeight: number): void
  (e: 'toggleTask', lineIndex: number): void
}>()

const scrollRatio = ref(0)
const previewRef = ref<HTMLElement | null>(null)

// 渲染 Mermaid/KaTeX 扩展
const processExtensions = async () => {
  await nextTick()
  if (previewRef.value) {
    try {
      await renderExtensions(previewRef.value)
    } catch (err) {
      console.error('Render extensions failed:', err)
    }
  }
}

watch(() => props.html, () => {
  if (previewRef.value && scrollRatio.value > 0) {
    const el = previewRef.value
    const scrollHeight = el.scrollHeight - el.clientHeight
    el.scrollTop = scrollRatio.value * scrollHeight
  }
  processExtensions()
})

// 组件挂载后立即处理一次（解决首次打开文件时 mermaid 不渲染的问题）
onMounted(() => {
  if (props.html) {
    processExtensions()
  }
})

const onScroll = () => {
  const el = previewRef.value
  if (el) {
    emit('scroll', el.scrollTop, el.scrollHeight, el.clientHeight)
  }
}

// Task list checkbox interactivity
const handleClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
    const allCheckboxes = previewRef.value?.querySelectorAll('input[type="checkbox"]')
    if (allCheckboxes) {
      const index = Array.from(allCheckboxes).indexOf(target as HTMLInputElement)
      if (index >= 0) emit('toggleTask', index)
    }
  }
}

defineExpose({
  setScrollRatio: (ratio: number) => {
    scrollRatio.value = ratio
    if (previewRef.value) {
      const el = previewRef.value
      const scrollHeight = el.scrollHeight - el.clientHeight
      if (scrollHeight > 0) {
        el.scrollTop = ratio * scrollHeight
      }
    }
  },
  scrollToHeading: (slug: string) => {
    if (!previewRef.value) return
    const headings = previewRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
    for (const h of headings) {
      const text = h.textContent || ''
      const hSlug = text.toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      if (hSlug === slug) {
        // 手动设置 scrollTop，避免 scrollIntoView 滚动祖先容器（导致目录消失）
        const targetTop = (h as HTMLElement).offsetTop
        previewRef.value.scrollTo({ top: targetTop, behavior: 'smooth' })
        break
      }
    }
  }
})
</script>

<style scoped>
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  overflow: hidden;
  min-height: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
}

.preview {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
  min-height: 0;
}

.preview p {
  margin: 12px 0;
  color: var(--text-secondary);
}

.preview br {
  display: block;
  height: 8px;
  content: '';
}

.preview h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 24px 0 16px;
  letter-spacing: -0.5px;
}

.preview h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 20px 0 12px;
}

.preview h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 16px 0 10px;
}

.preview strong {
  font-weight: 600;
}

.preview em {
  font-style: italic;
}

.preview a {
  color: var(--accent);
  text-decoration: none;
}

.preview a:hover {
  text-decoration: underline;
}

.preview code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  background: var(--code-bg);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--code-text);
}

.preview :deep(pre) {
  position: relative;
  background: var(--code-block-bg);
  padding: 34px 16px 16px;
  border-radius: var(--radius);
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid var(--border);
}

.preview :deep(pre)::before {
  content: '';
  position: absolute;
  top: 12px;
  left: 16px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff5f56;
  box-shadow: 20px 0 0 #ffbd2e, 40px 0 0 #27c93f;
  z-index: 1;
}

.preview :deep(pre[data-lang])::after {
  content: attr(data-lang);
  position: absolute;
  top: 9px;
  right: 14px;
  padding: 2px 8px;
  background: var(--code-lang-bg);
  color: var(--code-lang-text);
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  border-radius: 4px;
  user-select: none;
  z-index: 1;
}

.preview :deep(pre code),
.preview :deep(.hljs) {
  display: block;
  background: transparent !important;
  padding: 0 !important;
  color: var(--code-block-text);
  border-radius: 0;
  white-space: pre;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.preview ul,
.preview ol {
  margin: 12px 0;
  padding-left: 24px;
}

.preview li {
  margin: 6px 0;
}

.preview :deep(input[type="checkbox"]) {
  margin-right: 6px;
  cursor: pointer;
}

.preview blockquote {
  border-left: 4px solid var(--accent);
  margin: 16px 0;
  padding: 12px 16px;
  background: var(--accent-light);
  border-radius: 0 var(--radius) var(--radius) 0;
}

.preview :deep(blockquote p) {
  margin: 0;
  color: var(--text-secondary);
}

.preview hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 24px 0;
}

.preview table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.preview :deep(th),
.preview :deep(td) {
  border: 1px solid var(--border);
  padding: 10px 14px;
  text-align: left;
}

.preview :deep(th) {
  background: var(--bg-tertiary);
  font-weight: 600;
  color: var(--text-primary);
}

.preview :deep(tr:nth-child(even)) {
  background: var(--bg-tertiary);
}

.preview :deep(.hljs-keyword),
.preview :deep(.hljs-selector-tag) {
  color: var(--hljs-keyword);
}

.preview :deep(.hljs-string) {
  color: var(--hljs-string);
}

.preview :deep(.hljs-number) {
  color: var(--hljs-number);
}

.preview :deep(.hljs-function),
.preview :deep(.hljs-title) {
  color: var(--hljs-function);
}

.preview :deep(.hljs-comment) {
  color: var(--hljs-comment);
}

.preview :deep(.hljs-selector-class) {
  color: var(--hljs-selector-class);
}

.preview :deep(.hljs-attr) {
  color: var(--hljs-attr);
}

.preview :deep(.hljs-built_in) {
  color: var(--hljs-built_in);
}

.preview :deep(.hljs-tag) {
  color: var(--hljs-tag);
}

.preview :deep(.hljs-name) {
  color: var(--hljs-name);
}

.preview :deep(.mermaid) {
  text-align: center;
  margin: 16px 0;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  min-height: 60px;
}

.preview :deep(.mermaid svg) {
  max-width: 100%;
  height: auto;
}

.preview :deep(.mermaid[data-processed]) {
  background: var(--bg-secondary);
}
</style>
