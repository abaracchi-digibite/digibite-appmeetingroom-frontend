<template>
  <div class="app-root" :class="{ dark: isDarkMode }">
    <RouterView />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useTenantBranding } from '@/composables/useTenantBranding'
import { useInactivityTimer } from '@/composables/useInactivityTimer'

const uiStore   = useUiStore()
const authStore = useAuthStore()
const { applyAuthenticatedBranding } = useTenantBranding()

// Avvia il timer di inattività: dopo 30 min senza interazione → logout automatico.
useInactivityTimer()

const isDarkMode = computed(() => uiStore.isDarkMode)

onMounted(async () => {
  uiStore.initialize()

  // Carica il branding del tenant se l'utente - gi- autenticato
  // (es. ricarica della pagina con token ancora valido in localStorage)
  if (authStore.isAuthenticated) {
    await applyAuthenticatedBranding()
  }
})

// Applica il branding ogni volta che l'utente si autentica
// (es. login standard o callback SSO)
watch(
  () => authStore.isAuthenticated,
  async (isAuth) => {
    if (isAuth) {
      await applyAuthenticatedBranding()
    }
  }
)
</script>
