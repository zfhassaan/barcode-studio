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
          <img class="top__logo" src="/icons/barcode.svg" width="40" height="40" alt="" />
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
