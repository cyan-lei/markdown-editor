# Markdown Editor

基于 Vue3 + Vite 构建的现代化 Markdown 编辑器，支持实时预览、多标签编辑、主题切换、Mermaid 图表、数学公式等功能。

## 功能预览

![整体界面](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/02-main-interface.png)

## 功能特性

### 核心编辑
- **实时预览** — 左右分栏布局，编辑即所见，编辑区与预览区滚动同步
- **多标签编辑** — 同时打开多个文档，支持标签切换、右键菜单（关闭/关闭其他/关闭右侧/复制文件名）
- **可拖拽分栏** — 编辑器与预览区宽度可自由拖拽调整
- **格式化插入** — 工具栏快捷插入粗体、斜体、删除线、行内代码、链接、图片、标题、引用、有序/无序列表、任务列表、表格、分割线

![工具栏](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/03-toolbar.png)

- **语法高亮** — 基于 highlight.js 的代码块高亮，预览区显示语言标签

![代码块](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/04-code-block.png)

- **目录导航（TOC）** — 自动提取标题生成目录，点击跳转对应位置
- **任务列表** — 支持 `- [ ]` / `- [x]` 语法，预览区可直接点击复选框切换状态

![任务列表](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/05-task-list.png)

- **Mermaid 图表** — 支持 ```` ```mermaid ```` 代码块，动态渲染流程图、时序图、甘特图、类图、饼图等

![Mermaid 图表](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/07-mermaid.png)

- **数学公式** — 支持 KaTeX 渲染，`$...$` 行内公式、`$$...$$` 块级公式

![数学公式](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/08-math-formula.png)

- **搜索与替换** — 支持大小写敏感、逐个定位、替换/全部替换
- **撤销/重做** — 完整编辑历史记录
- **状态栏** — 实时显示光标所在行号、列号、字符数、词数、选中字符数

![状态栏](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/10-status-bar.png)

### 文件管理
- **打开/保存文件** — 通过 File System Access API 直接读写本地文件
- **拖放导入** — 将 `.md` / `.markdown` / `.txt` 文件拖入窗口即可打开
- **新建文件** — 快速创建空白文档
- **最近文件** — 记录最近打开的文件，方便快速 reopening
- **未保存提示** — 关闭标签或退出时检测未保存更改，弹窗确认

### 自动保存与草稿恢复
- **自动保存** — 编辑内容自动暂存到 localStorage，防止意外丢失
- **草稿恢复** — 重新启动时检测未保存的草稿，可选择恢复或丢弃

### 导出
- **下载 Markdown** — 导出为 `.md` 文件
- **导出 HTML** — 渲染后导出为独立 HTML 文件
- **导出 PDF** — 通过浏览器打印功能导出 PDF

### 个性化
- **深色/浅色主题** — 一键切换，偏好持久化

![深色主题](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/11-dark-theme.png)

- **偏好设置** — 可调整字体大小、行高、编辑器宽度等
- **快捷键** — 支持 `Ctrl+N` 新建、`Ctrl+O` 打开、`Ctrl+S` 保存、`Ctrl+W` 关闭标签、`Ctrl+Tab` 切换标签

更多功能介绍详见 [docs/features.md](docs/features.md)

## 技术栈

- **Vue 3** — Composition API + `<script setup>`
- **Vite 5** — 构建工具
- **marked** — Markdown 解析
- **marked-highlight** — 代码高亮集成
- **highlight.js** — 代码语法高亮
- **Mermaid** — 图表渲染
- **KaTeX** — 数学公式渲染
- **File System Access API** — 本地文件读写

## 项目结构

```
markdown-editor/
├── src/
│   ├── components/      # Vue 组件
│   ├── composables/     # 组合式函数（状态管理、快捷键等）
│   ├── services/        # 核心服务（Markdown 渲染、文件操作等）
│   ├── styles/          # 全局样式
│   ├── types/           # TypeScript 类型定义
│   └── views/           # 页面视图
├── docs/                # 文档
└── scripts/             # 截图脚本
```

## 安装

```bash
cd markdown-editor
npm install
```

## 运行

```bash
npm run dev
```

## 构建

```bash
npm run build
```

## 许可证

MIT
