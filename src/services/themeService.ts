import { ref } from 'vue'

export class ThemeService {
  isDark = ref(false)

  init() {
    this.isDark.value = localStorage.getItem('theme') === 'dark'
    this.applyTheme()
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
}

export const themeService = new ThemeService()
