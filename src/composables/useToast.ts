import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

// 模块级单例状态，与 useEditor / useHistory 同模式
const toasts = ref<Toast[]>([])
let idCounter = 0

// 记录每个 toast 的定时器，供组件层暂停/恢复
const timers = new Map<number, ReturnType<typeof setTimeout>>()

export function useToast() {
  const showToast = (message: string, type: ToastType = 'success', duration = 2500): number => {
    const id = ++idCounter
    toasts.value.push({ id, message, type })

    const timer = setTimeout(() => {
      removeToast(id)
    }, duration)
    timers.set(id, timer)

    return id
  }

  const removeToast = (id: number) => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      toasts.value.splice(idx, 1)
    }
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  // 暂停某个 toast 的自动消失计时
  const pauseToast = (id: number) => {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  // 恢复某个 toast 的自动消失计时
  const resumeToast = (id: number, duration = 2500) => {
    if (timers.has(id)) return // 已有计时器，不重复
    const timer = setTimeout(() => {
      removeToast(id)
    }, duration)
    timers.set(id, timer)
  }

  return {
    toasts,
    showToast,
    removeToast,
    pauseToast,
    resumeToast
  }
}
