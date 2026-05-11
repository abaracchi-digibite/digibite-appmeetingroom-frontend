<template>
  <div class="tablet-page" :style="pageStyle" :data-mode="uiStore.isDarkMode ? 'dark' : 'light'">
    <div class="page-glow" aria-hidden="true" />

    <div class="tablet-shell">
      <header class="tablet-header">
        <div class="brand-block">
          <div class="brand-mark">
            <img
                v-if="display?.tenantLogoUrl"
                :src="display.tenantLogoUrl"
                :alt="display?.tenantName || display?.plantName || 'Tenant'"
                class="brand-logo"
            />
            <i v-else class="pi pi-building" />
          </div>

            <div class="brand-copy">
              <span class="brand-eyebrow">{{ display?.tenantName || 'Tenant' }}</span>
              <!-- <h1 class="brand-title">{{ display?.plantName || display?.name || 'Resource' }}</h1> -->
            </div>
        </div>

        <div class="clock-panel" aria-live="polite">
          <div class="display-controls" :aria-label="t('publicResource.displayModeLabel')">
            <button
                class="icon-btn"
                :title="uiStore.isDarkMode ? $t('nav.lightMode') : $t('nav.darkMode')"
                @click="handleToggleTheme()"
            >
              <i :class="uiStore.isDarkMode ? 'pi pi-sun' : 'pi pi-moon'" />
            </button>
          </div>
          <span class="clock-time">{{ formattedTime }}</span>
        </div>
      </header>

      <main v-if="state === 'loading'" class="state-panel" aria-live="polite">
        <div class="state-icon">
          <i class="pi pi-spin pi-spinner" />
        </div>
        <h2>{{ t('publicResource.loadingTitle') }}</h2>
        <p>{{ t('publicResource.loadingMessage') }}</p>
      </main>

      <main v-else-if="state === 'locked'" class="state-panel state-panel-locked" aria-live="polite">
        <div class="state-icon">
          <i class="pi pi-shield" />
        </div>
        <h2>{{ t('publicResource.lockedTitle') }}</h2>
        <p>{{ t('publicResource.lockedMessage') }}</p>

        <form class="pin-panel" @submit.prevent="unlockWithPin">
          <label class="pin-label" for="public-resource-pin">{{ t('publicResource.pinLabel') }}</label>
          <input
              id="public-resource-pin"
              v-model="pin"
              class="pin-input"
              type="password"
              inputmode="numeric"
              maxlength="8"
              autocomplete="one-time-code"
              :placeholder="t('publicResource.pinPlaceholder')"
          />
          <p v-if="pinError" class="pin-error" role="alert">{{ pinError }}</p>
          <button type="submit" class="pin-submit" :disabled="unlocking || !pin.trim()">
            <i :class="unlocking ? 'pi pi-spin pi-spinner' : 'pi pi-lock-open'" />
            {{ unlocking ? t('publicResource.unlocking') : t('publicResource.unlockButton') }}
          </button>
        </form>
      </main>

      <main v-else-if="state === 'error'" class="state-panel state-panel-error" aria-live="assertive">
        <div class="state-icon">
          <i class="pi pi-times-circle" />
        </div>
        <h2>{{ t('publicResource.errorTitle') }}</h2>
        <p>{{ t('publicResource.errorMessage') }}</p>
      </main>

      <main v-else-if="display" class="tablet-content">
        <!-- Kiosk / Tablet simplified view: show only essentials for small displays -->
        <section class="kiosk-card" :data-state="statusTone" aria-live="polite">
          <div class="kiosk-top">
            <span class="kiosk-clock">{{ formattedTime }}</span>
          </div>

          <div class="kiosk-body">
            <!-- <h1 class="kiosk-room">{{ display.name }}</h1> -->

            <div class="kiosk-status-row">
              <span class="status-pill" :data-state="statusTone">
                <i :class="statusIcon" />
                {{ statusLabel }}
              </span>

              <div class="kiosk-when">
                <template v-if="display.currentBooking">
                  <div class="kiosk-occupied-label">{{ t('publicResource.freeAtLabel') }}</div>
                  <div class="kiosk-occupied-time">{{ formatSingleTime(display.currentBooking.endTime) }}</div>
                </template>
                <template v-else>
                  <div class="kiosk-free-label">{{ t('publicResource.kioskRoomFree') }}</div>
                  <template v-if="display.nextBooking">
                    <div class="kiosk-free-until">{{ t('publicResource.kioskNextBooking') }}</div>
                    <div class="kiosk-free-time">{{ formatSingleTime(display.nextBooking.startTime) }}</div>
                  </template>
                  <template v-else>
                    <div class="kiosk-free-until">{{ t('publicResource.kioskNoNextBooking') }}</div>
                  </template>
                </template>
              </div>
            </div>

            <div class="kiosk-next-organizer" v-if="display.currentBooking || display.nextBooking">
              <div class="kiosk-organizer-label">{{ t('publicResource.kioskOrganizer') }}</div>
              <div class="kiosk-organizer-name">
                {{ bookingOrganizer(display.currentBooking || display.nextBooking) || '—' }}
              </div>
            </div>
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
const CLOCK_MS = 1_000
// ...existing code...
const PIN_STORAGE_PREFIX = 'appmeetingroom.publicResource.pin:'

const { t, locale } = useI18n()
const route = useRoute()

const uiStore = useUiStore()

const state = ref<ViewState>('loading')
const display = ref<PublicResourceDisplay | null>(null)
const now = ref(new Date())
const pin = ref('')
const pinError = ref('')
const unlocking = ref(false)

let refreshHandle: ReturnType<typeof setInterval> | null = null
let clockHandle: ReturnType<typeof setInterval> | null = null

const resourceId = computed(() => route.params.id as string)
const pinStorageKey = computed(() => `${PIN_STORAGE_PREFIX}${resourceId.value}`)

const statusTone = computed(() => {
  switch (display.value?.displayStatus) {
    case 'Maintenance':
      return 'maintenance'
    case 'Occupied':
      return 'occupied'
    default:
      return 'available'
  }
})

const statusLabel = computed(() => {
  switch (display.value?.displayStatus) {
    case 'Maintenance':
      return t('publicResource.statusMaintenance')
    case 'Occupied':
      return t('publicResource.statusOccupied')
    default:
      return t('publicResource.statusAvailable')
  }
})

const statusIcon = computed(() => {
  switch (display.value?.displayStatus) {
    case 'Maintenance':
      return 'pi pi-wrench'
    case 'Occupied':
      return 'pi pi-lock'
    default:
      return 'pi pi-check-circle'
  }
})

// freeSlotMessage removed: kiosk view displays only essential times directly

const formattedTime = computed(() =>
    formatDate(now.value, {
      hour: '2-digit',
      minute: '2-digit',
    })
)

// visibleSchedule removed: kiosk view does not render full schedule

// ...existing code...

const pageStyle = computed(() => {
  const tenantPrimary = display.value?.tenantPrimaryColor || '#0f766e'
  const tenantSecondary = display.value?.tenantSecondaryColor || '#164e63'
  const primary = tenantPrimary
  const secondary = tenantSecondary
  const isDark = uiStore.isDarkMode

  return {
    '--brand-primary': primary,
    '--brand-secondary': secondary,
    '--page-overlay': isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.48)',
    '--surface-strong': isDark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.9)',
    '--surface-soft': isDark ? 'rgba(30, 41, 59, 0.68)' : 'rgba(255, 255, 255, 0.7)',
    '--surface-border': isDark ? 'rgba(148, 163, 184, 0.24)' : 'rgba(148, 163, 184, 0.22)',
    '--chip-bg': isDark ? 'rgba(30, 41, 59, 0.82)' : 'rgba(241, 245, 249, 0.92)',
    '--text-main': isDark ? '#f8fafc' : '#0f172a',
    '--text-soft': isDark ? 'rgba(226, 232, 240, 0.82)' : 'rgba(51, 65, 85, 0.82)',
    '--text-muted': isDark ? 'rgba(203, 213, 225, 0.68)' : 'rgba(71, 85, 105, 0.72)',
    '--shadow-strong': isDark ? '0 24px 80px rgba(2, 8, 23, 0.36)' : '0 22px 60px rgba(15, 23, 42, 0.14)',
  }
})

// ...existing code...

// bookingTitle removed: kiosk view hides booking titles for privacy

function bookingOrganizer(booking: any): string | null {
  if (!booking) return null
  // Common possible fields; backend may include one of these
  return (
      booking.organizerName || booking.organizer || booking.organizerFullName || booking.organizerDisplayName || null
  )
}

// rowTone/rowLabel removed: schedule list hidden in kiosk view

function formatDate(
    value: Date | string,
    options: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(locale.value, {
    ...options,
    // Use the resource timeZone when available; otherwise omit the option so
    // the browser falls back to the user's local timezone. Previously we
    // forced 'UTC' which made the displayed time appear 1-2 hours off for
    // users in CET/CEST when the API didn't provide the timezone.
    timeZone: display.value?.timeZone ?? undefined,
  }).format(date)
}

function formatSingleTime(value: string): string {
  return formatDate(value, { hour: '2-digit', minute: '2-digit' })
}

// formatTimeRange/formatMaintenanceWindow removed: kiosk view shows only single times

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

async function loadDisplay(overridePin?: string): Promise<void> {
  const candidatePin = (overridePin ?? getStoredPin()).trim()

  try {
    display.value = await publicApi.getResourceDisplay(resourceId.value, candidatePin || undefined)
    // If backend didn't mark a currentBooking but provided today's schedule,
    // attempt a best-effort local detection of the ongoing booking and mark
    // the display as occupied. This is a temporary client-side fallback for
    // cases where timezone/serialization mismatches cause the server to miss
    // the current booking. Recommended permanent fix: correct server to
    // return currentBooking/displayStatus consistently in UTC or with
    // explicit offsets.
    if (!display.value.currentBooking && display.value.todaySchedule?.length) {
      function parseBookingTime(value: string | null): Date {
        if (!value) return new Date(NaN)
        // Try native parsing first (handles ISO with timezone/Z)
        const parsed = new Date(value)
        if (!isNaN(parsed.getTime())) return parsed

        // Try dd/MM/yyyy HH:mm:ss (example from backend DTO)
        const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2}):(\d{2})$/)
        if (m) {
          const dd = Number(m[1])
          const mm = Number(m[2])
          const yyyy = Number(m[3])
          const hh = Number(m[4])
          const min = Number(m[5])
          const ss = Number(m[6])
          // Construct as local time (best-effort)
          return new Date(yyyy, mm - 1, dd, hh, min, ss)
        }

        // Fallback: replace space with T and try again
        const alt = value.replace(' ', 'T')
        return new Date(alt)
      }

      try {
        const nowLocal = new Date()
        const current = display.value.todaySchedule.find((b) => {
          const s = parseBookingTime(b.startTime)
          const e = parseBookingTime(b.endTime)
          if (isNaN(s.getTime()) || isNaN(e.getTime())) return false
          return s <= nowLocal && nowLocal < e
        })
        if (current) {
          display.value.currentBooking = current
          display.value.displayStatus = 'Occupied'
        }
      } catch (e) {
        // ignore parsing errors — fallback only
        console.warn('Failed to compute fallback currentBooking:', e)
      }
    }
    if (candidatePin) {
      pin.value = candidatePin
      storePin(candidatePin)
    }
    pinError.value = ''
    state.value = 'ready'
  } catch (error) {
    console.error('Failed to load public resource display:', error)
    display.value = null

    if (axios.isAxiosError(error) && error.response?.status === 403) {
      clearStoredPin()
      state.value = 'locked'
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
  try {
    await loadDisplay(pin.value)
  } finally {
    unlocking.value = false
  }
}

const handleToggleTheme = (): void => {
  // Toggle global dark mode in the ui store and ensure the html class
  // reflects the new state immediately. uiStore.toggleDarkMode already
  // applies the class, but we call it here and defensively set the class
  // again to avoid environment-specific timing issues.
  uiStore.toggleDarkMode()
  try {
    const enabled = (uiStore.isDarkMode as unknown as boolean) || !!uiStore.darkMode
    if (typeof document !== 'undefined') {
      if (enabled) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
  } catch (e) {
    // ignore
  }
}

onMounted(async () => {
  if (typeof window !== 'undefined') {

    pin.value = getStoredPin()
  }

  await loadDisplay()

  clockHandle = setInterval(() => {
    now.value = new Date()
  }, CLOCK_MS)

  refreshHandle = setInterval(() => {
    loadDisplay().catch((error) => {
      console.error('Failed to refresh public resource display:', error)
    })
  }, REFRESH_MS)
})

onBeforeUnmount(() => {
  if (clockHandle) clearInterval(clockHandle)
  if (refreshHandle) clearInterval(refreshHandle)
})
</script>

<style scoped src="./PublicResourceView.css"></style>
