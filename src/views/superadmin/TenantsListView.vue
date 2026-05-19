<template>
  <MainLayout>
    <div class="tenants-page">

      <PageHeader
        :title="t('superadmin.tenants.title')"
        :subtitle="t('superadmin.tenants.subtitle')"
      >
        <template #actions>
          <button type="button" class="btn-create" @click="openCreateDialog">
            <i class="pi pi-plus" />{{ t('superadmin.createNewTenant') }}
          </button>
        </template>
      </PageHeader>

      <!-- Stats Strip -->
      <div class="stats-strip">
        <div class="stat-pill">
          <i class="pi pi-building" />
          <span class="stat-value">{{ tenantsStore.tenants.length }}</span>
          <span class="stat-label">{{ t('common.total') }}</span>
        </div>
        <div class="stat-pill stat-active">
          <i class="pi pi-check-circle" />
          <span class="stat-value">{{ activeTenantCount }}</span>
          <span class="stat-label">{{ t('superadmin.tenants.active') }}</span>
        </div>
        <div class="stat-pill stat-suspended">
          <i class="pi pi-pause-circle" />
          <span class="stat-value">{{ suspendedTenantCount }}</span>
          <span class="stat-label">{{ t('superadmin.tenants.suspended') }}</span>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <IconField class="search-field">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            :placeholder="t('common.search') + '...'"
            class="w-full"
          />
        </IconField>

        <Dropdown
          v-model="statusFilter"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          :placeholder="t('common.filter')"
          class="filter-dropdown"
          show-clear
        />
      </div>

      <!-- DataTable -->
      <div class="table-card">
        <DataTable
          :value="filteredTenants"
          :loading="tenantsStore.loading"
          paginator
          :rows="10"
          :rows-per-page-options="[5, 10, 25]"
          row-hover
          striped-rows
          removable-sort
          @row-click="navigateToDetail"
          class="tenants-table"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-building-columns" />
              <p>{{ t('superadmin.tenants.empty') }}</p>
            </div>
          </template>

          <Column field="name" :header="t('superadmin.name')" sortable style="min-width: 180px">
            <template #body="{ data }">
              <div class="tenant-name-cell">
                <div class="tenant-avatar" :style="{ background: avatarColor(data.name) }">
                  {{ data.name?.charAt(0)?.toUpperCase() }}
                </div>
                <div>
                  <span class="tenant-name">{{ data.name }}</span>
                  <span class="tenant-slug">{{ data.slug }}</span>
                </div>
              </div>
            </template>
          </Column>

          <Column field="status" :header="t('common.status')" sortable style="width: 130px">
            <template #body="{ data }">
              <span class="status-chip" :class="'status-' + (data.status || '').toLowerCase()">
                <i :class="statusIcon(data.status)" />
                {{ data.status }}
              </span>
            </template>
          </Column>

          <Column field="senderEmail" :header="t('superadmin.senderEmail')" style="min-width: 180px">
            <template #body="{ data }">
              <span class="text-secondary">{{ data.senderEmail || '–' }}</span>
            </template>
          </Column>

          <Column field="customDomain" :header="t('superadmin.customDomain')" style="min-width: 140px">
            <template #body="{ data }">
              <span class="text-secondary">{{ data.customDomain || '–' }}</span>
            </template>
          </Column>

          <Column :header="t('superadmin.createdAt')" sortable sort-field="createdAt" style="width: 130px">
            <template #body="{ data }">
              <span class="text-secondary">{{ formatDate(data.createdAt) }}</span>
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 200px" frozen align-right>
            <template #body="{ data }">
              <div class="actions-cell">
                <button
                  class="action-btn action-impersonate"
                  :title="t('superadmin.impersonate')"
                  @click.stop="handleImpersonate(data)"
                >
                  <i class="pi pi-sign-in" />
                </button>
                <button
                  class="action-btn action-view"
                  :title="t('common.detail')"
                  @click.stop="navigateToDetail({ data })"
                >
                  <i class="pi pi-eye" />
                </button>
                <button
                  v-if="data.status === TenantStatus.Active"
                  class="action-btn action-suspend"
                  :title="t('superadmin.suspend')"
                  @click.stop="suspendTenantAction(data)"
                >
                  <i class="pi pi-pause" />
                </button>
                <button
                  v-else-if="data.status === TenantStatus.Suspended"
                  class="action-btn action-activate"
                  :title="t('superadmin.activate')"
                  @click.stop="activateTenantAction(data)"
                >
                  <i class="pi pi-play" />
                </button>
                <button
                  class="action-btn action-delete"
                  :title="t('common.delete')"
                  @click.stop="deleteTenantAction(data.id)"
                >
                  <i class="pi pi-trash" />
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Create Dialog -->
      <AppDialog
        v-model:visible="showCreateDialog"
        :header="t('superadmin.createNewTenant')"
        icon="pi pi-building-columns"
        severity="primary"
        size="md"
      >
        <form @submit.prevent="saveTenant" class="dlg-form">
          <div class="dlg-section">
            <div class="dlg-fields-2">
              <div class="dlg-field">
                <label class="dlg-label">{{ t('superadmin.name') }} *</label>
                <InputText v-model="formData.name" :placeholder="t('superadmin.name')" class="w-full" required />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('superadmin.slug') }}</label>
                <InputText v-model="formData.slug" :placeholder="t('superadmin.slug')" class="w-full" />
              </div>
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('common.description') }}</label>
                <InputText v-model="formData.description" :placeholder="t('common.description')" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('superadmin.senderEmail') }}</label>
                <InputText v-model="formData.senderEmail" type="email" :placeholder="t('superadmin.senderEmail')" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('superadmin.senderName') }}</label>
                <InputText v-model="formData.senderName" :placeholder="t('superadmin.senderName')" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('superadmin.customDomain') }}</label>
                <InputText v-model="formData.customDomain" :placeholder="t('superadmin.customDomain')" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('superadmin.piiRetentionDays') }}</label>
                <InputNumber v-model="formData.piiRetentionDays" :min="1" :max="3650" class="w-full" />
              </div>
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('plants.logoUrl') }}</label>
                <InputText v-model="formData.logoUrl" :placeholder="t('plants.logoUrlPlaceholder')" class="w-full" />
              </div>
            </div>
          </div>
        </form>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="closeDialog">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="tenantsStore.loading" @click="saveTenant">
            <i :class="tenantsStore.loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'" />{{ t('common.save') }}
          </button>
        </template>
      </AppDialog>

      <!-- Impersonation Role Dialog -->
      <AppDialog
        v-model:visible="showImpersonateDialog"
        :header="t('superadmin.impersonateAs')"
        icon="pi pi-sign-in"
        severity="warning"
        size="sm"
      >
        <div class="impersonate-body">
          <div class="impersonate-tenant-info">
            <div class="tenant-avatar" :style="{ background: avatarColor(impersonateTenant?.name ?? '') }">
              {{ impersonateTenant?.name?.charAt(0)?.toUpperCase() }}
            </div>
            <div>
              <p class="impersonate-tenant-name">{{ impersonateTenant?.name }}</p>
              <p class="impersonate-tenant-slug">{{ impersonateTenant?.slug }}</p>
            </div>
          </div>
          <div class="form-field" style="margin-top: 1rem;">
            <label>{{ t('superadmin.impersonateRole') }}</label>
            <Select
              v-model="selectedImpersonateRole"
              :options="impersonateRoleOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            >
              <template #option="{ option }">
                <div class="role-option">
                  <div class="role-option-head">
                    <span class="role-option-label">{{ option.label }}</span>
                    <span class="role-scope-chip" :data-scope="option.scope">{{ option.scope }}</span>
                  </div>
                  <span v-if="option.description" class="role-option-desc">{{ option.description }}</span>
                  <span v-if="option.requiresTargetId" class="role-option-warn">
                    {{ t('superadmin.impersonateRequiresTarget') }}
                  </span>
                </div>
              </template>
            </Select>
          </div>

          <!-- Target Select (shown only for scoped roles) -->
          <div v-if="selectedRoleRequiresTarget" class="form-field" style="margin-top: 1rem;">
            <label>
              {{ t('superadmin.impersonateTargetId') }}
              <span class="required-star">*</span>
            </label>
            <Select
              v-model="selectedTargetId"
              :options="targetOptions"
              option-label="label"
              option-value="id"
              :loading="targetsLoading"
              :placeholder="targetsLoading
                ? t('common.loading')
                : (targetOptions.length === 0
                    ? t('superadmin.impersonateNoTargets')
                    : t('superadmin.impersonateSelectTarget'))"
              :disabled="targetsLoading || targetOptions.length === 0"
              class="w-full"
            >
              <template #option="{ option }">
                <div class="target-option">
                  <span class="target-option-label">{{ option.label }}</span>
                  <span v-if="option.secondaryLabel" class="target-option-secondary">
                    {{ option.secondaryLabel }}
                  </span>
                </div>
              </template>
            </Select>
            <small class="help-text">
              <i class="pi pi-info-circle" />
              {{ t('superadmin.impersonateTargetIdHelp', { scope: selectedRoleScope }) }}
            </small>
          </div>
        </div>
        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="showImpersonateDialog = false">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="impersonateLoading" @click="confirmImpersonate">
            <i :class="impersonateLoading ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'" />{{ t('superadmin.impersonate') }}
          </button>
        </template>
      </AppDialog>

      <Toast />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useTenantsStore } from '@/stores/tenants.store'
import { useAuthStore } from '@/stores/auth.store'
import MainLayout from '@/layouts/MainLayout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import { authApi, type ImpersonationRole, type ImpersonationTarget } from '@/api/auth.api'
import type { Tenant, CreateTenantDto } from '@/types/tenant'
import { TenantStatus } from '@/types/enums'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Toast from 'primevue/toast'

const { t, locale } = useI18n()
const router = useRouter()
const toast = useToast()
const tenantsStore = useTenantsStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const statusFilter = ref<string | null>(null)
const showCreateDialog = ref(false)
const showImpersonateDialog = ref(false)
const impersonateTenant = ref<Tenant | null>(null)
const selectedImpersonateRole = ref('Tenant.Owner')
const selectedTargetId = ref<string>('')
const impersonateLoading = ref(false)
const impersonateRoles = ref<ImpersonationRole[]>([])
const targetOptions = ref<ImpersonationTarget[]>([])
const targetsLoading = ref(false)

const impersonateRoleOptions = computed(() =>
  impersonateRoles.value
    .slice()
    .sort((a, b) => Number(a.requiresTargetId) - Number(b.requiresTargetId))
    .map((r) => ({
      label: r.displayName,
      value: r.key,
      description: r.description,
      scope: r.scope,
      requiresTargetId: r.requiresTargetId,
    })),
)

/** Ruolo attualmente selezionato (oggetto completo). */
const selectedRoleDef = computed<ImpersonationRole | undefined>(() =>
  impersonateRoles.value.find((r) => r.key === selectedImpersonateRole.value),
)

/** True quando il ruolo selezionato richiede un targetId (Site/Resource/Booking/...). */
const selectedRoleRequiresTarget = computed<boolean>(
  () => selectedRoleDef.value?.requiresTargetId === true,
)

/** Scope del ruolo selezionato - usato nel label dell'input target. */
const selectedRoleScope = computed<string>(() => selectedRoleDef.value?.scope ?? 'Tenant')

/**
 * Carica la lista dei target (Site/ResourceType/Resource/Booking) del tenant
 * in fase di impersonazione. Chiamata quando l'admin seleziona un ruolo scoped.
 */
async function loadTargetsFor(scope: string): Promise<void> {
  if (!impersonateTenant.value) return
  if (scope !== 'Plant' && scope !== 'ResourceType' && scope !== 'Resource' && scope !== 'Booking') {
    targetOptions.value = []
    return
  }
  targetsLoading.value = true
  try {
    targetOptions.value = await authApi.listImpersonationTargets(
      impersonateTenant.value.id,
      scope,
    )
  } catch {
    targetOptions.value = []
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('superadmin.impersonateTargetsLoadError'),
      life: 3000,
    })
  } finally {
    targetsLoading.value = false
  }
}

// Quando cambia il ruolo selezionato ricarichiamo la lista dei target
// corrispondente al nuovo scope (e resettiamo la selezione precedente).
watch(selectedImpersonateRole, () => {
  selectedTargetId.value = ''
  if (selectedRoleRequiresTarget.value) {
    void loadTargetsFor(selectedRoleScope.value)
  } else {
    targetOptions.value = []
  }
})

const activeTenantCount = computed(() =>
  tenantsStore.tenants.filter((x) => x.status === TenantStatus.Active).length
)
const suspendedTenantCount = computed(() =>
  tenantsStore.tenants.filter((x) => x.status === TenantStatus.Suspended).length
)

async function loadImpersonationRoles(): Promise<void> {
  try {
    impersonateRoles.value = await authApi.listImpersonationRoles()
  } catch {
    // Fallback: elenco completo dei ruoli DRF --3.2 in caso il backend non risponda.
    // Viene usato solo in caso di errore di rete o endpoint non disponibile.
    impersonateRoles.value = [
      { key: 'Tenant.Owner',        scope: 'Tenant',       displayName: t('superadmin.roleTenantOwner'),        description: t('superadmin.roleDescTenantOwner'), requiresTargetId: false },
      { key: 'Tenant.Admin',        scope: 'Tenant',       displayName: t('superadmin.roleTenantAdmin'),        description: t('superadmin.roleDescTenantAdmin'), requiresTargetId: false },
      { key: 'Tenant.Contributor',  scope: 'Tenant',       displayName: t('superadmin.roleTenantContributor'),  description: t('superadmin.roleDescTenantContributor'), requiresTargetId: false },
      { key: 'Tenant.Reader',       scope: 'Tenant',       displayName: t('superadmin.roleTenantViewer'),       description: t('superadmin.roleDescTenantViewer'), requiresTargetId: false },
      { key: 'Plant.Owner',         scope: 'Plant',        displayName: t('superadmin.rolePlantOwner'),         description: t('superadmin.roleDescPlantOwner'), requiresTargetId: true },
      { key: 'Plant.Contributor',   scope: 'Plant',        displayName: t('superadmin.rolePlantContributor'),   description: t('superadmin.roleDescPlantContributor'), requiresTargetId: true },
      { key: 'Plant.Reader',        scope: 'Plant',        displayName: t('superadmin.rolePlantReader'),        description: t('superadmin.roleDescPlantReader'), requiresTargetId: true },
      { key: 'ResourceType.Owner',  scope: 'ResourceType', displayName: t('superadmin.roleResourceTypeOwner'),  description: t('superadmin.roleDescResourceTypeOwner'), requiresTargetId: true },
      { key: 'ResourceType.Reader', scope: 'ResourceType', displayName: t('superadmin.roleResourceTypeReader'), description: t('superadmin.roleDescResourceTypeReader'), requiresTargetId: true },
      { key: 'Resource.Owner',      scope: 'Resource',     displayName: t('superadmin.roleResourceOwner'),      description: t('superadmin.roleDescResourceOwner'), requiresTargetId: true },
      { key: 'Resource.Approver',   scope: 'Resource',     displayName: t('superadmin.roleResourceApprover'),   description: t('superadmin.roleDescResourceApprover'), requiresTargetId: true },
      { key: 'Resource.Booker',     scope: 'Resource',     displayName: t('superadmin.roleResourceBooker'),     description: t('superadmin.roleDescResourceBooker'), requiresTargetId: true },
      { key: 'Resource.Reader',     scope: 'Resource',     displayName: t('superadmin.roleResourceReader'),     description: t('superadmin.roleDescResourceReader'), requiresTargetId: true },
      { key: 'Booking.Organizer',   scope: 'Booking',      displayName: t('superadmin.roleBookingOrganizer'),   description: t('superadmin.roleDescBookingOrganizer'), requiresTargetId: true },
      { key: 'Booking.Reader',      scope: 'Booking',      displayName: t('superadmin.roleBookingReader'),      description: t('superadmin.roleDescBookingReader'), requiresTargetId: true },
    ]
  }
}

const emptyForm = (): CreateTenantDto => ({
  name: '', slug: '', description: '', senderEmail: '', senderName: '', customDomain: '', logoUrl: '', piiRetentionDays: 90,
})
const formData = ref<CreateTenantDto>(emptyForm())

const statusOptions = computed(() => [
  { label: t('superadmin.active'), value: TenantStatus.Active },
  { label: t('superadmin.suspended'), value: TenantStatus.Suspended },
  { label: t('superadmin.deleted'), value: TenantStatus.Deleted },
])

const filteredTenants = computed(() => {
  let result = tenantsStore.tenants
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.slug ?? '').toLowerCase().includes(q) || (t.senderEmail ?? '').toLowerCase().includes(q)
    )
  }
  if (statusFilter.value) {
    result = result.filter((t) => t.status === statusFilter.value)
  }
  return result
})

// Helpers
const avatarColors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#2563eb', '#0d9488']
function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < (name?.length ?? 0); i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function statusIcon(status: string): string {
  switch (status) {
    case TenantStatus.Active: return 'pi pi-check-circle'
    case TenantStatus.Suspended: return 'pi pi-pause-circle'
    case TenantStatus.Deleted: return 'pi pi-times-circle'
    default: return 'pi pi-info-circle'
  }
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '–'
  try { return new Date(dateString).toLocaleDateString(locale.value, { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return dateString }
}

const openCreateDialog = () => { formData.value = emptyForm(); showCreateDialog.value = true }
const closeDialog = () => { showCreateDialog.value = false }
const navigateToDetail = (event: { data: Tenant }) => { router.push(`/superadmin/tenants/${event.data.id}`) }

const saveTenant = async () => {
  try {
    await tenantsStore.createTenant(formData.value)
    closeDialog()
    toast.add({ severity: 'success', summary: t('superadmin.tenantCreated'), detail: formData.value.name, life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('superadmin.tenantCreateError'), life: 3000 })
  }
}

const suspendTenantAction = async (tenant: Tenant) => {
  if (confirm(t('superadmin.confirmSuspend'))) {
    try { await tenantsStore.suspendTenant(tenant.id) } catch { /* */ }
  }
}
const activateTenantAction = async (tenant: Tenant) => {
  if (confirm(t('superadmin.confirmActivate'))) {
    try { await tenantsStore.activateTenant(tenant.id) } catch { /* */ }
  }
}
const deleteTenantAction = async (id: string) => {
  if (confirm(t('common.confirm'))) {
    try { await tenantsStore.removeTenant(id) } catch { /* */ }
  }
}

const handleImpersonate = (tenant: Tenant): void => {
  impersonateTenant.value = tenant
  selectedImpersonateRole.value = 'Tenant.Owner'
  selectedTargetId.value = ''
  targetOptions.value = []
  showImpersonateDialog.value = true
}

const confirmImpersonate = async (): Promise<void> => {
  if (!impersonateTenant.value) return

  // Validazione client-side per ruoli con scope (--3.2 DRF).
  // Il target arriva da una Select popolata dal backend: basta controllare
  // che sia stato selezionato un id valido fra le opzioni.
  if (selectedRoleRequiresTarget.value) {
    if (!selectedTargetId.value) {
      toast.add({
        severity: 'warn',
        summary: t('common.warning'),
        detail: t('superadmin.impersonateTargetRequired'),
        life: 3500,
      })
      return
    }
  }

  impersonateLoading.value = true
  try {
    const targetId = selectedRoleRequiresTarget.value ? selectedTargetId.value : undefined
    await authStore.startImpersonation(
      impersonateTenant.value.id,
      selectedImpersonateRole.value,
      targetId,
    )
    showImpersonateDialog.value = false
    toast.add({
      severity: 'warn',
      summary: t('superadmin.impersonate'),
      detail: t('superadmin.impersonateStarted', {
        tenant: impersonateTenant.value.name,
        role: selectedImpersonateRole.value,
      }),
      life: 5000,
    })
    router.push('/dashboard')
  } catch {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('superadmin.impersonateError'), life: 3000 })
  } finally {
    impersonateLoading.value = false
  }
}

onMounted(async () => {
  try { await Promise.all([tenantsStore.fetchAllTenants(), loadImpersonationRoles()]) } catch { /* */ }
})
</script>

<style scoped src="./TenantsListView.css"></style>

