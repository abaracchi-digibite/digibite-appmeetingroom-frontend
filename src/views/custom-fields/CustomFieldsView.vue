<template>
  <MainLayout>
    <div class="custom-fields-container">
      <!-- Toolbar -->
      <div class="toolbar-section mb-4 p-4 rounded-lg" style="background-color: var(--bg-card);">
        <div class="flex gap-3 flex-wrap items-center">
            <IconField class="flex-1 min-w-64">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" :placeholder="t('customFields.searchPlaceholder')" class="w-full search-input" />
          </IconField>
          <div class="text-sm text-slate-600">{{ filteredFields.length }} risultati</div>
          <Button :label="t('customFields.createNew')" icon="pi pi-plus" @click="openCreateDialog" severity="success" size="small" />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="store.loading && !store.fields.length" class="flex justify-center items-center h-96">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl mb-4" style="color: #2563EB;"></i>
          <p class="text-slate-600">{{ t('common.loadingDots') }}</p>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!store.loading && filteredFields.length === 0" class="flex justify-center items-center h-96 rounded-lg" style="background-color: var(--bg-page);">
        <div class="text-center">
          <i class="pi pi-inbox text-6xl mb-4" style="color: #9CA3AF;"></i>
          <p class="text-slate-600 text-lg">{{ t('customFields.noFields') }}</p>
        </div>
      </div>

      <!-- DataTable -->
      <div v-else>
        <DataTable :value="filteredFields" responsiveLayout="scroll" stripedRows showGridlines>
          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-inbox text-4xl mb-3" style="color: #cbd5e1;"></i>
              <p style="color: #64748b;">{{ t('customFields.noData') }}</p>
            </div>
          </template>

          <Column field="label" :header="t('resourceTypes.fieldLabel')" :sortable="true" style="width: 22%">
            <template #body="{ data }">
              <span style="color: #0f172a; font-weight: 600;">{{ data.label }}</span>
            </template>
          </Column>

          <Column field="name" :header="t('common.name')" :sortable="true" style="width: 20%">
            <template #body="{ data }">
              <code class="name-code">{{ data.name }}</code>
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
                :value="`${data.options?.length ?? 0} opzioni`"
                severity="info"
              />
              <span v-else class="text-slate-400 text-sm">–</span>
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 140px">
            <template #body="{ data }">
              <div class="table-actions">
                <Button icon="pi pi-pencil" @click="openEditDialog(data)" outlined severity="warning" size="small" :disabled="data.isSystem" />
                <Button icon="pi pi-trash" @click="handleDelete(data.id)" outlined severity="danger" size="small" :disabled="data.isSystem" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ------ Create / Edit Dialog ------------------------------------------------------------------------------------------------------------------------------------ -->
        <AppDialog
        v-model:visible="showDialog"
        :header="isEditing ? t('customFields.editField') : t('customFields.createNew')"
        :subtitle="formData.label || t('customFields.createSubtitle')"
        :icon="isEditing ? 'pi pi-pencil' : 'pi pi-plus-circle'"
        severity="primary"
        size="md"
      >
        <div class="dlg-form">
          <!-- Informazioni generali -->
          <div class="dlg-section">
            <div class="dlg-section-title">
              <i class="pi pi-info-circle" /> Informazioni generali
            </div>
            <div class="dlg-fields-2">
              <div class="dlg-field">
                <label class="dlg-label">Nome interno <span class="req">*</span></label>
                <InputText
                  v-model="formData.name"
                  placeholder="es. nome_campo"
                  class="w-full"
                />
                <small class="dlg-help">Identificatore slug, es. "nome_campo"</small>
              </div>
              <div class="dlg-field">
                <label class="dlg-label">Etichetta <span class="req">*</span></label>
                <InputText
                  v-model="formData.label"
                  placeholder="es. Scopo della riunione"
                  class="w-full"
                />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">Tipo <span class="req">*</span></label>
                <Select
                  v-model="formData.fieldType"
                  :options="fieldTypeOptions"
                  option-label="label"
                  option-value="value"
                  class="w-full"
                />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">Placeholder</label>
                <InputText v-model="formData.placeholder" placeholder="Testo suggerito..." class="w-full" />
              </div>
            </div>
          </div>

          <!-- Obbligatorio -->
          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">Obbligatorio</div>
                <div class="dlg-status-desc">Il campo sarà obbligatorio per chi compila il modulo</div>
              </div>
              <Checkbox v-model="formData.isRequired" input-id="cfIsRequired" binary />
            </div>
          </div>

          <!-- Opzioni (solo SingleChoice / MultipleChoice) -->
          <div v-if="hasOptions(formData.fieldType)" class="dlg-section">
            <div class="dlg-section-title" style="justify-content: space-between;">
              <span class="flex items-center gap-2">
                <i class="pi pi-list" /> Opzioni
              </span>
            </div>

            <!-- Lista opzioni esistenti -->
            <div v-if="currentOptions.length" class="options-list">
              <div v-for="opt in currentOptions" :key="opt.id" class="option-row">
                <div class="option-row-info">
                  <span class="option-label">{{ opt.label }}</span>
                  <code class="option-value">{{ opt.value }}</code>
                  <span class="option-order">#{{ opt.sortOrder }}</span>
                </div>
                <button
                  type="button"
                  class="option-remove-btn"
                  @click="handleRemoveOption(opt.id)"
                  title="Rimuovi"
                >
                  <i class="pi pi-times" />
                </button>
              </div>
            </div>

            <!-- Form aggiunta nuova opzione -->
            <div class="option-add-form">
              <InputText
                v-model="newOptionLabel"
                placeholder="Etichetta"
                class="option-input"
              />
              <InputText
                v-model="newOptionValue"
                placeholder="Valore"
                class="option-input"
              />
              <button type="button" class="option-add-btn" @click="handleAddOption">
                <i class="pi pi-plus" /> Aggiungi
              </button>
            </div>

            <small v-if="!isEditing" class="dlg-help mt-2 block">
              Le opzioni saranno salvate dopo la creazione del campo.
            </small>
          </div>
        </div>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="closeDialog">
            <i class="pi pi-times" /> Annulla
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="store.loading" @click="handleSave">
            <i class="pi pi-check" /> Salva
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
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import type {
  CustomFieldDef,
  CustomFieldOption,
  CustomFieldType,
  CreateCustomFieldDefDto,
} from '@/types/custom-field'

const store = useCustomFieldsStore()
const { t } = useI18n()

// ------ Field type helpers ---------------------------------------------------------------------------------------------------------------------------------------------------------------------

const fieldTypeOptions: Array<{ label: string; value: CustomFieldType }> = [
  { label: 'Testo', value: 'Text' },
  { label: 'Numero', value: 'Number' },
  { label: 'Checkbox', value: 'Checkbox' },
  { label: 'Scelta singola', value: 'SingleChoice' },
  { label: 'Scelta multipla', value: 'MultipleChoice' },
  { label: 'Email', value: 'Email' },
  { label: 'Telefono', value: 'Phone' },
  { label: 'Data', value: 'Date' },
  { label: 'Dropdown', value: 'Dropdown' },
  { label: 'Booleano', value: 'Boolean' },
]

function fieldTypeLabel(type: CustomFieldType): string {
  const map: Record<CustomFieldType, string> = {
    Text: 'Testo',
    Number: 'Numero',
    Checkbox: 'Checkbox',
    SingleChoice: 'Scelta singola',
    MultipleChoice: 'Scelta multipla',
    Email: 'Email',
    Phone: 'Telefono',
    Date: 'Data',
    Dropdown: 'Dropdown',
    Boolean: 'Booleano',
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

// ------ State ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const searchQuery = ref('')
const showDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const defaultForm = (): CreateCustomFieldDefDto & { isRequired: boolean } => ({
  name: '',
  label: '',
  fieldType: 'Text' as CustomFieldType,
  placeholder: '',
  isRequired: false,
})

const formData = ref(defaultForm())

// Options management
const currentOptions = ref<CustomFieldOption[]>([])
const newOptionLabel = ref('')
const newOptionValue = ref('')
// Buffer for options added during creation (before field id exists)
const pendingOptions = ref<Array<{ label: string; value: string; sortOrder: number }>>([])

// ------ Computed ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const filteredFields = computed(() => {
  if (!searchQuery.value) return store.fields
  const q = searchQuery.value.toLowerCase()
  return store.fields.filter(
    (f) =>
      f.label.toLowerCase().includes(q) ||
      f.name.toLowerCase().includes(q) ||
      f.fieldType.toLowerCase().includes(q)
  )
})

// ------ Dialog helpers ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

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

// ------ Options handling ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const handleAddOption = async () => {
  if (!newOptionLabel.value.trim() || !newOptionValue.value.trim()) return

  if (isEditing.value && editingId.value) {
    // In edit mode: save immediately via API
    try {
      const nextOrder = currentOptions.value.length
      await store.addOption(editingId.value, {
        label: newOptionLabel.value.trim(),
        value: newOptionValue.value.trim(),
        sortOrder: nextOrder,
      })
      // Refresh options list from store
      const updated = store.fieldById(editingId.value)
      if (updated) currentOptions.value = [...updated.options]
    } catch (err) {
      console.error('Error adding option:', err)
    }
  } else {
    // In create mode: buffer locally
    const nextOrder = pendingOptions.value.length
    pendingOptions.value.push({
      label: newOptionLabel.value.trim(),
      value: newOptionValue.value.trim(),
      sortOrder: nextOrder,
    })
    // Show in UI as pseudo-options
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
    // Remove from pending buffer
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

  if (!confirm('Rimuovere questa opzione?')) return

  try {
    await store.removeOption(editingId.value, optionId)
    currentOptions.value = currentOptions.value.filter((o) => o.id !== optionId)
  } catch (err) {
    console.error('Error removing option:', err)
  }
}

// ------ Save ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

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

      // Save buffered options via API
      if (hasOptions(formData.value.fieldType) && pendingOptions.value.length) {
        for (const opt of pendingOptions.value) {
          try {
            await customFieldsApi.addOption(created.id, opt)
          } catch (err) {
            console.error('Error saving pending option:', err)
          }
        }
        // Refresh field to get options with real IDs
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

// ------ Delete ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const handleDelete = async (id: string) => {
  if (!confirm('Eliminare questo campo personalizzato?')) return
  try {
    await store.remove(id)
  } catch (err) {
    console.error('Error deleting custom field:', err)
  }
}

// ------ Init ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

onMounted(async () => {
  try {
    await store.fetchAll()
  } catch (err) {
    console.error('Error fetching custom fields:', err)
  }
})
</script>

<style scoped src="./CustomFieldsView.css"></style>
