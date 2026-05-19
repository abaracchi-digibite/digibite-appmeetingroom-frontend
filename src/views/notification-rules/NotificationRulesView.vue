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
          <button type="button" class="list-btn-secondary" @click="showHelpModal = true">
            <i class="pi pi-question-circle" />
            <span>{{ t('notifications.howItWorks') }}</span>
          </button>
          <button type="button" class="list-btn-primary" @click="openCreateDialog">
            <i class="pi pi-plus" />
            <span>{{ t('notifications.createNew') }}</span>
          </button>
        </div>

        <div class="list-row-secondary">
          <div class="list-filter-inline">
            <label class="list-filter-label-inline">{{ t('common.status') }}</label>
            <PrimeMultiSelect
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

          <div class="list-row-secondary-right">
            <span class="list-count-flat">{{ filteredRules.length }} {{ t('common.results') }}</span>
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
      <div v-if="storeLoading" class="list-loading">
        <i class="pi pi-spin pi-spinner" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredRules.length === 0" class="list-empty">
        <i class="pi pi-bell" />
        <p>{{ searchQuery ? t('common.noResults') : t('notifications.noRules') }}</p>
      </div>

      <!-- ── Tabella ──────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
        <DataTable :value="filteredRules" responsiveLayout="scroll" stripedRows class="list-table">
          <Column field="eventTrigger" :header="t('notifications.triggerWhen')" :sortable="true" style="width: 18%">
            <template #body="{ data }">
              <span class="list-cell-strong">
                <i :class="getTriggerIcon(data.eventTrigger)" style="margin-right: 0.4rem; color: #4f46e5;" />
                {{ getTriggerLabel(data.eventTrigger) }}
              </span>
            </template>
          </Column>

          <Column :header="t('notifications.scopeLabel')" style="width: 22%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ getRuleScopeLabel(data) || t('notifications.noScope') }}</span>
            </template>
          </Column>

          <Column field="channel" :header="t('notifications.channel')" :sortable="true" style="width: 14%">
            <template #body="{ data }">
              <Tag :value="getChannelLabel(data.channel)" severity="info" />
            </template>
          </Column>

          <Column :header="t('notifications.sendTo')" style="width: 22%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ getRuleRecipientsSummary(data) }}</span>
            </template>
          </Column>

          <Column field="isActive" :header="t('common.status')" :sortable="true" style="width: 12%">
            <template #body="{ data }">
              <Tag
                :value="data.isActive ? t('common.active') : t('common.inactive')"
                :severity="data.isActive ? 'success' : 'danger'"
              />
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 90px" class="list-col-actions">
            <template #body="{ data }">
              <div class="list-row-actions">
                <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="editRule(data)">
                  <i class="pi pi-pencil" />
                </button>
                <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteRule(data.id)">
                  <i class="pi pi-trash" />
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ── Cards ────────────────────────────────────────────────── -->
      <div v-else class="list-cards-grid">
        <article
          v-for="rule in filteredRules"
          :key="rule.id"
          class="list-card"
          :class="{ 'card-inactive': !rule.isActive }"
        >
          <div class="list-card-head">
            <h3 class="list-card-title">{{ getRuleHeadline(rule) }}</h3>
            <Tag
              :value="rule.isActive ? t('common.active') : t('common.inactive')"
              :severity="rule.isActive ? 'success' : 'danger'"
            />
          </div>
          <p class="list-card-desc">{{ getRuleSummary(rule) }}</p>
          <div class="list-card-info">
            <div class="list-card-info-row">
              <i :class="getTriggerIcon(rule.eventTrigger)" />
              <span>{{ getTriggerLabel(rule.eventTrigger) }}</span>
            </div>
            <div class="list-card-info-row">
              <i :class="rule.resourceTypeId ? 'pi pi-tag' : 'pi pi-box'" />
              <span>{{ getRuleScopeLabel(rule) || t('notifications.noScope') }}</span>
            </div>
            <div class="list-card-info-row">
              <i :class="getChannelIcon(rule.channel)" />
              <Tag :value="getChannelLabel(rule.channel)" severity="info" />
              <span v-if="rule.attachIcs" class="ics-badge">
                <i class="pi pi-calendar-plus" /> {{ t('notifications.icsBadge') }}
              </span>
            </div>
            <div class="list-card-info-row">
              <i :class="getRecipientTypeIcon(rule.recipientType)" />
              <span>{{ getRuleRecipientsSummary(rule) }}</span>
            </div>
          </div>
          <div class="list-card-actions">
            <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="editRule(rule)">
              <i class="pi pi-pencil" />
            </button>
            <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteRule(rule.id)">
              <i class="pi pi-trash" />
            </button>
          </div>
        </article>
      </div>

      <!-- --------- Dialog Crea / Modifica --------------------------------------------------------------------------------------------------------------------------------- -->
      <AppDialog
        v-model:visible="showCreateDialog"
        :header="isEditing ? t('notifications.editRule') : t('notifications.createNew')"
        :icon="isEditing ? 'pi pi-pencil' : 'pi pi-bell'"
        severity="primary"
        size="md"
      >
        <form class="rule-form" @submit.prevent="saveRule">

          <!-- ------ Scope ------ -->
          <div class="form-section">
            <div class="form-section-title">
              <i class="pi pi-crosshairs" /> {{ t('notifications.scopeSection') }}
            </div>
            <div class="scope-radio-group">
              <label
                class="scope-radio-option"
                :class="{ selected: formData.scope === 'resourceType' }"
              >
                <input v-model="formData.scope" type="radio" value="resourceType" class="sr-only" />
                <i class="pi pi-tag" />
                {{ t('notifications.byResourceType') }}
              </label>
              <label
                class="scope-radio-option"
                :class="{ selected: formData.scope === 'resource' }"
              >
                <input v-model="formData.scope" type="radio" value="resource" class="sr-only" />
                <i class="pi pi-box" />
                {{ t('notifications.byResource') }}
              </label>
            </div>

            <!-- Selettore ResourceType — multi-selezione.
                 Lato backend ogni regola ha 1 ambito; al submit creiamo N
                 regole identiche, una per ResourceType selezionato. -->
            <div v-if="formData.scope === 'resourceType'" class="form-group mt-form">
              <label class="form-label">{{ t('notifications.resourceType') }} <span class="req">*</span></label>
              <PrimeMultiSelect
                v-model="formData.resourceTypeIds"
                :options="resourceTypes"
                option-label="name"
                option-value="id"
                :placeholder="t('notifications.selectResourceType')"
                filter
                display="chip"
                class="form-multiselect w-full"
              />
              <small class="form-help">
                {{ t('notifications.multiHint') }}
              </small>
            </div>

            <!-- Selettore Resource — multi-selezione, stessa logica. -->
            <div v-if="formData.scope === 'resource'" class="form-group mt-form">
              <label class="form-label">{{ t('notifications.resource') }} <span class="req">*</span></label>
              <PrimeMultiSelect
                v-model="formData.resourceIds"
                :options="resources"
                option-label="name"
                option-value="id"
                :placeholder="t('notifications.selectResource')"
                filter
                display="chip"
                class="form-multiselect w-full"
              />
              <small class="form-help">
                {{ t('notifications.multiHint') }}
              </small>
            </div>
          </div>

          <!-- ------ Evento e Canale ------ -->
          <div class="form-section form-row-2">
            <div class="form-group">
              <div class="form-section-title" style="margin-bottom:.75rem;">
                <i class="pi pi-bolt" /> {{ t('notifications.eventSection') }}
              </div>
              <label class="form-label">{{ t('notifications.eventTrigger') }} <span class="req">*</span></label>
              <select v-model="formData.eventTrigger" class="form-select">
                <option v-for="ev in eventOptions" :key="ev.value" :value="ev.value">
                  {{ ev.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <div class="form-section-title" style="margin-bottom:.75rem;">
                <i class="pi pi-send" /> {{ t('notifications.channelSection') }}
              </div>
              <label class="form-label">{{ t('notifications.channel') }} <span class="req">*</span></label>
              <select v-model="formData.channel" class="form-select">
                <option v-for="ch in channelOptions" :key="ch.value" :value="ch.value">
                  {{ ch.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- ------ Destinatari ------ -->
          <div class="form-section">
            <div class="form-section-title">
              <i class="pi pi-users" /> {{ t('notifications.recipientsSection') }}
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('notifications.recipientType') }} <span class="req">*</span></label>
              <div class="recipient-type-grid">
                <label
                  v-for="rt in recipientTypeOptions"
                  :key="rt.value"
                  class="recipient-type-card"
                  :class="{ selected: formData.recipientType === rt.value }"
                >
                  <input v-model="formData.recipientType" type="radio" :value="rt.value" class="sr-only" />
                  <i :class="rt.icon" class="recipient-type-icon" />
                  <span class="recipient-type-label">{{ rt.label }}</span>
                  <span class="recipient-type-desc">{{ rt.desc }}</span>
                </label>
              </div>
            </div>
            <div v-if="formData.recipientType === 'Custom'" class="form-group mt-form">
              <label class="form-label">{{ t('notifications.recipients') }}</label>
              <textarea
                v-model="formData.recipients"
                class="form-textarea"
                rows="2"
                :placeholder="t('notifications.recipientsPlaceholder')"
              />
              <p class="form-hint">{{ t('notifications.recipientsHint') }}</p>
            </div>
          </div>

          <!-- ------ Template ------ -->
          <div class="form-section">
            <div class="form-section-title">
              <i class="pi pi-file-edit" /> {{ t('notifications.templateSection') }}
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('notifications.subject') }}</label>
              <input
                v-model="formData.templateSubject"
                type="text"
                class="form-input"
                :placeholder="t('notifications.subjectPlaceholder')"
              />
            </div>
            <div class="form-group" style="margin-top:.75rem;">
              <label class="form-label">{{ t('notifications.body') }}</label>
              <textarea
                v-model="formData.templateBody"
                class="form-textarea"
                rows="4"
                :placeholder="t('notifications.bodyPlaceholder')"
              />
            </div>
            <!-- Riquadro variabili -->
            <div class="vars-box">
              <span class="vars-title">
                <i class="pi pi-code" /> {{ t('notifications.templateVars') }}:
              </span>
              <div class="vars-chips">
                <code v-for="v in templateVars" :key="v" class="var-chip" @click="copyVar(v)">{{ v }}</code>
              </div>
              <span class="vars-hint">{{ t('notifications.templateVarsHint') }}</span>
            </div>
          </div>

          <!-- ------ Opzioni ------ -->
          <div class="form-section">
            <div class="form-section-title">
              <i class="pi pi-sliders-h" /> {{ t('notifications.optionsSection') }}
            </div>
            <div class="options-row">
              <!-- attachIcs toggle -->
              <div class="option-item">
                <div class="option-info">
                  <span class="option-label">
                    <i class="pi pi-calendar-plus" />
                    {{ t('notifications.attachIcs') }}
                  </span>
                  <span class="option-desc">{{ t('notifications.attachIcsDesc') }}</span>
                </div>
                <div
                  class="toggle-sw"
                  :class="{ on: formData.attachIcs }"
                  @click="toggleAttachIcs"
                >
                  <div class="toggle-knob" />
                </div>
              </div>

              <div :class="{ 'option-item-disabled': !formData.attachIcs }">
<!--                <div class="option-info">-->
<!--                  <span class="option-label">-->
<!--                    <i class="pi pi-phone" />-->
<!--                    {{ t('notifications.createTeamsCallLink') }}-->
<!--                  </span>-->
<!--                  <span class="option-desc">{{ t('notifications.createTeamsCallLinkDesc') }}</span>-->
<!--                </div>-->
<!--                <div-->
<!--                  class="toggle-sw"-->
<!--                  :class="{ on: formData.attachIcs && formData.createTeamsCallLink, disabled: !formData.attachIcs }"-->
<!--                  @click="toggleCreateTeamsCallLink"-->
<!--                >-->
<!--                  <div class="toggle-knob" />-->
<!--                </div>-->
              </div>

              <!-- isActive toggle -->
              <div class="option-item">
                <div class="option-info">
                  <span class="option-label">
                    <i class="pi pi-power-off" />
                    {{ t('notifications.isActiveLabel') }}
                  </span>
                  <span class="option-desc">{{ t('notifications.isActiveDesc') }}</span>
                </div>
                <div
                  class="toggle-sw"
                  :class="{ on: formData.isActive }"
                  @click="formData.isActive = !formData.isActive"
                >
                  <div class="toggle-knob" />
                </div>
              </div>
            </div>
          </div>

          <!-- Messaggio errore -->
          <div v-if="saveError" class="form-error">
            <i class="pi pi-exclamation-circle" />
            {{ saveError }}
          </div>

        </form>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="showCreateDialog = false">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="saving" @click="saveRule">
            <i :class="saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'" />{{ saving ? t('common.saving') : t('common.save') }}
          </button>
        </template>
      </AppDialog>

      <!-- --------- Modal "Come funziona" ------------------------------------------------------------------------------------------------------------------------------------ -->
      <AppDialog
        v-model:visible="showHelpModal"
        :header="t('notifications.howItWorks')"
        icon="pi pi-question-circle"
        severity="info"
        size="md"
      >
        <div class="help-modal">

          <div class="help-section">
            <h3 class="help-section-title">
              <span class="help-num">1</span> {{ t('notifications.helpTriggerTitle') }}
            </h3>
            <p class="help-text">{{ t('notifications.helpTriggerDesc') }}</p>
            <div class="help-chips">
              <div class="help-chip" data-trigger="BookingCreated">
                <i class="pi pi-calendar-plus" /> {{ t('notifications.eventBookingCreated') }}
              </div>
              <div class="help-chip" data-trigger="BookingApproved">
                <i class="pi pi-check-circle" /> {{ t('notifications.eventBookingApproved') }}
              </div>
              <div class="help-chip" data-trigger="BookingRejected">
                <i class="pi pi-times-circle" /> {{ t('notifications.eventBookingRejected') }}
              </div>
              <div class="help-chip" data-trigger="BookingCancelled">
                <i class="pi pi-ban" /> {{ t('notifications.eventBookingCancelled') }}
              </div>
            </div>
          </div>

          <div class="help-section">
            <h3 class="help-section-title">
              <span class="help-num">2</span> {{ t('notifications.helpScopeTitle') }}
            </h3>
            <p class="help-text">{{ t('notifications.helpScopeDesc') }}</p>
            <div class="help-table">
              <div class="help-row">
                <span class="help-tag"><i class="pi pi-tag" /> {{ t('notifications.byResourceType') }}</span>
                <span>{{ t('notifications.helpScopeTypeDesc') }}</span>
              </div>
              <div class="help-row">
                <span class="help-tag"><i class="pi pi-box" /> {{ t('notifications.byResource') }}</span>
                <span>{{ t('notifications.helpScopeResourceDesc') }}</span>
              </div>
            </div>
          </div>

          <div class="help-section">
            <h3 class="help-section-title">
              <span class="help-num">3</span> {{ t('notifications.helpChannelTitle') }}
            </h3>
            <div class="help-table">
              <div class="help-row">
                <span class="help-tag ch-email"><i class="pi pi-envelope" /> {{ t('notifications.channelEmail') }}</span>
                <span>{{ t('notifications.helpChannelEmailDesc') }}</span>
              </div>
              <div class="help-row">
                <span class="help-tag ch-webhook"><i class="pi pi-link" />{{ t('notifications.webhookLabel') }}</span>
                <span>{{ t('notifications.helpChannelWebhookDesc') }}</span>
              </div>
              <div class="help-row">
                <span class="help-tag ch-both"><i class="pi pi-share-alt" />{{ t('notifications.both') }}</span>
                <span>{{ t('notifications.helpChannelBothDesc') }}</span>
              </div>
            </div>
          </div>

          <div class="help-section">
            <h3 class="help-section-title">
              <span class="help-num">4</span> {{ t('notifications.helpVarsTitle') }}
            </h3>
            <p class="help-text">{{ t('notifications.helpVarsDesc') }}</p>
            <div class="help-vars-table">
              <div v-for="v in varDescriptions" :key="v.name" class="help-var-row">
                <code class="help-var-name">{{ v.name }}</code>
                <span class="help-var-desc">{{ v.desc }}</span>
              </div>
            </div>
          </div>

          <div class="help-section">
            <h3 class="help-section-title">
              <span class="help-num">5</span> {{ t('notifications.helpIcsTitle') }}
            </h3>
            <p class="help-text">{{ t('notifications.helpIcsDesc') }}</p>
          </div>

        </div>
      </AppDialog>

    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotificationRulesStore } from '@/stores/notification-rules.store'
import { useResourcesStore } from '@/stores/resources.store'
import MainLayout from '@/layouts/MainLayout.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import PrimeMultiSelect from 'primevue/multiselect'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type { NotificationRule } from '@/types/notification'

const { t } = useI18n()
const notificationStore = useNotificationRulesStore()
const resourcesStore = useResourcesStore()

// ------ UI State ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const showCreateDialog = ref(false)
const showHelpModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const searchQuery = ref('')
const statusFilter = ref<boolean[]>([])
const saving = ref(false)
const saveError = ref('')
const viewMode = ref<'card' | 'table'>(
  (localStorage.getItem('notification_rules_view_mode') as 'card' | 'table') ?? 'card'
)

const setViewMode = (mode: 'card' | 'table') => {
  viewMode.value = mode
  localStorage.setItem('notification_rules_view_mode', mode)
}

const statusOptions = computed(() => [
  { label: t('common.active'),   value: true },
  { label: t('common.inactive'), value: false },
])

// ------ Form ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
// Modello multi-ambito: il dialog supporta la selezione di N ResourceType
// o N Resource. In CREATE viene creata una regola per ogni ambito selezionato.
// In EDIT (modifica di una regola esistente) il MultiSelect mostra un solo
// elemento e il submit aggiorna soltanto quella regola: il backend mantiene
// 1 regola = 1 ambito (tabella notification_rules con colonna FK singola).
const defaultForm = () => ({
  scope: 'resourceType' as 'resourceType' | 'resource',
  resourceTypeIds: [] as string[],
  resourceIds:     [] as string[],
  eventTrigger: 'BookingCreated',
  channel: 'Email',
  recipientType: 'BookingParticipants',
  recipients: '',
  templateSubject: '',
  templateBody: '',
  templateRef: '',
  attachIcs: false,
  createTeamsCallLink: false,
  isActive: true,
})

const formData = ref(defaultForm())

// ------ Data ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const storeLoading = computed(() => notificationStore.loading)
const allRules = computed(() => notificationStore.notificationRules)
const resourceTypes = computed(() => resourcesStore.resourceTypes)
const resources = computed(() => resourcesStore.resources)

// ------ Options ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const eventOptions = computed(() => [
  { value: 'BookingCreated',         label: t('notifications.eventBookingCreated') },
  { value: 'BookingModified',        label: t('notifications.eventBookingModified') },
  { value: 'BookingCancelled',       label: t('notifications.eventBookingCancelled') },
  { value: 'BookingConfirmed',       label: t('notifications.eventBookingConfirmed') },
  { value: 'BookingRejected',        label: t('notifications.eventBookingRejected') },
  { value: 'BookingPendingApproval', label: t('notifications.eventBookingPendingApproval') },
  { value: 'ParticipationCancelled', label: t('notifications.eventParticipationCancelled') },
])

const channelOptions = computed(() => [
  { value: 'Email',   label: t('notifications.channelEmail') },
  { value: 'Webhook', label: t('notifications.channelWebhook') },
  { value: 'Both',    label: t('notifications.channelBoth') },
])

const recipientTypeOptions = computed(() => [
  {
    value: 'BookingParticipants',
    label: t('notifications.recipientTypeBookingParticipants'),
    desc:  t('notifications.recipientTypeBookingParticipantsDesc'),
    icon:  'pi pi-users',
  },
  {
    value: 'ResourceAssociatedUsers',
    label: t('notifications.recipientTypeResourceAssociatedUsers'),
    desc:  t('notifications.recipientTypeResourceAssociatedUsersDesc'),
    icon:  'pi pi-building',
  },
  {
    value: 'Custom',
    label: t('notifications.recipientTypeCustom'),
    desc:  t('notifications.recipientTypeCustomDesc'),
    icon:  'pi pi-at',
  },
])

const templateVars = [
  '${bookingTitle}', '${bookingId}', '${bookingStatus}', '${bookingNotes}',
  '${resourceName}', '${plantName}',
  '${organizerName}', '${organizerEmail}',
  '${startDate}', '${startTime}', '${endTime}', '${duration}',
  '${participantName}', '${recipientName}',
  '${tenantName}', '${appUrl}', '${currentYear}',
]

const varDescriptions = computed(() => [
  { name: '${bookingTitle}',    desc: t('notifications.varBookingTitle') },
  { name: '${bookingId}',       desc: t('notifications.varBookingId') },
  { name: '${bookingStatus}',   desc: t('notifications.varBookingStatus') },
  { name: '${resourceName}',    desc: t('notifications.varResourceName') },
  { name: '${organizerName}',   desc: t('notifications.varOrganizerName') },
  { name: '${organizerEmail}',  desc: t('notifications.varOrganizerEmail') },
  { name: '${startDate}',       desc: t('notifications.varStartDate') },
  { name: '${startTime}',       desc: t('notifications.varStartTime') },
  { name: '${endTime}',         desc: t('notifications.varEndTime') },
  { name: '${participantName}', desc: t('notifications.varParticipantName') },
])

// ------ Filtered list ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const filteredRules = computed(() => {
  let list = allRules.value
  if (statusFilter.value.length > 0) {
    list = list.filter((r) => statusFilter.value.includes(r.isActive))
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(r =>
      r.eventTrigger.toLowerCase().includes(q) ||
      r.channel.toLowerCase().includes(q) ||
      (r.templateSubject ?? '').toLowerCase().includes(q) ||
      (r.recipients ?? []).join(' ').toLowerCase().includes(q)
    )
  }
  return list
})

// ------ Helpers ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function getTriggerLabel(trigger: string): string {
  const map: Record<string, string> = {
    BookingCreated:         t('notifications.eventBookingCreated'),
    BookingModified:        t('notifications.eventBookingModified'),
    BookingCancelled:       t('notifications.eventBookingCancelled'),
    BookingConfirmed:       t('notifications.eventBookingConfirmed'),
    BookingRejected:        t('notifications.eventBookingRejected'),
    BookingPendingApproval: t('notifications.eventBookingPendingApproval'),
    ParticipationCancelled: t('notifications.eventParticipationCancelled'),
  }
  return map[trigger] ?? trigger
}

function getTriggerIcon(trigger: string): string {
  const map: Record<string, string> = {
    BookingCreated:         'pi pi-calendar-plus',
    BookingModified:        'pi pi-pencil',
    BookingCancelled:       'pi pi-ban',
    BookingConfirmed:       'pi pi-check-circle',
    BookingRejected:        'pi pi-times-circle',
    BookingPendingApproval: 'pi pi-clock',
    ParticipationCancelled: 'pi pi-user-minus',
  }
  return map[trigger] ?? 'pi pi-bell'
}

function getRecipientTypeLabel(type: string): string {
  const map: Record<string, string> = {
    BookingParticipants:     t('notifications.recipientTypeBookingParticipants'),
    ResourceAssociatedUsers: t('notifications.recipientTypeResourceAssociatedUsers'),
    Custom:                  t('notifications.recipientTypeCustom'),
  }
  return map[type] ?? type
}

function getRecipientTypeIcon(type: string): string {
  const map: Record<string, string> = {
    BookingParticipants:     'pi pi-users',
    ResourceAssociatedUsers: 'pi pi-building',
    Custom:                  'pi pi-at',
  }
  return map[type] ?? 'pi pi-users'
}

function getChannelLabel(channel: string): string {
  const map: Record<string, string> = {
    Email:   t('notifications.channelEmail'),
    Webhook: t('notifications.channelWebhook'),
    Both:    t('notifications.channelBoth'),
  }
  return map[channel] ?? channel
}

function getChannelIcon(channel: string): string {
  const map: Record<string, string> = {
    Email:   'pi pi-envelope',
    Webhook: 'pi pi-link',
    Both:    'pi pi-share-alt',
  }
  return map[channel] ?? 'pi pi-send'
}

function getResourceTypeName(id: string): string {
  return resourceTypes.value.find(rt => rt.id === id)?.name ?? id
}

function getResourceName(id: string): string {
  return resources.value.find(r => r.id === id)?.name ?? id
}

function formatRecipients(list: string[]): string {
  if (list.length <= 2) return list.join(', ')
  return `${list[0]}, ${list[1]} +${list.length - 2}`
}

function getRuleScopeLabel(rule: NotificationRule): string {
  if (rule.resourceTypeId) {
    return `${t('notifications.byResourceType')}: ${getResourceTypeName(rule.resourceTypeId)}`
  }
  if (rule.resourceId) {
    return `${t('notifications.byResource')}: ${getResourceName(rule.resourceId)}`
  }
  return ''
}

function getRuleHeadline(rule: NotificationRule): string {
  const scope = getRuleScopeLabel(rule)
  if (scope) return `${getTriggerLabel(rule.eventTrigger)} - ${scope}`
  return `${getTriggerLabel(rule.eventTrigger)} - ${t('notifications.generalRule')}`
}

function getRuleRecipientsSummary(rule: NotificationRule): string {
  const base = getRecipientTypeLabel(rule.recipientType)
  if (rule.recipientType === 'Custom' && rule.recipients?.length) {
    return `${base}: ${formatRecipients(rule.recipients)}`
  }
  return base
}


function getRuleSummary(rule: NotificationRule): string {
  const trigger = getTriggerLabel(rule.eventTrigger)
  const channel = getChannelLabel(rule.channel)
  const recipients = getRuleRecipientsSummary(rule)
  const scope = getRuleScopeLabel(rule)

  if (scope) {
    return t('notifications.summaryWithScope', { trigger, channel, recipients, scope })
  }

  return t('notifications.summaryNoScope', { trigger, channel, recipients })
}

function copyVar(v: string) {
  navigator.clipboard?.writeText(v).catch(() => {})
}

// Toggle helpers: use functions instead of statements inside template expressions
const toggleAttachIcs = (): void => {
  // formData is a ref; update via .value
  formData.value.attachIcs = !formData.value.attachIcs
  if (!formData.value.attachIcs) {
    formData.value.createTeamsCallLink = false
  }
}

// toggleCreateTeamsCallLink removed: feature currently commented out in template

// ------ CRUD ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function openCreateDialog() {
  isEditing.value = false
  editingId.value = null
  formData.value = defaultForm()
  saveError.value = ''
  showCreateDialog.value = true
}

function editRule(rule: NotificationRule) {
  const subject = rule.templateSubject ?? ''
  isEditing.value = true
  editingId.value = rule.id
  saveError.value = ''
  formData.value = {
    scope: rule.resourceTypeId ? 'resourceType' : 'resource',
    // In modifica il MultiSelect mostra l'unico ambito già associato alla regola.
    resourceTypeIds: rule.resourceTypeId ? [rule.resourceTypeId] : [],
    resourceIds:     rule.resourceId     ? [rule.resourceId]     : [],
    eventTrigger: rule.eventTrigger,
    channel: rule.channel,
    recipientType: rule.recipientType ?? 'BookingParticipants',
    recipients: Array.isArray(rule.recipients) ? rule.recipients.join(', ') : '',
    templateSubject: subject,
    templateBody: rule.templateBody ?? '',
    templateRef: rule.templateRef ?? '',
    attachIcs: rule.attachIcs ?? false,
    createTeamsCallLink: rule.createTeamsCallLink ?? false,
    isActive: rule.isActive ?? true,
  }
  showCreateDialog.value = true
}

async function saveRule() {
  saving.value = true
  saveError.value = ''
  try {
    const recipients = formData.value.recipients
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0)

    // Costruzione DTO base — campi comuni a tutte le regole generate.
    const baseDto = {
      eventTrigger:    formData.value.eventTrigger,
      channel:         formData.value.channel as any,
      recipientType:   formData.value.recipientType as any,
      recipients,
      templateSubject: formData.value.templateSubject,
      templateBody:    formData.value.templateBody,
      templateRef:     formData.value.templateRef || undefined,
      attachIcs:       formData.value.attachIcs,
      createTeamsCallLink: formData.value.attachIcs && formData.value.createTeamsCallLink,
      isActive:        formData.value.isActive,
    }

    if (isEditing.value && editingId.value) {
      // EDIT: il backend mantiene 1 regola = 1 ambito. In modifica
      // riassociamo l'unico ambito selezionato (se l'utente ne ha
      // selezionati più nel MultiSelect, prendiamo il primo).
      const dto = {
        ...baseDto,
        resourceTypeId: formData.value.scope === 'resourceType'
          ? (formData.value.resourceTypeIds[0] || undefined)
          : undefined,
        resourceId: formData.value.scope === 'resource'
          ? (formData.value.resourceIds[0] || undefined)
          : undefined,
      }
      await notificationStore.updateNotificationRule(editingId.value, dto)
    } else {
      // CREATE: per ogni ambito selezionato, creiamo una regola separata.
      // Coerente col modello DRF (regole indipendenti, ognuna con un solo
      // ambito). Se nessun ambito è selezionato, niente regole vengono create.
      const ids = formData.value.scope === 'resourceType'
        ? formData.value.resourceTypeIds
        : formData.value.resourceIds

      if (ids.length === 0) {
        throw new Error(t('notifications.atLeastOneScope'))
      }

      // Creazione sequenziale (non Promise.all) per produrre messaggi di
      // errore comprensibili se una regola fallisce — l'utente vede quale.
      for (const id of ids) {
        await notificationStore.createNotificationRule({
          ...baseDto,
          resourceTypeId: formData.value.scope === 'resourceType' ? id : undefined,
          resourceId:     formData.value.scope === 'resource'     ? id : undefined,
        })
      }
    }
    showCreateDialog.value = false
  } catch (err: unknown) {
    saveError.value = err instanceof Error ? err.message : t('common.error')
  } finally {
    saving.value = false
  }
}

async function deleteRule(id: string) {
  if (!confirm(t('notifications.confirmDelete'))) return
  try {
    await notificationStore.removeNotificationRule(id)
  } catch (err) {
    console.error(err)
  }
}

// ------ Lifecycle ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
onMounted(async () => {
  await Promise.allSettled([
    notificationStore.fetchAll(),
    resourcesStore.fetchAllResourceTypes(),
    resourcesStore.fetchAllResources(),
  ])
})
</script>

<style scoped src="./NotificationRulesView.css"></style>
