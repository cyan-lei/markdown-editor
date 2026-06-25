export interface Tab {
  id: number
  name: string
  content: string
  fileHandle: FileSystemFileHandle | null
  modified: boolean
  pinned?: boolean
}
