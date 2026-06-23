<template>
  <div class="header">
    <div class="logo">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" stroke-width="2"/>
        <path d="M8 9l2 2-2 2M12 15h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Markdown</span>
    </div>
    <div class="header-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 16px;
}

.logo svg {
  color: var(--accent);
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>