/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// File System Access API 类型声明
interface Window {
  showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>
  showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>
  showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>
}

interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[]
  excludeAcceptAllOption?: boolean
  multiple?: boolean
}

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: FilePickerAcceptType[]
  excludeAcceptAllOption?: boolean
}

interface DirectoryPickerOptions {
  id?: string
  mode?: 'read' | 'readwrite'
}

interface FilePickerAcceptType {
  description?: string
  accept: Record<string, string[]>
}
