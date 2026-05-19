<template>
  <MainLayout>
    <div class="list-page">

      <!-- ── Toolbar ──────────────────────────────────────────────── -->
      <div class="list-toolbar-flat">
        <div class="list-row-primary">
          <div class="list-search-flat">
            <i class="pi pi-search list-search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="list-search-input-flat"
              :placeholder="t('common.search')"
            />
          </div>
          <button type="button" class="list-btn-primary" @click="showCreateDialog = true">
            <i class="pi pi-plus" />
            <span>{{ t('resourceTypes.createNew') }}</span>
          </button>
        </div>

        <div class="list-row-secondary">
          <div class="list-row-secondary-right">
            <span class="list-count-flat">{{ filteredResourceTypes.length }} {{ t('common.results') }}</span>
            <div class="list-view-flat">
              <button type="button" class="list-view-icon" :class="{ active: viewMode === 'table' }" :title="t('common.viewTable')" @click="setViewMode('table')">
                <i class="pi pi-list" />
              </button>
              <button type="button" class="list-view-icon" :class="{ active: viewMode === 'card' }" :title="t('common.viewCards')" @click="setViewMode('card')">
                <i class="pi pi-th-large" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Loading / Empty ──────────────────────────────────────── -->
      <div v-if="resourcesStore.loading" class="list-loading">
        <i class="pi pi-spin pi-spinner" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="filteredResourceTypes.length === 0" class="list-empty">
        <i class="pi pi-inbox" />
        <p>{{ t('common.noResults') }}</p>
      </div>

      <!-- ── Tabella ──────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
        <DataTable :value="filteredResourceTypes" responsiveLayout="scroll" stripedRows class="list-table">
          <Column field="name" :header="t('resourceTypes.name')" :sortable="true" style="width: 30%">
            <template #body="{ data }">
              <span class="list-cell-strong">
                <i :class="`pi ${data.icon || 'pi-tag'}`" :style="{ color: data.color || '#2563EB', marginRight: '0.5rem' }" />
                {{ data.name }}
              </span>
            </template>
          </Column>
          <Column field="color" :header="t('resourceTypes.color')" style="width: 18%">
            <template #body="{ data }">
              <span class="list-cell-muted" style="display:inline-flex;align-items:center;gap:0.5rem;">
                <span :style="{ backgroundColor: data.color || '#2563EB', width: '14px', height: '14px', borderRadius: '4px', display: 'inline-block', border: '1px solid var(--border-default)' }"></span>
                {{ data.color || '—' }}
              </span>
            </template>
          </Column>
          <Column field="isActive" :header="t('common.status')" :sortable="true" style="width: 14%">
            <template #body="{ data }">
              <Tag
                :value="data.isActive !== false ? t('common.active') : t('common.inactive')"
                :severity="data.isActive !== false ? 'success' : 'danger'"
              />
            </template>
          </Column>
          <Column
            class="list-col-actions"
            headerStyle="width: 110px; padding-right: 1rem"
            bodyStyle="width: 110px; padding-right: 1rem"
          >
            <template #header>
              <span style="display:block; width:100%; text-align:right">{{ t('common.actions') }}</span>
            </template>
            <template #body="{ data }">
              <div class="list-row-actions" style="display:flex; justify-content:flex-end">
                <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="editResourceType(data)">
                  <i class="pi pi-pencil" />
                </button>
                <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteResourceType(data.id)">
                  <i class="pi pi-trash" />
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ── Cards ────────────────────────────────────────────────── -->
      <div v-else class="list-cards-grid">
        <article v-for="resourceType in filteredResourceTypes" :key="resourceType.id" class="list-card">
          <div class="list-card-head">
            <h3 class="list-card-title">
              <i :class="`pi ${resourceType.icon || 'pi-tag'}`" :style="{ color: resourceType.color || '#2563EB', marginRight: '0.4rem' }" />
              {{ resourceType.name }}
            </h3>
            <Tag
              :value="resourceType.isActive !== false ? t('common.active') : t('common.inactive')"
              :severity="resourceType.isActive !== false ? 'success' : 'danger'"
            />
          </div>
          <div class="list-card-info">
            <div v-if="resourceType.color" class="list-card-info-row">
              <i class="pi pi-palette" />
              <span style="display:inline-flex;align-items:center;gap:0.4rem;">
                <span :style="{ backgroundColor: resourceType.color, width: '14px', height: '14px', borderRadius: '4px', display: 'inline-block', border: '1px solid var(--border-default)' }"></span>
                {{ resourceType.color }}
              </span>
            </div>
            <div class="list-card-info-row">
              <i class="pi pi-check-square" />
              <span>{{ t('resourceTypes.multiBooking') }}: {{ resourceType.allowMultiBooking ? t('common.yes') : t('common.no') }}</span>
            </div>
            <div v-if="resourceType?.customFields?.length" class="list-card-info-row">
              <i class="pi pi-list" />
              <span>{{ resourceType.customFields.length }} {{ t('resourceTypes.customFields') }}</span>
            </div>
          </div>
          <div class="list-card-actions">
            <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="editResourceType(resourceType)">
              <i class="pi pi-pencil" />
            </button>
            <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteResourceType(resourceType.id)">
              <i class="pi pi-trash" />
            </button>
          </div>
        </article>
      </div>

      <!-- ------ Create / Edit Dialog --------------------------------------------------------------------------------------------------------------------------------- -->
      <AppDialog
        v-model:visible="showCreateDialog"
        :header="isEditing ? t('common.edit') : t('resourceTypes.createNew')"
        :subtitle="formData.name || t('resourceTypes.description')"
        :icon="isEditing ? 'pi pi-pencil' : 'pi pi-plus-circle'"
        severity="primary"
        size="lg"
      >
        <div class="dlg-form">
          <!-- Informazioni generali -->
          <div class="dlg-section">
            <div class="dlg-section-title">
              <i class="pi pi-info-circle" /> {{ t('resourceTypes.generalSection') }}
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
            </div>
          </div>

          <!-- Orari di disponibilità (stesso pattern/testo della pagina Risorse) -->
          <div class="dlg-section">
            <div class="dlg-section-title">
              <i class="pi pi-clock" />{{ t('resources.availability.title') }}
            </div>

            <button type="button" class="slot-trigger-btn" @click="showSlotEditor = !showSlotEditor">
              <i class="pi pi-plus" /> {{ t('resources.availability.addWindow') }}
            </button>

            <div v-if="showSlotEditor" class="slot-editor">
              <div class="slot-inputs">
                <input v-model="newSlotStart" type="time" step="900" class="slot-time-input" />
                <span class="slot-separator">-</span>
                <input v-model="newSlotEnd" type="time" step="900" class="slot-time-input" />
                <button type="button" class="slot-add-btn" @click="addTimeSlot">
                  <i class="pi pi-check" /> {{ t('resourceTypes.confirmSlot') }}
                </button>
              </div>
            </div>

            <div v-if="parsedTimeSlots.length > 0" class="slot-list">
              <div v-for="(slot, index) in parsedTimeSlots" :key="`${slot}-${index}`" class="slot-row">
                <div class="slot-row-left">
                  <div class="slot-row-icon"><i class="pi pi-clock" /></div>
                  <div class="slot-row-content">
                    <div class="slot-row-title">
                      {{ t('resources.availability.windowIndex', { n: index + 1 }) }}
                    </div>
                    <div class="slot-row-time">
                      <span class="slot-time-pill">{{ slot.split('-')[0] }}</span>
                      <i class="pi pi-arrow-right slot-time-arrow" />
                      <span class="slot-time-pill">{{ slot.split('-')[1] }}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  class="slot-row-remove"
                  :title="t('common.delete')"
                  @click="removeTimeSlot(index)"
                >
                  <i class="pi pi-trash" />
                </button>
              </div>
            </div>
            <p v-else class="slot-empty">
              <i class="pi pi-info-circle" />
              {{ t('resources.availability.empty') }}
            </p>

            <small class="dlg-help">
              {{ t('resources.availability.help') }}
            </small>
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
                <span v-if="selectedCatalogField.options?.length" class="meta-chip">{{ selectedCatalogField.options.length }} {{ t('resourceTypes.options') }}</span>
              </div>
            </div>
          </div>

          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">{{ t('resourceTypes.multiBooking') }}</div>
                <div class="dlg-status-desc">{{ t('resourceTypes.multiBookingHelp') }}</div>
              </div>
              <PrimeToggleSwitch v-model="formData.allowMultiBooking" input-id="allowMultiBooking" />
            </div>
          </div>

          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">{{ t('common.active') }}</div>
                <div class="dlg-status-desc">{{ t('resourceTypes.isActiveHelp') }}</div>
              </div>
              <PrimeToggleSwitch v-model="formData.isActive" input-id="resourceTypeIsActive" />
            </div>
          </div>

          <!-- Hint box (create mode) -->
          <div v-if="!isEditing" class="dlg-hint-box">
            <i class="pi pi-lightbulb" />
            {{ t('resourceTypes.customFieldsHint') }}
          </div>

          <!-- Campi personalizzati (edit mode) -->
          <div v-if="isEditing" class="dlg-section">
            <div class="dlg-section-title" style="justify-content: space-between;">
              <span class="flex items-center gap-2">
                <i class="pi pi-list" />
                {{ t('resourceTypes.customFields') }}
              </span>
              <button type="button" class="field-add-btn" @click="openAddFieldDialog">
                <i class="pi pi-plus" /> {{ t('resourceTypes.addField') }}
              </button>
            </div>

            <div v-if="!currentCustomFields.length" class="fields-empty">
              <i class="pi pi-inbox" />
              <span>{{ t('resourceTypes.noFields') }}</span>
            </div>

            <div v-else class="fields-list">
              <div v-for="field in currentCustomFields" :key="field.id" class="field-row">
                <div class="field-row-info">
                  <span class="field-row-label">{{ field.label }}</span>
                  <div class="field-row-meta">
                    <span class="field-chip field-chip-type">{{ t('customFields.types.' + field.fieldType.toLowerCase(), field.fieldType) }}</span>
                    <span class="field-chip" :class="field.isRequired ? 'field-chip-required' : 'field-chip-optional'">
                      {{ field.isRequired ? t('visitorTypes.required') : t('common.optional') }}
                    </span>
                    <span class="field-chip field-chip-vis">{{ t('visitorTypes.visibility' + field.visibility.charAt(0).toUpperCase() + field.visibility.slice(1), field.visibility) }}</span>
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
        :header="isEditingField ? t('resourceTypes.editField') : t('resourceTypes.addField')"
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
                <label class="dlg-label">{{ t('resourceTypes.visibility') }}</label>
                <Select v-model="fieldLinkData.visibility" :options="visibilityOptions" option-label="label" option-value="value" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('resourceTypes.sortOrder') }}</label>
                <InputNumber v-model="fieldLinkData.sortOrder" class="w-full" :min="0" />
              </div>
            </div>
          </div>

          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">{{ t('resourceTypes.required') }}</div>
                <div class="dlg-status-desc">{{ t('resourceTypes.requiredHelp') }}</div>
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
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import PrimeToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { FieldVisibility } from '@/types/enums'
import { customFieldsApi } from '@/api/custom-fields.api'
import { useCustomFieldsStore } from '@/stores/custom-fields.store'
import type { CustomFieldDef, FieldLinkResponse } from '@/types/custom-field'
import type { CreateResourceTypeDto, UpdateResourceTypeDto } from '@/types/resource'

const { t } = useI18n()
const resourcesStore = useResourcesStore()
const customFieldsStore = useCustomFieldsStore()

const ICON_OPTIONS = computed(() => [
  { label: t('resourceTypes.iconMeetingRoom'), value: 'pi pi-building' },
  { label: t('resourceTypes.iconProjector'), value: 'pi pi-video' },
  { label: t('resourceTypes.iconDesk'), value: 'pi pi-desktop' },
  { label: t('resourceTypes.iconOther'), value: 'pi pi-box' },
])

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
  icon: ICON_OPTIONS.value[0].value,
  color: '#2563eb',
  defaultTimeSlots: '',
  allowMultiBooking: false,
  isActive: true,
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
  { label: t('visitorTypes.visibilityInternal'), value: FieldVisibility.Internal },
  { label: t('visitorTypes.visibilityPublic'), value: FieldVisibility.Public },
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
    isActive: resourceType.isActive ?? true,
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
    icon: ICON_OPTIONS.value[0].value,
    color: '#2563eb',
    defaultTimeSlots: '',
    allowMultiBooking: false,
    isActive: true,
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
