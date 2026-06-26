# 编辑器增强功能设计

日期：2026-06-26

## 概述

为 Markdown 编辑器新增 4 项功能：脚注与高亮标记、GitHub Callouts、图片拖拽与 GitHub 图床上传、PWA 离线可用。

## 功能 1：脚注 + 高亮标记

### 需求
- 支持 `[^1]` 脚注引用语法，`[^1]: 定义文本` 脚注定义语法
- 支持 `==高亮文本==` 标记语法，渲染为 `<mark>` 标签

### 实现
在 `src/services/markdownService.ts` 中通过 `markedInstance.use({ extensions: [...] })` 注册自定义扩展：

**脚注扩展**：
- inline 级扩展：匹配 `[^id]`，渲染为 `<sup class="footnote-ref"><a href="#fn-id" id="fnref-id">[id]</a></sup>`
- 在 `renderMarkdown` 返回前，后处理 HTML：提取所有 `[^id]: text` 定义，追加到 HTML 末尾的 `<section class="footnotes">` 列表
- 脚注定义从原文中移除（不显示在正文中）

**高亮扩展**：
- inline 级扩展：匹配 `==text==`，渲染为 `<mark>text</mark>`

**样式**：
- `mark` 背景 `#fef08a`，深色主题 `#854d0e`
- 脚注上标用上标数字，脚注列表底部带分隔线

## 功能 2：GitHub Callouts

### 需求
支持 GitHub 风格的提示框语法：
```
> [!NOTE]
> 内容文本
```
支持 5 种类型：NOTE、TIP、IMPORTANT、WARNING、CAUTION

### 实现
在 `src/services/markdownService.ts` 中添加 blockquote 预处理：

- 在 `renderMarkdown` 中，解析前对原文做正则匹配，识别 blockquote 首行的 `[!TYPE]` 标记
- 转换为 `<div class="callout callout-{type}">` 结构，包含：
  - `<p class="callout-title">` + 类型图标（SVG）+ 类型名
  - blockquote 剩余内容（递归调用 `renderMarkdown` 渲染内部 Markdown）
- 不匹配 `[!TYPE]` 的 blockquote 保持原样

**样式**（每种类型独立配色，含深色主题）：
| 类型 | 图标 | 左边框色 | 背景色 |
|------|------|---------|--------|
| NOTE | info | #0969da | #ddf4ff |
| TIP | flame | #1a7f37 | #dafbe1 |
| IMPORTANT | bell | #8250df | #fbefff |
| WARNING | alert | #9a6700 | #fff8c5 |
| CAUTION | stop | #cf222e | #ffebe9 |

## 功能 3：图片拖拽 + GitHub 图床

### 现状
`EditorPanel.vue#onPaste` 已实现粘贴图片转 base64。

### 需求
- 拖拽图片文件到编辑器，插入为 Markdown 图片
- 可选配置 GitHub 图床，配置后优先上传 GitHub

### 实现

**新增 `src/services/imageService.ts`**：
- `uploadToGitHub(file: File, config: GitHubConfig): Promise<string>`
  - 调用 `PUT https://api.github.com/repos/{owner}/{repo}/contents/{path}/{timestamp}-{filename}`
  - 请求体：`{ message, content: base64, branch }`
  - 返回 `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}/{filename}`
  - 失败抛错，由调用方回退 base64

**GitHubConfig 接口**：
```ts
interface GitHubImageConfig {
  enabled: boolean
  token: string
  owner: string
  repo: string
  branch: string  // 默认 master
  path: string    // 默认 images
}
```

**偏好设置扩展**（`usePreferences.ts`）：
- `Preferences` 新增 `imageConfig: GitHubImageConfig`
- `PreferencesModal.vue` 新增"图床配置"分区

**EditorPanel.vue 改动**：
- `onPaste` 图片分支：检查 `imageConfig.enabled && token`，是则调用 `imageService.uploadToGitHub`，成功插入 URL，失败回退 base64
- 新增 `onDrop` / `onDragover` 事件处理：拖拽图片文件复用同一上传逻辑
- 上传中 Toast 提示"上传中..."，成功/失败 Toast 反馈

## 功能 4：PWA 离线可用

### 需求
- 可安装到桌面
- 离线可打开应用

### 实现

**安装 `vite-plugin-pwa`**

**`vite.config.js` 配置**：
- `registerType: 'autoUpdate'`
- manifest：应用名 "Markdown 编辑器"、主题色、图标
- workbox runtimeCaching：匹配 `cdn.jsdelivr.net` 的 GET 请求，用 `CacheFirst` 策略（缓存 Mermaid/KaTeX）

**应用图标**：
- 生成 192x192 和 512x512 的 PNG 图标
- 放在 `public/` 目录

## 实现顺序

1. 功能 1（脚注 + 高亮）— 纯渲染扩展，最独立
2. 功能 2（Callouts）— 同为渲染扩展
3. 功能 3（图片拖拽 + 图床）— 新 service + UI 配置
4. 功能 4（PWA）— 构建配置，放最后

## 测试要点

- 脚注：`[^1]` 引用与定义配对、多条脚注、脚注定义不出现在正文
- 高亮：`==text==` 渲染为 mark，代码块内不触发
- Callouts：5 种类型正确渲染、嵌套 Markdown、非 callout 的 blockquote 不受影响
- 图片：粘贴/拖拽图片、配置图床上传成功、未配置回退 base64、上传失败回退 base64
- PWA：`npm run build` 后 `npm run preview`，可安装、离线可打开
