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
          <div class="header-title-row">
            <h1 class="page-title">{{ title }}</h1>
            <slot name="title-meta" />
          </div>
          <p v-if="subtitle || $slots.subtitle" class="page-subtitle">
            <slot name="subtitle">{{ subtitle }}</slot>
          </p>
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

<style src="./PageHeader.css"></style>

