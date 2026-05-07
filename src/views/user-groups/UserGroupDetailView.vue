<template>
  <MainLayout>
    <div class="ug-container">
      <div class="ug-header">
        <div class="ug-header-left">
          <button class="btn-icon" @click="goBack" :title="t('common.back')">
            <i class="pi pi-arrow-left" />
          </button>
          <div>
            <!-- <h1 class="ug-title">{{ group?.name || t('userGroups.title') }}</h1> -->
            <p class="ug-subtitle">{{ t('userGroups.detailSubtitle') }}</p>
          </div>
        </div>
      </div>

      <div v-if="loading" class="ug-loading">
        <i class="pi pi-spin pi-spinner" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <template v-if="!loading && group">
        <div class="ug-card">
          <div class="ug-card-header">
            <i class="pi pi-users" />
            <span>{{ t('common.information') }}</span>
          </div>
          <div class="ug-card-body">
            <form @submit.prevent="saveGroup" class="ug-form">
              <div class="form-row">
                <div class="form-field">
                  <label class="field-label required">{{ t('userGroups.name') }}</label>
                  <input v-model="formData.name" type="text" class="field-input" :placeholder="t('userGroups.name')" required />
                </div>
                <div class="form-field">
                  <label class="field-label">{{ t('userGroups.description') }}</label>
                  <input
                    v-model="formData.description"
                    type="text"
                    class="field-input"
                    :placeholder="t('userGroups.descriptionPlaceholder')"
                  />
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" :disabled="savingGroup">
                  <i v-if="savingGroup" class="pi pi-spin pi-spinner" />
                  <i v-else class="pi pi-check" />
                  {{ savingGroup ? t('common.saving') : t('common.save') }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="ug-card">
          <div class="ug-card-header">
            <i class="pi pi-user" />
            <span>{{ t('userGroups.members') }}</span>
            <span class="badge-count">{{ group.memberUserIds?.length || 0 }}</span>
            <button class="btn-add-inline" @click="openAddMemberDialog">
              <i class="pi pi-plus" /> {{ t('userGroups.addMember') }}
            </button>
          </div>
          <div class="ug-card-body">
            <div v-if="!group.memberUserIds?.length" class="empty-state">
              <i class="pi pi-user-plus" />
              <span>{{ t('userGroups.noMembers') }}</span>
            </div>
            <table v-else class="ug-table">
              <thead>
                <tr>
                  <th>{{ t('common.name') }}</th>
                  <th>{{ t('common.email') }}</th>
                  <th style="width: 64px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="uid in group.memberUserIds" :key="uid">
                  <td>{{ getUserName(uid) }}</td>
                  <td>{{ getUserEmail(uid) }}</td>
                  <td>
                    <button class="btn-icon btn-icon-danger" :title="t('userGroups.removeMember')" @click="removeMember(uid)">
                      <i class="pi pi-trash" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="ug-card">
          <div class="ug-card-header">
            <i class="pi pi-sitemap" />
            <span>{{ t('userGroups.relations') }}</span>
            <span class="badge-count">{{ group.relations?.length || 0 }}</span>
            <button class="btn-add-inline" @click="openAddRelationDialog">
              <i class="pi pi-plus" /> {{ t('userGroups.addRelation') }}
            </button>
          </div>
          <div class="ug-card-body">
            <div v-if="!group.relations?.length" class="empty-state">
              <i class="pi pi-link" />
              <span>{{ t('userGroups.noRelations') }}</span>
            </div>
            <table v-else class="ug-table">
              <thead>
                <tr>
                  <th>{{ t('userGroups.relationType') }}</th>
                  <th>{{ t('userGroups.objectType') }}</th>
                  <th>{{ t('userGroups.objectName') }}</th>
                  <th style="width: 64px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rel in group.relations" :key="rel.id">
                  <td><span class="relation-badge">{{ getRelationLabel(rel.objectType, rel.relationType) }}</span></td>
                  <td>{{ getObjectTypeLabel(rel.objectType) }}</td>
                  <td class="object-name">{{ getObjectName(rel.objectType, rel.objectId) }}</td>
                  <td>
                    <button class="btn-icon btn-icon-danger" :title="t('userGroups.removeRelation')" @click="removeRelation(rel.id)">
                      <i class="pi pi-trash" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <PrimeDialog v-model:visible="showAddMemberDialog" :header="t('userGroups.addMember')" modal :style="{ width: '440px' }">
        <div class="dialog-body">
          <div class="dialog-field">
            <label class="field-label required">{{ t('userGroups.selectUser') }}</label>
            <PrimeDropdown
              v-model="memberFormData.userId"
              :options="availableUsers"
              optionLabel="label"
              optionValue="value"
              :placeholder="t('userGroups.selectUserPlaceholder')"
              :filter="true"
              filterPlaceholder="Cerca per nome o email..."
              class="w-full"
              :emptyFilterMessage="t('common.noResults')"
              :emptyMessage="t('userGroups.noUsersAvailable')"
            />
            <p v-if="memberError" class="field-error">{{ memberError }}</p>
          </div>
        </div>
        <template #footer>
          <PrimeButton :label="t('common.cancel')" icon="pi pi-times" text @click="closeMemberDialog" />
          <PrimeButton
            :label="t('common.add')"
            icon="pi pi-check"
            :loading="savingMember"
            :disabled="!memberFormData.userId"
            class="dialog-btn-save"
            @click="saveMember"
          />
        </template>
      </PrimeDialog>

      <PrimeDialog v-model:visible="showAddRelationDialog" :header="t('userGroups.addRelation')" modal :style="{ width: '520px' }">
        <div class="dialog-body">
          <div class="dialog-field">
            <label class="field-label required">{{ t('userGroups.objectType') }}</label>
            <PrimeDropdown
              v-model="relationFormData.objectType"
              :options="objectTypeOptions"
              optionLabel="label"
              optionValue="value"
              :placeholder="t('userGroups.selectObjectType')"
              class="w-full"
            />
          </div>

          <div class="dialog-field">
            <label class="field-label required">{{ t('userGroups.relationType') }}</label>
            <PrimeDropdown
              v-model="relationFormData.relationType"
              :options="relationTypeOptions"
              optionLabel="label"
              optionValue="value"
              :placeholder="t('userGroups.selectRelationType')"
              class="w-full"
              :filter="true"
              filterPlaceholder="Cerca tipo relazione..."
              :disabled="!relationFormData.objectType"
            />
          </div>

          <div v-if="relationFormData.objectType" class="dialog-field">
            <label class="field-label required">{{ t('userGroups.objectName') }}</label>

            <div v-if="relationFormData.objectType === 'tenant'" class="field-readonly">
              <i class="pi pi-building" />
              <span>{{ t('userGroups.currentTenant') }}</span>
            </div>

            <PrimeDropdown
              v-else-if="relationFormData.objectType !== 'booking'"
              v-model="relationFormData.objectId"
              :options="objectSelectorItems"
              optionLabel="label"
              optionValue="value"
              :placeholder="loadingObjects ? t('common.loading') : t('userGroups.selectObject')"
              :loading="loadingObjects"
              :filter="true"
              filterPlaceholder="Cerca..."
              class="w-full"
              :emptyMessage="t('common.noResults')"
            />

            <input
              v-else
              v-model="relationFormData.objectId"
              type="text"
              class="field-input"
              :placeholder="t('userGroups.objectIdPlaceholder')"
            />
          </div>

          <p v-if="relationError" class="field-error">{{ relationError }}</p>
        </div>
        <template #footer>
          <PrimeButton :label="t('common.cancel')" icon="pi pi-times" text @click="closeRelationDialog" />
          <PrimeButton
            :label="t('common.add')"
            icon="pi pi-check"
            :loading="savingRelation"
            :disabled="!canSaveRelation"
            class="dialog-btn-save"
            @click="saveRelation"
          />
        </template>
      </PrimeDialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import PrimeButton from 'primevue/button'
import PrimeDialog from 'primevue/dialog'
import PrimeDropdown from 'primevue/dropdown'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth.store'
import { usePlantsStore } from '@/stores/plants.store'
import { useResourcesStore } from '@/stores/resources.store'
import { useUserGroupsStore } from '@/stores/user-groups.store'
import { useUsersStore } from '@/stores/users.store'
import {
  getRebacObjectLabel,
  getRebacRelationLabel,
  getRebacRelationsForObject,
  rebacObjectOptions,
} from '@/features/rebac/rebac-catalog'
import type { AddGroupMemberDto, AddGroupRelationDto, UpdateUserGroupDto } from '@/types/user-group'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const authStore = useAuthStore()
const userGroupsStore = useUserGroupsStore()
const usersStore = useUsersStore()
const plantsStore = usePlantsStore()
const resourcesStore = useResourcesStore()

const loading = ref(false)
const savingGroup = ref(false)
const savingMember = ref(false)
const savingRelation = ref(false)
const loadingObjects = ref(false)

const showAddMemberDialog = ref(false)
const showAddRelationDialog = ref(false)

const memberError = ref<string | null>(null)
const relationError = ref<string | null>(null)

const formData = ref<UpdateUserGroupDto>({ name: '', description: '' })
const memberFormData = ref<{ userId: string }>({ userId: '' })
const relationFormData = ref<{ relationType: string; objectType: string; objectId: string }>({
  relationType: '',
  objectType: '',
  objectId: '',
})
const objectSelectorItems = ref<{ label: string; value: string }[]>([])

const group = computed(() => userGroupsStore.userGroupById(route.params.id as string))
const currentTenantId = computed(() => authStore.currentTenantId ?? '')

const availableUsers = computed(() => {
  const existing = new Set(group.value?.memberUserIds ?? [])
  return usersStore.users
    .filter((user) => user.isActive && !existing.has(user.id))
    .map((user) => ({
      label: user.fullName ? `${user.fullName} (${user.email})` : user.email,
      value: user.id,
    }))
})

const canSaveRelation = computed(() => {
  const { relationType, objectType, objectId } = relationFormData.value
  if (!relationType || !objectType) return false
  if (objectType === 'tenant') return !!currentTenantId.value
  return !!objectId
})

const relationTypeOptions = computed(() => {
  if (!relationFormData.value.objectType) return []

  return getRebacRelationsForObject(relationFormData.value.objectType).map((relation) => ({
    label: relation.label,
    value: relation.value,
  }))
})

const objectTypeOptions = rebacObjectOptions.filter((option) => option.value !== 'platform')

function getUserName(userId: string): string {
  const user = usersStore.users.find((item) => item.id === userId)
  return user?.fullName || user?.email || userId
}

function getUserEmail(userId: string): string {
  const user = usersStore.users.find((item) => item.id === userId)
  return user?.email ?? '-'
}

function getRelationLabel(objectType: string, relationType: string): string {
  return getRebacRelationLabel(objectType, relationType)
}

function getObjectTypeLabel(objectType: string): string {
  return getRebacObjectLabel(objectType)
}

function getObjectName(objectType: string, objectId: string): string {
  switch (objectType) {
    case 'tenant':
      return t('userGroups.currentTenant')
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

async function loadObjectsForType(type: string): Promise<void> {
  objectSelectorItems.value = []
  relationFormData.value.objectId = ''

  if (type === 'tenant') {
    relationFormData.value.objectId = currentTenantId.value
    return
  }

  if (type === 'booking') return

  try {
    loadingObjects.value = true

    if (type === 'plant') {
      if (!plantsStore.plants.length) await plantsStore.fetchAll()
      objectSelectorItems.value = plantsStore.plants.map((plant) => ({ label: plant.name, value: plant.id }))
    } else if (type === 'resource_type') {
      if (!resourcesStore.resourceTypes.length) await resourcesStore.fetchAllResourceTypes()
      objectSelectorItems.value = resourcesStore.resourceTypes.map((resourceType) => ({
        label: resourceType.name,
        value: resourceType.id,
      }))
    } else if (type === 'resource') {
      if (!resourcesStore.resources.length) await resourcesStore.fetchAllResources()
      objectSelectorItems.value = resourcesStore.resources.map((resource) => ({
        label: resource.name,
        value: resource.id,
      }))
    }
  } finally {
    loadingObjects.value = false
  }
}

function openAddMemberDialog(): void {
  memberFormData.value = { userId: '' }
  memberError.value = null
  showAddMemberDialog.value = true
}

function closeMemberDialog(): void {
  showAddMemberDialog.value = false
  memberFormData.value = { userId: '' }
  memberError.value = null
}

async function saveMember(): Promise<void> {
  if (!memberFormData.value.userId) {
    memberError.value = t('userGroups.errorSelectUser')
    return
  }

  try {
    savingMember.value = true
    memberError.value = null
    const dto: AddGroupMemberDto = { userId: memberFormData.value.userId }
    await userGroupsStore.addGroupMember(route.params.id as string, dto)
    closeMemberDialog()
  } catch {
    memberError.value = t('userGroups.errorAddMember')
  } finally {
    savingMember.value = false
  }
}

async function removeMember(userId: string): Promise<void> {
  if (!confirm(t('userGroups.confirmRemoveMember'))) return
  try {
    await userGroupsStore.removeGroupMember(route.params.id as string, userId)
  } catch {
    // The store handles user-facing errors elsewhere.
  }
}

function openAddRelationDialog(): void {
  relationFormData.value = { relationType: '', objectType: '', objectId: '' }
  objectSelectorItems.value = []
  relationError.value = null
  showAddRelationDialog.value = true
}

function closeRelationDialog(): void {
  showAddRelationDialog.value = false
  relationFormData.value = { relationType: '', objectType: '', objectId: '' }
  objectSelectorItems.value = []
  relationError.value = null
}

async function saveRelation(): Promise<void> {
  if (!canSaveRelation.value) {
    relationError.value = t('userGroups.errorFillRelation')
    return
  }

  try {
    savingRelation.value = true
    relationError.value = null
    const resolvedId = relationFormData.value.objectType === 'tenant'
      ? currentTenantId.value
      : relationFormData.value.objectId
    const dto: AddGroupRelationDto = {
      relationType: relationFormData.value.relationType,
      objectType: relationFormData.value.objectType,
      objectId: resolvedId,
    }
    await userGroupsStore.addGroupRelation(route.params.id as string, dto)
    closeRelationDialog()
  } catch {
    relationError.value = t('userGroups.errorAddRelation')
  } finally {
    savingRelation.value = false
  }
}

async function removeRelation(relationId: string): Promise<void> {
  if (!confirm(t('userGroups.confirmRemoveRelation'))) return
  try {
    await userGroupsStore.removeGroupRelation(route.params.id as string, relationId)
  } catch {
    // The store handles user-facing errors elsewhere.
  }
}

async function saveGroup(): Promise<void> {
  try {
    savingGroup.value = true
    await userGroupsStore.updateUserGroup(route.params.id as string, formData.value)
    goBack()
  } catch {
    // The store handles user-facing errors elsewhere.
  } finally {
    savingGroup.value = false
  }
}

function goBack(): void {
  router.push('/user-groups')
}

onMounted(async () => {
  try {
    loading.value = true
    const [loadedGroup] = await Promise.all([
      userGroupsStore.fetchUserGroupById(route.params.id as string),
      usersStore.fetchAll(),
    ])
    formData.value = { name: loadedGroup.name, description: loadedGroup.description ?? '' }
  } finally {
    loading.value = false
  }
})

watch(
  () => relationFormData.value.objectType,
  (newType) => {
    relationFormData.value.relationType = ''
    if (newType) {
      loadObjectsForType(newType)
    } else {
      objectSelectorItems.value = []
      relationFormData.value.objectId = ''
    }
  }
)
</script>

<style scoped src="./UserGroupDetailView.css"></style>
