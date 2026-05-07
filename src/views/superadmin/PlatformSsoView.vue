<template>
  <div class="app-sso-config">
    <div class="app-page-intro">
      <!-- <h1 class="app-page-intro__title">{{ $t('sso.platform.title') }}</h1> -->
      <p class="app-page-intro__description">{{ $t('sso.platform.description') }}</p>
    </div>

    <div v-if="loadingConfig" class="app-sso-config__loading">
      <ProgressSpinner style="width:40px;height:40px" strokeWidth="4" />
    </div>

    <div v-else class="sso-content">
      <div class="app-sso-config__callback-banner">
        <i class="pi pi-info-circle app-sso-config__callback-banner-icon" />
        <div class="app-sso-config__callback-banner-text">
          <strong>{{ $t('sso.settings.callbackUrlLabel') }}</strong>
          <p>{{ $t('sso.settings.callbackUrlDescription') }}</p>
          <div class="app-sso-config__callback-url-box">
            <code class="app-sso-config__callback-url">{{ config.callbackUrl }}</code>
            <Button
              icon="pi pi-copy"
              text
              size="small"
              class="app-sso-config__copy-btn"
              @click="copyCallbackUrl"
            />
          </div>
        </div>
      </div>

      <div class="app-sso-config__form-card">
        <div class="app-sso-config__form-row--toggle">
          <label class="app-sso-config__toggle-label">{{ $t('sso.settings.enableSso') }}</label>
          <div class="app-sso-config__toggle-right">
            <InputSwitch v-model="form.isEnabled" />
            <span class="app-sso-config__toggle-status">{{ form.isEnabled ? $t('common.enabled') : $t('common.disabled') }}</span>
          </div>
        </div>

        <Divider />
        <h3 class="app-sso-config__section-title">{{ $t('sso.settings.providerSection') }}</h3>

        <div class="app-sso-config__form-grid">
          <div class="app-sso-config__form-field app-sso-config__form-field--full">
            <label class="app-form-label">{{ $t('sso.settings.authority') }} <span class="app-form-required">*</span></label>
            <InputText
              v-model="form.authority"
              :placeholder="$t('sso.settings.authorityPlaceholder')"
              class="app-sso-config__field-input"
            />
            <small class="app-form-hint">{{ $t('sso.settings.authorityHint') }}</small>
          </div>
          <div class="app-sso-config__form-field">
            <label class="app-form-label">{{ $t('sso.settings.clientId') }} <span class="app-form-required">*</span></label>
            <InputText v-model="form.clientId" class="app-sso-config__field-input" />
          </div>
          <div class="app-sso-config__form-field">
            <label class="app-form-label">
              {{ $t('sso.settings.clientSecret') }}
              <span v-if="config.hasClientSecret" class="app-form-optional">{{ $t('sso.settings.clientSecretOptional') }}</span>
              <span v-else class="app-form-required">*</span>
            </label>
            <Password
              v-model="form.clientSecret"
              :placeholder="config.hasClientSecret ? $t('sso.settings.clientSecretMasked') : $t('sso.settings.clientSecretPlaceholder')"
              :feedback="false"
              toggle-mask
              class="app-sso-config__field-password"
            />
          </div>
          <div class="app-sso-config__form-field app-sso-config__form-field--full">
            <label class="app-form-label">{{ $t('sso.settings.scopes') }}</label>
            <InputText v-model="form.scopes" :placeholder="t('views.platformSso.openid_profile_email')" class="app-sso-config__field-input" />
          </div>
        </div>

        <div class="app-sso-config__test-row">
          <Button
            :label="$t('sso.settings.testConnection')"
            icon="pi pi-bolt"
            outlined
            :loading="testingConnection"
            :disabled="!form.authority"
            @click="testConnection"
          />
          <div
            v-if="testResult"
            class="app-sso-config__test-result"
            :class="testResult.success ? 'app-sso-config__test-result--ok' : 'app-sso-config__test-result--error'"
          >
            <i :class="testResult.success ? 'pi pi-check' : 'pi pi-times'" />
            {{ testResult.message }}
          </div>
        </div>

        <Divider />
        <h3 class="app-sso-config__section-title">{{ $t('sso.settings.uiSection') }}</h3>

        <div class="app-sso-config__form-grid">
          <div class="app-sso-config__form-field app-sso-config__form-field--full">
            <label class="app-form-label">{{ $t('sso.settings.buttonLabel') }}</label>
            <InputText
              v-model="form.buttonLabel"
              :placeholder="$t('sso.settings.buttonLabelPlaceholder')"
              class="app-sso-config__field-input"
            />
          </div>
        </div>

        <Divider />
        <h3 class="app-sso-config__section-title">{{ $t('sso.settings.claimMappingSection') }}</h3>

        <div class="app-sso-config__form-grid">
          <div class="app-sso-config__form-field">
            <label class="app-form-label">{{ $t('sso.settings.claimEmail') }}</label>
            <InputText v-model="form.claimEmail" :placeholder="t('views.platformSso.email')" class="app-sso-config__field-input" />
          </div>
          <div class="app-sso-config__form-field">
            <label class="app-form-label">{{ $t('sso.settings.claimName') }}</label>
            <InputText v-model="form.claimName" :placeholder="t('views.platformSso.name')" class="app-sso-config__field-input" />
          </div>
        </div>
      </div>

      <div class="app-dialog-actions">
        <Button :label="$t('common.save')" icon="pi pi-check" :loading="saving" @click="save" />
        <Button
          v-if="config.hasClientSecret"
          :label="$t('sso.settings.deleteConfig')"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click="confirmDelete"
        />
      </div>
    </div>

    <ConfirmDialog />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { ssoApi, type PlatformSsoConfig, type SsoConnectionTestResult } from '@/api/sso.api'

const { t }   = useI18n()
const confirm = useConfirm()
const toast   = useToast()

const loadingConfig     = ref(true)
const saving            = ref(false)
const testingConnection = ref(false)
const testResult        = ref<SsoConnectionTestResult | null>(null)

const config = ref<PlatformSsoConfig>({
  isEnabled: false, authority: '', clientId: '', hasClientSecret: false,
  scopes: 'openid profile email', claimEmail: 'email', claimName: 'name',
  buttonLabel: null, callbackUrl: '', createdAt: '', updatedAt: '',
})

const form = reactive({
  isEnabled: false, authority: '', clientId: '', clientSecret: '',
  scopes: 'openid profile email', claimEmail: 'email', claimName: 'name',
  buttonLabel: '',
})

onMounted(async () => {
  try {
    const data = await ssoApi.getPlatformConfig()
    config.value = data
    form.isEnabled   = data.isEnabled
    form.authority   = data.authority
    form.clientId    = data.clientId
    form.scopes      = data.scopes
    form.claimEmail  = data.claimEmail
    form.claimName   = data.claimName
    form.buttonLabel = data.buttonLabel ?? ''
  } catch {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('sso.settings.loadError'), life: 4000 })
  } finally {
    loadingConfig.value = false
  }
})

async function copyCallbackUrl() {
  await navigator.clipboard.writeText(config.value.callbackUrl).catch(() => {})
  toast.add({ severity: 'success', summary: t('common.copied'), life: 2000 })
}

async function testConnection() {
  testResult.value = null
  testingConnection.value = true
  try {
    testResult.value = await ssoApi.testPlatformConnection(form.authority, form.clientId, form.clientSecret || '(existing)')
  } finally {
    testingConnection.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await ssoApi.savePlatformConfig({
      isEnabled: form.isEnabled, authority: form.authority, clientId: form.clientId,
      clientSecret: form.clientSecret || null, scopes: form.scopes,
      claimEmail: form.claimEmail, claimName: form.claimName,
      buttonLabel: form.buttonLabel || null,
    })
    config.value = await ssoApi.getPlatformConfig()
    toast.add({ severity: 'success', summary: t('common.saved'), detail: t('sso.settings.saveSuccess'), life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('sso.settings.saveError'), life: 4000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete() {
  confirm.require({
    message: t('sso.settings.deleteConfirmMessage'),
    header: t('sso.settings.deleteConfirmTitle'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await ssoApi.deletePlatformConfig()
        config.value.hasClientSecret = false
        form.isEnabled = false
        toast.add({ severity: 'success', summary: t('common.deleted'), detail: t('sso.settings.deleteSuccess'), life: 3000 })
      } catch {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('sso.settings.deleteError'), life: 4000 })
      }
    },
  })
}
</script>
