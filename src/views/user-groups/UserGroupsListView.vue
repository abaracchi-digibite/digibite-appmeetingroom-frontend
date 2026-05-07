<template>
  <MainLayout>
    <div class="user-groups-container">

      <Button icon="pi pi-plus" :label="t('userGroups.createNew')" @click="openCreateDialog" size="small" />

      <div class="user-groups-purpose-card mb-4">
        <div class="purpose-icon">
          <i class="pi pi-info-circle" />
        </div>
        <div class="purpose-copy">
          <h2>{{ t('userGroups.purposeTitle') }}</h2>
          <p>{{ t('userGroups.purposeBody') }}</p>
        </div>
      </div>

      <!-- Search bar -->
      <div class="mb-4 flex gap-3 flex-wrap items-center">
        <IconField class="flex-1 min-w-64">
          <InputIcon class="pi pi-search" />
          <InputText v-model="searchQuery" :placeholder="t('common.search')" />
        </IconField>

        <!-- View toggle -->
        <div class="flex gap-1 p-1 rounded-lg" style="background: var(--bg-page, #f0f4ff); border: 1px solid var(--border-default, #e5e7eb);">
          <button
            class="px-2 py-1 rounded-md text-sm transition-all"
            :class="viewMode === 'table' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700'"
            :style="viewMode === 'table' ? 'background: var(--bg-card, #ffffff);' : ''"
            @click="setViewMode('table')"
            :title="t('common.viewTable')"
          >
            <i class="pi pi-list text-sm" />
          </button>
          <button
            class="px-2 py-1 rounded-md text-sm transition-all"
            :class="viewMode === 'card' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700'"
            :style="viewMode === 'card' ? 'background: var(--bg-card, #ffffff);' : ''"
            @click="setViewMode('card')"
            :title="t('common.viewCards')"
          >
            <i class="pi pi-th-large text-sm" />
          </button>
        </div>
      </div>

      <!-- Table View -->
      <div v-if="viewMode === 'table'">
        <DataTable :value="filteredUserGroups" responsiveLayout="scroll" stripedRows showGridlines>
          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-inbox text-4xl mb-3" style="color: #cbd5e1;"></i>
              <p style="color: #64748b;">{{ t('common.noData') }}</p>
            </div>
          </template>

          <Column field="name" :header="t('userGroups.name')" style="width: 25%">
            <template #body="{ data }">
              <span style="color: #0f172a; font-weight: 500;">{{ data.name }}</span>
            </template>
          </Column>

          <Column field="description" :header="t('userGroups.description')" style="width: 25%">
            <template #body="{ data }">
              <span class="line-clamp-1 text-sm" style="color: #0f172a;">{{ data.description || '-' }}</span>
            </template>
          </Column>

          <Column field="memberUserIds" :header="t('common.membersCount')" style="width: 15%">
            <template #body="{ data }">
              <Tag :value="`${data.memberUserIds?.length || 0}`" severity="info" />
            </template>
          </Column>

          <Column field="createdAt" :header="t('common.createdDate')" style="width: 15%">
            <template #body="{ data }">
              <span class="text-sm" style="color: #0f172a;">{{ formatDate(data.createdAt) }}</span>
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 20%">
            <template #body="{ data }">
              <Button icon="pi pi-arrow-right" :label="t('userGroups.openGroup')" @click="viewMembers(data.id)" outlined size="small" class="mr-2" />
              <Button icon="pi pi-pencil" @click="editGroup(data)" outlined severity="warning" size="small" class="mr-2" />
              <Button icon="pi pi-trash" @click="deleteGroup(data.id)" outlined severity="danger" size="small" />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Card View -->
      <div v-else>
        <div v-if="filteredUserGroups.length === 0" class="text-center py-8">
          <i class="pi pi-inbox text-4xl mb-3" style="color: #cbd5e1;"></i>
          <p style="color: #64748b;">{{ t('common.noData') }}</p>
        </div>
        <div v-else class="cards-grid">
          <div v-for="group in filteredUserGroups" :key="group.id" class="item-card">
            <h3 class="card-title">{{ group.name }}</h3>
            <p v-if="group.description" class="card-desc">{{ group.description }}</p>

            <div class="card-meta mt-2">
              <Tag :value="`${group.memberUserIds?.length ?? 0} ${t('common.members')}`" severity="info" />
              <span class="text-xs text-slate-500">{{ formatDate(group.createdAt) }}</span>
            </div>

            <div class="card-actions">
              <Button icon="pi pi-arrow-right" :label="t('userGroups.openGroup')" @click="viewMembers(group.id)" outlined size="small" />
              <Button icon="pi pi-pencil" @click="editGroup(group)" outlined severity="warning" size="small" />
              <Button icon="pi pi-trash" @click="deleteGroup(group.id)" outlined severity="danger" size="small" />
            </div>
          </div>
        </div>
      </div>

      <!-- Dialog Create/Edit -->
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
            <p class="group-members-help">
              {{ t('userGroups.membersHelp') }}
            </p>
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
import InputIcon from 'primevue/inputicon'
import IconField from 'primevue/iconfield'
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
  let result = userGroupsStore.userGroups

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
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('common.save'),
        life: 2500,
      })
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
      toast.add({
        severity: 'success',
        summary: t('common.success'),
        detail: t('userGroups.createSuccess'),
        life: 2500,
      })
    }
    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: (error as Error).message || t('common.error'),
      life: 3500,
    })
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

const setViewMode = (mode: 'card' | 'table') => {
  viewMode.value = mode
  localStorage.setItem('user_groups_view_mode', mode)
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
