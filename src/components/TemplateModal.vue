<template>
  <Teleport to="body">
    <div class="modal-overlay" v-if="visible" @click="$emit('close')" @keydown.esc="$emit('close')">
      <div class="modal-content" @click.stop role="dialog" aria-modal="true" aria-label="选择文档模板" tabindex="-1">
        <div class="modal-header">
          <span class="modal-title">新建文档</span>
        </div>
        <div class="modal-body">
          <div class="template-grid">
            <button
              v-for="tpl in templates"
              :key="tpl.name"
              class="template-card"
              @click="$emit('select', tpl)"
            >
              <div class="template-icon" v-html="tpl.icon"></div>
              <div class="template-name">{{ tpl.name }}</div>
              <div class="template-desc">{{ tpl.desc }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
export interface DocTemplate {
  name: string
  desc: string
  icon: string
  content: string
  fileName: string
}

defineProps<{
  visible: boolean
}>()

defineEmits<{
  (e: 'select', template: DocTemplate): void
  (e: 'close'): void
}>()

const templates: DocTemplate[] = [
  {
    name: '空白文档',
    desc: '从零开始',
    fileName: '未命名.md',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    content: ''
  },
  {
    name: 'README',
    desc: '项目说明文档',
    fileName: 'README.md',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
    content: '# 项目名称\n\n## 简介\n\n简要描述项目的功能和用途。\n\n## 功能特性\n\n- 特性一\n- 特性二\n- 特性三\n\n## 安装\n\n```bash\nnpm install\n```\n\n## 使用方法\n\n```bash\nnpm run dev\n```\n\n## 许可证\n\nMIT\n'
  },
  {
    name: '博客文章',
    desc: '技术博客模板',
    fileName: '博客.md',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    content: '# 文章标题\n\n> 一句话摘要\n\n发布日期：2026-06-25\n\n## 背景\n\n介绍文章的背景和动机。\n\n## 正文\n\n### 要点一\n\n内容...\n\n### 要点二\n\n内容...\n\n## 总结\n\n总结全文。\n\n## 参考资料\n\n- [链接](https://example.com)\n'
  },
  {
    name: '笔记',
    desc: '会议/学习笔记',
    fileName: '笔记.md',
    icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg>',
    content: '# 笔记标题\n\n日期：2026-06-25\n\n## 议题\n\n- 议题一\n- 议题二\n\n## 内容\n\n### 议题一\n\n- 要点\n  - 细节\n  - 细节\n\n### 议题二\n\n- 要点\n\n## 待办\n\n- [ ] 任务一\n- [ ] 任务二\n'
  }
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
  min-width: 480px;
  max-width: 560px;
  overflow: hidden;
  outline: none;
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

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.template-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.template-card:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}

.template-icon {
  color: var(--text-secondary);
}

.template-card:hover .template-icon {
  color: var(--accent);
}

.template-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.template-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
