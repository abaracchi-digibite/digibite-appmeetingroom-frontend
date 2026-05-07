<template>
  <AuthLayout>
    <div class="sso-callback-container">

      <!-- Loading -->
      <div v-if="state === 'loading'" class="sso-state">
        <div class="sso-spinner">
          <ProgressSpinner style="width: 48px; height: 48px" strokeWidth="4" />
        </div>
        <p class="sso-message">{{ $t('sso.callback.processing') }}</p>
      </div>

      <!-- Successo (brevissimo - poi redirect automatico) -->
      <div v-else-if="state === 'success'" class="sso-state">
        <div class="sso-icon sso-icon--success">
          <i class="pi pi-check-circle" />
        </div>
        <p class="sso-message">{{ $t('sso.callback.success') }}</p>
        <p class="sso-submessage">{{ $t('sso.callback.redirecting') }}</p>
      </div>

      <!-- Errore -->
      <div v-else-if="state === 'error'" class="sso-state">
        <div class="sso-icon sso-icon--error">
          <i class="pi pi-times-circle" />
        </div>
        <h2 class="sso-title-error">{{ $t('sso.callback.errorTitle') }}</h2>
        <p class="sso-error-message">{{ errorMessage }}</p>
        <Button
          :label="$t('sso.callback.backToLogin')"
          class="sso-back-btn"
          @click="goToLogin"
        />
      </div>

    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const route  = useRoute()
const { t }  = useI18n()
const authStore = useAuthStore()

type CallbackState = 'loading' | 'success' | 'error'

const state        = ref<CallbackState>('loading')
const errorMessage = ref<string>('')

onMounted(async () => {
  const query = route.query

  // Errore restituito dall'IdP o dal backend
  if (query.error) {
    state.value        = 'error'
    errorMessage.value = decodeError(
      String(query.error),
      query.errorDescription ? String(query.errorDescription) : undefined,
    )
    return
  }

  // Parametri obbligatori
  const token        = query.token        ? String(query.token)        : null
  const refreshToken = query.refreshToken ? String(query.refreshToken) : null
  const tenantId     = query.tenantId     ? String(query.tenantId)     : null
  const isSuperAdmin = query.superAdmin === 'true'
  const returnUrl    = query.returnUrl    ? String(query.returnUrl)    : null

  if (!token) {
    state.value        = 'error'
    errorMessage.value = t('sso.callback.missingToken')
    return
  }

  try {
    // Salva il token nello store (stesso meccanismo del login normale)
    await authStore.setTokenFromSso({
      accessToken:  token,
      refreshToken: refreshToken ?? '',
      tenantId:     tenantId ?? '',
      isSuperAdmin,
    })

    state.value = 'success'

    // Redirect al dashboard dopo 800ms (abbastanza per mostrare il feedback visivo)
    setTimeout(() => {
      const destination = returnUrl && isValidReturnUrl(returnUrl)
        ? returnUrl
        : isSuperAdmin
          ? '/superadmin'
          : '/dashboard'
      router.push(destination)
    }, 800)

  } catch (err) {
    state.value        = 'error'
    errorMessage.value = t('sso.callback.storeError')
  }
})

/** Torna alla login page del dominio corrente. */
function goToLogin(): void {
  router.push('/login')
}

/**
 * Mappa i codici di errore OIDC in messaggi leggibili.
 * Riferimento: RFC 6749 --4.1.2.1 e RFC 6750 --3.1
 */
function decodeError(error: string, description?: string): string {
  const knownErrors: Record<string, string> = {
    access_denied:            t('sso.errors.accessDenied'),
    invalid_request:          t('sso.errors.invalidRequest'),
    unauthorized_client:      t('sso.errors.unauthorizedClient'),
    unsupported_response_type: t('sso.errors.unsupportedResponseType'),
    server_error:             t('sso.errors.serverError'),
    temporarily_unavailable:  t('sso.errors.temporarilyUnavailable'),
    sso_error:                description ?? t('sso.errors.ssoError'),
  }
  return knownErrors[error] ?? (description ?? t('sso.errors.unknownError'))
}

/**
 * Valida il returnUrl per prevenire open redirect.
 * Accetta solo path relativi (iniziano con /).
 */
function isValidReturnUrl(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//')
}
</script>

<style scoped src="./SsoCallbackView.css"></style>

