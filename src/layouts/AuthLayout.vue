<template>
  <div class="auth-layout">
    <!-- Sfondo: usa loginBackgroundUrl del tenant se configurato, altrimenti gradiente brand -->
    <div
      class="auth-background"
      :style="backgroundStyle"
    />

    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <!-- Logo tenant se configurato, altrimenti icona di default -->
            <img
              v-if="logoUrl"
              :src="logoUrl"
              :alt="tenantName || 'AppMeetingRoom'"
              class="tenant-logo-img"
            />
            <template v-else>
              <span class="logo-icon"></span>
            </template>
            <h1 class="logo-text" :style="logoTextStyle">
              {{ tenantName || $t('app.name') }}
            </h1>
          </div>
          <p class="auth-subtitle">{{ $t('auth.signInToContinue') }}</p>
        </div>

        <div class="auth-content">
          <slot />
        </div>
      </div>

      <div class="auth-footer">
        <p class="footer-text">{{ $t('auth.copyright', { year: new Date().getFullYear() }) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTenantBranding } from '@/composables/useTenantBranding'

const { t } = useI18n()
const { logoUrl, tenantName, applyPublicBranding } = useTenantBranding()

// Sfondo login page - pu- essere un'immagine custom o il gradiente di default
const loginBackgroundUrl = ref<string | null>(null)
const primaryColor       = ref<string | null>(null)
const secondaryColor     = ref<string | null>(null)

onMounted(async () => {
  const branding = await applyPublicBranding()
  if (branding) {
    loginBackgroundUrl.value = branding.loginBackgroundUrl
    primaryColor.value       = branding.primaryColor
    secondaryColor.value     = branding.secondaryColor
  }
})

// Stile del background: immagine se configurata, altrimenti gradiente tenant o default
const backgroundStyle = computed(() => {
  if (loginBackgroundUrl.value) {
    return {
      backgroundImage: `url('${loginBackgroundUrl.value}')`,
      backgroundSize:  'cover',
      backgroundPosition: 'center',
    }
  }
  if (primaryColor.value && secondaryColor.value) {
    return {
      background: `linear-gradient(135deg, ${primaryColor.value} 0%, ${secondaryColor.value} 100%)`,
    }
  }
  return {} // usa il CSS default (gradiente indigo/purple)
})

// Testo logo - usa il colore primario del tenant se disponibile
const logoTextStyle = computed(() => {
  if (primaryColor.value && secondaryColor.value) {
    return {
      background:           `linear-gradient(135deg, ${primaryColor.value} 0%, ${secondaryColor.value} 100%)`,
      '-webkit-background-clip': 'text',
      '-webkit-text-fill-color': 'transparent',
      'background-clip':         'text',
    }
  }
  return {}
})
</script>

<style scoped src="./AuthLayout.css"></style>

