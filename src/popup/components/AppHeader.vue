<script setup>
import ThemeToggle from './ThemeToggle.vue'

defineProps({
  theme: { type: String, required: true },
})

defineEmits(['update:theme'])
</script>

<template>
  <header class="top">
    <div class="top__row">
      <div class="top__brand">
        <div class="top__mark" aria-hidden="true">
          <svg class="top__svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4 6h2v12H4V6zm3 0h1v12H7V6zm2 0h3v12H9V6zm4 0h1v12h-1V6zm2 0h2v12h-2V6zm3 0h2v12h-2V6z"
              fill="currentColor"
              opacity="0.9"
            />
          </svg>
        </div>
        <div class="top__text">
          <h1 class="top__title">Barcode Generator</h1>
          <p class="top__tag">Symbology · Export · Batch</p>
        </div>
      </div>
      <ThemeToggle :model-value="theme" @update:model-value="$emit('update:theme', $event)" />
    </div>
  </header>
</template>

<style scoped>
.top {
  padding: 18px 18px 0;
}

.top__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.top__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.top__mark {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--bc-radius-md);
  background: linear-gradient(135deg, var(--bc-accent-soft), var(--bc-panel));
  border: 1px solid var(--bc-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bc-accent-text);
  box-shadow: var(--bc-shadow-sm);
}

.top__svg {
  width: 22px;
  height: 22px;
}

.top__text {
  min-width: 0;
}

.top__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: var(--bc-fg);
}

.top__tag {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: var(--bc-muted);
  font-weight: 500;
}
</style>
