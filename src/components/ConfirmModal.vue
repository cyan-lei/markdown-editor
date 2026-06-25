<template>
  <Teleport to="body">
    <div
      class="modal-overlay"
      v-if="visible"
      @click="handleCancel"
      @keydown.esc="handleCancel"
    >
      <div
        class="modal-content"
        @click.stop
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        ref="modalRef"
        @keydown.esc="handleCancel"
      >
        <div class="modal-header">
          <span class="modal-title">{{ title }}</span>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="handleCancel" ref="cancelRef">取消</button>
          <button
            v-if="tertiaryLabel"
            class="btn-secondary"
            :class="{ 'btn-danger': tertiaryVariant === 'danger' }"
            @click="handleTertiary"
            ref="tertiaryRef"
          >{{ tertiaryLabel }}</button>
          <button class="btn-primary" @click="handleConfirm" ref="confirmRef">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
  title?: string
  message?: string
  confirmLabel?: string
  tertiaryLabel?: string
  tertiaryVariant?: 'danger'
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'tertiary'): void
}>()

const modalRef = ref<HTMLElement | null>(null)
const cancelRef = ref<HTMLButtonElement | null>(null)
const confirmRef = ref<HTMLButtonElement | null>(null)
const tertiaryRef = ref<HTMLButtonElement | null>(null)
let previousFocus: HTMLElement | null = null

const handleConfirm = () => emit('confirm')
const handleCancel = () => emit('cancel')
const handleTertiary = () => emit('tertiary')

const trapFocus = (e: KeyboardEvent) => {
  if (e.key !== 'Tab') return
  const focusable = [cancelRef.value, tertiaryRef.value, confirmRef.value].filter(Boolean) as HTMLElement[]
  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    previousFocus = document.activeElement as HTMLElement
    nextTick(() => {
      confirmRef.value?.focus()
      modalRef.value?.addEventListener('keydown', trapFocus)
    })
  } else {
    modalRef.value?.removeEventListener('keydown', trapFocus)
    previousFocus?.focus()
  }
})

onUnmounted(() => {
  modalRef.value?.removeEventListener('keydown', trapFocus)
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  min-width: 360px;
  max-width: 480px;
  overflow: hidden;
  outline: none;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  color: var(--text-secondary);
  line-height: 1.6;
}

.modal-footer {
  padding: 12px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border);
}

.btn-danger {
  color: #ef4444;
  border-color: #ef4444;
}

.btn-danger:hover {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
}
</style>
