<template>
  <AuthLayout>
    <div class="accept-invite-container">
      <div class="accept-invite-header">
        <h2 class="accept-invite-title">{{ t('auth.acceptInvite.title') }}</h2>
        <p class="accept-invite-subtitle">{{ t('auth.acceptInvite.subtitle') }}</p>
      </div>

      <!-- Token invalid / expired -->
      <div v-if="tokenError" class="token-error-state">
        <i class="pi pi-times-circle token-error-icon"></i>
        <p>{{ tokenError }}</p>
        <Button :label="t('auth.acceptInvite.backToLogin')" text @click="router.push('/login')" />
      </div>

      <!-- Success -->
      <div v-else-if="success" class="success-state">
        <i class="pi pi-check-circle success-icon"></i>
        <h3>{{ t('auth.acceptInvite.successTitle') }}</h3>
        <p>{{ t('auth.acceptInvite.successMessage') }}</p>
        <Button
          :label="t('auth.acceptInvite.goToDashboard')"
          class="accept-button"
          @click="router.push('/dashboard')"
        />
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="handleSubmit" class="accept-form">
        <div class="form-group">
          <label for="password" class="form-label">{{ t('auth.acceptInvite.newPassword') }}</label>
          <Password
            id="password"
            v-model="form.password"
            :placeholder="t('auth.acceptInvite.newPassword')"
            :feedback="true"
            toggle-mask
            :pt="{
              root: { class: 'password-root' },
              input: { class: 'password-field' },
            }"
            :class="['password-wrapper', { 'form-input-error': passwordError }]"
            required
          />
          <span v-if="passwordError" class="form-error">{{ passwordError }}</span>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">{{ t('auth.acceptInvite.confirmPassword') }}</label>
          <Password
            id="confirmPassword"
            v-model="form.confirmPassword"
            :placeholder="t('auth.acceptInvite.confirmPassword')"
            :feedback="false"
            toggle-mask
            :pt="{
              root: { class: 'password-root' },
              input: { class: 'password-field' },
            }"
            :class="['password-wrapper', { 'form-input-error': confirmPasswordError }]"
            required
          />
          <span v-if="confirmPasswordError" class="form-error">{{ confirmPasswordError }}</span>
        </div>

        <Message v-if="submitError" severity="error" :text="submitError" class="error-message" />

        <Button
          type="submit"
          class="accept-button"
          :label="t('auth.acceptInvite.setPassword')"
          :loading="isLoading"
          :disabled="isLoading || !isFormValid"
        />
      </form>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()

const inviteToken = ref<string>('')
const form = ref({ password: '', confirmPassword: '' })
const isLoading = ref(false)
const submitError = ref('')
const tokenError = ref('')
const success = ref(false)

const passwordError = computed(() => {
  if (!form.value.password) return ''
  return form.value.password.length < 8 ? t('auth.acceptInvite.passwordMinLength') : ''
})

const confirmPasswordError = computed(() => {
  if (!form.value.confirmPassword) return ''
  return form.value.password !== form.value.confirmPassword
    ? t('auth.acceptInvite.passwordMismatch')
    : ''
})

const isFormValid = computed(
  () =>
    form.value.password.length >= 8 &&
    form.value.password === form.value.confirmPassword
)

onMounted(() => {
  const token = route.params.token as string
  if (!token) {
    tokenError.value = t('auth.acceptInvite.invalidToken')
    return
  }
  inviteToken.value = token
})

const handleSubmit = async (): Promise<void> => {
  if (!isFormValid.value) return

  isLoading.value = true
  submitError.value = ''

  try {
    const response = await authApi.acceptInvite(inviteToken.value, form.value.password)

    // Store token and log user in automatically
    localStorage.setItem('auth_token', response.accessToken)
    localStorage.setItem('refresh_token', response.refreshToken)
    localStorage.setItem('tenant_id', response.tenantId)

    await authStore.loadFromStorage()
    success.value = true

    // Auto-redirect after 2 seconds
    setTimeout(() => router.push('/dashboard'), 2000)
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    submitError.value = msg ?? t('auth.acceptInvite.submitError')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped src="./AcceptInviteView.css"></style>

