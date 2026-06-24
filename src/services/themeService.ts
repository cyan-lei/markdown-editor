import { ref } from 'vue'

export class ThemeService {
  isDark = ref(false)
  private mediaQuery: MediaQueryList | null = null
  private mediaHandler: ((e: MediaQueryListEvent) => void) | null = null

  init() {
    const saved = localStorage.getItem('theme')
    if (saved) {
      // 有保存的偏好则使用保存值
      this.isDark.value = saved === 'dark'
    } else {
      // 否则跟随系统
      this.isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    this.applyTheme()
    this.watchSystemTheme()
  }

  toggle() {
    this.isDark.value = !this.isDark.value
    this.saveTheme()
    this.applyTheme()
  }

  private applyTheme() {
    document.documentElement.classList.toggle('dark', this.isDark.value)
  }

  private saveTheme() {
    localStorage.setItem('theme', this.isDark.value ? 'dark' : 'light')
  }

  private watchSystemTheme() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.mediaHandler = (e: MediaQueryListEvent) => {
      // 仅在用户未手动设置偏好时跟随系统
      if (!localStorage.getItem('theme')) {
        this.isDark.value = e.matches
        this.applyTheme()
      }
    }
    this.mediaQuery.addEventListener('change', this.mediaHandler)
  }
}

export const themeService = new ThemeService()
