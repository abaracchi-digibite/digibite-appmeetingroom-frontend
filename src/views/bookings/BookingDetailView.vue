<template>
  <MainLayout>
    <div class="booking-detail">
      <!-- Loading -->
      <div v-if="loading && !booking" class="loading-container">
        <PrimeProgressSpinner />
        <p>{{ t('common.loading') }}</p>
      </div>

      <template v-if="booking">
        <!-- Top Bar -->
        <div class="top-bar">
          <div class="top-bar-left">
            <button class="btn-icon" @click="goBack" :title="t('common.back')">
              <i class="pi pi-arrow-left" />
            </button>
            <div class="title-group">
              <h1>{{ booking.title }}</h1>
              <span class="status-chip" :style="getStatusStyle(booking.status)">
                  <i :class="`pi ${getStatusIcon(booking.status)}`" />
                  <span class="status-chip-label">{{ getStatusLabel(booking.status) }}</span>
              </span>
            </div>
          </div>
          <div class="top-bar-actions">
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
          </div>
        </div>

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
                  <span class="badge-count badge-count-inline">{{ booking.participants.length }}</span>
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
                <div v-else class="participants-grid">
                  <div
                      v-for="participant in booking.participants"
                      :key="participant.id"
                      class="participant-row"
                  >
                    <div class="participant-avatar">
                      <i class="pi pi-user" />
                    </div>
                    <div class="participant-info">
                      <div class="participant-name">
                        <span>{{ getParticipantDisplayName(participant) }}</span>
                        <span v-if="participant.isGroupLeader" class="leader-tag">
                          <i class="pi pi-star-fill" /> {{ t('bookings.coordinator') }}
                        </span>
                      </div>
                      <div class="participant-meta">
                        <span class="type-label">{{ participant.isInternal ? t('bookings.internal') : t('bookings.visitor') }}</span>
                        <a v-if="getParticipantEmail(participant)" :href="`mailto:${getParticipantEmail(participant)}`" class="email-link">
                          {{ getParticipantEmail(participant) }}
                        </a>
                      </div>
                      <div
                          v-if="getParticipantCustomFieldEntries(participant).length > 0"
                          class="participant-custom-panel"
                      >
                        <div class="participant-custom-head">
                          <i class="pi pi-list" />
                          <span>{{ t('bookings.participantCustomFieldsTitle') }}</span>
                        </div>
                        <div class="participant-custom-values">
                          <div
                              v-for="entry in getParticipantCustomFieldEntries(participant)"
                              :key="`${participant.id}-${entry.key}`"
                              class="participant-custom-item"
                          >
                            <span class="participant-custom-label">{{ entry.label }}</span>
                            <span class="participant-custom-text">{{ entry.display || t('bookings.notFilled') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="participant-status">
                      <PrimeTag
                          :value="participant.inviteStatus"
                          :severity="getInviteStatusSeverity(participant.inviteStatus)"
                          class="invite-tag"
                      />
                      <span v-if="participant.isPresent" class="check-in-badge">
                        <i class="pi pi-check-circle" /> {{ t('bookings.checkIn') }}
                      </span>
                    </div>
                    <div class="participant-actions">
                      <!-- QR Code button -->
                      <button v-if="participant.qrCode" class="btn-icon-sm" @click="showQR(participant.qrCode!)">
                        <i class="pi pi-qrcode" />
                      </button>
                      <!-- Bottoni Accept/Decline (--6.4 DRF): visibili solo al partecipante interno corrente in stato Pending -->
                      <template v-if="isCurrentUserParticipant(participant) && participant.inviteStatus === 'Pending' && booking && !['Completed','Cancelled','Rejected'].includes(booking.status)">
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
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card: Custom Fields -->
            <div v-if="bookingCustomFieldEntries.length > 0" class="card">
              <div class="card-header">
                <i class="pi pi-sliders-h" />
                <span>{{ t('bookings.customFields') }}</span>
              </div>
              <div class="card-body">
                <div class="custom-fields-hero">
                  <div class="custom-fields-hero-copy">
                    <p class="custom-fields-kicker">{{ t('bookings.customFieldsKicker') }}</p>
                    <h3 class="custom-fields-title">{{ t('bookings.customFieldsHeroTitle') }}</h3>
                    <p class="custom-fields-description">{{ t('bookings.customFieldsHeroDesc') }}</p>
                  </div>
                  <span class="custom-fields-count">{{ bookingCustomFieldEntries.length }}</span>
                </div>

                <div class="custom-fields-grid">
                  <article
                      v-for="entry in bookingCustomFieldEntries"
                      :key="entry.key"
                      class="field-card"
                  >
                    <span class="field-card-eyebrow">{{ t('bookings.customFieldEyebrow') }}</span>
                    <div class="field-card-head">
                      <span class="field-key">{{ entry.label }}</span>
                      <span class="field-type">{{ entry.typeLabel }}</span>
                    </div>
                    <div v-if="entry.displayItems.length > 1" class="field-value-list">
                      <span class="field-value-label">{{ t('bookings.selectedValues') }}</span>
                      <div class="field-value-wrap">
                        <span
                            v-for="item in entry.displayItems"
                            :key="`${entry.key}-${item}`"
                            class="field-value-chip"
                        >
                          {{ item }}
                        </span>
                      </div>
                    </div>
                    <div v-else class="field-value-block" :class="{ empty: entry.displayItems.length === 0 }">
                      <span class="field-value-label">{{ t('bookings.valueLabel') }}</span>
                      <span class="field-value">{{ entry.displayItems[0] || t('bookings.notFilled') }}</span>
                    </div>
                  </article>
                </div>
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

      <!-- QR Code Dialog -->
      <PrimeDialog
          v-model:visible="showQRDialog"
          :header="t('bookings.qrCode')"
          modal
          :style="{ width: '320px' }"
          @show="renderQRCode"
      >
        <div class="qr-container">
          <canvas ref="qrCanvas" class="qr-canvas"></canvas>
          <p class="qr-code-text">{{ selectedQRCode }}</p>
          <PrimeButton :label="t('bookings.downloadQr')" icon="pi pi-download" @click="downloadQR" size="small" class="w-full" />
        </div>
      </PrimeDialog>

      <!-- Confirm Draft Dialog -->
      <PrimeDialog
          v-model:visible="showConfirmDraftDialog"
          :header="t('bookings.confirmDraftTitle')"
          modal
          :style="{ width: '450px' }"
      >
        <div class="dialog-body">
          <div class="dialog-icon approve">
            <i class="pi pi-send" />
          </div>
          <p class="dialog-msg">{{ t('bookings.confirmDraftMsg') }}</p>
        </div>
        <template #footer>
          <PrimeButton
              :label="t('common.cancel')"
              icon="pi pi-times"
              text
              @click="showConfirmDraftDialog = false"
          />
          <PrimeButton
              :label="t('bookings.confirmDraft')"
              icon="pi pi-send"
              :loading="actionLoading"
              class="dialog-btn-save"
              @click="handleConfirmDraft"
          />
        </template>
      </PrimeDialog>

      <!-- Approve Dialog -->
      <PrimeDialog
          v-model:visible="showApproveDialog"
          :header="t('bookings.approveTitle')"
          modal
          :style="{ width: '450px' }"
      >
        <div class="dialog-body">
          <div class="dialog-icon approve">
            <i class="pi pi-check-circle" />
          </div>
          <p>{{ t('bookings.confirmApprove') }}</p>
        </div>
        <template #footer>
          <PrimeButton
              :label="t('common.cancel')"
              severity="secondary"
              text
              @click="showApproveDialog = false"
              :disabled="actionLoading"
          />
          <PrimeButton
              :label="t('bookings.approve')"
              icon="pi pi-check"
              severity="success"
              @click="handleApprove"
              :loading="actionLoading"
          />
        </template>
      </PrimeDialog>

      <!-- Reject Dialog -->
      <PrimeDialog
          v-model:visible="showRejectDialog"
          :header="t('bookings.rejectTitle')"
          modal
          :style="{ width: '500px' }"
      >
        <div class="dialog-body">
          <div class="dialog-icon reject">
            <i class="pi pi-times-circle" />
          </div>
          <p>{{ t('bookings.confirmReject') }}</p>
          <div class="form-field">
            <label>{{ t('bookings.rejectionReason') }} ({{ t('common.optional') }})</label>
            <textarea
                v-model="rejectionReason"
                class="reason-textarea"
                rows="3"
                :placeholder="t('bookings.rejectionReasonPlaceholder')"
            ></textarea>
          </div>
        </div>
        <template #footer>
          <PrimeButton
              :label="t('common.cancel')"
              severity="secondary"
              text
              @click="showRejectDialog = false"
              :disabled="actionLoading"
          />
          <PrimeButton
              :label="t('bookings.reject')"
              icon="pi pi-times"
              severity="danger"
              @click="handleReject"
              :loading="actionLoading"
          />
        </template>
      </PrimeDialog>

      <!-- Delete Dialog -->
      <!-- Dialog cancellazione - con scope per prenotazioni ricorrenti (--6A.4 DRF) -->
      <PrimeDialog
          v-model:visible="showDeleteDialog"
          :header="t('bookings.confirmDeleteHeader')"
          modal
          :style="{ width: '480px' }"
      >
        <div class="dialog-body">
          <div class="dialog-icon delete">
            <i class="pi pi-trash" />
          </div>
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
        </div>
        <template #footer>
          <PrimeButton
              :label="t('common.cancel')"
              severity="secondary"
              text
              @click="showDeleteDialog = false"
              :disabled="actionLoading"
          />
          <PrimeButton
              :label="t('common.delete')"
              icon="pi pi-trash"
              severity="danger"
              @click="handleDelete"
              :loading="actionLoading"
          />
        </template>
      </PrimeDialog>

      <PrimeDialog
          v-model:visible="showAddParticipantDialog"
          :header="t('bookings.addParticipant.header')"
          modal
          :style="{ width: 'min(560px, 94vw)' }"
      >
        <div class="dialog-body dialog-body-form">
          <p class="dialog-intro">
            {{ t('bookings.addParticipant.intro') }}
          </p>

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

          <div v-if="addParticipantForm.kind === 'internal'" class="form-field">
            <label for="booking-participant-user">{{ t('bookings.addParticipant.internalUserLabel') }}</label>
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
            <div class="form-field">
              <label for="booking-participant-firstname">{{ t('bookings.addParticipant.visitorFirstName') }}</label>
              <input
                  id="booking-participant-firstname"
                  v-model="addParticipantForm.visitorFirstName"
                  type="text"
                  class="participant-input"
                  :placeholder="t('bookings.addParticipant.visitorFirstNamePlaceholder')"
                  autocomplete="given-name"
              />
            </div>
            <div class="form-field">
              <label for="booking-participant-lastname">{{ t('bookings.addParticipant.visitorLastName') }}</label>
              <input
                  id="booking-participant-lastname"
                  v-model="addParticipantForm.visitorLastName"
                  type="text"
                  class="participant-input"
                  :placeholder="t('bookings.addParticipant.visitorLastNamePlaceholder')"
                  autocomplete="family-name"
              />
            </div>
            <div class="form-field">
              <label for="booking-participant-email">{{ t('bookings.addParticipant.visitorEmail') }}</label>
              <input
                  id="booking-participant-email"
                  v-model="addParticipantForm.visitorEmail"
                  type="email"
                  class="participant-input"
                  :placeholder="t('bookings.addParticipant.visitorEmailPlaceholder')"
                  autocomplete="email"
              />
            </div>

            <!-- ── Capogruppo (DRF §4.3 + glossario) ──
                 "Capogruppo: il visitatore designato a firmare i documenti
                  di sicurezza/privacy all'arrivo".
                 Si applica SOLO ai visitatori esterni — i partecipanti
                 interni del tenant non hanno questo concetto. -->
            <label class="checkbox-inline">
              <input v-model="addParticipantForm.isGroupLeader" type="checkbox" />
              <span>{{ t('bookings.capogruppo') }}</span>
            </label>
            <p class="field-help" style="margin-top: -0.5rem;">
              {{ t('bookings.capogruppoHelp') }}
            </p>
          </template>
        </div>
        <template #footer>
          <PrimeButton
              :label="t('common.cancel')"
              severity="secondary"
              text
              @click="closeAddParticipantDialog"
              :disabled="addingParticipant"
          />
          <PrimeButton
              label="Aggiungi"
              icon="pi pi-user-plus"
              @click="handleAddParticipant"
              :loading="addingParticipant"
              :disabled="addParticipantForm.kind === 'internal' && availableInternalUsers.length === 0"
          />
        </template>
      </PrimeDialog>

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
import PrimeButton from 'primevue/button'
import PrimeDialog from 'primevue/dialog'
import PrimeTag from 'primevue/tag'
import PrimeProgressSpinner from 'primevue/progressspinner'
import { useBookingsStore } from '@/stores/bookings.store'
import { useAuthStore } from '@/stores/auth.store'
import { useResourcesStore } from '@/stores/resources.store'
import { usePlantsStore } from '@/stores/plants.store'
import { useUsersStore } from '@/stores/users.store'
import { customFieldsApi } from '@/api/custom-fields.api'
import { BookingStatus as BookingStatusEnum, InviteStatus as InviteStatusEnum } from '@/types/enums'
import type { InviteStatus } from '@/types/enums'
import { RecurringScope } from '@/types/booking'
import type { AddBookingParticipantDto, BookingParticipant } from '@/types/booking'
import type { FieldLinkResponse } from '@/types/custom-field'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const bookingsStore = useBookingsStore()
const authStore   = useAuthStore()
const resourcesStore = useResourcesStore()
const plantsStore = usePlantsStore()
const usersStore = useUsersStore()

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
const rejectionReason = ref('')
const addingParticipant = ref(false)
const respondingParticipantId = ref<string | null>(null)

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
  isGroupLeader: false,
})
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

// Computed
const booking = computed(() => bookingsStore.currentBooking)
const firstResource = computed(() => booking.value?.resources?.[0] ?? null)
const bookingCustomFieldEntries = computed<DetailFieldEntry[]>(() =>
    createDetailFieldEntries(booking.value?.resourceCustomFieldValues, resourceFieldMeta.value)
)

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
    return [value.toLocaleDateString('it-IT')]
  }
  if (typeof value === 'string') {
    return value.trim().length > 0 ? [value] : []
  }
  if (value && typeof value === 'object') {
    return [JSON.stringify(value)]
  }
  return []
}

function createDetailFieldEntries(
    rawValues: unknown,
    metaMap: Record<string, DetailFieldMeta>
): DetailFieldEntry[] {
  const values = parseCustomFieldRecord(rawValues)

  return Object.entries(values).map(([key, value]) => {
    const items = formatFieldItems(value)
    return {
      key,
      label: metaMap[key]?.label || key,
      typeLabel: getFieldTypeLabel(metaMap[key]?.type),
      displayItems: items,
      display: items.join(', '),
    }
  })
}

function getParticipantCustomFieldEntries(participant: BookingParticipant): DetailFieldEntry[] {
  return createDetailFieldEntries(participant.customFieldValues, visitorFieldMeta.value)
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

function getParticipantEmail(participant: BookingParticipant): string {
  if (participant.isInternal) {
    return getUserRecord(participant.userId)?.email || ''
  }

  return participant.visitorEmail || ''
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
  return new Date(dateStr).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('it-IT', {
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

  for (const resourceBooking of booking.value.resources) {
    try {
      const resourceLinks = await customFieldsApi.getResourceLinks(resourceBooking.resourceId)
      Object.assign(resourceMetaEntries, mapFieldMeta(resourceLinks))
    } catch (error) {
      console.error(`Failed to load resource custom field metadata for ${resourceBooking.resourceId}:`, error)
    }

    const resource = resourcesStore.resourceById(resourceBooking.resourceId)
    if (!resource) continue

    try {
      const resourceTypeLinks = await customFieldsApi.getResourceTypeLinks(resource.resourceTypeId)
      Object.assign(resourceMetaEntries, mapFieldMeta(resourceTypeLinks))
    } catch (error) {
      console.error(`Failed to load resource type custom field metadata for ${resource.resourceTypeId}:`, error)
    }
  }

  const visitorTypeIds = new Set(
      [
        booking.value.visitorTypeId,
        ...booking.value.participants.map((participant) => participant.visitorTypeId),
      ].filter((value): value is string => !!value)
  )

  for (const visitorTypeId of visitorTypeIds) {
    try {
      const visitorTypeLinks = await customFieldsApi.getVisitorTypeLinks(visitorTypeId)
      Object.assign(visitorMetaEntries, mapFieldMeta(visitorTypeLinks))
    } catch (error) {
      console.error(`Failed to load visitor type custom field metadata for ${visitorTypeId}:`, error)
    }
  }

  resourceFieldMeta.value = resourceMetaEntries
  visitorFieldMeta.value = visitorMetaEntries
}

async function showQR(qrCode: string) {
  selectedQRCode.value = qrCode
  showQRDialog.value = true
  await renderQRCode()
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

function goBack() {
  router.back()
}

function resetAddParticipantForm(): void {
  addParticipantForm.value = {
    kind: 'external',
    userId: '',
    visitorFirstName: '',
    visitorLastName: '',
    visitorEmail: '',
    isGroupLeader: false,
  }
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
      summary: 'Partecipante incompleto',
      detail: 'Seleziona un utente interno da aggiungere.',
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
        summary: 'Partecipante incompleto',
        detail: 'Inserisci nome, cognome ed email del visitatore.',
        life: 3500,
      })
      return
    }

    if (!normalizedEmail.includes('@')) {
      toast.add({
        severity: 'warn',
        summary: 'Email non valida',
        detail: 'Controlla l’indirizzo email del visitatore.',
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
          visitorTypeId: booking.value?.visitorTypeId,
          isGroupLeader: addParticipantForm.value.isGroupLeader,
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