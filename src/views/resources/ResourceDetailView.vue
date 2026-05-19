<template>
  <MainLayout>
    <div class="rd-root">

      <!-- ── Header ──────────────────────────────────────────────── -->
      <header class="rd-header">
        <div class="rd-breadcrumb">
          <button class="rd-back-btn" @click="goBack">
            <i class="pi pi-arrow-left" />
            {{ t('resources.title') }}
          </button>
          <i class="pi pi-chevron-right rd-breadcrumb-sep" />
          <span class="rd-breadcrumb-cur">{{ resource?.name || '…' }}</span>
        </div>
        <div class="rd-header-actions">
          <span v-if="resource" class="rd-status-chip" :data-status="resource.status === ResourceStatus.Available ? 'available' : 'maintenance'">
            <i :class="resource.status === ResourceStatus.Available ? 'pi pi-check-circle' : 'pi pi-wrench'" />
            {{ resource.status === ResourceStatus.Available
              ? t('resources.status.available')
              : t('resources.status.inMaintenance') }}
          </span>
          <Button severity="secondary" :label="t('common.cancel')" icon="pi pi-times" @click="goBack" />
          <Button
            severity="success"
            :label="saving ? t('common.saving') : t('common.save')"
            :icon="saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
            :loading="saving"
            :disabled="saving"
            @click="saveResource"
          />
        </div>
      </header>

      <!-- ── Loading ─────────────────────────────────────────────── -->
      <div v-if="isPageLoading" class="rd-state">
        <i class="pi pi-spin pi-spinner rd-state-icon" />
        <p>{{ t('common.loading') }}</p>
      </div>

      <!-- ── Main content ─────────────────────────────────────────── -->
      <template v-else-if="resource">
        <div class="rd-content">

          <!-- ── Left: form sections ──────────────────────────────── -->
          <div class="rd-main">

            <!-- 1 · General info -->
            <section class="rd-card">
              <div class="rd-card-hd">
                <i class="pi pi-info-circle" />
                {{ t('resources.generalInfo') }}
              </div>
              <div class="dlg-fields-2">
                <div class="dlg-field dlg-field-full">
                  <label class="dlg-label">{{ t('resources.name') }} <span class="req">*</span></label>
                  <InputText v-model="formData.name" class="w-full" />
                </div>
                <div class="dlg-field">
                  <label class="dlg-label">{{ t('resources.site') }}</label>
                  <Select
                    v-model="formData.plantId"
                    :options="plantOptions"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                  />
                </div>
                <div class="dlg-field">
                  <label class="dlg-label">{{ t('resources.type') }}</label>
                  <Select
                    v-model="formData.resourceTypeId"
                    :options="resourceTypeOptions"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                  />
                </div>
                <div class="dlg-field">
                  <label class="dlg-label">{{ t('resources.capacity') }}</label>
                  <InputNumber v-model="formData.capacity" class="w-full" :min="0" />
                </div>
                <div class="dlg-field dlg-field-full">
                  <label class="dlg-label">{{ t('resources.description') }}</label>
                  <Textarea v-model="formData.description" rows="3" class="w-full" auto-resize />
                </div>
              </div>
            </section>

            <!-- 2 · Status & maintenance -->
            <section class="rd-card">
              <div class="rd-card-hd">
                <i class="pi pi-cog" />
                {{ t('resources.statusLabel') }}
              </div>
              <div class="dlg-fields-2">
                <div class="dlg-field dlg-field-full">
                  <label class="dlg-label">{{ t('common.status') }}</label>
                  <Select
                    v-model="formData.status"
                    :options="statusOptions"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                  />
                </div>
                <p class="dlg-help rd-status-hint">
                  {{ formData.status === ResourceStatus.Available
                    ? t('resources.activeHelpAvailable')
                    : t('resources.activeHelpUnavailable') }}
                </p>
                <template v-if="formData.status === ResourceStatus.InMaintenance">
                  <div class="dlg-field">
                    <label class="dlg-label">{{ t('maintenanceStartDate') }}</label>
                    <Calendar v-model="maintenanceStartDateCalendar" show-icon date-format="yy-mm-dd" class="w-full" />
                  </div>
                  <div class="dlg-field">
                    <label class="dlg-label">{{ t('maintenanceEndDate') }}</label>
                    <Calendar v-model="maintenanceEndDateCalendar" show-icon date-format="yy-mm-dd" class="w-full" />
                  </div>
                </template>
              </div>
            </section>

            <!-- 3 · Availability windows -->
            <section class="rd-card">
              <div class="rd-card-hd">
                <i class="pi pi-clock" />
                {{ t('resources.availability.title') }}
              </div>

              <button type="button" class="slot-trigger-btn" @click="showAvailabilityEditor = !showAvailabilityEditor">
                <i class="pi pi-plus" /> {{ t('resources.availability.addWindow') }}
              </button>

              <div v-if="showAvailabilityEditor" class="slot-editor">
                <div class="slot-inputs">
                  <input v-model="newWindowFrom" type="time" step="900" class="slot-time-input" />
                  <span class="slot-separator">–</span>
                  <input v-model="newWindowTo" type="time" step="900" class="slot-time-input" />
                  <button type="button" class="slot-add-btn" @click="confirmAvailabilityWindow">
                    <i class="pi pi-check" /> {{ t('resourceTypes.confirmSlot') }}
                  </button>
                </div>
              </div>

              <div v-if="formData.availableTimeWindows.length" class="slot-list">
                <div
                  v-for="(win, i) in formData.availableTimeWindows"
                  :key="`avw-${i}-${win.from}`"
                  class="slot-row"
                >
                  <div class="slot-row-left">
                    <div class="slot-row-icon"><i class="pi pi-clock" /></div>
                    <div class="slot-row-content">
                      <div class="slot-row-title">{{ t('resources.availability.windowIndex', { n: i + 1 }) }}</div>
                      <div class="slot-row-time">
                        <span class="slot-time-pill">{{ win.from }}</span>
                        <i class="pi pi-arrow-right slot-time-arrow" />
                        <span class="slot-time-pill">{{ win.to }}</span>
                      </div>
                    </div>
                  </div>
                  <button type="button" class="slot-row-remove" :title="t('common.delete')" @click="removeAvailabilityWindow(i)">
                    <i class="pi pi-trash" />
                  </button>
                </div>
              </div>
              <p v-else class="slot-empty">
                <i class="pi pi-info-circle" /> {{ t('resources.availability.empty') }}
              </p>

              <small class="dlg-help">{{ t('resources.availability.help') }}</small>
            </section>

            <!-- 4 · Approval -->
            <section class="rd-card">
              <div class="rd-card-hd">
                <i class="pi pi-check-square" />
                {{ t('resources.approvalStatus') }}
              </div>
              <div class="dlg-status-row">
                <div>
                  <div class="dlg-status-title">{{ t('resources.approvalRequired') }}</div>
                  <div class="dlg-status-desc">{{ t('resources.activeHelpAvailable') }}</div>
                </div>
                <PrimeToggleSwitch v-model="formData.requiresApproval" />
              </div>
              <template v-if="formData.requiresApproval">
                <hr class="dlg-divider rd-divider-mt" />
                <div class="dlg-fields-2 rd-fields-mt">
                  <div class="dlg-field dlg-field-full">
                    <label class="dlg-label">{{ t('approvalCondition') }}</label>
                    <InputText
                      v-model="formData.approvalCondition"
                      :placeholder="t('approvalConditionPlaceholder')"
                      class="w-full"
                    />
                  </div>
                  <div class="dlg-field">
                    <label class="dlg-label">{{ t('approvalTimeoutHours') }}</label>
                    <InputNumber v-model="formData.approvalTimeoutHours" :min="1" :max="168" class="w-full" />
                  </div>
                </div>
              </template>
            </section>

            <!-- 5 · Public page settings -->
            <section class="rd-card">
              <div class="rd-card-hd">
                <i class="pi pi-tablet" />
                {{ t('resources.publicPage.title') }}
              </div>
              <div class="dlg-status-row">
                <div>
                  <div class="dlg-status-title">{{ t('resources.publicPage.toggleLabel') }}</div>
                  <div class="dlg-status-desc">{{ t('resources.publicPage.toggleHint') }}</div>
                </div>
                <PrimeToggleSwitch v-model="formData.publicPageEnabled" />
              </div>
              <template v-if="formData.publicPageEnabled || resource.hasPublicPagePin">
                <hr class="dlg-divider rd-divider-mt" />
                <div class="dlg-field rd-fields-mt">
                  <label class="dlg-label">{{ t('resources.publicPage.pinLabel') }}</label>
                  <InputText
                    v-model="formData.publicPagePin"
                    type="password"
                    inputmode="numeric"
                    maxlength="8"
                    autocomplete="new-password"
                    :placeholder="t('resources.publicPage.pinPlaceholder')"
                    class="w-full"
                  />
                  <small class="dlg-help">{{ t('resources.publicPage.pinHelp') }}</small>
                  <div v-if="resource.hasPublicPagePin" class="rd-check-row">
                    <Checkbox v-model="formData.clearPublicPagePin" input-id="rdClearPin" binary />
                    <label for="rdClearPin" class="rd-check-label">{{ t('resources.publicPage.clearPin') }}</label>
                  </div>
                </div>
              </template>
            </section>

          </div><!-- /rd-main -->

          <!-- ── Right: Sidebar ───────────────────────────────────── -->
          <aside class="rd-sidebar">

            <!-- Summary card -->
            <div class="rd-summary-card">
              <div class="rd-summary-head">
                <div class="rd-summary-icon" :style="summaryIconStyle">
                  <i :class="resourceTypeIcon" />
                </div>
                <div class="rd-summary-info">
                  <div class="rd-summary-name">{{ resource.name }}</div>
                  <div class="rd-summary-type">{{ resourceTypeName }}</div>
                </div>
              </div>
              <div class="rd-summary-facts">
                <div class="rd-summary-fact">
                  <i class="pi pi-building" />
                  <span>{{ plantName }}</span>
                </div>
                <div class="rd-summary-fact">
                  <i class="pi pi-users" />
                  <span>{{ resource.capacity ? `${resource.capacity} ${t('resources.publicPage.seatsLabel')}` : '—' }}</span>
                </div>
                <div class="rd-summary-fact">
                  <i class="pi pi-clock" />
                  <span>{{ resource.availableTimeWindows?.length
                    ? `${resource.availableTimeWindows.length} finestre`
                    : 'Orario sede' }}</span>
                </div>
                <div class="rd-summary-fact">
                  <i class="pi pi-calendar-plus" />
                  <span>{{ formatResourceDate(resource.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Public page quick panel -->
            <div class="rd-pub-panel" :data-enabled="resource.publicPageEnabled ? 'true' : 'false'">
              <div class="rd-pub-panel-head">
                <span class="rd-pub-panel-title">
                  <i class="pi pi-tablet" />
                  {{ t('resources.publicPage.title') }}
                </span>
                <Tag
                  :value="resource.publicPageEnabled ? t('resources.publicPage.enabled') : t('resources.publicPage.disabled')"
                  :severity="resource.publicPageEnabled ? 'success' : 'warning'"
                />
              </div>
              <p class="rd-pub-note">
                <template v-if="resource.publicPageEnabled">{{ t('resources.publicPage.activeHint') }}</template>
                <template v-else-if="hasPendingPublicPageChange">{{ t('resources.publicPage.saveHint') }}</template>
                <template v-else>{{ t('resources.publicPage.disabledHint') }}</template>
              </p>
              <code class="rd-pub-url">{{ publicPreviewUrl }}</code>
              <div class="rd-pub-actions">
                <Button
                  icon="pi pi-external-link"
                  :label="t('resources.publicPage.openPreview')"
                  severity="success"
                  size="small"
                  :disabled="!resource.publicPageEnabled"
                  @click="openPublicPreview"
                />
                <Button
                  icon="pi pi-copy"
                  :label="t('resources.publicPage.copyLink')"
                  severity="secondary"
                  size="small"
                  outlined
                  @click="copyPublicLink"
                />
              </div>
              <div class="rd-pub-facts">
                <span class="rd-pub-fact">
                  <i :class="resource.hasPublicPagePin && !formData.clearPublicPagePin ? 'pi pi-lock' : 'pi pi-lock-open'" />
                  {{ resource.hasPublicPagePin && !formData.clearPublicPagePin
                    ? t('resources.publicPage.pinProtected')
                    : t('resources.publicPage.pinNotSet') }}
                </span>
              </div>
            </div>

            <!-- QR Code card -->
            <div class="rd-qr-card">
              <div class="rd-qr-head">
                <i class="pi pi-qrcode" />
                <span>{{ t('resources.qrCode.title') }}</span>
              </div>
              <div class="rd-qr-body">
                <div v-if="qrDataUrl" class="rd-qr-wrap">
                  <img :src="qrDataUrl" :alt="t('resources.qrCode.title')" class="rd-qr-img" />
                </div>
                <div v-else class="rd-qr-spinner">
                  <i class="pi pi-spin pi-spinner" />
                </div>
              </div>
              <p class="rd-qr-hint">{{ t('resources.qrCode.hint') }}</p>
              <div class="rd-qr-actions">
                <a
                  v-if="qrDataUrl"
                  :href="qrDataUrl"
                  :download="`qr-${resource.name}.png`"
                  class="rd-qr-download-btn"
                >
                  <i class="pi pi-download" /> {{ t('resources.qrCode.download') }}
                </a>
              </div>
            </div>

          </aside>

        </div><!-- /rd-content -->

        <!-- ── Bottom: Custom Fields ────────────────────────────── -->
        <div class="rd-bottom">
          <section class="rd-card">
            <div class="rd-card-hd-row">
              <div class="rd-card-hd">
                <i class="pi pi-list" />
                {{ t('common.customFields') }}
              </div>
              <Button
                icon="pi pi-plus"
                :label="t('resourceTypes.addField')"
                severity="success"
                size="small"
                @click="openAddFieldDialog"
              />
            </div>
            <DataTable
              :value="currentCustomFields"
              :loading="customFieldsStore.loading"
              class="p-datatable-striped rd-fields-table"
            >
              <template #empty>
                <div class="rd-table-empty">
                  <i class="pi pi-inbox" />
                  <p>{{ t('resourceTypes.noFields') }}</p>
                </div>
              </template>
              <Column field="label"      :header="t('resourceTypes.fieldLabel')" />
              <Column field="fieldType"  :header="t('resourceTypes.fieldType')" />
              <Column field="isRequired" :header="t('resourceTypes.required')" style="width:100px">
                <template #body="{ data }">
                  <Tag
                    :value="data.isRequired ? t('common.yes') : t('common.no')"
                    :severity="data.isRequired ? 'info' : 'secondary'"
                  />
                </template>
              </Column>
              <Column field="visibility" :header="t('resourceTypes.visibility')" />
              <Column field="sortOrder"  :header="t('resourceTypes.sortOrder')" style="width:80px" />
              <Column :header="t('common.name')" style="width:170px">
                <template #body="{ data }">
                  <code class="field-name-code">{{ data.name }}</code>
                </template>
              </Column>
              <Column :header="t('common.actions')" style="width:100px">
                <template #body="{ data }">
                  <div class="list-row-actions">
                    <button class="list-action-btn list-action-edit"   :title="t('common.edit')"   @click="editField(data)">
                      <i class="pi pi-pencil" />
                    </button>
                    <button class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteField(data.id)">
                      <i class="pi pi-trash" />
                    </button>
                  </div>
                </template>
              </Column>
            </DataTable>
          </section>
        </div>

      </template>

      <!-- ── Error state ──────────────────────────────────────────── -->
      <div v-else class="rd-state">
        <i class="pi pi-times-circle rd-state-icon rd-state-icon--error" />
        <p>{{ t('errors.loadFailed') }}</p>
        <Button :label="t('common.back')" icon="pi pi-arrow-left" severity="secondary" @click="goBack" />
      </div>

      <!-- ── Custom field dialog ──────────────────────────────────── -->
      <AppDialog
        v-model:visible="showFieldDialog"
        :header="isEditingField ? t('resourceTypes.editField') : t('resourceTypes.addField')"
        :subtitle="selectedCatalogField?.label || t('resourceTypes.catalogEmptyTitle')"
        icon="pi pi-list"
        severity="primary"
        size="md"
      >
        <div class="dlg-form">
          <div class="dlg-section">
            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('resourceTypes.catalogField') }} <span class="req">*</span></label>
                <Select
                  v-model="fieldLinkData.customFieldId"
                  :options="availableCatalogFields"
                  option-label="label"
                  option-value="id"
                  filter
                  :disabled="isEditingField"
                  :placeholder="t('resourceTypes.selectCustomFieldPlaceholder')"
                  class="w-full"
                />
                <small class="dlg-help">{{ t('resourceTypes.catalogFieldHint') }}</small>
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('resourceTypes.sortOrder') }}</label>
                <InputNumber v-model="fieldLinkData.sortOrder" class="w-full" :min="0" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('resourceTypes.visibility') }}</label>
                <Select
                  v-model="fieldLinkData.visibility"
                  :options="visibilityOptions"
                  option-label="label"
                  option-value="value"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <div v-if="selectedCatalogField" class="dlg-section">
            <div class="selected-field-meta">
              <div>
                <div class="dlg-status-title">{{ selectedCatalogField.label }}</div>
                <div class="dlg-status-desc">{{ selectedCatalogField.name }}</div>
              </div>
              <div class="selected-field-chips">
                <span class="meta-chip">{{ selectedCatalogField.fieldType }}</span>
                <span v-if="selectedCatalogField.options?.length" class="meta-chip">
                  {{ selectedCatalogField.options.length }} opzioni
                </span>
              </div>
            </div>
          </div>

          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">{{ t('resourceTypes.required') }}</div>
                <div class="dlg-status-desc">{{ t('resources.fieldRequiredHelp') }}</div>
              </div>
              <Checkbox v-model="fieldLinkData.isRequired" input-id="rdFieldRequired" binary />
            </div>
          </div>
        </div>

        <template #footer>
          <button class="dialog-btn dialog-btn-cancel" @click="closeFieldDialog">
            <i class="pi pi-times" /> {{ t('common.cancel') }}
          </button>
          <button class="dialog-btn dialog-btn-save" :disabled="!fieldLinkData.customFieldId" @click="saveField">
            <i class="pi pi-check" /> {{ t('common.save') }}
          </button>
        </template>
      </AppDialog>

    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import QRCode from 'qrcode'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { usePlantsStore } from '@/stores/plants.store'
import { useResourcesStore } from '@/stores/resources.store'
import { useCustomFieldsStore } from '@/stores/custom-fields.store'
import { customFieldsApi } from '@/api/custom-fields.api'
import MainLayout from '@/layouts/MainLayout.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import type { UpdateResourceDto, AvailabilityWindow } from '@/types/resource'
import { FieldVisibility, ResourceStatus } from '@/types/enums'
import type { CustomFieldDef, FieldLinkResponse } from '@/types/custom-field'

// PrimeVue
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import PrimeToggleSwitch from 'primevue/toggleswitch'

// ── Stores & router ──────────────────────────────────────────────────
const { t, locale } = useI18n()
const router        = useRouter()
const route         = useRoute()
const toast         = useToast()
const plantsStore         = usePlantsStore()
const resourcesStore      = useResourcesStore()
const customFieldsStore   = useCustomFieldsStore()

// ── Page state ───────────────────────────────────────────────────────
const isPageLoading = ref(true)
const saving        = ref(false)
const qrDataUrl     = ref<string>('')

const formData = ref<UpdateResourceDto & { availableTimeWindows: AvailabilityWindow[] }>({
  plantId:              '',
  resourceTypeId:       '',
  name:                 '',
  description:          '',
  capacity:             undefined,
  status:               ResourceStatus.Available,
  requiresApproval:     false,
  approvalCondition:    '',
  approvalTimeoutHours: undefined,
  maintenanceStartDate: undefined,
  maintenanceEndDate:   undefined,
  publicPageEnabled:    false,
  publicPagePin:        '',
  clearPublicPagePin:   false,
  availableTimeWindows: [],
})

// Availability windows editor
const showAvailabilityEditor = ref(false)
const newWindowFrom          = ref('')
const newWindowTo            = ref('')

// Custom fields dialog
const currentCustomFields = ref<FieldLinkResponse[]>([])
const fieldLinkData       = ref(defaultFieldLinkData())
const showFieldDialog     = ref(false)
const isEditingField      = ref(false)
const editingFieldId      = ref<string | null>(null)

// ── Computed ─────────────────────────────────────────────────────────
const resourceId = computed(() => route.params.id as string)

const resource = computed(() => resourcesStore.resourceById(resourceId.value))

const plantOptions = computed(() =>
  plantsStore.plants.map(p => ({ label: p.name, value: p.id }))
)
const resourceTypeOptions = computed(() =>
  resourcesStore.resourceTypes.map(rt => ({ label: rt.name, value: rt.id }))
)
const statusOptions = computed(() => [
  { label: t('resources.status.available'),    value: ResourceStatus.Available },
  { label: t('resources.status.inMaintenance'), value: ResourceStatus.InMaintenance },
])
const visibilityOptions = computed(() => [
  { label: t('visitorTypes.visibilityInternal'), value: FieldVisibility.Internal },
  { label: t('visitorTypes.visibilityPublic'),   value: FieldVisibility.Public },
])

const plantName = computed(() =>
  resource.value ? plantsStore.plantById(resource.value.plantId)?.name ?? '—' : '—'
)
const resourceTypeName = computed(() =>
  resource.value ? resourcesStore.resourceTypeById(resource.value.resourceTypeId)?.name ?? '—' : '—'
)
const resourceTypeIcon = computed(() => {
  if (!resource.value) return 'pi pi-box'
  const rt = resourcesStore.resourceTypeById(resource.value.resourceTypeId)
  return rt?.icon ? `pi ${rt.icon}` : 'pi pi-box'
})
const resourceTypeColor = computed(() => {
  if (!resource.value) return '#4f46e5'
  const rt = resourcesStore.resourceTypeById(resource.value.resourceTypeId)
  return rt?.color ?? '#4f46e5'
})
const summaryIconStyle = computed(() => ({
  background: `${resourceTypeColor.value}22`,
  color:      resourceTypeColor.value,
  border:     `1.5px solid ${resourceTypeColor.value}44`,
}))

const publicPreviewUrl = computed(() => {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/public/resources/${resourceId.value}`
})

const hasPendingPublicPageChange = computed(() =>
  Boolean(resource.value) && formData.value.publicPageEnabled !== resource.value!.publicPageEnabled
)

// Custom fields
const availableCatalogFields = computed(() =>
  customFieldsStore.fields.filter(f => {
    if (isEditingField.value && f.id === fieldLinkData.value.customFieldId) return true
    return !currentCustomFields.value.some(l => l.customFieldId === f.id)
  })
)
const selectedCatalogField = computed<CustomFieldDef | undefined>(() =>
  customFieldsStore.fields.find(f => f.id === fieldLinkData.value.customFieldId)
)

// ── Calendar computed proxies ─────────────────────────────────────────
const maintenanceStartDateCalendar = computed({
  get: () => formData.value.maintenanceStartDate ? new Date(formData.value.maintenanceStartDate) : null,
  set: (v: Date | null) => {
    formData.value.maintenanceStartDate = v ? v.toISOString().split('T')[0] : undefined
  },
})
const maintenanceEndDateCalendar = computed({
  get: () => formData.value.maintenanceEndDate ? new Date(formData.value.maintenanceEndDate) : null,
  set: (v: Date | null) => {
    formData.value.maintenanceEndDate = v ? v.toISOString().split('T')[0] : undefined
  },
})

// ── Helpers ───────────────────────────────────────────────────────────
function defaultFieldLinkData() {
  return { customFieldId: '', isRequired: false, sortOrder: 0, visibility: FieldVisibility.Internal }
}

// ── QR Code ───────────────────────────────────────────────────────────
async function generateQr(): Promise<void> {
  try {
    qrDataUrl.value = await QRCode.toDataURL(publicPreviewUrl.value, {
      width:            240,
      margin:           2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
  } catch (e) {
    console.error('QR generation failed:', e)
  }
}

watch(publicPreviewUrl, generateQr)

function formatResourceDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(locale.value, {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(iso))
  } catch { return iso }
}

function populateForm(r: NonNullable<typeof resource.value>) {
  formData.value = {
    plantId:              r.plantId,
    resourceTypeId:       r.resourceTypeId,
    name:                 r.name,
    description:          r.description ?? '',
    capacity:             r.capacity,
    status:               r.status,
    requiresApproval:     r.requiresApproval,
    approvalCondition:    r.approvalCondition ?? '',
    approvalTimeoutHours: r.approvalTimeoutHours,
    maintenanceStartDate: r.maintenanceStartDate,
    maintenanceEndDate:   r.maintenanceEndDate,
    publicPageEnabled:    r.publicPageEnabled,
    publicPagePin:        '',
    clearPublicPagePin:   false,
    availableTimeWindows: Array.isArray(r.availableTimeWindows)
      ? r.availableTimeWindows.map(w => ({ from: w.from, to: w.to }))
      : [],
  }
}

// ── Availability windows ──────────────────────────────────────────────
function confirmAvailabilityWindow(): void {
  const from = newWindowFrom.value
  const to   = newWindowTo.value
  if (!from || !to) return
  if (from >= to) {
    alert('L\'orario di inizio deve essere precedente a quello di fine.')
    return
  }
  for (const w of formData.value.availableTimeWindows) {
    if (from < w.to && to > w.from) {
      alert(`La finestra ${from}–${to} si sovrappone con ${w.from}–${w.to}.`)
      return
    }
  }
  formData.value.availableTimeWindows.push({ from, to })
  formData.value.availableTimeWindows.sort((a, b) => a.from.localeCompare(b.from))
  newWindowFrom.value = ''
  newWindowTo.value   = ''
  showAvailabilityEditor.value = false
}

function removeAvailabilityWindow(index: number): void {
  formData.value.availableTimeWindows.splice(index, 1)
}

// ── Navigation & public page ──────────────────────────────────────────
function goBack(): void {
  router.push('/resources')
}

function openPublicPreview(): void {
  if (!resource.value?.publicPageEnabled) return
  window.open(publicPreviewUrl.value, '_blank', 'noopener,noreferrer')
}

async function copyPublicLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(publicPreviewUrl.value)
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('resources.publicPage.copySuccess'), life: 2500 })
  } catch {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('resources.publicPage.copyError'), life: 3000 })
  }
}

// ── Save ──────────────────────────────────────────────────────────────
async function saveResource(): Promise<void> {
  saving.value = true
  try {
    const dto: UpdateResourceDto = {
      ...formData.value,
      publicPagePin:      formData.value.publicPagePin?.trim() || undefined,
      clearPublicPagePin: formData.value.clearPublicPagePin || undefined,
    }
    await resourcesStore.updateResource(resourceId.value, dto)
    // Refresh from server to pick up any server-computed changes
    const fresh = await resourcesStore.fetchResourceById(resourceId.value)
    populateForm(fresh)
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.saved'), life: 2500 })
  } catch (e) {
    console.error('Error saving resource:', e)
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.errorSaving'), life: 3000 })
  } finally {
    saving.value = false
  }
}

// ── Custom fields CRUD ────────────────────────────────────────────────
async function loadResourceLinks(): Promise<void> {
  currentCustomFields.value = await customFieldsApi.getResourceLinks(resourceId.value)
}

function openAddFieldDialog(): void {
  isEditingField.value  = false
  editingFieldId.value  = null
  fieldLinkData.value   = defaultFieldLinkData()
  showFieldDialog.value = true
}

function editField(field: FieldLinkResponse): void {
  isEditingField.value  = true
  editingFieldId.value  = field.id
  fieldLinkData.value   = {
    customFieldId: field.customFieldId,
    isRequired:    field.isRequired,
    sortOrder:     field.sortOrder,
    visibility:    field.visibility as FieldVisibility,
  }
  showFieldDialog.value = true
}

async function saveField(): Promise<void> {
  try {
    if (isEditingField.value && editingFieldId.value) {
      await customFieldsApi.updateResourceLink(editingFieldId.value, {
        isRequired: fieldLinkData.value.isRequired,
        sortOrder:  fieldLinkData.value.sortOrder,
        visibility: fieldLinkData.value.visibility,
      })
    } else {
      await customFieldsApi.addResourceLink({
        entityId:      resourceId.value,
        customFieldId: fieldLinkData.value.customFieldId,
        isRequired:    fieldLinkData.value.isRequired,
        sortOrder:     fieldLinkData.value.sortOrder,
        visibility:    fieldLinkData.value.visibility,
      })
    }
    await loadResourceLinks()
    closeFieldDialog()
  } catch (e) {
    console.error('Error saving field link:', e)
  }
}

async function deleteField(fieldId: string): Promise<void> {
  if (!confirm(t('common.confirm'))) return
  try {
    await customFieldsApi.removeResourceLink(fieldId)
    await loadResourceLinks()
  } catch (e) {
    console.error('Error deleting field link:', e)
  }
}

function closeFieldDialog(): void {
  showFieldDialog.value = false
  isEditingField.value  = false
  editingFieldId.value  = null
  fieldLinkData.value   = defaultFieldLinkData()
}

// ── Lifecycle ─────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const loaded = await resourcesStore.fetchResourceById(resourceId.value)
    await Promise.all([
      plantsStore.fetchAll(),
      resourcesStore.fetchAllResourceTypes(),
    ])
    if (!customFieldsStore.fields.length) await customFieldsStore.fetchAll()
    await loadResourceLinks()
    populateForm(loaded)
    await generateQr()
  } catch (e) {
    console.error('Error loading resource detail:', e)
  } finally {
    isPageLoading.value = false
  }
})
</script>

<style scoped src="./ResourceDetailView.css"></style>
