import { computed, type Ref } from 'vue'

export interface TocItem {
  level: number
  text: string
  slug: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function useToc(content: Ref<string>) {
  const toc = computed<TocItem[]>(() => {
    const lines = content.value.split('\n')
    const items: TocItem[] = []
    let inCodeBlock = false

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock
        continue
      }
      if (inCodeBlock) continue

      // ATX-style headings: # Title
      const match = line.match(/^(#{1,6})\s+(.+)/)
      if (match) {
        const level = match[1].length
        const text = match[2].replace(/[#*`_~]/g, '').trim()
        if (text) {
          items.push({ level, text, slug: slugify(text) })
        }
      }
    }

    return items
  })

  return { toc }
}
