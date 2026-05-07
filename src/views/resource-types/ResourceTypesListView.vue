<template>
  <MainLayout>
    <div class="resource-types-container">
      <!-- Toolbar -->
      <div class="toolbar-section mb-4 p-4 rounded-lg" style="background-color: var(--bg-card);">
        <div class="flex flex-col gap-4">
          <div class="flex gap-3 flex-wrap items-center">
            <IconField class="flex-1 min-w-64">
              <InputIcon class="pi pi-search" />
              <InputText v-model="searchQuery" :placeholder="t('common.search')" class="w-full search-input" />
            </IconField>

            <div class="flex gap-1 p-1 rounded-lg" style="background: var(--bg-page); border: 1px solid var(--border-default);">
              <button
                class="px-2 py-1 rounded-md text-sm transition-all"
                :class="viewMode === 'table' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700'"
                :style="viewMode === 'table' ? 'background: var(--bg-card);' : ''"
                @click="setViewMode('table')"
                :title="t('common.viewTable')"
              ><i class="pi pi-list text-sm" /></button>
              <button
                class="px-2 py-1 rounded-md text-sm transition-all"
                :class="viewMode === 'card' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700'"
                :style="viewMode === 'card' ? 'background: var(--bg-card);' : ''"
                @click="setViewMode('card')"
                :title="t('common.viewCards')"
              ><i class="pi pi-th-large text-sm" /></button>
            </div>

            <Button :label="t('resourceTypes.createNew')" icon="pi pi-plus" @click="showCreateDialog = true" severity="success" size="small" />
          </div>

          <div class="flex gap-3 flex-wrap items-center justify-end">
            <div class="text-sm text-slate-600">{{ filteredResourceTypes.length }} {{ t('common.results') }}</div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="resourcesStore.loading" class="flex justify-center items-center h-96">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl mb-4" style="color: #2563EB;"></i>
          <p class="text-slate-600">{{ t('common.loading') }}</p>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredResourceTypes.length === 0" class="flex justify-center items-center h-96 rounded-lg" style="background-color: var(--bg-page);">
        <div class="text-center">
          <i class="pi pi-inbox text-6xl mb-4" style="color: #9CA3AF;"></i>
          <p class="text-slate-600 text-lg">{{ t('common.noResults') }}</p>
        </div>
      </div>

      <div v-else>
        <!-- Card View -->
        <div v-if="viewMode === 'card'" class="cards-grid">
          <div v-for="resourceType in filteredResourceTypes" :key="resourceType.id" class="card" style="background-color: var(--bg-card); border: 1px solid var(--border-default);">
            <div class="card-header" :style="{ borderLeftColor: resourceType.color || '#2563EB' }">
              <div class="flex items-start justify-between">
                <div class="icon-badge mr-2" :style="{ backgroundColor: (resourceType.color || '#2563EB') + '25', color: resourceType.color || '#2563EB' }">
                  <i v-if="resourceType.icon" :class="`pi ${resourceType.icon}`"></i>
                  <i v-else class="pi pi-tag"></i>
                </div>
                <div>
                  <h3 class="card-title">{{ resourceType.name }}</h3>
                  <p class="text-xs text-slate-500 mt-1">ID: {{ resourceType.id?.substring(0, 8) }}</p>
                </div>
              </div>
            </div>
            <div class="card-content">
              <div class="info-row" v-if="resourceType.description">
                <i class="pi pi-align-left info-icon" :style="{ color: resourceType.color || '#2563EB' }"></i>
                <div class="info-text">
                  <p class="text-xs text-slate-500 uppercase tracking-wide">{{ t('common.description') }}</p>
                  <p class="text-sm text-slate-700 line-clamp-2">{{ resourceType.description }}</p>
                </div>
              </div>
              <div class="info-row" v-if="resourceType.color">
                <i class="pi pi-palette info-icon" :style="{ color: resourceType.color }"></i>
                <div class="info-text">
                  <p class="text-xs text-slate-500 uppercase tracking-wide">{{ t('resourceTypes.color') }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <div :style="{ backgroundColor: resourceType.color }" class="w-6 h-6 rounded border border-slate-300"></div>
                    <p class="text-sm font-mono text-slate-600">{{ resourceType.color }}</p>
                  </div>
                </div>
              </div>
              <div class="mt-4 pt-4 border-t" style="border-color: var(--border-default);">
                <div class="flex flex-col gap-2">
                  <span class="status-badge" :style="{ backgroundColor: resourceType.allowMultiBooking ? 'rgba(13,148,136,0.15)' : 'rgba(156,163,175,0.15)', color: resourceType.allowMultiBooking ? '#065F46' : '#6B7280' }">
                    <i :class="resourceType.allowMultiBooking ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                    {{ t('resourceTypes.multiBooking') }}: {{ resourceType.allowMultiBooking ? t('common.yes') : t('common.no') }}
                  </span>
                  <div v-if="resourceType?.customFields && resourceType.customFields.length > 0">
                    <span class="status-badge" style="background-color: rgba(124,58,237,0.15); color: #6d28d9;">
                      <i class="pi pi-list"></i>
                      {{ resourceType.customFields.length }} {{ t('resourceTypes.customFields') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <Button icon="pi pi-pencil" rounded severity="info" text @click="editResourceType(resourceType)" :title="t('common.edit')" class="action-btn" />
              <Button icon="pi pi-trash" rounded severity="danger" text @click="deleteResourceType(resourceType.id)" :title="t('common.delete')" class="action-btn" />
            </div>
          </div>
        </div>

        <!-- Table View -->
        <div v-else>
          <DataTable :value="filteredResourceTypes" responsiveLayout="scroll" stripedRows showGridlines>
            <template #empty>
              <div class="text-center py-8">
                <i class="pi pi-inbox text-4xl mb-3" style="color: #cbd5e1;"></i>
                <p style="color: #64748b;">{{ t('common.noData') }}</p>
              </div>
            </template>
            <Column field="name" :header="t('resourceTypes.name')" sortable style="width: 24%">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <div class="icon-chip" :style="{ backgroundColor: (data.color || '#2563EB') + '25', color: data.color || '#2563EB' }">
                    <i v-if="data.icon" :class="`pi ${data.icon}`"></i>
                    <i v-else class="pi pi-tag"></i>
                  </div>
                  <span style="color: #0f172a; font-weight: 500;">{{ data.name }}</span>
                </div>
              </template>
            </Column>
            <Column field="description" :header="t('common.description')" style="width: 26%">
              <template #body="{ data }"><span style="color: #0f172a;">{{ data.description || '-' }}</span></template>
            </Column>
            <Column field="color" :header="t('resourceTypes.color')" style="width: 14%">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <div class="w-5 h-5 rounded border border-slate-300" :style="{ backgroundColor: data.color || '#2563EB' }"></div>
                  <span style="color: #0f172a;">{{ data.color || '-' }}</span>
                </div>
              </template>
            </Column>
            <Column field="allowMultiBooking" :header="t('resourceTypes.multiBooking')" sortable style="width: 10%">
              <template #body="{ data }">
                <span class="status-badge" :style="{ backgroundColor: data.allowMultiBooking ? 'rgba(13,148,136,0.15)' : 'rgba(156,163,175,0.15)', color: data.allowMultiBooking ? '#065F46' : '#6B7280' }">
                  <i :class="data.allowMultiBooking ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                  {{ data.allowMultiBooking ? t('common.yes') : t('common.no') }}
                </span>
              </template>
            </Column>
            <Column :header="t('common.actions')" style="width: 140px">
              <template #body="{ data }">
                <div class="table-actions">
                  <Button icon="pi pi-pencil" @click="editResourceType(data)" outlined severity="warning" size="small" />
                  <Button icon="pi pi-trash" @click="deleteResourceType(data.id)" outlined severity="danger" size="small" />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- ------ Create / Edit Dialog --------------------------------------------------------------------------------------------------------------------------------- -->
      <AppDialog
        v-model:visible="showCreateDialog"
        :header="isEditing ? t('common.edit') : t('resourceTypes.createNew')"
        :subtitle="formData.name || (t('resourceTypes.description') || 'Gestisci i tipi di risorsa')"
        :icon="isEditing ? 'pi pi-pencil' : 'pi pi-plus-circle'"
        severity="primary"
        size="lg"
      >
        <div class="dlg-form">
          <!-- Informazioni generali -->
          <div class="dlg-section">
            <div class="dlg-section-title">
              <i class="pi pi-info-circle" /> Informazioni generali
            </div>
            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('resourceTypes.name') }} <span class="req">*</span></label>
                <InputText v-model="formData.name" :placeholder="t('resourceTypes.name')" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('resourceTypes.icon') }}</label>
                <Select v-model="formData.icon" :options="ICON_OPTIONS" optionLabel="label" optionValue="value" class="w-full">
                  <template #value="slotProps">
                    <div class="icon-select-item" v-if="slotProps.value">
                      <i :class="slotProps.value"></i>
                      <span>{{ ICON_OPTIONS.find(opt => opt.value === slotProps.value)?.label }}</span>
                    </div>
                  </template>
                  <template #option="slotProps">
                    <div class="icon-select-item"><i :class="slotProps.option.value"></i><span>{{ slotProps.option.label }}</span></div>
                  </template>
                </Select>
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('resourceTypes.color') }}</label>
                <div class="color-picker-wrap">
                  <input type="color" v-model="formData.color" class="color-picker" />
                  <span class="color-code">{{ formData.color }}</span>
                </div>
                  <small class="dlg-help">{{ t('resourceTypes_colorHelp') }}</small>
              </div>
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('resourceTypes.timeSlots') }}</label>
                  <button type="button" class="slot-trigger-btn" @click="showSlotEditor = !showSlotEditor">
                    <i class="pi pi-plus" /> {{ t('resourceTypes_addTimeSlot') }}
                  </button>
                <div v-if="showSlotEditor" class="slot-editor">
                  <div class="slot-inputs">
                    <input v-model="newSlotStart" type="time" class="slot-time-input" />
                    <span class="slot-separator">-</span>
                    <input v-model="newSlotEnd" type="time" class="slot-time-input" />
                    <button type="button" class="slot-add-btn" @click="addTimeSlot"><i class="pi pi-check" /> Conferma</button>
                  </div>
                </div>
                <div v-if="parsedTimeSlots.length > 0" class="slot-list">
                  <div v-for="(slot, index) in parsedTimeSlots" :key="`${slot}-${index}`" class="slot-row">
                    <div class="slot-row-left">
                      <div class="slot-row-icon"><i class="pi pi-clock" /></div>
                      <div class="slot-row-content">
                        <div class="slot-row-title">Fascia oraria {{ index + 1 }}</div>
                        <div class="slot-row-time">
                          <span class="slot-time-pill">{{ slot.split('-')[0] }}</span>
                          <i class="pi pi-arrow-right slot-time-arrow" />
                          <span class="slot-time-pill">{{ slot.split('-')[1] }}</span>
                        </div>
                      </div>
                    </div>
                    <button type="button" class="slot-row-remove" @click="removeTimeSlot(index)" title="Rimuovi fascia"><i class="pi pi-trash" /></button>
                  </div>
                </div>
                <small class="dlg-help">{{ t('resourceTypes_timeSlotsHelp') }}</small>
              </div>
            </div>
          </div>

          <!-- Multi-booking -->
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
                <div class="dlg-status-title">{{ t('resourceTypes.multiBooking') }}</div>
                <div class="dlg-status-desc">{{ t('resourceTypes.multiBookingHelp') || 'Consenti prenotazioni multiple contemporanee' }}</div>
              </div>
              <Checkbox v-model="formData.allowMultiBooking" input-id="allowMultiBooking" binary />
            </div>
          </div>

          <!-- Hint box (create mode) -->
          <div v-if="!isEditing" class="dlg-hint-box">
            <i class="pi pi-lightbulb" />
            Salva il tipo di risorsa per poter aggiungere i campi personalizzati.
          </div>

          <!-- Campi personalizzati (edit mode) -->
          <div v-if="isEditing" class="dlg-section">
            <div class="dlg-section-title" style="justify-content: space-between;">
              <span class="flex items-center gap-2">
                <i class="pi pi-list" />
                {{ t('resourceTypes.customFields') || 'Campi personalizzati' }}
              </span>
              <button type="button" class="field-add-btn" @click="openAddFieldDialog">
                <i class="pi pi-plus" /> {{ t('resourceTypes.addField') || 'Aggiungi campo' }}
              </button>
            </div>

            <div v-if="!currentCustomFields.length" class="fields-empty">
              <i class="pi pi-inbox" />
              <span>{{ t('resourceTypes.noFields') || 'Nessun campo personalizzato' }}</span>
            </div>

            <div v-else class="fields-list">
              <div v-for="field in currentCustomFields" :key="field.id" class="field-row">
                <div class="field-row-info">
                  <span class="field-row-label">{{ field.label }}</span>
                  <div class="field-row-meta">
                    <span class="field-chip field-chip-type">{{ field.fieldType }}</span>
                    <span class="field-chip" :class="field.isRequired ? 'field-chip-required' : 'field-chip-optional'">
                      {{ field.isRequired ? t('visitorTypes.required') : t('common.optional') || 'Opzionale' }}
                    </span>
                    <span class="field-chip field-chip-vis">{{ field.visibility }}</span>
                  </div>
                </div>
                <div class="field-row-actions">
                  <button type="button" class="field-action-btn field-action-edit" @click="editField(field)">
                    <i class="pi pi-pencil" />
                  </button>
                  <button type="button" class="field-action-btn field-action-delete" @click="deleteField(field.id)">
                    <i class="pi pi-trash" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="closeDialog">
            <i class="pi pi-times" /> {{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="resourcesStore.loading" @click="saveResourceType">
            <i class="pi pi-check" /> {{ t('common.save') }}
          </button>
        </template>
      </AppDialog>

      <!-- ------ Field Add / Edit Dialog --------------------------------------------------------------------------------------------------------------------- -->
      <AppDialog
        v-model:visible="showFieldDialog"
        :header="isEditingField ? (t('resourceTypes.editField') || 'Modifica associazione campo') : (t('resourceTypes.addField') || 'Aggiungi campo')"
        :subtitle="selectedCatalogField?.label || 'Seleziona un campo dal catalogo'"
        icon="pi pi-list"
        severity="primary"
        size="md"
      >
        <div class="dlg-form">
          <div class="dlg-section">
            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">Campo dal catalogo <span class="req">*</span></label>
                <Select
                  v-model="fieldLinkData.customFieldId"
                  :options="availableCatalogFields"
                  option-label="label"
                  option-value="id"
                  filter
                  :disabled="isEditingField"
                  placeholder="Seleziona un campo personalizzato"
                  class="w-full"
                />
                <small class="dlg-help">Mostra i campi creati nella pagina "Campi personalizzati"</small>
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('resourceTypes.visibility') || 'Visibilità' }}</label>
                <Select v-model="fieldLinkData.visibility" :options="visibilityOptions" option-label="label" option-value="value" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('resourceTypes.sortOrder') || 'Ordinamento' }}</label>
                <InputNumber v-model="fieldLinkData.sortOrder" class="w-full" :min="0" />
              </div>
            </div>
          </div>

          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">{{ t('resourceTypes.required') || 'Obbligatorio' }}</div>
                <div class="dlg-status-desc">{{ t('resourceTypes.requiredHelp') || 'Il campo sarà obbligatorio durante la prenotazione' }}</div>
              </div>
              <Checkbox v-model="fieldLinkData.isRequired" input-id="fieldRequired" binary />
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
import { useResourcesStore } from '@/stores/resources.store'
import MainLayout from '@/layouts/MainLayout.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { FieldVisibility } from '@/types/enums'
import { customFieldsApi } from '@/api/custom-fields.api'
import { useCustomFieldsStore } from '@/stores/custom-fields.store'
import type { CustomFieldDef, FieldLinkResponse } from '@/types/custom-field'
import type { CreateResourceTypeDto, UpdateResourceTypeDto } from '@/types/resource'

const { t } = useI18n()
const resourcesStore = useResourcesStore()
const customFieldsStore = useCustomFieldsStore()

const ICON_OPTIONS = [
  { label: 'Sala riunioni', value: 'pi pi-building' },
  { label: 'Proiettore', value: 'pi pi-video' },
  { label: 'Scrivania', value: 'pi pi-desktop' },
  { label: 'Altro', value: 'pi pi-box' },
]

// ------ View state ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const searchQuery = ref('')
const viewMode = ref<'card' | 'table'>(
  (localStorage.getItem('resource_types_view_mode') as 'card' | 'table') ?? 'card'
)
const showSlotEditor = ref(false)
const newSlotStart = ref('')
const newSlotEnd = ref('')

// ------ Main dialog ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const showCreateDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const formData = ref<CreateResourceTypeDto>({
  name: '',
  icon: ICON_OPTIONS[0].value,
  color: '#2563eb',
  defaultTimeSlots: '',
  allowMultiBooking: false,
})

// ------ Field dialog ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const showFieldDialog = ref(false)
const isEditingField = ref(false)
const editingFieldId = ref<string | null>(null)

const defaultFieldLinkData = () => ({
  customFieldId: '',
  isRequired: false,
  sortOrder: 0,
  visibility: FieldVisibility.Internal as FieldVisibility,
})
const fieldLinkData = ref(defaultFieldLinkData())

const visibilityOptions = computed(() => [
  { label: t('visitorTypes.visibilityInternal') || 'Interno', value: FieldVisibility.Internal },
  { label: t('visitorTypes.visibilityPublic') || 'Pubblico', value: FieldVisibility.Public },
])

// ------ Computed ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const filteredResourceTypes = computed(() => {
  if (!searchQuery.value) return resourcesStore.resourceTypes
  const query = searchQuery.value.toLowerCase()
  return resourcesStore.resourceTypes.filter((rt) => rt.name.toLowerCase().includes(query))
})

const currentCustomFields = ref<FieldLinkResponse[]>([])

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

const parsedTimeSlots = computed(() => {
  if (!formData.value.defaultTimeSlots) return []
  return formData.value.defaultTimeSlots.split(',').map((s: string) => s.trim()).filter(Boolean)
})

// ------ Main dialog methods ---------------------------------------------------------------------------------------------------------------------------------------------------------------------
const loadResourceTypeLinks = async (resourceTypeId: string) => {
  currentCustomFields.value = await customFieldsApi.getResourceTypeLinks(resourceTypeId)
}

const editResourceType = async (resourceType: any) => {
  isEditing.value = true
  editingId.value = resourceType.id
  formData.value = {
    name: resourceType.name,
    icon: resourceType.icon,
    color: resourceType.color,
    defaultTimeSlots: resourceType.defaultTimeSlots,
    allowMultiBooking: resourceType.allowMultiBooking,
  }
  if (!customFieldsStore.fields.length) {
    await customFieldsStore.fetchAll()
  }
  await loadResourceTypeLinks(resourceType.id)
  showCreateDialog.value = true
}

const saveResourceType = async () => {
  try {
    if (isEditing.value && editingId.value) {
      await resourcesStore.updateResourceType(editingId.value, formData.value as UpdateResourceTypeDto)
      closeDialog()
    } else {
      const created = await resourcesStore.createResourceType(formData.value)
      if (created?.id) {
        // Switch to edit mode inline - l'utente pu- subito aggiungere campi
        isEditing.value = true
        editingId.value = created.id
        currentCustomFields.value = []
        if (!customFieldsStore.fields.length) {
          await customFieldsStore.fetchAll()
        }
      } else {
        closeDialog()
      }
    }
  } catch (error) {
    console.error('Error saving resource type:', error)
  }
}

const deleteResourceType = async (id: string) => {
  if (confirm(t('common.confirmDelete'))) {
    try {
      await resourcesStore.removeResourceType(id)
    } catch (error) {
      console.error('Error deleting resource type:', error)
    }
  }
}

const closeDialog = () => {
  showCreateDialog.value = false
  isEditing.value = false
  editingId.value = null
  showSlotEditor.value = false
  currentCustomFields.value = []
  formData.value = {
    name: '',
    icon: ICON_OPTIONS[0].value,
    color: '#2563eb',
    defaultTimeSlots: '',
    allowMultiBooking: false,
  }
}

// ------ Time slots ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const addTimeSlot = () => {
  if (!newSlotStart.value || !newSlotEnd.value) return
  if (newSlotStart.value >= newSlotEnd.value) return
  const newSlot = `${newSlotStart.value}-${newSlotEnd.value}`
  const updated = [...parsedTimeSlots.value]
  if (!updated.includes(newSlot)) updated.push(newSlot)
  formData.value.defaultTimeSlots = updated.join(',')
  newSlotStart.value = ''
  newSlotEnd.value = ''
  showSlotEditor.value = false
}

const removeTimeSlot = (index: number) => {
  const updated = [...parsedTimeSlots.value]
  updated.splice(index, 1)
  formData.value.defaultTimeSlots = updated.join(',')
}

// ------ Field dialog methods ------------------------------------------------------------------------------------------------------------------------------------------------------------------
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
    isRequired: !!field.isRequired,
    visibility: (field.visibility ?? FieldVisibility.Internal) as FieldVisibility,
    sortOrder: field.sortOrder ?? 0,
  }
  showFieldDialog.value = true
}

const saveField = async () => {
  if (!editingId.value) return
  try {
    if (isEditingField.value && editingFieldId.value) {
      await customFieldsApi.updateResourceTypeLink(editingFieldId.value, {
        isRequired: fieldLinkData.value.isRequired,
        sortOrder: fieldLinkData.value.sortOrder,
        visibility: fieldLinkData.value.visibility,
      })
    } else {
      await customFieldsApi.addResourceTypeLink({
        entityId: editingId.value,
        customFieldId: fieldLinkData.value.customFieldId,
        isRequired: fieldLinkData.value.isRequired,
        sortOrder: fieldLinkData.value.sortOrder,
        visibility: fieldLinkData.value.visibility,
      })
    }
    await loadResourceTypeLinks(editingId.value)
    await resourcesStore.fetchAllResourceTypes()
    closeFieldDialog()
  } catch (error) {
    console.error('Error saving field:', error)
  }
}

const deleteField = async (fieldId: string) => {
  if (confirm(t('common.confirm'))) {
    try {
      await customFieldsApi.removeResourceTypeLink(fieldId)
      if (editingId.value) {
        await loadResourceTypeLinks(editingId.value)
      }
      await resourcesStore.fetchAllResourceTypes()
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

const setViewMode = (mode: 'card' | 'table') => {
  viewMode.value = mode
  localStorage.setItem('resource_types_view_mode', mode)
}

onMounted(async () => {
  try {
    await customFieldsStore.fetchAll()
    await resourcesStore.fetchAllResourceTypes()
  } catch (error) {
    console.error('Error fetching resource types:', error)
  }
})
</script>

<style scoped src="./ResourceTypesListView.css"></style>
