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
              :placeholder="t('customFields.searchPlaceholder')"
            />
          </div>
          <button type="button" class="list-btn-primary" @click="openCreateDialog">
            <i class="pi pi-plus" />
            <span>{{ t('customFields.createNew') }}</span>
          </button>
        </div>

        <div class="list-row-secondary">
          <div class="list-filter-inline">
            <label class="list-filter-label-inline">{{ t('customFields.typeField') }}</label>
            <MultiSelect
              v-model="typeFilter"
              :options="fieldTypeOptions"
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
            <span class="list-count-flat">{{ filteredFields.length }} {{ t('customFields.results') }}</span>
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
      <div v-if="store.loading && !store.fields.length" class="list-loading">
        <i class="pi pi-spin pi-spinner" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="!store.loading && filteredFields.length === 0" class="list-empty">
        <i class="pi pi-inbox" />
        <p>{{ t('customFields.noFields') }}</p>
      </div>

      <!-- ── Tabella ──────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
        <DataTable :value="filteredFields" responsiveLayout="scroll" stripedRows class="list-table">
          <Column field="label" :header="t('resourceTypes.fieldLabel')" :sortable="true" style="width: 22%">
            <template #body="{ data }">
              <span class="list-cell-strong">{{ data.label }}</span>
            </template>
          </Column>

          <Column field="name" :header="t('common.name')" :sortable="true" style="width: 20%">
            <template #body="{ data }">
              <code class="list-cell-code">{{ data.name }}</code>
            </template>
          </Column>

          <Column field="fieldType" :header="t('resourceTypes.fieldType')" :sortable="true" style="width: 16%">
            <template #body="{ data }">
              <span class="type-chip" :class="fieldTypeChipClass(data.fieldType)">
                {{ fieldTypeLabel(data.fieldType) }}
              </span>
            </template>
          </Column>

          <Column field="isRequired" :header="t('resourceTypes.required')" :sortable="true" style="width: 12%">
            <template #body="{ data }">
              <Tag
                :value="data.isRequired ? t('common.yes') : t('common.no')"
                :severity="data.isRequired ? 'danger' : 'secondary'"
              />
            </template>
          </Column>

          <Column :header="t('resourceTypes.options')" style="width: 12%">
            <template #body="{ data }">
              <Tag
                v-if="hasOptions(data.fieldType)"
                :value="t('customFields.optionsCount', { count: data.options?.length ?? 0 })"
                severity="info"
              />
              <span v-else class="list-cell-muted">—</span>
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 110px" class="list-col-actions">
            <template #body="{ data }">
              <div class="list-row-actions">
                <button type="button" class="list-action-btn list-action-edit" :disabled="data.isSystem" :title="t('common.edit')" @click="openEditDialog(data)">
                  <i class="pi pi-pencil" />
                </button>
                <button type="button" class="list-action-btn list-action-delete" :disabled="data.isSystem" :title="t('common.delete')" @click="handleDelete(data.id)">
                  <i class="pi pi-trash" />
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ── Cards ────────────────────────────────────────────────── -->
      <div v-else class="list-cards-grid">
        <article v-for="f in filteredFields" :key="f.id" class="list-card">
          <div class="list-card-head">
            <h3 class="list-card-title">{{ f.label }}</h3>
            <Tag
              :value="f.isRequired ? t('common.yes') : t('common.no')"
              :severity="f.isRequired ? 'danger' : 'secondary'"
            />
          </div>
          <p class="list-card-subtitle">{{ f.name }}</p>
          <div class="list-card-info">
            <div class="list-card-info-row">
              <i class="pi pi-tag" />
              <span class="type-chip" :class="fieldTypeChipClass(f.fieldType)">
                {{ fieldTypeLabel(f.fieldType) }}
              </span>
            </div>
            <div v-if="hasOptions(f.fieldType)" class="list-card-info-row">
              <i class="pi pi-list" />
              <span>{{ t('customFields.optionsCount', { count: f.options?.length ?? 0 }) }}</span>
            </div>
          </div>
          <div class="list-card-actions">
            <button type="button" class="list-action-btn list-action-edit" :disabled="f.isSystem" :title="t('common.edit')" @click="openEditDialog(f)">
              <i class="pi pi-pencil" />
            </button>
            <button type="button" class="list-action-btn list-action-delete" :disabled="f.isSystem" :title="t('common.delete')" @click="handleDelete(f.id)">
              <i class="pi pi-trash" />
            </button>
          </div>
        </article>
      </div>

      <!-- ── Create / Edit Dialog ─────────────────────────────────── -->
      <AppDialog
        v-model:visible="showDialog"
        :header="isEditing ? t('customFields.editField') : t('customFields.createNew')"
        :subtitle="formData.label || t('customFields.createSubtitle')"
        :icon="isEditing ? 'pi pi-pencil' : 'pi pi-plus-circle'"
        severity="primary"
        size="md"
      >
        <div class="dlg-form">
          <div class="dlg-section">
            <div class="dlg-section-title">
              <i class="pi pi-info-circle" /> {{ t('customFields.generalSection') }}
            </div>
            <div class="dlg-fields-2">
              <div class="dlg-field">
                <label class="dlg-label">{{ t('customFields.internalName') }} <span class="req">*</span></label>
                <InputText v-model="formData.name" :placeholder="t('customFields.internalNamePlaceholder')" class="w-full" />
                <small class="dlg-help">{{ t('customFields.internalNameHint') }}</small>
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('customFields.labelField') }} <span class="req">*</span></label>
                <InputText v-model="formData.label" :placeholder="t('customFields.labelFieldPlaceholder')" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('customFields.typeField') }} <span class="req">*</span></label>
                <Select v-model="formData.fieldType" :options="fieldTypeOptions" option-label="label" option-value="value" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('customFields.placeholderField') }}</label>
                <InputText v-model="formData.placeholder" :placeholder="t('customFields.placeholderFieldPlaceholder')" class="w-full" />
              </div>
            </div>
          </div>

          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">{{ t('customFields.requiredTitle') }}</div>
                <div class="dlg-status-desc">{{ t('customFields.requiredDesc') }}</div>
              </div>
              <Checkbox v-model="formData.isRequired" input-id="cfIsRequired" binary />
            </div>
          </div>

          <div v-if="hasOptions(formData.fieldType)" class="dlg-section">
            <div class="dlg-section-title" style="justify-content: space-between;">
              <span class="flex items-center gap-2">
                <i class="pi pi-list" /> {{ t('customFields.optionsSection') }}
              </span>
            </div>

            <div v-if="currentOptions.length" class="options-list">
              <div v-for="opt in currentOptions" :key="opt.id" class="option-row">
                <div class="option-row-info">
                  <span class="option-label">{{ opt.label }}</span>
                  <code class="option-value">{{ opt.value }}</code>
                  <span class="option-order">#{{ opt.sortOrder }}</span>
                </div>
                <button type="button" class="option-remove-btn" @click="handleRemoveOption(opt.id)" :title="t('customFields.removeOption')">
                  <i class="pi pi-times" />
                </button>
              </div>
            </div>

            <div class="option-add-form">
              <InputText v-model="newOptionLabel" :placeholder="t('customFields.optionLabelPlaceholder')" class="option-input" />
              <InputText v-model="newOptionValue" :placeholder="t('customFields.optionValuePlaceholder')" class="option-input" />
              <button type="button" class="option-add-btn" @click="handleAddOption">
                <i class="pi pi-plus" /> {{ t('customFields.addOption') }}
              </button>
            </div>

            <small v-if="!isEditing" class="dlg-help mt-2 block">
              {{ t('customFields.optionsSaveHint') }}
            </small>
          </div>
        </div>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="closeDialog">
            <i class="pi pi-times" /> {{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="store.loading" @click="handleSave">
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
import { useCustomFieldsStore } from '@/stores/custom-fields.store'
import { customFieldsApi } from '@/api/custom-fields.api'
import MainLayout from '@/layouts/MainLayout.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type {
  CustomFieldDef,
  CustomFieldOption,
  CustomFieldType,
  CreateCustomFieldDefDto,
} from '@/types/custom-field'

const store = useCustomFieldsStore()
const { t } = useI18n()

const fieldTypeOptions = computed<Array<{ label: string; value: CustomFieldType }>>(() => [
  { label: t('customFields.types.text'),           value: 'Text' },
  { label: t('customFields.types.number'),         value: 'Number' },
  { label: t('customFields.types.checkbox'),       value: 'Checkbox' },
  { label: t('customFields.types.singleChoice'),   value: 'SingleChoice' },
  { label: t('customFields.types.multipleChoice'), value: 'MultipleChoice' },
  { label: t('customFields.types.email'),          value: 'Email' },
  { label: t('customFields.types.phone'),          value: 'Phone' },
  { label: t('customFields.types.date'),           value: 'Date' },
  { label: t('customFields.types.dropdown'),       value: 'Dropdown' },
  { label: t('customFields.types.boolean'),        value: 'Boolean' },
])

function fieldTypeLabel(type: CustomFieldType): string {
  const map: Record<CustomFieldType, string> = {
    Text:           t('customFields.types.text'),
    Number:         t('customFields.types.number'),
    Checkbox:       t('customFields.types.checkbox'),
    SingleChoice:   t('customFields.types.singleChoice'),
    MultipleChoice: t('customFields.types.multipleChoice'),
    Email:          t('customFields.types.email'),
    Phone:          t('customFields.types.phone'),
    Date:           t('customFields.types.date'),
    Dropdown:       t('customFields.types.dropdown'),
    Boolean:        t('customFields.types.boolean'),
  }
  return map[type] ?? type
}

function fieldTypeChipClass(type: CustomFieldType): string {
  const map: Record<CustomFieldType, string> = {
    Text: 'chip-indigo',
    Number: 'chip-blue',
    Checkbox: 'chip-green',
    SingleChoice: 'chip-orange',
    MultipleChoice: 'chip-purple',
    Email: 'chip-indigo',
    Phone: 'chip-blue',
    Date: 'chip-blue',
    Dropdown: 'chip-orange',
    Boolean: 'chip-green',
  }
  return map[type] ?? ''
}

function hasOptions(type: CustomFieldType): boolean {
  return type === 'SingleChoice' || type === 'MultipleChoice'
}

const searchQuery = ref('')
const typeFilter = ref<CustomFieldType[]>([])
const viewMode = ref<'card' | 'table'>(
  (localStorage.getItem('custom_fields_view_mode') as 'card' | 'table') ?? 'table'
)
const showDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const setViewMode = (mode: 'card' | 'table') => {
  viewMode.value = mode
  localStorage.setItem('custom_fields_view_mode', mode)
}

const defaultForm = (): CreateCustomFieldDefDto & { isRequired: boolean } => ({
  name: '',
  label: '',
  fieldType: 'Text' as CustomFieldType,
  placeholder: '',
  isRequired: false,
})

const formData = ref(defaultForm())
const currentOptions = ref<CustomFieldOption[]>([])
const newOptionLabel = ref('')
const newOptionValue = ref('')
const pendingOptions = ref<Array<{ label: string; value: string; sortOrder: number }>>([])

const filteredFields = computed(() => {
  let list = store.fields
  if (typeFilter.value.length > 0) {
    list = list.filter((f) => typeFilter.value.includes(f.fieldType))
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.fieldType.toLowerCase().includes(q)
    )
  }
  return list
})

const openCreateDialog = () => {
  isEditing.value = false
  editingId.value = null
  formData.value = defaultForm()
  currentOptions.value = []
  pendingOptions.value = []
  newOptionLabel.value = ''
  newOptionValue.value = ''
  showDialog.value = true
}

const openEditDialog = (field: CustomFieldDef) => {
  isEditing.value = true
  editingId.value = field.id
  formData.value = {
    name: field.name,
    label: field.label,
    fieldType: field.fieldType,
    placeholder: field.placeholder ?? '',
    isRequired: field.isRequired,
  }
  currentOptions.value = [...(field.options ?? [])]
  pendingOptions.value = []
  newOptionLabel.value = ''
  newOptionValue.value = ''
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  isEditing.value = false
  editingId.value = null
  formData.value = defaultForm()
  currentOptions.value = []
  pendingOptions.value = []
  newOptionLabel.value = ''
  newOptionValue.value = ''
}

const handleAddOption = async () => {
  if (!newOptionLabel.value.trim() || !newOptionValue.value.trim()) return

  if (isEditing.value && editingId.value) {
    try {
      const nextOrder = currentOptions.value.length
      await store.addOption(editingId.value, {
        label: newOptionLabel.value.trim(),
        value: newOptionValue.value.trim(),
        sortOrder: nextOrder,
      })
      const updated = store.fieldById(editingId.value)
      if (updated) currentOptions.value = [...updated.options]
    } catch (err) {
      console.error('Error adding option:', err)
    }
  } else {
    const nextOrder = pendingOptions.value.length
    pendingOptions.value.push({
      label: newOptionLabel.value.trim(),
      value: newOptionValue.value.trim(),
      sortOrder: nextOrder,
    })
    currentOptions.value = pendingOptions.value.map((o, i) => ({
      id: `pending-${i}`,
      customFieldId: '',
      label: o.label,
      value: o.value,
      sortOrder: o.sortOrder,
    }))
  }

  newOptionLabel.value = ''
  newOptionValue.value = ''
}

const handleRemoveOption = async (optionId: string) => {
  if (optionId.startsWith('pending-')) {
    const index = parseInt(optionId.replace('pending-', ''), 10)
    pendingOptions.value.splice(index, 1)
    currentOptions.value = pendingOptions.value.map((o, i) => ({
      id: `pending-${i}`,
      customFieldId: '',
      label: o.label,
      value: o.value,
      sortOrder: o.sortOrder,
    }))
    return
  }

  if (!editingId.value) return
  if (!confirm(t('customFields.confirmRemoveOption'))) return

  try {
    await store.removeOption(editingId.value, optionId)
    currentOptions.value = currentOptions.value.filter((o) => o.id !== optionId)
  } catch (err) {
    console.error('Error removing option:', err)
  }
}

const handleSave = async () => {
  if (!formData.value.name.trim() || !formData.value.label.trim()) return

  try {
    if (isEditing.value && editingId.value) {
      await store.update(editingId.value, {
        name: formData.value.name,
        label: formData.value.label,
        fieldType: formData.value.fieldType,
        placeholder: formData.value.placeholder,
        isRequired: formData.value.isRequired,
      })
      closeDialog()
    } else {
      const created = await store.create({
        name: formData.value.name,
        label: formData.value.label,
        fieldType: formData.value.fieldType,
        placeholder: formData.value.placeholder,
        isRequired: formData.value.isRequired,
      })

      if (hasOptions(formData.value.fieldType) && pendingOptions.value.length) {
        for (const opt of pendingOptions.value) {
          try {
            await customFieldsApi.addOption(created.id, opt)
          } catch (err) {
            console.error('Error saving pending option:', err)
          }
        }
        const refreshed = await customFieldsApi.getById(created.id)
        const index = store.fields.findIndex((f) => f.id === created.id)
        if (index !== -1) store.fields[index] = refreshed
      }

      closeDialog()
    }
  } catch (err) {
    console.error('Error saving custom field:', err)
  }
}

const handleDelete = async (id: string) => {
  if (!confirm(t('customFields.confirmDelete'))) return
  try {
    await store.remove(id)
  } catch (err) {
    console.error('Error deleting custom field:', err)
  }
}

onMounted(async () => {
  try {
    await store.fetchAll()
  } catch (err) {
    console.error('Error fetching custom fields:', err)
  }
})
</script>

<style scoped src="./CustomFieldsView.css"></style>
