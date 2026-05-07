<template>
  <MainLayout>
    <div class="relations-shell">
      <section class="relations-hero">
        <div>
          <p class="relations-eyebrow">{{ t('permissions.eyebrow') }}</p>
          <!-- <h1 class="relations-title">{{ t('permissions.title') }}</h1> -->
          <p class="relations-subtitle">{{ t('permissions.subtitle') }}</p>
        </div>
        <PrimeButton
          v-if="canManageRelations"
          icon="pi pi-plus"
          :label="t('permissions.assign')"
          class="relations-primary-btn"
          @click="openAssignDialog"
        />
      </section>

      <section class="relations-guidance">
        <div class="guidance-icon">
          <i class="pi pi-info-circle" />
        </div>
        <div>
          <h2>{{ t('permissions.guidanceTitle') }}</h2>
          <p>{{ t('permissions.guidanceBody') }}</p>
        </div>
      </section>

      <section class="relations-model-grid">
        <article class="relations-model-card">
          <div class="model-card-icon">
            <i class="pi pi-sitemap" />
          </div>
          <div>
            <h2>{{ t('permissions.groupsTitle') }}</h2>
            <p>{{ t('permissions.groupsBody') }}</p>
          </div>
        </article>

        <article class="relations-model-card relations-model-card-accent">
          <div class="model-card-icon">
            <i class="pi pi-user-edit" />
          </div>
          <div>
            <h2>{{ t('permissions.directTitle') }}</h2>
            <p>{{ t('permissions.directBody') }}</p>
          </div>
        </article>
      </section>

      <section class="relations-toolbar">
        <label class="relations-search">
          <i class="pi pi-search" />
          <input v-model="searchQuery" type="search" :placeholder="t('permissions.searchPlaceholder')" />
        </label>

        <div class="relations-summary">
          <span class="summary-chip">
            <strong>{{ relations.length }}</strong>
            {{ t('permissions.totalRelations') }}
          </span>
          <span class="summary-chip summary-chip-muted">
            {{ t('permissions.scopeTenant') }}
          </span>
        </div>
      </section>

      <section class="relations-card">
        <div class="relations-card-header">
          <div>
            <h2>{{ t('permissions.allRelations') }}</h2>
            <p>{{ t('permissions.tableHelp') }}</p>
          </div>
        </div>

        <DataTable
          :value="filteredRelations"
          :loading="loading"
          dataKey="id"
          responsiveLayout="scroll"
          stripedRows
          paginator
          :rows="10"
          class="relations-table"
        >
          <template #empty>
            <div class="table-empty">
              <i class="pi pi-inbox" />
              <span>{{ t('permissions.emptyState') }}</span>
            </div>
          </template>

          <Column :header="t('permissions.user')" style="width: 24%">
            <template #body="{ data }">
              <div class="entity-stack">
                <strong>{{ getUserLabel(data.userId) }}</strong>
                <span>{{ data.userId }}</span>
              </div>
            </template>
          </Column>

          <Column :header="t('permissions.relation')" style="width: 20%">
            <template #body="{ data }">
              <span class="relation-pill">{{ getRelationLabel(data.objectType, data.relation) }}</span>
            </template>
          </Column>

          <Column :header="t('permissions.object')" style="width: 24%">
            <template #body="{ data }">
              <div class="entity-stack">
                <strong>{{ getObjectLabel(data.objectType, data.objectId) }}</strong>
                <span>{{ getObjectTypeLabel(data.objectType) }}</span>
              </div>
            </template>
          </Column>

          <Column :header="t('common.createdAt')" style="width: 18%">
            <template #body="{ data }">
              <span class="timestamp-label">{{ formatDate(data.createdAt) }}</span>
            </template>
          </Column>

          <Column v-if="canManageRelations" :header="t('common.actions')" style="width: 14%">
            <template #body="{ data }">
              <PrimeButton
                icon="pi pi-trash"
                severity="danger"
                outlined
                size="small"
                :aria-label="t('permissions.removeRelation')"
                @click="removeRelation(data)"
              />
            </template>
          </Column>
        </DataTable>
      </section>

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
const showAssignDialog = ref(false)
const formError = ref<string | null>(null)

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
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return relations.value

  return relations.value.filter((relation) => {
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
