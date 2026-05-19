<template>
  <MainLayout>
    <div class="list-page">

      <!-- Error banner -->
      <div v-if="bookingsStore.error" class="list-error">
        <i class="pi pi-exclamation-circle" />
        <span>{{ t('common.loadFailed') }}</span>
        <button class="btn-text" @click="loadData">{{ t('common.retry') }}</button>
      </div>

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
          <router-link :to="{ name: 'BookingWizard' }" class="list-btn-primary">
            <i class="pi pi-plus" />
            <span>{{ t('bookings.new') }}</span>
          </router-link>
        </div>

        <div class="list-row-secondary">
          <div class="list-filters-group">
            <div class="list-filter-inline">
              <label class="list-filter-label-inline">{{ t('common.status') }}</label>
              <PrimeMultiSelect
                v-model="filterStatuses"
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
              <label class="list-filter-label-inline">{{ t('bookings.plant') }}</label>
              <PrimeMultiSelect
                v-model="filterPlantIds"
                :options="plantOptions"
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
              <label class="list-filter-label-inline">{{ t('bookings.resource') }}</label>
              <PrimeMultiSelect
                v-model="filterResourceIds"
                :options="resourceOptions"
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
              <label class="list-filter-label-inline">{{ t('bookings.dateFrom') }}</label>
              <input v-model="filterDateFrom" type="date" class="list-filter-date" />
            </div>

            <div class="list-filter-inline">
              <label class="list-filter-label-inline">{{ t('bookings.dateTo') }}</label>
              <input v-model="filterDateTo" type="date" class="list-filter-date" />
            </div>
          </div>

          <div class="list-row-secondary-right">
            <span class="list-count-flat">{{ filteredBookings.length }} {{ t('common.results') }}</span>
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

      <!-- ── Loading / Empty ──────────────────────────────────────── -->
      <div v-if="loading" class="list-loading">
        <i class="pi pi-spin pi-spinner" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="filteredBookings.length === 0" class="list-empty">
        <i class="pi pi-inbox" />
        <p v-if="hasActiveFilters">{{ t('bookings.noResultsWithFilters') }}</p>
        <p v-else>{{ t('bookings.noBookings') }}</p>
      </div>

      <!-- ── Tabella ──────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
        <DataTable
          :value="filteredBookings"
          :paginator="filteredBookings.length > 15"
          :rows="15"
          responsiveLayout="scroll"
          stripedRows
          class="list-table"
          @row-click="onRowClick"
        >
          <Column field="status" :header="t('common.status')" :sortable="true" style="width: 160px">
            <template #body="{ data }">
              <span class="status-chip" :style="getStatusStyle(data.status)">
                <i :class="`pi ${getStatusIcon(data.status)}`" />
                {{ getStatusLabel(data.status) }}
              </span>
            </template>
          </Column>

          <Column field="title" :header="t('common.name')" :sortable="true" style="width: 22%">
            <template #body="{ data }">
              <span class="list-cell-strong">{{ data.title }}</span>
              <small v-if="data.notes" class="booking-notes">{{ data.notes }}</small>
            </template>
          </Column>

          <Column field="firstStartTime" :header="t('common.dateTime')" :sortable="true" style="width: 170px">
            <template #body="{ data }">
              <template v-if="data.resources[0]">
                <div class="date-primary">{{ formatDateShort(data.resources[0].startTime) }}</div>
                <small class="date-secondary">{{ formatTimeRange(data.resources[0].startTime, data.resources[0].endTime) }}</small>
              </template>
              <span v-else class="list-cell-muted">—</span>
            </template>
          </Column>

          <Column field="plantName" :header="t('bookings.plant')" :sortable="true" style="width: 14%">
            <template #body="{ data }">
              <span class="list-cell-muted">{{ getPlantName(data.resources[0]?.plantId) }}</span>
            </template>
          </Column>

          <Column :header="t('resources.title')" style="width: 18%">
            <template #body="{ data }">
              <div class="resource-tags">
                <span v-for="resource in data.resources.slice(0, 2)" :key="resource.id" class="resource-tag">
                  {{ getResourceName(resource.resourceId) }}
                </span>
                <span v-if="data.resources.length > 2" class="resource-tag resource-tag-more">
                  +{{ data.resources.length - 2 }}
                </span>
              </div>
            </template>
          </Column>

          <Column field="organizerName" :header="t('bookings.organizer')" :sortable="true" style="width: 14%">
            <template #body="{ data }">
              <div class="organizer-cell">
                <span class="organizer-avatar">{{ getOrganizerInitials(data.organizerId) }}</span>
                <span class="list-cell-muted">{{ getOrganizerDisplayName(data.organizerId) }}</span>
              </div>
            </template>
          </Column>

          <Column :header="t('common.actions')" style="width: 130px" class="list-col-actions">
            <template #body="{ data }">
              <div class="list-row-actions" @click.stop>
                <button type="button" class="list-action-btn list-action-view" :title="t('common.details')" @click="viewBooking(data.id)">
                  <i class="pi pi-eye" />
                </button>
                <button v-if="data.status === 'Draft'" type="button" class="list-action-btn list-action-edit" :title="t('bookings.continueDraft')" @click="editBooking(data.id)">
                  <i class="pi pi-arrow-right" />
                </button>
                <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="confirmCancel(data.id)">
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
          v-for="booking in filteredBookings"
          :key="booking.id"
          class="list-card list-card-clickable"
          @click="viewBooking(booking.id)"
        >
          <div class="list-card-head">
            <h3 class="list-card-title">{{ booking.title }}</h3>
            <span class="status-chip" :style="getStatusStyle(booking.status)">
              <i :class="`pi ${getStatusIcon(booking.status)}`" />
              {{ getStatusLabel(booking.status) }}
            </span>
          </div>
          <p v-if="booking.notes" class="list-card-desc">{{ booking.notes }}</p>
          <div class="list-card-info">
            <div v-if="booking.resources[0]" class="list-card-info-row">
              <i class="pi pi-calendar" />
              <span>{{ formatDateShort(booking.resources[0].startTime) }} · {{ formatTimeRange(booking.resources[0].startTime, booking.resources[0].endTime) }}</span>
            </div>
            <div class="list-card-info-row">
              <i class="pi pi-building" />
              <span>{{ getPlantName(booking.resources[0]?.plantId) }}</span>
            </div>
            <div class="list-card-info-row">
              <i class="pi pi-box" />
              <div class="resource-tags">
                <span v-for="resource in booking.resources.slice(0, 3)" :key="resource.id" class="resource-tag">
                  {{ getResourceName(resource.resourceId) }}
                </span>
                <span v-if="booking.resources.length > 3" class="resource-tag resource-tag-more">
                  +{{ booking.resources.length - 3 }}
                </span>
              </div>
            </div>
            <div class="list-card-info-row">
              <i class="pi pi-user" />
              <span>{{ getOrganizerDisplayName(booking.organizerId) }}</span>
            </div>
          </div>
          <div class="list-card-actions" @click.stop>
            <button type="button" class="list-action-btn list-action-view" :title="t('common.details')" @click="viewBooking(booking.id)">
              <i class="pi pi-eye" />
            </button>
            <button v-if="booking.status === 'Draft'" type="button" class="list-action-btn list-action-edit" :title="t('bookings.continueDraft')" @click="editBooking(booking.id)">
              <i class="pi pi-arrow-right" />
            </button>
            <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="confirmCancel(booking.id)">
              <i class="pi pi-trash" />
            </button>
          </div>
        </article>
      </div>

      <PrimeConfirmDialog />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConfirm } from 'primevue/useconfirm'
import MainLayout from '@/layouts/MainLayout.vue'
import PrimeConfirmDialog from 'primevue/confirmdialog'
import PrimeMultiSelect from 'primevue/multiselect'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useBookingsStore } from '@/stores/bookings.store'
import { useAuthStore } from '@/stores/auth.store'
import { useResourcesStore } from '@/stores/resources.store'
import { usePlantsStore } from '@/stores/plants.store'
import { useUsersStore } from '@/stores/users.store'
import type { Booking, CalendarQuery } from '@/types/booking'
import type { BookingStatus } from '@/types/enums'
import { BookingStatus as BookingStatusEnum } from '@/types/enums'

const { t, locale } = useI18n()
const router = useRouter()
const confirm = useConfirm()
const bookingsStore = useBookingsStore()
const authStore = useAuthStore()
const resourcesStore = useResourcesStore()
const plantsStore = usePlantsStore()
const usersStore = useUsersStore()

function toDateInputValue(date: Date): string { return date.toISOString().slice(0, 10) }
function getDefaultDateFrom(): string {
  const d = new Date(); d.setMonth(d.getMonth() - 6); return toDateInputValue(d)
}
function getDefaultDateTo(): string {
  const d = new Date(); d.setMonth(d.getMonth() + 6); return toDateInputValue(d)
}

const loading = ref(false)
const localBookings = ref<Booking[]>([])
const searchQuery = ref('')
const filterStatuses = ref<BookingStatus[]>([])
const filterPlantIds = ref<string[]>([])
const filterResourceIds = ref<string[]>([])
const filterDateFrom = ref(getDefaultDateFrom())
const filterDateTo = ref(getDefaultDateTo())
const viewMode = ref<'card' | 'table'>(
  (localStorage.getItem('bookings_view_mode') as 'card' | 'table') ?? 'table'
)

const setViewMode = (mode: 'card' | 'table') => {
  viewMode.value = mode
  localStorage.setItem('bookings_view_mode', mode)
}

const statusOptions = computed(() => [
  { label: t('bookings.status.draft'), value: BookingStatusEnum.Draft },
  { label: t('bookings.status.pendingApproval'), value: BookingStatusEnum.PendingApproval },
  { label: t('bookings.status.confirmed'), value: BookingStatusEnum.Confirmed },
  { label: t('bookings.status.inProgress'), value: BookingStatusEnum.InProgress },
  { label: t('bookings.status.completed'), value: BookingStatusEnum.Completed },
  { label: t('bookings.status.cancelled'), value: BookingStatusEnum.Cancelled },
  { label: t('bookings.status.rejected'), value: BookingStatusEnum.Rejected },
])

const plantOptions = computed(() => plantsStore.activePlants.map((p) => ({ label: p.name, value: p.id })))

const resourceOptions = computed(() => {
  let resources = resourcesStore.resources
  if (filterPlantIds.value.length > 0) {
    resources = resources.filter((r) => filterPlantIds.value.includes(r.plantId))
  }
  return resources.map((r) => ({ label: r.name, value: r.id }))
})

const hasActiveFilters = computed(() =>
  !!searchQuery.value || filterStatuses.value.length > 0 || filterPlantIds.value.length > 0 ||
  filterResourceIds.value.length > 0 || !!filterDateFrom.value || !!filterDateTo.value
)

const canViewTenantWideBookings = computed(() =>
  authStore.hasRole('Tenant.Owner') ||
  authStore.hasRole('Tenant.Contributor') ||
  authStore.hasRole('Tenant.Reader') ||
  authStore.hasRole('Platform.Owner') ||
  authStore.hasRole('Platform.Owner.Impersonating')
)

const filteredBookings = computed(() => {
  let list = localBookings.value.map((b) => ({
    ...b,
    firstStartTime: b.resources[0]?.startTime ? new Date(b.resources[0].startTime).getTime() : 0,
    plantName: getPlantName(b.resources[0]?.plantId),
    organizerName: getOrganizerDisplayName(b.organizerId),
  }))

  if (filterStatuses.value.length > 0) {
    list = list.filter((b) => filterStatuses.value.includes(b.status))
  }
  if (filterPlantIds.value.length > 0) {
    list = list.filter((b) => b.resources.some((r) => filterPlantIds.value.includes(r.plantId)))
  }
  if (filterResourceIds.value.length > 0) {
    list = list.filter((b) => b.resources.some((r) => filterResourceIds.value.includes(r.resourceId)))
  }
  if (filterDateFrom.value) {
    const from = new Date(filterDateFrom.value); from.setHours(0, 0, 0, 0)
    list = list.filter((b) => {
      const start = b.resources[0]?.startTime
      return start && new Date(start) >= from
    })
  }
  if (filterDateTo.value) {
    const to = new Date(filterDateTo.value); to.setHours(23, 59, 59, 999)
    list = list.filter((b) => {
      const start = b.resources[0]?.startTime
      return start && new Date(start) <= to
    })
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((b) =>
      b.title.toLowerCase().includes(q) ||
      getOrganizerDisplayName(b.organizerId).toLowerCase().includes(q) ||
      (b.notes?.toLowerCase().includes(q) ?? false)
    )
  }
  return list
})

function getPlantName(plantId: string | undefined): string {
  if (!plantId) return '—'
  return plantsStore.plantById(plantId)?.name || '—'
}

function getResourceName(resourceId: string): string {
  return resourcesStore.resourceById(resourceId)?.name || '—'
}

function getOrganizerDisplayName(organizerId: string): string {
  if (!organizerId) return '—'
  const user = usersStore.users.find((u) => u.id === organizerId)
  if (user) {
    if (user.fullName && user.fullName.trim()) return user.fullName.trim()
    if (user.email) return user.email
  }
  if (organizerId.includes('@')) {
    const name = organizerId.split('@')[0]
    return name.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return organizerId
}

function getOrganizerInitials(organizerId: string): string {
  const name = getOrganizerDisplayName(organizerId)
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getStatusIcon(status: BookingStatus): string {
  const icons: Record<BookingStatus, string> = {
    [BookingStatusEnum.Draft]: 'pi-file-edit',
    [BookingStatusEnum.PendingApproval]: 'pi-clock',
    [BookingStatusEnum.Confirmed]: 'pi-check-circle',
    [BookingStatusEnum.InProgress]: 'pi-spin pi-spinner',
    [BookingStatusEnum.Completed]: 'pi-check-square',
    [BookingStatusEnum.Cancelled]: 'pi-times-circle',
    [BookingStatusEnum.Rejected]: 'pi-ban',
  }
  return icons[status] || 'pi-info-circle'
}

function getStatusStyle(status: BookingStatus): Record<string, string> {
  const map: Record<BookingStatus, { bg: string; color: string }> = {
    [BookingStatusEnum.Draft]:           { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
    [BookingStatusEnum.PendingApproval]: { bg: 'rgba(245,158,11,0.12)',  color: '#d97706' },
    [BookingStatusEnum.Confirmed]:       { bg: 'rgba(16,185,129,0.12)',  color: '#059669' },
    [BookingStatusEnum.InProgress]:      { bg: 'rgba(59,130,246,0.12)',  color: '#2563eb' },
    [BookingStatusEnum.Completed]:       { bg: 'rgba(124,58,237,0.12)',  color: '#7c3aed' },
    [BookingStatusEnum.Cancelled]:       { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
    [BookingStatusEnum.Rejected]:        { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  }
  const s = map[status] || { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' }
  return { backgroundColor: s.bg, color: s.color }
}

function getStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    [BookingStatusEnum.Draft]: t('bookings.status.draft'),
    [BookingStatusEnum.PendingApproval]: t('bookings.status.pendingApproval'),
    [BookingStatusEnum.Confirmed]: t('bookings.status.confirmed'),
    [BookingStatusEnum.InProgress]: t('bookings.status.inProgress'),
    [BookingStatusEnum.Completed]: t('bookings.status.completed'),
    [BookingStatusEnum.Cancelled]: t('bookings.status.cancelled'),
    [BookingStatusEnum.Rejected]: t('bookings.status.rejected'),
  }
  return labels[status] || status
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatTimeRange(startStr: string, endStr: string): string {
  const fmt = (d: string) => new Date(d).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
  return `${fmt(startStr)} — ${fmt(endStr)}`
}

function viewBooking(id: string) {
  router.push({ name: 'BookingDetail', params: { id } })
}

function editBooking(id: string) {
  router.push({ name: 'BookingWizard', query: { draftId: id } })
}

function onRowClick(event: { data: Booking }) {
  viewBooking(event.data.id)
}

function confirmCancel(id: string) {
  confirm.require({
    message: t('bookings.confirmDelete'),
    header: t('bookings.confirmDeleteHeader'),
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        loading.value = true
        await bookingsStore.cancelBooking(id)
      } catch (e) {
        console.error('Failed to cancel booking:', e)
      } finally {
        loading.value = false
      }
    },
  })
}

async function loadData() {
  try {
    loading.value = true
    const query: CalendarQuery = {
      startDate: filterDateFrom.value || getDefaultDateFrom(),
      endDate: filterDateTo.value || getDefaultDateTo(),
    }
    if (!canViewTenantWideBookings.value && authStore.user?.userId) {
      query.userId = authStore.user.userId
    }
    const [cal] = await Promise.all([
      bookingsStore.fetchCalendarBookings(query),
      plantsStore.fetchAll(),
      resourcesStore.fetchAllResources(),
      usersStore.users.length === 0 ? usersStore.fetchAll() : Promise.resolve(),
    ])
    localBookings.value = cal ?? []
  } catch (e) {
    console.error('[BookingsListView] loadData error:', e)
    localBookings.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [authStore.currentTenantId, authStore.user?.userId],
  ([tenantId, userId], [prevTenantId, prevUserId]) => {
    if ((tenantId && tenantId !== prevTenantId) || (userId && userId !== prevUserId)) {
      loadData()
    }
  }
)

onMounted(loadData)
</script>

<style scoped src="./BookingsListView.css"></style>
