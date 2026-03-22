<script setup>
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  /** Tighter padding for dense stacks */
  dense: { type: Boolean, default: false },
})
</script>

<template>
  <section class="card" :class="{ 'card--dense': dense }">
    <header v-if="title || description || $slots.header" class="card__head">
      <slot name="header">
        <h2 v-if="title" class="card__title">{{ title }}</h2>
        <p v-if="description" class="card__desc">{{ description }}</p>
      </slot>
    </header>
    <div class="card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.card {
  background: var(--bc-card);
  border: 1px solid var(--bc-border);
  border-radius: var(--bc-radius-lg);
  box-shadow: var(--bc-shadow-sm);
  overflow: hidden;
}

.card--dense .card__body {
  padding: 12px 14px;
}

.card__head {
  padding: 14px 16px 0;
}

.card__title {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--bc-muted);
}

.card__desc {
  margin: 6px 0 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--bc-muted);
}

.card__body {
  padding: 12px 16px 16px;
}
</style>
