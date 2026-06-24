import { Marked, Renderer } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

// --- Mermaid/KaTeX dynamic CDN loader ---
const CDN = {
  mermaid: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js',
  katexCss: 'https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css',
  katexJs: 'https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js'
}

const loadedScripts = new Set<string>()

function loadScript(src: string): Promise<void> {
  if (loadedScripts.has(src)) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      loadedScripts.add(src)
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => { loadedScripts.add(src); resolve() }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

function loadStyle(href: string): Promise<void> {
  if (loadedScripts.has(href)) return Promise.resolve()
  return new Promise((resolve) => {
    const existing = document.querySelector(`link[href="${href}"]`)
    if (existing) {
      loadedScripts.add(href)
      resolve()
      return
    }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.onload = () => { loadedScripts.add(href); resolve() }
    document.head.appendChild(link)
  })
}

// --- Marked instance with Mermaid interception ---
const markedInstance = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      // Intercept mermaid code blocks — don't highlight, just return raw
      if (lang === 'mermaid') return code
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    }
  })
)

markedInstance.use({ breaks: true, gfm: true })

// Custom renderer: wrap mermaid code blocks in a div for post-processing
// marked v11 renderer.code 签名: code(code, infoString, escaped)
markedInstance.use({
  renderer: {
    code(code: string, infoString: string | undefined): string | false {
      const lang = (infoString || '').trim().split(/\s+/)[0]
      if (lang === 'mermaid') {
        // 转义 HTML 特殊字符，防止 XSS / 错误解析
        const escaped = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
        return `<div class="mermaid">${escaped}</div>\n`
      }
      return false // 回退到 markedHighlight 的 renderer（高亮处理）
    }
  }
})

// --- Public API ---

export function renderMarkdown(content: string): string {
  try {
    const result = markedInstance.parse(content)
    const html = typeof result === 'string' ? result : String(result)
    return html.replace(
      /<pre><code class="hljs language-([^"]*)">/g,
      (_match, lang) => `<pre data-lang="${lang}"><code class="hljs language-${lang}">`
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return `<div style="padding:16px;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">Markdown 渲染错误: ${msg}</div>`
  }
}

/**
 * 等待 window.mermaid 加载完成（最多等待 3 秒）
 */
function waitForMermaid(maxWait = 3000): Promise<any> {
  return new Promise((resolve) => {
    const mermaid = (window as any).mermaid
    if (mermaid) {
      resolve(mermaid)
      return
    }
    const start = Date.now()
    const timer = setInterval(() => {
      const m = (window as any).mermaid
      if (m) {
        clearInterval(timer)
        resolve(m)
      } else if (Date.now() - start > maxWait) {
        clearInterval(timer)
        resolve(null)
      }
    }, 50)
  })
}

/**
 * Post-process rendered HTML in a DOM container:
 * - Render Mermaid diagrams
 * - Render KaTeX math expressions
 * - Make task list checkboxes interactive
 * Call after v-html content is updated.
 */
export async function renderExtensions(container: HTMLElement): Promise<void> {
  // --- Mermaid ---
  const mermaidDivs = container.querySelectorAll('.mermaid:not([data-processed])')
  if (mermaidDivs.length > 0) {
    const mermaid = await waitForMermaid()
    if (mermaid) {
      const isDark = document.documentElement.classList.contains('dark')
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit'
      })
      let renderIndex = 0
      for (const div of mermaidDivs) {
        try {
          // textContent 会自动反转义 HTML 实体，得到原始 mermaid 代码
          const code = div.textContent || ''
          const id = `mermaid-svg-${Date.now()}-${renderIndex++}`
          const { svg } = await mermaid.render(id, code)
          div.innerHTML = svg
          div.setAttribute('data-processed', 'true')
        } catch (err) {
          console.warn('Mermaid render error:', err)
          div.innerHTML = '<span style="color:#dc2626;padding:8px;">⚠ Mermaid 图表渲染失败，请检查语法</span>'
          div.setAttribute('data-processed', 'true')
        }
      }
    } else {
      console.warn('Mermaid library not loaded')
    }
  }

  // --- KaTeX (inline $...$ and block $$...$$) ---
  const hasMath = /\$/.test(container.textContent || '')
  if (hasMath) {
    const katex = (window as any).katex
    if (katex) {
      // Block math: $$...$$
      const blockRegex = /\$\$([\s\S]+?)\$\$/g
      const inlineRegex = /(?<!\$)\$(?!\$)([^$\n]+?)\$/g

      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || ''
          if (!text.includes('$')) return
          const span = document.createElement('span')
          let html = text
          html = html.replace(blockRegex, (_, expr) => {
            try { return katex.renderToString(expr, { displayMode: true, throwOnError: false }) } catch { return _ }
          })
          html = html.replace(inlineRegex, (_, expr) => {
            try { return katex.renderToString(expr, { displayMode: false, throwOnError: false }) } catch { return _ }
          })
          span.innerHTML = html
          node.parentNode?.replaceChild(span, node)
        } else if (node.nodeType === Node.ELEMENT_NODE && !(node as HTMLElement).classList.contains('mermaid')) {
          // Skip code blocks and pre elements
          const el = node as HTMLElement
          if (el.tagName === 'CODE' || el.tagName === 'PRE') return
          Array.from(node.childNodes).forEach(walk)
        }
      }
      Array.from(container.childNodes).forEach(walk)
    } else {
      console.warn('KaTeX library not loaded')
    }
  }
}
