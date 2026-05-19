<template>
  <div class="public-register-page" :style="pageStyle">
    <div class="register-container">
      <!-- Logo / Brand -->
      <div class="brand-header">
        <div class="brand-logo">
          <img v-if="branding.logoUrl" :src="branding.logoUrl" ::alt="t('views.publicRegister.brandingname')" class="brand-logo-img" />
          <i v-else class="pi pi-calendar" />
        </div>
        <!-- <h1 class="brand-name">{{ branding.name || 'AppMeetingRoom' }}</h1> -->
      </div>

      <!-- Loading -->
      <div v-if="state === 'loading'" class="state-card">
        <div class="loading-spinner">
          <i class="pi pi-spin pi-spinner" />
        </div>
        <p>{{ t('common.loading') }}</p>
      </div>

      <!-- Token non valido -->
      <div v-else-if="state === 'invalid'" class="state-card state-error">
        <div class="state-icon error-icon">
          <i class="pi pi-times-circle" />
        </div>
        <h2>{{ t('publicRegister.invalidTitle') }}</h2>
        <p>{{ t('publicRegister.invalidMessage') }}</p>
      </div>

      <!-- Form registrazione -->
      <div v-else-if="state === 'form'" class="form-card">
        <!-- Info prenotazione -->
        <div class="booking-info">
          <h2>{{ t('publicRegister.title') }}</h2>
          <p class="booking-subtitle">{{ t('publicRegister.subtitle') }}</p>

          <div class="booking-details">
            <div class="detail-item">
              <i class="pi pi-calendar-plus" :style="iconStyle" />
              <div>
                <span class="detail-label">{{ t('publicRegister.bookingTitle') }}</span>
                <span class="detail-value">{{ info!.title }}</span>
              </div>
            </div>
            <div v-if="info!.startTime" class="detail-item">
              <i class="pi pi-clock" :style="iconStyle" />
              <div>
                <span class="detail-label">{{ t('publicRegister.dateTime') }}</span>
                <span class="detail-value">{{ formatDateTime(info!.startTime, info!.endTime) }}</span>
              </div>
            </div>
            <div v-if="info!.visitorEmail" class="detail-item">
              <i class="pi pi-envelope" :style="iconStyle" />
              <div>
                <span class="detail-label">{{ t('publicRegister.email') }}</span>
                <span class="detail-value">{{ info!.visitorEmail }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Form -->
        <div class="form-section">
          <h3>{{ t('publicRegister.formTitle') }}</h3>

          <div class="form-group">
            <label for="visitorFirstName">{{ t('publicRegister.firstNameLabel') }} *</label>
            <input
              id="visitorFirstName"
              v-model="formData.visitorFirstName"
              type="text"
              class="form-input"
              :placeholder="t('publicRegister.firstNamePlaceholder')"
              :class="{ 'input-error': fieldErrors.visitorFirstName }"
            />
            <span v-if="fieldErrors.visitorFirstName" class="error-text">{{ fieldErrors.visitorFirstName }}</span>
          </div>

          <div class="form-group">
            <label for="visitorLastName">{{ t('publicRegister.lastNameLabel') }} *</label>
            <input
              id="visitorLastName"
              v-model="formData.visitorLastName"
              type="text"
              class="form-input"
              :placeholder="t('publicRegister.lastNamePlaceholder')"
              :class="{ 'input-error': fieldErrors.visitorLastName }"
            />
            <span v-if="fieldErrors.visitorLastName" class="error-text">{{ fieldErrors.visitorLastName }}</span>
          </div>

          <!-- Custom fields dinamici (Modalit- 3 - Nominativa completa) -->
          <div v-for="field in info!.customFields" :key="field.id" class="form-group">
            <label :for="`cf-${field.id}`">
              {{ field.label }}<span v-if="field.isRequired"> *</span>
            </label>

            <!-- Text -->
            <input
              v-if="field.fieldType === 'Text'"
              :id="`cf-${field.id}`"
              v-model="formData.customValues[field.id]"
              type="text"
              class="form-input"
              :placeholder="field.placeholder ?? ''"
              :class="{ 'input-error': fieldErrors[field.id] }"
            />

            <!-- Email -->
            <input
              v-else-if="field.fieldType === 'Email'"
              :id="`cf-${field.id}`"
              v-model="formData.customValues[field.id]"
              type="email"
              class="form-input"
              :placeholder="field.placeholder ?? ''"
              :class="{ 'input-error': fieldErrors[field.id] }"
            />

            <!-- Phone -->
            <input
              v-else-if="field.fieldType === 'Phone'"
              :id="`cf-${field.id}`"
              v-model="formData.customValues[field.id]"
              type="tel"
              class="form-input"
              :placeholder="field.placeholder ?? ''"
              :class="{ 'input-error': fieldErrors[field.id] }"
            />

            <!-- Number -->
            <input
              v-else-if="field.fieldType === 'Number'"
              :id="`cf-${field.id}`"
              v-model="formData.customValues[field.id]"
              type="number"
              class="form-input"
              :placeholder="field.placeholder ?? ''"
              :class="{ 'input-error': fieldErrors[field.id] }"
            />

            <!-- Date -->
            <input
              v-else-if="field.fieldType === 'Date'"
              :id="`cf-${field.id}`"
              v-model="formData.customValues[field.id]"
              type="date"
              class="form-input"
              :class="{ 'input-error': fieldErrors[field.id] }"
            />

            <!-- Dropdown -->
            <select
              v-else-if="field.fieldType === 'Dropdown'"
              :id="`cf-${field.id}`"
              v-model="formData.customValues[field.id]"
              class="form-input"
              :class="{ 'input-error': fieldErrors[field.id] }"
            >
              <option value="">{{ field.placeholder || t('common.select') }}</option>
              <option v-for="opt in parseOptions(field.options)" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>

            <!-- Boolean -->
            <div v-else-if="field.fieldType === 'Boolean'" class="bool-toggle">
              <input
                :id="`cf-${field.id}`"
                v-model="formData.customValues[field.id]"
                type="checkbox"
              />
              <label :for="`cf-${field.id}`" class="bool-label">
                {{ field.placeholder || t('publicRegister.confirmField') }}
              </label>
            </div>

            <span v-if="fieldErrors[field.id]" class="error-text">{{ fieldErrors[field.id] }}</span>
          </div>

          <button
            class="submit-btn"
            :style="btnStyle"
            :disabled="submitting"
            @click="handleSubmit"
          >
            <i v-if="submitting" class="pi pi-spin pi-spinner" />
            <i v-else class="pi pi-check" />
            {{ submitting ? t('common.loading') : t('publicRegister.submitButton') }}
          </button>
        </div>
      </div>

      <!-- Successo -->
      <div v-else-if="state === 'success'" class="state-card state-success">
        <div class="state-icon success-icon">
          <i class="pi pi-check-circle" />
        </div>
        <h2>{{ t('publicRegister.successTitle') }}</h2>
        <p>{{ t('publicRegister.successMessage') }}</p>

        <!-- QR Code per check-in all'ingresso -->
        <div v-if="result?.qrCode" class="qr-block">
          <div class="qr-label">{{ t('publicRegister.qrLabel') }}</div>
          <img
            :src="qrImageUrl"
            :alt="t('publicRegister.qrLabel')"
            class="qr-image"
          />
          <div class="qr-code-text">{{ result.qrCode }}</div>
          <p class="qr-hint">{{ t('publicRegister.qrHint') }}</p>
        </div>

        <div class="success-detail">
          <i class="pi pi-info-circle" />
          <span>{{ t('publicRegister.successDetail') }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="page-footer">
        <p>{{ t('publicRegister.poweredBy') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  publicApi,
  type PublicRegistrationInfo,
  type PublicRegistrationResult,
} from '@/api/public.api'

const { t, locale } = useI18n()
const route = useRoute()

type PageState = 'loading' | 'invalid' | 'form' | 'success'

const state = ref<PageState>('loading')
const info = ref<PublicRegistrationInfo | null>(null)
const submitting = ref(false)
const fieldErrors = ref<Record<string, string>>({})
const result = ref<PublicRegistrationResult | null>(null)

// Branding tenant - default app name, override se il tenant ha un brand configurato
const branding = ref({
  name: t('app.name'),
  logoUrl: null as string | null,
  primaryColor: '#6366f1',
  secondaryColor: '#764ba2',
})

const formData = ref<{
  visitorFirstName: string
  visitorLastName: string
  customValues: Record<string, unknown>
}>({
  visitorFirstName: '',
  visitorLastName: '',
  customValues: {},
})

const token = route.params.token as string

/** Stile del gradiente di sfondo - usa i colori brand del tenant */
const pageStyle = computed(() => ({
  background: `linear-gradient(135deg, ${branding.value.primaryColor} 0%, ${branding.value.secondaryColor} 100%)`,
}))

/** Colore icone inline */
const iconStyle = computed(() => ({ color: branding.value.primaryColor }))

/** Stile del pulsante principale */
const btnStyle = computed(() => ({
  background: branding.value.primaryColor,
}))

/** URL immagine QR code generato al volo da api.qrserver.com (servizio pubblico gratuito). */
const qrImageUrl = computed(() =>
  result.value?.qrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(result.value.qrCode)}`
    : '',
)

/**
 * Parsing delle opzioni di un custom field Dropdown.
 * Supporta JSON array (["A","B","C"]) o fallback a split su newline/virgola.
 */
function parseOptions(options: string | null): string[] {
  if (!options) return []
  const trimmed = options.trim()
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed)
      if (Array.isArray(arr)) return arr.map((x) => String(x))
    } catch {
      // fallback sotto
    }
  }
  return trimmed
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function formatDateTime(startTime: string | null, endTime: string | null): string {
  if (!startTime) return '-'
  try {
    const start = new Date(startTime)
    const dateStr = start.toLocaleDateString(locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const startTimeStr = start.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
    if (!endTime) return `${dateStr} ${t('common.atTime')} ${startTimeStr}`
    const endTimeStr = new Date(endTime).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
    return `${dateStr}, ${startTimeStr} — ${endTimeStr}`
  } catch {
    return startTime
  }
}

/** Valida i campi obbligatori. Ritorna true se tutto ok. */
function validate(): boolean {
  const errs: Record<string, string> = {}

  if (!formData.value.visitorFirstName.trim()) {
    errs.visitorFirstName = t('publicRegister.firstNameRequired')
  }
  if (!formData.value.visitorLastName.trim()) {
    errs.visitorLastName = t('publicRegister.lastNameRequired')
  }

  if (info.value?.customFields) {
    for (const f of info.value.customFields) {
      if (!f.isRequired) continue
      const v = formData.value.customValues[f.id]
      const isEmpty =
        v === undefined ||
        v === null ||
        (typeof v === 'string' && v.trim() === '') ||
        (f.fieldType === 'Boolean' && v === false)
      if (isEmpty) {
        errs[f.id] = t('publicRegister.fieldRequired')
      }
    }
  }

  fieldErrors.value = errs
  return Object.keys(errs).length === 0
}

async function handleSubmit(): Promise<void> {
  if (!validate()) return

  try {
    submitting.value = true
    // Serializza i custom field values in JSON per il backend
    const customFieldValues =
      info.value?.customFields && info.value.customFields.length > 0
        ? JSON.stringify(formData.value.customValues)
        : undefined

    const res = await publicApi.submitRegistration(token, {
      visitorFirstName: formData.value.visitorFirstName.trim(),
      visitorLastName: formData.value.visitorLastName.trim(),
      customFieldValues,
    })
    result.value = res
    state.value = 'success'
  } catch {
    // Se il token - scaduto nel frattempo
    state.value = 'invalid'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const data = await publicApi.getRegistrationInfo(token)
    info.value = data
    formData.value.visitorFirstName = data.visitorFirstName ?? ''
    formData.value.visitorLastName = data.visitorLastName ?? ''

    // Pre-popola i custom field dalla ultima versione salvata (se presente)
    if (data.customFieldValues) {
      try {
        const parsed = JSON.parse(data.customFieldValues)
        if (parsed && typeof parsed === 'object') {
          formData.value.customValues = { ...parsed }
        }
      } catch {
        // valori precedenti malformati: ignora e riparti puliti
      }
    }

    // Inizializza a false i boolean non ancora presenti (per il v-model del checkbox)
    for (const f of data.customFields) {
      if (f.fieldType === 'Boolean' && formData.value.customValues[f.id] === undefined) {
        formData.value.customValues[f.id] = false
      }
    }

    // Applica branding tenant se disponibile (--11.4 DRF)
    if (data.tenantName)        branding.value.name          = data.tenantName
    if (data.tenantLogoUrl)     branding.value.logoUrl       = data.tenantLogoUrl
    if (data.tenantPrimaryColor)   branding.value.primaryColor   = data.tenantPrimaryColor
    if (data.tenantSecondaryColor) branding.value.secondaryColor = data.tenantSecondaryColor

    // Se il link era gi- stato usato (monouso), mostra direttamente lo stato di successo
    // col QR esistente senza riaprire il form.
    if (data.alreadyRegistered) {
      result.value = {
        participantId: data.participantId,
        bookingId: data.bookingId,
        qrCode: data.qrCode,
        alreadyRegistered: true,
      }
      state.value = 'success'
      return
    }

    state.value = 'form'
  } catch {
    state.value = 'invalid'
  }
})
</script>

<style scoped src="./PublicRegisterView.css"></style>

