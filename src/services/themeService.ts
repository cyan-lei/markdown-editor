import { ref, computed } from 'vue'

export type ThemeName = 'light' | 'dark' | 'duck'

export interface ThemeOption {
  name: ThemeName
  label: string
  icon: string
}

export const themeOptions: ThemeOption[] = [
  { name: 'light', label: '浅色', icon: 'sun' },
  { name: 'dark', label: '深色', icon: 'moon' },
  { name: 'duck', label: 'Duck', icon: 'duck' },
]

const THEME_KEY = 'theme'

export class ThemeService {
  currentTheme = ref<ThemeName>('light')
  isDark = computed(() => this.currentTheme.value === 'dark' || this.currentTheme.value === 'duck')

  private mediaQuery: MediaQueryList | null = null
  private mediaHandler: ((e: MediaQueryListEvent) => void) | null = null

  init() {
    const saved = localStorage.getItem(THEME_KEY) as ThemeName | null
    if (saved && ['light', 'dark', 'duck'].includes(saved)) {
      this.currentTheme.value = saved
    } else {
      // 跟随系统
      this.currentTheme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    this.applyTheme()
    this.watchSystemTheme()
  }

  setTheme(theme: ThemeName) {
    this.currentTheme.value = theme
    this.saveTheme()
    this.applyTheme()
    // 主题切换后重新渲染 Mermaid 图表
    this.refreshMermaid()
  }

  toggle() {
    // 在 light 和 dark 之间切换
    const next: ThemeName = this.currentTheme.value === 'light' ? 'dark' : 'light'
    this.setTheme(next)
  }

  private applyTheme() {
    const root = document.documentElement
    // 清除所有主题类
    root.classList.remove('dark', 'theme-duck')
    // 应用当前主题
    if (this.currentTheme.value === 'dark') {
      root.classList.add('dark')
    } else if (this.currentTheme.value === 'duck') {
      root.classList.add('theme-duck')
    }
  }

  private saveTheme() {
    localStorage.setItem(THEME_KEY, this.currentTheme.value)
  }

  private watchSystemTheme() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.mediaHandler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(THEME_KEY)) {
        this.currentTheme.value = e.matches ? 'dark' : 'light'
        this.applyTheme()
      }
    }
    this.mediaQuery.addEventListener('change', this.mediaHandler)
  }

  private refreshMermaid() {
    // 延迟执行，等待 CSS 变量更新
    setTimeout(() => {
      const previews = document.querySelectorAll('.preview')
      previews.forEach(preview => {
        const mermaidDivs = preview.querySelectorAll('.mermaid[data-processed="true"]')
        let hasMermaid = false
        mermaidDivs.forEach(div => {
          // 从 data-raw 恢复原始 mermaid 代码
          const raw = div.getAttribute('data-raw')
          if (raw) {
            div.removeAttribute('data-processed')
            div.textContent = raw
            hasMermaid = true
          }
        })
        // 触发重新渲染
        if (hasMermaid) {
          import('@/services/markdownService').then(({ renderExtensions }) => {
            renderExtensions(preview as HTMLElement)
          })
        }
      })
    }, 100)
  }
}

export const themeService = new ThemeService()
