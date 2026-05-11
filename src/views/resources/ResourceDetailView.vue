<template>
  <MainLayout>
    <div class="detail-container">
      <div class="flex items-center justify-between mb-6">
        <div>
          <!-- <h1 class="text-3xl font-bold text-slate-900 mb-2">{{ resource?.name || t('resources.title') }}</h1> -->
          <p class="text-slate-600" v-if="resource">{{ plantsStore.plantById(resource.plantId)?.name }}</p>
        </div>
        <Button :label="t('common.back')" icon="pi pi-arrow-left" @click="goBack" severity="secondary" />
      </div>

      <Card class="shadow-lg mb-6">
        <template #title>{{ t('resources.title') }} - {{ t('common.edit') }}</template>
        <template #content>
          <form @submit.prevent="saveResource" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('plants.title') }} *</label>
                <Dropdown
                  v-model="formData.plantId"
                  :options="plantsStore.plants"
                  option-label="name"
                  option-value="id"
                  :placeholder="t('plants.title')"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resources.type') }} *</label>
                <Dropdown
                  v-model="formData.resourceTypeId"
                  :options="resourcesStore.resourceTypes"
                  option-label="name"
                  option-value="id"
                  :placeholder="t('resources.type')"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resources.name') }} *</label>
                <InputText v-model="formData.name" :placeholder="t('resources.name')" class="w-full" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resources.capacity') }}</label>
                <InputNumber v-model="formData.capacity" :placeholder="t('resources.capacity')" class="w-full" />
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resources.description') }}</label>
                <Textarea v-model="formData.description" :placeholder="t('resources.description')" class="w-full" rows="3" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('common.status') }}</label>
                <Dropdown v-model="formData.status" :options="Object.values(ResourceStatus)" :placeholder="t('common.status')" class="w-full" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resources.approvalStatus') }}</label>
                <div class="flex items-center gap-2">
                  <Checkbox v-model="formData.requiresApproval" input-id="requiresApproval" binary />
                  <label for="requiresApproval" class="text-sm">{{ t('resources.approvalRequired') }}</label>
                </div>
              </div>

              <div v-if="formData.requiresApproval" class="col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('approvalCondition') }}</label>
                <InputText v-model="formData.approvalCondition" :placeholder="t('approvalConditionPlaceholder')" class="w-full" />
              </div>

              <div v-if="formData.requiresApproval">
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('approvalTimeoutHours') }}</label>
                <InputNumber v-model="formData.approvalTimeoutHours" :placeholder="t('common.loading')" class="w-full" />
              </div>

              <div v-if="formData.status === 'InMaintenance'">
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('maintenanceStartDate') }}</label>
                <Calendar v-model="maintenanceStartDateCalendar" show-icon date-format="yy-mm-dd" class="w-full" />
              </div>

              <div v-if="formData.status === 'InMaintenance'">
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('maintenanceEndDate') }}</label>
                <Calendar v-model="maintenanceEndDateCalendar" show-icon date-format="yy-mm-dd" class="w-full" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resources.publicPage.toggleLabel') }}</label>
                <div class="flex items-center gap-2">
                  <Checkbox v-model="formData.publicPageEnabled" input-id="publicPageEnabled" binary />
                  <label for="publicPageEnabled" class="text-sm">{{ t('resources.publicPage.toggleHint') }}</label>
                </div>
              </div>

              <div v-if="formData.publicPageEnabled || resource?.hasPublicPagePin" class="col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resources.publicPage.pinLabel') }}</label>
                <InputText
                  v-model="formData.publicPagePin"
                  type="password"
                  inputmode="numeric"
                  maxlength="8"
                  autocomplete="new-password"
                  :placeholder="t('resources.publicPage.pinPlaceholder')"
                  class="w-full"
                />
                <small class="block mt-2 text-slate-500">{{ t('resources.publicPage.pinHelp') }}</small>

                <div v-if="resource?.hasPublicPagePin" class="flex items-center gap-2 mt-3">
                  <Checkbox v-model="formData.clearPublicPagePin" input-id="clearPublicPagePin" binary />
                  <label for="clearPublicPagePin" class="text-sm">{{ t('resources.publicPage.clearPin') }}</label>
                </div>
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <Button type="submit" :label="t('common.save')" icon="pi pi-check" severity="success" :loading="resourcesStore.loading" />
              <Button type="button" :label="t('common.cancel')" icon="pi pi-times" severity="secondary" @click="goBack" />
            </div>
          </form>
        </template>
      </Card>

      <Card class="shadow-lg mb-6" v-if="resource">
        <template #title>
          <div class="public-preview-title">
            <div class="public-preview-title-copy">
              <i class="pi pi-tablet text-emerald-500"></i>
              <div>
                <div>{{ t('resources.publicPage.title') }}</div>
                <small>{{ t('resources.publicPage.description') }}</small>
              </div>
            </div>
            <Tag
              :value="resource.publicPageEnabled ? t('resources.publicPage.enabled') : t('resources.publicPage.disabled')"
              :severity="resource.publicPageEnabled ? 'success' : 'warning'"
            />
          </div>
        </template>
        <template #content>
          <div class="public-preview-panel" :data-enabled="resource.publicPageEnabled ? 'true' : 'false'">
            <div class="public-preview-grid">
              <div class="public-preview-main">
                <div class="public-preview-url-block">
                  <label class="public-preview-label">{{ t('resources.publicPage.linkLabel') }}</label>
                  <code class="public-preview-url">{{ publicPreviewUrl }}</code>
                </div>

                <p class="public-preview-note" v-if="resource.publicPageEnabled">
                  {{ t('resources.publicPage.activeHint') }}
                </p>
                <p class="public-preview-note" v-else-if="hasPendingPublicPageChange">
                  {{ t('resources.publicPage.saveHint') }}
                </p>
                <p class="public-preview-note" v-else>
                  {{ t('resources.publicPage.disabledHint') }}
                </p>
                <p class="public-preview-subnote">{{ t('resources.publicPage.brandingHint') }}</p>
                <p v-if="resource.hasPublicPagePin && !formData.clearPublicPagePin" class="public-preview-note public-preview-note-compact">
                  {{ t('resources.publicPage.pinActiveHint') }}
                </p>

                <div class="public-preview-facts" role="list" :aria-label="t('resources.publicPage.quickFactsAriaLabel')">
                  <span class="public-fact" role="listitem">
                    <i class="pi pi-building-columns" />
                    {{ plantsStore.plantById(resource.plantId)?.name || '-' }}
                  </span>
                  <span class="public-fact" role="listitem">
                    <i class="pi pi-users" />
                    {{ resource.capacity || 0 }} {{ t('resources.publicPage.seatsLabel') }}
                  </span>
                  <span class="public-fact" role="listitem">
                    <i class="pi pi-tablet" />
                    {{ resource.publicPageEnabled ? t('resources.publicPage.enabled') : t('resources.publicPage.disabled') }}
                  </span>
                  <span class="public-fact" role="listitem">
                    <i class="pi" :class="resource.hasPublicPagePin && !formData.clearPublicPagePin ? 'pi-lock' : 'pi-lock-open'" />
                    {{ resource.hasPublicPagePin && !formData.clearPublicPagePin
                      ? t('resources.publicPage.pinProtected')
                      : t('resources.publicPage.pinNotSet') }}
                  </span>
                </div>
              </div>

              <div class="public-preview-showcase" aria-hidden="true">
                <div class="tablet-mini">
                  <div class="tablet-mini-bar">
                    <span class="tablet-mini-dot"></span>
                    <span class="tablet-mini-dot"></span>
                    <span class="tablet-mini-dot"></span>
                  </div>

                  <div class="tablet-mini-screen">
                    <div class="tablet-mini-header">
                      <div class="tablet-mini-brand">
                        <div class="tablet-mini-logo">
                          <i class="pi pi-building" />
                        </div>
                        <div>
                          <span class="tablet-mini-kicker">{{ t('resources.publicPage.tabletViewKicker') }}</span>
                          <strong>{{ resource.name }}</strong>
                        </div>
                      </div>
                      <span class="tablet-mini-time">09:41</span>
                    </div>

                    <div class="tablet-mini-status" :data-enabled="resource.publicPageEnabled ? 'true' : 'false'">
                      <span class="tablet-mini-pill">
                        <i class="pi" :class="resource.publicPageEnabled ? 'pi-check-circle' : 'pi-lock'" />
                        {{ resource.publicPageEnabled ? t('resources.publicPage.enabled') : t('resources.publicPage.disabled') }}
                      </span>
                      <strong>{{ resource.name }}</strong>
                      <small>{{ plantsStore.plantById(resource.plantId)?.name || 'Resource plant' }}</small>
                    </div>

                    <div class="tablet-mini-agenda">
                      <div class="tablet-mini-row">
                        <span>09:00</span>
                        <div></div>
                      </div>
                      <div class="tablet-mini-row active">
                        <span>10:30</span>
                        <div></div>
                      </div>
                      <div class="tablet-mini-row">
                        <span>12:00</span>
                        <div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="public-preview-actions">
              <Button
                icon="pi pi-external-link"
                :label="t('resources.publicPage.openPreview')"
                severity="success"
                @click="openPublicPreview"
                :disabled="!resource.publicPageEnabled"
              />
              <Button
                icon="pi pi-copy"
                :label="t('resources.publicPage.copyLink')"
                severity="secondary"
                outlined
                @click="copyPublicLink"
              />
            </div>
          </div>
        </template>
      </Card>

      <Card class="shadow-lg" v-if="resource">
        <template #title>
          <div class="flex items-center justify-between w-full">
             <div class="flex items-center gap-2">
               <i class="pi pi-list text-purple-500"></i>
               {{ t('common.customFields') || 'Campi personalizzati' }}
             </div>
             <Button icon="pi pi-plus" :label="t('resourceTypes.addField')" severity="success" size="small" @click="openAddFieldDialog" />
          </div>
        </template>
        <template #content>
          <DataTable :value="currentCustomFields" :loading="resourcesStore.loading || customFieldsStore.loading" class="p-datatable-striped">
            <template #empty>
                 <div class="text-center py-6 text-slate-500">
                 <i class="pi pi-inbox text-3xl mb-2" />
                 <p class="text-sm">{{ t('resourceTypes.noFields') }}</p>
               </div>
            </template>
            <Column field="label" :header="t('resourceTypes.fieldLabel')" />
            <Column field="fieldType" :header="t('resourceTypes.fieldType')" />
            <Column field="isRequired" :header="t('resourceTypes.required')" style="width: 100px">
              <template #body="{ data }">
                <Tag :value="data.isRequired ? t('common.yes') : t('common.no')" :severity="data.isRequired ? 'info' : 'warning'" />
              </template>
            </Column>
            <Column field="visibility" :header="t('resourceTypes.visibility')" />
            <Column field="sortOrder" :header="t('resourceTypes.sortOrder')" style="width: 80px" />
            <Column :header="t('common.name')" style="width: 150px">
              <template #body="{ data }">
                <code class="field-name-code">{{ data.name }}</code>
              </template>
            </Column>
            <Column :header="t('common.actions')" style="width: 110px">
              <template #body="{ data }">
                <div class="flex gap-2">
                  <Button icon="pi pi-pencil" severity="warning" rounded size="small" @click="editField(data)" />
                  <Button icon="pi pi-trash" severity="danger" rounded size="small" @click="deleteField(data.id)" />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

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
                <Select v-model="fieldLinkData.visibility" :options="visibilityOptions" option-label="label" option-value="value" class="w-full" />
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
                <span v-if="selectedCatalogField.options?.length" class="meta-chip">{{ selectedCatalogField.options.length }} opzioni</span>
              </div>
            </div>
          </div>

          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">{{ t('resourceTypes.required') }}</div>
                <div class="dlg-status-desc">{{ t('resources.fieldRequiredHelp') }}</div>
              </div>
              <Checkbox v-model="fieldLinkData.isRequired" input-id="resourceFieldRequired" binary />
            </div>
          </div>
        </div>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="closeFieldDialog">
            <i class="pi pi-times" /> {{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="resourcesStore.loading || !fieldLinkData.customFieldId" @click="saveField">
            <i class="pi pi-check" /> {{ t('common.save') }}
          </button>
        </template>
      </AppDialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { usePlantsStore } from '@/stores/plants.store'
import { useResourcesStore } from '@/stores/resources.store'
import { useCustomFieldsStore } from '@/stores/custom-fields.store'
import { customFieldsApi } from '@/api/custom-fields.api'
import MainLayout from '@/layouts/MainLayout.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import type { UpdateResourceDto } from '@/types/resource'
import { FieldVisibility, ResourceStatus } from '@/types/enums'
import type { CustomFieldDef, FieldLinkResponse } from '@/types/custom-field'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Select from 'primevue/select'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const plantsStore = usePlantsStore()
const resourcesStore = useResourcesStore()
const customFieldsStore = useCustomFieldsStore()

const formData = ref<UpdateResourceDto>({
  plantId: '',
  resourceTypeId: '',
  name: '',
  description: '',
  capacity: undefined,
  status: ResourceStatus.Available,
  requiresApproval: false,
  approvalCondition: '',
  approvalTimeoutHours: undefined,
  maintenanceStartDate: undefined,
  maintenanceEndDate: undefined,
  publicPageEnabled: false,
  publicPagePin: '',
  clearPublicPagePin: false,
})

const defaultFieldLinkData = () => ({
  customFieldId: '',
  isRequired: false,
  sortOrder: 0,
  visibility: FieldVisibility.Internal,
})

const visibilityOptions = computed(() => [
  { label: t('visitorTypes.visibilityInternal'), value: FieldVisibility.Internal },
  { label: t('visitorTypes.visibilityPublic'),   value: FieldVisibility.Public },
])

const currentCustomFields = ref<FieldLinkResponse[]>([])
const fieldLinkData = ref(defaultFieldLinkData())
const showFieldDialog = ref(false)
const isEditingField = ref(false)
const editingFieldId = ref<string | null>(null)

const resource = computed(() => {
  const id = route.params.id as string
  return resourcesStore.resourceById(id)
})

const availableCatalogFields = computed(() => {
  return customFieldsStore.fields.filter((field) => {
    if (isEditingField.value && field.id === fieldLinkData.value.customFieldId) {
      return true
    }

    return !currentCustomFields.value.some((link) => link.customFieldId === field.id)
  })
})

const selectedCatalogField = computed<CustomFieldDef | undefined>(() =>
  customFieldsStore.fields.find((field) => field.id === fieldLinkData.value.customFieldId)
)

const publicPreviewUrl = computed(() => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  return `${origin}/public/resources/${route.params.id as string}`
})

const hasPendingPublicPageChange = computed(() =>
  Boolean(resource.value) && formData.value.publicPageEnabled !== resource.value!.publicPageEnabled
)

const maintenanceStartDateCalendar = computed({
  get: () => {
    if (!formData.value.maintenanceStartDate) return null
    return new Date(formData.value.maintenanceStartDate)
  },
  set: (value: Date | null) => {
    formData.value.maintenanceStartDate = value ? value.toISOString().split('T')[0] : undefined
  },
})

const maintenanceEndDateCalendar = computed({
  get: () => {
    if (!formData.value.maintenanceEndDate) return null
    return new Date(formData.value.maintenanceEndDate)
  },
  set: (value: Date | null) => {
    formData.value.maintenanceEndDate = value ? value.toISOString().split('T')[0] : undefined
  },
})

const goBack = () => {
  router.push('/resources')
}

const openPublicPreview = () => {
  if (!resource.value?.publicPageEnabled) return
  window.open(publicPreviewUrl.value, '_blank', 'noopener,noreferrer')
}

const copyPublicLink = async () => {
  try {
    await navigator.clipboard.writeText(publicPreviewUrl.value)
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('resources.publicPage.copySuccess'),
      life: 2500,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('resources.publicPage.copyError'),
      life: 3000,
    })
  }
}

const loadResourceLinks = async () => {
  currentCustomFields.value = await customFieldsApi.getResourceLinks(route.params.id as string)
}

const saveResource = async () => {
  try {
    const id = route.params.id as string
    const dto: UpdateResourceDto = {
      ...formData.value,
      publicPagePin: normalizePublicPagePin(formData.value.publicPagePin),
      clearPublicPagePin: formData.value.clearPublicPagePin || undefined,
    }
    await resourcesStore.updateResource(id, dto)
    goBack()
  } catch (error) {
    console.error('Error saving resource:', error)
  }
}

const normalizePublicPagePin = (pin?: string) => {
  const normalized = pin?.trim() || ''
  return normalized.length ? normalized : undefined
}

const openAddFieldDialog = () => {
  isEditingField.value = false
  editingFieldId.value = null
  fieldLinkData.value = defaultFieldLinkData()
  showFieldDialog.value = true
}

const editField = (field: FieldLinkResponse) => {
  isEditingField.value = true
  editingFieldId.value = field.id
  fieldLinkData.value = {
    customFieldId: field.customFieldId,
    isRequired: field.isRequired,
    sortOrder: field.sortOrder,
    visibility: field.visibility as FieldVisibility,
  }
  showFieldDialog.value = true
}

const saveField = async () => {
  try {
    const id = route.params.id as string
    if (isEditingField.value && editingFieldId.value) {
      await customFieldsApi.updateResourceLink(editingFieldId.value, {
        isRequired: fieldLinkData.value.isRequired,
        sortOrder: fieldLinkData.value.sortOrder,
        visibility: fieldLinkData.value.visibility,
      })
    } else {
      await customFieldsApi.addResourceLink({
        entityId: id,
        customFieldId: fieldLinkData.value.customFieldId,
        isRequired: fieldLinkData.value.isRequired,
        sortOrder: fieldLinkData.value.sortOrder,
        visibility: fieldLinkData.value.visibility,
      })
    }

    await loadResourceLinks()
    closeFieldDialog()
  } catch (error) {
    console.error('Error saving field link:', error)
  }
}

const deleteField = async (fieldId: string) => {
  if (confirm(t('common.confirm'))) {
    try {
      await customFieldsApi.removeResourceLink(fieldId)
      await loadResourceLinks()
    } catch (error) {
      console.error('Error deleting field link:', error)
    }
  }
}

const closeFieldDialog = () => {
  showFieldDialog.value = false
  isEditingField.value = false
  editingFieldId.value = null
  fieldLinkData.value = defaultFieldLinkData()
}

onMounted(async () => {
  try {
    const id = route.params.id as string
    const loadedResource = await resourcesStore.fetchResourceById(id)
    await Promise.all([
      plantsStore.fetchAll(),
      resourcesStore.fetchAllResourceTypes(),
    ])

    if (!customFieldsStore.fields.length) {
      await customFieldsStore.fetchAll()
    }
    await loadResourceLinks()

    formData.value = {
      plantId: loadedResource.plantId,
      resourceTypeId: loadedResource.resourceTypeId,
      name: loadedResource.name,
      description: loadedResource.description,
      capacity: loadedResource.capacity,
      status: loadedResource.status,
      requiresApproval: loadedResource.requiresApproval,
      approvalCondition: loadedResource.approvalCondition,
      approvalTimeoutHours: loadedResource.approvalTimeoutHours,
      maintenanceStartDate: loadedResource.maintenanceStartDate,
      maintenanceEndDate: loadedResource.maintenanceEndDate,
      publicPageEnabled: loadedResource.publicPageEnabled,
      publicPagePin: '',
      clearPublicPagePin: false,
    }
  } catch (error) {
    console.error('Error loading resource:', error)
  }
})
</script>

<style scoped src="./ResourceDetailView.css"></style>

