import { ref, watch } from 'vue'

const STORAGE_KEY = 'markdown-editor:preferences'

export type EditorMode = 'default' | 'vim' | 'emacs'

export interface GitHubImageConfig {
  enabled: boolean
  token: string
  owner: string
  repo: string
  branch: string
  path: string
}

export interface Preferences {
  fontSize: number
  lineHeight: number
  editorWidth: number // percentage 20-80
  customCss: string
  editorMode: EditorMode
  wordGoal: number
  wordWrap: boolean
  spellcheck: boolean
  scrollSync: boolean
  typewriterMode: boolean
  autoSaveEnabled: boolean
  autoSaveInterval: number // seconds
  imageConfig: GitHubImageConfig
}

const DEFAULTS: Preferences = {
  fontSize: 14,
  lineHeight: 1.7,
  editorWidth: 50,
  customCss: '',
  editorMode: 'default',
  wordGoal: 0,
  wordWrap: true,
  spellcheck: true,
  scrollSync: true,
  typewriterMode: false,
  autoSaveEnabled: true,
  autoSaveInterval: 30,
  imageConfig: {
    enabled: false,
    token: '',
    owner: '',
    repo: '',
    branch: 'master',
    path: 'images'
  }
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
