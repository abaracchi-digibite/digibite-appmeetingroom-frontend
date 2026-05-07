<template>
  <MainLayout>
    <div class="sites-container">
      <!-- Toolbar -->
      <div class="toolbar-section mb-4 p-4 rounded-lg" style="background-color: var(--bg-card);">
        <div class="flex flex-col gap-4">
          <div class="flex gap-3 flex-wrap items-center">
            <IconField class="flex-1 min-w-64">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                :placeholder="t('common.search')"
                class="w-full search-input"
                @input="onSearchChange"
              />
            </IconField>

            <!-- View toggle -->
            <div class="flex gap-1 p-1 rounded-lg" style="background: var(--bg-page); border: 1px solid var(--border-default);">
              <button
                class="px-2 py-1 rounded-md text-sm transition-all"
                :class="viewMode === 'table' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700'"
                :style="viewMode === 'table' ? 'background: var(--bg-card);' : ''"
                @click="setViewMode('table')"
                :title="t('common.viewTable')"
              >
                <i class="pi pi-list text-sm" />
              </button>
              <button
                class="px-2 py-1 rounded-md text-sm transition-all"
                :class="viewMode === 'card' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700'"
                :style="viewMode === 'card' ? 'background: var(--bg-card);' : ''"
                @click="setViewMode('card')"
                :title="t('common.viewCards')"
              >
                <i class="pi pi-th-large text-sm" />
              </button>
            </div>

            <Button
              :label="t('plants.createNew')"
              icon="pi pi-plus"
              @click="showCreateDialog = true"
              size="small"
              class="btn-new"
            />
          </div>

          <!-- Filters -->
          <div class="flex gap-3 flex-wrap items-center">
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-slate-700">{{ t('common.status') }}:</label>
              <Dropdown
                v-model="statusFilter"
                :options="statusOptions"
                option-:label="t('views.sitesList.label')"
                option-value="value"
                :placeholder="t('common.filter')"
                class="filter-dropdown"
                @change="onFilterChange"
              />
            </div>
            <div class="ml-auto text-sm text-slate-600">
              {{ filteredPlants.length }} {{ t('common.results') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="plantsStore.error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center mb-6 flex items-center gap-2 justify-center">
        <i class="pi pi-exclamation-circle"></i>
        {{ t('errors.loadFailed') }}
      </div>

      <!-- Loading State -->
      <div v-if="plantsStore.loading" class="flex justify-center items-center h-96">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl mb-4" style="color: #2563EB;"></i>
          <p class="text-slate-600">{{ t('common.loading') }}</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredPlants.length === 0" class="flex justify-center items-center h-96 rounded-lg" style="background-color: var(--bg-page);">
        <div class="text-center">
          <i class="pi pi-inbox text-6xl mb-4" style="color: #9CA3AF;"></i>
          <p class="text-slate-600 text-lg">{{ t('common.noResults') }}</p>
        </div>
      </div>

      <!-- Cards Grid or Table View -->
      <div v-else>
        <!-- Card View -->
        <div v-if="viewMode === 'card'" class="cards-grid">
          <div
            v-for="site in filteredPlants"
            :key="site.id"
            class="card"
            style="background-color: var(--bg-card); border: 1px solid var(--border-default);"
          >
            <!-- Card Header Colored Strip -->
            <div class="card-header">
              <div class="flex items-start justify-between">
                <div class="icon-badge mr-2">
                  {{ getPlantInitials(site.name) }}
                </div>
                <div>
                  <h3 class="card-title">{{ site.name }}</h3>
                  <p class="text-xs text-slate-500 mt-1">{{ t('common.idLabel') }} {{ site.id?.substring(0, 8) }}</p>
                </div>
              </div>
            </div>

            <!-- Card Content -->
            <div class="card-content">
              <!-- Address -->
              <div class="info-row" v-if="site.address">
                <i class="pi pi-map-marker info-icon"></i>
                <div class="info-text">
                  <p class="text-xs text-slate-500 uppercase tracking-wide">{{ t('plants.address') }}</p>
                  <p class="text-sm font-medium text-slate-900">{{ site.address }}</p>
                </div>
              </div>

              <!-- City & Country -->
              <div class="info-row" v-if="site.city || site.country">
                <i class="pi pi-flag info-icon"></i>
                <div class="info-text">
                  <p class="text-xs text-slate-500 uppercase tracking-wide">{{ t('common.location') }}</p>
                  <p class="text-sm font-medium text-slate-900">
                    <span v-if="site.city">{{ site.city }}</span>
                    <span v-if="site.city && site.country">, </span>
                    <span v-if="site.country">{{ site.country }}</span>
                  </p>
                </div>
              </div>

              <!-- Timezone -->
              <div class="info-row" v-if="site.timeZone">
                <i class="pi pi-clock info-icon"></i>
                <div class="info-text">
                  <p class="text-xs text-slate-500 uppercase tracking-wide">{{ t('plants.timezone') }}</p>
                  <p class="text-sm font-medium text-slate-900">{{ site.timeZone }}</p>
                </div>
              </div>

              <!-- Operating Hours -->
              <div class="info-row" v-if="site.defaultOperatingHours">
                <i class="pi pi-sun info-icon"></i>
                <div class="info-text">
                  <p class="text-xs text-slate-500 uppercase tracking-wide">{{ t('plants.operatingHours') }}</p>
                  <p class="text-sm font-medium text-slate-900">{{ site.defaultOperatingHours }}</p>
                </div>
              </div>

              <!-- Status Badge -->
              <div class="mt-4 pt-4 border-t" style="border-color: var(--border-default);">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="status-badge"
                      :style="{
                        backgroundColor: site.isActive ? '#D1FAE5' : '#FEE2E2',
                        color: site.isActive ? '#065F46' : '#7F1D1D',
                      }"
                    >
                      <i :class="site.isActive ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                      {{ site.isActive ? t('plants.active') : t('common.inactive') }}
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
                @click="editPlant(site)"
                :title="t('common.edit')"
                class="action-btn"
              />
              <Button
                icon="pi pi-trash"
                rounded
                severity="danger"
                text
                @click="deletePlant(site.id)"
                :title="t('common.delete')"
                class="action-btn"
              />
              <Button
                :icon="site.isActive ? 'pi pi-pause' : 'pi pi-play'"
                rounded
                :severity="site.isActive ? 'warning' : 'success'"
                text
                @click="toggleStatus(site)"
                :title="site.isActive ? t('common.pause') : t('common.activate')"
                class="action-btn"
              />
            </div>
          </div>
        </div>

        <!-- Table View -->
        <div v-else>
          <DataTable :value="filteredPlants" responsiveLayout="scroll" stripedRows showGridlines>
            <template #empty>
              <div class="text-center py-8">
                <i class="pi pi-inbox text-4xl mb-3" style="color: #cbd5e1;"></i>
                <p style="color: #64748b;">{{ t('common.noData') }}</p>
              </div>
            </template>

            <Column field="name" :header="t('plants.name')" sortable style="width: 25%">
              <template #body="{ data }">
                <span style="color: #0f172a; font-weight: 500;">{{ data.name }}</span>
              </template>
            </Column>

            <Column field="city" :header="t('plants.city')" sortable style="width: 20%">
              <template #body="{ data }">
                <span style="color: #0f172a;">{{ data.city || '-' }}</span>
              </template>
            </Column>

            <Column field="country" :header="t('plants.country')" sortable style="width: 20%">
              <template #body="{ data }">
                <span style="color: #0f172a;">{{ data.country || '-' }}</span>
              </template>
            </Column>

            <Column field="timeZone" :header="t('plants.timezone')" sortable style="width: 15%">
              <template #body="{ data }">
                <span style="color: #0f172a;">{{ data.timeZone }}</span>
              </template>
            </Column>

            <Column field="isActive" :header="t('common.status')" sortable style="width: 12%">
              <template #body="{ data }">
                <Tag :value="data.isActive ? t('plants.active') : t('common.inactive')" :severity="data.isActive ? 'success' : 'danger'" />
              </template>
            </Column>

            <Column :header="t('common.actions')" style="width: 180px">
              <template #body="{ data }">
                <div class="table-actions">
                  <Button
                      icon="pi pi-pencil"
                      @click="editPlant(data)"
                      outlined
                      severity="warning"
                      size="small"
                  />
                  <Button
                      icon="pi pi-trash"
                      @click="deletePlant(data.id)"
                      outlined
                      severity="danger"
                      size="small"
                  />
                  <Button
                      :icon="data.isActive ? 'pi pi-pause' : 'pi pi-play'"
                      @click="toggleStatus(data)"
                      outlined
                      :severity="data.isActive ? 'warning' : 'success'"
                      size="small"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- Create/Edit Dialog -->
      <AppDialog
          v-model:visible="showCreateDialog"
          :header="isEditing ? t('common.edit') : t('plants.createNew')"
          :subtitle="formData.name || t('plants.description')"
          :icon="isEditing ? 'pi pi-pencil' : 'pi pi-plus-circle'"
          severity="primary"
          size="lg"
      >
        <form @submit.prevent="savePlant" class="dlg-form">
          <!-- Section: General -->
          <div class="dlg-section">
            <div class="dlg-section-title">
              <i class="pi pi-info-circle" />
               {{ t('plants.generalInfo') }}
            </div>

            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">
                  {{ t('plants.name') }} <span class="req">*</span>
                </label>
                <InputText
                    v-model="formData.name"
                    :placeholder="t('plants.name')"
                    class="w-full"
                    @blur="v$.name.$touch()"
                />
                <small v-if="v$.name.$error" class="dlg-error">
                  {{ t('common.error') }}: {{ t('plants.name') }}
                </small>
              </div>

              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('plants.address') }}</label>
                <InputText
                    v-model="formData.address"
                    :placeholder="t('plants.address')"
                    class="w-full"
                />
              </div>

              <div class="dlg-field">
                <label class="dlg-label">{{ t('plants.city') }}</label>
                <InputText
                    v-model="formData.city"
                    :placeholder="t('plants.city')"
                    class="w-full"
                />
              </div>

              <div class="dlg-field">
                <label class="dlg-label">{{ t('plants.country') }}</label>
                <InputText
                    v-model="formData.country"
                    :placeholder="t('plants.country')"
                    class="w-full"
                />
              </div>

              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('plants.operatingHours') }}</label>
                <InputText
                    v-model="formData.defaultOperatingHours"
                    placeholder="09:00-18:00"
                    class="w-full"
                />
              </div>

              <div class="dlg-field dlg-field-full">
                <label class="dlg-label"><i class="pi pi-link" /> {{ t('plants.appReceptionPlantId') }}</label>
                <InputNumber
                    v-model="formData.appReceptionPlantId"
                    :useGrouping="false"
                    :min="0"
                    placeholder="—"
                    class="w-full"
                />
                <small class="dlg-help">{{ t('plants.appReceptionPlantIdHelp') }}</small>
              </div>
            </div>
          </div>

          <!-- Section: Status -->
          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">{{ t('plants.active') }}</div>
                <div class="dlg-status-desc">{{ t('plants.activeHelp') }}</div>
              </div>
              <Checkbox v-model="formData.isActive" input-id="isActive" binary />
            </div>
          </div>
        </form>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="closeDialog">
            <i class="pi pi-times" /> {{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" @click="savePlant">
            <i class="pi pi-check" />
            {{ t('common.save') }}
          </button>
        </template>
      </AppDialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { usePlantsStore } from '@/stores/plants.store'
import MainLayout from '@/layouts/MainLayout.vue'
import type { Plant, CreatePlantDto, UpdatePlantDto } from '@/types/plant'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import AppDialog from '@/components/common/AppDialog.vue'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const { t } = useI18n()
const plantsStore = usePlantsStore()

// State
const searchQuery = ref('')
const statusFilter = ref<boolean | null>(null)
const showCreateDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const viewMode = ref<'card' | 'table'>(
  (localStorage.getItem('sites_view_mode') as 'card' | 'table') ?? 'card'
)

const statusOptions = [
  { label: t('plants.active'), value: true },
  { label: t('common.inactive'), value: false },
]

const formData = ref<CreatePlantDto>({
  name: '',
  address: '',
  city: '',
  country: '',
  timeZone: 'UTC',
  isActive: true,
  defaultOperatingHours: '',
  appReceptionPlantId: null,
})

// Validation
const rules = {
  name: { required },
  timeZone: { required },
}

const v$ = useVuelidate(rules, formData as any)

// Computed
const filteredPlants = computed(() => {
  let result = plantsStore.plants

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (plant) =>
        plant.name.toLowerCase().includes(query) ||
        plant.address?.toLowerCase().includes(query) ||
        plant.city?.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value !== null) {
    result = result.filter((plant) => plant.isActive === statusFilter.value)
  }

  return result
})

// Methods
const onSearchChange = () => {
  // Debounce could be added here
}

const onFilterChange = () => {
  // Filter is already applied through computed
}

const editPlant = (plant: Plant) => {
  isEditing.value = true
  editingId.value = plant.id
  formData.value = {
    name: plant.name,
    address: plant.address,
    city: plant.city,
    country: plant.country,
    timeZone: plant.timeZone,
    isActive: plant.isActive,
    defaultOperatingHours: plant.defaultOperatingHours,
    appReceptionPlantId: plant.appReceptionPlantId ?? null,
  }
  showCreateDialog.value = true
}

const savePlant = async () => {
  const isFormValid = await v$.value.$validate()
  if (!isFormValid) return

  try {
    if (isEditing.value && editingId.value) {
      const dto: UpdatePlantDto = formData.value
      await plantsStore.update(editingId.value, dto)
    } else {
      await plantsStore.create(formData.value)
    }
    closeDialog()
  } catch (error) {
    console.error('Error saving plant:', error)
  }
}

const deletePlant = async (id: string) => {
  if (confirm(t('plants.confirmDelete'))) {
    try {
      await plantsStore.remove(id)
    } catch (error) {
      console.error('Error deleting plant:', error)
    }
  }
}

const toggleStatus = async (plant: Plant) => {
  try {
    const dto: UpdatePlantDto = {
      isActive: !plant.isActive,
    }
    await plantsStore.update(plant.id, dto)
  } catch (error) {
    console.error('Error toggling status:', error)
  }
}

const closeDialog = () => {
  showCreateDialog.value = false
  isEditing.value = false
  editingId.value = null
  formData.value = {
    name: '',
    address: '',
    city: '',
    country: '',
    timeZone: 'UTC',
    isActive: true,
    defaultOperatingHours: '',
    appReceptionPlantId: null,
  }
  v$.value.$reset()
}

const setViewMode = (mode: 'card' | 'table') => {
  viewMode.value = mode
  localStorage.setItem('sites_view_mode', mode)
}

// Lifecycle
onMounted(async () => {
  try {
    await plantsStore.fetchAll()
  } catch (error) {
    console.error('Error fetching plants:', error)
  }
})

const getPlantInitials = (name: string): string => {
  if (!name) return 'ST'

  const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
}
</script>

<style scoped src="./SitesListView.css"></style>
