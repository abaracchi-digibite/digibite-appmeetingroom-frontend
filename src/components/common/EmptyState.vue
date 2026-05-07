<template>
  <div class="empty-state">
    <div class="empty-state-content">
      <div class="empty-icon">
        <i :class="['pi', icon]"></i>
      </div>

      <h3 class="empty-title">{{ title }}</h3>

      <p v-if="description" class="empty-description">
        {{ description }}
      </p>

      <div v-if="$slots.actions" class="empty-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface Props {
  icon?: string
  title: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'pi-inbox',
})
</script>

<style scoped src="./EmptyState.css"></style>

