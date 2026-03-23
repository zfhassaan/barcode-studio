<script setup>
import ThemeToggle from './ThemeToggle.vue'

defineProps({
  theme: { type: String, required: true },
  version: { type: String, default: '' },
})

defineEmits(['update:theme', 'open-info'])
</script>

<template>
  <header class="top">
    <div class="top__row">
      <div class="top__brand">
        <div class="top__mark" aria-hidden="true">
          <img class="top__logo" src="/icons/barcode.svg" width="40" height="40" alt="" />
        </div>
        <div class="top__text">
          <h1 class="top__title">
            Barcode Studio
            <span v-if="version" class="top__version">v{{ version }}</span>
          </h1>
          <p class="top__tag">Symbology · Export · Batch</p>
        </div>
      </div>
      <div class="top__actions">
        <button type="button" class="top__icon-btn" aria-label="About and tips" title="About and tips"
          @click="$emit('open-info')">
          <svg class="top__icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.75" />
            <path stroke="currentColor" stroke-width="1.75" stroke-linecap="round" d="M12 10.5V17M12 7.5h.01" />
          </svg>
        </button>
        <ThemeToggle class="top__theme" :model-value="theme" @update:model-value="$emit('update:theme', $event)" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.top {
  padding: 18px 18px 0;
}

.top__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: nowrap;
}

.top__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.top__mark {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--bc-radius-md);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--bc-shadow-sm);
}

.top__logo {
  width: 40px;
  height: 40px;
  display: block;
  object-fit: cover;
}

.top__text {
  min-width: 0;
}

.top__title {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: var(--bc-fg);
}

.top__version {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 6px;
  border-radius: var(--bc-radius-full);
  border: 1px solid var(--bc-border);
  background: var(--bc-panel);
  color: var(--bc-muted);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.top__tag {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: var(--bc-muted);
  font-weight: 500;
}

.top__actions {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.top__theme {
  min-width: 0;
}

.top__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0px solid var(--bc-border);
  border-radius: var(--bc-radius-md);
  background: transparent;
  color: var(--bc-muted);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.top__icon-btn:hover {
  color: var(--bc-accent-text);
  border-color: var(--bc-accent);
  background: var(--bc-accent-soft);
}

.top__icon-btn:focus-visible {
  outline: none;
  box-shadow: var(--bc-focus);
}

.top__icon {
  display: block;
}
</style>
