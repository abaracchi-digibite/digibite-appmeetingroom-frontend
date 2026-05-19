<template>
  <div class="rv-root" :style="pageStyle" :data-status="statusTone" :data-mode="uiStore.isDarkMode ? 'dark' : 'light'">
    <div class="rv-bg-overlay" aria-hidden="true" />

    <div class="rv-layout">

      <!-- ── Header ─────────────────────────────────────────────── -->
      <header class="rv-header">
        <div class="rv-brand">
          <div class="rv-brand-mark">
            <img
              v-if="display?.tenantLogoUrl"
              :src="display.tenantLogoUrl"
              :alt="display?.tenantName || ''"
              class="rv-brand-logo"
            />
            <i v-else class="pi pi-building" />
          </div>
          <span class="rv-brand-name">{{ display?.tenantName }}</span>
        </div>
        <button
          class="rv-icon-btn"
          :title="uiStore.isDarkMode ? $t('nav.lightMode') : $t('nav.darkMode')"
          @click="handleToggleTheme()"
        >
          <i :class="uiStore.isDarkMode ? 'pi pi-sun' : 'pi pi-moon'" />
        </button>
      </header>

      <!-- ── Loading ─────────────────────────────────────────────── -->
      <main v-if="state === 'loading'" class="rv-state" aria-live="polite">
        <div class="rv-state-icon"><i class="pi pi-spin pi-spinner" /></div>
        <p class="rv-state-msg">{{ t('publicResource.loadingTitle') }}</p>
      </main>

      <!-- ── Locked ──────────────────────────────────────────────── -->
      <main v-else-if="state === 'locked'" class="rv-state" aria-live="polite">
        <div class="rv-state-icon"><i class="pi pi-lock" /></div>
        <h2 class="rv-state-title">{{ t('publicResource.lockedTitle') }}</h2>
        <p class="rv-state-msg">{{ t('publicResource.lockedMessage') }}</p>
        <form class="rv-pin-form" @submit.prevent="unlockWithPin">
          <input
            id="rv-pin"
            v-model="pin"
            class="rv-pin-input"
            type="password"
            inputmode="numeric"
            maxlength="8"
            autocomplete="one-time-code"
            :placeholder="t('publicResource.pinPlaceholder')"
          />
          <p v-if="pinError" class="rv-pin-error" role="alert">{{ pinError }}</p>
          <button type="submit" class="rv-pin-btn" :disabled="unlocking || !pin.trim()">
            <i :class="unlocking ? 'pi pi-spin pi-spinner' : 'pi pi-lock-open'" />
            {{ unlocking ? t('publicResource.unlocking') : t('publicResource.unlockButton') }}
          </button>
        </form>
      </main>

      <!-- ── Error ───────────────────────────────────────────────── -->
      <main v-else-if="state === 'error'" class="rv-state rv-state--error" aria-live="assertive">
        <div class="rv-state-icon"><i class="pi pi-times-circle" /></div>
        <h2 class="rv-state-title">{{ t('publicResource.errorTitle') }}</h2>
        <p class="rv-state-msg">{{ t('publicResource.errorMessage') }}</p>
      </main>

      <!-- ── Main content ─────────────────────────────────────────── -->
      <main v-else-if="display" class="rv-body">

        <!-- Left: clock + room identity -->
        <section class="rv-left">
          <div class="rv-clock" aria-live="polite">{{ formattedTime }}</div>
          <div class="rv-date">{{ formattedDate }}</div>
          <div class="rv-sep" />
          <div class="rv-room-name">{{ display.name }}</div>
          <div v-if="display.plantName" class="rv-plant-name">
            <i class="pi pi-map-marker" />
            {{ display.plantName }}
          </div>
        </section>

        <!-- Right: status card + schedule -->
        <section class="rv-right">

          <!-- Status card -->
          <div class="rv-status-card">
            <div class="rv-status-icon-wrap">
              <i :class="statusIcon" />
            </div>
            <div class="rv-status-label">{{ statusLabel }}</div>
            <div class="rv-status-sub">
              <template v-if="display.currentBooking">
                {{ t('publicResource.freeAtLabel') }}&nbsp;<strong>{{ formatSingleTime(display.currentBooking.endTime) }}</strong>
              </template>
              <template v-else-if="display.nextBooking">
                {{ t('publicResource.kioskNextBooking') }}&nbsp;<strong>{{ formatSingleTime(display.nextBooking.startTime) }}</strong>
              </template>
              <template v-else>
                {{ t('publicResource.kioskNoNextBooking') }}
              </template>
            </div>
          </div>

          <!-- Today's schedule -->
          <div class="rv-schedule" v-if="upcomingSlots.length">
            <div class="rv-schedule-hd">{{ t('publicResource.scheduleUpcoming') }}</div>
            <ul class="rv-slots" role="list">
              <li v-for="(slot, i) in upcomingSlots" :key="i" class="rv-slot">
                <span class="rv-slot-dot" />
                <span class="rv-slot-time">
                  {{ formatSingleTime(slot.startTime) }}&nbsp;–&nbsp;{{ formatSingleTime(slot.endTime) }}
                </span>
              </li>
            </ul>
          </div>

        </section>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { publicApi, type PublicResourceDisplay } from '@/api/public.api'
import { useUiStore } from '@/stores/ui.store'

type ViewState = 'loading' | 'locked' | 'ready' | 'error'

const REFRESH_MS = 60_000
const CLOCK_MS   = 1_000
const PIN_STORAGE_PREFIX = 'appmeetingroom.publicResource.pin:'

const { t, locale } = useI18n()
const route         = useRoute()
const uiStore       = useUiStore()

const state     = ref<ViewState>('loading')
const display   = ref<PublicResourceDisplay | null>(null)
const now       = ref(new Date())
const pin       = ref('')
const pinError  = ref('')
const unlocking = ref(false)

let refreshHandle: ReturnType<typeof setInterval> | null = null
let clockHandle:   ReturnType<typeof setInterval> | null = null

const resourceId    = computed(() => route.params.id as string)
const pinStorageKey = computed(() => `${PIN_STORAGE_PREFIX}${resourceId.value}`)

// ── Status helpers ──────────────────────────────────────────────────

const statusTone = computed(() => {
  switch (display.value?.displayStatus) {
    case 'Maintenance': return 'maintenance'
    case 'Occupied':    return 'occupied'
    default:            return 'available'
  }
})

const statusLabel = computed(() => {
  switch (display.value?.displayStatus) {
    case 'Maintenance': return t('publicResource.statusMaintenance')
    case 'Occupied':    return t('publicResource.statusOccupied')
    default:            return t('publicResource.statusAvailable')
  }
})

const statusIcon = computed(() => {
  switch (display.value?.displayStatus) {
    case 'Maintenance': return 'pi pi-wrench'
    case 'Occupied':    return 'pi pi-lock'
    default:            return 'pi pi-check-circle'
  }
})

// ── Formatted time / date ───────────────────────────────────────────

const formattedTime = computed(() =>
  formatDate(now.value, { hour: '2-digit', minute: '2-digit' })
)

const formattedDate = computed(() =>
  formatDate(now.value, { weekday: 'long', day: 'numeric', month: 'long' })
)

// ── Upcoming schedule ───────────────────────────────────────────────

const upcomingSlots = computed(() => {
  if (!display.value?.todaySchedule?.length) return []
  const nowMs = now.value.getTime()
  return display.value.todaySchedule
    .filter(b => new Date(b.endTime).getTime() > nowMs)
    .slice(0, 5)
})

// ── Page style (tenant branding via CSS vars) ───────────────────────

const pageStyle = computed(() => {
  const primary   = display.value?.tenantPrimaryColor   || '#0f766e'
  const secondary = display.value?.tenantSecondaryColor || '#164e63'
  const isDark    = uiStore.isDarkMode
  return {
    '--brand-primary':   primary,
    '--brand-secondary': secondary,
    '--page-overlay':    isDark ? 'rgba(15,23,42,0.68)'        : 'rgba(255,255,255,0.42)',
    '--surface-strong':  isDark ? 'rgba(15,23,42,0.82)'        : 'rgba(255,255,255,0.9)',
    '--surface-soft':    isDark ? 'rgba(30,41,59,0.68)'        : 'rgba(255,255,255,0.7)',
    '--surface-border':  isDark ? 'rgba(148,163,184,0.22)'     : 'rgba(148,163,184,0.25)',
    '--text-main':       isDark ? '#f8fafc'                    : '#0f172a',
    '--text-soft':       isDark ? 'rgba(226,232,240,0.82)'     : 'rgba(51,65,85,0.82)',
    '--text-muted':      isDark ? 'rgba(203,213,225,0.55)'     : 'rgba(71,85,105,0.65)',
    '--shadow-strong':   isDark ? '0 24px 80px rgba(2,8,23,0.36)' : '0 22px 60px rgba(15,23,42,0.14)',
  }
})

// ── Format helpers ──────────────────────────────────────────────────

function formatDate(value: Date | string, options: Intl.DateTimeFormatOptions): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(locale.value, {
    ...options,
    timeZone: display.value?.timeZone ?? undefined,
  }).format(date)
}

function formatSingleTime(value: string): string {
  return formatDate(value, { hour: '2-digit', minute: '2-digit' })
}

// ── PIN storage ─────────────────────────────────────────────────────

function getStoredPin(): string {
  if (typeof window === 'undefined') return ''
  return window.sessionStorage.getItem(pinStorageKey.value) || ''
}
function storePin(value: string): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(pinStorageKey.value, value)
}
function clearStoredPin(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(pinStorageKey.value)
}

// ── Data loading ────────────────────────────────────────────────────

async function loadDisplay(overridePin?: string): Promise<void> {
  const candidatePin = (overridePin ?? getStoredPin()).trim()
  try {
    display.value = await publicApi.getResourceDisplay(resourceId.value, candidatePin || undefined)

    // Client-side fallback: detect current booking from schedule if server missed it
    if (!display.value.currentBooking && display.value.todaySchedule?.length) {
      function parseBookingTime(value: string | null): Date {
        if (!value) return new Date(NaN)
        const parsed = new Date(value)
        if (!isNaN(parsed.getTime())) return parsed
        const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2}):(\d{2})$/)
        if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]), Number(m[6]))
        return new Date(value.replace(' ', 'T'))
      }
      try {
        const nowLocal = new Date()
        const current = display.value.todaySchedule.find(b => {
          const s = parseBookingTime(b.startTime)
          const e = parseBookingTime(b.endTime)
          return !isNaN(s.getTime()) && !isNaN(e.getTime()) && s <= nowLocal && nowLocal < e
        })
        if (current) {
          display.value.currentBooking = current
          display.value.displayStatus  = 'Occupied'
        }
      } catch { /* ignore */ }
    }

    if (candidatePin) { pin.value = candidatePin; storePin(candidatePin) }
    pinError.value = ''
    state.value    = 'ready'
  } catch (error) {
    display.value = null
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      clearStoredPin()
      state.value    = 'locked'
      pinError.value = candidatePin
        ? t('publicResource.pinInvalid')
        : t('publicResource.pinRequired')
      return
    }
    state.value = 'error'
  }
}

async function unlockWithPin(): Promise<void> {
  unlocking.value = true
  try   { await loadDisplay(pin.value) }
  finally { unlocking.value = false }
}

// ── Theme toggle ────────────────────────────────────────────────────

function handleToggleTheme(): void {
  uiStore.toggleDarkMode()
  try {
    const enabled = (uiStore.isDarkMode as unknown as boolean) || !!uiStore.darkMode
    if (typeof document !== 'undefined') {
      if (enabled) document.documentElement.classList.add('dark')
      else         document.documentElement.classList.remove('dark')
    }
  } catch { /* ignore */ }
}

// ── Lifecycle ───────────────────────────────────────────────────────

onMounted(async () => {
  if (typeof window !== 'undefined') pin.value = getStoredPin()
  await loadDisplay()
  clockHandle   = setInterval(() => { now.value = new Date() }, CLOCK_MS)
  refreshHandle = setInterval(() => {
    // Non fare polling se siamo in attesa del PIN: evita 403 ripetuti nei log.
    if (state.value === 'locked') return
    loadDisplay().catch(e => console.error('Failed to refresh public resource display:', e))
  }, REFRESH_MS)
})

onBeforeUnmount(() => {
  if (clockHandle)   clearInterval(clockHandle)
  if (refreshHandle) clearInterval(refreshHandle)
})
</script>

<style scoped src="./PublicResourceView.css"></style>
