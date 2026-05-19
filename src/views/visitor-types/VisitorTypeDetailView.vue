<template>
  <MainLayout>
    <div class="detail-container">
      <div class="flex items-center justify-between mb-6">
        <div>
          <!-- <h1 class="text-3xl font-bold text-slate-900 mb-1">{{ visitorType?.name || t('visitorTypes.title') }}</h1> -->
          <p class="text-sm text-slate-500">{{ t('visitorTypes.title') }}</p>
        </div>
        <Button :label="t('common.back')" icon="pi pi-arrow-left" @click="goBack" severity="secondary" />
      </div>

      <Card class="shadow-lg mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-id-card text-blue-500"></i>
            {{ t('visitorTypes.title') }} - {{ t('common.edit') }}
          </div>
        </template>
        <template #content>
          <form @submit.prevent="saveVisitorType" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('visitorTypes.name') }} *</label>
              <InputText v-model="formData.name" :placeholder="t('visitorTypes.name')" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">{{ t('visitorTypes.description') }}</label>
              <Textarea v-model="formData.description" :placeholder="t('visitorTypes.description')" class="w-full" rows="3" />
            </div>
            <div class="flex items-center gap-2">
              <PrimeToggleSwitch v-model="formData.isActive" input-id="isActive" />
              <label for="isActive" class="text-sm">{{ t('common.active') }}</label>
            </div>
            <div class="flex gap-3 pt-4">
              <Button type="submit" :label="t('common.save')" icon="pi pi-check" severity="success" :loading="visitorTypesStore.loading" />
              <Button type="button" :label="t('common.cancel')" icon="pi pi-times" severity="secondary" @click="goBack" />
            </div>
          </form>
        </template>
      </Card>

      <Card class="shadow-lg" v-if="visitorType">
        <template #title>
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-2">
              <i class="pi pi-list text-purple-500"></i>
              {{ t('visitorTypes.customFields') }}
            </div>
            <Button icon="pi pi-plus" :label="t('visitorTypes.addField')" severity="success" size="small" @click="openAddFieldDialog" />
          </div>
        </template>
        <template #content>
          <DataTable :value="currentCustomFields" :loading="visitorTypesStore.loading || customFieldsStore.loading" class="p-datatable-striped">
            <template #empty>
              <div class="text-center py-6 text-slate-500">
                <i class="pi pi-inbox text-3xl mb-2" />
                <p class="text-sm">{{ t('visitorTypes.noFields') }}</p>
              </div>
            </template>
            <Column field="label" :header="t('visitorTypes.fieldLabel')" />
            <Column field="fieldType" :header="t('visitorTypes.fieldType')">
              <template #body="{ data }">
                {{ t('customFields.types.' + data.fieldType.toLowerCase(), data.fieldType) }}
              </template>
            </Column>
            <Column field="isRequired" :header="t('visitorTypes.required')" style="width: 100px">
              <template #body="{ data }">
                <Tag :value="data.isRequired ? t('common.yes') : t('common.no')" :severity="data.isRequired ? 'info' : 'warning'" />
              </template>
            </Column>
            <Column field="visibility" :header="t('visitorTypes.visibility')">
              <template #body="{ data }">
                {{ t('visitorTypes.visibility' + data.visibility.charAt(0).toUpperCase() + data.visibility.slice(1), data.visibility) }}
              </template>
            </Column>
            <Column :header="t('common.name')" style="width: 150px">
              <template #body="{ data }">
                <code class="field-name-code">{{ data.name }}</code>
              </template>
            </Column>
            <Column :header="t('common.actions')" style="width: 110px">
              <template #body="{ data }">
                <div class="flex gap-2">
                  <!-- DRF §4.3: i "Campi di sistema" non possono essere
                       eliminati (Nome visitatore, Email, Numero persone,
                       Data della visita, Capogruppo). Lato backend la
                       protezione è in VisitorTypeDao (AND isSystem = 0).
                       Qui disabilitiamo il pulsante per evitare l'errore. -->
                  <Button
                    icon="pi pi-pencil"
                    severity="warning"
                    rounded
                    size="small"
                    @click="editField(data)"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    rounded
                    size="small"
                    :disabled="data.isSystem"
                    :title="data.isSystem ? t('resourceTypes.systemFieldNonDeletable') : ''"
                    @click="deleteField(data.id)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <AppDialog
        v-model:visible="showFieldDialog"
        :header="isEditingField ? t('visitorTypes.editFieldAssociation') : t('visitorTypes.addField')"
        :subtitle="selectedCatalogField?.label || t('visitorTypes.selectFieldFromCatalog')"
        icon="pi pi-list"
        severity="primary"
        size="md"
      >
        <div class="dlg-form">
          <div class="dlg-section">
            <!-- ── Empty state quando il CATALOGO dei campi personalizzati è vuoto.
                 Il dropdown sotto attinge i campi dal catalogo (CustomFieldDef);
                 se non ne sono ancora stati creati, l'utente vede il dropdown
                 vuoto e pensa che la funzione non esista. Qui mostriamo una CTA
                 esplicita verso /custom-fields. -->
            <div v-if="customFieldsStore.fields.length === 0" class="catalog-empty-cta">
              <i class="pi pi-info-circle" />
              <div class="catalog-empty-cta-body">
                <strong>{{ t('visitorTypes.catalogEmptyTitle') }}</strong>
                <p>
                  {{ t('visitorTypes.catalogEmptyBody') }}
                </p>
                <router-link :to="{ name: 'CustomFields' }" class="btn-link">
                  <i class="pi pi-external-link" /> {{ t('visitorTypes.gotoCustomFields') }}
                </router-link>
              </div>
            </div>

            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('visitorTypes.catalogFieldLabel') }} <span class="req">*</span></label>
                <Select
                  v-model="fieldLinkData.customFieldId"
                  :options="availableCatalogFields"
                  option-label="label"
                  option-value="id"
                  filter
                  :disabled="isEditingField || customFieldsStore.fields.length === 0"
                  :placeholder="t('visitorTypes.selectCustomFieldPlaceholder')"
                  class="w-full"
                />
                <small class="dlg-help">{{ t('visitorTypes.catalogHelp') }}</small>
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('visitorTypes.sortOrder') }}</label>
                <InputNumber v-model="fieldLinkData.sortOrder" class="w-full" :min="0" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('visitorTypes.visibility') }}</label>
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
                <span v-if="selectedCatalogField.options?.length" class="meta-chip">{{ selectedCatalogField.options.length }} {{ t('visitorTypes.options') }}</span>
              </div>
            </div>
          </div>

          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">{{ t('visitorTypes.required') }}</div>
                <div class="dlg-status-desc">{{ t('visitorTypes.requiredForType') }}</div>
              </div>
              <Checkbox v-model="fieldLinkData.isRequired" input-id="isRequired" binary />
            </div>
          </div>
        </div>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="closeFieldDialog">
            <i class="pi pi-times" /> {{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="visitorTypesStore.loading || !fieldLinkData.customFieldId" @click="saveField">
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
import { useVisitorTypesStore } from '@/stores/visitor-types.store'
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
import PrimeToggleSwitch from 'primevue/toggleswitch'
import { FieldVisibility } from '@/types/enums'
import type { UpdateVisitorTypeDto } from '@/types/visitor-type'
import type { CustomFieldDef, FieldLinkResponse } from '@/types/custom-field'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const visitorTypesStore = useVisitorTypesStore()
const customFieldsStore = useCustomFieldsStore()

const visibilityOptions = computed(() => [
  { label: t('visitorTypes.visibilityInternal'), value: FieldVisibility.Internal },
  { label: t('visitorTypes.visibilityPublic'), value: FieldVisibility.Public },
])

const defaultFieldLinkData = () => ({
  customFieldId: '',
  isRequired: false,
  sortOrder: 0,
  visibility: FieldVisibility.Internal,
})

const formData = ref<UpdateVisitorTypeDto>({ name: '', description: '', isActive: true })
const currentCustomFields = ref<FieldLinkResponse[]>([])
const fieldLinkData = ref(defaultFieldLinkData())
const showFieldDialog = ref(false)
const isEditingField = ref(false)
const editingFieldId = ref<string | null>(null)

const visitorType = computed(() => visitorTypesStore.visitorTypeById(route.params.id as string))

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

const goBack = () => router.push('/visitor-types')

const loadVisitorTypeLinks = async () => {
  currentCustomFields.value = await customFieldsApi.getVisitorTypeLinks(route.params.id as string)
}

const saveVisitorType = async () => {
  try {
    await visitorTypesStore.updateVisitorType(route.params.id as string, formData.value)
  } catch (error) {
    console.error('Error saving:', error)
  }
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
      await customFieldsApi.updateVisitorTypeLink(editingFieldId.value, {
        isRequired: fieldLinkData.value.isRequired,
        sortOrder: fieldLinkData.value.sortOrder,
        visibility: fieldLinkData.value.visibility,
      })
    } else {
      await customFieldsApi.addVisitorTypeLink({
        entityId: id,
        customFieldId: fieldLinkData.value.customFieldId,
        isRequired: fieldLinkData.value.isRequired,
        sortOrder: fieldLinkData.value.sortOrder,
        visibility: fieldLinkData.value.visibility,
      })
    }

    await loadVisitorTypeLinks()
    closeFieldDialog()
  } catch (error) {
    console.error('Error saving field:', error)
  }
}

const deleteField = async (fieldId: string) => {
  if (confirm(t('common.confirm'))) {
    try {
      await customFieldsApi.removeVisitorTypeLink(fieldId)
      await loadVisitorTypeLinks()
    } catch (error) {
      console.error('Error deleting field:', error)
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
    const vt = await visitorTypesStore.fetchVisitorTypeById(id)
    if (!customFieldsStore.fields.length) {
      await customFieldsStore.fetchAll()
    }
    await loadVisitorTypeLinks()
    formData.value = { name: vt.name, description: vt.description, isActive: vt.isActive }
  } catch (error) {
    console.error('Error loading:', error)
  }
})
</script>

<style scoped src="./VisitorTypeDetailView.css"></style>

