<template>
  <div class="page-header">
    <div class="header-content">
      <div class="header-left">
        <button
          v-if="showBackButton"
          class="back-button"
          @click="handleBack"
          :title="$t('common.back')"
        >
          <i class="pi pi-arrow-left"></i>
        </button>
        <div class="header-text">
          <h1 class="page-title">{{ title }}</h1>
          <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <div class="header-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

export interface Props {
  title: string
  subtitle?: string
  showBackButton?: boolean
}

withDefaults(defineProps<Props>(), {
  showBackButton: false,
})

const router = useRouter()
useI18n()

const handleBack = () => {
  router.back()
}
</script>

<style scoped src="./PageHeader.css"></style>

