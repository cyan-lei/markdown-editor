import { ref, watch } from 'vue'

const STORAGE_KEY = 'markdown-editor:preferences'

export type EditorMode = 'default' | 'vim' | 'emacs'

export interface Preferences {
  fontSize: number
  lineHeight: number
  editorWidth: number // percentage 20-80
  customCss: string
  editorMode: EditorMode
  wordGoal: number
}

const DEFAULTS: Preferences = {
  fontSize: 14,
  lineHeight: 1.7,
  editorWidth: 50,
  customCss: '',
  editorMode: 'default',
  wordGoal: 0
}

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

export function usePreferences() {
  const preferences = ref<Preferences>(load())

  watch(preferences, (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch {
      // ignore
    }
  }, { deep: true })

  const reset = () => {
    preferences.value = { ...DEFAULTS }
  }

  return {
    preferences,
    reset
  }
}
