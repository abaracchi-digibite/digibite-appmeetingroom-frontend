<template>
  <MainLayout>
    <div class="bookings-page">

      <!-- ------ Header ------------------------------------------------------------------------------------------------------------------------------------------------ -->
      <div class="page-header">
        <router-link :to="{ name: 'BookingWizard' }" class="btn-primary">
          <i class="pi pi-plus mr-1" />
          {{ t('bookings.new') }}
        </router-link>
      </div>

      <!-- ------ Error Banner ------------------------------------------------------------------------------------------------------------------------------ -->
      <div v-if="bookingsStore.error" class="error-banner">
        <i class="pi pi-exclamation-circle" />
        <span>{{ t('errors.loadFailed') }}</span>
        <button class="btn-text" @click="loadData">{{ t('common.retry') }}</button>
      </div>

      <!-- ------ Filters --------------------------------------------------------------------------------------------------------------------------------------------- -->
      <div class="filters-card">
        <div class="filters-grid">
          <!-- Search -->
          <div class="filter-field filter-field-search">
            <label class="filter-label">{{ t('common.search') }}</label>
            <div class="input-icon-wrapper">
              <i class="pi pi-search input-icon" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('common.search') + '...'"
                class="form-input input-with-icon"
              />
            </div>
          </div>

          <!-- Status -->
          <div class="filter-field">
            <label class="filter-label">{{ t('common.status') }}</label>
            <PrimeMultiSelect
              v-model="filterStatuses"
              :options="statusOptions"
              option-:label="t('views.bookingsList.label')"
              option-value="value"
              :placeholder="t('bookings.allStatuses')"
              class="w-full"
              display="chip"
            />
          </div>

          <!-- Plant -->
          <div class="filter-field">
            <label class="filter-label">{{ t('bookings.plant') }}</label>
            <PrimeMultiSelect
              v-model="filterPlantIds"
              :options="plantOptions"
              option-:label="t('views.bookingsList.label')"
              option-value="value"
              :placeholder="t('bookings.allPlants')"
              class="w-full"
              display="chip"
            />
          </div>

          <!-- Resource -->
          <div class="filter-field">
            <label class="filter-label">{{ t('bookings.resource') }}</label>
            <PrimeMultiSelect
              v-model="filterResourceIds"
              :options="resourceOptions"
              option-:label="t('views.bookingsList.label')"
              option-value="value"
              :placeholder="t('bookings.allResources')"
              class="w-full"
              display="chip"
            />
          </div>

          <!-- Date From -->
          <div class="filter-field">
            <label class="filter-label">{{ t('bookings.dateFrom') }}</label>
            <input v-model="filterDateFrom" type="date" class="form-input" />
          </div>

          <!-- Date To -->
          <div class="filter-field">
            <label class="filter-label">{{ t('bookings.dateTo') }}</label>
            <input v-model="filterDateTo" type="date" class="form-input" />
          </div>
        </div>

        <!-- Filter footer -->
        <div class="filters-footer">
          <span class="results-count">
            <i class="pi pi-list" />
            {{ translateCount('common.bookingsCount', filteredBookings.length) }}
          </span>
          <button v-if="hasActiveFilters" class="btn-text-small" @click="resetFilters">
            <i class="pi pi-filter-slash mr-1" />
            {{ t('bookings.resetFilters') }}
          </button>
        </div>
      </div>

      <!-- ------ Loading --------------------------------------------------------------------------------------------------------------------------------------------------- -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <!-- ------ Empty State --------------------------------------------------------------------------------------------------------------------------------- -->
      <div v-else-if="filteredBookings.length === 0" class="empty-state">
        <div class="empty-icon"><i class="pi pi-inbox" /></div>
        <h3 v-if="hasActiveFilters" class="empty-title">{{ t('bookings.noResultsWithFilters') }}</h3>
        <h3 v-else class="empty-title">{{ t('bookings.noBookings') }}</h3>
        <p v-if="hasActiveFilters" class="empty-desc">{{ t('bookings.tryDifferentFilters') }}</p>
        <div class="empty-actions">
          <button v-if="hasActiveFilters" class="btn-secondary" @click="resetFilters">
            <i class="pi pi-filter-slash mr-1" />
            {{ t('bookings.resetFilters') }}
          </button>
          <router-link v-else :to="{ name: 'BookingWizard' }" class="btn-primary">
            <i class="pi pi-plus mr-1" />
            {{ t('bookings.new') }}
          </router-link>
        </div>
      </div>

      <!-- ------ Bookings Table ------------------------------------------------------------------------------------------------------------------------ -->
      <div v-else class="table-wrapper">
        <table class="bookings-table">
          <thead>
            <tr>
              <th class="th-status th-sortable" @click="toggleSort('status')">
                <span class="th-content">
                  {{ t('common.status') }}
                  <i :class="getSortIcon('status')" class="sort-icon" />
                </span>
              </th>
              <th class="th-title th-sortable" @click="toggleSort('title')">
                <span class="th-content">
                  {{ t('common.name') }}
                  <i :class="getSortIcon('title')" class="sort-icon" />
                </span>
              </th>
              <th class="th-datetime th-sortable" @click="toggleSort('datetime')">
                <span class="th-content">
                  {{ t('common.dateTime') }}
                  <i :class="getSortIcon('datetime')" class="sort-icon" />
                </span>
              </th>
              <th class="th-plant th-sortable" @click="toggleSort('plant')">
                <span class="th-content">
                  {{ t('bookings.plant') }}
                  <i :class="getSortIcon('plant')" class="sort-icon" />
                </span>
              </th>
              <th class="th-resources">{{ t('resources.title') }}</th>
              <th class="th-organizer th-sortable" @click="toggleSort('organizer')">
                <span class="th-content">
                  {{ t('bookings.organizer') }}
                  <i :class="getSortIcon('organizer')" class="sort-icon" />
                </span>
              </th>
              <th class="th-actions">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="booking in paginatedBookings"
              :key="booking.id"
              class="booking-row"
              @click="viewBooking(booking.id)"
            >
              <!-- Status -->
              <td class="td-status">
                <span class="status-chip" :style="getStatusStyle(booking.status)">
                  <i :class="`pi ${getStatusIcon(booking.status)}`" />
                  <span class="status-chip-label">{{ getStatusLabel(booking.status) }}</span>
                </span>
              </td>

              <!-- Title + Notes -->
              <td class="td-title">
                <span class="booking-name">{{ booking.title }}</span>
                <span v-if="booking.notes" class="booking-notes">{{ booking.notes }}</span>
              </td>

              <!-- Date/Time -->
              <td class="td-datetime">
                <template v-if="booking.resources[0]">
                  <span class="date-primary">{{ formatDateShort(booking.resources[0].startTime) }}</span>
                  <span class="date-secondary">{{ formatTimeRange(booking.resources[0].startTime, booking.resources[0].endTime) }}</span>
                </template>
                <span v-else class="text-muted">–</span>
              </td>

              <!-- Plant -->
              <td class="td-plant">
                <span class="plant-name">{{ getPlantName(booking.resources[0]?.plantId) }}</span>
              </td>

              <!-- Resources -->
              <td class="td-resources">
                <div class="resource-tags">
                  <span
                    v-for="resource in booking.resources.slice(0, 2)"
                    :key="resource.id"
                    class="resource-tag"
                  >
                    {{ getResourceName(resource.resourceId) }}
                  </span>
                  <span v-if="booking.resources.length > 2" class="resource-tag resource-tag-more">
                    +{{ booking.resources.length - 2 }}
                  </span>
                </div>
              </td>

              <!-- Organizer -->
              <td class="td-organizer">
                <div class="organizer-cell">
                  <span class="organizer-avatar">{{ getOrganizerInitials(booking.organizerId) }}</span>
                  <span class="organizer-name">{{ getOrganizerDisplayName(booking.organizerId) }}</span>
                </div>
              </td>

              <!-- Actions -->
              <td class="td-actions" @click.stop>
                <div class="action-btns">
                  <button class="action-btn action-btn-view" @click="viewBooking(booking.id)" :title="t('common.details')">
                    <i class="pi pi-eye" />
                  </button>
                  <button
                    v-if="booking.status === 'Draft'"
                    class="action-btn action-btn-continue"
                    @click="editBooking(booking.id)"
                    :title="t('bookings.continueDraft')"
                  >
                    <i class="pi pi-arrow-right" />
                  </button>
                  <button
                    class="action-btn action-btn-delete"
                    @click="confirmCancel(booking.id)"
                    :title="t('common.delete')"
                  >
                    <i class="pi pi-trash" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ------ Pagination ------------------------------------------------------------------------------------------------------------------------------------ -->
      <div v-if="!loading && totalPages > 1" class="pagination">
        <span class="pagination-info">
          {{ (currentPage - 1) * itemsPerPage + 1 }}—{{ Math.min(currentPage * itemsPerPage, filteredBookings.length) }}
          di {{ filteredBookings.length }}
        </span>
        <div class="pagination-btns">
          <button class="pagination-btn" :disabled="currentPage === 1" @click="currentPage--">
            <i class="pi pi-chevron-left" />
          </button>
          <span class="pagination-current">{{ currentPage }} / {{ totalPages }}</span>
          <button class="pagination-btn" :disabled="currentPage >= totalPages" @click="currentPage++">
            <i class="pi pi-chevron-right" />
          </button>
        </div>
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
import { useBookingsStore } from '@/stores/bookings.store'
import { useAuthStore } from '@/stores/auth.store'
import { useResourcesStore } from '@/stores/resources.store'
import { usePlantsStore } from '@/stores/plants.store'
import { useUsersStore } from '@/stores/users.store'
import type { Booking, CalendarQuery } from '@/types/booking'
import type { BookingStatus } from '@/types/enums'
import { BookingStatus as BookingStatusEnum } from '@/types/enums'

const { t } = useI18n()
const translateCount = (key: string, count: number) =>
  (t as unknown as (path: string, plural: number, options: { count: number }) => string)(key, count, { count })
const router = useRouter()
const confirm = useConfirm()
const bookingsStore = useBookingsStore()
const authStore = useAuthStore()
const resourcesStore = useResourcesStore()
const plantsStore = usePlantsStore()
const usersStore = useUsersStore()

// ------ Helpers per date default ---------------------------------------------------------------------------------------------------------------------------------------------
function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getDefaultDateFrom(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 6)
  return toDateInputValue(d)
}

function getDefaultDateTo(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 6)
  return toDateInputValue(d)
}

// ------ State ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const loading = ref(false)
const localBookings = ref<Booking[]>([])
const searchQuery = ref('')
const filterStatuses = ref<BookingStatus[]>([])
const filterPlantIds = ref<string[]>([])
const filterResourceIds = ref<string[]>([])
const filterDateFrom = ref(getDefaultDateFrom())
const filterDateTo = ref(getDefaultDateTo())
const currentPage = ref(1)
const itemsPerPage = 15

type SortColumn = 'status' | 'title' | 'datetime' | 'plant' | 'organizer'
type SortOrder = 'asc' | 'desc'
const sortColumn = ref<SortColumn>('datetime')
const sortOrder = ref<SortOrder>('desc')

// ------ Options ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const statusOptions = computed(() => [
  { label: t('bookings.status.draft'), value: BookingStatusEnum.Draft },
  { label: t('bookings.status.pendingApproval'), value: BookingStatusEnum.PendingApproval },
  { label: t('bookings.status.confirmed'), value: BookingStatusEnum.Confirmed },
  { label: t('bookings.status.inProgress'), value: BookingStatusEnum.InProgress },
  { label: t('bookings.status.completed'), value: BookingStatusEnum.Completed },
  { label: t('bookings.status.cancelled'), value: BookingStatusEnum.Cancelled },
  { label: t('bookings.status.rejected'), value: BookingStatusEnum.Rejected },
])

const plantOptions = computed(() =>
  plantsStore.activePlants.map((p) => ({ label: p.name, value: p.id }))
)

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

// ------ Filtered + Paginated ---------------------------------------------------------------------------------------------------------------------------------------------------------
const filteredBookings = computed(() => {
  let list = localBookings.value

  // Status (multi)
  if (filterStatuses.value.length > 0) {
    list = list.filter((b) => filterStatuses.value.includes(b.status))
  }

  // Plant (multi)
  if (filterPlantIds.value.length > 0) {
    list = list.filter((b) =>
      b.resources.some((r) => filterPlantIds.value.includes(r.plantId))
    )
  }

  // Resource (multi)
  if (filterResourceIds.value.length > 0) {
    list = list.filter((b) =>
      b.resources.some((r) => filterResourceIds.value.includes(r.resourceId))
    )
  }

  // Date from
  if (filterDateFrom.value) {
    const from = new Date(filterDateFrom.value)
    from.setHours(0, 0, 0, 0)
    list = list.filter((b) => {
      const start = b.resources[0]?.startTime
      return start && new Date(start) >= from
    })
  }

  // Date to
  if (filterDateTo.value) {
    const to = new Date(filterDateTo.value)
    to.setHours(23, 59, 59, 999)
    list = list.filter((b) => {
      const start = b.resources[0]?.startTime
      return start && new Date(start) <= to
    })
  }

  // Search text
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((b) =>
      b.title.toLowerCase().includes(q) ||
      getOrganizerDisplayName(b.organizerId).toLowerCase().includes(q) ||
      (b.notes?.toLowerCase().includes(q) ?? false)
    )
  }

  // Sort
  const col = sortColumn.value
  const mod = sortOrder.value === 'asc' ? 1 : -1

  list = [...list].sort((a, b) => {
    let valA: string | number = ''
    let valB: string | number = ''

    switch (col) {
      case 'status':
        valA = a.status
        valB = b.status
        break
      case 'title':
        valA = a.title.toLowerCase()
        valB = b.title.toLowerCase()
        break
      case 'datetime':
        valA = a.resources[0]?.startTime ? new Date(a.resources[0].startTime).getTime() : 0
        valB = b.resources[0]?.startTime ? new Date(b.resources[0].startTime).getTime() : 0
        break
      case 'plant':
        valA = getPlantName(a.resources[0]?.plantId).toLowerCase()
        valB = getPlantName(b.resources[0]?.plantId).toLowerCase()
        break
      case 'organizer':
        valA = getOrganizerDisplayName(a.organizerId).toLowerCase()
        valB = getOrganizerDisplayName(b.organizerId).toLowerCase()
        break
    }

    if (valA < valB) return -1 * mod
    if (valA > valB) return 1 * mod
    return 0
  })

  return list
})

const totalPages = computed(() => Math.ceil(filteredBookings.value.length / itemsPerPage))

const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredBookings.value.slice(start, start + itemsPerPage)
})

// Reset page when filters change
watch([searchQuery, filterStatuses, filterPlantIds, filterResourceIds, filterDateFrom, filterDateTo], () => {
  currentPage.value = 1
})

// ------ Helpers ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function getPlantName(plantId: string | undefined): string {
  if (!plantId) return '–'
  return plantsStore.plantById(plantId)?.name || '–'
}

function getResourceName(resourceId: string): string {
  return resourcesStore.resourceById(resourceId)?.name || '–'
}

function getOrganizerDisplayName(organizerId: string): string {
  if (!organizerId) return '–'

  // Lookup primario: utente del tenant (organizerId è un UUID).
  // fullName → email → fallback al valore originale.
  const user = usersStore.users.find((u) => u.id === organizerId)
  if (user) {
    if (user.fullName && user.fullName.trim()) return user.fullName.trim()
    if (user.email) return user.email
  }

  // Fallback per dati legacy in cui organizerId è un'email
  // (es. seed o import vecchi).
  if (organizerId.includes('@')) {
    const name = organizerId.split('@')[0]
    return name
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return organizerId
}

function getOrganizerInitials(organizerId: string): string {
  const name = getOrganizerDisplayName(organizerId)
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
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
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTimeRange(startStr: string, endStr: string): string {
  const fmt = (d: string) => new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  return `${fmt(startStr)} — ${fmt(endStr)}`
}

// ------ Actions ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function viewBooking(id: string) {
  router.push({ name: 'BookingDetail', params: { id } })
}

function editBooking(id: string) {
  router.push({ name: 'BookingWizard', query: { draftId: id } })
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

function resetFilters() {
  searchQuery.value = ''
  filterStatuses.value = []
  filterPlantIds.value = []
  filterResourceIds.value = []
  filterDateFrom.value = getDefaultDateFrom()
  filterDateTo.value = getDefaultDateTo()
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
      // Carica gli utenti per risolvere organizerId → nome (DRF: organizer
      // visualizzato come label leggibile, non come UUID).
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

function toggleSort(key: SortColumn) {
  if (sortColumn.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = key
    sortOrder.value = 'asc'
  }
}

function getSortIcon(key: string) {
  if (sortColumn.value !== key) return 'pi pi-sort-alt'
  return sortOrder.value === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down'
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
