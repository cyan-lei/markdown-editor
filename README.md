# Markdown Editor

基于 Vue3 + Vite 构建的现代化 Markdown 编辑器，支持实时预览、多标签编辑、主题切换、Mermaid 图表、数学公式、思维导图、PWA 离线使用等功能。

## 功能预览

![整体界面](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/02-main-interface.png)

## 功能特性

### 核心编辑
- **实时预览** — 左右分栏布局，编辑即所见，编辑区与预览区滚动同步
- **多标签编辑** — 同时打开多个文档，支持标签切换、拖拽排序、右键菜单（关闭/关闭其他/关闭右侧/复制文件名/固定标签）
- **可拖拽分栏** — 编辑器与预览区宽度可自由拖拽调整
- **格式化插入** — 工具栏快捷插入粗体、斜体、删除线、行内代码、链接、图片、标题、引用、有序/无序列表、任务列表、表格、分割线
- **Markdown 标记包裹** — 选中文本后按快捷键自动包裹 `**` `*` `` ` `` `~~` 等标记
- **表格可视化编辑** — 通过界面操作插入和编辑表格

![工具栏](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/03-toolbar.png)

- **语法高亮** — 基于 highlight.js 的代码块高亮，预览区显示语言标签

![代码块](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/04-code-block.png)

- **目录导航（TOC）** — 自动提取标题生成目录，点击跳转，滚动高亮当前位置
- **任务列表** — 支持 `- [ ]` / `- [x]` 语法，预览区可直接点击复选框切换状态

![任务列表](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/05-task-list.png)

- **Mermaid 图表** — 支持 ```` ```mermaid ```` 代码块，动态渲染流程图、时序图、甘特图、类图、饼图等

![Mermaid 图表](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/07-mermaid.png)

- **数学公式** — 支持 KaTeX 渲染，`$...$` 行内公式、`$$...$$` 块级公式

![数学公式](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/08-math-formula.png)

- **脚注** — 支持 `[^1]` 脚注引用和 `[^1]: 定义` 脚注定义语法，渲染为上标链接和底部脚注列表
- **高亮标记** — 支持 `==高亮文本==` 语法，渲染为黄色背景标记
- **GitHub Callouts** — 支持 `> [!NOTE]` `> [!TIP]` `> [!IMPORTANT]` `> [!WARNING]` `> [!CAUTION]` 五种提示框，配色跟随 GitHub
- **搜索与替换** — 支持大小写敏感、逐个定位、替换/全部替换、搜索历史
- **跨文件搜索** — 全局搜索所有打开的文档，快速定位内容
- **跳转到行** — 快速跳转到指定行号
- **自动配对符号** — 输入 `(` `[` `{` 自动补全配对
- **撤销/重做** — 完整编辑历史记录，切换标签保留历史
- **状态栏** — 实时显示光标行号、列号、字符数、词数、段落数、阅读时长、选中字符数

![状态栏](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/10-status-bar.png)

### 文档格式化
- **一键格式化** — 自动规范空行、统一列表缩进、对齐表格列宽、统一代码块语言标签、清理行尾空格

### 思维导图
- **思维导图导出** — 从文档标题结构一键生成可交互思维导图，支持缩放、拖拽、折叠节点

### 图片管理
- **图片粘贴** — 粘贴剪贴板图片自动插入 Markdown，支持转 base64 内嵌
- **图片拖拽** — 拖拽图片文件到编辑器自动插入
- **GitHub 图床** — 可选配置 GitHub 仓库作为图床，粘贴/拖拽图片自动上传，失败回退 base64

### 文件管理
- **打开/保存文件** — 通过 File System Access API 直接读写本地文件
- **拖放导入** — 将 `.md` / `.markdown` / `.txt` 文件拖入窗口即可打开
- **新建文件** — 快速创建空白文档，支持从模板创建
- **最近文件** — 记录最近打开的文件，方便快速 reopening
- **链接验证** — 检查文档中的链接是否有效
- **未保存提示** — 关闭标签或退出时检测未保存更改，弹窗确认

### 自动保存与草稿恢复
- **自动保存** — 编辑内容自动暂存到 localStorage，防止意外丢失
- **草稿恢复** — 重新启动时检测未保存的草稿，可选择恢复或丢弃

### 导出
- **下载 Markdown** — 导出为 `.md` 文件
- **导出 HTML** — 渲染后导出为独立 HTML 文件，支持自定义 CSS
- **导出 PDF** — 通过浏览器打印功能导出 PDF
- **导出大纲** — 提取标题结构导出为 Markdown 大纲文件

### 个性化
- **深色/浅色/Duck 主题** — 一键切换，Mermaid 和代码高亮自动适配

![深色主题](https://raw.githubusercontent.com/cyan-lei/markdown-editor/master/scripts/screenshots/11-dark-theme.png)

- **偏好设置** — 可调整字体大小、行高、编辑器宽度、自动换行、拼写检查、滚动同步等
- **打字机模式** — 光标所在行始终保持在编辑器视口中央，沉浸式写作体验
- **Vim / Emacs 模式** — 支持 Vim 和 Emacs 键位绑定
- **自定义预览 CSS** — 自定义预览区样式
- **字数目标** — 设置写作字数目标，状态栏实时显示进度
- **快捷键** — 支持 `Ctrl+N` 新建、`Ctrl+O` 打开、`Ctrl+S` 保存、`Ctrl+W` 关闭标签、`Ctrl+Tab` 切换标签、`Ctrl+F` 搜索、`Ctrl+H` 替换等

### PWA 离线使用
- **可安装** — 安装到桌面作为独立应用
- **离线可用** — Service Worker 缓存应用资源，断网仍可使用
- **CDN 资源缓存** — Mermaid、KaTeX 等 CDN 资源自动缓存

更多功能介绍详见 [docs/features.md](docs/features.md)

## 技术栈

- **Vue 3** — Composition API + `<script setup>`
- **Vite 5** — 构建工具
- **marked** — Markdown 解析
- **marked-highlight** — 代码高亮集成
- **highlight.js** — 代码语法高亮
- **Mermaid** — 图表渲染
- **KaTeX** — 数学公式渲染
- **markmap** — 思维导图渲染
- **vite-plugin-pwa** — PWA 离线支持
- **File System Access API** — 本地文件读写

## 项目结构

```
markdown-editor/
├── src/
│   ├── components/      # Vue 组件
│   ├── composables/     # 组合式函数（状态管理、快捷键等）
│   ├── services/        # 核心服务（Markdown 渲染、文件操作、格式化、图床等）
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
