<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <div class="flex flex-col items-center justify-center min-h-screen px-4">
      <div class="text-center">
        <!-- <h1 class="text-5xl font-bold text-slate-900 mb-4">
          {{ t('views.home.appmeetingroom') }}
        </h1> -->
              <p class="text-xl text-slate-600 mb-8">
                      {{ t('home.subtitle') }}
                    </p>
        <div class="flex gap-4 justify-center">
          <Button
            :label="t('home.getStarted')"
            icon="pi pi-arrow-right"
            size="large"
          />
          <Button
            :label="t('home.learnMore')"
            icon="pi pi-info-circle"
            severity="secondary"
            size="large"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped src="./Home.css"></style>

