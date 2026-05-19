<template>
  <MainLayout>
    <div class="list-page">

      <!-- Error: mostrato solo se NESSUN dato è caricato -->
      <div v-if="plantsStore.error && filteredPlants.length === 0 && !plantsStore.loading" class="list-error">
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
            <span>{{ t('plants.createNew') }}</span>
          </button>
        </div>

        <div class="list-row-secondary">
          <div class="list-filters-group">
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
            <span class="list-count-flat">{{ filteredPlants.length }} {{ t('common.results') }}</span>
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
      <div v-if="plantsStore.loading" class="list-loading">
        <i class="pi pi-spin pi-spinner" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="filteredPlants.length === 0" class="list-empty">
        <i class="pi pi-inbox" />
        <p>{{ t('common.noResults') }}</p>
      </div>

      <!-- ── Tabella ──────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
        <DataTable :value="filteredPlants" responsiveLayout="scroll" stripedRows class="list-table">
          <Column field="name" :header="t('plants.name')" :sortable="true" style="width: 25%">
            <template #body="{ data }">
              <span class="list-cell-strong">{{ data.name }}</span>
            </template>
          </Column>

          <Column field="city" :header="t('plants.city')" :sortable="true" style="width: 18%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ data.city || '—' }}</span>
            </template>
          </Column>

          <Column field="country" :header="t('plants.country')" :sortable="true" style="width: 18%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ data.country || '—' }}</span>
            </template>
          </Column>

          <Column field="timeZone" :header="t('plants.timezone')" :sortable="true" style="width: 14%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ data.timeZone }}</span>
            </template>
          </Column>

          <Column field="isActive" :header="t('common.status')" :sortable="true" style="width: 12%">
            <template #body="{ data }">
              <Tag :value="data.isActive ? t('plants.active') : t('common.inactive')" :severity="data.isActive ? 'success' : 'danger'" />
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 130px" class="list-col-actions">
            <template #body="{ data }">
              <div class="list-row-actions">
                <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="editPlant(data)">
                  <i class="pi pi-pencil" />
                </button>
                <button type="button" class="list-action-btn list-action-edit" :title="data.isActive ? t('common.pause') : t('common.activate')" @click="toggleStatus(data)">
                  <i :class="data.isActive ? 'pi pi-pause' : 'pi pi-play'" />
                </button>
                <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deletePlant(data.id)">
                  <i class="pi pi-trash" />
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ── Cards ────────────────────────────────────────────────── -->
      <div v-else class="list-cards-grid">
        <article v-for="site in filteredPlants" :key="site.id" class="list-card">
          <div class="list-card-head">
            <h3 class="list-card-title">{{ site.name }}</h3>
            <Tag :value="site.isActive ? t('plants.active') : t('common.inactive')" :severity="site.isActive ? 'success' : 'danger'" />
          </div>
          <div class="list-card-info">
            <div v-if="site.address" class="list-card-info-row">
              <i class="pi pi-map-marker" />
              <span>{{ site.address }}</span>
            </div>
            <div v-if="site.city || site.country" class="list-card-info-row">
              <i class="pi pi-flag" />
              <span>
                <span v-if="site.city">{{ site.city }}</span><span v-if="site.city && site.country">, </span><span v-if="site.country">{{ site.country }}</span>
              </span>
            </div>
            <div v-if="site.timeZone" class="list-card-info-row">
              <i class="pi pi-clock" />
              <span>{{ site.timeZone }}</span>
            </div>
            <div v-if="site.defaultOperatingHours" class="list-card-info-row">
              <i class="pi pi-sun" />
              <span>{{ site.defaultOperatingHours }}</span>
            </div>
          </div>
          <div class="list-card-actions">
            <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="editPlant(site)">
              <i class="pi pi-pencil" />
            </button>
            <button type="button" class="list-action-btn list-action-edit" :title="site.isActive ? t('common.pause') : t('common.activate')" @click="toggleStatus(site)">
              <i :class="site.isActive ? 'pi pi-pause' : 'pi pi-play'" />
            </button>
            <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deletePlant(site.id)">
              <i class="pi pi-trash" />
            </button>
          </div>
        </article>
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
              <PrimeToggleSwitch v-model="formData.isActive" input-id="isActive" />
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
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import AppDialog from '@/components/common/AppDialog.vue'
import PrimeToggleSwitch from 'primevue/toggleswitch'
import MultiSelect from 'primevue/multiselect'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const { t } = useI18n()
const plantsStore = usePlantsStore()

// Timezone fisso: tutti i plant usano Europe/Rome (decisione di prodotto).
// Il backend defaulta già a Europe/Rome (Plant.cs); qui forziamo lo stesso
// valore in create e in edit per garantire coerenza dei timestamp UI/ICS.
const PLANT_TIMEZONE = 'Europe/Rome'

// State
const searchQuery = ref('')
const statusFilter = ref<boolean[]>([])
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
  timeZone: PLANT_TIMEZONE,
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

  if (statusFilter.value.length > 0) {
    result = result.filter((plant) => statusFilter.value.includes(plant.isActive))
  }

  return result
})

const editPlant = (plant: Plant) => {
  isEditing.value = true
  editingId.value = plant.id
  formData.value = {
    name: plant.name,
    address: plant.address,
    city: plant.city,
    country: plant.country,
    // Forziamo Europe/Rome anche in modifica: tutti i plant del sistema
    // operano sullo stesso fuso, e l'eventuale valore storico va normalizzato.
    timeZone: PLANT_TIMEZONE,
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
    timeZone: PLANT_TIMEZONE,
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

</script>

<style scoped src="./SitesListView.css"></style>
