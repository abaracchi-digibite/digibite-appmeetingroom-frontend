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
          <button type="button" class="list-btn-primary" @click="openCreateDialog">
            <i class="pi pi-plus" />
            <span>{{ t('userGroups.createNew') }}</span>
          </button>
        </div>

        <div class="list-row-secondary">
          <div class="list-filter-inline">
            <span class="list-count-flat">
              {{ filteredUserGroups.length }} {{ t('common.results') }}
            </span>
          </div>

          <div class="list-row-secondary-right">
            <div class="list-view-flat" role="group" :aria-label="t('common.viewTable')">
              <button
                type="button"
                class="list-view-icon"
                :class="{ active: viewMode === 'table' }"
                :title="t('common.viewTable')"
                @click="setViewMode('table')"
              >
                <i class="pi pi-list" />
              </button>
              <button
                type="button"
                class="list-view-icon"
                :class="{ active: viewMode === 'card' }"
                :title="t('common.viewCards')"
                @click="setViewMode('card')"
              >
                <i class="pi pi-th-large" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Empty ────────────────────────────────────────────────── -->
      <div v-if="filteredUserGroups.length === 0" class="list-empty">
        <i class="pi pi-inbox" />
        <p>{{ t('common.noData') }}</p>
      </div>

      <!-- ── Tabella ──────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
        <DataTable :value="filteredUserGroups" responsiveLayout="scroll" stripedRows class="list-table">
          <Column field="name" :header="t('userGroups.name')" :sortable="true" style="width: 25%">
            <template #body="{ data }">
              <span class="list-cell-strong">{{ data.name }}</span>
            </template>
          </Column>

          <Column field="description" :header="t('userGroups.description')" :sortable="true" style="width: 35%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ data.description || '—' }}</span>
            </template>
          </Column>

          <Column field="memberCount" :header="t('common.membersCount')" :sortable="true" style="width: 15%">
            <template #body="{ data }">
              <Tag :value="`${data.memberCount}`" severity="info" />
            </template>
          </Column>

          <Column field="createdAt" :header="t('common.createdDate')" :sortable="true" style="width: 15%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ formatDate(data.createdAt) }}</span>
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 130px" class="list-col-actions">
            <template #body="{ data }">
              <div class="list-row-actions">
                <button type="button" class="list-action-btn list-action-view" :title="t('userGroups.openGroup')" @click="viewMembers(data.id)">
                  <i class="pi pi-arrow-right" />
                </button>
                <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="editGroup(data)">
                  <i class="pi pi-pencil" />
                </button>
                <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteGroup(data.id)">
                  <i class="pi pi-trash" />
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ── Cards ────────────────────────────────────────────────── -->
      <div v-else class="list-cards-grid">
        <article v-for="group in filteredUserGroups" :key="group.id" class="list-card">
          <div class="list-card-head">
            <h3 class="list-card-title">{{ group.name }}</h3>
            <Tag :value="`${group.memberCount}`" severity="info" />
          </div>
          <p v-if="group.description" class="list-card-desc">{{ group.description }}</p>
          <div class="list-card-info">
            <div class="list-card-info-row">
              <i class="pi pi-calendar" />
              <span>{{ formatDate(group.createdAt) }}</span>
            </div>
          </div>
          <div class="list-card-actions">
            <button type="button" class="list-action-btn list-action-view" :title="t('userGroups.openGroup')" @click="viewMembers(group.id)">
              <i class="pi pi-arrow-right" />
            </button>
            <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="editGroup(group)">
              <i class="pi pi-pencil" />
            </button>
            <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteGroup(group.id)">
              <i class="pi pi-trash" />
            </button>
          </div>
        </article>
      </div>

      <!-- ── Create / Edit Dialog ─────────────────────────────────── -->
      <Dialog
        v-model:visible="showCreateDialog"
        modal
        :header="isEditing ? t('common.edit') : t('userGroups.createNew')"
        :style="{ width: 'min(760px, 96vw)' }"
      >
        <form @submit.prevent="saveGroup" class="group-dialog-form">
          <div class="group-dialog-grid">
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('userGroups.name') }} *</label>
              <InputText v-model="formData.name" :placeholder="t('userGroups.name')" class="w-full" required />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('userGroups.description') }}</label>
              <Textarea v-model="formData.description" :placeholder="t('userGroups.description')" rows="3" class="w-full" />
            </div>
          </div>

          <div v-if="!isEditing" class="group-members-picker">
            <label class="block text-sm font-medium mb-2">{{ t('userGroups.selectMembers') }}</label>
            <MultiSelect
              v-model="formData.members"
              :options="availableUserOptions"
              optionLabel="label"
              optionValue="value"
              display="chip"
              filter
              class="w-full"
              :placeholder="t('userGroups.selectMembersPlaceholder')"
              :maxSelectedLabels="3"
              :emptyFilterMessage="t('common.noResults')"
              :emptyMessage="t('userGroups.noUsersAvailable')"
            />
            <p class="group-members-help">{{ t('userGroups.membersHelp') }}</p>
          </div>

          <div class="group-dialog-actions">
            <Button type="submit" :label="t('common.save')" />
            <Button type="button" :label="t('common.cancel')" severity="secondary" @click="showCreateDialog = false" />
          </div>
        </form>
      </Dialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useUserGroupsStore } from '@/stores/user-groups.store'
import { useUsersStore } from '@/stores/users.store'
import MainLayout from '@/layouts/MainLayout.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import MultiSelect from 'primevue/multiselect'
import type { UserGroup, CreateUserGroupDto, UpdateUserGroupDto } from '@/types/user-group'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const userGroupsStore = useUserGroupsStore()
const usersStore = useUsersStore()

const searchQuery = ref('')
const showCreateDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const viewMode = ref<'card' | 'table'>(
  (localStorage.getItem('user_groups_view_mode') as 'card' | 'table') ?? 'table'
)

const formData = ref<CreateUserGroupDto>({
  name: '',
  description: '',
  members: [],
})

const filteredUserGroups = computed(() => {
  let result = userGroupsStore.userGroups.map((g) => ({
    ...g,
    memberCount: g.memberUserIds?.length ?? 0,
  }))

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query)
    )
  }
  return result
})

const availableUserOptions = computed(() =>
  usersStore.users
    .filter((user) => user.isActive)
    .map((user) => ({
      label: user.fullName ? `${user.fullName} (${user.email})` : user.email,
      value: user.id,
    }))
)

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const setViewMode = (mode: 'card' | 'table') => {
  viewMode.value = mode
  localStorage.setItem('user_groups_view_mode', mode)
}

const openCreateDialog = () => {
  isEditing.value = false
  editingId.value = null
  formData.value = { name: '', description: '', members: [] }
  showCreateDialog.value = true
}

const viewMembers = (groupId: string) => {
  router.push(`/user-groups/${groupId}`)
}

const editGroup = (group: UserGroup) => {
  isEditing.value = true
  editingId.value = group.id
  formData.value = {
    name: group.name,
    description: group.description || '',
    members: [],
  }
  showCreateDialog.value = true
}

const saveGroup = async () => {
  try {
    if (isEditing.value && editingId.value) {
      const dto: UpdateUserGroupDto = {
        name: formData.value.name,
        description: formData.value.description,
      }
      await userGroupsStore.updateUserGroup(editingId.value, dto)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.save'), life: 2500 })
    } else {
      const members = [...(formData.value.members ?? [])]
      const dto: CreateUserGroupDto = {
        name: formData.value.name,
        description: formData.value.description,
      }
      const createdGroup = await userGroupsStore.createUserGroup(dto)
      for (const userId of members) {
        await userGroupsStore.addGroupMember(createdGroup.id, { userId })
      }
      await userGroupsStore.fetchAllUserGroups()
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('userGroups.createSuccess'), life: 2500 })
    }
    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: (error as Error).message || t('common.error'), life: 3500 })
  }
}

const deleteGroup = async (id: string) => {
  if (confirm(t('common.confirm'))) {
    try {
      await userGroupsStore.removeUserGroup(id)
    } catch (error) {
      console.error('Error deleting user group:', error)
    }
  }
}

const resetForm = () => {
  isEditing.value = false
  editingId.value = null
  formData.value = { name: '', description: '', members: [] }
}

onMounted(async () => {
  try {
    await Promise.all([
      userGroupsStore.fetchAllUserGroups(),
      usersStore.fetchAll(),
    ])
  } catch (error) {
    console.error('Error fetching user groups:', error)
  }
})
</script>

<style scoped src="./UserGroupsListView.css"></style>
