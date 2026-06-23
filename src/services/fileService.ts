import type { Tab } from '@/types'
import { renderMarkdown } from '@/services/markdownService'

export class FileService {
  async openFiles(): Promise<Omit<Tab, 'id'>[]> {
    try {
      const fileHandles = await window.showOpenFilePicker({
        types: [{
          description: 'Markdown文件',
          accept: { 'text/markdown': ['.md', '.markdown', '.txt'] }
        }],
        multiple: true
      })

      const tabs: Omit<Tab, 'id'>[] = []

      for (const fileHandle of fileHandles) {
        const file = await fileHandle.getFile()
        const content = await file.text()
        tabs.push({
          name: file.name,
          content,
          fileHandle,
          modified: false
        })
      }

      return tabs
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        return await this.fallbackOpenFiles()
      }
      return []
    }
  }

  private fallbackOpenFiles(): Promise<Omit<Tab, 'id'>[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md,.markdown,.txt'
      input.multiple = true
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files
        if (!files) {
          resolve([])
          return
        }

        const tabs: Omit<Tab, 'id'>[] = []

        for (const file of files) {
          const content = await file.text()
          tabs.push({
            name: file.name,
            content,
            fileHandle: null,
            modified: false
          })
        }

        resolve(tabs)
      }
      input.click()
    })
  }

  async saveFile(tab: Tab): Promise<boolean> {
    if (!tab.fileHandle) return false

    try {
      const writable = await tab.fileHandle.createWritable()
      await writable.write(tab.content)
      await writable.close()
      tab.modified = false
      return true
    } catch (err) {
      console.error('Save failed:', err)
      return false
    }
  }

  async saveAsFile(tab: Tab): Promise<boolean> {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: tab.name,
        types: [{
          description: 'Markdown文件',
          accept: { 'text/markdown': ['.md'] }
        }]
      })

      const writable = await fileHandle.createWritable()
      await writable.write(tab.content)
      await writable.close()

      tab.fileHandle = fileHandle
      tab.name = (await fileHandle.getFile()).name
      tab.modified = false

      return true
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        this.fallbackDownload(tab)
      }
      return false
    }
  }

  async downloadFile(tab: Tab): Promise<void> {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: tab.name || 'document.md',
        types: [{
          description: 'Markdown文件',
          accept: { 'text/markdown': ['.md'] }
        }]
      })

      const writable = await fileHandle.createWritable()
      await writable.write(tab.content)
      await writable.close()
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        this.fallbackDownload(tab)
      }
    }
  }

  exportHTML(tab: Tab): void {
    const html = renderMarkdown(tab.content)
    const fullHTML = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${tab.name}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #1a1a1a; }
pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
code { font-family: 'JetBrains Mono', monospace; font-size: 13px; }
pre code { background: none; padding: 0; }
code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
blockquote { border-left: 4px solid #2563eb; margin: 16px 0; padding: 12px 16px; background: #eff6ff; border-radius: 0 8px 8px 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #e5e5e5; padding: 10px 14px; }
th { background: #f5f5f5; }
img { max-width: 100%; }
</style>
</head>
<body>
${html}
</body>
</html>`

    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = tab.name.replace(/\.md$/, '.html') || 'document.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  exportPDF(tab: Tab): void {
    const html = renderMarkdown(tab.content)
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>${tab.name}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #1a1a1a; }
pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
code { font-family: 'JetBrains Mono', monospace; font-size: 13px; }
pre code { background: none; padding: 0; }
code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
blockquote { border-left: 4px solid #2563eb; margin: 16px 0; padding: 12px 16px; background: #eff6ff; border-radius: 0 8px 8px 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #e5e5e5; padding: 10px 14px; }
th { background: #f5f5f5; }
img { max-width: 100%; }
@media print { body { margin: 0; } }
</style>
</head>
<body>
${html}
</body>
</html>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 500)
  }

  private fallbackDownload(tab: Tab): void {
    const blob = new Blob([tab.content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = tab.name || 'document.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}

export const fileService = new FileService()
