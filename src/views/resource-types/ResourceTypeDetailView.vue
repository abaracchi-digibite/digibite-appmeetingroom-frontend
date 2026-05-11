<template>
  <MainLayout>
    <div class="detail-container">
      <div class="flex items-center justify-between mb-6">
          <div>
          <!-- <h1 class="text-3xl font-bold text-slate-900 mb-1">{{ resourceType?.name || t('resourceTypes.title') }}</h1> -->
          <p class="text-sm text-slate-500">{{ t('resourceTypes.title') }}</p>
        </div>
        <Button :label="t('common.back')" icon="pi pi-arrow-left" @click="goBack" severity="secondary" />
      </div>

      <Card class="shadow-lg mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-info-circle text-blue-500"></i>
            {{ t('resourceTypes.title') }} - {{ t('common.edit') }}
          </div>
        </template>
        <template #content>
          <form @submit.prevent="saveResourceType" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resourceTypes.name') }} *</label>
                <InputText v-model="formData.name" :placeholder="t('resourceTypes.name')" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resourceTypes.icon') }}</label>
                <InputText v-model="formData.icon" :placeholder="t('resourceTypes.iconPlaceholder')" class="w-full" />
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resourceTypes.description') }}</label>
                <Textarea v-model="formData.description" :placeholder="t('resourceTypes.descriptionPlaceholder')" class="w-full" rows="3" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resourceTypes.color') }}</label>
                <div class="flex gap-2">
                  <InputText v-model="formData.color" :placeholder="t('resourceTypes.colorPlaceholder')" class="flex-1" />
                  <div v-if="formData.color" :style="{ backgroundColor: formData.color }" class="w-10 h-10 rounded border border-slate-300" />
                </div>
                <p class="mt-1 text-xs text-slate-500">{{ t('resourceTypes.colorHelp') }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resourceTypes.timeSlots') }}</label>
                <InputText v-model="formData.defaultTimeSlots" :placeholder="t('resourceTypes.timeSlotsPlaceholder')" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('resourceTypes.multiBooking') }}</label>
                <div class="flex items-center gap-2">
                  <Checkbox v-model="formData.allowMultiBooking" input-id="allowMultiBooking" binary />
                  <label for="allowMultiBooking" class="text-sm">{{ t('resourceTypes.enabled') }}</label>
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

      <Card class="shadow-lg" v-if="resourceType">
        <template #title>
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-2">
              <i class="pi pi-list text-purple-500"></i>
              {{ t('resourceTypes.customFields') }}
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
                  <Button icon="pi pi-pencil" severity="warning" rounded size="small" @click="editCustomField(data)" />
                  <!-- DRF §4.3: i campi di sistema non sono eliminabili.
                       Backend già protegge; qui disabilitiamo il bottone per UX. -->
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    rounded
                    size="small"
                    :disabled="data.isSystem"
                    :title="data.isSystem ? t('resourceTypes.systemFieldNonDeletable') : ''"
                    @click="deleteCustomField(data.id)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <AppDialog
        v-model:visible="showCustomFieldDialog"
        :header="isEditingField ? t('resourceTypes.editFieldLink') : t('resourceTypes.addField')"
        :subtitle="selectedCatalogField?.label || t('resourceTypes.selectFieldFromCatalog')"
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
                <span v-if="selectedCatalogField.options?.length" class="meta-chip">{{ t('customFields.optionsCount', { count: selectedCatalogField.options.length }) }}</span>
              </div>
            </div>
          </div>

          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">{{ t('resourceTypes.required') }}</div>
                <div class="dlg-status-desc">{{ t('resourceTypes.requiredForResourceType') }}</div>
              </div>
              <Checkbox v-model="fieldLinkData.isRequired" input-id="isRequired" binary />
            </div>
          </div>

          <!-- ── Notifiche da campi custom (DRF §9.4) ──────────────────────── -->
          <!-- Mostrato solo quando il tipo del campo è Boolean o Dropdown:    -->
          <!-- per gli altri tipi il trigger non si applica.                    -->
          <div
            v-if="canConfigureFieldNotification"
            class="dlg-section"
          >
            <div class="dlg-section-title">
              <i class="pi pi-bell" /> {{ t('resourceTypes.notificationFieldSection') }}
            </div>
            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('resourceTypes.notificationRecipientLabel') }}</label>
                <InputText
                  v-model="fieldLinkData.notificationRecipient"
                  type="email"
                  :placeholder="t('resourceTypes.notificationRecipientPlaceholder')"
                  class="w-full"
                />
                <small class="dlg-help">
                  {{ t('resourceTypes.notificationRecipientHelp') }}
                </small>
              </div>
              <div
                v-if="selectedCatalogField?.fieldType === 'Dropdown'"
                class="dlg-field dlg-field-full"
              >
                <label class="dlg-label">{{ t('resourceTypes.notificationTriggerLabel') }}</label>
                <Select
                  v-model="fieldLinkData.notificationTriggerValue"
                  :options="dropdownTriggerOptions"
                  option-label="label"
                  option-value="value"
                  show-clear
                  :placeholder="t('resourceTypes.notificationTriggerPlaceholder')"
                  class="w-full"
                />
                <small class="dlg-help">
                  {{ t('resourceTypes.notificationTriggerHelp') }}
                </small>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="closeCustomFieldDialog">
            <i class="pi pi-times" /> {{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="resourcesStore.loading || !fieldLinkData.customFieldId" @click="saveCustomField">
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
import { useResourcesStore } from '@/stores/resources.store'
import { useCustomFieldsStore } from '@/stores/custom-fields.store'
import { customFieldsApi } from '@/api/custom-fields.api'
import MainLayout from '@/layouts/MainLayout.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import { FieldVisibility } from '@/types/enums'
import type { UpdateResourceTypeDto } from '@/types/resource'
import type { CustomFieldDef, FieldLinkResponse } from '@/types/custom-field'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const resourcesStore = useResourcesStore()
const customFieldsStore = useCustomFieldsStore()

const visibilityOptions = computed(() => [
  { label: t('visitorTypes.visibilityInternal'), value: FieldVisibility.Internal },
  { label: t('visitorTypes.visibilityPublic'),   value: FieldVisibility.Public },
])

const formData = ref<UpdateResourceTypeDto>({
  name: '',
  description: '',
  icon: '',
  color: '',
  defaultTimeSlots: '',
  allowMultiBooking: false,
})

const defaultFieldLinkData = () => ({
  customFieldId: '',
  isRequired: false,
  sortOrder: 0,
  visibility: FieldVisibility.Internal,
  notificationRecipient: '' as string,
  notificationTriggerValue: null as string | null,
})

const currentCustomFields = ref<FieldLinkResponse[]>([])
const fieldLinkData = ref(defaultFieldLinkData())
const showCustomFieldDialog = ref(false)
const isEditingField = ref(false)
const editingFieldId = ref<string | null>(null)

const resourceType = computed(() => {
  const id = route.params.id as string
  return resourcesStore.resourceTypeById(id)
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

/**
 * Le notifiche da campi custom (DRF §9.4) si applicano SOLO ai tipi
 * Boolean (trigger su true) e Dropdown (trigger su valore configurato).
 * Per gli altri tipi nascondiamo l'intera sezione del dialog.
 */
const canConfigureFieldNotification = computed(() => {
  const t = selectedCatalogField.value?.fieldType
  return t === 'Boolean' || t === 'Dropdown'
})

/**
 * Opzioni del Dropdown selezionato, formattate per il Select del trigger value.
 * Disponibile solo se il campo è di tipo Dropdown e ha opzioni configurate.
 */
const dropdownTriggerOptions = computed(() => {
  if (selectedCatalogField.value?.fieldType !== 'Dropdown') return []
  return (selectedCatalogField.value.options ?? []).map((opt) => ({
    label: opt.label,
    value: opt.value,
  }))
})

const goBack = () => router.push('/resource-types')

const loadResourceTypeLinks = async () => {
  currentCustomFields.value = await customFieldsApi.getResourceTypeLinks(route.params.id as string)
}

const saveResourceType = async () => {
  try {
    const id = route.params.id as string
    await resourcesStore.updateResourceType(id, formData.value)
  } catch (error) {
    console.error('Error saving resource type:', error)
  }
}

const openAddFieldDialog = () => {
  isEditingField.value = false
  editingFieldId.value = null
  fieldLinkData.value = defaultFieldLinkData()
  showCustomFieldDialog.value = true
}

const editCustomField = (field: FieldLinkResponse) => {
  isEditingField.value = true
  editingFieldId.value = field.id
  fieldLinkData.value = {
    customFieldId: field.customFieldId,
    isRequired: field.isRequired,
    sortOrder: field.sortOrder,
    visibility: field.visibility as FieldVisibility,
    notificationRecipient: field.notificationRecipient ?? '',
    notificationTriggerValue: field.notificationTriggerValue ?? null,
  }
  showCustomFieldDialog.value = true
}

const saveCustomField = async () => {
  try {
    const id = route.params.id as string

    // Pulisce i campi notifica quando non applicabili al tipo selezionato
    // (es. utente cambia tipo dopo aver compilato): evita di persistere
    // dati spuri sul DB.
    const notificationRecipient = canConfigureFieldNotification.value
      ? (fieldLinkData.value.notificationRecipient?.trim() || null)
      : null

    const notificationTriggerValue =
      canConfigureFieldNotification.value
      && selectedCatalogField.value?.fieldType === 'Dropdown'
        ? (fieldLinkData.value.notificationTriggerValue || null)
        : null

    if (isEditingField.value && editingFieldId.value) {
      await customFieldsApi.updateResourceTypeLink(editingFieldId.value, {
        isRequired: fieldLinkData.value.isRequired,
        sortOrder: fieldLinkData.value.sortOrder,
        visibility: fieldLinkData.value.visibility,
        notificationRecipient,
        notificationTriggerValue,
      })
    } else {
      await customFieldsApi.addResourceTypeLink({
        entityId: id,
        customFieldId: fieldLinkData.value.customFieldId,
        isRequired: fieldLinkData.value.isRequired,
        sortOrder: fieldLinkData.value.sortOrder,
        visibility: fieldLinkData.value.visibility,
        notificationRecipient,
        notificationTriggerValue,
      })
    }

    await loadResourceTypeLinks()
    closeCustomFieldDialog()
  } catch (error) {
    console.error('Error saving custom field link:', error)
  }
}

const deleteCustomField = async (fieldId: string) => {
  if (confirm(t('common.confirm'))) {
    try {
      await customFieldsApi.removeResourceTypeLink(fieldId)
      await loadResourceTypeLinks()
    } catch (error) {
      console.error('Error deleting custom field link:', error)
    }
  }
}

const closeCustomFieldDialog = () => {
  showCustomFieldDialog.value = false
  isEditingField.value = false
  editingFieldId.value = null
  fieldLinkData.value = defaultFieldLinkData()
}

onMounted(async () => {
  try {
    const id = route.params.id as string
    const loadedType = await resourcesStore.fetchResourceTypeById(id)
    if (!customFieldsStore.fields.length) {
      await customFieldsStore.fetchAll()
    }
    await loadResourceTypeLinks()

    formData.value = {
      name: loadedType.name,
      description: loadedType.description,
      icon: loadedType.icon,
      color: loadedType.color,
      defaultTimeSlots: loadedType.defaultTimeSlots,
      allowMultiBooking: loadedType.allowMultiBooking,
    }
  } catch (error) {
    console.error('Error loading resource type:', error)
  }
})
</script>

<style scoped src="./ResourceTypeDetailView.css"></style>
