<template>
  <MainLayout>
    <div class="list-page">

      <!-- Error: mostrato solo se NESSUN dato è caricato (non se è un errore transitorio già risolto da un retry) -->
      <div v-if="resourcesStore.error && filteredResources.length === 0 && !resourcesStore.loading" class="list-error">
        <i class="pi pi-exclamation-circle" />
        <span>{{ t('common.loadFailed') }}</span>
      </div>

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
            <span>{{ t('resources.createNew') }}</span>
          </button>
        </div>

        <div class="list-row-secondary">
          <div class="list-filters-group">
            <div class="list-filter-inline">
              <label class="list-filter-label-inline">{{ t('plants.title') }}</label>
              <MultiSelect
                v-model="plantFilter"
                :options="plants"
                option-label="name"
                option-value="id"
                :placeholder="t('common.all')"
                display="chip"
                :max-selected-labels="1"
                :selected-items-label="`{0} ${t('common.selected')}`"
                class="list-filter-select"
              />
            </div>
            <div class="list-filter-inline">
              <label class="list-filter-label-inline">{{ t('resources.type') }}</label>
              <MultiSelect
                v-model="typeFilter"
                :options="resourceTypes"
                option-label="name"
                option-value="id"
                :placeholder="t('common.all')"
                display="chip"
                :max-selected-labels="1"
                :selected-items-label="`{0} ${t('common.selected')}`"
                class="list-filter-select"
              />
            </div>
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
          </div>

          <div class="list-row-secondary-right">
            <span class="list-count-flat">{{ filteredResources.length }} {{ t('common.results') }}</span>
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

      <div v-else-if="filteredResources.length === 0" class="list-empty">
        <i class="pi pi-inbox" />
        <p>{{ t('common.noResults') }}</p>
      </div>

      <!-- ── Tabella ──────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
        <DataTable :value="filteredResources" responsiveLayout="scroll" stripedRows class="list-table">
          <Column field="name" :header="t('common.name')" :sortable="true" style="width: 22%">
            <template #body="{ data }">
              <span class="list-cell-strong">{{ data.name }}</span>
            </template>
          </Column>

          <Column field="plantName" :header="t('resources.site')" :sortable="true" style="width: 18%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ data.plantName }}</span>
            </template>
          </Column>

          <Column field="resourceTypeName" :header="t('resources.type')" :sortable="true" style="width: 18%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ data.resourceTypeName }}</span>
            </template>
          </Column>

          <Column field="capacity" :header="t('resources.capacity')" :sortable="true" style="width: 12%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ data.capacity ? `${data.capacity} ${t('common.people')}` : '—' }}</span>
            </template>
          </Column>

          <Column field="status" :header="t('common.status')" :sortable="true" style="width: 14%">
            <template #body="{ data }">
              <Tag
                :value="data.status === 'Available' ? t('resources.status.available') : t('resources.status.inMaintenance')"
                :severity="data.status === 'Available' ? 'success' : 'warning'"
              />
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 110px" class="list-col-actions">
            <template #body="{ data }">
              <div class="list-row-actions">
                <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="editResource(data)">
                  <i class="pi pi-pencil" />
                </button>
                <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteResource(data.id)">
                  <i class="pi pi-trash" />
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ── Cards ────────────────────────────────────────────────── -->
      <div v-else class="list-cards-grid">
        <article v-for="resource in filteredResources" :key="resource.id" class="list-card">
          <div class="list-card-head">
            <h3 class="list-card-title">{{ resource.name }}</h3>
            <Tag
              :value="resource.status === 'Available' ? t('resources.status.available') : t('resources.status.inMaintenance')"
              :severity="resource.status === 'Available' ? 'success' : 'warning'"
            />
          </div>
          <p v-if="resource.description" class="list-card-desc">{{ resource.description }}</p>
          <div class="list-card-info">
            <div class="list-card-info-row">
              <i class="pi pi-building" />
              <span>{{ resource.plantName || '—' }}</span>
            </div>
            <div class="list-card-info-row">
              <i class="pi pi-tag" />
              <span>{{ resource.resourceTypeName || '—' }}</span>
            </div>
            <div v-if="resource.capacity" class="list-card-info-row">
              <i class="pi pi-users" />
              <span>{{ resource.capacity }} {{ t('common.people') }}</span>
            </div>
            <div v-if="resource.requiresApproval" class="list-card-info-row">
              <i class="pi pi-check-square" style="color: #7c3aed;" />
              <span>{{ t('resources.approvalRequired') }}</span>
            </div>
          </div>
          <div class="list-card-actions">
            <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="editResource(resource)">
              <i class="pi pi-pencil" />
            </button>
            <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteResource(resource.id)">
              <i class="pi pi-trash" />
            </button>
          </div>
        </article>
      </div>

      <!-- ── Create / Edit Dialog ─────────────────────────────────── -->
      <AppDialog
        v-model:visible="showCreateDialog"
        :header="isEditing ? t('resources.editTitle') : t('resources.createNew')"
        :subtitle="isEditing ? formData.name : t('resources.createNewHint')"
        :icon="isEditing ? 'pi pi-pencil' : 'pi pi-plus-circle'"
        severity="primary"
        size="lg"
      >
        <form @submit.prevent="saveResource" class="dlg-form">
          <div class="dlg-section">
            <div class="dlg-section-title">
              <i class="pi pi-info-circle" />{{ t('resources.generalInfo') }}
            </div>
            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('common.name') }}</label>
                <InputText v-model="formData.name" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('resources.site') }}</label>
                <Dropdown v-model="formData.plantId" :options="plantOptions" optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('resources.type') }}</label>
                <Dropdown v-model="formData.resourceTypeId" :options="resourceTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('resources.capacity') }}</label>
                <InputNumber v-model="formData.capacity" class="w-full" />
              </div>
            </div>
          </div>

          <div class="dlg-section dlg-section-status">
            <div class="dlg-section-title">
              <i class="pi pi-cog" />{{ t('resources.statusLabel') }}
            </div>
            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('common.status') }}</label>
                <Dropdown v-model="formData.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div class="dlg-field dlg-field-full">
                <div class="dlg-status-desc">
                  {{ formData.status === ResourceStatus.Available
                    ? t('resources.activeHelpAvailable')
                    : t('resources.activeHelpUnavailable') }}
                </div>
              </div>
            </div>
          </div>

          <div class="dlg-section">
            <div class="dlg-section-title">
              <i class="pi pi-tablet" />{{ t('resources.publicPage.title') }}
            </div>
            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <div class="dlg-status-row">
                  <div>
                    <div class="dlg-status-title">{{ t('resources.publicPage.toggleLabel') }}</div>
                    <div class="dlg-status-desc">{{ t('resources.publicPage.toggleHint') }}</div>
                  </div>
                  <Checkbox v-model="formData.publicPageEnabled" input-id="resourceListPublicPageEnabled" binary />
                </div>
              </div>
              <div v-if="formData.publicPageEnabled || editingResourceHasPin" class="dlg-field dlg-field-full">
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
                <div v-if="editingResourceHasPin" class="flex items-center gap-2 mt-3">
                  <Checkbox v-model="formData.clearPublicPagePin" input-id="resourceListClearPublicPagePin" binary />
                  <label for="resourceListClearPublicPagePin" class="text-sm">{{ t('resources.publicPage.clearPin') }}</label>
                </div>
              </div>
            </div>
          </div>
        </form>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="closeDialog">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" @click="saveResource">
            <i class="pi pi-check" />{{ t('common.save') }}
          </button>
        </template>
      </AppDialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePlantsStore } from '@/stores/plants.store'
import { useResourcesStore } from '@/stores/resources.store'
import MainLayout from '@/layouts/MainLayout.vue'
import type { CreateResourceDto, UpdateResourceDto } from '@/types/resource'
import { ResourceStatus } from '@/types/enums'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import AppDialog from '@/components/common/AppDialog.vue'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Checkbox from 'primevue/checkbox'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { useAuthStore } from '@/stores/auth.store'

const { t } = useI18n()
const router = useRouter()
const plantsStore = usePlantsStore()
const resourcesStore = useResourcesStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const plantFilter = ref<string[]>([])
const typeFilter = ref<string[]>([])
const statusFilter = ref<string[]>([])
const showCreateDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const viewMode = ref<'card' | 'table'>(
  (localStorage.getItem('resources_view_mode') as 'card' | 'table') ?? 'card'
)

const setViewMode = (mode: 'card' | 'table') => {
  viewMode.value = mode
  localStorage.setItem('resources_view_mode', mode)
}

const statusOptions = computed(() => [
  { label: t('resources.status.available'), value: ResourceStatus.Available },
  { label: t('resources.status.inMaintenance'), value: ResourceStatus.InMaintenance }
])

const formData = ref<CreateResourceDto & { clearPublicPagePin?: boolean }>({
  plantId: null as any,
  resourceTypeId: null as any,
  name: '',
  description: '',
  capacity: undefined,
  status: ResourceStatus.Available,
  requiresApproval: false,
  publicPageEnabled: false,
  publicPagePin: '',
})

const editingResourceHasPin = computed(() => {
  if (!isEditing.value || !editingId.value) return false
  return Boolean(resourcesStore.resourceById(editingId.value)?.hasPublicPagePin)
})

const plants = computed(() => plantsStore.plants)
const resourceTypes = computed(() => resourcesStore.resourceTypes)

const filteredResources = computed(() => {
  const tenantId = authStore.currentTenantId
  return resourcesStore.resources
    .filter((r) => r.tenantId === tenantId)
    .map((r) => ({
      ...r,
      plantName: plantsStore.plantById(r.plantId)?.name ?? '',
      resourceTypeName: resourcesStore.resourceTypeById(r.resourceTypeId)?.name ?? '',
    }))
    .filter((resource) => {
      if (plantFilter.value.length > 0 && !plantFilter.value.includes(resource.plantId)) return false
      if (typeFilter.value.length > 0 && !typeFilter.value.includes(resource.resourceTypeId)) return false
      if (statusFilter.value.length > 0 && !statusFilter.value.includes(resource.status)) return false
      if (searchQuery.value && !resource.name.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
      return true
    })
})

const editResource = async (resource: any) => {
  isEditing.value = true
  editingId.value = resource.id
  formData.value = {
    plantId: resource.plantId != null ? String(resource.plantId) : '',
    resourceTypeId: resource.resourceTypeId ?? null,
    name: resource.name ?? '',
    description: resource.description ?? '',
    capacity: resource.capacity !== undefined && resource.capacity !== null ? Number(resource.capacity) : 0,
    status: resource.status ?? ResourceStatus.Available,
    requiresApproval: !!resource.requiresApproval,
    publicPageEnabled: !!resource.publicPageEnabled,
    publicPagePin: '',
    clearPublicPagePin: false,
  }
  showCreateDialog.value = true
  await nextTick()
}

const saveResource = async () => {
  try {
    const normalizedPin = normalizePublicPagePin(formData.value.publicPagePin)
    if (isEditing.value && editingId.value) {
      const dto: UpdateResourceDto = {
        ...formData.value,
        publicPagePin: normalizedPin,
        clearPublicPagePin: formData.value.clearPublicPagePin || undefined,
      }
      await resourcesStore.updateResource(editingId.value, dto)
      closeDialog()
    } else {
      const created = await resourcesStore.createResource({
        ...formData.value,
        publicPagePin: normalizedPin,
      })
      closeDialog()
      if (created?.id) {
        router.push({ name: 'ResourceDetail', params: { id: created.id } })
      }
    }
  } catch (error) {
    console.error('Error saving resource:', error)
  }
}

const normalizePublicPagePin = (pin?: string) => {
  const normalized = pin?.trim() || ''
  return normalized.length ? normalized : undefined
}

const deleteResource = async (id: string) => {
  if (confirm(t('resources.confirmDelete'))) {
    try {
      await resourcesStore.removeResource(id)
    } catch (error) {
      console.error('Error deleting resource:', error)
    }
  }
}

const closeDialog = () => {
  showCreateDialog.value = false
  isEditing.value = false
  editingId.value = null
  formData.value = {
    plantId: null as any,
    resourceTypeId: null as any,
    name: '',
    description: '',
    capacity: 0,
    status: ResourceStatus.Available,
    requiresApproval: false,
    publicPageEnabled: false,
    publicPagePin: '',
    clearPublicPagePin: false,
  }
}

onMounted(async () => {
  let tenantId = authStore.currentTenantId
  if (!tenantId) tenantId = localStorage.getItem('tenant_id') || ''
  await Promise.all([
    plantsStore.fetchAllByTenant(tenantId),
    resourcesStore.fetchAllResourcesByTenant(tenantId),
    resourcesStore.fetchAllResourceTypesByTenant(tenantId),
  ])
})

const plantOptions = computed(() =>
  plantsStore.plants.map((plant) => ({ label: plant.name, value: plant.id }))
)

const resourceTypeOptions = computed(() =>
  resourcesStore.resourceTypes.map((type) => ({ label: type.name, value: String(type.id) }))
)
</script>

<style scoped src="./ResourcesListView.css"></style>
