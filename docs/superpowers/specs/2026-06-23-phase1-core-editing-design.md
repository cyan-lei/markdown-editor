# Phase 1: Core Editing Experience — Design Spec

## Overview

Enhance the markdown editor with a formatting toolbar, custom undo/redo history, search & replace, an enhanced status bar, and a centralized keyboard shortcut system. This is phase 1 of a 4-phase plan to add 16 feature groups to the markdown editor.

## New Files

```
src/
  components/
    EditorToolbar.vue    # Formatting toolbar (bold, italic, headings, lists, etc.)
    SearchBar.vue        # Search & replace bar (Ctrl+F / Ctrl+H)
    StatusBar.vue        # Bottom status bar (line/col, word/char count, selection)
  composables/
    useHistory.ts        # Per-tab undo/redo history stack with debounce
    useSearch.ts         # Search & replace logic (find next/prev, replace, replace all)
    useShortcuts.ts      # Centralized keyboard shortcut registry
```

## Modified Files

* `EditorPanel.vue` — Integrate toolbar, search bar, status bar; expose methods for formatting, undo/redo, search; track cursor info

* `EditorView.vue` — Wire global shortcuts (new/open/close/switch tab) via useShortcuts; replace manual keydown listener

***

## 1. EditorToolbar.vue

### Placement

Inside EditorPanel, between the panel header and the textarea. Full width, left-aligned button groups with subtle dividers between groups.

### Button Groups

| Group         | Buttons                                        | Markdown Syntax                                |
| ------------- | ---------------------------------------------- | ---------------------------------------------- |
| Inline format | Bold, Italic, Strikethrough, Inline code       | `**text**`, `*text*`, `~~text~~`, `` `text` `` |
| Headings      | H1, H2, H3                                     | `# ` , `## ` , `### `                          |
| Blocks        | Quote, Unordered list, Ordered list, Task list | `> ` , `- ` , `1. ` , `- [ ] `                 |
| Insert        | Link, Image, Table, Horizontal rule            | `[text](url)`, `![alt](url)`, `\|...\|`, `---` |

### Behavior

* Emits `format(action: string)` event

* EditorPanel handles the actual text manipulation:

  * If text is selected: wrap with syntax (inline format) or prefix each line (block)

  * If no selection: insert template placeholder (e.g., `**粗体文本**`) and select the placeholder text

* Uses AppIcon for button icons where applicable

***

## 2. useHistory.ts — Undo/Redo

### Data Structure

```typescript
interface HistoryEntry {
  content: string
  selectionStart: number
  selectionEnd: number
}

interface HistoryStack {
  past: HistoryEntry[]   // previous states, most recent last
  future: HistoryEntry[] // redo states, most recent last
}

// Per-tab storage
const histories = new Map<number, HistoryStack>()
```

### Behavior

* **Debounced snapshots**: When content changes, wait 500ms of inactivity before pushing a snapshot. This groups rapid typing into a single undo step.

* **Max history**: 100 entries per tab. When exceeded, oldest entry is discarded.

* **undo()**: Pop from `past`, push current to `future`, return the previous entry (content + cursor position).

* **redo()**: Pop from `future`, push current to `past`, return the next entry.

* **Tab switching**: History persists in the Map keyed by tab ID. Switching tabs does not lose history.

* **Tab closing**: Remove the tab's entry from the Map to prevent memory leaks.

* Returns `{ undo, redo, canUndo, canRedo, push }` — reactive refs for `canUndo`/`canRedo` to enable/disable toolbar buttons.

### Integration

* EditorPanel calls `push(content, selectionStart, selectionEnd)` on debounced content change

* EditorPanel calls `undo()` / `redo()` on shortcut or toolbar button

* On undo/redo, EditorPanel writes returned content to textarea and restores cursor position

***

## 3. SearchBar.vue + useSearch.ts — Search & Replace

### SearchBar.vue UI

* Floating bar at top of editor area (below toolbar), only visible when activated

* Row 1: Search input | match count "3/12" | case-sensitive toggle | prev/next buttons | close (Esc)

* Row 2 (Ctrl+H only): Replace input | replace | replace all buttons

* Styled to match the dark/light theme

### useSearch.ts Logic

```typescript
function useSearch(textareaRef: Ref<HTMLTextAreaElement | null>, content: Ref<string>)
```

* `search(query: string, caseSensitive: boolean)` — finds all match offsets, returns count, selects first match

* `findNext()` / `findPrev()` — cycles through matches, selects and scrolls to match

* `replace(replacement: string)` — replaces current selected match, advances to next

* `replaceAll(replacement: string)` — replaces all matches, returns count

* Match selection uses `textarea.setSelectionRange(start, end)` and `textarea.scrollTo()` for visibility

* No persistent highlight overlay (keeps implementation simple; current match is always selected)

### Activation

* `openSearch()` — shows search-only mode

* `openReplace()` — shows search + replace mode

* Esc or close button hides the bar

***

## 4. StatusBar.vue — Bottom Status Bar

### Placement

Fixed bar at the bottom of EditorPanel, below the textarea.

### Display

`Ln 12, Col 5  |  词数: 42  |  字符: 218  |  已选: 3 字符`

* **Ln/Col**: Computed from `selectionStart` by counting newlines + remainder

* **词数**: Split by whitespace, count non-empty tokens

* **字符**: `content.length`

* **已选**: `selectionEnd - selectionStart` (hidden when 0)

### Updates

EditorPanel tracks `selectionStart`, `selectionEnd`, and `content` via reactive refs, updated on textarea `keyup`, `click`, `select`, and `input` events. StatusBar receives these as props.

***

## 5. useShortcuts.ts — Keyboard Shortcut Manager

### Design

A composable that registers keyboard shortcuts on a target element (or window) and provides clean registration/unregistration.

```typescript
interface ShortcutHandler {
  (e: KeyboardEvent): void
}

function useShortcuts(target: 'window' | HTMLElement) {
  function register(combo: string, handler: ShortcutHandler): void
  function unregister(combo: string): void
  return { register, unregister }
}
```

### Combo Format

`"ctrl+b"`, `"ctrl+shift+z"`, `"ctrl+tab"` — normalized lowercase, modifiers separated by `+`.

### Registered Shortcuts

**Global (EditorView, on window):**

| Combo    | Action             |
| -------- | ------------------ |
| ctrl+n   | New file           |
| ctrl+o   | Open file          |
| ctrl+w   | Close current tab  |
| ctrl+tab | Switch to next tab |
| ctrl+s   | Save (existing)    |

**Editor (EditorPanel, on textarea):**

| Combo        | Action             |
| ------------ | ------------------ |
| ctrl+b       | Bold               |
| ctrl+i       | Italic             |
| ctrl+k       | Insert link        |
| ctrl+f       | Open search        |
| ctrl+h       | Open replace       |
| ctrl+z       | Undo               |
| ctrl+y       | Redo               |
| ctrl+shift+z | Redo (alternative) |

### Replaces

The manual `handleKeydown` in EditorView\.vue is replaced by `useShortcuts('window')` with registered handlers. EditorPanel uses `useShortcuts` scoped to the textarea element.

***

## EditorPanel.vue Changes

EditorPanel becomes the integration hub for phase 1:

### Template Structure

```
editor-panel
  ├── panel-header (existing: title + char count)
  ├── editor-toolbar (NEW)
  ├── search-bar (NEW, conditional)
  ├── textarea (existing)
  └── status-bar (NEW)
```

### Exposed Methods (defineExpose)

* `insertFormat(action: string)` — apply a formatting action

* `undo()` / `redo()` — history operations

* `openSearch()` / `openReplace()` — activate search bar

* `setScrollRatio(ratio)` — existing, for scroll sync

### Internal State

* `cursorInfo` ref: `{ line, col, selectionStart, selectionEnd }`

* History composable instance

* Search composable instance

* Search bar visibility ref

### Props Change

* Add `tabId: number` — needed for useHistory to key history by tab

* Keep `modelValue`, `charCount`

***

## EditorView\.vue Changes

* Replace manual `handleKeydown` with `useShortcuts('window')`

* Register global shortcuts: ctrl+n, ctrl+o, ctrl+w, ctrl+tab, ctrl+s

* Pass `tabId` prop to EditorPanel

* Clean up history on tab close (call useHistory cleanup)

***

## Error Handling

* All text manipulation operations guard against null textarea ref

* Search handles empty query gracefully (shows 0/0)

* History operations on empty stack are no-ops

* Shortcut handlers call preventDefault only when the action is applicable (e.g., ctrl+w only when a tab exists)

***

## Not In Scope (Deferred to Later Phases)

* Persistent match highlighting overlay (phase 1 uses selection only)

* Regex search mode

* Custom history step grouping beyond debounce

* Toolbar customization/reordering

* Font size/theme preferences (phase 3)

* beforeunload / auto-save (phase 2)

