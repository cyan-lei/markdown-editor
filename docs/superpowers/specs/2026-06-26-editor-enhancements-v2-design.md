# 编辑器增强功能 V2 设计

日期：2026-06-26

## 概述

新增 3 项功能：打字机模式、Markdown 格式化、思维导图导出。

## 功能 1：打字机模式

### 需求
- 开启后光标所在行始终保持在编辑器视口垂直中央
- 偏好设置可开关，持久化

### 实现
- `usePreferences.ts` 新增 `typewriterMode: boolean`（默认 false）
- `EditorPanel.vue` 在 `onInput`、`onKeyUp`、`onClick` 事件后，若开启打字机模式，计算当前行位置并设置 `scrollTop` 使光标行居中
- 居中逻辑：`scrollTop = cursorLineTop - (clientHeight - lineHeight) / 2`
- 偏好设置新增开关项

## 功能 2：Markdown 格式化

### 需求
- 空行规范化：连续空行最多保留 1 个，标题前后各保证 1 空行，文档首尾无多余空行
- 列表缩进统一为 2 空格
- 表格自动对齐列宽
- 代码块语言标签统一（ts→typescript、js→javascript、py→python、sh→bash）
- 行尾空格清理

### 实现
**新建 `src/services/formatService.ts`**，导出 `formatMarkdown(content: string): string`

格式化步骤（按顺序）：
1. 行尾空格清理：`replace(/[ \t]+$/gm, '')`
2. 代码块语言标签统一：正则匹配 ` ```lang ` 替换常见缩写
3. 表格对齐：识别 GFM 表格块，计算每列最大宽度，用空格补齐对齐 `|` 和 `-`
4. 列表缩进规范化：统一嵌层级为 2 空格倍数
5. 空行规范化：连续空行压缩为 1 个，标题 `#` 前后确保空行，首尾 trim

**UI**：工具栏新增格式化按钮（AppIcon name="wand"），点击调用 `formatMarkdown`，更新内容并推入撤销栈。

## 功能 3：思维导图

### 需求
- 从当前文档标题结构生成可交互思维导图
- 支持缩放、拖拽、折叠节点
- 弹窗形式展示

### 实现
**安装 `markmap-lib` + `markmap-view`**

**新建 `src/components/MindmapModal.vue`**：
- props: `visible`、`content`（Markdown 源码）
- 用 `markmap-lib` 的 Transformer 将 Markdown 转为 markmap 数据
- 用 `markmap-view` 的 Markmap 渲染到 SVG 容器
- 弹窗全屏展示，关闭按钮

**UI**：工具栏新增思维导图按钮（AppIcon name="mindmap"），点击打开弹窗。

## 实现顺序

1. 打字机模式（最简单，仅 EditorPanel + Preferences）
2. 格式化（独立 service + 工具栏按钮）
3. 思维导图（需装依赖，新建组件）
