<template>
  <MainLayout>
    <div class="dashboard">

      <!-- ------ Loading State ------------------------------------------------------------------------------------------------------------------------------------------------ -->
      <div v-if="isLoading" class="loading-overlay" role="status" aria-live="polite">
        <div class="spinner" aria-hidden="true" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <!-- ------ Error State ------------------------------------------------------------------------------------------------------------------------------------------------------ -->
      <div v-if="loadError" class="error-banner" role="alert">
        <i class="pi pi-exclamation-triangle" aria-hidden="true" />
        <span>{{ loadError }}</span>
        <button class="retry-btn" @click="loadData">
          <i class="pi pi-refresh" aria-hidden="true" /> {{ t('common.retry') }}
        </button>
      </div>

      <template v-if="!isLoading">
        <!-- ------ KPI Cards ------------------------------------------------------------------------------------------------------------------------------------------------ -->
        <div class="kpi-grid" role="list" :aria-label="t('dashboard.kpiTitle')">
          <div
            v-for="kpi in kpiCards"
            :key="kpi.key"
            class="kpi-card"
            :class="kpi.color"
            role="listitem"
          >
            <div class="kpi-left">
              <div class="kpi-icon" :aria-label="kpi.label">
                <i :class="`pi ${kpi.icon}`" aria-hidden="true" />
              </div>
            </div>
            <div class="kpi-right">
              <p class="kpi-label">{{ kpi.label }}</p>
              <p class="kpi-value" :aria-label="`${kpi.label}: ${kpi.value}`">{{ kpi.value }}</p>
              <p class="kpi-delta" :class="kpi.deltaType">
                <i :class="`pi ${kpi.deltaIcon}`" aria-hidden="true" />
                {{ kpi.delta }}
              </p>
            </div>
          </div>
        </div>

        <!-- ------ Charts + Today ------------------------------------------------------------------------------------------------------------------------------ -->
        <div class="mid-grid">

          <!-- Monthly Trend Chart -->
          <div class="dash-card chart-card">
            <div class="dash-card-header">
              <div>
                <h2 class="dash-card-title">{{ t('dashboard.monthlyTrend') }}</h2>
                <p class="dash-card-sub">{{ t('dashboard.bookingsOverTime') }}</p>
              </div>
              <div class="period-tabs" role="tablist" :aria-label="t('dashboard.chartPeriod')">
                <button
                  v-for="p in periods"
                  :key="p.key"
                  class="period-tab"
                  :class="{ active: selectedPeriod === p.key }"
                  role="tab"
                  :aria-selected="selectedPeriod === p.key"
                  :aria-controls="`chart-${p.key}`"
                  @click="onPeriodChange(p.key)"
                >{{ p.label }}</button>
              </div>
            </div>
            <div class="chart-wrap" role="img" :aria-label="t('dashboard.chartLabel', { period: selectedPeriod })">
              <div v-if="chartLoading" class="chart-loading" aria-live="polite">
                <div class="spinner-sm" />
              </div>
              <PrimeChart
                v-else
                type="line"
                :data="trendData"
                :options="trendOptions"
              />
            </div>
          </div>

          <!-- Today's Schedule -->
          <div class="dash-card today-card">
            <div class="dash-card-header">
              <div>
                <h2 class="dash-card-title">{{ t('dashboard.todaySchedule') }}</h2>
                <p class="dash-card-sub">{{ t('dashboard.nextBookings') }}</p>
              </div>
              <span class="today-badge" :aria-label="t('dashboard.todayBookings')">
                <i class="pi pi-sun" aria-hidden="true" style="margin-right:4px;font-size:.7rem" />
                {{ t('calendar.today') }}
              </span>
            </div>
            <div class="today-list" role="list" :aria-label="t('dashboard.todaySchedule')">
              <div
                v-for="item in todaySchedule"
                :key="item.id"
                class="today-item"
                role="listitem"
              >
                <div class="today-time" :aria-label="`${t('common.timeLabel')}: ${item.start} - ${item.end}`">
                  <span class="t-start">{{ item.start }}</span>
                  <span class="t-end">{{ item.end }}</span>
                </div>
                <div class="today-bar" :style="{ background: item.color }" aria-hidden="true" />
                <div class="today-info">
                  <p class="t-title">{{ item.title }}</p>
                  <p class="t-room">
                    <i class="pi pi-map-marker" aria-hidden="true" />{{ item.room }}
                  </p>
                </div>
                <div class="today-status-wrap" :title="item.statusLabel" :aria-label="item.statusLabel">
                  <i :class="`pi ${item.statusIcon}`" :style="{ color: item.statusColor }" aria-hidden="true" />
                </div>
              </div>
              <div v-if="todaySchedule.length === 0 && !isLoading" class="today-empty" role="status">
                <i class="pi pi-check-circle" aria-hidden="true" />
                <span>{{ t('dashboard.noBookingsToday') }}</span>
              </div>
            </div>
            <router-link :to="{ name: 'Calendar' }" class="today-more" :aria-label="t('dashboard.viewAllBookings')">
              {{ t('common.viewAll') }} <i class="pi pi-arrow-right" aria-hidden="true" />
            </router-link>
          </div>
        </div>

        <!-- ------ Upcoming Bookings (timeline) ----------------------------------------------------------------------------------------------------------- -->
        <div class="dash-card upcoming-card">
          <div class="dash-card-header">
            <div>
              <h2 class="dash-card-title">{{ t('dashboard.upcomingBookings') }}</h2>
            </div>
            <div class="period-tabs" role="tablist" :aria-label="t('dashboard.upcomingPeriod')">
              <button
                v-for="p in upcomingPeriods"
                :key="p.key"
                class="period-tab"
                :class="{ active: upcomingPeriod === p.key }"
                role="tab"
                :aria-selected="upcomingPeriod === p.key"
                @click="onUpcomingPeriodChange(p.key)"
              >{{ p.label }}</button>
            </div>
          </div>

          <div v-if="upcomingLoading" class="chart-loading" aria-live="polite">
            <div class="spinner-sm" />
          </div>

          <div v-else-if="upcomingSchedule.length === 0" class="today-empty" role="status">
            <i class="pi pi-calendar-times" aria-hidden="true" />
            <span>{{ t('dashboard.noUpcomingBookings') }}</span>
          </div>

          <div v-else class="upcoming-timeline">
            <div
              v-for="group in upcomingSchedule"
              :key="group.dayIso"
              class="upcoming-day"
            >
              <div class="upcoming-day-header">
                <i class="pi pi-calendar" aria-hidden="true" />
                <span>{{ group.dayLabel }}</span>
                <span class="upcoming-day-count">{{ group.items.length }}</span>
              </div>
              <div class="upcoming-day-items" role="list">
                <router-link
                  v-for="item in group.items"
                  :key="item.id"
                  :to="{ name: 'BookingDetail', params: { id: item.bookingId } }"
                  class="upcoming-item"
                  role="listitem"
                  :aria-label="t('dashboard.openBookingDetail', { title: item.title })"
                >
                  <div class="upcoming-time">
                    <span class="t-start">{{ item.start }}</span>
                    <span class="t-end">{{ item.end }}</span>
                  </div>
                  <div class="upcoming-bar" :style="{ background: item.statusColor }" aria-hidden="true" />
                  <div class="upcoming-info">
                    <p class="t-title">{{ item.title }}</p>
                    <p class="t-room">
                      <i class="pi pi-map-marker" aria-hidden="true" />{{ item.room }}
                    </p>
                  </div>
                  <span class="b-status" :class="item.statusClass">
                    {{ item.statusLabel }}
                  </span>
                  <i class="pi pi-arrow-right upcoming-arrow" aria-hidden="true" />
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- ------ Bottom Row ------------------------------------------------------------------------------------------------------------------------------------------------ -->
        <div class="bottom-grid">

          <!-- Top Resources -->
          <div class="dash-card resources-card">
            <div class="dash-card-header">
              <h2 class="dash-card-title">{{ t('dashboard.topResources') }}</h2>
            </div>
            <div class="resources-list" role="list" :aria-label="t('dashboard.topResources')">
              <div v-for="(res, index) in topResourcesData" :key="res.id" class="resource-row" role="listitem">
                <div class="res-rank" :aria-label="t('dashboard.rank', { n: index + 1 })">{{ index + 1 }}</div>
                <div class="res-info">
                  <span class="res-name">{{ res.name }}</span>
                  <span class="res-bookings">{{ res.bookings }} {{ t('bookings.title').toLowerCase() }}</span>
                </div>
                <div class="res-bar-wrap">
                  <div class="res-bar" role="progressbar" :aria-valuenow="res.utilization" aria-valuemin="0" aria-valuemax="100" :aria-label="`${t('dashboard.utilization')} ${res.name}: ${res.utilization}%`">
                    <div
                      class="res-bar-fill"
                      :style="{ width: res.utilization + '%' }"
                      :class="getBarClass(res.utilization)"
                    />
                  </div>
                  <span class="res-pct">{{ res.utilization }}%</span>
                </div>
              </div>
              <div v-if="topResourcesData.length === 0" class="today-empty">
                <i class="pi pi-box" aria-hidden="true" />
                <span>{{ t('dashboard.noResources') }}</span>
              </div>
            </div>
          </div>

          <!-- Recent Bookings -->
          <div class="dash-card bookings-card">
            <div class="dash-card-header">
              <h2 class="dash-card-title">{{ t('dashboard.recentBookings') }}</h2>
              <router-link :to="{ name: 'BookingsList' }" class="view-all-link" :aria-label="t('dashboard.viewAllBookings')">
                {{ t('common.viewAll') }} <i class="pi pi-arrow-right" aria-hidden="true" />
              </router-link>
            </div>
            <div class="bookings-list" role="list" :aria-label="t('dashboard.recentBookings')">
              <div v-for="booking in recentBookingsData" :key="booking.id" class="booking-row" role="listitem">
                <div class="booking-status-icon" :class="`status-icon-${booking.status.toLowerCase()}`" :aria-label="`${t('bookings.statusLabel')}: ${getStatusLabel(booking.status)}`">
                  <i :class="`pi ${getStatusIcon(booking.status)}`" aria-hidden="true" />
                </div>
                <div class="booking-info">
                  <p class="b-title">{{ booking.title }}</p>
                  <p class="b-meta">{{ booking.resourceName }} - {{ formatDate(booking.createdAt) }}</p>
                </div>
                <div class="booking-right">
                  <span class="b-status" :class="`status-${booking.status.toLowerCase()}`">
                    {{ getStatusLabel(booking.status) }}
                  </span>
                  <router-link
                    :to="{ name: 'BookingDetail', params: { id: booking.id } }"
                    class="b-view"
                    :aria-label="t('dashboard.openBookingDetail', { title: booking.title })"
                  >
                    <i class="pi pi-eye" aria-hidden="true" />
                  </router-link>
                </div>
              </div>
              <div v-if="recentBookingsData.length === 0" class="today-empty">
                <i class="pi pi-calendar-times" aria-hidden="true" />
                <span>{{ t('dashboard.noRecentBookings') }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import PrimeChart from 'primevue/chart'
import MainLayout from '@/layouts/MainLayout.vue'
import { useUiStore } from '@/stores/ui.store'
import { useBookingsStore } from '@/stores/bookings.store'
import { useResourcesStore } from '@/stores/resources.store'
import { bookingsApi } from '@/api'
import { BookingStatus, ResourceStatus } from '@/types/enums'
import type { Booking } from '@/types/booking'
import type { Resource } from '@/types/resource'

const { t, locale } = useI18n()
const uiStore = useUiStore()
const bookingsStore = useBookingsStore()
const resourcesStore = useResourcesStore()

// ------ State ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const isLoading = ref(true)
const chartLoading = ref(false)
const loadError = ref<string | null>(null)

const myBookings = ref<Booking[]>([])
const todayBookings = ref<Booking[]>([])
const periodBookings = ref<Booking[]>([])
const upcomingBookings = ref<Booking[]>([])
const upcomingLoading = ref(false)
const allResources = ref<Resource[]>([])

// ------ Computed ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const isDarkMode = computed(() => uiStore.isDarkMode)

// ------ Periods ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const selectedPeriod = ref('30d')
const periods = computed(() => [
  { key: '7d', label: t('dashboard.period7d') },
  { key: '30d', label: t('dashboard.period30d') },
  { key: '90d', label: t('dashboard.period90d') },
])

// Periodi della sezione "Prossime prenotazioni"
const upcomingPeriod = ref('14d')
const upcomingPeriods = computed(() => [
  { key: '7d', label: t('dashboard.period7d') },
  { key: '14d', label: t('dashboard.period14d') },
  { key: '30d', label: t('dashboard.period30d') },
])
function upcomingDays(key: string): number {
  return key === '7d' ? 7 : key === '14d' ? 14 : 30
}

// ------ Helpers ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function periodDays(key: string): number {
  return key === '7d' ? 7 : key === '30d' ? 30 : 90
}

function isoDateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function tomorrowIso(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function isoDateInDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDayHeader(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(locale.value, { weekday: 'short', day: '2-digit', month: 'short' })
}

function getResourceName(resourceId: string): string {
  return allResources.value.find(r => r.id === resourceId)?.name ?? resourceId.substring(0, 8)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
}

// ------ Status helpers ---------------------------------------------------------------------------------------------------------------------------------------------------------------------
function getStatusLabel(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    [BookingStatus.Confirmed]: t('bookings.status.confirmed'),
    [BookingStatus.InProgress]: t('bookings.status.inProgress'),
    [BookingStatus.PendingApproval]: t('bookings.status.pendingApproval'),
    [BookingStatus.Draft]: t('bookings.status.draft'),
    [BookingStatus.Cancelled]: t('bookings.status.cancelled'),
    [BookingStatus.Completed]: t('bookings.status.completed'),
    [BookingStatus.Rejected]: t('bookings.status.rejected'),
  }
  return map[status] ?? status
}

function getStatusIcon(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    [BookingStatus.Confirmed]: 'pi-check-circle',
    [BookingStatus.InProgress]: 'pi-play-circle',
    [BookingStatus.PendingApproval]: 'pi-clock',
    [BookingStatus.Draft]: 'pi-file-edit',
    [BookingStatus.Cancelled]: 'pi-times-circle',
    [BookingStatus.Completed]: 'pi-check-square',
    [BookingStatus.Rejected]: 'pi-ban',
  }
  return map[status] ?? 'pi-circle'
}

function getStatusColorHex(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    [BookingStatus.Confirmed]: '#0D9488',   // teal (accessible)
    [BookingStatus.InProgress]: '#2563EB',  // blue
    [BookingStatus.PendingApproval]: '#D97706', // amber
    [BookingStatus.Draft]: '#6B7280',       // grey
    [BookingStatus.Cancelled]: '#DC2626',   // red
    [BookingStatus.Completed]: '#7C3AED',   // violet
    [BookingStatus.Rejected]: '#DC2626',    // red
  }
  return map[status] ?? '#6B7280'
}

// ------ KPI Cards ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const kpiCards = computed(() => {
  const totalInPeriod = periodBookings.value.filter(b => b.status !== BookingStatus.Draft).length
  const activeRes = allResources.value.filter(r => r.status === ResourceStatus.Available).length

  const todayCount = todayBookings.value.filter(b => b.status !== BookingStatus.Draft).length

  // Next upcoming booking today
  const now = new Date()
  const nextToday = todayBookings.value
    .flatMap(b => b.resources.map(r => ({ ...r, title: b.title })))
    .filter(r => new Date(r.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]

  return [
    {
      key: 'total',
      color: 'violet',
      icon: 'pi-bookmark',
      label: t('common.lastNDays', { days: periodDays(selectedPeriod.value) }),
      value: String(totalInPeriod),
      delta: ' ',
      deltaType: ' ',
      deltaIcon: ' ',
    },
    {
      key: 'resources',
      color: 'teal',
      icon: 'pi-box',
      label: t('dashboard.activeResources'),
      value: String(activeRes),
      delta: ' ',
      deltaType: ' ',
      deltaIcon: ' ',
    },
    {
      key: 'today',
      color: 'amber',
      icon: 'pi-calendar-clock',
      label: t('dashboard.todayBookings'),
      value: String(todayCount),
      delta: nextToday ? `${t('dashboard.nextAt')}: ${formatTime(nextToday.startTime)}` : t('dashboard.noNext'),
      deltaType: todayCount > 0 ? 'positive' : 'neutral',
      deltaIcon: 'pi-clock',
    },
  ]
})

// ------ Today's Schedule ------------------------------------------------------------------------------------------------------------------------------------------------------------------
const todaySchedule = computed(() => {
  return todayBookings.value.filter(b => b.status !== BookingStatus.Draft)
    .flatMap(b =>
      b.resources.map(r => ({
        id: `${b.id}-${r.resourceId}`,
        start: formatTime(r.startTime),
        end: formatTime(r.endTime),
        title: b.title,
        room: getResourceName(r.resourceId),
        color: getStatusColorHex(b.status),
        statusClass: `status-${b.status.toLowerCase()}`,
        statusLabel: getStatusLabel(b.status),
        statusIcon: getStatusIcon(b.status),
        statusColor: getStatusColorHex(b.status),
        startTime: r.startTime,
      }))
    )
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5)
})

// ------ Upcoming Schedule ----------------------------------------------------------------------------------------------------------------------------------------------------
type UpcomingItem = {
  id: string
  start: string
  end: string
  title: string
  room: string
  bookingId: string
  status: BookingStatus
  statusLabel: string
  statusIcon: string
  statusColor: string
  statusClass: string
  startTime: string
}

const upcomingSchedule = computed<{ dayIso: string; dayLabel: string; items: UpcomingItem[] }[]>(() => {
  const groups = new Map<string, UpcomingItem[]>()

  for (const b of upcomingBookings.value) {
    if (b.status === BookingStatus.Draft) continue
    for (const r of b.resources) {
      const dayIso = r.startTime.split('T')[0]
      const item: UpcomingItem = {
        id: `${b.id}-${r.resourceId}-${r.startTime}`,
        start: formatTime(r.startTime),
        end: formatTime(r.endTime),
        title: b.title,
        room: getResourceName(r.resourceId),
        bookingId: b.id,
        status: b.status,
        statusLabel: getStatusLabel(b.status),
        statusIcon: getStatusIcon(b.status),
        statusColor: getStatusColorHex(b.status),
        statusClass: `status-${b.status.toLowerCase()}`,
        startTime: r.startTime,
      }
      const arr = groups.get(dayIso) ?? []
      arr.push(item)
      groups.set(dayIso, arr)
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([dayIso, items]) => ({
      dayIso,
      dayLabel: formatDayHeader(dayIso),
      items: items.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    }))
})

// ------ Top Resources ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const topResourcesData = computed(() => {
  const countMap = new Map<string, number>()
  // Exclude bookings in Draft status from the top-resources calculation
  periodBookings.value
    .filter(b => b.status !== BookingStatus.Draft)
    .forEach(b =>
      b.resources.forEach(r => {
        countMap.set(r.resourceId, (countMap.get(r.resourceId) ?? 0) + 1)
      })
    )

  const totalBookings = periodBookings.value.length || 1
  return Array.from(countMap.entries())
    .map(([resourceId, count]) => ({
      id: resourceId,
      name: getResourceName(resourceId),
      bookings: count,
      utilization: Math.min(100, Math.round((count / totalBookings) * 100)),
    }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5)
})

// ------ Recent Bookings ---------------------------------------------------------------------------------------------------------------------------------------------------------------------
const recentBookingsData = computed(() => {
  return [...myBookings.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(b => b.status !== BookingStatus.Draft)
    .slice(0, 6)
    .map(b => ({
      id: b.id,
      title: b.title,
      resourceName: b.resources.length > 0 ? getResourceName(b.resources[0].resourceId) : '–',
      createdAt: b.createdAt,
      status: b.status,
    }))
})

// ------ Bar classes (shape + color, not only color) ---------------------------------------------------------------------------------
function getBarClass(pct: number): string {
  if (pct >= 75) return 'bar-high'
  if (pct >= 45) return 'bar-mid'
  return 'bar-low'
}

// ------ Chart ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const gridColor = computed(() =>
  isDarkMode.value ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
)
const labelColor = computed(() =>
  isDarkMode.value ? '#94a3b8' : '#64748b'
)

const trendData = computed(() => {
  const days = periodDays(selectedPeriod.value)

  // Group bookings by date
  const dateMap = new Map<string, { total: number; confirmed: number }>()

  // Build date buckets
  if (days <= 7) {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      dateMap.set(key, { total: 0, confirmed: 0 })
    }
  } else if (days <= 30) {
    // Weekly buckets
    const weekCount = Math.ceil(days / 7)
    for (let i = weekCount - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i * 7)
      const key = `W${d.toLocaleDateString(locale.value, { day: '2-digit', month: 'short' })}`
      dateMap.set(key, { total: 0, confirmed: 0 })
    }
  } else {
    // Monthly buckets
    for (let i = 2; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = d.toLocaleDateString(locale.value, { month: 'short', year: 'numeric' })
      dateMap.set(key, { total: 0, confirmed: 0 })
    }
  }

  // Fill with real data
  periodBookings.value.forEach(b => {
    const ref = b.resources[0]?.startTime
    if (!ref) return
    const d = new Date(ref)
    let key = ''

    if (days <= 7) {
      key = d.toISOString().split('T')[0]
    } else if (days <= 30) {
      // find nearest week bucket
      const arr = Array.from(dateMap.keys())
      key = arr[arr.length - 1] // fallback
      for (const k of arr) {
        if (k.includes(d.toLocaleDateString(locale.value, { day: '2-digit', month: 'short' }))) {
          key = k; break
        }
      }
      // approximate: find the week bucket
      const weekIndex = Math.floor((new Date().getTime() - d.getTime()) / (7 * 86400000))
      const keys = Array.from(dateMap.keys())
      const idx = keys.length - 1 - weekIndex
      if (idx >= 0 && idx < keys.length) key = keys[idx]
    } else {
      key = d.toLocaleDateString(locale.value, { month: 'short', year: 'numeric' })
    }

    const bucket = dateMap.get(key)
    if (bucket) {
      bucket.total++
      if (b.status === BookingStatus.Confirmed || b.status === BookingStatus.Completed || b.status === BookingStatus.InProgress) {
        bucket.confirmed++
      }
    }
  })

  const labels = Array.from(dateMap.keys())
  const totalData = Array.from(dateMap.values()).map(v => v.total)
  const confirmedData = Array.from(dateMap.values()).map(v => v.confirmed)

  return {
    labels,
    datasets: [
      {
        label: t('dashboard.totalBookings'),
        data: totalData,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79,70,229,0.1)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: isDarkMode.value ? '#1e293b' : '#ffffff',
        pointBorderWidth: 2,
        // Accessible: dashed line for second dataset
      },
      {
        label: t('bookings.status.confirmed'),
        data: confirmedData,
        borderColor: '#0D9488',
        backgroundColor: 'rgba(13,148,136,0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointStyle: 'rectRot',
        pointBackgroundColor: '#0D9488',
        pointBorderColor: isDarkMode.value ? '#1e293b' : '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  }
})

const trendOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' as const },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        color: labelColor.value,
        font: { size: 12, weight: '600' as const },
        boxWidth: 16,
        boxHeight: 10,
        borderRadius: 3,
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: isDarkMode.value ? '#1e293b' : '#ffffff',
      titleColor: isDarkMode.value ? '#f1f5f9' : '#0f172a',
      bodyColor: isDarkMode.value ? '#cbd5e1' : '#475569',
      borderColor: isDarkMode.value ? '#334155' : '#e2e8f0',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 10,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: gridColor.value },
      ticks: { color: labelColor.value, font: { size: 11 }, stepSize: 1 },
      border: { display: false },
    },
    x: {
      grid: { display: false },
      ticks: { color: labelColor.value, font: { size: 11 } },
      border: { display: false },
    },
  },
}))

// ------ Data loading ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
async function loadPeriodData(period: string) {
  chartLoading.value = true
  try {
    const days = periodDays(period)
    const [fetched] = await Promise.all([
      bookingsStore.fetchCalendarBookings({
        startDate: isoDateOffset(days),
        endDate: tomorrowIso(),
      }),
    ])
    periodBookings.value = fetched ?? []
  } catch {
    // silently ignore chart error - main error handled in loadData
  } finally {
    chartLoading.value = false
  }
}

async function onPeriodChange(period: string) {
  selectedPeriod.value = period
  await loadPeriodData(period)
}

async function loadUpcomingData(period: string) {
  upcomingLoading.value = true
  try {
    const fetched = await bookingsApi.getCalendar({
      startDate: tomorrowIso(),
      endDate: isoDateInDays(upcomingDays(period) + 1),
    })
    upcomingBookings.value = fetched ?? []
  } catch {
    // soft-fail: la sezione mostra empty state
    upcomingBookings.value = []
  } finally {
    upcomingLoading.value = false
  }
}

async function onUpcomingPeriodChange(period: string) {
  upcomingPeriod.value = period
  await loadUpcomingData(period)
}

async function loadData() {
  isLoading.value = true
  loadError.value = null
  try {
    const today = todayIso()
    const tomorrow = tomorrowIso()

    // Fetch in parallel; fetchAllResources returns void (updates store internally)
    // Use separate calls: fetchMyBookings for user bookings, fetchCalendarBookings for today
    const [myB, todayB] = await Promise.all([
      bookingsStore.fetchMyBookings(),
      bookingsApi.getCalendar({ startDate: today, endDate: tomorrow }),
      resourcesStore.fetchAllResources(),
    ])

    myBookings.value = myB ?? []
    todayBookings.value = todayB ?? []
    allResources.value = resourcesStore.resources

    // Load period data for chart (30d default) e prossime prenotazioni (14d default)
    await Promise.all([
      loadPeriodData(selectedPeriod.value),
      loadUpcomingData(upcomingPeriod.value),
    ])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : t('dashboard.loadError')
    loadError.value = msg
    } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped src="./DashboardView.css"></style>
