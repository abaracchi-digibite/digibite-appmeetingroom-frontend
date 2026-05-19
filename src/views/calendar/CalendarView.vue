<template>
  <MainLayout>
    <div class="calendar-page">
      <!-- Hint introduttivo: visibile sempre in cima alla pagina, spiega come
           prenotare rapidamente trascinando sul calendario. -->
      <div class="cal-hint">
        <i class="pi pi-info-circle" />
        <span>{{ t('calendar.selectHint') }}</span>
      </div>

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
              option-label="label"
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
              option-label="label"
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
              option-label="label"
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
              option-label="label"
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
              option-label="label"
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
                option-label="label"
                option-value="value"
                class="time-range-select"
              />
              <span class="time-range-sep">—</span>
              <PrimeSelect
                v-model="slotEndHour"
                :options="hourOptionsEnd"
                option-label="label"
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
              <span>{{ t('common.loadFailed') }}</span>
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
        </div>
      </div>

      <!-- ------ Quick Book Modal --------------------------------------------------------------------------------------------------------------------- -->
      <AppDialog
        v-model:visible="showQuickBook"
        :header="t('calendar.quickBook')"
        icon="pi pi-bolt"
        severity="primary"
        size="md"
      >
        <div class="dlg-form">
          <!-- Sezione riepilogo orario selezionato -->
          <div class="dlg-section">
            <div class="dlg-fields-2">
              <div class="dlg-field">
                <label class="dlg-label">{{ t('calendar.start') }}</label>
                <div class="qb-time-readout">
                  <i class="pi pi-calendar" />
                  <span>{{ formatDisplay(quickBook.start) }}</span>
                </div>
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('calendar.end') }}</label>
                <div class="qb-time-readout">
                  <i class="pi pi-calendar-clock" />
                  <span>{{ formatDisplay(quickBook.end) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Sezione dati prenotazione -->
          <div class="dlg-section">
            <div class="dlg-fields-2">
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('wizard.titleLabel') }} <span class="req">*</span></label>
                <PrimeInputText
                  v-model="quickBook.title"
                  :placeholder="t('calendar.bookingTitlePlaceholder')"
                  class="w-full"
                  required
                />
              </div>
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('bookings.resource') }} <span class="req">*</span></label>
                <PrimeMultiSelect
                  v-model="quickBook.resourceIds"
                  :options="quickBookResourceGroupedOptions"
                  option-group-label="label"
                  option-group-children="items"
                  option-label="label"
                  option-value="value"
                  :placeholder="t('calendar.selectResource')"
                  display="chip"
                  class="w-full"
                >
                  <template #optiongroup="{ option }">
                    <span class="qb-res-group" :style="option.color ? { color: option.color } : {}">
                      <span v-if="option.color" class="qb-res-group-dot" :style="{ background: option.color }" />
                      {{ option.label }}
                    </span>
                  </template>
                </PrimeMultiSelect>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="dlg-footer-split">
            <button type="button" class="dialog-btn dialog-btn-cancel" @click="showQuickBook = false">
              <i class="pi pi-times" />{{ t('common.cancel') }}
            </button>
            <button type="button" class="dialog-btn dialog-btn-save" :disabled="!canProceedQuickBook" @click="proceedToWizard">
              <i class="pi pi-arrow-right" />{{ t('calendar.continueToWizard') }}
            </button>
          </div>
        </template>
      </AppDialog>

      <!-- ------ Event Detail Dialog ------------------------------------------------------------------------------------------------------------ -->
      <AppDialog
        v-model:visible="showEventDetail"
        :header="selectedBooking?.title || ''"
        icon="pi pi-calendar"
        severity="primary"
        size="md"
        class="event-detail-dialog"
      >
        <template v-if="selectedBooking" #subtitle>
          <span class="ed-status-pill" :style="{ background: getStatusColor(selectedBooking.status) }">
            <i class="pi pi-circle-fill" />
            {{ t(`bookings.status.${selectedBooking.status.charAt(0).toLowerCase() + selectedBooking.status.slice(1)}`) }}
          </span>
        </template>

        <div v-if="selectedBooking" class="ed-wrap">
          <!-- ─── Quando ─────────────────────────── -->
          <section class="ed-hero">
            <div class="ed-hero-date">{{ getBookingDateLabel(selectedBooking) }}</div>
            <div class="ed-hero-time-row">
              <div class="ed-hero-time">{{ getBookingTimeRangeLabel(selectedBooking) }}</div>
              <span v-if="bookingCountdown" class="ed-countdown" :class="`ed-countdown-${bookingCountdown.tone}`">
                <span class="ed-countdown-dot" />
                {{ bookingCountdown.label }}
              </span>
            </div>
            <div class="ed-hero-meta">
              <span class="ed-hero-meta-item"><i class="pi pi-hourglass" />{{ getBookingDurationLabel(selectedBooking) }}</span>
              <span class="ed-hero-meta-sep">•</span>
              <span class="ed-hero-meta-item"><i class="pi pi-map-marker" />{{ getBookingPlantLabel(selectedBooking) }}</span>
              <template v-if="selectedBooking.isRecurring">
                <span class="ed-hero-meta-sep">•</span>
                <span class="ed-hero-meta-item ed-hero-meta-accent"><i class="pi pi-sync" />{{ t('bookings.isRecurring') }}</span>
              </template>
            </div>
          </section>

          <!-- ─── CTA Meeting URL (Teams / Meet) ─── -->
          <button
            v-if="selectedBooking.meetingUrl"
            type="button"
            class="ed-meeting-cta"
            @click="openMeetingUrl"
          >
            <i class="pi pi-video" />
            <span class="ed-meeting-cta-text">
              <span class="ed-meeting-cta-title">{{ t('bookings.joinMeeting') }}</span>
              <span class="ed-meeting-cta-host">{{ selectedBooking.meetingUrl }}</span>
            </span>
            <i class="pi pi-external-link" />
          </button>

          <!-- ─── Rejection callout (se rejected) ─── -->
          <div v-if="selectedBooking.status === 'Rejected' && selectedBooking.rejectionReason" class="ed-reject-callout">
            <i class="pi pi-times-circle" />
            <div class="ed-reject-body">
              <span class="ed-reject-label">{{ t('bookings.rejectionReason') }}</span>
              <span class="ed-reject-text">{{ selectedBooking.rejectionReason }}</span>
            </div>
          </div>

          <hr class="ed-divider" />

          <!-- ─── Organizzatore + Partecipanti ─── -->
          <section class="ed-stat-row">
            <div class="ed-stat">
              <span class="ed-stat-label">{{ t('calendar.organizer') }}</span>
              <div class="ed-stat-body">
                <span class="ed-stat-avatar" :style="{ background: avatarColorFor(selectedBookingOrganizer) }">
                  {{ participantInitials(selectedBookingOrganizer) }}
                </span>
                <span class="ed-stat-value">{{ selectedBookingOrganizer }}</span>
              </div>
            </div>
            <div class="ed-stat">
              <span class="ed-stat-label">
                {{ t('calendar.participants') }}
                <span class="ed-stat-count-inline">{{ selectedBooking.participants?.length ?? 0 }}</span>
              </span>
              <div class="ed-stat-body">
                <div v-if="participantsPreview.length" class="ed-avatar-stack">
                  <span
                    v-for="(p, idx) in participantsPreview"
                    :key="idx"
                    class="ed-avatar"
                    :style="{ background: p.color }"
                    :title="p.name"
                  >{{ p.initials }}</span>
                  <span v-if="participantsOverflow > 0" class="ed-avatar ed-avatar-more">+{{ participantsOverflow }}</span>
                </div>
                <span v-else class="ed-stat-empty">{{ t('common.noData') }}</span>
                <button
                  v-if="allParticipantsForList.length"
                  class="ed-participants-list-btn"
                  :class="{ active: showParticipantsList }"
                  :title="showParticipantsList ? t('common.hide') : t('common.show')"
                  @click="showParticipantsList = !showParticipantsList"
                >
                  <i :class="showParticipantsList ? 'pi pi-chevron-up' : 'pi pi-list'" />
                </button>
              </div>
              <div v-if="showParticipantsList && allParticipantsForList.length" class="ed-participants-list">
                <div
                  v-for="(p, idx) in allParticipantsForList"
                  :key="idx"
                  class="ed-participant-row"
                >
                  <span class="ed-participant-avatar" :style="{ background: avatarColorFor(p.name) }">
                    {{ participantInitials(p.name) }}
                  </span>
                  <div class="ed-participant-info">
                    <div class="ed-participant-name-row">
                      <span class="ed-participant-name">{{ p.name }}</span>
                      <span class="ed-participant-type-badge" :style="{ '--badge-color': p.typeColor }">{{ p.typeLabel }}</span>
                    </div>
                    <span v-if="p.email" class="ed-participant-email">{{ p.email }}</span>
                  </div>
                </div>
              </div>
              <div v-if="participantsBreakdown.length > 1" class="ed-breakdown">
                <span
                  v-for="g in participantsBreakdown"
                  :key="g.key"
                  class="ed-breakdown-chip"
                >
                  <span class="ed-breakdown-dot" :style="{ background: g.color }" />
                  <span class="ed-breakdown-count">{{ g.count }}</span>
                  <span class="ed-breakdown-label">{{ g.label }}</span>
                </span>
              </div>
            </div>
          </section>

          <hr class="ed-divider" />

          <!-- ─── Risorse ──────────────────────── -->
          <section class="ed-block">
            <div class="ed-block-head">
              <span class="ed-block-title">{{ t('calendar.resources') }}</span>
              <span class="ed-block-count">{{ selectedBooking.resources?.length ?? 0 }}</span>
            </div>
            <div v-if="selectedBooking.resources?.length" class="ed-res-list">
              <div
                v-for="resource in selectedBooking.resources"
                :key="resource.id"
                class="ed-res-row"
                :style="{ '--ed-res-accent': getResourceTypeColor(resource.resourceId) || '#4f46e5' }"
              >
                <span class="ed-res-accent-bar" />
                <div class="ed-res-info">
                  <span class="ed-res-name">{{ getResourceName(resource.resourceId) }}</span>
                  <span class="ed-res-time">
                    {{ formatTime(resource.startTime) }}<span class="ed-res-time-sep">→</span>{{ formatTime(resource.endTime) }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="ed-empty">{{ t('common.noData') }}</div>
          </section>

          <template v-if="selectedBooking.notes">
            <hr class="ed-divider" />
            <!-- ─── Note ──────────────────────── -->
            <section class="ed-notes">
              <span class="ed-block-title">{{ t('calendar.notes') }}</span>
              <p class="ed-notes-text">{{ selectedBooking.notes }}</p>
            </section>
          </template>

          <!-- ─── Audit footer (creato / approvato) ─── -->
          <div class="ed-audit">
            <span v-if="selectedBooking.createdAt" class="ed-audit-item">
              <i class="pi pi-clock" />
              {{ t('common.createdAt') }} {{ formatDateShort(selectedBooking.createdAt) }}
            </span>
            <span v-if="selectedBooking.approvedById && selectedBooking.approvedAt" class="ed-audit-item">
              <i class="pi pi-check-circle" />
              {{ t('bookings.approvedBy') }}
              <strong>{{ getUserName(selectedBooking.approvedById) }}</strong>
              {{ t('common.on') }} {{ formatDateShort(selectedBooking.approvedAt) }}
            </span>
          </div>
        </div>

        <template #footer>
          <!-- Footer split: Chiudi a sinistra, azioni (Elimina/Modifica/Visualizza
               dettagli) a destra. .ed-footer è display:flex space-between. -->
          <div class="ed-footer">
            <button type="button" class="ed-btn ed-btn-ghost" @click="showEventDetail = false">
              <i class="pi pi-times" />{{ t('common.close') }}
            </button>
            <div class="ed-footer-actions">
              <button
                v-if="selectedBooking && canCancelBooking"
                type="button"
                class="ed-btn ed-btn-danger"
                :disabled="cancelLoading"
                @click="openCancelDialog"
              >
                <i class="pi pi-trash" />
                <span>{{ t('common.delete') }}</span>
              </button>
              <button
                v-if="selectedBooking && canEditBooking"
                type="button"
                class="ed-btn ed-btn-secondary"
                @click="goToEditBooking"
              >
                <i class="pi pi-pencil" />
                <span>{{ t('common.edit') }}</span>
              </button>
              <router-link
                v-if="selectedBooking"
                :to="{ name: 'BookingDetail', params: { id: selectedBooking.id } }"
                class="ed-btn ed-btn-primary"
                @click="showEventDetail = false"
              >
                <i class="pi pi-external-link" />
                <span>{{ t('calendar.viewDetail') }}</span>
              </router-link>
            </div>
          </div>
        </template>
      </AppDialog>

      <!-- ─── Dialog conferma cancellazione (redesigned) ──────────────────── -->
      <AppDialog
        v-model:visible="showCancelDialog"
        :header="t('bookings.confirmDeleteHeader')"
        icon="pi pi-trash"
        severity="danger"
        size="sm"
      >
        <div v-if="bookingToCancel" class="del-modal">
          <!-- Hero: icona grande + messaggio principale centrato -->
          <div class="del-hero">
            <div class="del-hero-icon">
              <i class="pi pi-exclamation-triangle" />
            </div>
            <h3 class="del-hero-title">{{ t('bookings.confirmDelete') }}</h3>
            <p class="del-hero-subtitle">{{ t('bookings.deleteWarning') }}</p>
          </div>

          <!-- Card riepilogo prenotazione -->
          <div class="del-summary">
            <div class="del-summary-title">
              <i class="pi pi-calendar" />
              <span>{{ bookingToCancel.title || t('bookings.untitled') }}</span>
            </div>
            <div class="del-summary-grid">
              <div class="del-summary-item">
                <span class="del-summary-label">{{ t('calendar.start') }}</span>
                <span class="del-summary-value">
                  {{ formatDisplay(bookingToCancel.resources?.[0]?.startTime ?? '') }}
                </span>
              </div>
              <div class="del-summary-item">
                <span class="del-summary-label">{{ t('calendar.end') }}</span>
                <span class="del-summary-value">
                  {{ formatDisplay(bookingToCancel.resources?.[0]?.endTime ?? '') }}
                </span>
              </div>
              <div v-if="bookingToCancel.resources?.[0]?.resourceId" class="del-summary-item del-summary-item-full">
                <span class="del-summary-label">{{ t('bookings.resource') }}</span>
                <span class="del-summary-value">
                  <i class="pi pi-map-marker" />
                  {{ getResourceName(bookingToCancel.resources[0].resourceId) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Info: i partecipanti registrati ricevono notifica ICS di cancellazione -->
          <div class="del-irreversible">
            <i class="pi pi-info-circle" />
            <span>{{ t('bookings.deleteNotifyParticipants') }}</span>
          </div>
        </div>

        <template #footer>
          <div class="dlg-footer-split">
            <button type="button" class="dialog-btn dialog-btn-cancel" :disabled="cancelLoading" @click="showCancelDialog = false">
              <i class="pi pi-times" />{{ t('common.cancel') }}
            </button>
            <button type="button" class="dialog-btn dialog-btn-delete" :disabled="cancelLoading" @click="confirmCancelBooking">
              <i :class="cancelLoading ? 'pi pi-spin pi-spinner' : 'pi pi-trash'" />{{ t('common.delete') }}
            </button>
          </div>
        </template>
      </AppDialog>

      <!-- ─── Dialog conferma spostamento / ridimensionamento ─────────────── -->
      <AppDialog
        v-model:visible="showMoveConfirmDialog"
        :header="pendingMoveInfo?.mode === 'resize' ? t('calendar.confirmResizeHeader') : t('calendar.confirmMoveHeader')"
        :icon="pendingMoveInfo?.mode === 'resize' ? 'pi pi-arrows-alt' : 'pi pi-arrow-right-arrow-left'"
        severity="primary"
        size="sm"
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
          <div class="dlg-footer-split">
            <button type="button" class="dialog-btn dialog-btn-cancel" :disabled="moveLoading" @click="cancelMoveBooking">
              <i class="pi pi-times" />{{ t('common.cancel') }}
            </button>
            <button type="button" class="dialog-btn dialog-btn-save" :disabled="moveLoading" @click="confirmMoveBooking">
              <i :class="moveLoading ? 'pi pi-spin pi-spinner' : 'pi pi-check'" />{{ pendingMoveInfo?.mode === 'resize' ? t('calendar.confirmResizeConfirm') : t('calendar.confirmMoveConfirm') }}
            </button>
          </div>
        </template>
      </AppDialog>

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
import AppDialog from '@/components/common/AppDialog.vue'
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

const { t, locale } = useI18n()
const router = useRouter()
const toast = useToast()
const bookingsStore = useBookingsStore()
const authStore = useAuthStore()
const resourcesStore = useResourcesStore()
const plantsStore = usePlantsStore()
const usersStore = useUsersStore()
const visitorTypesStore = useVisitorTypesStore()
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
const showParticipantsList = ref(false)
const currentView = ref<string>('timeGridWeek')
const showWeekends = ref(true)
// Filtri aperti di default all'atterraggio sulla pagina (richiesta UX).
const showFilters = ref(true)
const showFiltersVisible = ref(true)
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

watch(showEventDetail, (val) => {
  if (!val) showParticipantsList.value = false
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
  resourceIds: [] as string[],
})

const canProceedQuickBook = computed(() =>
  quickBook.value.title.trim().length > 0 && quickBook.value.resourceIds.length > 0
)

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


const visitorTypeOptions = computed(() =>
  visitorTypesStore.visitorTypes.map((vt) => ({ label: vt.name, value: vt.id }))
)

const resourceTypeOptions = computed(() =>
  // Solo i tipi attivi: i tipi disattivati non devono comparire nei filtri.
  resourcesStore.activeResourceTypes.map((rt) => ({
    label: rt.name,
    value: rt.id,
  }))
)

const resourceOptions = computed(() => {
  // Risorse prenotabili: escluse quelle di tipo disattivato.
  let resources = resourcesStore.bookableResources

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

const quickBookResourceGroupedOptions = computed(() => {
  let resources = resourcesStore.bookableResources

  if (filters.value.plantId) {
    resources = resources.filter((r) => r.plantId === filters.value.plantId)
  }
  if (filters.value.resourceTypeIds.length > 0) {
    resources = resources.filter((r) => filters.value.resourceTypeIds.includes(r.resourceTypeId))
  }

  const groups = new Map<string, { label: string; color: string | undefined; items: { label: string; value: string }[] }>()
  for (const resource of resources) {
    const rt = resourcesStore.resourceTypeById(resource.resourceTypeId)
    const typeLabel = rt?.name ?? '–'
    if (!groups.has(resource.resourceTypeId)) {
      groups.set(resource.resourceTypeId, { label: typeLabel, color: rt?.color || undefined, items: [] })
    }
    groups.get(resource.resourceTypeId)!.items.push({ label: resource.name, value: resource.id })
  }
  return Array.from(groups.values())
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


  // Filtro per tipologia visitatore: ora applicato lato backend tramite
  // CalendarQuery.visitorTypeId (DRF §8.5). Il match è su qualsiasi
  // partecipante della prenotazione. Vedi watcher su filters.visitorTypeId
  // che rilancia fetchCalendar().

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

  // flatMap: ogni slot di risorsa diventa un evento distinto nel calendario.
  // Una prenotazione con più risorse (fasce orarie diverse) genera un evento
  // per ciascuna, così tutte le fasce sono visibili (es. 10:00-11:00 e 11:00-12:30).
  return filtered.flatMap((booking) => {
    // Colore evento: lo SFONDO riflette lo stato (legenda comune,
    // Confirmed=verde, Cancelled=rosso ecc.) mentre il BORDO usa il
    // colore configurato sul Tipo di Risorsa (DRF §5.1 — "icona/colore
    // identificativo nella UI"). Così l'utente identifica a colpo
    // d'occhio sia lo stato della prenotazione sia il tipo di risorsa.
    // Se il tipo non ha colore configurato, il bordo cade sul colore status.
    const statusColor = getStatusColor(booking.status)
    const resourceTypeColor = getResourceTypeColorForBooking(booking)
    const resources = booking.resources ?? []

    return resources.map((resource, rIdx) => ({
      id: rIdx === 0 ? booking.id : `${booking.id}::${resource.id}`,
      title: booking.title,
      start: resource.startTime,
      end: resource.endTime,
      backgroundColor: statusColor,
      borderColor: resourceTypeColor || statusColor,
      textColor: '#ffffff',
      classNames: [
        `event-${booking.status.toLowerCase()}`,
        booking.status === BookingStatusEnum.Cancelled ? 'event-cancelled' : '',
        resourceTypeColor ? 'event-with-type-color' : '',
      ].filter(Boolean),
      extendedProps: { booking },
    }))
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
  // Forza tutti gli eventi a essere "block" (barra piena colorata) anche in
  // vista mensile, dove di default FullCalendar usa "dot + testo" con sfondo
  // trasparente che diventa invisibile col textColor bianco.
  eventDisplay: 'block',
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

/** Etichetta data della prenotazione, derivata dalla prima risorsa. */
function getBookingDateLabel(booking: Booking): string {
  const startStr = booking.resources?.[0]?.startTime
  if (!startStr) return '–'
  const d = new Date(startStr)
  return d.toLocaleDateString(locale.value, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

/** Durata totale del booking (max end − min start) formattata "Xh Ym". */
function getBookingDurationLabel(booking: Booking): string {
  const res = booking.resources ?? []
  if (!res.length) return '–'
  const starts = res.map((r) => new Date(r.startTime).getTime())
  const ends   = res.map((r) => new Date(r.endTime).getTime())
  const minutes = Math.max(0, Math.round((Math.max(...ends) - Math.min(...starts)) / 60000))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Etichetta sede (plant) derivata dalla prima risorsa. */
function getBookingPlantLabel(booking: Booking): string {
  const plantId = booking.resources?.[0]?.plantId
  if (!plantId) return '–'
  return plantsStore.plantById(plantId)?.name ?? '–'
}

/** Etichetta range orario "HH:mm → HH:mm" (min start / max end del booking). */
function getBookingTimeRangeLabel(booking: Booking): string {
  const res = booking.resources ?? []
  if (!res.length) return '–'
  const start = new Date(Math.min(...res.map((r) => new Date(r.startTime).getTime())))
  const end   = new Date(Math.max(...res.map((r) => new Date(r.endTime).getTime())))
  return `${formatTime(start.toISOString())} - ${formatTime(end.toISOString())}`
}

/** Colore del tipo della risorsa (per accent della card). */
function getResourceTypeColor(resourceId: string): string | undefined {
  const r = resourcesStore.resourceById(resourceId)
  if (!r) return undefined
  return resourcesStore.resourceTypeById(r.resourceTypeId)?.color
}

/** Palette deterministica per gli avatar dei partecipanti (stable per nome). */
const AVATAR_COLORS = [
  '#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#2563eb', '#0d9488',
]

function avatarColorFor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function participantInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Max 4 partecipanti come {initials, name, color}; il resto va in overflow. */
const participantsPreview = computed(() => {
  const list = selectedBooking.value?.participants ?? []
  return list.slice(0, 4).map((p) => {
    let name: string
    if (p.isInternal && p.userId) {
      const u = usersStore.users.find((x) => x.id === p.userId)
      name = u?.fullName?.trim() || u?.email || p.userId
    } else {
      name = `${p.visitorFirstName ?? ''} ${p.visitorLastName ?? ''}`.trim() || p.visitorEmail || '?'
    }
    return { initials: participantInitials(name), name, color: avatarColorFor(name) }
  })
})

const participantsOverflow = computed(() => {
  const total = selectedBooking.value?.participants?.length ?? 0
  return Math.max(0, total - participantsPreview.value.length)
})

/**
 * Countdown / live indicator: "Inizia tra X" prima dell'inizio,
 * "In corso da X" mentre è attivo, "Terminato X fa" dopo la fine.
 * Si refresh ogni minuto via `nowTick`.
 */
const nowTick = ref(Date.now())
let nowTickInterval: ReturnType<typeof setInterval> | null = null

function formatRelative(diffMs: number): string {
  const abs = Math.abs(diffMs)
  const m = Math.round(abs / 60_000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (h < 24) return mm === 0 ? `${h}h` : `${h}h ${mm}m`
  const d = Math.floor(h / 24)
  return `${d}g`
}

type CountdownInfo = { label: string; tone: 'soon' | 'live' | 'past' }

const bookingCountdown = computed((): CountdownInfo | null => {
  const res = selectedBooking.value?.resources ?? []
  if (!res.length) return null
  const start = Math.min(...res.map((r) => new Date(r.startTime).getTime()))
  const end   = Math.max(...res.map((r) => new Date(r.endTime).getTime()))
  const now = nowTick.value
  if (now < start) return { label: `${t('calendar.startsIn')} ${formatRelative(start - now)}`, tone: 'soon' }
  if (now < end)   return { label: `${t('calendar.inProgressFor')} ${formatRelative(now - start)}`, tone: 'live' }
  return { label: `${t('calendar.endedAgo')} ${formatRelative(now - end)} ${t('calendar.ago')}`, tone: 'past' }
})

/**
 * Breakdown partecipanti per tipologia visitatore (chip "3 Clienti + 1 Fornitore").
 * Gli interni sono raggruppati come "Interni". Ordine: count DESC.
 */
type BreakdownGroup = { key: string; label: string; count: number; color: string }

const participantsBreakdown = computed((): BreakdownGroup[] => {
  const list = selectedBooking.value?.participants ?? []
  if (!list.length) return []
  const groups = new Map<string, { label: string; count: number; color: string }>()
  for (const p of list) {
    let key: string
    let label: string
    let color: string
    if (p.isInternal) {
      key = '__internal'
      label = t('bookings.internal')
      color = '#475569'
    } else if (p.visitorTypeId) {
      key = p.visitorTypeId
      label = visitorTypesStore.visitorTypeById(p.visitorTypeId)?.name ?? t('bookings.visitor')
      color = '#4f46e5'
    } else {
      key = '__visitor'
      label = t('bookings.visitor')
      color = '#94a3b8'
    }
    const g = groups.get(key)
    if (g) g.count++
    else groups.set(key, { label, count: 1, color })
  }
  return Array.from(groups.entries())
    .map(([k, v]) => ({ key: k, ...v }))
    .sort((a, b) => b.count - a.count)
})

const allParticipantsForList = computed(() => {
  const list = selectedBooking.value?.participants ?? []
  return list.map((p) => {
    if (p.isInternal && p.userId) {
      const u = usersStore.users.find((x) => x.id === p.userId)
      return {
        name: u?.fullName?.trim() || u?.email || p.userId,
        email: u?.email || '',
        typeLabel: t('bookings.internal'),
        typeColor: '#475569',
      }
    }
    const name = `${p.visitorFirstName ?? ''} ${p.visitorLastName ?? ''}`.trim() || p.visitorEmail || '?'
    const vt = p.visitorTypeId ? visitorTypesStore.visitorTypeById(p.visitorTypeId) : null
    return {
      name,
      email: p.visitorEmail || '',
      typeLabel: vt?.name ?? t('bookings.visitor'),
      typeColor: vt ? '#4f46e5' : '#94a3b8',
    }
  })
})

/** Helper per audit footer: nome utente da userId */
function getUserName(userId?: string | null): string {
  if (!userId) return ''
  const u = usersStore.users.find((x) => x.id === userId)
  return u?.fullName?.trim() || u?.email || userId
}

function formatDateShort(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(locale.value, { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Apre il link meeting in una nuova tab */
function openMeetingUrl() {
  const url = selectedBooking.value?.meetingUrl
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
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
  return d.toLocaleString(locale.value, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
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
    return `${d.toLocaleDateString(locale.value, { weekday: 'short', day: '2-digit', month: '2-digit' })} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
    return `${d.toLocaleDateString(locale.value, { weekday: 'short', day: '2-digit', month: '2-digit' })} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
    resourceIds: filters.value.resourceIds.length > 0 ? [...filters.value.resourceIds] : [],
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
      resourceId: quickBook.value.resourceIds.length > 0 ? quickBook.value.resourceIds : undefined,
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
    if (filters.value.visitorTypeId) query.visitorTypeId = filters.value.visitorTypeId

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
// plantId e visitorTypeId richiedono un nuovo fetch dal backend (sono parametri
// del CalendarQuery server-side). Gli altri filtri (resourceTypeIds, resourceIds,
// statuses) sono applicati client-side nel computed calendarEvents.
watch(
  () => [filters.value.plantId, filters.value.visitorTypeId],
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

  // Tick di 1 minuto per il countdown live nel dialog event-detail
  nowTickInterval = setInterval(() => { nowTick.value = Date.now() }, 60_000)

  try {
    await Promise.all([
      plantsStore.fetchAll(),
      resourcesStore.fetchAllResources(),
      resourcesStore.fetchAllResourceTypes(),
      // Carica gli utenti per risolvere organizerId → nome nel popover dettagli.
      usersStore.users.length === 0 ? usersStore.fetchAll() : Promise.resolve(),
      // Carica i tipi visitatore per il breakdown partecipanti e per i filtri.
      visitorTypesStore.visitorTypes.length === 0 ? visitorTypesStore.fetchAllVisitorTypes() : Promise.resolve(),
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
  if (nowTickInterval) clearInterval(nowTickInterval)
})
</script>

<style scoped src="./CalendarView.css"></style>
