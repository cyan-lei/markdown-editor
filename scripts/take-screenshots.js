import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'screenshots');

import fs from 'fs';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const DEMO_MARKDOWN = `# Markdown 编辑器演示

## 功能特性

这是一个功能丰富的 Markdown 编辑器。

### 文本格式化

- **粗体文本**
- *斜体文本*
- ~~删除线文本~~
- \`行内代码\`
- [链接文本](https://example.com)

### 代码块

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}
\`\`\`

### 任务列表

- [x] 已完成的任务
- [ ] 待完成的任务
- [x] 另一个已完成任务

### 表格

| 功能 | 状态 | 说明 |
|------|------|------|
| 实时预览 | ✅ | 左右分栏布局 |
| 多标签 | ✅ | 同时编辑多个文件 |
| 主题切换 | ✅ | 深色/浅色模式 |

### 引用

> 这是一段引用文本。
> 可以包含多行内容。

### 有序列表

1. 第一项
2. 第二项
3. 第三项

### 无序列表

- 项目 A
- 项目 B
- 项目 C

### Mermaid 图表

\`\`\`mermaid
graph TD
    A[开始] --> B{条件判断}
    B -->|是| C[执行操作]
    B -->|否| D[结束]
    C --> D
\`\`\`

### 数学公式

行内公式：$E = mc^2$

块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$
`;

async function takeScreenshots() {
  console.log('启动浏览器...');
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome'  // 使用系统已安装的 Chrome
  });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  try {
    // 访问应用
    console.log('访问应用...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // 等待 mermaid/katex CDN 加载完成

    // 截图 1: 初始空状态
    console.log('截图 1: 初始空状态');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-empty-state.png'),
      fullPage: false 
    });

    // 点击"新建"按钮创建新标签
    console.log('创建新文件...');
    await page.click('button:has-text("新建")');
    await page.waitForTimeout(500);

    // 在编辑器中输入演示内容
    console.log('输入演示内容...');
    const editor = page.locator('textarea');
    await editor.fill(DEMO_MARKDOWN);
    await page.waitForTimeout(2000); // 等待初始渲染

    // 手动触发 mermaid 渲染（确保完成）
    console.log('触发 mermaid 渲染...');
    await page.evaluate(async () => {
      const preview = document.querySelector('.preview');
      if (preview && window.mermaid) {
        const mermaidDivs = preview.querySelectorAll('.mermaid:not([data-processed])');
        if (mermaidDivs.length > 0) {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
          });
          for (let i = 0; i < mermaidDivs.length; i++) {
            const div = mermaidDivs[i];
            try {
              const code = div.textContent || '';
              const { svg } = await window.mermaid.render(`mermaid-svg-${Date.now()}-${i}`, code);
              div.innerHTML = svg;
              div.setAttribute('data-processed', 'true');
            } catch (e) {
              console.error('Mermaid render error:', e);
            }
          }
        }
      }
    });
    await page.waitForTimeout(2000); // 等待渲染完成

    // 截图 2: 整体界面（编辑器 + 预览）
    console.log('截图 2: 整体界面');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-main-interface.png'),
      fullPage: false 
    });

    // 截图 3: 工具栏
    console.log('截图 3: 工具栏');
    const toolbar = page.locator('.editor-toolbar');
    if (await toolbar.count() > 0) {
      await toolbar.screenshot({ 
        path: path.join(screenshotsDir, '03-toolbar.png')
      });
    }

    // 截图 4: 代码块预览
    console.log('截图 4: 代码块预览');
    const preview = page.locator('.preview');
    const codeBlock = preview.locator('pre').first();
    if (await codeBlock.count() > 0) {
      await codeBlock.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await preview.screenshot({ 
        path: path.join(screenshotsDir, '04-code-block.png')
      });
    }

    // 截图 5: 任务列表
    console.log('截图 5: 任务列表');
    const taskList = preview.locator('ul:has(input[type="checkbox"])').first();
    if (await taskList.count() > 0) {
      await taskList.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await taskList.screenshot({ 
        path: path.join(screenshotsDir, '05-task-list.png')
      });
    }

    // 截图 6: 表格
    console.log('截图 6: 表格');
    const table = preview.locator('table').first();
    if (await table.count() > 0) {
      await table.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await table.screenshot({ 
        path: path.join(screenshotsDir, '06-table.png')
      });
    }

    // 截图 7: Mermaid 图表 - 等待 SVG 渲染完成
    console.log('截图 7: Mermaid 图表');
    const mermaid = preview.locator('.mermaid').first();
    if (await mermaid.count() > 0) {
      await mermaid.scrollIntoViewIfNeeded();
      // 等待 mermaid SVG 渲染完成（检查 svg 子元素且有实际内容）
      await page.waitForFunction(() => {
        const el = document.querySelector('.mermaid[data-processed="true"] svg');
        if (!el) return false;
        return el.children.length > 0 || el.innerHTML.length > 100;
      }, { timeout: 15000 }).catch(() => console.log('  mermaid SVG 等待超时'));
      await page.waitForTimeout(2000); // 额外等待确保渲染完成
      // 截取整个预览面板（确保能看到完整的 mermaid 图表）
      await preview.screenshot({ 
        path: path.join(screenshotsDir, '07-mermaid.png')
      });
      console.log('  mermaid 截图完成');
    } else {
      console.log('  未找到 mermaid 元素');
    }

    // 截图 8: 数学公式
    console.log('截图 8: 数学公式');
    await page.evaluate(() => {
      const preview = document.querySelector('.preview');
      if (preview) preview.scrollTop = preview.scrollHeight;
    });
    await page.waitForTimeout(2000); // 等待 KaTeX 渲染
    await preview.screenshot({ 
      path: path.join(screenshotsDir, '08-math-formula.png')
    });

    // 截图 9: 目录导航
    console.log('截图 9: 目录导航');
    const toc = page.locator('.toc').first();
    if (await toc.count() > 0) {
      await toc.screenshot({ 
        path: path.join(screenshotsDir, '09-toc.png')
      });
    }

    // 截图 10: 状态栏
    console.log('截图 10: 状态栏');
    const statusBar = page.locator('.status-bar').first();
    if (await statusBar.count() > 0) {
      await statusBar.screenshot({ 
        path: path.join(screenshotsDir, '10-status-bar.png')
      });
    }

    // 截图 11: 深色主题
    console.log('截图 11: 深色主题');
    // 先滚动回顶部
    await page.evaluate(() => {
      const preview = document.querySelector('.preview');
      if (preview) preview.scrollTop = 0;
    });
    await page.click('button[title*="切换"]');
    await page.waitForTimeout(1000); // 等待主题切换和重新渲染
    await page.screenshot({ 
      path: path.join(screenshotsDir, '11-dark-theme.png'),
      fullPage: false 
    });

    // 截图 12: 导出菜单
    console.log('截图 12: 导出菜单');
    await page.click('button:has-text("导出")');
    await page.waitForTimeout(300);
    const exportMenu = page.locator('.export-menu').first();
    if (await exportMenu.count() > 0) {
      await exportMenu.screenshot({ 
        path: path.join(screenshotsDir, '12-export-menu.png')
      });
    }

    console.log('所有截图已完成！');
    console.log(`截图保存在: ${screenshotsDir}`);

  } catch (error) {
    console.error('截图过程中出错:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
