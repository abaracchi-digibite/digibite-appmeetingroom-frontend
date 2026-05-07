<template>
  <MainLayout>
    <div class="resources-container">
      <!-- Toolbar -->
      <div class="toolbar-section mb-4 p-4 rounded-lg" style="background-color: var(--bg-card);">
        <div class="flex flex-col gap-4">
          <div class="flex gap-3 flex-wrap">
            <IconField class="flex-1 min-w-64">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                :placeholder="t('common.search')"
                class="w-full search-input"
              />
            </IconField>
            <Button
              :label="t('resources.createNew')"
              icon="pi pi-plus"
              @click="showCreateDialog = true"
              size="small"
              class="btn-new"
            />
          </div>

          <!-- Filters -->
          <div class="flex gap-3 flex-wrap items-center">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-slate-700">{{ t('plants.title') }}:</label>
              <Dropdown
                v-model="plantFilter"
                :options="plants"
                option-:label="t('views.resourcesList.name')"
                option-value="id"
                :placeholder="t('common.all')"
                show-clear
                class="filter-dropdown"
              />
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-slate-700">{{ t('resources.type') }}:</label>
              <Dropdown
                v-model="typeFilter"
                :options="resourceTypes"
                option-:label="t('views.resourcesList.name')"
                option-value="id"
                :placeholder="t('common.all')"
                show-clear
                class="filter-dropdown"
              />
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-slate-700">{{ t('common.status') }}:</label>
              <!-- option-label / option-value: senza questi PrimeVue ritornava
                   l'intero oggetto {label, value}, mandando a vuoto il
                   confronto resource.status !== statusFilter (bug "filtro
                   sbagliato"). show-clear: aggiunto per consentire reset. -->
              <Dropdown
                v-model="statusFilter"
                :options="statusOptions"
                option-:label="t('views.resourcesList.label')"
                option-value="value"
                :placeholder="t('common.all')"
                show-clear
                class="filter-dropdown"
              />
            </div>
            <button
              v-if="plantFilter || typeFilter || statusFilter || searchQuery"
              type="button"
              class="filter-reset-btn"
              @click="resetFilters"
            >
              <i class="pi pi-refresh" /> {{ t('common.resetFilters') }}
            </button>
            <div class="ml-auto text-sm text-slate-600">
              {{ filteredResources.length }} {{ t('common.results') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="resourcesStore.error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center mb-6 flex items-center gap-2 justify-center">
        <i class="pi pi-exclamation-circle"></i>
        {{ t('errors.loadFailed') }}
      </div>

      <!-- Loading State -->
      <div v-if="resourcesStore.loading" class="flex justify-center items-center h-96">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl mb-4" style="color: #2563EB;"></i>
          <p class="text-slate-600">{{ t('common.loading') }}</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredResources.length === 0" class="flex justify-center items-center h-96 rounded-lg" style="background-color: var(--bg-page);">
        <div class="text-center">
          <i class="pi pi-inbox text-6xl mb-4" style="color: #9CA3AF;"></i>
          <p class="text-slate-600 text-lg">{{ t('common.noResults') }}</p>
        </div>
      </div>

      <!-- Cards Grid -->
      <div v-else class="cards-grid">
        <div
          v-for="resource in filteredResources"
          :key="resource.id"
          class="card"
          style="background-color: var(--bg-card); border: 1px solid var(--border-default);"
        >
          <!-- Card Header -->
          <div class="card-header">
            <div class="flex items-start justify-between">
              <div class="icon-badge mr-2">
                <i class="pi pi-box"></i>
              </div>
              <div>
                <h3 class="card-title">{{ resource.name }}</h3>
                <p class="text-xs text-slate-500 mt-1">ID: {{ resource.id?.substring(0, 8) }}</p>
              </div>
            </div>
          </div>

          <!-- Card Content -->
          <div class="card-content">
            <!-- Site -->
            <div class="info-row" v-if="plantsStore.plantById(resource.plantId)">
              <i class="pi pi-building info-icon"></i>
              <div class="info-text">
                <p class="text-xs text-slate-500 uppercase tracking-wide">{{ t('resources.site') }}</p>
                <p class="text-sm font-medium text-slate-900">{{ plantsStore.plantById(resource.plantId)?.name }}</p>
              </div>
            </div>

            <!-- Resource Type -->
            <div class="info-row" v-if="resourcesStore.resourceTypeById(resource.resourceTypeId)">
              <i class="pi pi-tag info-icon"></i>
              <div class="info-text">
                <p class="text-xs text-slate-500 uppercase tracking-wide">{{ t('resources.type') }}</p>
                <p class="text-sm font-medium text-slate-900">{{ resourcesStore.resourceTypeById(resource.resourceTypeId)?.name }}</p>
              </div>
            </div>

            <!-- Capacity -->
            <div class="info-row" v-if="resource.capacity">
              <i class="pi pi-users info-icon"></i>
              <div class="info-text">
                <p class="text-xs text-slate-500 uppercase tracking-wide">{{ t('resources.capacity') }}</p>
                <p class="text-sm font-medium text-slate-900">{{ resource.capacity }} {{ t('common.people') }}</p>
              </div>
            </div>

            <!-- Description -->
            <div class="info-row" v-if="resource.description">
              <i class="pi pi-align-left info-icon"></i>
              <div class="info-text">
                <p class="text-xs text-slate-500 uppercase tracking-wide">{{ t('common.description') }}</p>
                <p class="text-sm text-slate-700 line-clamp-2">{{ resource.description }}</p>
              </div>
            </div>

            <!-- Status & Approval -->
            <div class="mt-4 pt-4 border-t" style="border-color: var(--border-default);">
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span
                    class="status-badge"
                    :style="{
                      backgroundColor: resource.status === 'Available' ? '#D1FAE5' : '#FEF3C7',
                      color: resource.status === 'Available' ? '#065F46' : '#92400E',
                    }"
                  >
                    <i :class="resource.status === 'Available' ? 'pi pi-check-circle' : 'pi pi-wrench'"></i>
                    {{ resource.status }}
                  </span>
                </div>
                <div v-if="resource.requiresApproval" class="flex items-center justify-between">
                  <span
                    class="status-badge"
                    style="
                      background-color: rgba(124, 58, 237, 0.15);
                      color: #6d28d9;
                    "
                  >
                    <i class="pi pi-check"></i>
                    {{ t('resources.approvalRequired') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="card-actions">
            <Button
              icon="pi pi-pencil"
              rounded
              severity="info"
              text
              @click="editResource(resource)"
              :title="t('common.edit')"
              class="action-btn"
            />
            <Button
              icon="pi pi-trash"
              rounded
              severity="danger"
              text
              @click="deleteResource(resource.id)"
              :title="t('common.delete')"
              class="action-btn"
            />
          </div>
        </div>
      </div>

      <!-- Create/Edit Dialog -->
      <AppDialog
        v-model:visible="showCreateDialog"
        :header="isEditing ? t('resources.editTitle') : t('resources.createNew')"
        :subtitle="isEditing ? formData.name : t('resources.createNewHint')"
        :icon="isEditing ? 'pi pi-pencil' : 'pi pi-plus-circle'"
        severity="primary"
        size="lg"
    >
      <form @submit.prevent="saveResource" class="dlg-form">
        <!-- Section: General -->
        <div class="dlg-section">
          <div class="dlg-section-title">
            <i class="pi pi-info-circle" />{{ t('resources.generalInfo') }}</div>

          <div class="dlg-fields-2">
            <div class="dlg-field dlg-field-full">
              <label class="dlg-label">{{ t('common.name') }}</label>
              <InputText v-model="formData.name" class="w-full" />
            </div>

            <div class="dlg-field">
              <label class="dlg-label">{{ t('resources.site') }}</label>
              <Dropdown
                  v-model="formData.plantId"
                  :options="plantOptions"
                  :optionLabel="t('views.resourcesList.label')"
                  optionValue="value"
                  class="w-full"
              />
            </div>

            <div class="dlg-field">
              <label class="dlg-label">{{ t('resources.type') }}</label>
              <Dropdown
                  v-model="formData.resourceTypeId"
                  :options="resourceTypeOptions"
                  :optionLabel="t('views.resourcesList.label')"
                  optionValue="value"
                  class="w-full"
              />
            </div>

            <div class="dlg-field">
              <label class="dlg-label">{{ t('resources.capacity') }}</label>
              <InputNumber v-model="formData.capacity" class="w-full" />
            </div>
          </div>
        </div>

        <!-- Section: Status -->
        <div class="dlg-section dlg-section-status">
          <div class="dlg-section-title">
            <i class="pi pi-cog" />{{ t('resources.statusLabel') }}</div>

          <div class="dlg-fields-2">
            <div class="dlg-field dlg-field-full">
              <label class="dlg-label">{{ t('common.status') }}</label>
              <Dropdown
                  v-model="formData.status"
                  :options="statusOptions"
                  :optionLabel="t('views.resourcesList.label')"
                  optionValue="value"
                  class="w-full"
              />
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
            <i class="pi pi-tablet" />{{ t('resources.publicPage.title') }}</div>

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
          <i class="pi pi-times" />{{ t('common.cancel') }}</button>
        <button type="button" class="dialog-btn dialog-btn-save" @click="saveResource">
          <i class="pi pi-check" />{{ t('common.save') }}</button>
      </template>
    </AppDialog>

    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePlantsStore } from '@/stores/plants.store'
import { useResourcesStore } from '@/stores/resources.store'
import MainLayout from '@/layouts/MainLayout.vue'
import type {CreateResourceDto, UpdateResourceDto} from '@/types/resource'
import { ResourceStatus } from '@/types/enums'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import AppDialog from '@/components/common/AppDialog.vue'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { useAuthStore } from '@/stores/auth.store'

const { t } = useI18n()
const router = useRouter()
const plantsStore = usePlantsStore()
const resourcesStore = useResourcesStore()
const authStore = useAuthStore()

// State
const searchQuery = ref('')
const plantFilter = ref<string | null>(null)
const typeFilter = ref<string | null>(null)
const statusFilter = ref<string | null>(null)
const showCreateDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

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

// Computed
const plants = computed(() => plantsStore.plants)
const resourceTypes = computed(() => resourcesStore.resourceTypes)

// Mostra solo le risorse del tenant corrente
const filteredResources = computed(() => {
  const tenantId = authStore.currentTenantId
  return resourcesStore.resources.filter(r => r.tenantId === tenantId)
    .filter(resource => {
      // Applica anche i filtri di ricerca gi- presenti
      if (plantFilter.value && resource.plantId !== plantFilter.value) return false
      if (typeFilter.value && resource.resourceTypeId !== typeFilter.value) return false
      if (statusFilter.value && resource.status !== statusFilter.value) return false
      if (searchQuery.value && !resource.name.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
      return true
    })
})

// Methods

/** Azzera tutti i filtri della pagina (sede / tipo / stato / ricerca testuale). */
const resetFilters = (): void => {
  plantFilter.value  = null
  typeFilter.value   = null
  statusFilter.value = null
  searchQuery.value  = ''
}

const editResource = async (resource: any) => {
  isEditing.value = true
  editingId.value = resource.id

  formData.value = {
    plantId: resource.plantId != null ? String(resource.plantId) : '',
    resourceTypeId: resource.resourceTypeId ?? null,
    name: resource.name ?? '',
    description: resource.description ?? '',
    capacity: resource.capacity !== undefined && resource.capacity !== null
        ? Number(resource.capacity)
        : 0,
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
      // Redirect al dettaglio per gestire i campi personalizzati
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

// Lifecycle
onMounted(async () => {
  let tenantId = authStore.currentTenantId
  // Se il valore - null, prova a forzare stringa vuota o gestisci errore
  if (!tenantId) {
    // Prova a caricare da localStorage come fallback
    tenantId = localStorage.getItem('tenant_id') || ''
  }
  await Promise.all([
    plantsStore.fetchAllByTenant(tenantId),
    resourcesStore.fetchAllResourcesByTenant(tenantId),
    resourcesStore.fetchAllResourceTypesByTenant(tenantId),
  ])
})

const plantOptions = computed(() =>
    plantsStore.plants.map((plant) => ({
      label: plant.name,
      value: plant.id,
    }))
)

const resourceTypeOptions = computed(() =>
    resourcesStore.resourceTypes.map((type) => ({
      label: type.name,
      value: String(type.id),
    }))
)
</script>

<style scoped src="./ResourcesListView.css"></style>
