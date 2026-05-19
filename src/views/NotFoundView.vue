<template>
  <MainLayout>
    <div class="not-found-container">
      <div class="not-found-content">
        <!-- <h1 class="not-found-title">404</h1> -->
        <h2 class="not-found-heading">{{ $t('errors.pageNotFound') }}</h2>
        <p class="not-found-description">
          {{ $t('errors.pageNotFoundDescription') }}
        </p>
        <RouterLink to="/dashboard" class="not-found-button">
          {{ $t('common.backToDashboard') }}
        </RouterLink>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
</script>

<style scoped src="./NotFoundView.css"></style>

