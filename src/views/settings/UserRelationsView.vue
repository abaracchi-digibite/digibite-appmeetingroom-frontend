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
          <button
            v-if="canManageRelations"
            type="button"
            class="list-btn-primary"
            @click="openAssignDialog"
          >
            <i class="pi pi-plus" />
            <span>{{ t('permissions.assign') }}</span>
          </button>
        </div>

        <div class="list-row-secondary">
          <div class="list-filter-inline">
            <label class="list-filter-label-inline">{{ t('permissions.objectType') }}</label>
            <MultiSelect
              v-model="objectTypeFilter"
              :options="objectTypeOptions"
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
            <span class="list-count-flat">{{ filteredRelations.length }} {{ t('common.results') }}</span>
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

      <!-- Loading -->
      <div v-if="loading" class="list-loading">
        <i class="pi pi-spin pi-spinner" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredRelations.length === 0" class="list-empty">
        <i class="pi pi-inbox" />
        <p>{{ t('permissions.emptyState') }}</p>
      </div>

      <!-- ── Tabella ──────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
        <DataTable
          :value="filteredRelations"
          dataKey="id"
          responsiveLayout="scroll"
          stripedRows
          paginator
          :rows="15"
          class="list-table"
        >
          <Column field="userLabel" :header="t('permissions.user')" :sortable="true" style="width: 26%">
            <template #body="{ data }">
              <span class="list-cell-strong">{{ getUserLabel(data.userId) }}</span>
            </template>
          </Column>

          <Column field="relationLabel" :header="t('permissions.relation')" :sortable="true" style="width: 20%">
            <template #body="{ data }">
              <Tag :value="getRelationLabel(data.objectType, data.relation)" severity="info" />
            </template>
          </Column>

          <Column field="objectLabel" :header="t('permissions.object')" :sortable="true" style="width: 26%">
            <template #body="{ data }">
              <div>
                <span class="list-cell-strong">{{ getObjectLabel(data.objectType, data.objectId) }}</span>
                <small style="display:block; color: var(--text-muted, #94a3b8);">{{ getObjectTypeLabel(data.objectType) }}</small>
              </div>
            </template>
          </Column>

          <Column field="createdAt" :header="t('common.createdAt')" :sortable="true" style="width: 16%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ formatDate(data.createdAt) }}</span>
            </template>
          </Column>

          <Column v-if="canManageRelations" :header="t('common.actions')" style="width: 90px" class="list-col-actions">
            <template #body="{ data }">
              <div class="list-row-actions">
                <button
                  type="button"
                  class="list-action-btn list-action-delete"
                  :title="t('permissions.removeRelation')"
                  @click="removeRelation(data)"
                >
                  <i class="pi pi-trash" />
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ── Cards ────────────────────────────────────────────────── -->
      <div v-else class="list-cards-grid">
        <article v-for="rel in filteredRelations" :key="rel.id" class="list-card">
          <div class="list-card-head">
            <h3 class="list-card-title">{{ getUserLabel(rel.userId) }}</h3>
            <Tag :value="getRelationLabel(rel.objectType, rel.relation)" severity="info" />
          </div>
          <div class="list-card-info">
            <div class="list-card-info-row">
              <i class="pi pi-tag" />
              <span>{{ getObjectTypeLabel(rel.objectType) }}</span>
            </div>
            <div class="list-card-info-row">
              <i class="pi pi-box" />
              <span>{{ getObjectLabel(rel.objectType, rel.objectId) }}</span>
            </div>
            <div class="list-card-info-row">
              <i class="pi pi-calendar" />
              <span>{{ formatDate(rel.createdAt) }}</span>
            </div>
          </div>
          <div v-if="canManageRelations" class="list-card-actions">
            <button
              type="button"
              class="list-action-btn list-action-delete"
              :title="t('permissions.removeRelation')"
              @click="removeRelation(rel)"
            >
              <i class="pi pi-trash" />
            </button>
          </div>
        </article>
      </div>

      <PrimeDialog
        v-model:visible="showAssignDialog"
        modal
        :header="t('permissions.assignDialogTitle')"
        :style="{ width: '580px' }"
      >
        <form class="assign-form" @submit.prevent="saveAssign">
          <div class="assign-grid">
            <div class="assign-field">
              <label class="assign-label required">{{ t('permissions.user') }}</label>
              <PrimeDropdown
                v-model="assignForm.userId"
                :options="userOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
                :filter="true"
                :placeholder="t('permissions.selectUser')"
              />
            </div>

            <div class="assign-field">
              <label class="assign-label required">{{ t('permissions.objectType') }}</label>
              <PrimeDropdown
                v-model="assignForm.objectType"
                :options="objectTypeOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
                :placeholder="t('permissions.selectObjectType')"
              />
            </div>

            <div class="assign-field">
              <label class="assign-label required">{{ t('permissions.relation') }}</label>
              <PrimeDropdown
                v-model="assignForm.relation"
                :options="relationOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
                :placeholder="t('permissions.selectRelationType')"
                :disabled="!assignForm.objectType"
              />
            </div>

            <div class="assign-field" v-if="assignForm.objectType">
              <label class="assign-label required">{{ t('permissions.object') }}</label>

              <div v-if="assignForm.objectType === 'tenant'" class="assign-readonly">
                <i class="pi pi-building" />
                <span>{{ t('permissions.currentTenant') }}</span>
              </div>

              <PrimeDropdown
                v-else-if="assignForm.objectType !== 'booking'"
                v-model="assignForm.objectId"
                :options="objectOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
                :filter="true"
                :loading="loadingObjects"
                :placeholder="loadingObjects ? t('common.loading') : t('permissions.selectObject')"
              />

              <input
                v-else
                v-model="assignForm.objectId"
                type="text"
                class="assign-input"
                :placeholder="t('permissions.bookingPlaceholder')"
              />
            </div>
          </div>

          <p v-if="formError" class="assign-error">{{ formError }}</p>

          <div class="assign-actions">
            <PrimeButton :label="t('common.cancel')" text @click="showAssignDialog = false" />
            <PrimeButton
              type="submit"
              :label="t('common.save')"
              icon="pi pi-check"
              :loading="saving"
              :disabled="!canSubmitAssign"
              class="relations-primary-btn"
            />
          </div>
        </form>
      </PrimeDialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import PrimeButton from 'primevue/button'
import PrimeDialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import PrimeDropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import MainLayout from '@/layouts/MainLayout.vue'
import { permissionsApi, type UserRelationResponse } from '@/api/permissions.api'
import { useAuthStore } from '@/stores/auth.store'
import { usePlantsStore } from '@/stores/plants.store'
import { useResourcesStore } from '@/stores/resources.store'
import { useUsersStore } from '@/stores/users.store'
import {
  getRebacObjectLabel,
  getRebacRelationLabel,
  getRebacRelationsForObject,
  rebacObjectOptions,
} from '@/features/rebac/rebac-catalog'

const { t } = useI18n()
const toast = useToast()

const authStore = useAuthStore()
const usersStore = useUsersStore()
const plantsStore = usePlantsStore()
const resourcesStore = useResourcesStore()

const relations = ref<UserRelationResponse[]>([])
const loading = ref(false)
const saving = ref(false)
const loadingObjects = ref(false)
const searchQuery = ref('')
const objectTypeFilter = ref<string[]>([])
const showAssignDialog = ref(false)
const formError = ref<string | null>(null)
const viewMode = ref<'card' | 'table'>(
  (localStorage.getItem('user_relations_view_mode') as 'card' | 'table') ?? 'table'
)

const setViewMode = (mode: 'card' | 'table') => {
  viewMode.value = mode
  localStorage.setItem('user_relations_view_mode', mode)
}

const assignForm = ref({
  userId: '',
  relation: '',
  objectType: '',
  objectId: '',
})

const objectOptions = ref<Array<{ label: string; value: string }>>([])

const canManageRelations = computed(() =>
  authStore.hasRole('Platform.Owner') || authStore.hasRole('Tenant.Owner')
)

const userOptions = computed(() =>
  usersStore.users
    .filter((user) => user.isActive)
    .map((user) => ({
      label: user.fullName ? `${user.fullName} (${user.email})` : user.email,
      value: user.id,
    }))
)

const objectTypeOptions = rebacObjectOptions.filter((option) => option.value !== 'platform')

const relationOptions = computed(() => {
  if (!assignForm.value.objectType) return []

  return getRebacRelationsForObject(assignForm.value.objectType).map((relation) => ({
    label: relation.label,
    value: relation.value,
  }))
})

const canSubmitAssign = computed(() => {
  if (!assignForm.value.userId || !assignForm.value.objectType || !assignForm.value.relation) return false
  if (assignForm.value.objectType === 'tenant') return !!authStore.currentTenantId
  return !!assignForm.value.objectId
})

const filteredRelations = computed(() => {
  let list = relations.value

  if (objectTypeFilter.value.length > 0) {
    list = list.filter((r) => objectTypeFilter.value.includes(r.objectType))
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter((relation) => {
      const userLabel = getUserLabel(relation.userId).toLowerCase()
      const relationLabel = getRelationLabel(relation.objectType, relation.relation).toLowerCase()
      const objectLabel = getObjectLabel(relation.objectType, relation.objectId).toLowerCase()
      const objectTypeLabel = getObjectTypeLabel(relation.objectType).toLowerCase()
      const rawObjectId = (relation.objectId ?? '').toLowerCase()

      return userLabel.includes(query)
        || relation.userId.toLowerCase().includes(query)
        || relationLabel.includes(query)
        || objectLabel.includes(query)
        || objectTypeLabel.includes(query)
        || rawObjectId.includes(query)
    })
  }
  return list
})

function getUserLabel(userId: string): string {
  const user = usersStore.users.find((item) => item.id === userId)
  if (!user) return userId
  return user.fullName || user.email
}

function getRelationLabel(objectType: string, relation: string): string {
  return getRebacRelationLabel(objectType, relation)
}

function getObjectTypeLabel(objectType: string): string {
  return getRebacObjectLabel(objectType)
}

function getObjectLabel(objectType: string, objectId?: string | null): string {
  if (objectType === 'tenant') return t('permissions.currentTenant')
  if (!objectId) return '-'

  switch (objectType) {
    case 'plant':
      return plantsStore.plants.find((plant) => plant.id === objectId)?.name ?? objectId
    case 'resource_type':
      return resourcesStore.resourceTypes.find((resourceType) => resourceType.id === objectId)?.name ?? objectId
    case 'resource':
      return resourcesStore.resources.find((resource) => resource.id === objectId)?.name ?? objectId
    default:
      return objectId
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString('it-IT', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadObjectOptions(type: string): Promise<void> {
  objectOptions.value = []
  assignForm.value.objectId = ''

  if (!type || type === 'tenant') return
  if (type === 'booking') return

  try {
    loadingObjects.value = true

    if (type === 'plant') {
      if (!plantsStore.plants.length) await plantsStore.fetchAll()
      objectOptions.value = plantsStore.plants.map((plant) => ({ label: plant.name, value: plant.id }))
    } else if (type === 'resource_type') {
      if (!resourcesStore.resourceTypes.length) await resourcesStore.fetchAllResourceTypes()
      objectOptions.value = resourcesStore.resourceTypes.map((resourceType) => ({
        label: resourceType.name,
        value: resourceType.id,
      }))
    } else if (type === 'resource') {
      if (!resourcesStore.resources.length) await resourcesStore.fetchAllResources()
      objectOptions.value = resourcesStore.resources.map((resource) => ({ label: resource.name, value: resource.id }))
    }
  } finally {
    loadingObjects.value = false
  }
}

function openAssignDialog(): void {
  assignForm.value = {
    userId: '',
    relation: '',
    objectType: '',
    objectId: '',
  }
  objectOptions.value = []
  formError.value = null
  showAssignDialog.value = true
}

async function loadRelations(): Promise<void> {
  try {
    loading.value = true
    relations.value = await permissionsApi.listAll()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error?.message ?? t('permissions.loadError'),
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}

async function saveAssign(): Promise<void> {
  if (!canSubmitAssign.value) {
    formError.value = t('permissions.validationError')
    return
  }

  try {
    saving.value = true
    formError.value = null
    await permissionsApi.assign({
      userId: assignForm.value.userId,
      relation: assignForm.value.relation,
      objectType: assignForm.value.objectType,
      objectId: assignForm.value.objectType === 'tenant'
        ? authStore.currentTenantId
        : (assignForm.value.objectId || null),
    })

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('permissions.relationAssigned'),
      life: 3000,
    })
    showAssignDialog.value = false
    await loadRelations()
  } catch (error: any) {
    formError.value = error?.message ?? t('permissions.saveError')
  } finally {
    saving.value = false
  }
}

async function removeRelation(relation: UserRelationResponse): Promise<void> {
  if (!confirm(t('permissions.confirmRemove'))) return

  try {
    loading.value = true
    await permissionsApi.remove({
      userId: relation.userId,
      relation: relation.relation,
      objectType: relation.objectType,
      objectId: relation.objectId ?? null,
    })

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('permissions.relationRemoved'),
      life: 3000,
    })
    await loadRelations()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error?.message ?? t('permissions.removeError'),
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    usersStore.fetchAll(),
    plantsStore.fetchAll(),
    resourcesStore.fetchAllResourceTypes(),
    resourcesStore.fetchAllResources(),
    loadRelations(),
  ])
})

watch(
  () => assignForm.value.objectType,
  (nextType) => {
    assignForm.value.relation = ''
    formError.value = null

    if (nextType) {
      loadObjectOptions(nextType)
    } else {
      objectOptions.value = []
      assignForm.value.objectId = ''
    }
  }
)
</script>

<style scoped src="./UserRelationsView.css"></style>
