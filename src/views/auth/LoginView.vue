<template>
  <AuthLayout>
    <div class="login-container">
      <div class="login-header">
        <h2 class="login-title">
          {{ ssoInfo?.tenantName ? ssoInfo.tenantName : $t('auth.welcomeBack') }}
        </h2>
        <p class="login-subtitle">{{ $t('auth.signInToContinue') }}</p>
      </div>

      <!-- Loader SSO check iniziale -->
      <div v-if="checkingSso" class="sso-checking">
        <ProgressSpinner style="width:32px;height:32px" strokeWidth="4" />
      </div>

      <template v-else>

        <!-- ------ Pulsante SSO (se configurato per il tenant/platform) ------ -->
        <div v-if="ssoInfo?.hasSso" class="sso-section">
          <Button
            class="sso-button"
            :label="ssoInfo.buttonLabel || $t('sso.loginButton')"
            icon="pi pi-sign-in"
            :loading="ssoLoading"
            @click="handleSsoLogin"
          />

          <!-- Separatore "oppure" - visibile solo se il form password non - nascosto -->
          <div v-if="!ssoInfo.requireSsoOnly" class="sso-divider">
            <span class="sso-divider-line" />
            <span class="sso-divider-text">{{ $t('sso.orWithPassword') }}</span>
            <span class="sso-divider-line" />
          </div>
        </div>

        <!-- ------ Form email + password ------ -->
        <form
          v-if="!ssoInfo?.requireSsoOnly"
          @submit.prevent="handleLogin"
          class="login-form"
        >
          <div class="form-group">
            <label for="email" class="form-label">{{ $t('auth.email') }}</label>
            <InputText
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              :placeholder="$t('auth.email')"
              :class="{ 'form-input-error': emailError }"
              required
            />
            <span v-if="emailError" class="form-error">{{ emailError }}</span>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">{{ $t('auth.password') }}</label>
            <Password
              id="password"
              v-model="form.password"
              :placeholder="$t('auth.password')"
              :feedback="false"
              toggle-mask
              :input-class="'password-field'"
              :class="['password-wrapper', { 'form-input-error': passwordError }]"
              :pt="{
                root: { class: 'password-root' },
                input: { class: 'password-field' },
              }"
              required
            />
            <span v-if="passwordError" class="form-error">{{ passwordError }}</span>
          </div>

          <div class="form-group remember-group">
            <div class="checkbox-wrapper">
              <Checkbox v-model="form.rememberMe" input-id="rememberMe" />
              <label for="rememberMe" class="remember-label">{{ $t('auth.rememberMe') || 'Remember me' }}</label>
            </div>
          </div>

          <Message
            v-if="loginError"
            severity="error"
            :text="loginError"
            class="error-message"
          />

          <Button
            type="submit"
            class="login-button"
            :label="$t('auth.loginButton')"
            :loading="isLoading"
            :disabled="isLoading"
          />
        </form>

        <!-- Messaggio quando SSO-only - attivo e non c'- SSO configurato -->
        <div v-else-if="!ssoInfo?.hasSso && ssoInfo?.requireSsoOnly" class="sso-only-notice">
          <i class="pi pi-lock" />
          <p>{{ $t('sso.ssoOnlyNotice') }}</p>
        </div>

      </template>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import { ssoApi, type SsoPublicInfo } from '@/api/sso.api'
import type { LoginRequest } from '@/types/auth'

const router    = useRouter()
const route     = useRoute()
const { t }     = useI18n()
const authStore = useAuthStore()

// ------ SSO state ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const checkingSso = ref(true)
const ssoInfo     = ref<SsoPublicInfo | null>(null)
const ssoLoading  = ref(false)

// ------ Login form state ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

const form = ref<LoginForm>({
  email: '',
  password: '',
  rememberMe: false,
})

const isLoading  = ref(false)
const loginError = ref<string>('')

const emailError = computed(() => {
  if (!form.value.email) return ''
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(form.value.email) ? '' : t('auth.invalidEmail') || 'Invalid email'
})

const passwordError = computed(() => {
  if (!form.value.password) return ''
  return form.value.password.length < 6 ? t('auth.passwordMinLength') || 'Minimum 6 characters' : ''
})

const isFormValid = computed(() => {
  return form.value.email && form.value.password && !emailError.value && !passwordError.value
})

// ------ Lifecycle ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

onMounted(async () => {
  loadRememberedEmail()
  await checkSso()
})

/**
 * Controlla se il dominio corrente ha SSO configurato.
 * Chiama GET /api/auth/sso/public-info - il backend legge l'Host header
 * e restituisce la config SSO per il tenant o la piattaforma.
 */
async function checkSso(): Promise<void> {
  try {
    ssoInfo.value = await ssoApi.getPublicInfo()
  } catch {
    // Se l'endpoint non risponde, fallback al form normale
    ssoInfo.value = null
  } finally {
    checkingSso.value = false
  }

  if (ssoInfo.value?.hasSso && ssoInfo.value.requireSsoOnly) {
    await handleSsoLogin()
  }
}

// ------ SSO login ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * Avvia il flusso SSO.
 * Per i tenant il backend risolve la configurazione dall'Host del dominio corrente.
 * Per la piattaforma usa l'endpoint dedicato admin.
 * Il backend risponde con HTTP 302 verso l'IdP.
 */
async function handleSsoLogin(): Promise<void> {
  if (!ssoInfo.value?.hasSso) return
  ssoLoading.value = true

  // URL a cui tornare dopo il login (usato se l'utente era su una pagina specifica)
  const returnUrl = route.query.redirect ? String(route.query.redirect) : undefined

  if (ssoInfo.value.scope === 'Platform') {
    // Portale admin - usa la config SSO piattaforma
    ssoApi.initiatePlatformLogin(returnUrl)
  } else {
    ssoApi.initiateLogin(returnUrl)
  }
}

// ------ Login normale (email + password) ---------------------------------------------------------------------------------------------------------------------------

const handleLogin = async (): Promise<void> => {
  if (!isFormValid.value) {
    loginError.value = t('auth.fillRequiredFields') || 'Please fill in all required fields'
    return
  }

  isLoading.value  = true
  loginError.value = ''

  try {
    const loginRequest: LoginRequest = {
      email:    form.value.email,
      password: form.value.password,
    }

    await authStore.login(loginRequest)

    if (form.value.rememberMe) {
      localStorage.setItem('rememberEmail', form.value.email)
    } else {
      localStorage.removeItem('rememberEmail')
    }

    const redirect = route.query.redirect ? String(route.query.redirect) : '/dashboard'
    await router.push(redirect)
  } catch {
    loginError.value = authStore.error || t('auth.loginError') || 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const loadRememberedEmail = () => {
  const remembered = localStorage.getItem('rememberEmail')
  if (remembered) {
    form.value.email      = remembered
    form.value.rememberMe = true
  }
}
</script>

<style scoped src="./LoginView.css"></style>
