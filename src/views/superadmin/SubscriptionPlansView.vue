<template>
  <MainLayout>
    <div class="plans-page">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="pi pi-credit-card" />
          </div>
          <div>
            <!-- <h1 class="header-title">{{ t('superadmin.plans.title') }}</h1> -->
            <p class="header-subtitle">{{ t('superadmin.plans.subtitle') }}</p>
          </div>
        </div>
        <button class="btn-create" @click="openCreateDialog">
          <i class="pi pi-plus" />
          <span>{{ t('superadmin.plans.createNew') }}</span>
        </button>
      </div>

      <!-- Stats Strip -->
      <div class="stats-strip">
        <div class="stat-pill">
          <i class="pi pi-list" />
          <span class="stat-val">{{ plans.length }}</span>
          <span class="stat-lbl">{{ t('common.total') }}</span>
        </div>
        <div class="stat-pill stat-active">
          <i class="pi pi-check-circle" />
          <span class="stat-val">{{ plans.filter(p => p.isActive).length }}</span>
          <span class="stat-lbl">{{ t('superadmin.plans.active') }}</span>
        </div>
        <div class="stat-pill stat-inactive">
          <i class="pi pi-minus-circle" />
          <span class="stat-val">{{ plans.filter(p => !p.isActive).length }}</span>
          <span class="stat-lbl">{{ t('superadmin.plans.inactive') }}</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner" />
        <span>{{ t('superadmin.plans.loading') }}</span>
      </div>

      <!-- Empty -->
      <div v-else-if="plans.length === 0" class="empty-state">
        <i class="pi pi-credit-card" />
        <p>{{ t('superadmin.plans.empty') }}</p>
        <button class="btn-create btn-create-sm" @click="openCreateDialog">
          <i class="pi pi-plus" />{{ t('superadmin.plans.createFirst') }}</button>
      </div>

      <!-- Plans Grid -->
      <div v-else class="plans-grid">
        <div
          v-for="(plan, idx) in plans"
          :key="plan.id"
          class="plan-card"
          :class="{ 'plan-inactive': !plan.isActive }"
        >
          <!-- Accent bar -->
          <div class="card-accent" :style="{ background: cardGradient(idx) }" />

          <div class="card-body">
            <!-- Title row -->
            <div class="card-title-row">
              <h3 class="card-name">{{ plan.name }}</h3>
               <span class="active-dot" :class="plan.isActive ? 'dot-active' : 'dot-inactive'" :title="plan.isActive ? t('common.active') : t('common.inactive')" />
            </div>

            <p class="card-desc">{{ plan.description || t('superadmin.plans.noDescription') }}</p>

            <!-- Quotas -->
            <div class="quotas-grid">
              <div class="quota-tile">
                <span class="quota-val quota-blue">{{ plan.maxSeats ?? '∞' }}</span>
                <span class="quota-lbl">{{ t('superadmin.plans.maxSeats') }}</span>
              </div>
              <div class="quota-tile">
                <span class="quota-val quota-green">{{ plan.maxResources ?? '∞' }}</span>
                <span class="quota-lbl">{{ t('superadmin.plans.maxResources') }}</span>
              </div>
              <div class="quota-tile">
                <span class="quota-val quota-purple">{{ plan.maxUsers ?? '∞' }}</span>
                <span class="quota-lbl">{{ t('superadmin.plans.maxUsers') }}</span>
              </div>
              <div class="quota-tile">
                <span class="quota-val quota-orange">{{ plan.maxBookingsPerMonth ?? '∞' }}</span>
                <span class="quota-lbl">{{ t('superadmin.plans.maxBookings') }}</span>
              </div>
            </div>

            <!-- Features -->
            <div v-if="plan.featureFlags.length > 0" class="features-section">
              <span class="features-title">{{ t('superadmin.plans.featuresLabel') }}</span>
              <div class="features-list">
                <span v-for="flag in plan.featureFlags" :key="flag" class="feature-chip">
                  <i class="pi pi-check" /> {{ flag }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="card-actions">
              <button class="card-btn card-btn-edit" @click="openEditDialog(plan)">
                <i class="pi pi-pencil" />
              </button>
              <button class="card-btn card-btn-delete" @click="deletePlan(plan.id)">
                <i class="pi pi-trash" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Create / Edit Dialog -->
      <AppDialog
        v-model:visible="showDialog"
        :header="editingPlan ? t('superadmin.plans.editPlan') : t('superadmin.plans.createNew')"
        :subtitle="editingPlan ? editingPlan.name : t('superadmin.plans.subtitle')"
        :icon="editingPlan ? 'pi pi-pencil' : 'pi pi-plus-circle'"
        severity="primary"
        size="lg"
      >
        <div class="dlg-form">
          <!-- Section: General -->
          <div class="dlg-section">
            <div class="dlg-section-title"><i class="pi pi-info-circle" />{{ t('superadmin.plans.generalInfo') }}</div>
            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('superadmin.name') }} <span class="req">*</span></label>
                <InputText v-model="formData.name" :placeholder="t('superadmin.name')" class="w-full" required />
              </div>
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('common.description') }}</label>
                <Textarea v-model="formData.description" :placeholder="t('common.description')" rows="2" class="w-full" />
              </div>
            </div>
          </div>

          <!-- Section: Quotas -->
          <div class="dlg-section">
            <div class="dlg-section-title"><i class="pi pi-gauge" />{{ t('superadmin.plans.limitsLabel') }}</div>
            <div class="dlg-quotas">
              <div v-for="q in quotaItems" :key="q.key" class="dlg-quota-card" :class="{ 'dlg-quota-unlimited': formData[q.key] == null }">
                <div class="dlg-quota-top">
                  <div class="dlg-quota-icon" :style="{ background: q.bg, color: q.color }">
                    <i :class="q.icon" />
                  </div>
                  <span class="dlg-quota-name">{{ q.label }}</span>
                </div>
                <div class="dlg-quota-control">
                  <template v-if="formData[q.key] == null">
                    <div class="dlg-quota-infinity">∞</div>
                    <span class="dlg-quota-hint">{{ t('superadmin.plans.unlimited') }}</span>
                  </template>
                  <template v-else>
                    <InputNumber
                      :modelValue="formData[q.key] as number"
                      @update:modelValue="(v: number | null) => (formData[q.key] as any) = v ?? 1"
                      :min="1" showButtons class="w-full dlg-quota-input"
                    />
                  </template>
                </div>
                <button
                  type="button"
                  class="dlg-quota-toggle"
                  :class="{ 'dlg-quota-toggle-on': formData[q.key] == null }"
                  @click="(formData[q.key] as any) = formData[q.key] == null ? 10 : undefined"
                >
                  <i :class="formData[q.key] == null ? 'pi pi-lock-open' : 'pi pi-infinity'" />
                  {{ formData[q.key] == null ? t('superadmin.plans.setLimit') : t('superadmin.plans.unlimited') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Section: Features -->
          <div class="dlg-section">
            <div class="dlg-section-title"><i class="pi pi-bolt" />{{ t('superadmin.plans.featuresLabel') }}</div>
            <MultiSelect v-model="formData.featureFlags" :options="availableFeatureFlags" :placeholder="t('superadmin.plans.selectFeatures')" class="w-full" />
          </div>

          <!-- Section: Status -->
          <div class="dlg-section dlg-section-status">
            <div class="dlg-status-row">
              <div>
                <div class="dlg-status-title">{{ t('superadmin.plans.isActive') }}</div>
                <div class="dlg-status-desc">{{ t('superadmin.plans.isActiveDesc') }}</div>
              </div>
              <ToggleSwitch v-model="formData.isActive" />
            </div>
          </div>
        </div>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="closeDialog">
            <i class="pi pi-times" /> {{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="saving" @click="savePlan">
            <i :class="saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'" />
            {{ t('common.save') }}
          </button>
        </template>
      </AppDialog>

      <Toast />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// ...existing imports...
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import MainLayout from '@/layouts/MainLayout.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import { plansApi } from '@/api/plans.api'
import type { SubscriptionPlan, CreateSubscriptionPlanDto } from '@/types/subscription-plan'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import MultiSelect from 'primevue/multiselect'
import ToggleSwitch from 'primevue/toggleswitch'
import Toast from 'primevue/toast'

const { t } = useI18n()
const toast = useToast()

// Quota items config for the dialog
const quotaItems = computed(() => [
  { key: 'maxSeats' as const, label: t('superadmin.plans.maxSeats'), icon: 'pi pi-users', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  { key: 'maxResources' as const, label: t('superadmin.plans.maxResources'), icon: 'pi pi-box', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  { key: 'maxUsers' as const, label: t('superadmin.plans.maxUsers'), icon: 'pi pi-user', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  { key: 'maxBookingsPerMonth' as const, label: t('superadmin.plans.maxBookings'), icon: 'pi pi-calendar', color: '#ea580c', bg: 'rgba(234,88,12,0.1)' },
])

const plans = ref<SubscriptionPlan[]>([])
const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const editingPlan = ref<SubscriptionPlan | null>(null)

const emptyForm = (): CreateSubscriptionPlanDto => ({
  name: '', description: '', maxSeats: undefined, maxResources: undefined,
  maxUsers: undefined, maxBookingsPerMonth: undefined, featureFlags: [], isActive: true,
})
const formData = ref<CreateSubscriptionPlanDto>(emptyForm())

const availableFeatureFlags = ['Webhooks', 'Analytics', 'SSO', 'WhiteLabel', 'AppReceptionPrebooking', 'CalendarSync', 'ApiRest']

const cardGradients = [
  'linear-gradient(135deg, #4f46e5, #7c3aed)',
  'linear-gradient(135deg, #0891b2, #06b6d4)',
  'linear-gradient(135deg, #059669, #10b981)',
  'linear-gradient(135deg, #d97706, #f59e0b)',
  'linear-gradient(135deg, #dc2626, #f43f5e)',
  'linear-gradient(135deg, #7c3aed, #a855f7)',
]
function cardGradient(idx: number): string {
  return cardGradients[idx % cardGradients.length]
}

const fetchPlans = async () => {
  loading.value = true
  try { plans.value = await plansApi.getAll() }
  catch { toast.add({ severity: 'error', summary: t('common.error'), detail: t('superadmin.plans.fetchError'), life: 3000 }) }
  finally { loading.value = false }
}

const openCreateDialog = () => { editingPlan.value = null; formData.value = emptyForm(); showDialog.value = true }
const openEditDialog = (plan: SubscriptionPlan) => {
  editingPlan.value = plan
  formData.value = {
    name: plan.name, description: plan.description ?? '',
    maxSeats: plan.maxSeats ?? undefined, maxResources: plan.maxResources ?? undefined,
    maxUsers: plan.maxUsers ?? undefined, maxBookingsPerMonth: plan.maxBookingsPerMonth ?? undefined,
    featureFlags: [...plan.featureFlags], isActive: plan.isActive,
  }
  showDialog.value = true
}
const closeDialog = () => { showDialog.value = false; editingPlan.value = null }

const savePlan = async () => {
  saving.value = true
  try {
    if (editingPlan.value) {
      await plansApi.update(editingPlan.value.id, formData.value)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('superadmin.plans.updated'), life: 3000 })
    } else {
      await plansApi.create(formData.value)
      toast.add({ severity: 'success', summary: t('common.success'), detail: t('superadmin.plans.created'), life: 3000 })
    }
    closeDialog(); await fetchPlans()
  } catch {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('superadmin.plans.saveError'), life: 3000 })
  } finally { saving.value = false }
}

const deletePlan = async (id: string) => {
  if (!confirm(t('superadmin.plans.confirmDelete'))) return
  try {
    await plansApi.remove(id)
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('superadmin.plans.deleted'), life: 3000 })
    await fetchPlans()
  } catch {
    toast.add({ severity: 'error', summary: t('common.error'), detail: t('superadmin.plans.deleteError'), life: 3000 })
  }
}

onMounted(fetchPlans)
</script>

<style scoped src="./SubscriptionPlansView.css"></style>

