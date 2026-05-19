<template>
  <MainLayout>
    <div class="list-page">

      <!-- ── Toolbar flat, senza frame ──────────────────────────────── -->
      <div class="list-toolbar-flat">

        <!-- Riga 1: search (espande) + nuovo a destra -->
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

          <button type="button" class="list-btn-primary" @click="openCreateDialog">
            <i class="pi pi-plus" />
            <span>{{ t('visitorTypes.createNew') }}</span>
          </button>
        </div>

        <!-- Riga 2: dropdown filtro + count + view toggle -->
        <div class="list-row-secondary">
          <div class="list-filter-inline">
            <label class="list-filter-label-inline">{{ t('common.status') }}</label>
            <MultiSelect
              v-model="statusFilter"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              :placeholder="t('common.all')"
              display="chip"
              :max-selected-labels="1"
              :selected-items-label="`{0} ${t('common.selected')}`"
              class="list-filter-select"
            />
          </div>

          <div class="list-row-secondary-right">
            <span class="list-count-flat">
              {{ filteredVisitorTypes.length }} {{ t('common.results') }}
            </span>

            <div class="list-view-flat" role="group" :aria-label="t('common.viewTable')">
              <button
                type="button"
                class="list-view-icon"
                :class="{ active: viewMode === 'table' }"
                :aria-pressed="viewMode === 'table'"
                :title="t('common.viewTable')"
                @click="setViewMode('table')"
              >
                <i class="pi pi-list" />
              </button>
              <button
                type="button"
                class="list-view-icon"
                :class="{ active: viewMode === 'card' }"
                :aria-pressed="viewMode === 'card'"
                :title="t('common.viewCards')"
                @click="setViewMode('card')"
              >
                <i class="pi pi-th-large" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Empty (nessun dato) ─────────────────────────────────────── -->
      <div v-if="filteredVisitorTypes.length === 0" class="list-empty">
        <i class="pi pi-inbox" />
        <p>{{ t('common.noData') }}</p>
      </div>

      <!-- ── Tabella ──────────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
        <DataTable :value="filteredVisitorTypes" responsiveLayout="scroll" stripedRows class="list-table">
          <Column field="name" :header="t('visitorTypes.name')" :sortable="true" style="width: 22%">
            <template #body="{ data }">
              <span class="list-cell-strong">{{ data.name }}</span>
            </template>
          </Column>

          <Column field="description" :header="t('visitorTypes.description')" :sortable="true" style="width: 35%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ data.description || '—' }}</span>
            </template>
          </Column>

          <Column field="customFieldsCount" :header="t('visitorTypes.customFields')" :sortable="true" style="width: 13%">
            <template #body="{ data }">
              <Tag :value="`${data.customFieldsCount}`" severity="info" />
            </template>
          </Column>

          <Column field="isActive" :header="t('common.status')" :sortable="true" style="width: 13%">
            <template #body="{ data }">
              <Tag
                :value="data.isActive ? t('common.active') : t('common.inactive')"
                :severity="data.isActive ? 'success' : 'danger'"
              />
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 110px" class="list-col-actions">
            <template #body="{ data }">
              <div class="list-row-actions">
                <button
                  type="button"
                  class="list-action-btn list-action-edit"
                  :title="t('common.edit')"
                  :aria-label="t('common.edit')"
                  @click="editVisitorType(data)"
                >
                  <i class="pi pi-pencil" />
                </button>
                <button
                  type="button"
                  class="list-action-btn list-action-delete"
                  :title="t('common.delete')"
                  :aria-label="t('common.delete')"
                  @click="deleteVisitorType(data.id)"
                >
                  <i class="pi pi-trash" />
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ── Cards ────────────────────────────────────────────────────── -->
      <div v-else class="list-cards-grid">
        <article v-for="vt in filteredVisitorTypes" :key="vt.id" class="list-card">
          <div class="list-card-head">
            <h3 class="list-card-title">{{ vt.name }}</h3>
            <Tag
              :value="vt.isActive ? t('common.active') : t('common.inactive')"
              :severity="vt.isActive ? 'success' : 'danger'"
            />
          </div>
          <p v-if="vt.description" class="list-card-desc">{{ vt.description }}</p>

          <div class="list-card-meta">
            <Tag
              :value="`${customFieldsCountByVisitorTypeId[vt.id] || 0} ${t('visitorTypes.customFields')}`"
              severity="info"
            />
          </div>

          <div class="list-card-actions">
            <button
              type="button"
              class="list-action-btn list-action-edit"
              :title="t('common.edit')"
              :aria-label="t('common.edit')"
              @click="editVisitorType(vt)"
            >
              <i class="pi pi-pencil" />
            </button>
            <button
              type="button"
              class="list-action-btn list-action-delete"
              :title="t('common.delete')"
              :aria-label="t('common.delete')"
              @click="deleteVisitorType(vt.id)"
            >
              <i class="pi pi-trash" />
            </button>
          </div>
        </article>
      </div>

      <!-- ── Create / Edit Dialog ─────────────────────────────────────── -->
      <AppDialog
        v-model:visible="showCreateDialog"
        :header="isEditing ? t('common.edit') : t('visitorTypes.createNew')"
        :subtitle="formData.name || t('visitorTypes.subtitle')"
        :icon="isEditing ? 'pi pi-pencil' : 'pi pi-id-card'"
        severity="info"
        size="lg"
      >
        <div class="dlg-form">
          <div class="dlg-section">
            <div class="dlg-section-title">
              <i class="pi pi-info-circle" />
              {{ t('visitorTypes.generalInfo') }}
            </div>

            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('visitorTypes.name') }} <span class="req">*</span></label>
                <InputText v-model="formData.name" :placeholder="t('visitorTypes.name')" class="w-full" />
              </div>

              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('visitorTypes.description') }}</label>
                <Textarea v-model="formData.description" :placeholder="t('visitorTypes.description')" rows="3" class="w-full" />
              </div>
            </div>
          </div>

          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">{{ t('common.active') }}</div>
                <div class="dlg-status-desc">
                  {{ t('visitorTypes.activeHelp') }}
                </div>
              </div>
              <PrimeToggleSwitch v-model="formData.isActive" input-id="isActive" />
            </div>
          </div>

          <div v-if="!isEditing" class="dlg-hint-box">
            <i class="pi pi-lightbulb" />
            {{ t('visitorTypes.createHint') }}
          </div>

          <div v-if="isEditing" class="dlg-section">
            <div class="dlg-section-title" style="justify-content: space-between;">
              <span class="flex items-center gap-2">
                <i class="pi pi-list" />
                {{ t('visitorTypes.customFields') }}
              </span>
              <button type="button" class="field-add-btn" @click="openAddFieldDialog">
                <i class="pi pi-plus" /> {{ t('visitorTypes.addField') }}
              </button>
            </div>

            <div v-if="!currentCustomFields.length" class="fields-empty">
              <i class="pi pi-inbox" />
              <span>{{ t('visitorTypes.noFields') }}</span>
            </div>

            <div v-else class="fields-list">
              <div v-for="field in currentCustomFields" :key="field.id" class="field-row">
                <div class="field-row-info">
                  <span class="field-row-label">{{ field.label }}</span>
                  <div class="field-row-meta">
                    <span class="field-chip field-chip-type">{{ field.fieldType }}</span>
                    <span class="field-chip" :class="field.isRequired ? 'field-chip-required' : 'field-chip-optional'">
                      {{ field.isRequired ? t('visitorTypes.required') : t('common.optional') }}
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
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="visitorTypesStore.loading" @click="saveVisitorType">
            <i class="pi pi-check" /> {{ t('common.save') }}
          </button>
        </template>
      </AppDialog>

      <!-- ── Field Add / Edit Dialog ─────────────────────────────────── -->
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
            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('visitorTypes.catalogFieldLabel') }} <span class="req">*</span></label>
                <Select
                  v-model="fieldLinkData.customFieldId"
                  :options="availableCatalogFields"
                  option-label="label"
                  option-value="id"
                  filter
                  :disabled="isEditingField"
                  :placeholder="t('visitorTypes.selectCustomFieldPlaceholder')"
                  class="w-full"
                />
                <small class="dlg-help">{{ t('visitorTypes.catalogHelp') }}</small>
              </div>

              <div class="dlg-field">
                <label class="dlg-label">{{ t('visitorTypes.visibility') }}</label>
                <Select
                  v-model="fieldLinkData.visibility"
                  :options="visibilityOptions"
                  option-label="label"
                  option-value="value"
                  class="w-full"
                />
              </div>

              <div class="dlg-field">
                <label class="dlg-label">{{ t('visitorTypes.sortOrder') }}</label>
                <InputNumber v-model="fieldLinkData.sortOrder" class="w-full" :min="0" />
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
                <div class="dlg-status-desc">
                  {{ t('visitorTypes.requiredHelp') }}
                </div>
              </div>
              <Checkbox v-model="fieldLinkData.isRequired" input-id="fieldRequired" binary />
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
import {ref, computed, onMounted, reactive} from 'vue'
import { useI18n } from 'vue-i18n'
import { useVisitorTypesStore } from '@/stores/visitor-types.store'
import { useCustomFieldsStore } from '@/stores/custom-fields.store'
import { customFieldsApi } from '@/api/custom-fields.api'
import MainLayout from '@/layouts/MainLayout.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import PrimeToggleSwitch from 'primevue/toggleswitch'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import InputNumber from 'primevue/inputnumber'
import { FieldVisibility } from '@/types/enums'
import type { CreateVisitorTypeDto, UpdateVisitorTypeDto } from '@/types/visitor-type'
import type { CustomFieldDef, FieldLinkResponse } from '@/types/custom-field'

const { t } = useI18n()
const visitorTypesStore = useVisitorTypesStore()
const customFieldsStore = useCustomFieldsStore()

// ------ View state ------
const searchQuery = ref('')
const statusFilter = ref<boolean[]>([])
const viewMode = ref<'card' | 'table'>(
  (localStorage.getItem('visitor_types_view_mode') as 'card' | 'table') ?? 'table'
)

const statusOptions = computed(() => [
  { label: t('common.active'),   value: true },
  { label: t('common.inactive'), value: false },
])

// ------ Main dialog ------
const showCreateDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const formData = ref<CreateVisitorTypeDto>({
  name: '',
  description: '',
  isActive: true,
})

// ------ Field dialog ------
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

// ------ Computed ------
const filteredVisitorTypes = computed(() => {
  let list = visitorTypesStore.visitorTypes.map((vt) => ({
    ...vt,
    customFieldsCount: customFieldsCountByVisitorTypeId[vt.id] ?? 0,
  }))

  if (statusFilter.value.length > 0) {
    list = list.filter((vt) => statusFilter.value.includes(vt.isActive))
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(
      (vt) =>
        vt.name.toLowerCase().includes(query) ||
        vt.description?.toLowerCase().includes(query)
    )
  }

  return list
})

const currentCustomFields = ref<FieldLinkResponse[]>([])
const customFieldsCountByVisitorTypeId = reactive<Record<string, number>>({})

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

// ------ Main dialog methods ------
const openCreateDialog = () => {
  isEditing.value = false
  editingId.value = null
  formData.value = { name: '', description: '', isActive: true }
  showCreateDialog.value = true
}

const loadVisitorTypeLinks = async (visitorTypeId: string) => {
  currentCustomFields.value = await customFieldsApi.getVisitorTypeLinks(visitorTypeId)
  customFieldsCountByVisitorTypeId[visitorTypeId] = currentCustomFields.value.length
}

const editVisitorType = async (visitorType: any) => {
  isEditing.value = true
  editingId.value = visitorType.id
  formData.value = {
    name: visitorType.name,
    description: visitorType.description,
    isActive: visitorType.isActive,
  }
  if (!customFieldsStore.fields.length) {
    await customFieldsStore.fetchAll()
  }
  await loadVisitorTypeLinks(visitorType.id)
  showCreateDialog.value = true
}

const saveVisitorType = async () => {
  try {
    if (isEditing.value && editingId.value) {
      await visitorTypesStore.updateVisitorType(editingId.value, formData.value as UpdateVisitorTypeDto)
      closeDialog()
    } else {
      const created = await visitorTypesStore.createVisitorType(formData.value)
      if (created?.id) {
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
    console.error('Error saving visitor type:', error)
  }
}

const deleteVisitorType = async (id: string) => {
  if (confirm(t('common.confirm'))) {
    try {
      await visitorTypesStore.removeVisitorType(id)
    } catch (error) {
      console.error('Error deleting visitor type:', error)
    }
  }
}

const closeDialog = () => {
  showCreateDialog.value = false
  isEditing.value = false
  editingId.value = null
  currentCustomFields.value = []
  formData.value = { name: '', description: '', isActive: true }
}

// ------ Field dialog methods ------
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
      await customFieldsApi.updateVisitorTypeLink(editingFieldId.value, {
        isRequired: fieldLinkData.value.isRequired,
        sortOrder: fieldLinkData.value.sortOrder,
        visibility: fieldLinkData.value.visibility,
      })
    } else {
      await customFieldsApi.addVisitorTypeLink({
        entityId: editingId.value,
        customFieldId: fieldLinkData.value.customFieldId,
        isRequired: fieldLinkData.value.isRequired,
        sortOrder: fieldLinkData.value.sortOrder,
        visibility: fieldLinkData.value.visibility,
      })
    }
    await loadVisitorTypeLinks(editingId.value)
    await visitorTypesStore.fetchAllVisitorTypes()
    customFieldsCountByVisitorTypeId[editingId.value] = currentCustomFields.value.length
    closeFieldDialog()
  } catch (error) {
    console.error('Error saving field:', error)
  }
}

const deleteField = async (fieldId: string) => {
  if (confirm(t('common.confirm'))) {
    try {
      await customFieldsApi.removeVisitorTypeLink(fieldId)
      if (editingId.value) {
        await loadVisitorTypeLinks(editingId.value)
        customFieldsCountByVisitorTypeId[editingId.value] = currentCustomFields.value.length
      }
      await visitorTypesStore.fetchAllVisitorTypes()
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
  localStorage.setItem('visitor_types_view_mode', mode)
}

onMounted(async () => {
  try {
    await customFieldsStore.fetchAll()
    await visitorTypesStore.fetchAllVisitorTypes()
    for (const vt of visitorTypesStore.visitorTypes) {
      const links = await customFieldsApi.getVisitorTypeLinks(vt.id)
      customFieldsCountByVisitorTypeId[vt.id] = links.length
    }
  } catch (error) {
    console.error('Error fetching visitor types:', error)
  }
})
</script>

<style scoped src="./VisitorTypesListView.css"></style>
