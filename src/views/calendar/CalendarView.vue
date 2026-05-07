<template>
  <MainLayout>
    <div class="calendar-page">
      <div class="cal-body" :class="{ 'cal-body-no-sidebar': !showFiltersVisible }">

        <!-- ------ Filter Sidebar --------------------------------------------------------------------------------------------------------------------- -->
        <Transition name="slide-filters" @after-leave="onFiltersAfterLeave">
          <aside v-if="showFiltersVisible" class="cal-filters">
          <div class="filter-header">
            <i class="pi pi-filter" />
            <span>{{ t('common.filter') }}</span>
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t('resources.site') }}</label>
            <PrimeSelect
              v-model="filters.plantId"
              :options="siteOptions"
              option-:label="t('views.calendar.label')"
              option-value="value"
              :placeholder="t('common.all')"
              show-clear
              class="w-full"
              @change="onPlantChange"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t('resources.type') }}</label>
            <PrimeMultiSelect
              v-model="filters.resourceTypeIds"
              :options="resourceTypeOptions"
              option-:label="t('views.calendar.label')"
              option-value="value"
              :placeholder="t('common.all')"
              class="w-full"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t('resources.title') }}</label>
            <PrimeMultiSelect
              v-model="filters.resourceIds"
              :options="resourceOptions"
              option-:label="t('views.calendar.label')"
              option-value="value"
              :placeholder="t('common.all')"
              class="w-full"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t('common.status') }}</label>
            <PrimeMultiSelect
              v-model="filters.statuses"
              :options="statusOptions"
              option-:label="t('views.calendar.label')"
              option-value="value"
              :placeholder="t('common.all')"
              class="w-full"
            />
          </div>


          <div class="filter-group">
            <label class="filter-label">{{ t('calendar.filterVisitorType') }}</label>
            <PrimeSelect
              v-model="filters.visitorTypeId"
              :options="visitorTypeOptions"
              option-:label="t('views.calendar.label')"
              option-value="value"
              :placeholder="t('common.all')"
              show-clear
              class="w-full"
            />
          </div>

          <div class="filter-group filter-toggle">
            <label class="filter-label">{{ t('calendar.filterMyBookings') }}</label>
            <PrimeToggleSwitch v-model="filters.onlyMine" />
          </div>

          <!-- Toggle Weekend -->
          <div class="filter-toggle">
            <label class="filter-label">{{ t('calendar.showWeekends') }}</label>
            <PrimeToggleSwitch v-model="showWeekends" />
          </div>

          <!-- Finestra oraria visualizzata (slotMinTime / slotMaxTime).
               La preferenza è persistita in localStorage. -->
          <div class="filter-group">
            <label class="filter-label">{{ t('calendar.timeRange') }}</label>
            <div class="time-range-row">
              <PrimeSelect
                v-model="slotStartHour"
                :options="hourOptions"
                option-:label="t('views.calendar.label')"
                option-value="value"
                class="time-range-select"
              />
              <span class="time-range-sep">—</span>
              <PrimeSelect
                v-model="slotEndHour"
                :options="hourOptionsEnd"
                option-:label="t('views.calendar.label')"
                option-value="value"
                class="time-range-select"
              />
            </div>
            <button class="btn-secondary btn-xs mt-1" @click="resetTimeRange">
              <i class="pi pi-refresh" /> {{ t('calendar.resetTimeRange') }}
            </button>
          </div>

          <button class="btn-reset w-full" @click="resetFilters">
            <i class="pi pi-refresh mr-1" />
            {{ t('calendar.resetFilters') }}
          </button>

          <!-- Legend -->
          <div class="legend">
            <div class="legend-title">{{ t('calendar.legend') }}</div>
            <div v-for="item in legendItems" :key="item.status" class="legend-item">
              <span class="legend-dot" :style="{ background: item.color }" />
              <span class="legend-label">{{ item.label }}</span>
            </div>
          </div>
        </aside>
        </Transition>

        <!-- ------ Calendar Main ------------------------------------------------------------------------------------------------------------------------------ -->
        <div ref="calMainRef" class="cal-main">
          <!-- View Switcher Tabs + Actions -->
          <div class="view-bar">
            <div class="view-tabs">
              <button
                v-for="view in views"
                :key="view.key"
                class="view-tab"
                :class="{ active: currentView === view.key }"
                @click="setView(view.key)"
              >
                <i :class="`pi ${view.icon} mr-1`" />
                {{ view.label }}
              </button>
            </div>
            <div class="view-bar-actions">
              <button class="btn-filter-toggle" :class="{ 'btn-filter-active': showFilters }" @click="toggleFilters">
                <i class="pi pi-filter" />
                <span class="btn-filter-badge" v-if="activeFilterCount > 0">{{ activeFilterCount }}</span>
              </button>
              <button class="btn-secondary" @click="goToToday">
                <i class="pi pi-calendar-clock mr-1" />
                {{ t('calendar.today') }}
              </button>
              <router-link :to="{ name: 'BookingWizard' }" class="btn-primary">
                <i class="pi pi-plus mr-1" />
                {{ t('calendar.newBooking') }}
              </router-link>
            </div>
          </div>

          <div class="cal-card" style="position:relative;">
            <!-- Loading overlay sopra il calendario (non lo distrugge) -->
            <div v-if="loading" class="cal-loading cal-loading-overlay">
              <PrimeProgressSpinner style="width: 48px; height: 48px" />
              <span>{{ t('common.loading') }}</span>
            </div>

            <div v-if="bookingsStore.error && !loading" class="cal-error">
              <i class="pi pi-exclamation-circle" />
              <span>{{ t('errors.loadFailed') }}</span>
              <button class="btn-secondary" @click="fetchCalendar()">{{ t('common.retry') }}</button>
            </div>

            <!-- FullCalendar resta sempre montato (v-show, non v-if/v-else)
                 per evitare il loop: onDatesSet --- fetch --- loading=true --- distrugge FC --- rimonta --- onDatesSet --- ... -->
            <FullCalendar
              v-show="!bookingsStore.error"
              ref="calendarRef"
              :options="calendarOptions"
            />
          </div>

          <!-- Hint bar -->
          <div class="cal-hint">
            <i class="pi pi-info-circle" />
            <span>{{ t('calendar.selectHint') }}</span>
          </div>
        </div>
      </div>

      <!-- ------ Quick Book Modal --------------------------------------------------------------------------------------------------------------------- -->
      <PrimeDialog
        v-model:visible="showQuickBook"
        :header="t('calendar.quickBook')"
        modal
        :style="{ width: '460px' }"
        :breakpoints="{ '640px': '95vw' }"
        class="quickbook-dialog"
      >
        <div class="qb-body">
          <div class="qb-timerange">
            <div class="qb-timerange-item">
              <i class="pi pi-calendar" />
              <div>
                <span class="qb-label">{{ t('calendar.start') }}</span>
                <strong class="qb-value">{{ formatDisplay(quickBook.start) }}</strong>
              </div>
            </div>
            <div class="qb-arrow"><i class="pi pi-arrow-right" /></div>
            <div class="qb-timerange-item">
              <i class="pi pi-calendar-clock" />
              <div>
                <span class="qb-label">{{ t('calendar.end') }}</span>
                <strong class="qb-value">{{ formatDisplay(quickBook.end) }}</strong>
              </div>
            </div>
          </div>

          <div class="qb-field">
            <label class="qb-field-label">{{ t('wizard.titleLabel') }}</label>
            <PrimeInputText
              v-model="quickBook.title"
              :placeholder="t('calendar.bookingTitlePlaceholder')"
              class="w-full"
            />
          </div>

          <div class="qb-field">
            <label class="qb-field-label">{{ t('bookings.resource') }}</label>
            <PrimeSelect
              v-model="quickBook.resourceId"
              :options="resourceOptions"
              option-:label="t('views.calendar.label')"
              option-value="value"
              :placeholder="t('calendar.selectResource')"
              class="w-full"
            />
          </div>

          <div class="qb-hint">
            <i class="pi pi-info-circle" />
            {{ t('calendar.quickBookHint') }}
          </div>
        </div>

        <template #footer>
          <button class="btn-secondary" @click="showQuickBook = false">
            {{ t('common.cancel') }}
          </button>
          <button class="btn-primary" @click="proceedToWizard">
            <i class="pi pi-arrow-right mr-1" />
            {{ t('calendar.continueToWizard') }}
          </button>
        </template>
      </PrimeDialog>

      <!-- ------ Event Detail Dialog ------------------------------------------------------------------------------------------------------------ -->
      <PrimeDialog
        v-model:visible="showEventDetail"
        :header="selectedBooking?.title"
        modal
        :style="{ width: '520px' }"
        :breakpoints="{ '640px': '95vw' }"
        class="event-detail-dialog"
      >
        <div v-if="selectedBooking" class="event-detail">

          <div class="event-status-bar" :style="{ background: getStatusColor(selectedBooking.status) }">
            <i class="pi pi-circle-fill mr-2" style="font-size: 0.6rem" />
            {{ t(`bookings.status.${selectedBooking.status.charAt(0).toLowerCase() + selectedBooking.status.slice(1)}`) }}
          </div>

          <div class="event-info-grid">
            <div class="event-info-item">
              <span class="ei-label">{{ t('calendar.organizer') }}</span>
              <span class="ei-value">{{ selectedBookingOrganizer }}</span>
            </div>

            <div class="event-info-item">
              <span class="ei-label">{{ t('calendar.participants') }}</span>
              <span class="ei-value">{{ selectedBooking.participants?.length ?? 0 }}</span>
            </div>

            <div class="event-info-item full">
              <span class="ei-label">{{ t('calendar.resources') }}</span>
              <div v-if="selectedBooking.resources?.length" class="resource-chips">
                <span
                  v-for="resource in selectedBooking.resources"
                  :key="resource.id"
                  class="resource-chip"
                >
                  <i class="pi pi-box mr-1" />
                  {{ getResourceName(resource.resourceId) }}
                  <span class="resource-chip-time">
                    {{ formatTime(resource.startTime) }} — {{ formatTime(resource.endTime) }}
                  </span>
                </span>
              </div>
              <span v-else class="ei-value text-muted">{{ t('common.noData') }}</span>
            </div>

            <div v-if="selectedBooking.notes" class="event-info-item full">
              <span class="ei-label">{{ t('calendar.notes') }}</span>
              <p class="ei-notes">{{ selectedBooking.notes }}</p>
            </div>
          </div>
        </div>

        <template #footer>
          <button class="btn-secondary" @click="showEventDetail = false">
            {{ t('common.close') }}
          </button>
          <!-- Cancella — DRF §7.2: stati Cancelled/Rejected/Completed non cancellabili -->
          <button
            v-if="selectedBooking && canCancelBooking"
            class="btn-danger"
            :disabled="cancelLoading"
            @click="openCancelDialog"
          >
            <i class="pi pi-trash mr-1" />
            {{ t('common.delete') }}
          </button>
          <!-- Modifica — DRF §7.3: stati editabili Draft/PendingApproval/Confirmed -->
          <button
            v-if="selectedBooking && canEditBooking"
            class="btn-secondary"
            @click="goToEditBooking"
          >
            <i class="pi pi-pencil mr-1" />
            {{ t('common.edit') }}
          </button>
          <router-link
            v-if="selectedBooking"
            :to="{ name: 'BookingDetail', params: { id: selectedBooking.id } }"
            class="btn-primary"
            @click="showEventDetail = false"
          >
            <i class="pi pi-external-link mr-1" />
            {{ t('calendar.viewDetail') }}
          </router-link>
        </template>
      </PrimeDialog>

      <!-- ─── Dialog conferma cancellazione ────────────────────────────────── -->
      <PrimeDialog
        v-model:visible="showCancelDialog"
        :header="t('bookings.confirmDeleteHeader') || 'Conferma cancellazione'"
        modal
        :style="{ width: '440px' }"
        :breakpoints="{ '640px': '95vw' }"
      >
        <div v-if="bookingToCancel" class="event-detail">
          <p style="margin-bottom: 12px;">
            {{ t('bookings.confirmDelete') || 'Sei sicuro di voler cancellare questa prenotazione?' }}
          </p>
          <div class="event-status-bar" style="background: rgba(239,68,68,0.12); color: #991b1b;">
            <strong>{{ bookingToCancel.title || t('bookings.untitled') }}</strong>
          </div>
          <p style="margin-top: 12px; color: #64748b; font-size: 13px;">
            {{ t('bookings.deleteWarning') || 'I partecipanti registrati riceveranno un avviso di cancellazione.' }}
          </p>
        </div>

        <template #footer>
          <button class="btn-secondary" :disabled="cancelLoading" @click="showCancelDialog = false">
            {{ t('common.cancel') }}
          </button>
          <button class="btn-danger" :disabled="cancelLoading" @click="confirmCancelBooking">
            <i class="pi pi-trash mr-1" />
            <span v-if="cancelLoading">{{ t('common.loading') || 'Caricamento...' }}</span>
            <span v-else>{{ t('common.delete') }}</span>
          </button>
        </template>
      </PrimeDialog>

      <!-- ─── Dialog conferma spostamento / ridimensionamento ─────────────── -->
      <PrimeDialog
        v-model:visible="showMoveConfirmDialog"
        :header="pendingMoveInfo?.mode === 'resize' ? t('calendar.confirmResizeHeader') : t('calendar.confirmMoveHeader')"
        modal
        :style="{ width: '420px' }"
        :breakpoints="{ '640px': '95vw' }"
        :closable="!moveLoading"
      >
        <div v-if="pendingMoveInfo" class="event-detail">
          <p style="margin-bottom: 14px;">
            {{ pendingMoveInfo.mode === 'resize' ? t('calendar.confirmResizeBody') : t('calendar.confirmMoveBody') }}
          </p>
          <div class="move-confirm-row">
            <span class="move-label">{{ pendingMoveInfo.mode === 'resize' ? t('calendar.confirmResizeFrom') : t('calendar.confirmMoveFrom') }}</span>
            <span class="move-value">{{ pendingMoveInfo.fromLabel }}</span>
          </div>
          <div class="move-confirm-row move-arrow">
            <i class="pi pi-arrow-down" style="color: #2563eb;" />
          </div>
          <div class="move-confirm-row">
            <span class="move-label">{{ pendingMoveInfo.mode === 'resize' ? t('calendar.confirmResizeTo') : t('calendar.confirmMoveTo') }}</span>
            <span class="move-value move-value-new">{{ pendingMoveInfo.toLabel }}</span>
          </div>
          <div class="event-status-bar" style="margin-top: 14px; background: rgba(37,99,235,0.08); color: #1e40af;">
            <strong>{{ pendingMoveInfo.booking.title }}</strong>
          </div>
        </div>
        <template #footer>
          <button class="btn-secondary" :disabled="moveLoading" @click="cancelMoveBooking">
            {{ t('common.cancel') }}
          </button>
          <button class="btn-primary" :disabled="moveLoading" @click="confirmMoveBooking">
            <i class="pi pi-check mr-1" />
            <span v-if="moveLoading">{{ t('common.loading') || 'Salvataggio...' }}</span>
            <span v-else>{{ pendingMoveInfo?.mode === 'resize' ? t('calendar.confirmResizeConfirm') : t('calendar.confirmMoveConfirm') }}</span>
          </button>
        </template>
      </PrimeDialog>

    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import itLocale from '@fullcalendar/core/locales/it'
import MainLayout from '@/layouts/MainLayout.vue'
import PrimeSelect from 'primevue/select'
import PrimeMultiSelect from 'primevue/multiselect'
import PrimeDialog from 'primevue/dialog'
import PrimeProgressSpinner from 'primevue/progressspinner'
import PrimeInputText from 'primevue/inputtext'
import PrimeToggleSwitch from 'primevue/toggleswitch'
import { useToast } from 'primevue/usetoast'
import { useBookingsStore } from '@/stores/bookings.store'
import { useAuthStore } from '@/stores/auth.store'
import { useResourcesStore } from '@/stores/resources.store'
import { usePlantsStore } from '@/stores/plants.store'
import { useVisitorTypesStore } from '@/stores/visitor-types.store'
import { useUsersStore } from '@/stores/users.store'
import { useUnavailabilityStore } from '@/stores/unavailability.store'
import { bookingsApi } from '@/api/bookings.api'
import type { Booking, CalendarQuery } from '@/types/booking'
import type { BookingStatus } from '@/types/enums'
import { BookingStatus as BookingStatusEnum } from '@/types/enums'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const bookingsStore = useBookingsStore()
const authStore = useAuthStore()
const resourcesStore = useResourcesStore()
const plantsStore = usePlantsStore()
const usersStore = useUsersStore()
const unavailabilityStore = useUnavailabilityStore()

// ------ Refs ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null)
const calMainRef = ref<HTMLElement | null>(null)
const loading = ref(false)
// Flag per evitare il double-fetch: onMounted chiama fetchCalendar, poi onDatesSet lo
// chiamerebbe di nuovo causando un loop infinito (loading toggle --- FullCalendar rimonta).
const isCalendarInitialized = ref(false)
const showEventDetail = ref(false)
const showQuickBook = ref(false)
const selectedBooking = ref<Booking | null>(null)
const currentView = ref<string>('timeGridWeek')
const showWeekends = ref(true)
const showFilters = ref(false)
const showFiltersVisible = ref(false)
const showMoveConfirmDialog = ref(false)
const moveLoading = ref(false)
type PendingMoveInfo = {
  info: any
  booking: Booking
  updatedResources: { resourceId: string; plantId: string; startTime: string; endTime: string }[]
  fromLabel: string
  toLabel: string
  mode: 'move' | 'resize'
}
const pendingMoveInfo = ref<PendingMoveInfo | null>(null)

// ─── Finestra oraria visualizzata (slotMinTime / slotMaxTime) ────────────
//
// L'utente può configurare l'intervallo orario mostrato dal calendar
// (FullCalendar usa formato "HH:mm:ss"). I valori sono persistiti in
// localStorage per ricordare la preferenza tra le sessioni.
//
// Default: 06:00 — 22:00 (un'ora più ampio del precedente hardcoded
// 07:00 — 21:00). L'utente può aprire fino a 00:00 — 24:00 per vedere
// tutto il giorno, utile per turni notturni o per visualizzare
// prenotazioni che cadono fuori dall'orario standard.
const TIME_RANGE_STORAGE_KEY = 'amr.calendar.timeRange'
const DEFAULT_SLOT_START_HOUR = 6
const DEFAULT_SLOT_END_HOUR = 22

function loadStoredTimeRange(): { start: number; end: number } {
  try {
    const raw = localStorage.getItem(TIME_RANGE_STORAGE_KEY)
    if (!raw) return { start: DEFAULT_SLOT_START_HOUR, end: DEFAULT_SLOT_END_HOUR }
    const parsed = JSON.parse(raw) as { start?: number; end?: number }
    const start = Number.isFinite(parsed.start) ? parsed.start! : DEFAULT_SLOT_START_HOUR
    const end   = Number.isFinite(parsed.end)   ? parsed.end!   : DEFAULT_SLOT_END_HOUR
    // Sanitize: end deve essere > start, entrambi in [0, 24]
    if (start < 0 || start > 23 || end < 1 || end > 24 || end <= start) {
      return { start: DEFAULT_SLOT_START_HOUR, end: DEFAULT_SLOT_END_HOUR }
    }
    return { start, end }
  } catch {
    return { start: DEFAULT_SLOT_START_HOUR, end: DEFAULT_SLOT_END_HOUR }
  }
}

const storedTimeRange = loadStoredTimeRange()
const slotStartHour = ref<number>(storedTimeRange.start)
const slotEndHour   = ref<number>(storedTimeRange.end)

// Opzioni dropdown: 00:00 ... 23:00 per "Da", 01:00 ... 24:00 per "A"
const hourOptions = computed(() =>
  Array.from({ length: 24 }, (_, h) => ({
    value: h,
    label: `${String(h).padStart(2, '0')}:00`,
  })),
)
const hourOptionsEnd = computed(() =>
  Array.from({ length: 24 }, (_, i) => ({
    value: i + 1,
    label: i + 1 === 24 ? '24:00' : `${String(i + 1).padStart(2, '0')}:00`,
  })),
)

// Auto-correggi se l'utente sceglie un end ≤ start
watch(slotStartHour, (newStart) => {
  if (slotEndHour.value <= newStart) {
    slotEndHour.value = Math.min(24, newStart + 1)
  }
})

// Persistenza preferenza
watch([slotStartHour, slotEndHour], ([s, e]) => {
  try {
    localStorage.setItem(TIME_RANGE_STORAGE_KEY, JSON.stringify({ start: s, end: e }))
  } catch {
    /* localStorage unavailable: noop */
  }
})

const slotMinTime = computed(() => `${String(slotStartHour.value).padStart(2, '0')}:00:00`)
const slotMaxTime = computed(() => {
  const h = slotEndHour.value === 24 ? 24 : slotEndHour.value
  return `${String(h).padStart(2, '0')}:00:00`
})

function resetTimeRange(): void {
  slotStartHour.value = DEFAULT_SLOT_START_HOUR
  slotEndHour.value   = DEFAULT_SLOT_END_HOUR
}

/**
 * Risolve l'organizerId in nome leggibile facendo lookup nello users store.
 * Fallback in cascata: fullName → email → id (così resta non ambiguo
 * se l'utente è stato eliminato).
 */
const selectedBookingOrganizer = computed(() => {
  const id = selectedBooking.value?.organizerId
  if (!id) return '–'
  const user = usersStore.users.find((u) => u.id === id)
  if (!user) return id
  return user.fullName?.trim() || user.email || id
})

// ------ Cancellazione prenotazione (dal calendar) -------------------------
const showCancelDialog = ref(false)
const bookingToCancel = ref<Booking | null>(null)
const cancelLoading = ref(false)

// Stati ammessi per Modifica (DRF §7.3) e Cancellazione (DRF §7.2)
const canEditBooking = computed(() => {
  const s = selectedBooking.value?.status
  return s === BookingStatusEnum.Draft
      || s === BookingStatusEnum.PendingApproval
      || s === BookingStatusEnum.Confirmed
})
const canCancelBooking = computed(() => {
  const s = selectedBooking.value?.status
  return s !== undefined
      && s !== BookingStatusEnum.Cancelled
      && s !== BookingStatusEnum.Rejected
      && s !== BookingStatusEnum.Completed
})


let closeFiltersTimeout: ReturnType<typeof setTimeout> | null = null
function toggleFilters() {
  if (!showFilters.value) {
    showFilters.value = true
    showFiltersVisible.value = true
    if (closeFiltersTimeout) {
      clearTimeout(closeFiltersTimeout)
      closeFiltersTimeout = null
    }
  } else {
    showFilters.value = false
    // Fallback: se la transizione non chiama after-leave entro 700ms, forza la chiusura
    if (closeFiltersTimeout) clearTimeout(closeFiltersTimeout)
    closeFiltersTimeout = setTimeout(() => {
      showFiltersVisible.value = false
      console.warn('Forzata la chiusura dei filtri per timeout')
    }, 1)
    // showFiltersVisible verr- impostato a false da onFiltersAfterLeave
  }
}

watch(showFilters, (val) => {
  if (val) showFiltersVisible.value = true
})

function onFiltersAfterLeave() {
  if (closeFiltersTimeout) {
    clearTimeout(closeFiltersTimeout)
    closeFiltersTimeout = null
  }
  showFiltersVisible.value = false
  console.log('onFiltersAfterLeave chiamato')
}

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.plantId) count++
  if (filters.value.resourceTypeIds.length > 0) count++
  if (filters.value.resourceIds.length > 0) count++
  if (filters.value.statuses.length > 0) count++
  if (filters.value.visitorTypeId) count++
  if (filters.value.onlyMine) count++
  return count
})

const quickBook = ref({
  start: '',
  end: '',
  title: '',
  resourceId: '',
})

const filters = ref({
  plantId: '',
  resourceTypeIds: [] as string[],
  resourceIds: [] as string[],
  statuses: [] as BookingStatus[],
  visitorTypeId: '',
  onlyMine: false,
})

// ------ Views ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const views = computed(() => [
  { key: 'timeGridDay', icon: 'pi-calendar-minus', label: t('calendar.day') },
  { key: 'timeGridWeek', icon: 'pi-calendar', label: t('calendar.week') },
  { key: 'dayGridMonth', icon: 'pi-th-large', label: t('calendar.month') },
])

// ------ Computed Options ---------------------------------------------------------------------------------------------------------------------------------------------------------------------
const siteOptions = computed(() =>
  plantsStore.activePlants.map((plant) => ({
    label: plant.name,
    value: plant.id,
  }))
)


const visitorTypeOptions = computed(() => {
  const store = useVisitorTypesStore()
  return store.visitorTypes.map((vt) => ({ label: vt.name, value: vt.id }))
})

const resourceTypeOptions = computed(() =>
  resourcesStore.resourceTypes.map((rt) => ({
    label: rt.name,
    value: rt.id,
  }))
)

const resourceOptions = computed(() => {
  let resources = resourcesStore.resources

  if (filters.value.plantId) {
    resources = resources.filter((r) => r.plantId === filters.value.plantId)
  }
  if (filters.value.resourceTypeIds.length > 0) {
    resources = resources.filter((r) => filters.value.resourceTypeIds.includes(r.resourceTypeId))
  }

  return resources.map((resource) => ({
    label: resource.name,
    value: resource.id,
  }))
})

const statusOptions = computed(() => [
  { label: t('bookings.status.draft'), value: BookingStatusEnum.Draft },
  { label: t('bookings.status.pendingApproval'), value: BookingStatusEnum.PendingApproval },
  { label: t('bookings.status.confirmed'), value: BookingStatusEnum.Confirmed },
  { label: t('bookings.status.inProgress'), value: BookingStatusEnum.InProgress },
  { label: t('bookings.status.completed'), value: BookingStatusEnum.Completed },
  { label: t('bookings.status.cancelled'), value: BookingStatusEnum.Cancelled },
  { label: t('bookings.status.rejected'), value: BookingStatusEnum.Rejected },
])

const legendItems = computed(() => [
  { status: BookingStatusEnum.Confirmed, color: '#10b981', label: t('bookings.status.confirmed') },
  { status: BookingStatusEnum.PendingApproval, color: '#f59e0b', label: t('bookings.status.pendingApproval') },
  { status: BookingStatusEnum.InProgress, color: '#3b82f6', label: t('bookings.status.inProgress') },
  { status: BookingStatusEnum.Draft, color: '#9ca3af', label: t('bookings.status.draft') },
  { status: BookingStatusEnum.Cancelled, color: '#ef4444', label: t('bookings.status.cancelled') },
  { status: BookingStatusEnum.Completed, color: '#6366f1', label: t('bookings.status.completed') },
])

// ------ Calendar Events ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const calendarEvents = computed(() => {
  let filtered = bookingsStore.calendarBookings

  // Filtro per tipologia risorsa (client-side, multiplo)
  if (filters.value.resourceTypeIds.length > 0) {
    filtered = filtered.filter((booking) =>
      booking.resources?.some((r) => {
        const resource = resourcesStore.resourceById(r.resourceId)
        return resource && filters.value.resourceTypeIds.includes(resource.resourceTypeId)
      })
    )
  }

  // Filtro per risorsa specifica (client-side, multiplo)
  if (filters.value.resourceIds.length > 0) {
    filtered = filtered.filter((booking) =>
      booking.resources?.some((r) => filters.value.resourceIds.includes(r.resourceId))
    )
  }


  // Filtro per tipologia visitatore (client-side)
  if (filters.value.visitorTypeId) {
    filtered = filtered.filter((booking) =>
      booking.visitorTypeId === filters.value.visitorTypeId
    )
  }

  // Filtro "Solo le mie prenotazioni" (organizzatore)
  if (filters.value.onlyMine) {
    const myId = authStore.user?.userId
    if (myId) {
      filtered = filtered.filter((booking) => booking.organizerId === myId)
    }
  }

  // Filtro per stato (client-side, multiplo)
  if (filters.value.statuses.length > 0) {
    filtered = filtered.filter((booking) =>
      filters.value.statuses.includes(booking.status)
    )
  }

  return filtered.map((booking) => {
    const startTime = booking.resources?.[0]?.startTime
    const endTime = booking.resources?.[0]?.endTime

    // Colore evento: lo SFONDO riflette lo stato (legenda comune,
    // Confirmed=verde, Cancelled=rosso ecc.) mentre il BORDO usa il
    // colore configurato sul Tipo di Risorsa (DRF §5.1 — "icona/colore
    // identificativo nella UI"). Così l'utente identifica a colpo
    // d'occhio sia lo stato della prenotazione sia il tipo di risorsa.
    // Se il tipo non ha colore configurato, il bordo cade sul colore status.
    const statusColor = getStatusColor(booking.status)
    const resourceTypeColor = getResourceTypeColorForBooking(booking)

    return {
      id: booking.id,
      title: booking.title,
      start: startTime,
      end: endTime,
      backgroundColor: statusColor,
      borderColor: resourceTypeColor || statusColor,
      textColor: '#ffffff',
      classNames: [
        `event-${booking.status.toLowerCase()}`,
        booking.status === BookingStatusEnum.Cancelled ? 'event-cancelled' : '',
        resourceTypeColor ? 'event-with-type-color' : '',
      ].filter(Boolean),
      extendedProps: { booking },
    }
  })
})

// ------ Calendar Options ---------------------------------------------------------------------------------------------------------------------------------------------------------------------
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  headerToolbar: {
    left: 'prev,next',
    center: 'title',
    right: '',
  },
  initialView: currentView.value,
  locale: itLocale,
  events: calendarEvents.value,
  weekends: showWeekends.value,
  selectable: true,
  selectMirror: true,
  selectMinDistance: 5,
  selectAllow: selectAllow,
  unselectAuto: true,
  height: 'auto',
  contentHeight: 850,
  nowIndicator: true,
  slotMinTime: slotMinTime.value,
  slotMaxTime: slotMaxTime.value,
  slotDuration: '00:30:00',
  slotLabelInterval: '01:00:00',
  slotLabelFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    omitZeroMinute: false,
    meridiem: false,
  },
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '19:00',
  },
  editable: true,
  eventDrop: onEventDrop,
  eventResize: onEventResize,
  eventClick: onEventClick,
  select: onDateSelect,
  eventMouseEnter: onEventMouseEnter,
  eventMouseLeave: onEventMouseLeave,
  datesSet: onDatesSet,
  dayMaxEvents: 4,
  moreLinkContent: (args: { num: number }) => `+${args.num} ${t('calendar.more')}`,
}))

// ------ Helpers ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Produce "YYYY-MM-DDTHH:mm:ss" in ora locale, senza Z.
// Il backend usa DateTime senza offset (Kind=Unspecified) e si aspetta
// stringhe locali, non UTC. toISOString() emetterebbe UTC (+Z) causando
// uno scarto fisso pari all'offset del fuso orario (es. 2h in CEST).
function toLocalISOString(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
}

// Returns false (non-selectable) when the day is fully blocked by an active all-day unavailability block.
function selectAllow(selectInfo: { start: Date; end: Date }): boolean {
  const dayStr = toLocalISOString(selectInfo.start).slice(0, 10)
  return !unavailabilityStore.activeUnavailabilityBlocks.some((block) => {
    if (!block.isAllDay) return false
    const blockStart = block.startTime.slice(0, 10)
    const blockEnd = block.endTime.slice(0, 10)
    return dayStr >= blockStart && dayStr <= blockEnd
  })
}

function getStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    [BookingStatusEnum.Confirmed]: '#10b981',
    [BookingStatusEnum.InProgress]: '#3b82f6',
    [BookingStatusEnum.PendingApproval]: '#f59e0b',
    [BookingStatusEnum.Draft]: '#9ca3af',
    [BookingStatusEnum.Cancelled]: '#ef4444',
    [BookingStatusEnum.Completed]: '#6366f1',
    [BookingStatusEnum.Rejected]: '#ef4444',
  }
  return colors[status] || '#6b7280'
}

function getResourceName(resourceId: string): string {
  return resourcesStore.resourceById(resourceId)?.name || resourceId
}

/**
 * Risolve il colore del Tipo di Risorsa associato alla prima risorsa della
 * prenotazione (DRF §5.1 — "icona/colore identificativo nella UI").
 * Restituisce undefined se il booking non ha risorse, se il tipo non è
 * trovato, o se il tipo non ha un colore configurato — in quel caso il
 * caller userà il colore di stato come bordo.
 */
function getResourceTypeColorForBooking(booking: Booking): string | undefined {
  const firstResourceId = booking.resources?.[0]?.resourceId
  if (!firstResourceId) return undefined
  const resource = resourcesStore.resourceById(firstResourceId)
  if (!resource) return undefined
  const resourceType = resourcesStore.resourceTypeById(resource.resourceTypeId)
  return resourceType?.color || undefined
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

// ------ Actions ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function setView(view: string) {
  currentView.value = view
  calendarRef.value?.getApi().changeView(view)
}

function goToToday() {
  calendarRef.value?.getApi().today()
}

function onPlantChange() {
  filters.value.resourceTypeIds = []
  filters.value.resourceIds = []
}

function onEventClick(info: any) {
  selectedBooking.value = info.event.extendedProps.booking
  showEventDetail.value = true
}

/**
 * Gestisce il trascinamento di un evento nel calendario.
 * Mostra un dialog di conferma prima di persistere la modifica.
 */
function onEventDrop(info: any): void {
  const booking: Booking = info.event.extendedProps.booking
  const editableStatuses = [BookingStatusEnum.Draft, BookingStatusEnum.PendingApproval, BookingStatusEnum.Confirmed]
  if (!editableStatuses.includes(booking.status)) {
    info.revert()
    toast.add({ severity: 'warn', summary: t('calendar.bookingNotEditable'), life: 3000 })
    return
  }
  const deltaMs = (info.event.start as Date).getTime() - (info.oldEvent.start as Date).getTime()
  const updatedResources = booking.resources.map((r) => ({
    resourceId: r.resourceId,
    plantId: r.plantId,
    startTime: toLocalISOString(new Date(new Date(r.startTime).getTime() + deltaMs)),
    endTime: toLocalISOString(new Date(new Date(r.endTime).getTime() + deltaMs)),
  }))
  const fmt = (iso: string) => {
    const d = new Date(iso)
    return `${d.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' })} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  pendingMoveInfo.value = {
    info,
    booking,
    updatedResources,
    fromLabel: fmt(booking.resources[0]?.startTime ?? info.oldEvent.start.toISOString()),
    toLabel: fmt(updatedResources[0]?.startTime ?? info.event.start.toISOString()),
    mode: 'move',
  }
  showMoveConfirmDialog.value = true
}

async function confirmMoveBooking(): Promise<void> {
  if (!pendingMoveInfo.value) return
  const { info, booking, updatedResources } = pendingMoveInfo.value
  moveLoading.value = true
  try {
    await bookingsApi.update(booking.id, { resources: updatedResources })
    toast.add({ severity: 'success', summary: t('calendar.bookingMoved'), detail: booking.title, life: 3000 })
    showMoveConfirmDialog.value = false
    pendingMoveInfo.value = null
    await fetchCalendar()
  } catch {
    info.revert()
    showMoveConfirmDialog.value = false
    pendingMoveInfo.value = null
    toast.add({ severity: 'error', summary: t('calendar.bookingMoveFailed'), life: 4000 })
  } finally {
    moveLoading.value = false
  }
}

function cancelMoveBooking(): void {
  if (pendingMoveInfo.value) {
    pendingMoveInfo.value.info.revert()
    pendingMoveInfo.value = null
  }
  showMoveConfirmDialog.value = false
}

/**
 * Gestisce il ridimensionamento di un evento (allarga/accorcia).
 * Riusa lo stesso dialog di conferma del drag & drop.
 */
function onEventResize(info: any): void {
  const booking: Booking = info.event.extendedProps.booking
  const editableStatuses = [BookingStatusEnum.Draft, BookingStatusEnum.PendingApproval, BookingStatusEnum.Confirmed]
  if (!editableStatuses.includes(booking.status)) {
    info.revert()
    toast.add({ severity: 'warn', summary: t('calendar.bookingNotEditable'), life: 3000 })
    return
  }
  const newEnd = info.event.end as Date
  const updatedResources = booking.resources.map((r) => ({
    resourceId: r.resourceId,
    plantId: r.plantId,
    startTime: r.startTime,
    endTime: toLocalISOString(new Date(
      new Date(r.startTime).getTime() + (newEnd.getTime() - (info.event.start as Date).getTime())
    )),
  }))
  const fmt = (iso: string) => {
    const d = new Date(iso)
    return `${d.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' })} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  pendingMoveInfo.value = {
    info,
    booking,
    updatedResources,
    fromLabel: fmt(booking.resources[0]?.endTime ?? info.oldEvent.end.toISOString()),
    toLabel: fmt(updatedResources[0]?.endTime ?? newEnd.toISOString()),
    mode: 'resize',
  }
  showMoveConfirmDialog.value = true
}

/**
 * Apre il wizard in modalità modifica per la prenotazione corrente.
 * Riusa la stessa rotta di "continueDraft" — il wizard riconosce il
 * draftId e pre-riempie i campi (DRF §7.3).
 */
function goToEditBooking(): void {
  if (!selectedBooking.value) return
  const id = selectedBooking.value.id
  showEventDetail.value = false
  router.push({ name: 'BookingWizard', query: { draftId: id } })
}

/**
 * Avvia il flusso di cancellazione: nasconde il dialog dettaglio,
 * apre il dialog di conferma. La cancellazione effettiva è in
 * confirmCancelBooking (DRF §7.2 — transizione → Cancelled, dispatch
 * ICS METHOD:CANCEL ai partecipanti registrati).
 */
function openCancelDialog(): void {
  if (!selectedBooking.value) return
  bookingToCancel.value = selectedBooking.value
  showEventDetail.value = false
  showCancelDialog.value = true
}

async function confirmCancelBooking(): Promise<void> {
  if (!bookingToCancel.value) return
  cancelLoading.value = true
  try {
    // Per le prenotazioni ricorrenti la cancellazione di default colpisce
    // solo l'occorrenza corrente (DRF §6A.4 — scope ThisOnly). Per scope
    // ThisAndFollowing/AllOccurrences l'utente deve passare per la
    // BookingDetailView, che espone il selettore.
    await bookingsStore.cancelBooking(bookingToCancel.value.id, undefined)
    showCancelDialog.value = false
    bookingToCancel.value = null
    // Ricarica gli eventi del calendario per riflettere lo stato Cancelled
    await fetchCalendar()
  } catch (error) {
    console.error('Failed to cancel booking from calendar:', error)
  } finally {
    cancelLoading.value = false
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onEventMouseEnter(_info: any) {
  // Future: tooltip
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onEventMouseLeave(_info: any) {
  // Future: tooltip
}

function onDateSelect(info: any) {
  // Open quick-book modal with the selected time range
  quickBook.value = {
    start: info.startStr,
    end: info.endStr,
    title: '',
    resourceId: filters.value.resourceIds?.[0] || '',
  }
  showQuickBook.value = true
}

function proceedToWizard() {
  showQuickBook.value = false
  router.push({
    name: 'BookingWizard',
    query: {
      startDate: quickBook.value.start,
      endDate: quickBook.value.end,
      resourceId: quickBook.value.resourceId || undefined,
      title: quickBook.value.title || undefined,
    },
  })
}

function onDatesSet(dateInfo: any) {
  // Il primo onDatesSet - quello del mount iniziale: lo ignoriamo perch-
  // onMounted ha gi- lanciato fetchCalendar. Poi aggiorniamo il flag.
  if (!isCalendarInitialized.value) {
    isCalendarInitialized.value = true
    return
  }
  // Navigazione successiva dell'utente (mese, settimana, giorno)
  fetchCalendar(dateInfo.start, dateInfo.end)
}

function resetFilters() {
  filters.value = { plantId: '', resourceTypeIds: [], resourceIds: [], statuses: [], visitorTypeId: '', onlyMine: false }
  fetchCalendar()
}

async function fetchCalendar(_start?: Date, _end?: Date): Promise<void> {
  try {
    loading.value = true

    const query: CalendarQuery = {}
    if (filters.value.plantId) query.plantId = filters.value.plantId

    // I filtri multipli (resourceTypeIds, resourceIds, statuses) sono applicati
    // client-side nel computed calendarEvents, non servono nella query API.

    // Pass visible date range to the API so the backend returns bookings in range
    if (_start) {
      query.startDate = _start.toISOString()
    }
    if (_end) {
      query.endDate = _end.toISOString()
    }

    // If no explicit range provided, compute from current calendar view
    if (!_start && calendarRef.value) {
      const calApi = calendarRef.value.getApi()
      if (calApi?.view) {
        query.startDate = calApi.view.activeStart.toISOString()
        query.endDate = calApi.view.activeEnd.toISOString()
      }
    }

    await bookingsStore.fetchCalendarBookings(query)
  } catch (error) {
    console.error('Failed to fetch calendar bookings:', error)
  } finally {
    loading.value = false
  }
}

// ------ Watchers ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Solo plantId richiede un nuovo fetch dal backend; gli altri filtri
// (resourceTypeIds, resourceIds, statuses) sono applicati client-side nel computed.
watch(
  () => filters.value.plantId,
  () => { fetchCalendar() }
)

// ------ ResizeObserver - aggiorna FullCalendar quando il contenitore cambia larghezza ------
let resizeObserver: ResizeObserver | null = null

// ------ Init ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
onMounted(async () => {
  // Osserva il contenitore del calendario: quando la sidebar si apre/chiude
  // la larghezza cambia e FullCalendar deve ricalcolare le sue dimensioni.
  if (calMainRef.value) {
    resizeObserver = new ResizeObserver(() => {
      calendarRef.value?.getApi()?.updateSize()
    })
    resizeObserver.observe(calMainRef.value)
  }

  try {
    await Promise.all([
      plantsStore.fetchAll(),
      resourcesStore.fetchAllResources(),
      resourcesStore.fetchAllResourceTypes(),
      // Carica gli utenti per risolvere organizerId → nome nel popover dettagli.
      usersStore.users.length === 0 ? usersStore.fetchAll() : Promise.resolve(),
      // Carica i blocchi di indisponibilità per disabilitare i giorni bloccati a giornata intera.
      unavailabilityStore.unavailabilityBlocks.length === 0
        ? unavailabilityStore.fetchAllUnavailabilityBlocks()
        : Promise.resolve(),
      fetchCalendar(),
    ])
  } catch (error) {
    console.error('Failed to initialize calendar:', error)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped src="./CalendarView.css"></style>
