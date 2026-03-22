<script setup>
defineProps({
  modelValue: { type: String, required: true },
})

defineEmits(['update:modelValue'])

const OPTIONS = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]
</script>

<template>
  <div class="seg" role="tablist" aria-label="Color theme">
    <button
      v-for="o in OPTIONS"
      :key="o.value"
      type="button"
      class="seg__btn"
      :class="{ 'seg__btn--on': modelValue === o.value }"
      role="tab"
      :aria-selected="modelValue === o.value"
      @click="$emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<style scoped>
.seg {
  display: inline-flex;
  padding: 3px;
  border-radius: var(--bc-radius-full);
  background: var(--bc-panel);
  border: 1px solid var(--bc-border);
  gap: 2px;
}

.seg__btn {
  border: none;
  background: transparent;
  color: var(--bc-muted);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: var(--bc-radius-full);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.seg__btn:hover {
  color: var(--bc-fg);
}

.seg__btn--on {
  background: var(--bc-card);
  color: var(--bc-fg);
  box-shadow: var(--bc-shadow-sm);
}

.seg__btn:focus-visible {
  outline: none;
  box-shadow: var(--bc-focus);
}
</style>
