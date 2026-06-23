import type { Tab } from '@/types'

export class EditorService {
  closeTabWithCheck(tab: Tab): boolean {
    if (!tab.modified) return true
    return confirm(`${tab.name} 有未保存的更改，确定要关闭吗？`)
  }
}

export const editorService = new EditorService()
