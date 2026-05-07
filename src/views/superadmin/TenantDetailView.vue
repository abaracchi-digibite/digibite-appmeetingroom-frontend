<template>
  <MainLayout>
    <div class="tenant-detail">

      <!-- Back + Header -->
      <div class="top-nav">
        <button class="back-btn" @click="goBack">
          <i class="pi pi-arrow-left" />
          <span>{{ t('superadmin.tenants.title') }}</span>
        </button>
      </div>

      <div class="page-header">
        <div class="header-left">
          <div class="header-avatar" :style="{ background: avatarGradient }">
            {{ tenant?.name?.charAt(0)?.toUpperCase() || '?' }}
          </div>
          <div>
            <!-- <h1 class="header-title">{{ tenant?.name || '...' }}</h1> -->
            <div class="header-meta">
              <span v-if="tenant?.slug" class="slug-badge">{{ tenant.slug }}</span>
              <span class="status-chip" :class="'status-' + (tenant?.status || '').toLowerCase()">
                <i :class="statusIcon(tenant?.status)" />
                {{ tenant?.status }}
              </span>
              <span v-if="tenant?.createdAt" class="meta-date">
                <i class="pi pi-calendar" />
                Creato il {{ formatDate(tenant.createdAt) }}
              </span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-chip action-impersonate" @click="handleImpersonate(tenant!)">
            <i class="pi pi-sign-in" /> {{ t('superadmin.impersonate') }}
          </button>

          <button
            v-if="tenant?.status === TenantStatus.Active"
            class="action-chip action-suspend"
            @click="suspendTenantAction"
          >
            <i class="pi pi-pause" /> {{ t('superadmin.suspend') }}
          </button>
          <button
            v-else-if="tenant?.status === TenantStatus.Suspended"
            class="action-chip action-activate"
            @click="activateTenantAction"
          >
            <i class="pi pi-play" /> {{ t('superadmin.activate') }}
          </button>
          <button class="action-chip action-delete" @click="deleteTenantAction">
            <i class="pi pi-trash" /> {{ t('common.delete') }}
          </button>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="content-grid">

        <!-- LEFT: Info Form -->
        <div class="panel">
          <div class="panel-header">
            <i class="pi pi-pencil" />
            <span>{{ t('common.information') }}</span>
          </div>
          <form @submit.prevent="saveTenant" class="panel-body">
            <div class="form-grid">
              <div class="form-field">
                <label>{{ t('superadmin.name') }} *</label>
                <InputText v-model="formData.name" class="w-full" required />
              </div>
              <div class="form-field">
                <label>{{ t('common.description') }}</label>
                <InputText v-model="formData.description" class="w-full" />
              </div>
              <div class="form-field">
                <label>{{ t('superadmin.senderEmail') }}</label>
                <InputText v-model="formData.senderEmail" type="email" class="w-full" />
              </div>
              <div class="form-field">
                <label>{{ t('superadmin.senderName') }}</label>
                <InputText v-model="formData.senderName" class="w-full" />
              </div>
              <div class="form-field">
                <label>{{ t('superadmin.customDomain') }}</label>
                <InputText v-model="formData.customDomain" class="w-full" />
              </div>
              <div class="form-field">
                <label>{{ t('superadmin.piiRetentionDays') }}</label>
                <InputNumber v-model="formData.piiRetentionDays" :min="1" :max="3650" class="w-full" />
              </div>
              <div class="form-field full">
                <label>{{ t('superadmin.tenants.logoUrl') }}</label>
                <InputText v-model="formData.logoUrl" placeholder="https://..." class="w-full" />
              </div>
            </div>

            <!-- Colors -->
            <div class="color-row">
              <div class="color-field">
                <label>{{ t('superadmin.primaryColor') }}</label>
                <div class="color-input">
                  <ColorPicker v-model="formData.primaryColor" format="hex" />
                  <InputText v-model="formData.primaryColor" class="flex-1" placeholder="#4f46e5" />
                </div>
              </div>
              <div class="color-field">
                <label>{{ t('superadmin.secondaryColor') }}</label>
                <div class="color-input">
                  <ColorPicker v-model="formData.secondaryColor" format="hex" />
                  <InputText v-model="formData.secondaryColor" class="flex-1" placeholder="#7c3aed" />
                </div>
              </div>
            </div>

            <div class="form-actions">
              <Button type="button" :label="t('common.cancel')" severity="secondary" outlined @click="goBack" />
              <Button type="submit" :label="t('common.save')" icon="pi pi-check" :loading="tenantsStore.loading" class="btn-save" />
            </div>
          </form>
        </div>

        <!-- RIGHT: Plan + Stats -->
        <div class="side-panels">

          <!-- Subscription Plan -->
          <div class="panel">
            <div class="panel-header">
              <i class="pi pi-credit-card" />
              <span>{{ t('superadmin.plans.assignPlanTitle') }}</span>
            </div>
            <div class="panel-body">
              <div v-if="currentPlanName" class="current-plan">
                <div class="plan-badge">
                  <i class="pi pi-star-fill" />
                  <span>{{ currentPlanName }}</span>
                </div>
                <span class="plan-label">{{ t('superadmin.tenants.currentPlan') }}</span>
              </div>
              <div v-else class="no-plan">
                <i class="pi pi-info-circle" />
                <span>{{ t('superadmin.plans.noPlanAssigned') }}</span>
              </div>
              <div class="plan-select-row">
                <Select
                  v-model="selectedPlanId"
                  :options="planOptions"
                  option-:label="t('views.tenantDetail.label')"
                  option-value="value"
                  :placeholder="t('superadmin.plans.selectPlan')"
                  :loading="plansLoading"
                  show-clear
                  class="flex-1"
                />
                <Button
                  icon="pi pi-check"
                  :loading="assigningPlan"
                  @click="assignPlan"
                  class="btn-save"
                  :disabled="!selectedPlanId && !tenant?.subscriptionPlanId"
                />
              </div>
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="kpi-stack">
            <div class="kpi-card kpi-blue">
              <div class="kpi-icon"><i class="pi pi-users" /></div>
              <div class="kpi-content">
                <span class="kpi-value">–</span>
                <span class="kpi-label">{{ t('superadmin.seatsUsed') }}</span>
              </div>
            </div>
            <div class="kpi-card kpi-green">
              <div class="kpi-icon"><i class="pi pi-box" /></div>
              <div class="kpi-content">
                <span class="kpi-value">–</span>
                <span class="kpi-label">{{ t('superadmin.resourcesCreated') }}</span>
              </div>
            </div>
            <div class="kpi-card kpi-purple">
              <div class="kpi-icon"><i class="pi pi-calendar" /></div>
              <div class="kpi-content">
                <span class="kpi-value">–</span>
                <span class="kpi-label">{{ t('superadmin.bookingsThisMonth') }}</span>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="panel">
            <div class="panel-header">
              <i class="pi pi-history" />
              <span>{{ t('superadmin.recentActivity') }}</span>
            </div>
            <div class="panel-body activity-empty">
              <i class="pi pi-clock" />
              <p>{{ t('common.noData') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Impersonation Role Dialog -->
      <Dialog
          v-model:visible="showImpersonateDialog"
          :header="t('superadmin.impersonateAs')"
          :modal="true"
          :style="{ width: '420px' }"
          :breakpoints="{ '768px': '95vw' }"
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
                option-:label="t('views.tenantDetail.label')"
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
                option-:label="t('views.tenantDetail.label')"
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
          <div class="dialog-actions">
            <Button :label="t('common.cancel')" severity="secondary" outlined @click="showImpersonateDialog = false" />
            <Button
                :label="t('superadmin.impersonate')"
                icon="pi pi-sign-in"
                :loading="impersonateLoading"
                @click="confirmImpersonate"
                class="btn-impersonate"
            />
          </div>
        </template>
      </Dialog>

    </div>
    <Toast />
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useTenantsStore } from '@/stores/tenants.store'
import MainLayout from '@/layouts/MainLayout.vue'
import type {Tenant, UpdateTenantDto} from '@/types/tenant'
import type { SubscriptionPlan } from '@/types/subscription-plan'
import { TenantStatus } from '@/types/enums'
import { plansApi } from '@/api/plans.api'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ColorPicker from 'primevue/colorpicker'
import Toast from 'primevue/toast'
import {authApi, type ImpersonationRole, type ImpersonationTarget} from "@/api/auth.api.ts";
import {useAuthStore} from "@/stores";
import Dialog from "primevue/dialog";

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const tenantsStore = useTenantsStore()

// State
const formData = ref<UpdateTenantDto>({
  name: '', description: '', senderEmail: '', senderName: '',
  customDomain: '', logoUrl: '', primaryColor: '', secondaryColor: '', piiRetentionDays: 90,
})
const availablePlans = ref<SubscriptionPlan[]>([])
const plansLoading = ref(false)
const assigningPlan = ref(false)
const selectedPlanId = ref<string | null>(null)
const impersonateTenant = ref<Tenant | null>(null)
const selectedImpersonateRole = ref('Tenant.Owner')
const selectedTargetId = ref<string>('')
const showImpersonateDialog = ref(false)
const impersonateLoading = ref(false)
const impersonateRoles = ref<ImpersonationRole[]>([])
const targetOptions = ref<ImpersonationTarget[]>([])
const targetsLoading = ref(false)
const authStore = useAuthStore()

// Computed
const tenant = computed(() => {
  const id = route.params.id as string
  return tenantsStore.tenantById(id)
})

const avatarGradient = computed(() => {
  const c1 = formData.value.primaryColor || '#4f46e5'
  const c2 = formData.value.secondaryColor || '#7c3aed'
  return `linear-gradient(135deg, ${c1}, ${c2})`
})

const planOptions = computed(() => availablePlans.value.map((p) => ({ label: p.name, value: p.id })))
const currentPlanName = computed(() => {
  if (!tenant.value?.subscriptionPlanId) return null
  return availablePlans.value.find((p) => p.id === tenant.value!.subscriptionPlanId)?.name ?? tenant.value.subscriptionPlanId
})

// Helpers
function statusIcon(status?: string): string {
  switch (status) {
    case TenantStatus.Active: return 'pi pi-check-circle'
    case TenantStatus.Suspended: return 'pi pi-pause-circle'
    case TenantStatus.Deleted: return 'pi pi-times-circle'
    default: return 'pi pi-info-circle'
  }
}
function formatDate(iso: string | null | undefined): string {
  if (!iso) return '–'
  try { return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) } catch { return iso }
}

const goBack = () => router.push('/superadmin/tenants')

const saveTenant = async () => {
  try {
    const id = route.params.id as string
    await tenantsStore.updateTenant(id, formData.value)
    toast.add({ severity: 'success', summary: 'Salvato', detail: 'Tenant aggiornato con successo', life: 3000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Errore', detail: 'Errore nel salvataggio', life: 3000 })
  }
}

const suspendTenantAction = async () => {
  if (confirm(t('superadmin.confirmSuspend'))) {
    try { await tenantsStore.suspendTenant(route.params.id as string) } catch { /* */ }
  }
}
const activateTenantAction = async () => {
  if (confirm(t('superadmin.confirmActivate'))) {
    try { await tenantsStore.activateTenant(route.params.id as string) } catch { /* */ }
  }
}
const deleteTenantAction = async () => {
  if (confirm(t('common.confirm'))) {
    try { await tenantsStore.removeTenant(route.params.id as string); goBack() } catch { /* */ }
  }
}

const assignPlan = async () => {
  const id = route.params.id as string
  assigningPlan.value = true
  try {
    await plansApi.assignToTenant(id, selectedPlanId.value)
    await tenantsStore.fetchTenantById(id)
    toast.add({
      severity: 'success', summary: t('common.success'),
      detail: selectedPlanId.value ? t('superadmin.plans.planAssigned') : t('superadmin.plans.planRemoved'), life: 3000,
    })
  } catch {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('superadmin.plans.assignError'), life: 3000 })
  } finally { assigningPlan.value = false }
}

onMounted(async () => {
  try {
    const id = route.params.id as string
    const [loadedTenant] = await Promise.all([
      tenantsStore.fetchTenantById(id),
      (async () => { plansLoading.value = true; try { availablePlans.value = await plansApi.getAll() } finally { plansLoading.value = false } })(),
    ])
    formData.value = {
      name: loadedTenant.name,
      description: loadedTenant.description ?? '',
      logoUrl: loadedTenant.logoUrl ?? '',
      primaryColor: loadedTenant.primaryColor ?? '',
      secondaryColor: loadedTenant.secondaryColor ?? '',
      customDomain: loadedTenant.customDomain ?? '',
      senderEmail: loadedTenant.senderEmail ?? '',
      senderName: loadedTenant.senderName ?? '',
      piiRetentionDays: loadedTenant.piiRetentionDays,
    }
    selectedPlanId.value = loadedTenant.subscriptionPlanId ?? null
  } catch { /* */ }
})

async function loadImpersonationRoles(): Promise<void> {
  try {
    impersonateRoles.value = await authApi.listImpersonationRoles()
  } catch {
    impersonateRoles.value = [
      { key: 'Tenant.Owner',       scope: 'Tenant', displayName: 'Tenant Owner',       description: '', requiresTargetId: false },
      { key: 'Tenant.Contributor', scope: 'Tenant', displayName: 'Tenant Contributor', description: '', requiresTargetId: false },
      { key: 'Tenant.Reader',      scope: 'Tenant', displayName: 'Tenant Reader',      description: '', requiresTargetId: false },
    ]
  }
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
 * in fase di impersonazione.
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

// Quando cambia il ruolo selezionato ricarichiamo la lista dei target.
watch(selectedImpersonateRole, () => {
  selectedTargetId.value = ''
  if (selectedRoleRequiresTarget.value) {
    void loadTargetsFor(selectedRoleScope.value)
  } else {
    targetOptions.value = []
  }
})

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

const avatarColors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#2563eb', '#0d9488']
function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < (name?.length ?? 0); i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length]
}
</script>

<style scoped src="./TenantDetailView.css"></style>

