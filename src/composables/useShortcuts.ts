import { onMounted, onUnmounted, type Ref } from 'vue'

type ShortcutHandler = (e: KeyboardEvent) => void

function normalizeCombo(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('ctrl')
  if (e.shiftKey) parts.push('shift')
  if (e.altKey) parts.push('alt')
  const key = e.key.toLowerCase()
  if (['control', 'shift', 'alt', 'meta'].includes(key)) return ''
  parts.push(key)
  return parts.join('+')
}

export function useShortcuts(target: 'window' | Ref<HTMLElement | null>) {
  const handlers = new Map<string, ShortcutHandler>()

  const handleKeydown = (e: Event) => {
    const keyEvent = e as KeyboardEvent
    const combo = normalizeCombo(keyEvent)
    if (!combo) return
    const handler = handlers.get(combo)
    if (handler) {
      handler(keyEvent)
    }
  }

  const register = (combo: string, handler: ShortcutHandler) => {
    handlers.set(combo.toLowerCase(), handler)
  }

  const unregister = (combo: string) => {
    handlers.delete(combo.toLowerCase())
  }

  let targetEl: EventTarget

  onMounted(() => {
    if (target === 'window') {
      targetEl = window
    } else {
      targetEl = target.value || window
    }
    targetEl.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    targetEl.removeEventListener('keydown', handleKeydown)
  })

  return { register, unregister }
}
