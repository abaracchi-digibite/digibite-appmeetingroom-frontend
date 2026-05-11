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
            <span>{{ t('users.invite') }}</span>
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
            <div class="list-filter-inline">
              <label class="list-filter-label-inline">{{ t('users.role') }}</label>
              <MultiSelect
                v-model="roleFilter"
                :options="roleOptions"
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
            <span class="list-count-flat">{{ filteredUsers.length }} {{ t('common.results') }}</span>
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

      <!-- ── Empty ─────────────────────────────────────────────────── -->
      <div v-if="filteredUsers.length === 0 && !loading" class="list-empty">
        <i class="pi pi-inbox" />
        <p>{{ t('common.noData') }}</p>
      </div>

      <!-- ── Loading ───────────────────────────────────────────────── -->
      <div v-else-if="loading" class="list-loading">
        <i class="pi pi-spin pi-spinner" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <!-- ── Tabella ──────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
        <DataTable :value="filteredUsers" :loading="loading" responsiveLayout="scroll" stripedRows class="list-table">
          <Column field="email" :header="t('users.email')" :sortable="true" style="width: 22%">
            <template #body="{ data }">
              <span class="list-cell-strong">{{ data.email }}</span>
            </template>
          </Column>

          <Column field="fullName" :header="t('users.fullName')" :sortable="true" style="width: 22%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ data.fullName || '—' }}</span>
            </template>
          </Column>

          <Column field="role" :header="t('users.role')" :sortable="true" style="width: 14%">
            <template #body="{ data }">
              <Tag :value="getRoleLabel(data.role)" :severity="getRoleSeverity(data.role)" />
            </template>
          </Column>

          <Column field="isActive" :header="t('common.status')" :sortable="true" style="width: 12%">
            <template #body="{ data }">
              <Tag :value="data.isActive ? t('common.active') : t('common.inactive')" :severity="data.isActive ? 'success' : 'danger'" />
            </template>
          </Column>

          <Column field="lastLoginAt" :header="t('users.lastLogin')" :sortable="true" style="width: 18%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ formatLastLogin(data.lastLoginAt) }}</span>
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 110px" class="list-col-actions">
            <template #body="{ data }">
              <div class="list-row-actions">
                <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="editUser(data)">
                  <i class="pi pi-pencil" />
                </button>
                <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteUser(data.id)">
                  <i class="pi pi-trash" />
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ── Cards ────────────────────────────────────────────────── -->
      <div v-else class="list-cards-grid">
        <article v-for="user in filteredUsers" :key="user.id" class="list-card">
          <div class="list-card-head">
            <h3 class="list-card-title">{{ user.fullName || user.email }}</h3>
            <Tag :value="user.isActive ? t('common.active') : t('common.inactive')" :severity="user.isActive ? 'success' : 'danger'" />
          </div>
          <p v-if="user.fullName" class="list-card-subtitle">{{ user.email }}</p>
          <div class="list-card-info">
            <div class="list-card-info-row">
              <i class="pi pi-id-card" />
              <Tag :value="getRoleLabel(user.role)" :severity="getRoleSeverity(user.role)" />
            </div>
            <div class="list-card-info-row">
              <i class="pi pi-clock" />
              <span>{{ formatLastLogin(user.lastLoginAt) }}</span>
            </div>
          </div>
          <div class="list-card-actions">
            <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="editUser(user)">
              <i class="pi pi-pencil" />
            </button>
            <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteUser(user.id)">
              <i class="pi pi-trash" />
            </button>
          </div>
        </article>
      </div>

      <!-- Create Dialog -->
      <Dialog v-model:visible="showCreateDialog" modal :header="t('users.createNew')" :style="{ width: 'min(820px, 96vw)' }">
        <form @submit.prevent="saveCreate" class="users-dialog-form">
          <div class="users-dialog-grid">
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('users.email') }} *</label>
              <InputText v-model="createFormData.email" type="email" :placeholder="t('users.email')" class="w-full" required />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('users.fullName') }} ({{ t('common.optional') }})</label>
              <InputText v-model="createFormData.fullName" :placeholder="t('users.fullName')" class="w-full" />
            </div>
          </div>
          <div class="users-dialog-grid">
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('users.password') }} *</label>
              <Password v-model="createFormData.password" :placeholder="t('users.password')" class="w-full" inputClass="w-full" toggleMask :feedback="true" required />
              <p class="text-xs text-slate-500 mt-1">{{ t('users.passwordHint') }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('users.role') }} *</label>
              <Dropdown v-model="createFormData.role" :options="roleOptions" optionLabel="label" optionValue="value" class="w-full" required />
            </div>
          </div>
          <div class="users-groups-picker">
            <label class="block text-sm font-medium mb-2">{{ t('users.groups') }}</label>
            <MultiSelect v-model="createFormData.groupIds" :options="userGroupOptions" optionLabel="label" optionValue="value" display="chip" filter class="w-full" :placeholder="t('users.groupsPlaceholder')" :maxSelectedLabels="3" :emptyFilterMessage="t('common.noResults')" :emptyMessage="t('common.noData')" />
            <p class="users-groups-help">{{ t('users.groupsHelp') }}</p>
          </div>
          <div class="users-dialog-footer">
            <div class="flex items-center gap-2">
              <Checkbox v-model="createFormData.isActive" inputId="createIsActive" binary />
              <label for="createIsActive" class="text-sm">{{ t('common.active') }}</label>
            </div>
            <div class="users-dialog-actions">
              <Button type="submit" :label="t('common.save')" />
              <Button type="button" :label="t('common.cancel')" severity="secondary" @click="showCreateDialog = false" />
            </div>
          </div>
        </form>
      </Dialog>

      <!-- Edit Dialog -->
      <Dialog v-model:visible="showEditDialog" modal :header="t('common.edit')" :style="{ width: 'min(720px, 96vw)' }">
        <form @submit.prevent="saveEdit" class="users-dialog-form">
          <div class="users-dialog-grid">
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('users.fullName') }} ({{ t('common.optional') }})</label>
              <InputText v-model="editFormData.fullName" :placeholder="t('users.fullName')" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">{{ t('users.role') }} *</label>
              <Dropdown v-model="editFormData.role" :options="roleOptions" optionLabel="label" optionValue="value" class="w-full" required />
            </div>
          </div>
          <div class="users-dialog-footer">
            <div class="flex items-center gap-2">
              <Checkbox v-model="editFormData.isActive" inputId="isActive" binary />
              <label for="isActive" class="text-sm">{{ t('common.active') }}</label>
            </div>
            <div class="users-dialog-actions">
              <Button type="submit" :label="t('common.save')" />
              <Button type="button" :label="t('common.cancel')" severity="secondary" @click="showEditDialog = false" />
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useUsersStore } from '@/stores/users.store'
import { useUserGroupsStore } from '@/stores/user-groups.store'
import MainLayout from '@/layouts/MainLayout.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import Password from 'primevue/password'
import MultiSelect from 'primevue/multiselect'

const { t } = useI18n()
const toast = useToast()
const usersStore = useUsersStore()
const userGroupsStore = useUserGroupsStore()

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const editingId = ref<string | null>(null)
const searchQuery = ref('')
const statusFilter = ref<boolean[]>([])
const roleFilter = ref<string[]>([])
const viewMode = ref<'card' | 'table'>(
  (localStorage.getItem('users_view_mode') as 'card' | 'table') ?? 'table'
)

const statusOptions = computed(() => [
  { label: t('common.active'), value: true },
  { label: t('common.inactive'), value: false },
])

const createFormData = ref({
  email: '',
  fullName: '',
  password: '',
  role: 'Tenant.Viewer',
  isActive: true,
  groupIds: [] as string[],
})

const editFormData = ref({
  fullName: '',
  role: 'Tenant.Viewer',
  isActive: true,
})

const roleOptions = computed(() => [
  { label: t('users.roles.owner'), value: 'Tenant.Owner' },
  { label: t('users.roles.contributor'), value: 'Tenant.Contributor' },
  { label: t('users.roles.viewer'), value: 'Tenant.Viewer' },
])

const loading = computed(() => usersStore.loading)
const userGroupOptions = computed(() =>
  userGroupsStore.userGroups.map((group) => ({
    label: group.name,
    value: group.id,
  }))
)

const filteredUsers = computed(() => {
  let result = usersStore.users
  if (statusFilter.value.length > 0) {
    result = result.filter((u) => statusFilter.value.includes(u.isActive))
  }
  if (roleFilter.value.length > 0) {
    result = result.filter((u) => roleFilter.value.includes(u.role))
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        (user.fullName?.toLowerCase() ?? '').includes(query)
    )
  }
  return result
})

const setViewMode = (mode: 'card' | 'table') => {
  viewMode.value = mode
  localStorage.setItem('users_view_mode', mode)
}

const getRoleLabel = (role: string): string => {
  const roleMap: Record<string, string> = {
    'Tenant.Owner': t('users.roles.owner'),
    'Tenant.Contributor': t('users.roles.contributor'),
    'Tenant.Viewer': t('users.roles.viewer'),
  }
  return roleMap[role] || role
}

const getRoleSeverity = (role: string): string => {
  const severityMap: Record<string, string> = {
    'Tenant.Owner': 'info',
    'Tenant.Contributor': 'success',
    'Tenant.Viewer': 'secondary',
  }
  return severityMap[role] || 'info'
}

const formatLastLogin = (lastLoginAt: string | null): string => {
  if (!lastLoginAt) return t('users.never')
  const date = new Date(lastLoginAt)
  return new Intl.DateTimeFormat(navigator.language, {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(date)
}

const openCreateDialog = () => {
  createFormData.value = {
    email: '', fullName: '', password: '', role: 'Tenant.Viewer', isActive: true, groupIds: [],
  }
  showCreateDialog.value = true
}

const saveCreate = async () => {
  try {
    if (!createFormData.value.password || createFormData.value.password.length < 8) {
      toast.add({ severity: 'error', summary: t('common.error'), detail: t('users.passwordTooShort'), life: 3000 })
      return
    }
    const dto = {
      email: createFormData.value.email,
      fullName: createFormData.value.fullName || undefined,
      password: createFormData.value.password,
      role: createFormData.value.role,
      isActive: createFormData.value.isActive,
    }
    const createdUser = await usersStore.createUser(dto)
    for (const groupId of createFormData.value.groupIds) {
      await userGroupsStore.addGroupMember(groupId, { userId: createdUser.id })
    }
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('users.createSuccess'), life: 3000 })
    showCreateDialog.value = false
  } catch (error) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: (error as Error).message || t('common.error'), life: 3000 })
  }
}

const editUser = (user: any) => {
  editingId.value = user.id
  editFormData.value = {
    fullName: user.fullName || '',
    role: user.role,
    isActive: user.isActive,
  }
  showEditDialog.value = true
}

const saveEdit = async () => {
  if (!editingId.value) return
  try {
    const dto = {
      fullName: editFormData.value.fullName || undefined,
      role: editFormData.value.role,
      isActive: editFormData.value.isActive,
    }
    await usersStore.updateUser(editingId.value, dto)
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.save'), life: 3000 })
    showEditDialog.value = false
    editingId.value = null
  } catch (error) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: (error as Error).message || t('common.error'), life: 3000 })
  }
}

const deleteUser = async (id: string) => {
  if (confirm(t('common.confirm'))) {
    try {
      await usersStore.removeUser(id)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.delete'), life: 3000 })
    } catch (error) {
      toast.add({ severity: 'error', summary: t('common.error'), detail: (error as Error).message || t('common.error'), life: 3000 })
    }
  }
}

onMounted(async () => {
  try {
    await Promise.all([usersStore.fetchAll(), userGroupsStore.fetchAllUserGroups()])
  } catch (error) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: (error as Error).message || t('common.error'), life: 3000 })
  }
})
</script>

<style scoped src="./UsersListView.css"></style>
