import { ref, onMounted, onUnmounted } from 'vue'

export function useDividerDrag(min = 20, max = 80) {
  const dividerPosition = ref(50)
  const isDragging = ref(false)

  const startDrag = () => {
    isDragging.value = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    const main = document.querySelector('.main') as HTMLElement
    if (!main) return
    const rect = main.getBoundingClientRect()
    const percent = ((e.clientX - rect.left) / rect.width) * 100
    dividerPosition.value = Math.min(Math.max(min, percent), max)
  }

  const handleMouseUp = () => {
    if (!isDragging.value) return
    isDragging.value = false
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
