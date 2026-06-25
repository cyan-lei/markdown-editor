import { ref, onMounted, onUnmounted } from 'vue'

export function useDividerDrag(min = 20, max = 80, initial = 50) {
  const dividerPosition = ref(initial)
  const isDragging = ref(false)
  // 记录拖拽起始状态
  let dragStartX = 0
  let dragStartPercent = 0
  let dragMoved = false

  const startDrag = (e: MouseEvent) => {
    isDragging.value = true
    dragStartX = e.clientX
    dragStartPercent = dividerPosition.value
    dragMoved = false
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    // 移动距离超过 3px 才开始计算，避免点击瞬间跳变
    if (!dragMoved) {
      if (Math.abs(e.clientX - dragStartX) < 3) return
      dragMoved = true
    }

    const main = document.querySelector('.main') as HTMLElement
    if (!main) return
    const rect = main.getBoundingClientRect()
    const computed = getComputedStyle(main)
    const paddingLeft = parseFloat(computed.paddingLeft) || 0
    const paddingRight = parseFloat(computed.paddingRight) || 0

    // 计算可用宽度（减去 padding、目录面板、divider）
    let usableWidth = rect.width - paddingLeft - paddingRight
    const tocPanel = main.querySelector('.toc-panel') as HTMLElement | null
    if (tocPanel) {
      usableWidth -= tocPanel.offsetWidth
    }
    const divider = main.querySelector('.divider') as HTMLElement | null
    if (divider) {
      usableWidth -= divider.offsetWidth
    }

    // 用相对偏移量计算，避免绝对位置映射的跳变
    const deltaX = e.clientX - dragStartX
    const deltaPercent = (deltaX / usableWidth) * 100
    dividerPosition.value = Math.min(Math.max(min, dragStartPercent + deltaPercent), max)
  }

  const handleMouseUp = () => {
    if (!isDragging.value) return
    isDragging.value = false
    dragMoved = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  onMounted(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  })

  return {
    dividerPosition,
    isDragging,
    startDrag
  }
}
