<template>
  <div class="app-sso-config">
    <!-- Header -->
    <div class="app-page-intro">
      <div>
        <!-- <h1 class="app-page-intro__title">{{ $t('sso.settings.title') }}</h1> -->
        <p class="app-page-intro__description">{{ $t('sso.settings.description') }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingConfig" class="app-sso-config__loading">
      <ProgressSpinner style="width:40px;height:40px" strokeWidth="4" />
    </div>

    <div v-else class="sso-content">

      <!-- Banner callback URL (da registrare sull'IdP) -->
      <div class="app-sso-config__callback-banner">
        <div class="app-sso-config__callback-banner-icon"><i class="pi pi-info-circle" /></div>
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

      <!-- Form configurazione -->
      <div class="app-sso-config__form-card">

        <!-- Switch abilita SSO -->
        <div class="app-sso-config__form-row--toggle">
          <label class="app-sso-config__toggle-label">{{ $t('sso.settings.enableSso') }}</label>
          <div class="app-sso-config__toggle-right">
            <InputSwitch v-model="form.isEnabled" />
            <span class="app-sso-config__toggle-status">{{ form.isEnabled ? $t('common.enabled') : $t('common.disabled') }}</span>
          </div>
        </div>

        <Divider />

        <!-- Provider OIDC -->
        <h3 class="app-sso-config__section-title">{{ $t('sso.settings.providerSection') }}</h3>

        <!-- Presets provider -->
        <div class="app-sso-config__provider-presets">
          <span class="app-sso-config__presets-label">{{ $t('sso.settings.quickPresets') }}</span>
          <div class="app-sso-config__presets-buttons">
            <Button
              v-for="preset in providerPresets"
              :key="preset.id"
              ::label="t('views.ssoSettings.presetname')"
              :icon="preset.icon"
              size="small"
              outlined
              class="app-sso-config__preset-btn"
              @click="applyPreset(preset)"
            />
          </div>
        </div>

        <div class="app-sso-config__form-grid">
          <div class="app-sso-config__form-field app-sso-config__form-field--full">
            <label class="app-form-label">
              {{ $t('sso.settings.authority') }}
              <span class="app-form-required">*</span>
            </label>
            <InputText
              v-model="form.authority"
              :placeholder="$t('sso.settings.authorityPlaceholder')"
              class="app-sso-config__field-input"
            />
            <small class="app-form-hint">{{ $t('sso.settings.authorityHint') }}</small>
          </div>

          <div class="app-sso-config__form-field">
            <label class="app-form-label">
              {{ $t('sso.settings.clientId') }}
              <span class="app-form-required">*</span>
            </label>
            <InputText
              v-model="form.clientId"
              :placeholder="$t('sso.settings.clientIdPlaceholder')"
              class="app-sso-config__field-input"
            />
          </div>

          <div class="app-sso-config__form-field">
            <label class="app-form-label">
              {{ $t('sso.settings.clientSecret') }}
              <span v-if="config.hasClientSecret" class="app-form-optional">
                {{ $t('sso.settings.clientSecretOptional') }}
              </span>
              <span v-else class="app-form-required">*</span>
            </label>
            <Password
              v-model="form.clientSecret"
              :placeholder="config.hasClientSecret
                ? $t('sso.settings.clientSecretMasked')
                : $t('sso.settings.clientSecretPlaceholder')"
              :feedback="false"
              toggle-mask
              class="app-sso-config__field-password"
            />
            <small v-if="config.hasClientSecret" class="app-form-hint">
              {{ $t('sso.settings.clientSecretKeepHint') }}
            </small>
          </div>

          <div class="app-sso-config__form-field app-sso-config__form-field--full">
            <label class="app-form-label">{{ $t('sso.settings.scopes') }}</label>
            <InputText
              v-model="form.scopes"
              :placeholder="t('views.ssoSettings.openid_profile_email')"
              class="app-sso-config__field-input"
            />
            <small class="app-form-hint">{{ $t('sso.settings.scopesHint') }}</small>
          </div>
        </div>

        <!-- Pulsante test connessione -->
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
            <span>{{ testResult.message }}</span>
          </div>
        </div>

        <Divider />

        <!-- UI e login page -->
        <h3 class="app-sso-config__section-title">{{ $t('sso.settings.uiSection') }}</h3>

        <div class="app-sso-config__form-grid">
          <div class="app-sso-config__form-field">
            <label class="app-form-label">{{ $t('sso.settings.buttonLabel') }}</label>
            <InputText
              v-model="form.buttonLabel"
              :placeholder="$t('sso.settings.buttonLabelPlaceholder')"
              class="app-sso-config__field-input"
            />
            <small class="app-form-hint">{{ $t('sso.settings.buttonLabelHint') }}</small>
          </div>

          <div class="app-sso-config__form-field app-sso-config__form-field--toggle">
            <label class="app-form-label">{{ $t('sso.settings.requireSsoOnly') }}</label>
            <InputSwitch v-model="form.requireSsoOnly" />
            <small class="app-form-hint">{{ $t('sso.settings.requireSsoOnlyHint') }}</small>
          </div>
        </div>

        <Divider />

        <!-- JIT Provisioning -->
        <h3 class="app-sso-config__section-title">{{ $t('sso.settings.jitSection') }}</h3>
        <p class="app-sso-config__section-description">{{ $t('sso.settings.jitDescription') }}</p>

        <div class="app-sso-config__form-grid">
          <div class="app-sso-config__form-field app-sso-config__form-field--toggle">
            <label class="app-form-label">{{ $t('sso.settings.jitProvisioning') }}</label>
            <InputSwitch v-model="form.jitProvisioning" />
          </div>

          <div v-if="form.jitProvisioning" class="app-sso-config__form-field">
            <label class="app-form-label">{{ $t('sso.settings.jitDefaultRole') }}</label>
            <Select
              v-model="form.jitDefaultRole"
              :options="availableRoles"
              option-:label="t('views.ssoSettings.label')"
              option-value="value"
              class="app-sso-config__field-input"
            />
          </div>
        </div>

        <Divider />

        <!-- Mapping claim -->
        <h3 class="app-sso-config__section-title">{{ $t('sso.settings.claimMappingSection') }}</h3>
        <p class="app-sso-config__section-description">{{ $t('sso.settings.claimMappingDescription') }}</p>

        <div class="app-sso-config__form-grid">
          <div class="app-sso-config__form-field">
            <label class="app-form-label">{{ $t('sso.settings.claimEmail') }}</label>
            <InputText v-model="form.claimEmail" :placeholder="t('views.ssoSettings.email')" class="app-sso-config__field-input" />
          </div>
          <div class="app-sso-config__form-field">
            <label class="app-form-label">{{ $t('sso.settings.claimName') }}</label>
            <InputText v-model="form.claimName" :placeholder="t('views.ssoSettings.name')" class="app-sso-config__field-input" />
          </div>
        </div>

      </div>

      <!-- Azioni -->
      <div class="app-dialog-actions">
        <Button
          :label="$t('common.save')"
          icon="pi pi-check"
          :loading="saving"
          @click="save"
        />
        <Button
          v-if="config.id !== '00000000-0000-0000-0000-000000000000'"
          :label="$t('sso.settings.deleteConfig')"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click="confirmDelete"
        />
      </div>

    </div>

    <!-- Dialog conferma eliminazione -->
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
import Select from 'primevue/select'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { ssoApi, type TenantSsoConfig, type SsoConnectionTestResult } from '@/api/sso.api'

const { t }   = useI18n()
const confirm = useConfirm()
const toast   = useToast()

// -- State --------------------------------------------------------------------

const loadingConfig     = ref(true)
const saving            = ref(false)
const testingConnection = ref(false)
const testResult        = ref<SsoConnectionTestResult | null>(null)

const config = ref<TenantSsoConfig>({
  id:              '',
  tenantId:        '',
  isEnabled:       false,
  authority:       '',
  clientId:        '',
  hasClientSecret: false,
  scopes:          'openid profile email',
  jitProvisioning: false,
  jitDefaultRole:  'Tenant.Member',
  claimEmail:      'email',
  claimName:       'name',
  requireSsoOnly:  false,
  buttonLabel:     null,
  callbackUrl:     '',
  createdAt:       '',
  updatedAt:       '',
})

const form = reactive({
  isEnabled:       false,
  authority:       '',
  clientId:        '',
  clientSecret:    '',
  scopes:          'openid profile email',
  jitProvisioning: false,
  jitDefaultRole:  'Tenant.Member',
  claimEmail:      'email',
  claimName:       'name',
  requireSsoOnly:  false,
  buttonLabel:     '',
})

// -- Presets provider ----------------------------------------------------------

const providerPresets = [
  {
    id:        'azure',
    name:      'Microsoft Azure AD',
    icon:      'pi pi-microsoft',
    authority: 'https://login.microsoftonline.com/{tenant-id}/v2.0',
    scopes:    'openid profile email',
    claimEmail: 'preferred_username',
    claimName:  'name',
  },
  {
    id:        'google',
    name:      'Google Workspace',
    icon:      'pi pi-google',
    authority: 'https://accounts.google.com',
    scopes:    'openid profile email',
    claimEmail: 'email',
    claimName:  'name',
  },
  {
    id:        'okta',
    name:      'Okta',
    icon:      'pi pi-lock',
    authority: 'https://{your-domain}.okta.com/oauth2/default',
    scopes:    'openid profile email',
    claimEmail: 'email',
    claimName:  'name',
  },
  {
    id:        'keycloak',
    name:      'Keycloak',
    icon:      'pi pi-key',
    authority: 'https://{host}/realms/{realm}',
    scopes:    'openid profile email',
    claimEmail: 'email',
    claimName:  'preferred_username',
  },
]

// -- Ruoli disponibili per JIT provisioning ------------------------------------

const availableRoles = [
  { label: 'Tenant.Member',        value: 'Tenant.Member' },
  { label: 'Tenant.Contributor',   value: 'Tenant.Contributor' },
  { label: 'Tenant.ResourceAdmin', value: 'Tenant.ResourceAdmin' },
  { label: 'Tenant.Admin',         value: 'Tenant.Admin' },
  { label: 'Tenant.Owner',         value: 'Tenant.Owner' },
]

// -- Lifecycle -----------------------------------------------------------------

onMounted(async () => {
  try {
    const data = await ssoApi.getTenantConfig()
    config.value = data
    syncFormFromConfig(data)
  } catch (e) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('sso.settings.loadError'), life: 4000 })
  } finally {
    loadingConfig.value = false
  }
})

// -- Helpers -------------------------------------------------------------------

function syncFormFromConfig(data: TenantSsoConfig): void {
  form.isEnabled       = data.isEnabled
  form.authority       = data.authority
  form.clientId        = data.clientId
  form.clientSecret    = ''  // Mai pre-valorizzato per sicurezza
  form.scopes          = data.scopes
  form.jitProvisioning = data.jitProvisioning
  form.jitDefaultRole  = data.jitDefaultRole
  form.claimEmail      = data.claimEmail
  form.claimName       = data.claimName
  form.requireSsoOnly  = data.requireSsoOnly
  form.buttonLabel     = data.buttonLabel ?? ''
}

function applyPreset(preset: typeof providerPresets[0]): void {
  form.authority  = preset.authority
  form.scopes     = preset.scopes
  form.claimEmail = preset.claimEmail
  form.claimName  = preset.claimName
  toast.add({
    severity: 'info',
    summary: t('sso.settings.presetApplied', { name: preset.name }),
    detail: t('sso.settings.presetAppliedDetail'),
    life: 3000,
  })
}

async function copyCallbackUrl(): Promise<void> {
  try {
    await navigator.clipboard.writeText(config.value.callbackUrl)
    toast.add({ severity: 'success', summary: t('common.copied'), life: 2000 })
  } catch {
    // fallback silenzioso
  }
}

// -- Azioni --------------------------------------------------------------------

async function testConnection(): Promise<void> {
  testResult.value    = null
  testingConnection.value = true
  try {
    const result = await ssoApi.testTenantConnection(
      form.authority,
      form.clientId,
      form.clientSecret || '(existing)',
    )
    testResult.value = result
  } finally {
    testingConnection.value = false
  }
}

async function save(): Promise<void> {
  saving.value = true
  try {
    await ssoApi.saveTenantConfig({
      isEnabled:       form.isEnabled,
      authority:       form.authority,
      clientId:        form.clientId,
      clientSecret:    form.clientSecret || null,
      scopes:          form.scopes,
      jitProvisioning: form.jitProvisioning,
      jitDefaultRole:  form.jitDefaultRole,
      claimEmail:      form.claimEmail,
      claimName:       form.claimName,
      requireSsoOnly:  form.requireSsoOnly,
      buttonLabel:     form.buttonLabel || null,
    })
    // Ricarica config aggiornata
    config.value = await ssoApi.getTenantConfig()
    toast.add({ severity: 'success', summary: t('common.saved'), detail: t('sso.settings.saveSuccess'), life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('sso.settings.saveError'), life: 4000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(): void {
  confirm.require({
    message: t('sso.settings.deleteConfirmMessage'),
    header:  t('sso.settings.deleteConfirmTitle'),
    icon:    'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await ssoApi.deleteTenantConfig()
        config.value.hasClientSecret = false
        config.value.isEnabled       = false
        form.isEnabled    = false
        form.authority    = ''
        form.clientId     = ''
        form.clientSecret = ''
        toast.add({ severity: 'success', summary: t('common.deleted'), detail: t('sso.settings.deleteSuccess'), life: 3000 })
      } catch {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('sso.settings.deleteError'), life: 4000 })
      }
    },
  })
}
</script>

<style scoped src="./SsoSettingsView.css"></style>
