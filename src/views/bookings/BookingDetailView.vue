<template>
  <MainLayout>
    <div class="booking-detail">
      <!-- Loading -->
      <div v-if="loading && !booking" class="loading-container">
        <PrimeProgressSpinner />
        <p>{{ t('common.loading') }}</p>
      </div>

      <template v-if="booking">
        <PageHeader :title="booking.title" show-back-button>
          <template #title-meta>
<!--            <span class="status-chip" :style="getStatusStyle(booking.status)">-->
<!--              <i :class="`pi ${getStatusIcon(booking.status)}`" />-->
<!--              <span class="status-chip-label">{{ getStatusLabel(booking.status) }}</span>-->
<!--            </span>-->
          </template>
          <template #actions>
            <button
                v-if="canConfirmDraft"
                class="btn btn-continue-draft"
                :disabled="actionLoading"
                @click="continueDraft"
            >
              <i class="pi pi-arrow-right" />
              {{ t('bookings.continueDraft') }}
            </button>
            <button
                v-if="canConfirmDraft"
                class="btn btn-confirm-draft"
                :disabled="actionLoading"
                @click="showConfirmDraftDialog = true"
            >
              <i class="pi pi-send" />
              {{ t('bookings.confirmDraft') }}
            </button>
            <button
                v-if="canApprove"
                class="btn btn-approve"
                :disabled="actionLoading"
                @click="showApproveDialog = true"
            >
              <i class="pi pi-check" />
              {{ t('bookings.approve') }}
            </button>
            <button
                v-if="canReject"
                class="btn btn-reject"
                :disabled="actionLoading"
                @click="showRejectDialog = true"
            >
              <i class="pi pi-times" />
              {{ t('bookings.reject') }}
            </button>
            <button
                v-if="canEdit"
                class="btn btn-secondary"
                :disabled="actionLoading"
                @click="goToEdit"
            >
              <i class="pi pi-pencil" />
              {{ t('common.edit') }}
            </button>
            <button
                v-if="canDelete"
                class="btn btn-danger"
                :disabled="actionLoading"
                @click="showDeleteDialog = true"
            >
              <i class="pi pi-trash" />
              {{ t('common.delete') }}
            </button>
          </template>
        </PageHeader>

        <!-- Content Grid -->
        <div class="content-grid">
          <!-- Left Column -->
          <div class="col-main">
            <!-- Card: Information -->
            <div class="card">
              <div class="card-header">
                <i class="pi pi-info-circle" />
                <span>{{ t('bookings.information') }}</span>
              </div>
              <div class="card-body">
                <div class="info-row">
                  <div class="info-cell">
                    <span class="info-label">{{ t('bookings.organizer') }}</span>
                    <span class="info-value">{{ organizerDisplay }}</span>
                  </div>
                  <div class="info-cell">
                    <span class="info-label">{{ t('bookings.createdAt') }}</span>
                    <span class="info-value">{{ formatDateTime(booking.createdAt) }}</span>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-cell">
                    <span class="info-label">{{ t('bookings.updatedAt') }}</span>
                    <span class="info-value">{{ formatDateTime(booking.updatedAt) }}</span>
                  </div>
                  <div v-if="booking.approvedAt" class="info-cell">
                    <span class="info-label">{{ t('bookings.approvedAt') }}</span>
                    <span class="info-value">{{ formatDateTime(booking.approvedAt) }}</span>
                  </div>
                </div>
                <div v-if="booking.approvedById" class="info-row">
                  <div class="info-cell">
                    <span class="info-label">{{ t('bookings.approvedBy') }}</span>
                    <span class="info-value">{{ approvedByDisplay }}</span>
                  </div>
                </div>
                <div v-if="booking.rejectionReason" class="info-row">
                  <div class="info-cell full">
                    <span class="info-label">{{ t('bookings.rejectionReason') }}</span>
                    <span class="info-value text-danger">{{ booking.rejectionReason }}</span>
                  </div>
                </div>
                <div v-if="booking.notes" class="info-row">
                  <div class="info-cell full">
                    <span class="info-label">{{ t('bookings.notes') }}</span>
                    <span class="info-value notes-text">{{ booking.notes }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card: Resources -->
            <div class="card">
              <div class="card-header">
                <i class="pi pi-building" />
                <span>{{ t('bookings.resources') }}</span>
                <span class="badge-count">{{ booking.resources.length }}</span>
              </div>
              <div class="card-body no-padding">
                <div class="resource-list">
                  <div
                      v-for="resource in booking.resources"
                      :key="resource.id"
                      class="resource-item"
                  >
                    <div class="resource-icon">
                      <i class="pi pi-desktop" />
                    </div>
                    <div class="resource-info">
                      <div class="resource-name">{{ getResourceName(resource.resourceId) }}</div>
                      <div class="resource-meta">
                        <span><i class="pi pi-map-marker" /> {{ getPlantName(resource.plantId) }}</span>
                      </div>
                    </div>
                    <div class="resource-time">
                      <div class="time-range">
                        <i class="pi pi-clock" />
                        {{ formatTime(resource.startTime) }} — {{ formatTime(resource.endTime) }}
                      </div>
                      <div class="duration-badge">
                        {{ calculateDuration(resource.startTime, resource.endTime) }}
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="bookingCustomFieldEntries.length > 0" class="res-cf-section">
                  <div class="res-cf-header">
                    <i class="pi pi-sliders-h" />
                    <span>{{ t('bookings.customFields') }}</span>
                    <button type="button" class="cf-toggle-btn" @click="showResourceCF = !showResourceCF">
                      <i :class="showResourceCF ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" />
                      {{ showResourceCF ? t('bookings.hideCustomFields') : t('bookings.showCustomFields') }}
                    </button>
                  </div>
                  <dl v-show="showResourceCF" class="cf-grid">
                    <div v-for="entry in bookingCustomFieldEntries" :key="entry.key" class="cf-item">
                      <dt class="cf-key">{{ entry.label }}</dt>
                      <dd class="cf-val" :class="{ 'cf-val-empty': entry.displayItems.length === 0 }">
                        <template v-if="entry.displayItems.length > 1">
                          <span v-for="item in entry.displayItems" :key="`${entry.key}-${item}`" class="cf-pill">{{ item }}</span>
                        </template>
                        <template v-else>{{ entry.displayItems[0] || t('bookings.notFilled') }}</template>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            <!-- Card: Participants -->
            <div class="card">
              <div class="card-header card-header-between">
                <div class="card-header-title">
                  <i class="pi pi-users" />
                  <span>{{ t('bookings.participants') }}</span>
                </div>
                <div class="card-header-actions">
                  <span class="badge-count badge-count-inline">
                    <template v-if="hasActiveParticipantFilter">{{ filteredParticipants.length }} / {{ booking.participants.length }}</template>
                    <template v-else>{{ booking.participants.length }}</template>
                  </span>
                  <button
                      v-if="canManageParticipants"
                      type="button"
                      class="btn-header-add"
                      :disabled="actionLoading || addingParticipant"
                      @click="openAddParticipantDialog"
                  >
                    <i class="pi pi-user-plus" />
                    {{ t('bookings.addParticipantBtn') }}
                  </button>
                </div>
              </div>
              <div class="card-body">
                <div v-if="booking.participants.length === 0" class="empty-state-inline">
                  <i class="pi pi-users" />
                  <span>{{ t('bookings.noParticipants') }}</span>
                </div>
                <template v-else>
                  <!-- Premium filter bar: search + segmented status + type pills -->
                  <div class="pp-tools">
                    <div class="pp-tools-top">
                      <div class="pp-search">
                        <i class="pi pi-search" />
                        <input
                            type="text"
                            v-model="participantSearch"
                            :placeholder="t('bookings.searchParticipantsPlaceholder')"
                        />
                        <button
                            v-if="participantSearch"
                            type="button"
                            class="pp-search-clear"
                            :title="t('common.clear')"
                            @click="participantSearch = ''"
                        >
                          <i class="pi pi-times" />
                        </button>
                      </div>

                      <div v-if="statusFilterOptions.length > 1" class="pp-segmented" role="group">
                        <button
                            v-for="opt in statusFilterOptions"
                            :key="`status-${opt.key}`"
                            type="button"
                            class="pp-seg-btn"
                            :class="{ active: participantStatusFilter === opt.key }"
                            @click="participantStatusFilter = opt.key"
                        >
                          <span class="pp-seg-label">{{ opt.label }}</span>
                          <span class="pp-seg-count">{{ opt.count }}</span>
                        </button>
                      </div>
                    </div>

                    <div v-if="typeFilterOptions.length > 2" class="pp-tools-types">
                      <span class="pp-tools-types-label">{{ t('resources.type') }}</span>
                      <button
                          v-for="opt in typeFilterOptions"
                          :key="`type-${opt.key}`"
                          type="button"
                          class="pp-type-pill"
                          :class="{ active: participantTypeFilter === opt.key }"
                          @click="participantTypeFilter = opt.key"
                      >
                        <span class="pp-type-dot" :style="{ background: typeFilterColor(opt.key) }" />
                        <span>{{ opt.label }}</span>
                        <span class="pp-type-count">{{ opt.count }}</span>
                      </button>
                    </div>
                  </div>

                  <div v-if="filteredParticipants.length === 0" class="empty-state-inline pp-empty-filter">
                    <i class="pi pi-filter-slash" />
                    <span>{{ t('bookings.noParticipantsForFilter') }}</span>
                    <button type="button" class="pp-filter-reset-link" @click="resetParticipantFilters">
                      {{ t('calendar.resetFilters') }}
                    </button>
                  </div>
                  <ul v-else class="participants-list">
                    <li
                        v-for="participant in filteredParticipants"
                        :key="participant.id"
                        class="pp-row"
                    >
                    <div class="pp-left">
                      <div class="pp-avatar-wrap">
                        <div class="pp-avatar" :style="{ background: avatarColorFor(getParticipantDisplayName(participant)) }">
                          {{ participantInitials(getParticipantDisplayName(participant)) }}
                        </div>
                        <span
                            v-if="participant.isPresent"
                            class="pp-presence"
                            :title="t('bookings.checkIn')"
                        >
                          <i class="pi pi-check" />
                        </span>
                      </div>

                      <div class="pp-info">
                        <div class="pp-name-line">
                          <span class="pp-name">{{ getParticipantDisplayName(participant) }}</span>
                          <span v-if="participant.isGroupLeader" class="pp-leader" :title="t('bookings.coordinator')">
                            <i class="pi pi-star-fill" />
                          </span>
                        </div>
                        <div class="pp-meta-line">
                          <span class="pp-role" :class="participant.isInternal ? 'pp-role-internal' : 'pp-role-visitor'">
                            <i :class="participant.isInternal ? 'pi pi-id-card' : 'pi pi-user'" />
                            {{ getRoleLabel(participant) }}
                          </span>
                          <template v-if="getParticipantEmail(participant)">
                            <span class="pp-dot" aria-hidden="true">·</span>
                            <a :href="`mailto:${getParticipantEmail(participant)}`" class="pp-email">
                              <i class="pi pi-envelope" />{{ getParticipantEmail(participant) }}
                            </a>
                          </template>
                        </div>

                        <div
                            v-if="getParticipantCustomFieldEntries(participant).length > 0"
                            class="pp-fields"
                        >
                          <button
                              type="button"
                              class="pp-cf-toggle-btn"
                              @click="toggleParticipantCF(participant.id)"
                          >
                            <i :class="expandedParticipantCF.has(participant.id) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" />
                            {{ expandedParticipantCF.has(participant.id) ? t('bookings.hideCustomFields') : t('bookings.showCustomFields') }}
                          </button>
                          <dl v-show="expandedParticipantCF.has(participant.id)" class="pp-fields-list">
                            <div
                                v-for="entry in getParticipantCustomFieldEntries(participant)"
                                :key="`${participant.id}-${entry.key}`"
                                class="pp-field-row"
                            >
                              <dt class="pp-field-label">{{ entry.label }}</dt>
                              <dd class="pp-field-value" :class="{ 'pp-field-empty': entry.displayItems.length === 0 }">
                                <template v-if="entry.displayItems.length > 1">
                                  <span
                                      v-for="item in entry.displayItems"
                                      :key="`${participant.id}-${entry.key}-${item}`"
                                      class="pp-chip"
                                  >{{ item }}</span>
                                </template>
                                <template v-else>
                                  {{ entry.displayItems[0] || t('bookings.notFilled') }}
                                </template>
                              </dd>
                            </div>
                          </dl>
                        </div>

                        <div
                            v-if="isCurrentUserParticipant(participant) && participant.inviteStatus === 'Pending' && booking && !['Completed','Cancelled','Rejected'].includes(booking.status)"
                            class="pp-respond"
                        >
                          <PrimeButton
                              :label="t('bookings.acceptParticipation')"
                              icon="pi pi-check"
                              size="small"
                              class="btn-accept-participation"
                              :loading="respondingParticipantId === participant.id"
                              @click="handleRespondToParticipation(participant.id, true)"
                          />
                          <PrimeButton
                              :label="t('bookings.declineParticipation')"
                              icon="pi pi-times"
                              size="small"
                              severity="secondary"
                              outlined
                              :loading="respondingParticipantId === participant.id"
                              @click="handleRespondToParticipation(participant.id, false)"
                          />
                        </div>
                      </div>
                    </div>

                    <div class="pp-right">
                      <button
                          v-if="participant.qrCode"
                          type="button"
                          class="pp-qr-btn"
                          :title="t('bookings.qrCode')"
                          @click="showQR(participant)"
                      >
                        <i class="pi pi-qrcode" />
                      </button>
                      <span class="pp-status" :class="`pp-status-${getInviteStatusSeverity(participant.inviteStatus)}`">
                        <span class="pp-status-dot" />
                        {{ t('bookings.inviteStatus.' + participant.inviteStatus.toLowerCase()) || participant.inviteStatus }}
                      </span>
                    </div>
                  </li>
                </ul>
                </template>
              </div>
            </div>

          </div>

          <!-- Right Column (Sidebar) -->
          <div class="col-sidebar">
            <!-- Card: Quick Summary -->
            <div class="card card-summary">
              <div class="card-body">
                <div class="summary-item">
                  <div class="summary-icon status">
                    <i class="pi pi-info-circle" />
                  </div>
                  <div>
                    <span class="summary-label">{{ t('bookings.statusLabel') }}</span>
                    <span class="status-chip" :style="getStatusStyle(booking.status)">
                      <i :class="`pi ${getStatusIcon(booking.status)}`" />
                      <span class="status-chip-label">{{ getStatusLabel(booking.status) }}</span>
                    </span>
                  </div>
                </div>
                <div class="summary-item">
                  <div class="summary-icon resources">
                    <i class="pi pi-building" />
                  </div>
                  <div>
                    <span class="summary-label">{{ t('bookings.resources') }}</span>
                    <span class="summary-value">{{ booking.resources.length }}</span>
                  </div>
                </div>
                <div class="summary-item">
                  <div class="summary-icon participants">
                    <i class="pi pi-users" />
                  </div>
                  <div>
                    <span class="summary-label">{{ t('bookings.participants') }}</span>
                    <span class="summary-value">{{ booking.participants.length }}</span>
                  </div>
                </div>
                <div v-if="booking.isRecurring" class="summary-item">
                  <div class="summary-icon recurring">
                    <i class="pi pi-refresh" />
                  </div>
                  <div>
                    <span class="summary-label">{{ t('bookings.recurrence') }}</span>
                    <span class="summary-value">{{ booking.recurrenceRule || t('common.yes') }}</span>
                  </div>
                </div>
                <div v-if="firstResource" class="summary-item">
                  <div class="summary-icon time">
                    <i class="pi pi-clock" />
                  </div>
                  <div>
                    <span class="summary-label">{{ t('bookings.date') }}</span>
                    <span class="summary-value">{{ formatDate(firstResource.startTime) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card: Timeline -->
            <div class="card">
              <div class="card-header">
                <i class="pi pi-history" />
                <span>{{ t('bookings.timeline') }}</span>
              </div>
              <div class="card-body">
                <div class="mini-timeline">
                  <div class="tl-event">
                    <div class="tl-dot created"></div>
                    <div class="tl-body">
                      <span class="tl-title">{{ t('bookings.created') }}</span>
                      <span class="tl-time">{{ formatDateTime(booking.createdAt) }}</span>
                    </div>
                  </div>
                  <div v-if="booking.approvedAt" class="tl-event">
                    <div class="tl-dot approved"></div>
                    <div class="tl-body">
                      <span class="tl-title">{{ t('bookings.approved') }}</span>
                      <span class="tl-time">{{ formatDateTime(booking.approvedAt) }}</span>
                    </div>
                  </div>
                  <div v-if="booking.status === 'Cancelled'" class="tl-event">
                    <div class="tl-dot cancelled"></div>
                    <div class="tl-body">
                      <span class="tl-title">{{ t('bookings.cancelled') }}</span>
                      <span class="tl-time">{{ formatDateTime(booking.updatedAt) }}</span>
                    </div>
                  </div>
                  <div v-if="booking.status === 'Rejected'" class="tl-event">
                    <div class="tl-dot rejected"></div>
                    <div class="tl-body">
                      <span class="tl-title">{{ t('bookings.rejected') }}</span>
                      <span class="tl-time">{{ formatDateTime(booking.updatedAt) }}</span>
                      <span v-if="booking.rejectionReason" class="tl-detail">{{ booking.rejectionReason }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Master Booking Link -->
            <div v-if="booking.masterBookingId" class="card">
              <div class="card-body">
                <div class="sidebar-field">
                  <span class="info-label">{{ t('bookings.masterBookingLabel') }}</span>
                  <router-link
                      :to="{ name: 'BookingDetail', params: { id: booking.masterBookingId } }"
                      class="link"
                  >
                    {{ t('bookings.goToMasterBooking') }}
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ========== DIALOGS ========== -->

      <!-- QR Code Dialog (premium) -->
      <AppDialog
          v-model:visible="showQRDialog"
          :header="t('bookings.qrCode')"
          icon="pi pi-qrcode"
          severity="primary"
          size="md"
          class="qr-dialog"
          @show="renderQRCode"
      >
        <div class="qr-premium">
          <!-- Scanner-style framed QR -->
          <div class="qr-frame">
            <span class="qr-corner qr-corner-tl" />
            <span class="qr-corner qr-corner-tr" />
            <span class="qr-corner qr-corner-bl" />
            <span class="qr-corner qr-corner-br" />
            <canvas ref="qrCanvas" class="qr-canvas-premium"></canvas>
          </div>

          <!-- Participant context -->
          <div v-if="selectedQRParticipant" class="qr-participant">
            <div
                class="qr-avatar"
                :style="{ background: avatarColorFor(getParticipantDisplayName(selectedQRParticipant)) }"
            >
              {{ participantInitials(getParticipantDisplayName(selectedQRParticipant)) }}
            </div>
            <div class="qr-participant-text">
              <span class="qr-participant-name">{{ getParticipantDisplayName(selectedQRParticipant) }}</span>
              <span class="qr-participant-meta">
                <span class="qr-participant-role" :class="selectedQRParticipant.isInternal ? 'qr-role-internal' : 'qr-role-visitor'">
                  {{ getRoleLabel(selectedQRParticipant) }}
                </span>
                <template v-if="getParticipantEmail(selectedQRParticipant)">
                  <span class="qr-meta-dot">·</span>
                  <span class="qr-participant-email">{{ getParticipantEmail(selectedQRParticipant) }}</span>
                </template>
              </span>
            </div>
          </div>

          <!-- Copyable code -->
          <div class="qr-code-row">
            <div class="qr-code-input">
              <span class="qr-code-label">{{ t('bookings.qrCodeLabel') }}</span>
              <code class="qr-code-text-mono">{{ selectedQRCode }}</code>
            </div>
            <button
                type="button"
                class="qr-copy-btn"
                :title="t('common.copy')"
                @click="copyQRCode"
            >
              <i class="pi pi-copy" />
            </button>
          </div>

          <!-- Hint -->
          <div class="qr-hint">
            <i class="pi pi-info-circle" />
            <span>{{ t('bookings.qrHint') }}</span>
          </div>
        </div>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="showQRDialog = false">
            <i class="pi pi-times" />{{ t('common.close') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" @click="downloadQR">
            <i class="pi pi-download" />{{ t('bookings.downloadQr') }}
          </button>
        </template>
      </AppDialog>

      <!-- Confirm Draft Dialog -->
      <AppDialog
          v-model:visible="showConfirmDraftDialog"
          :header="t('bookings.confirmDraftTitle')"
          icon="pi pi-send"
          severity="primary"
          size="sm"
      >
        <p class="dialog-msg">{{ t('bookings.confirmDraftMsg') }}</p>
        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" :disabled="actionLoading" @click="showConfirmDraftDialog = false">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="actionLoading" @click="handleConfirmDraft">
            <i :class="actionLoading ? 'pi pi-spin pi-spinner' : 'pi pi-send'" />{{ t('bookings.confirmDraft') }}
          </button>
        </template>
      </AppDialog>

      <!-- Approve Dialog -->
      <AppDialog
          v-model:visible="showApproveDialog"
          :header="t('bookings.approveTitle')"
          icon="pi pi-check-circle"
          severity="success"
          size="sm"
      >
        <p>{{ t('bookings.confirmApprove') }}</p>
        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" :disabled="actionLoading" @click="showApproveDialog = false">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="actionLoading" @click="handleApprove">
            <i :class="actionLoading ? 'pi pi-spin pi-spinner' : 'pi pi-check'" />{{ t('bookings.approve') }}
          </button>
        </template>
      </AppDialog>

      <!-- Reject Dialog -->
      <AppDialog
          v-model:visible="showRejectDialog"
          :header="t('bookings.rejectTitle')"
          icon="pi pi-times-circle"
          severity="danger"
          size="md"
      >
        <p>{{ t('bookings.confirmReject') }}</p>
        <div class="form-field" style="margin-top: 0.75rem;">
          <label>{{ t('bookings.rejectionReason') }} ({{ t('common.optional') }})</label>
          <textarea
              v-model="rejectionReason"
              class="reason-textarea"
              rows="3"
              :placeholder="t('bookings.rejectionReasonPlaceholder')"
          ></textarea>
        </div>
        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" :disabled="actionLoading" @click="showRejectDialog = false">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-delete" :disabled="actionLoading" @click="handleReject">
            <i :class="actionLoading ? 'pi pi-spin pi-spinner' : 'pi pi-times'" />{{ t('bookings.reject') }}
          </button>
        </template>
      </AppDialog>

      <!-- Delete Dialog -->
      <!-- Dialog cancellazione - con scope per prenotazioni ricorrenti (--6A.4 DRF) -->
      <AppDialog
          v-model:visible="showDeleteDialog"
          :header="t('bookings.confirmDeleteHeader')"
          icon="pi pi-trash"
          severity="danger"
          size="md"
      >
        <p>{{ t('bookings.confirmDelete') }}</p>
        <p class="dialog-warning">{{ t('bookings.deleteWarning') }}</p>

        <!-- Selezione scope - visibile solo per prenotazioni ricorrenti -->
        <div v-if="booking?.masterBookingId || booking?.isRecurring" class="recurring-scope-selector">
          <p class="scope-label">{{ t('bookings.recurringScope.question') }}</p>
          <div class="scope-options">
            <label
                v-for="opt in recurringScopeOptions"
                :key="opt.value"
                class="scope-option"
                :class="{ active: selectedCancelScope === opt.value }"
            >
              <input
                  type="radio"
                  :value="opt.value"
                  v-model="selectedCancelScope"
                  class="scope-radio"
              />
              <span class="scope-option-text">
                <strong>{{ opt.label }}</strong>
                <small>{{ opt.description }}</small>
              </span>
            </label>
          </div>
        </div>
        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" :disabled="actionLoading" @click="showDeleteDialog = false">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-delete" :disabled="actionLoading" @click="handleDelete">
            <i :class="actionLoading ? 'pi pi-spin pi-spinner' : 'pi pi-trash'" />{{ t('common.delete') }}
          </button>
        </template>
      </AppDialog>

      <AppDialog
          v-model:visible="showAddParticipantDialog"
          :header="t('bookings.addParticipant.header')"
          icon="pi pi-user-plus"
          severity="primary"
          size="md"
      >
        <div class="dlg-form">
          <div class="participant-type-toggle" role="tablist" :aria-label="t('bookings.addParticipant.participantTypeAriaLabel')">
            <button
                type="button"
                class="participant-type-btn"
                :class="{ active: addParticipantForm.kind === 'internal' }"
                :aria-pressed="addParticipantForm.kind === 'internal'"
                @click="addParticipantForm.kind = 'internal'"
            >
              <i class="pi pi-users" />
              {{ t('bookings.addParticipant.internal') }}
            </button>
            <button
                type="button"
                class="participant-type-btn"
                :class="{ active: addParticipantForm.kind === 'external' }"
                :aria-pressed="addParticipantForm.kind === 'external'"
                @click="addParticipantForm.kind = 'external'"
            >
              <i class="pi pi-user" />
              {{ t('bookings.addParticipant.visitor') }}
            </button>
          </div>

          <div v-if="addParticipantForm.kind === 'internal'" class="dlg-field">
            <label class="dlg-label" for="booking-participant-user">{{ t('bookings.addParticipant.internalUserLabel') }}</label>
            <select
                id="booking-participant-user"
                v-model="addParticipantForm.userId"
                class="participant-select"
            >
              <option value="">{{ t('bookings.addParticipant.selectInternalUser') }}</option>
              <option
                  v-for="user in availableInternalUsers"
                  :key="user.id"
                  :value="user.id"
              >
                {{ getUserOptionLabel(user.id) }}
              </option>
            </select>
            <p v-if="availableInternalUsers.length === 0" class="field-help">
              {{ t('bookings.addParticipant.allInternalAlreadyParticipating') }}
            </p>
          </div>

          <template v-else>
            <!-- ── Tipologia visitatore (prima di tutto) ── -->
            <div class="dlg-field">
              <label class="dlg-label" for="booking-participant-type">{{ t('bookings.addParticipant.visitorType') }}</label>
              <select
                  id="booking-participant-type"
                  v-model="addParticipantForm.visitorTypeId"
                  class="participant-select"
              >
                <option value="">{{ t('bookings.addParticipant.noVisitorType') }}</option>
                <option
                    v-for="vt in visitorTypesStore.visitorTypes"
                    :key="vt.id"
                    :value="vt.id"
                >{{ vt.name }}</option>
              </select>
            </div>

            <!-- ── Cerca in rubrica ── -->
            <div class="dlg-field">
              <label class="dlg-label">{{ t('bookings.addParticipant.searchDirectory') }}</label>
              <div class="dir-search-wrap">
                <div class="dir-search-input">
                  <i class="pi pi-search" />
                  <input
                    type="text"
                    v-model="visitorSearchQuery"
                    :placeholder="t('bookings.addParticipant.searchDirectoryPlaceholder')"
                    @input="onVisitorSearchInput"
                    autocomplete="off"
                  />
                  <i v-if="visitorSearchLoading" class="pi pi-spin pi-spinner dir-search-spinner" />
                  <button
                    v-if="visitorSearchQuery"
                    type="button"
                    class="dir-search-clear"
                    @click="visitorSearchQuery = ''; visitorSearchResults = []; showVisitorDropdown = false"
                  ><i class="pi pi-times" /></button>
                </div>
                <div v-if="showVisitorDropdown" class="dir-search-dropdown">
                  <button
                    v-for="v in visitorSearchResults"
                    :key="v.id"
                    type="button"
                    class="dir-search-result"
                    @click="selectVisitorFromDirectory(v)"
                  >
                    <span class="dir-result-name">{{ v.firstName }} {{ v.lastName }}</span>
                    <span v-if="v.email" class="dir-result-email">{{ v.email }}</span>
                  </button>
                </div>
              </div>
              <p class="field-help">{{ t('bookings.addParticipant.directoryHint') }}</p>
            </div>

            <div class="dlg-fields-2">
              <div class="dlg-field">
                <label class="dlg-label" for="booking-participant-firstname">{{ t('bookings.addParticipant.visitorFirstName') }}</label>
                <input
                    id="booking-participant-firstname"
                    v-model="addParticipantForm.visitorFirstName"
                    type="text"
                    class="participant-input"
                    :placeholder="t('bookings.addParticipant.visitorFirstNamePlaceholder')"
                    autocomplete="given-name"
                />
              </div>
              <div class="dlg-field">
                <label class="dlg-label" for="booking-participant-lastname">{{ t('bookings.addParticipant.visitorLastName') }}</label>
                <input
                    id="booking-participant-lastname"
                    v-model="addParticipantForm.visitorLastName"
                    type="text"
                    class="participant-input"
                    :placeholder="t('bookings.addParticipant.visitorLastNamePlaceholder')"
                    autocomplete="family-name"
                />
              </div>
            </div>
            <div class="dlg-field">
              <label class="dlg-label" for="booking-participant-email">{{ t('bookings.addParticipant.visitorEmail') }}</label>
              <input
                  id="booking-participant-email"
                  v-model="addParticipantForm.visitorEmail"
                  type="email"
                  class="participant-input"
                  :placeholder="t('bookings.addParticipant.visitorEmailPlaceholder')"
                  autocomplete="email"
              />
            </div>

            <!-- ── Capogruppo -->
            <label class="checkbox-inline">
              <input v-model="addParticipantForm.isGroupLeader" type="checkbox" />
              <span>{{ t('bookings.capogruppo') }}</span>
            </label>
            <p class="field-help" style="margin-top: -0.25rem;">
              {{ t('bookings.capogruppoHelp') }}
            </p>
          </template>
        </div>
        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" :disabled="addingParticipant" @click="closeAddParticipantDialog">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="dialog-btn dialog-btn-save"
            :disabled="addingParticipant || (addParticipantForm.kind === 'internal' && availableInternalUsers.length === 0)"
            @click="handleAddParticipant"
          >
            <i :class="addingParticipant ? 'pi pi-spin pi-spinner' : 'pi pi-user-plus'" />{{ t('common.add') }}
          </button>
        </template>
      </AppDialog>

    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import QRCode from 'qrcode'
import MainLayout from '@/layouts/MainLayout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import AppDialog from '@/components/common/AppDialog.vue'

import PrimeProgressSpinner from 'primevue/progressspinner'
import { useBookingsStore } from '@/stores/bookings.store'
import { useAuthStore } from '@/stores/auth.store'
import { useResourcesStore } from '@/stores/resources.store'
import { usePlantsStore } from '@/stores/plants.store'
import { useUsersStore } from '@/stores/users.store'
import { useVisitorTypesStore } from '@/stores/visitor-types.store'
import { customFieldsApi } from '@/api/custom-fields.api'
import { visitorsApi } from '@/api/visitors.api'
import type { VisitorSearchResult } from '@/types/visitor'
import { BookingStatus as BookingStatusEnum, InviteStatus as InviteStatusEnum } from '@/types/enums'
import type { InviteStatus } from '@/types/enums'
import { RecurringScope } from '@/types/booking'
import type { AddBookingParticipantDto, BookingParticipant } from '@/types/booking'
import type { FieldLinkResponse } from '@/types/custom-field'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const bookingsStore = useBookingsStore()
const authStore   = useAuthStore()
const resourcesStore = useResourcesStore()
const plantsStore = usePlantsStore()
const usersStore = useUsersStore()
const visitorTypesStore = useVisitorTypesStore()

// State
const loading = ref(false)
const actionLoading = ref(false)
const showConfirmDraftDialog = ref(false)
const showApproveDialog = ref(false)
const showRejectDialog = ref(false)
const showDeleteDialog = ref(false)
const showAddParticipantDialog = ref(false)
const showQRDialog = ref(false)
const selectedQRCode = ref('')
const selectedQRParticipant = ref<BookingParticipant | null>(null)
const rejectionReason = ref('')
const addingParticipant = ref(false)
const respondingParticipantId = ref<string | null>(null)

// Filtri rapidi sulla lista partecipanti — utili all'organizzatore per
// vedere a colpo d'occhio chi si è registrato e che tipologia hanno.
const participantStatusFilter = ref<'all' | string>('all')
const participantTypeFilter   = ref<'all' | string>('all')
const participantSearch       = ref('')

// Scope cancellazione ricorrenze (--6A.4 DRF)
const selectedCancelScope = ref<RecurringScope>(RecurringScope.ThisOnly)
const recurringScopeOptions = [
  {
    value: RecurringScope.ThisOnly,
    label: t('bookings.recurringScope.thisOnly'),
    description: t('bookings.recurringScope.thisOnlyDesc'),
  },
  {
    value: RecurringScope.ThisAndFollowing,
    label: t('bookings.recurringScope.thisAndFollowing'),
    description: t('bookings.recurringScope.thisAndFollowingDesc'),
  },
  {
    value: RecurringScope.AllOccurrences,
    label: t('bookings.recurringScope.allOccurrences'),
    description: t('bookings.recurringScope.allOccurrencesDesc'),
  },
]
const addParticipantForm = ref({
  kind: 'external' as 'internal' | 'external',
  userId: '',
  visitorFirstName: '',
  visitorLastName: '',
  visitorEmail: '',
  visitorTypeId: '',
  isGroupLeader: false,
  visitorContactId: '',
})

// Rubrica search state
const visitorSearchQuery = ref('')
const visitorSearchResults = ref<VisitorSearchResult[]>([])
const visitorSearchLoading = ref(false)
const showVisitorDropdown = ref(false)
let visitorSearchTimer: ReturnType<typeof setTimeout> | null = null

// Custom fields collapsible state
const showResourceCF = ref(false)
const expandedParticipantCF = ref(new Set<string>())

function toggleParticipantCF(participantId: string): void {
  const s = expandedParticipantCF.value
  if (s.has(participantId)) {
    s.delete(participantId)
  } else {
    s.add(participantId)
  }
  expandedParticipantCF.value = new Set(s)
}
const qrCanvas = ref<HTMLCanvasElement | null>(null)
type DetailFieldMeta = {
  label: string
  type: string
}

type DetailFieldEntry = {
  key: string
  label: string
  typeLabel: string
  displayItems: string[]
  display: string
}

const resourceFieldMeta = ref<Record<string, DetailFieldMeta>>({})
const visitorFieldMeta = ref<Record<string, DetailFieldMeta>>({})
const visitorFieldsByType = ref<Record<string, FieldLinkResponse[]>>({})
// Lista deduplicata dei field defs raccolti dalle risorse del booking
// (resource + resource type). Usata per costruire le entry del card
// "Campi personalizzati" garantendo che la label sia sempre il titolo
// del campo (mai l'UUID).
const resourceFieldDefs = ref<FieldLinkResponse[]>([])

// Computed
const booking = computed(() => bookingsStore.currentBooking)
const firstResource = computed(() => booking.value?.resources?.[0] ?? null)
const bookingCustomFieldEntries = computed<DetailFieldEntry[]>(() => {
  if (resourceFieldDefs.value.length === 0) return []
  const values = parseCustomFieldRecord(booking.value?.resourceCustomFieldValues)
  return resourceFieldDefs.value.map((field) => {
    const items = formatFieldItems(values[field.customFieldId])
    return {
      key: field.customFieldId,
      label: field.label,
      typeLabel: getFieldTypeLabel(field.fieldType),
      displayItems: items,
      display: items.join(', '),
    }
  })
})

// Helpers per status chip inline
function getStatusStyle(status: string): Record<string, string> {
  const map: Record<string, { bg: string; color: string }> = {
    Draft:           { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
    PendingApproval: { bg: 'rgba(245,158,11,0.12)',  color: '#b45309' },
    Confirmed:       { bg: 'rgba(16,185,129,0.12)',  color: '#065f46' },
    InProgress:      { bg: 'rgba(37,99,235,0.12)',   color: '#1e40af' },
    Completed:       { bg: 'rgba(16,185,129,0.12)',  color: '#065f46' },
    Cancelled:       { bg: 'rgba(239,68,68,0.12)',   color: '#991b1b' },
    Rejected:        { bg: 'rgba(239,68,68,0.12)',   color: '#991b1b' },
  }
  const s = map[status] ?? { bg: 'rgba(107,114,128,0.12)', color: '#374151' }
  return { background: s.bg, color: s.color }
}

function getStatusIcon(status: string): string {
  const map: Record<string, string> = {
    Draft: 'pi-file-edit', PendingApproval: 'pi-clock',
    Confirmed: 'pi-check-circle', InProgress: 'pi-play',
    Completed: 'pi-check-circle', Cancelled: 'pi-times-circle',
    Rejected: 'pi-times-circle',
  }
  return map[status] ?? 'pi-circle'
}

function getStatusLabel(status: string): string {
  switch (status) {
    case BookingStatusEnum.Draft:           return t('bookings.status.draft')
    case BookingStatusEnum.PendingApproval: return t('bookings.status.pendingApproval')
    case BookingStatusEnum.Confirmed:       return t('bookings.status.confirmed')
    case BookingStatusEnum.InProgress:      return t('bookings.status.inProgress')
    case BookingStatusEnum.Completed:       return t('bookings.status.completed')
    case BookingStatusEnum.Cancelled:       return t('bookings.status.cancelled')
    case BookingStatusEnum.Rejected:        return t('bookings.status.rejected')
    default: return status
  }
}

const canConfirmDraft = computed(() => booking.value?.status === BookingStatusEnum.Draft)
const canApprove = computed(() => booking.value?.status === BookingStatusEnum.PendingApproval)
const canReject = computed(() => booking.value?.status === BookingStatusEnum.PendingApproval)
const canDelete = computed(() =>
    booking.value?.status !== BookingStatusEnum.Cancelled &&
    booking.value?.status !== BookingStatusEnum.Rejected
)
// DRF §7.3 — la prenotazione è modificabile finché non è Completed/Cancelled/
// Rejected né InProgress. Stati editabili: Draft, PendingApproval, Confirmed.
const canEdit = computed(() => {
  const status = booking.value?.status
  return status === BookingStatusEnum.Draft
      || status === BookingStatusEnum.PendingApproval
      || status === BookingStatusEnum.Confirmed
})

/**
 * Risolve l'organizzatore al suo nome leggibile facendo lookup nello
 * usersStore. Fallback in cascata: fullName → email → ID. Mostrato in
 * tutte le card di dettaglio invece dell'ID grezzo.
 */
const organizerDisplay = computed(() => {
  const id = booking.value?.organizerId
  if (!id) return '–'
  const user = usersStore.users.find((u) => u.id === id)
  if (!user) return id
  return user.fullName?.trim() || user.email || id
})

/**
 * Risolve l'utente che ha approvato/rifiutato (se presente).
 */
const approvedByDisplay = computed(() => {
  const id = booking.value?.approvedById
  if (!id) return '–'
  const user = usersStore.users.find((u) => u.id === id)
  if (!user) return id
  return user.fullName?.trim() || user.email || id
})
const canManageParticipants = computed(() =>
    booking.value?.status !== BookingStatusEnum.Completed &&
    booking.value?.status !== BookingStatusEnum.Cancelled &&
    booking.value?.status !== BookingStatusEnum.Rejected
)
const availableInternalUsers = computed(() => {
  const selectedIds = new Set(
      (booking.value?.participants ?? [])
          .filter((participant) => participant.isInternal && participant.userId)
          .map((participant) => participant.userId as string)
  )

  return usersStore.users.filter((user) => user.isActive && !selectedIds.has(user.id))
})

/* ── Quick filters partecipanti ──────────────────────────────────────── */
type FilterChip = { key: string; label: string; count: number }

const statusFilterOptions = computed<FilterChip[]>(() => {
  const all = booking.value?.participants ?? []
  const counts: Record<string, number> = {}
  for (const p of all) counts[p.inviteStatus] = (counts[p.inviteStatus] ?? 0) + 1

  const chips: FilterChip[] = [{ key: 'all', label: t('common.all'), count: all.length }]
  const order: Array<{ key: string; label: string }> = [
    { key: InviteStatusEnum.Registered, label: t('bookings.inviteStatus.registered') },
    { key: InviteStatusEnum.Pending,    label: t('bookings.inviteStatus.pending') },
    { key: InviteStatusEnum.Declined,   label: t('bookings.inviteStatus.declined') },
    { key: InviteStatusEnum.Expired,    label: t('bookings.inviteStatus.expired') },
  ]
  for (const o of order) {
    if ((counts[o.key] ?? 0) > 0) chips.push({ key: o.key, label: o.label, count: counts[o.key] })
  }
  return chips
})

const typeFilterOptions = computed<FilterChip[]>(() => {
  const all = booking.value?.participants ?? []
  const internalCount = all.filter((p) => p.isInternal).length
  const byType = new Map<string, FilterChip>()
  for (const p of all) {
    if (p.isInternal) continue
    const key = p.visitorTypeId ?? '__no_type'
    const label = key === '__no_type'
        ? t('bookings.visitor')
        : (getVisitorTypeName(p.visitorTypeId!) || t('bookings.visitor'))
    const e = byType.get(key)
    if (e) e.count++
    else byType.set(key, { key, label, count: 1 })
  }

  const chips: FilterChip[] = [{ key: 'all', label: t('common.all'), count: all.length }]
  if (internalCount > 0) chips.push({ key: '__internal', label: t('bookings.internal'), count: internalCount })
  // Ordina visitor types per count DESC
  for (const c of [...byType.values()].sort((a, b) => b.count - a.count)) chips.push(c)
  return chips
})

const filteredParticipants = computed(() => {
  let list = booking.value?.participants ?? []
  if (participantStatusFilter.value !== 'all') {
    list = list.filter((p) => p.inviteStatus === participantStatusFilter.value)
  }
  if (participantTypeFilter.value !== 'all') {
    const tf = participantTypeFilter.value
    if (tf === '__internal')      list = list.filter((p) => p.isInternal)
    else if (tf === '__no_type')  list = list.filter((p) => !p.isInternal && !p.visitorTypeId)
    else                          list = list.filter((p) => p.visitorTypeId === tf)
  }
  const q = participantSearch.value.trim().toLowerCase()
  if (q) {
    list = list.filter((p) => {
      const name = getParticipantDisplayName(p).toLowerCase()
      const email = getParticipantEmail(p).toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }
  return list
})

const hasActiveParticipantFilter = computed(() =>
    participantStatusFilter.value !== 'all'
    || participantTypeFilter.value !== 'all'
    || participantSearch.value.trim().length > 0
)

function resetParticipantFilters(): void {
  participantStatusFilter.value = 'all'
  participantTypeFilter.value = 'all'
  participantSearch.value = ''
}

/** Colore-dot per le pill tipo (coerente con palette avatar). */
function typeFilterColor(key: string): string {
  if (key === 'all') return '#cbd5e1'
  if (key === '__internal') return '#4f46e5'
  if (key === '__no_type') return '#94a3b8'
  return avatarColorFor(key)
}

// Helpers
function parseCustomFieldRecord(value: unknown): Record<string, unknown> {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
    } catch {
      return {}
    }
  }

  return typeof value === 'object' ? value as Record<string, unknown> : {}
}

function getFieldTypeLabel(type?: string): string {
  const map: Record<string, string> = {
    Text:           t('customFields.types.text'),
    Number:         t('customFields.types.number'),
    Email:          t('customFields.types.email'),
    Phone:          t('customFields.types.phone'),
    Date:           t('customFields.types.date'),
    Checkbox:       t('customFields.types.checkbox'),
    Boolean:        t('customFields.types.boolean'),
    SingleChoice:   t('customFields.types.singleChoice'),
    MultipleChoice: t('customFields.types.multipleChoice'),
    Dropdown:       t('customFields.types.dropdown'),
  }

  return map[type ?? ''] ?? (type || t('customFields.fallbackFieldName'))
}

function formatFieldItems(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean)
  }
  if (typeof value === 'boolean') {
    return [value ? t('common.yes') : t('common.no')]
  }
  if (typeof value === 'number') {
    return [value.toString()]
  }
  if (value instanceof Date) {
    return [value.toLocaleDateString(locale.value)]
  }
  if (typeof value === 'string') {
    return value.trim().length > 0 ? [value] : []
  }
  if (value && typeof value === 'object') {
    return [JSON.stringify(value)]
  }
  return []
}



/**
 * Per i partecipanti, costruiamo le entry partendo dai field DEFS del
 * visitor type del partecipante (così le label sono SEMPRE definite e
 * mostriamo anche i campi non compilati). Se il visitor type non è stato
 * caricato (o il partecipante è interno → nessun custom field), torna [].
 */
function getParticipantCustomFieldEntries(participant: BookingParticipant): DetailFieldEntry[] {
  if (!participant.visitorTypeId) return []
  const fieldDefs = visitorFieldsByType.value[participant.visitorTypeId] ?? []
  if (fieldDefs.length === 0) return []

  const values = parseCustomFieldRecord(participant.customFieldValues)

  return fieldDefs.map((field) => {
    const items = formatFieldItems(values[field.customFieldId])
    return {
      key: field.customFieldId,
      label: field.label,
      typeLabel: getFieldTypeLabel(field.fieldType),
      displayItems: items,
      display: items.join(', '),
    }
  })
}

function getUserRecord(userId?: string) {
  if (!userId) return null
  return usersStore.users.find((user) => user.id === userId) ?? null
}

function getUserOptionLabel(userId: string): string {
  const user = getUserRecord(userId)
  if (!user) return userId
  return user.fullName?.trim()
      ? `${user.fullName} (${user.email})`
      : user.email
}

function getParticipantDisplayName(participant: BookingParticipant): string {
  if (participant.isInternal) {
    const user = getUserRecord(participant.userId)
    if (user?.fullName?.trim()) return user.fullName
    if (user?.email) return user.email
  }

  const fullName = `${participant.visitorFirstName ?? ''} ${participant.visitorLastName ?? ''}`.trim()
  return fullName || participant.userId || '–'
}

function participantInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Stessa palette di CalendarView per uniformità: tinte solide su base
// indigo/viola (NO gradient verdi/arancioni). Hash deterministico sul nome.
const AVATAR_COLORS = [
  '#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#2563eb', '#0d9488',
]

function avatarColorFor(seed: string): string {
  if (!seed) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getParticipantEmail(participant: BookingParticipant): string {
  if (participant.isInternal) {
    return getUserRecord(participant.userId)?.email || ''
  }

  return participant.visitorEmail || ''
}

function getVisitorTypeName(typeId?: string | null): string {
  if (!typeId) return ''
  return visitorTypesStore.visitorTypeById(typeId)?.name ?? ''
}

/**
 * Etichetta del badge ruolo: per i visitatori mostra il NOME DEL TIPO
 * (es. "Cliente", "Fornitore") che è informazione più utile del generico
 * "Visitatore". Fallback su "Visitatore" solo se il tipo è assente.
 */
function getRoleLabel(participant: BookingParticipant): string {
  if (participant.isInternal) return t('bookings.internal')
  const typeName = getVisitorTypeName(participant.visitorTypeId)
  return typeName || t('bookings.visitor')
}

function getPlantName(plantId: string): string {
  return plantsStore.plantById(plantId)?.name || plantId
}

function getResourceName(resourceId: string): string {
  return resourcesStore.resourceById(resourceId)?.name || resourceId
}

function getInviteStatusSeverity(status: InviteStatus | string): string {
  const map: Record<string, string> = {
    [InviteStatusEnum.Pending]: 'warning',
    [InviteStatusEnum.Registered]: 'success',
    [InviteStatusEnum.Declined]: 'danger',
    [InviteStatusEnum.Expired]: 'secondary',
  }
  return map[status] || 'secondary'
}

function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '–'
  return new Date(dateStr).toLocaleString(locale.value, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function calculateDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function mapFieldMeta(fields: FieldLinkResponse[]): Record<string, DetailFieldMeta> {
  return Object.fromEntries(
      fields.map((field) => [
        field.customFieldId,
        {
          label: field.label,
          type: field.fieldType,
        },
      ])
  )
}

async function loadCustomFieldMetadata(): Promise<void> {
  if (!booking.value) return

  const resourceMetaEntries: Record<string, DetailFieldMeta> = {}
  const visitorMetaEntries: Record<string, DetailFieldMeta> = {}
  // Dedup per customFieldId: lo stesso campo può essere collegato sia
  // alla resource sia al suo resource type — ne teniamo una sola entry.
  const resourceFieldDefMap = new Map<string, FieldLinkResponse>()

  for (const resourceBooking of booking.value.resources) {
    try {
      const resourceLinks = await customFieldsApi.getResourceLinks(resourceBooking.resourceId)
      Object.assign(resourceMetaEntries, mapFieldMeta(resourceLinks))
      for (const link of resourceLinks) resourceFieldDefMap.set(link.customFieldId, link)
    } catch (error) {
      console.error(`Failed to load resource custom field metadata for ${resourceBooking.resourceId}:`, error)
    }

    const resource = resourcesStore.resourceById(resourceBooking.resourceId)
    if (!resource) continue

    try {
      const resourceTypeLinks = await customFieldsApi.getResourceTypeLinks(resource.resourceTypeId)
      Object.assign(resourceMetaEntries, mapFieldMeta(resourceTypeLinks))
      for (const link of resourceTypeLinks) {
        if (!resourceFieldDefMap.has(link.customFieldId)) resourceFieldDefMap.set(link.customFieldId, link)
      }
    } catch (error) {
      console.error(`Failed to load resource type custom field metadata for ${resource.resourceTypeId}:`, error)
    }
  }

  const visitorTypeIds = new Set(
      booking.value.participants
          .map((participant) => participant.visitorTypeId)
          .filter((value): value is string => !!value)
  )

  const fieldsByType: Record<string, FieldLinkResponse[]> = {}

  for (const visitorTypeId of visitorTypeIds) {
    try {
      const visitorTypeLinks = await customFieldsApi.getVisitorTypeLinks(visitorTypeId)
      fieldsByType[visitorTypeId] = visitorTypeLinks
      Object.assign(visitorMetaEntries, mapFieldMeta(visitorTypeLinks))
    } catch (error) {
      console.error(`Failed to load visitor type custom field metadata for ${visitorTypeId}:`, error)
    }
  }

  resourceFieldMeta.value = resourceMetaEntries
  visitorFieldMeta.value = visitorMetaEntries
  visitorFieldsByType.value = fieldsByType
  resourceFieldDefs.value = Array.from(resourceFieldDefMap.values())
}

async function showQR(participant: BookingParticipant) {
  if (!participant.qrCode) return
  selectedQRCode.value = participant.qrCode
  selectedQRParticipant.value = participant
  showQRDialog.value = true
  await renderQRCode()
}

async function copyQRCode(): Promise<void> {
  if (!selectedQRCode.value) return
  try {
    await navigator.clipboard.writeText(selectedQRCode.value)
    toast.add({
      severity: 'success',
      summary: t('common.copied'),
      detail: t('bookings.qrCodeCopied'),
      life: 2000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('common.copyError'),
      life: 3000,
    })
  }
}

async function renderQRCode(): Promise<void> {
  if (!qrCanvas.value || !selectedQRCode.value) return

  try {
    await QRCode.toCanvas(qrCanvas.value, selectedQRCode.value, {
      width: 224,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff',
      },
    })
  } catch (error) {
    console.error('Failed to render QR code:', error)
  }
}

function resetAddParticipantForm(): void {
  addParticipantForm.value = {
    kind: 'external',
    userId: '',
    visitorFirstName: '',
    visitorLastName: '',
    visitorEmail: '',
    visitorTypeId: '',
    isGroupLeader: false,
    visitorContactId: '',
  }
  visitorSearchQuery.value = ''
  visitorSearchResults.value = []
  showVisitorDropdown.value = false
}

function onVisitorSearchInput() {
  if (visitorSearchTimer) clearTimeout(visitorSearchTimer)
  const q = visitorSearchQuery.value.trim()
  if (q.length < 2) {
    visitorSearchResults.value = []
    showVisitorDropdown.value = false
    return
  }
  visitorSearchTimer = setTimeout(async () => {
    visitorSearchLoading.value = true
    try {
      visitorSearchResults.value = await visitorsApi.search(q, 8)
      showVisitorDropdown.value = visitorSearchResults.value.length > 0
    } catch {
      visitorSearchResults.value = []
      showVisitorDropdown.value = false
    } finally {
      visitorSearchLoading.value = false
    }
  }, 300)
}

function selectVisitorFromDirectory(v: VisitorSearchResult) {
  addParticipantForm.value.visitorFirstName = v.firstName
  addParticipantForm.value.visitorLastName = v.lastName
  addParticipantForm.value.visitorEmail = v.email || ''
  addParticipantForm.value.visitorTypeId = v.visitorTypeId || ''
  addParticipantForm.value.visitorContactId = v.id
  visitorSearchQuery.value = ''
  visitorSearchResults.value = []
  showVisitorDropdown.value = false
}

async function openAddParticipantDialog(): Promise<void> {
  if (usersStore.users.length === 0) {
    try {
      await usersStore.fetchAll()
    } catch (error) {
      console.error('Failed to load users for participant dialog:', error)
    }
  }

  resetAddParticipantForm()
  showAddParticipantDialog.value = true
}

function closeAddParticipantDialog(): void {
  showAddParticipantDialog.value = false
  resetAddParticipantForm()
}

function downloadQR(): void {
  if (!qrCanvas.value) return
  const link = document.createElement('a')
  link.href = qrCanvas.value.toDataURL('image/png')
  link.download = `qr-code-${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Watch for QR dialog opening
watch(showQRDialog, async (isVisible) => {
  if (isVisible) {
    await renderQRCode()
  } else {
    selectedQRParticipant.value = null
    selectedQRCode.value = ''
  }
})

// ===== ACTION HANDLERS =====
function continueDraft(): void {
  const id = route.params.id as string
  router.push({ name: 'BookingWizard', query: { draftId: id } })
}

/**
 * Apre il wizard in modalità modifica (DRF §7.3). Stessa rotta del
 * "continueDraft" — il wizard discrimina lo stato (Draft → conferma,
 * Confirmed/PendingApproval → solo update). Il backend
 * BookingService.UpdateAsync rifiuta automaticamente Completed/Cancelled/
 * Rejected/InProgress, quindi il pulsante è già nascosto via canEdit.
 */
function goToEdit(): void {
  const id = route.params.id as string
  router.push({ name: 'BookingWizard', query: { draftId: id } })
}

async function handleConfirmDraft(): Promise<void> {
  const id = route.params.id as string
  try {
    actionLoading.value = true
    // La conferma della bozza la porta in attesa di approvazione
    await bookingsStore.changeBookingStatus(id, {
      newStatus: BookingStatusEnum.PendingApproval,
    })
    showConfirmDraftDialog.value = false
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('bookings.confirmDraftSuccess'),
      life: 3000,
    })
    await bookingsStore.fetchBookingById(id)
  } catch (err) {
    console.error('Failed to confirm draft booking:', err)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('bookings.confirmDraftError'),
      life: 5000,
    })
  } finally {
    actionLoading.value = false
  }
}

async function handleApprove(): Promise<void> {
  const id = route.params.id as string
  try {
    actionLoading.value = true
    // --7.2 DRF: PendingApproval --- Confirmed (non esiste lo stato "Approved" separato)
    await bookingsStore.changeBookingStatus(id, {
      newStatus: BookingStatusEnum.Confirmed,
    })
    showApproveDialog.value = false
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('bookings.approveSuccess'),
      life: 3000,
    })
    await bookingsStore.fetchBookingById(id)
  } catch (err) {
    console.error('Failed to approve booking:', err)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('bookings.approveError'),
      life: 5000,
    })
  } finally {
    actionLoading.value = false
  }
}

async function handleReject(): Promise<void> {
  const id = route.params.id as string
  try {
    actionLoading.value = true
    await bookingsStore.changeBookingStatus(id, {
      newStatus: BookingStatusEnum.Rejected,
      reason: rejectionReason.value || undefined,
    })
    showRejectDialog.value = false
    rejectionReason.value = ''
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('bookings.rejectSuccess'),
      life: 3000,
    })
    await bookingsStore.fetchBookingById(id)
  } catch (err) {
    console.error('Failed to reject booking:', err)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('bookings.rejectError'),
      life: 5000,
    })
  } finally {
    actionLoading.value = false
  }
}


/** Verifica se l'utente corrente - il partecipante interno indicato. */
function isCurrentUserParticipant(participant: BookingParticipant): boolean {
  if (!participant.isInternal || !participant.userId) return false
  const currentUserId = authStore.user?.userId
  return !!currentUserId && participant.userId === currentUserId
}

async function handleRespondToParticipation(participantId: string, accept: boolean): Promise<void> {
  const bookingId = route.params.id as string
  respondingParticipantId.value = participantId
  try {
    await bookingsStore.respondToParticipation(bookingId, participantId, accept)
    toast.add({
      severity: accept ? 'success' : 'info',
      summary: accept ? t('bookings.participationAccepted') : t('bookings.participationDeclined'),
      life: 3000,
    })
    // Ricarica la prenotazione per aggiornare lo stato
    await bookingsStore.fetchBookingById(bookingId)
  } catch (err) {
    toast.add({ severity: 'error', summary: t('common.error'), detail: String(err), life: 4000 })
  } finally {
    respondingParticipantId.value = null
  }
}

async function handleDelete(): Promise<void> {
  const id = route.params.id as string
  try {
    actionLoading.value = true
    // Passa lo scope solo se la prenotazione - ricorrente, altrimenti ThisOnly di default
    const isRecurring = booking.value?.masterBookingId || booking.value?.isRecurring
    await bookingsStore.cancelBooking(id, isRecurring ? { scope: selectedCancelScope.value } : undefined)
    showDeleteDialog.value = false
    // Reset scope per la prossima apertura del dialog
    selectedCancelScope.value = RecurringScope.ThisOnly
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('bookings.deleteSuccess'),
      life: 3000,
    })
    router.push({ name: 'BookingsList' })
  } catch (err) {
    console.error('Failed to delete booking:', err)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('bookings.deleteError'),
      life: 5000,
    })
  } finally {
    actionLoading.value = false
  }
}

async function handleAddParticipant(): Promise<void> {
  if (!booking.value) return

  const isInternal = addParticipantForm.value.kind === 'internal'
  const normalizedEmail = addParticipantForm.value.visitorEmail.trim().toLowerCase()

  if (isInternal && !addParticipantForm.value.userId) {
    toast.add({
      severity: 'warn',
      summary: t('bookings.participantIncomplete'),
      detail: t('bookings.selectInternalUserToAdd'),
      life: 3500,
    })
    return
  }

  if (!isInternal) {
    if (!addParticipantForm.value.visitorFirstName.trim()
        || !addParticipantForm.value.visitorLastName.trim()
        || !normalizedEmail) {
      toast.add({
        severity: 'warn',
        summary: t('bookings.participantIncomplete'),
        detail: t('bookings.fillVisitorFields'),
        life: 3500,
      })
      return
    }

    if (!normalizedEmail.includes('@')) {
      toast.add({
        severity: 'warn',
        summary: t('bookings.participantIncomplete'),
        detail: t('bookings.invalidVisitorEmail'),
        life: 3500,
      })
      return
    }
  }

  try {
    addingParticipant.value = true

    // DRF §4.3 / §6.4: il "Capogruppo" è una proprietà esclusiva dei
    // visitatori ESTERNI (designato a firmare sicurezza/privacy). Per i
    // partecipanti interni il campo è forzato a false.
    const dto: AddBookingParticipantDto = isInternal
        ? {
          isInternal: true,
          userId: addParticipantForm.value.userId,
          isGroupLeader: false,
        }
        : {
          isInternal: false,
          visitorFirstName: addParticipantForm.value.visitorFirstName.trim(),
          visitorLastName: addParticipantForm.value.visitorLastName.trim(),
          visitorEmail: normalizedEmail,
          visitorTypeId: addParticipantForm.value.visitorTypeId || undefined,
          isGroupLeader: addParticipantForm.value.isGroupLeader,
          visitorContactId: addParticipantForm.value.visitorContactId || undefined,
        }

    const id = route.params.id as string
    await bookingsStore.addParticipant(id, dto)

    closeAddParticipantDialog()
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('bookings.addParticipantBtn'),
      life: 3000,
    })
    await bookingsStore.fetchBookingById(id)
  } catch (err) {
    console.error('Failed to add participant:', err)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: String(err),
      life: 5000,
    })
  } finally {
    addingParticipant.value = false
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────────────────────
onMounted(async () => {
  const id = route.params.id as string
  if (!id) return

  loading.value = true
  try {
    // Carica la prenotazione dall'API (funziona anche con navigazione diretta all'URL)
    await Promise.all([
      bookingsStore.fetchBookingById(id),
      resourcesStore.fetchAllResources(),
      plantsStore.fetchAll(),
      usersStore.fetchAll(),
      visitorTypesStore.fetchAllVisitorTypes(),
    ])

    // Carica i metadati dei campi personalizzati
    await loadCustomFieldMetadata()
  } catch (err) {
    console.error('Failed to load booking:', err)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('bookings.loadError'),
      life: 5000,
    })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped src="./BookingDetailView.css"></style>