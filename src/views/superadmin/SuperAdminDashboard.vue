<template>
  <MainLayout>
    <div class="sa-dashboard">

      <PageHeader
        :title="t('superadmin.dashboard.title')"
        :subtitle="t('superadmin.dashboard.subtitle')"
      >
        <template #actions>
          <router-link :to="{ name: 'TenantsList' }" class="btn-primary">
            <i class="pi pi-building" /> {{ t('superadmin.dashboard.manageTenants') }}
          </router-link>
          <router-link :to="{ name: 'SubscriptionPlans' }" class="btn-secondary">
            <i class="pi pi-credit-card" /> {{ t('superadmin.dashboard.managePlans') }}
          </router-link>
        </template>
      </PageHeader>

      <!-- KPI -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-blue">
          <div class="kpi-icon"><i class="pi pi-building" /></div>
          <div>
            <p class="kpi-label">{{ t('superadmin.dashboard.totalTenants') }}</p>
            <p class="kpi-value">{{ totalTenants }}</p>
          </div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-icon"><i class="pi pi-check-circle" /></div>
          <div>
            <p class="kpi-label">{{ t('superadmin.dashboard.activeTenants') }}</p>
            <p class="kpi-value">{{ activeTenants }}</p>
          </div>
        </div>
        <div class="kpi-card kpi-amber">
          <div class="kpi-icon"><i class="pi pi-pause-circle" /></div>
          <div>
            <p class="kpi-label">{{ t('superadmin.dashboard.suspendedTenants') }}</p>
            <p class="kpi-value">{{ suspendedTenants }}</p>
          </div>
        </div>
        <div class="kpi-card kpi-slate">
          <div class="kpi-icon"><i class="pi pi-calendar-plus" /></div>
          <div>
            <p class="kpi-label">{{ t('superadmin.dashboard.newLast30Days') }}</p>
            <p class="kpi-value">{{ newLast30Days }}</p>
          </div>
        </div>
      </div>

      <!-- Lista tenant recenti -->
      <Card class="sa-card">
        <template #title>{{ t('superadmin.dashboard.recentTenants') }}</template>
        <template #content>
          <DataTable :value="recentTenants" data-key="id" :rows="10" striped-rows>
            <Column :header="t('superadmin.name')" field="name" />
            <Column :header="t('superadmin.status')">
              <template #body="{ data }">
                <Tag :value="data.status" :severity="statusSeverity(data.status)" />
              </template>
            </Column>
            <Column :header="t('superadmin.createdAt')">
              <template #body="{ data }">
                {{ formatDate(data.createdAt) }}
              </template>
            </Column>
            <Column header="" style="width: 8rem">
              <template #body="{ data }">
                <div class="actions-cell">
                  <Button
                      class="action-btn action-impersonate"
                      :title="t('superadmin.impersonate')"
                      @click.stop="handleImpersonate(data)"
                  >
                    <i class="pi pi-sign-in" />
                  </Button>

                  <Button
                      icon="pi pi-arrow-right"
                      size="small"
                      severity="secondary"
                      text
                      @click="router.push({ name: 'TenantDetail', params: { id: data.id } })"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

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
import {computed, onMounted, ref, watch} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useTenantsStore } from '@/stores/tenants.store'
import { TenantStatus } from '@/types/enums'
import MainLayout from '@/layouts/MainLayout.vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type {Tenant} from "@/types";
import {authApi, type ImpersonationRole, type ImpersonationTarget} from "@/api/auth.api.ts";
import {useAuthStore} from "@/stores";
import {useToast} from "primevue/usetoast";
import Select from "primevue/select";
import PageHeader from '@/components/common/PageHeader.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import Toast from "primevue/toast";

const selectedImpersonateRole = ref('Tenant.Owner')
const selectedTargetId = ref<string>('')
const authStore = useAuthStore()

const showImpersonateDialog = ref(false)
const impersonateTenant = ref<Tenant | null>(null)
const impersonateLoading = ref(false)
const impersonateRoles = ref<ImpersonationRole[]>([])
const targetOptions = ref<ImpersonationTarget[]>([])
const targetsLoading = ref(false)


const { t } = useI18n()
const router = useRouter()
const tenantsStore = useTenantsStore()
const toast = useToast()

const tenants = computed(() => tenantsStore.tenants)
const totalTenants = computed(() => tenants.value.length)
const activeTenants = computed(() =>
  tenants.value.filter((x) => x.status === TenantStatus.Active).length,
)
const suspendedTenants = computed(() =>
  tenants.value.filter((x) => x.status === TenantStatus.Suspended).length,
)
const newLast30Days = computed(() => {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  return tenants.value.filter((x) => {
    const ts = x.createdAt ? Date.parse(x.createdAt) : 0
    return ts >= cutoff
  }).length
})
const recentTenants = computed(() =>
  tenants.value
    .slice()
    .sort((a, b) => Date.parse(b.createdAt ?? '0') - Date.parse(a.createdAt ?? '0'))
    .slice(0, 10),
)

function statusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case TenantStatus.Active: return 'success'
    case TenantStatus.Suspended: return 'warning'
    case TenantStatus.Deleted: return 'danger'
    default: return 'info'
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '–'
  try { return new Date(iso).toLocaleDateString() } catch { return iso }
}

onMounted(async () => {
  try { await tenantsStore.fetchAllTenants() } catch { /* ignore */ }
})

const handleImpersonate = (tenant: Tenant): void => {
  impersonateTenant.value = tenant
  selectedImpersonateRole.value = 'Tenant.Owner'
  selectedTargetId.value = ''
  targetOptions.value = []
  showImpersonateDialog.value = true
}

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

/** True quando il ruolo selezionato richiede un targetId. */
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

async function loadImpersonationRoles(): Promise<void> {
  try {
    impersonateRoles.value = await authApi.listImpersonationRoles()
  } catch {
    impersonateRoles.value = [
      { key: 'Tenant.Owner',       scope: 'Tenant', displayName: t('superadmin.roleTenantOwner'),       description: '', requiresTargetId: false },
      { key: 'Tenant.Contributor', scope: 'Tenant', displayName: t('superadmin.roleTenantContributor'), description: '', requiresTargetId: false },
      { key: 'Tenant.Reader',      scope: 'Tenant', displayName: t('superadmin.roleTenantViewer'),      description: '', requiresTargetId: false },
    ]
  }
}

const confirmImpersonate = async (): Promise<void> => {
  if (!impersonateTenant.value) return

  // Validazione client-side per ruoli con scope (--3.2 DRF).
  if (selectedRoleRequiresTarget.value && !selectedTargetId.value) {
    toast.add({
      severity: 'warn',
      summary: t('common.warning'),
      detail: t('superadmin.impersonateTargetRequired'),
      life: 3500,
    })
    return
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
    toast.add({ severity: 'warn', summary: t('superadmin.impersonate'), detail: t('superadmin.impersonateStarted', { tenant: impersonateTenant.value.name, role: selectedImpersonateRole.value }), life: 5000 })
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

// Helpers
const avatarColors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#2563eb', '#0d9488']
function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < (name?.length ?? 0); i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

</script>

<style scoped src="./SuperAdminDashboard.css"></style>

