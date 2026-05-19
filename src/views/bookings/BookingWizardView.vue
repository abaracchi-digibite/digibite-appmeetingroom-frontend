<template>
  <MainLayout>
    <div class="wizard-page">

      <!-- ------ HEADER ------------------------------------------------------------------------------------------------------ -->
      <div class="wizard-header">
        <button class="btn-back btn btn-ghost" @click="$router.back()">
          <i class="pi pi-arrow-left" />
          <span>{{ t('common.back') }}</span>
        </button>
      </div>

      <!-- ------ STEPPER --------------------------------------------------------------------------------------------------- -->
      <div class="stepper-card">
        <div class="stepper-row">
          <template v-for="(step, idx) in steps" :key="idx">
            <!-- connector line BEFORE each circle (except first) -->
            <div
                v-if="idx > 0"
                class="step-line"
                :class="{ done: idx <= activeStep }"
            />
            <!-- step node: circle + label -->
            <div
                class="step-node"
                :class="{
                  done: idx < activeStep,
                  active: idx === activeStep,
                  future: idx > activeStep,
                  clickable: true,
                }"
                role="button"
                tabindex="0"
                :aria-label="t('wizard.goToStep', { n: idx + 1 })"
                @click="goToStep(idx)"
                @keydown.enter.prevent="goToStep(idx)"
                @keydown.space.prevent="goToStep(idx)"
            >
              <div class="step-circle">
                <i v-if="idx < activeStep" class="pi pi-check step-check" />
                <span v-else class="step-num">{{ idx + 1 }}</span>
              </div>
              <span class="step-label">{{ step.label }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- ------ FORM CARD --------------------------------------------------------------------------------------------- -->
      <div class="form-card">

        <!-- --- STEP 1: Sede & Risorsa --- -->
        <div v-if="activeStep === 0" class="step-panel">
          <div class="step-header">
            <div class="step-header-icon"><i class="pi pi-building" /></div>
            <div>
              <h2>{{ t('wizard.step1Title') }}</h2>
              <p>{{ t('wizard.step1Desc') }}</p>
            </div>
          </div>

          <div class="step-body">
            <!-- Booking title -->
            <div class="form-group">
              <label class="field-label required">{{ t('wizard.titleLabel') }}</label>
              <PrimeInputText
                  v-model="formData.title"
                  :placeholder="t('wizard.titlePlaceholder')"
                  class="w-full"
              />
            </div>

            <!-- Plant selector -->
            <div class="form-group">
              <label class="field-label required">{{ t('resources.site') }}</label>
              <PrimeSelect
                  v-model="formData.plantId"
                  :options="plantOptions"
                  option-label="label"
                  option-value="value"
                  :placeholder="t('wizard.selectPlant')"
                  class="w-full"
                  @change="onPlantChange"
              />
            </div>

            <!-- Empty state: no plant selected -->
            <div v-if="!formData.plantId" class="empty-hint">
              <div class="empty-hint-icon"><i class="pi pi-map-marker" /></div>
              <p>{{ t('wizard.noPlantSelected') }}</p>
            </div>

            <!-- Resources grid -->
            <template v-else>
              <div class="form-group" style="margin-top: 1.75rem;">
                <label class="field-label required">{{ t('wizard.resourcesLabel') }}</label>
              </div>

              <!-- loading resources -->
              <div v-if="loadingPlantResources" class="loading-row">
                <i class="pi pi-spin pi-spinner" />
                <span>{{ t('wizard.loadingResources') }}</span>
              </div>

              <!-- no resources for this plant -->
              <div v-else-if="availableResources.length === 0" class="empty-hint">
                <div class="empty-hint-icon"><i class="pi pi-inbox" /></div>
                <p>{{ t('wizard.noResources') }}</p>
              </div>

              <!-- filter bar -->
              <div v-else class="res-filters">
                <div class="res-filter-search">
                  <i class="pi pi-search" />
                  <input
                      v-model="resourceNameFilter"
                      type="text"
                      :placeholder="t('wizard.filterByName')"
                  />
                  <button v-if="resourceNameFilter" type="button" class="res-filter-clear" @click="resourceNameFilter = ''">
                    <i class="pi pi-times" />
                  </button>
                </div>
                <select v-model="resourceTypeFilter" class="res-filter-type">
                  <option value="">{{ t('wizard.allTypes') }}</option>
                  <option v-for="rt in availableResourceTypes" :key="rt.id" :value="rt.id">{{ rt.name }}</option>
                </select>
              </div>

              <!-- resource table -->
              <div v-if="filteredResources.length > 0" class="res-table">
                <template v-for="group in groupedResources" :key="group.typeId">
                  <div class="res-type-header">
                    <span class="rc-type">{{ group.typeName }}</span>
                  </div>
                  <div
                      v-for="resource in group.resources"
                      :key="resource.id"
                      class="res-row"
                      :class="{ selected: selectedResourceIds.includes(resource.id) }"
                      role="checkbox"
                      :aria-checked="selectedResourceIds.includes(resource.id)"
                      tabindex="0"
                      @click="toggleResource(resource.id)"
                      @keydown.enter="toggleResource(resource.id)"
                      @keydown.space.prevent="toggleResource(resource.id)"
                  >
                    <div class="res-row-check">
                      <div class="res-check-box" :class="{ checked: selectedResourceIds.includes(resource.id) }">
                        <i v-if="selectedResourceIds.includes(resource.id)" class="pi pi-check" />
                      </div>
                    </div>
                    <div class="res-row-name">{{ resource.name }}</div>
                    <div class="res-row-cap">
                      <span v-if="resource.capacity" class="rc-cap">
                        <i class="pi pi-users" />{{ resource.capacity }}
                      </span>
                    </div>
                    <div class="res-row-status">
                      <span
                          class="rc-status"
                          :class="resource.status === ResourceStatus.Available ? 'status-ok' : 'status-warn'"
                          :title="resource.status === ResourceStatus.Available ? t('wizard.resourceOperationalHelp') : ''"
                      >
                        {{ resource.status === ResourceStatus.Available ? t('wizard.resourceOperational') : t('wizard.resourceInMaintenance') }}
                      </span>
                    </div>
                  </div>
                </template>
              </div>
              <div v-else class="empty-hint">
                <div class="empty-hint-icon"><i class="pi pi-search" /></div>
                <p>{{ t('wizard.noResourcesMatch') }}</p>
              </div>

              <!-- selection summary -->
              <div v-if="selectedResourceIds.length > 0" class="selection-summary">
                <i class="pi pi-check-circle" style="color: #10b981;" />
                {{ translateCount('common.selectedResources', selectedResourceIds.length) }}
              </div>


            </template>
          </div>
        </div>

        <!-- --- STEP 2: Data & Orari --- -->
        <div v-if="activeStep === 1" class="step-panel">
          <div class="step-header">
            <div class="step-header-icon"><i class="pi pi-calendar" /></div>
            <div>
              <h2>{{ t('wizard.step2Title') }}</h2>
              <p>{{ t('wizard.step2Desc') }}</p>
            </div>
          </div>
          <!-- Hint UX: chiarisce che lo stato "Operativa" non implica
                            disponibilità per la fascia oraria (controllo nello step 2). -->
          <div class="resource-hint">
            <i class="pi pi-info-circle" />
            {{ t('wizard.resourceTimeAvailabilityHint') }}
          </div>

          <div class="step-body">
            <div class="form-group">
              <label class="field-label required">{{ t('common.date') }}</label>
              <PrimeDatePicker
                  v-model="formData.date"
                  date-format="dd/mm/yy"
                  :min-date="new Date()"
                  :disabled-dates="blockedBookingDates"
                  show-icon
                  class="w-full"
              />
              <p v-if="isSelectedDateBlocked" class="field-warning">
                <i class="pi pi-ban" />
                {{ selectedDateBlockedMessage }}
              </p>
            </div>

            <div v-if="selectedResourceIds.length > 0 && formData.date" class="time-slots-section">
              <div class="ts-grid">
                <div
                    v-for="resourceId in selectedResourceIds"
                    :key="resourceId"
                    class="ts-item"
                    :class="{
                      'ts-item-ok': availabilityStatus[resourceId] === 'ok',
                      'ts-item-warn': availabilityStatus[resourceId] === 'warning',
                    }"
                >
                  <div class="ts-item-name">
                    <i class="pi pi-building" />
                    <span>{{ getResourceName(resourceId) }}</span>
                    <span class="ts-item-avail">
                      <i v-if="availabilityStatus[resourceId] === 'checking'" class="pi pi-spin pi-spinner" />
                      <i v-else-if="availabilityStatus[resourceId] === 'ok'" class="pi pi-check-circle" />
                      <i v-else-if="availabilityStatus[resourceId] === 'warning'" class="pi pi-exclamation-circle" />
                    </span>
                  </div>
                  <div class="ts-item-inputs">
                    <input
                        v-model="formData.timeSlots[resourceId].startTime"
                        type="time"
                        class="time-input"
                        :class="{ 'time-input-warn': availabilityStatus[resourceId] === 'warning' }"
                        @blur="checkSlotAvailability(resourceId)"
                    />
                    <span class="ts-sep">—</span>
                    <input
                        v-model="formData.timeSlots[resourceId].endTime"
                        type="time"
                        class="time-input"
                        :class="{ 'time-input-warn': availabilityStatus[resourceId] === 'warning' }"
                        @blur="checkSlotAvailability(resourceId)"
                    />
                  </div>
                  <p v-if="availabilityStatus[resourceId] === 'warning'" class="ts-item-error">
                    <i class="pi pi-ban" />
                    {{ t('wizard.slotNotAvailable') }}
                  </p>
                </div>
              </div>
            </div>

            <div v-else class="empty-hint">
              <div class="empty-hint-icon"><i class="pi pi-calendar-times" /></div>
              <p>{{ t('wizard.selectDateFirst') }}</p>
            </div>
          </div>
        </div>

        <!-- --- STEP 3: Ricorrenza --- -->
        <div v-if="activeStep === 2" class="step-panel">
          <div class="step-header">
            <div class="step-header-icon"><i class="pi pi-sync" /></div>
            <div>
              <h2>{{ t('wizard.step3Title') }}</h2>
              <p>{{ t('wizard.step3Desc') }}</p>
            </div>
          </div>

          <div class="step-body">
            <!-- Toggle -->
            <div class="toggle-row">
              <label class="toggle-switch" :class="{ on: formData.isRecurring }">
                <input
                    v-model="formData.isRecurring"
                    type="checkbox"
                />
                <span class="toggle-thumb" />
              </label>
              <div class="toggle-text">
                <span class="toggle-main">{{ t('wizard.recurringBooking') }}</span>
                <span class="toggle-sub">{{ t('wizard.recurringBookingDesc') }}</span>
              </div>
            </div>

            <!-- Recurrence options - stile Outlook -->
            <transition name="fade-slide">
              <div v-if="formData.isRecurring" class="recurrence-box">

                <!-- Riga "Ripeti ogni [N] [Periodo]" -->
                <div class="recurrence-row-inline">
                  <span class="recurrence-row-label">{{ t('wizard.recurrenceEvery') }}</span>
                  <input
                      v-model.number="formData.recurrenceInterval"
                      type="number"
                      min="1"
                      max="99"
                      class="recurrence-interval-input"
                      :aria-label="t('wizard.recurrenceIntervalAriaLabel')"
                  />
                  <div class="recurrence-period-tabs">
                    <button
                        v-for="opt in frequencyOptions"
                        :key="opt.value"
                        type="button"
                        class="period-tab"
                        :class="{ selected: formData.frequency === opt.value }"
                        @click="formData.frequency = opt.value; formData.recurringDays = []"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>

                <!-- Selettore giorni (solo Settimane) -->
                <div v-if="formData.frequency === 'WEEKLY'" class="form-group">
                  <div class="days-row">
                    <button
                        v-for="day in weekDays"
                        :key="day.value"
                        type="button"
                        class="day-btn"
                        :class="{ selected: formData.recurringDays.includes(day.value) }"
                        :aria-pressed="formData.recurringDays.includes(day.value)"
                        :title="day.label"
                        @click="toggleDay(day.value)"
                    >
                      {{ day.short }}
                    </button>
                  </div>
                </div>

                <!-- Toggle weekend (solo Giorni) -->
                <div v-if="formData.frequency === 'DAILY'" class="form-group">
                  <label class="weekend-toggle">
                    <input type="checkbox" v-model="formData.dailyIncludeWeekends" />
                    <span>{{ t('wizard.includeWeekends') }}</span>
                  </label>
                </div>

                <!-- Data fine (Until) -->
                <div class="form-group">
                  <label class="field-label required">{{ t('wizard.recurrenceEndDate') }}</label>
                  <PrimeDatePicker
                      v-model="formData.recurrenceEndDate"
                      date-format="dd/mm/yy"
                      :min-date="formData.date || new Date()"
                      show-icon
                      class="w-full"
                  />
                </div>

                <!-- Anteprima testuale -->
                <div v-if="formData.recurrenceEndDate" class="recurrence-preview">
                  <i class="pi pi-info-circle" />
                  <span>{{ recurrencePreviewText }}</span>
                </div>

                <div class="conflict-row" :class="{ warn: hasRecurrenceConflicts }">
                  <i :class="hasRecurrenceConflicts ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'" />
                  <span>{{ hasRecurrenceConflicts ? t('wizard.conflictsFound', { count: conflictCount }) : t('wizard.noConflicts') }}</span>
                </div>
              </div>
            </transition>

            <div v-if="!formData.isRecurring" class="skip-hint">
              <i class="pi pi-info-circle" />
              {{ t('wizard.singleBooking') }}
            </div>
          </div>
        </div>

        <!-- --- STEP 4: Partecipanti Interni --- -->
        <div v-if="activeStep === 3" class="step-panel">
          <div class="step-header">
            <div class="step-header-icon"><i class="pi pi-users" /></div>
            <div>
              <h2>{{ t('wizard.step4Title') }}</h2>
              <p>{{ t('wizard.step4Desc') }}</p>
            </div>
          </div>

          <div class="step-body">
            <div class="form-group participant-search-group">
              <label class="field-label">{{ t('wizard.searchParticipant') }}</label>
              <div class="participant-search-wrap">
                <i class="pi pi-search participant-search-icon" />
                <PrimeAutoComplete
                    v-model="participantSearch"
                    :suggestions="filteredUsers"
                    option-label="label"
                    :placeholder="t('wizard.searchParticipantPlaceholder')"
                    class="w-full participant-search-ac"
                    dropdown
                    force-selection
                    append-to="body"
                    @complete="onSearchUsers"
                    @item-select="onUserSelect"
                >
                  <template #option="{ option }">
                    <div class="participant-suggestion">
                      <div class="ps-avatar">{{ option.initials }}</div>
                      <div class="ps-info">
                        <span class="ps-name">{{ option.fullName || option.email }}</span>
                        <span v-if="option.fullName" class="ps-email">{{ option.email }}</span>
                      </div>
                    </div>
                  </template>
                </PrimeAutoComplete>
              </div>
            </div>

            <div v-if="formData.participants.length > 0" class="participants-list">
              <h3 class="section-title">
                <i class="pi pi-user-plus" />
                {{ t('wizard.participantsAdded', { count: formData.participants.length }) }}
              </h3>
              <div class="participant-chips">
                <div
                    v-for="(p, idx) in formData.participants"
                    :key="idx"
                    class="participant-chip"
                >
                  <div class="pc-avatar pc-avatar-initial">
                    {{ getInternalParticipantLabel(p.userId).charAt(0).toUpperCase() }}
                  </div>
                  <div class="pc-info">
                    <span class="pc-name">{{ getInternalParticipantLabel(p.userId).split(' (')[0] }}</span>
                    <span v-if="getInternalParticipantLabel(p.userId).includes('(')" class="pc-email">
                      {{ getInternalParticipantLabel(p.userId).match(/\(([^)]+)\)/)?.[1] }}
                    </span>
                  </div>
                  <button type="button" class="pc-remove" @click="removeParticipant(idx)">
                    <i class="pi pi-times" />
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="empty-hint">
              <div class="empty-hint-icon"><i class="pi pi-user-plus" /></div>
              <p>{{ t('wizard.noParticipants') }}</p>
            </div>
          </div>
        </div>

        <!-- --- STEP 5: Tipologia Visitatore & Modalit- Invito --- -->
        <div v-if="activeStep === 4" class="step-panel">
          <div class="step-header">
            <div class="step-header-icon"><i class="pi pi-send" /></div>
            <div>
              <h2>{{ t('wizard.step5Title') }}</h2>
              <p>{{ t('wizard.step5Desc') }}</p>
            </div>
          </div>

          <div class="step-body">
            <div class="form-group">
              <label class="field-label required">{{ t('wizard.inviteMode') }}</label>
              <p class="field-sub">{{ t('wizard.inviteModeHint') }}</p>
              <div class="invite-mode-grid">
                <div
                    v-for="mode in inviteModes"
                    :key="mode.value"
                    class="invite-mode-card"
                    :class="{ selected: formData.inviteMode === mode.value }"
                    @click="formData.inviteMode = mode.value as InviteMode"
                >
                  <div class="imc-icon">
                    <i :class="mode.icon" />
                  </div>
                  <div class="imc-body">
                    <h4>{{ mode.title }}</h4>
                    <p>{{ mode.description }}</p>
                  </div>
                  <div class="imc-radio" :class="{ checked: formData.inviteMode === mode.value }">
                    <span v-if="formData.inviteMode === mode.value" class="imc-dot" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- --- STEP 6: Dati Visitatori --- -->
        <div v-if="activeStep === 5" class="step-panel">
          <div class="step-header">
            <div class="step-header-icon"><i class="pi pi-id-card" /></div>
            <div>
              <h2>{{ t('wizard.step6Title') }}</h2>
              <p>{{ t('wizard.step6Desc') }}</p>
            </div>
          </div>

          <div class="step-body">
            <!-- Modalit- 1: Link generico -->
            <div v-if="formData.inviteMode === InviteMode.GenericLink" class="invite-section">
              <div class="invite-mode-badge">
                <i class="pi pi-link" />
                {{ t('wizard.genericLinkBadge') }}
              </div>
              <p class="field-sub" style="margin-bottom: 1.25rem;">{{ t('wizard.genericLinkDesc') }}</p>
              <div class="form-group">
                <label class="field-label required">{{ t('wizard.maxVisitors') }}</label>
                <PrimeInputNumber
                    v-model="formData.maxVisitors"
                    :min="1"
                    :max="9999"
                    :use-grouping="false"
                    :placeholder="t('wizard.maxVisitorsPlaceholder')"
                    class="w-full"
                />
                <p class="field-sub">{{ t('wizard.maxVisitorsHint') }}</p>
              </div>
              <div class="form-group">
                <label class="field-label">{{ t('wizard.linkExpiry') }}</label>
                <PrimeDatePicker
                    v-model="formData.linkExpiryDate"
                    date-format="dd/mm/yy"
                    :min-date="formData.date || new Date()"
                    show-icon
                    class="w-full"
                    :placeholder="t('wizard.linkExpiryPlaceholder')"
                />
                <p class="field-sub">{{ t('wizard.linkExpiryHint') }}</p>
              </div>
            </div>

            <!-- Modalit- 2: Nominativo auto-completamento -->
            <div v-if="formData.inviteMode === InviteMode.NominativeAutoComplete" class="invite-section">
              <div class="invite-mode-badge">
                <i class="pi pi-envelope" />
                {{ t('wizard.nominativeAutoBadge') }}
              </div>
              <p class="field-sub" style="margin-bottom: 1.25rem;">{{ t('wizard.nominativeAutoDesc') }}</p>
              <div class="form-group">
                <label class="field-label required">{{ t('wizard.visitorEmails') }}</label>
                <div class="email-add-row">
                  <PrimeInputText
                      v-model="visitorEmail"
                      type="email"
                      placeholder="email@esempio.com"
                      class="flex-1"
                      @keydown.enter.prevent="addVisitorEmail"
                  />
                  <button type="button" class="btn-add-item" @click="addVisitorEmail">
                    <i class="pi pi-plus" />
                    {{ t('common.add') }}
                  </button>
                </div>
                <div v-if="formData.visitorEmails.length > 0" class="email-chips">
                  <div
                      v-for="(email, idx) in formData.visitorEmails"
                      :key="idx"
                      class="email-chip"
                  >
                    <i class="pi pi-envelope" />
                    <span>{{ email }}</span>
                    <button type="button" class="chip-remove" @click="removeVisitorEmail(idx)">
                      <i class="pi pi-times" />
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label class="field-label">{{ t('wizard.maxVisitorsLabel') }}</label>
                <PrimeInputNumber
                    v-model="formData.maxVisitors"
                    :min="0"
                    :use-grouping="false"
                    :placeholder="t('wizard.maxVisitorsUnlimited')"
                    class="w-full"
                />
              </div>
            </div>

            <!-- Modalit- 3: Nominativo completo -->
            <div v-if="formData.inviteMode === InviteMode.NominativeComplete" class="invite-section">
              <div class="invite-mode-badge">
                <i class="pi pi-user-plus" />
                {{ t('wizard.nominativeCompleteBadge') }}
              </div>
              <p class="field-sub visitor-mode-desc">{{ t('wizard.nominativeCompleteDesc') }}</p>
              <div v-if="formData.visitors.length > 0" class="visitor-list">
                <div
                    v-for="(visitor, idx) in formData.visitors"
                    :key="idx"
                    class="visitor-row"
                >
                  <div class="visitor-info">
                    <div class="visitor-name">
                      {{ `${visitor.firstName} ${visitor.lastName}`.trim() }}
                      <small v-if="visitor.isGroupLeader" class="visitor-flag">· {{ t('bookings.capogruppo') }}</small>
                      <small v-if="visitor.contactId" class="visitor-flag">· {{ t('wizard.fromDirectory') }}</small>
                    </div>
                    <div class="visitor-meta">
                      {{ visitor.email }}<template v-if="visitor.phone"> · {{ visitor.phone }}</template>
                    </div>
                  </div>
                  <div class="visitor-row-actions">
                    <button
                      type="button"
                      class="visitor-action-btn"
                      :title="t('common.edit')"
                      @click="openEditVisitor(idx)"
                    >
                      <i class="pi pi-pencil" />
                    </button>
                    <button
                      type="button"
                      class="visitor-action-btn"
                      :title="t('common.delete')"
                      @click="removeVisitor(idx)"
                    >
                      <i class="pi pi-trash" />
                    </button>
                  </div>
                </div>
              </div>
              <div class="visitor-add-actions">
                <button type="button" class="btn-add-visitor" @click="openDirectoryDialog">
                  <i class="pi pi-book" />
                  {{ t('wizard.addFromDirectory') }}
                </button>
                <button type="button" class="btn-add-visitor" @click="openManualDialog">
                  <i class="pi pi-plus" />
                  {{ t('wizard.addManually') }}
                </button>
              </div>

              <!-- ── Dialog "Aggiungi da rubrica" ─────────────────── -->
              <AppDialog
                v-model:visible="showDirectoryDialog"
                :header="t('wizard.addFromDirectoryHeader')"
                :subtitle="t('wizard.searchDirectoryHint')"
                icon="pi pi-book"
                severity="info"
                size="md"
              >
                <div class="dlg-form">
                  <div class="dlg-section">
                    <div class="dlg-fields-2">
                      <div class="dlg-field dlg-field-full">
                        <label class="dlg-label">{{ t('wizard.searchDirectoryLabel') }}</label>
                        <PrimeAutoComplete
                          v-model="directoryPicked"
                          :suggestions="directorySuggestions"
                          :placeholder="t('wizard.searchDirectoryPlaceholder')"
                          option-label="firstName"
                          :delay="300"
                          :min-length="2"
                          fluid
                          class="directory-autocomplete"
                          @complete="searchDirectory"
                        >
                          <template #option="slotProps">
                            <div class="directory-option">
                              <strong>{{ slotProps.option.firstName }} {{ slotProps.option.lastName }}</strong>
                              <span v-if="slotProps.option.email">{{ slotProps.option.email }}</span>
                            </div>
                          </template>
                        </PrimeAutoComplete>
                      </div>

                      <!-- Preview del contatto selezionato -->
                      <div v-if="directoryPicked && typeof directoryPicked !== 'string'" class="dlg-field dlg-field-full directory-selected">
                        <div class="directory-selected-name">
                          <strong>{{ directoryPicked.firstName }} {{ directoryPicked.lastName }}</strong>
                        </div>
                        <div v-if="directoryPicked.email" class="directory-selected-meta">{{ directoryPicked.email }}</div>
                        <div v-if="directoryPicked.phone" class="directory-selected-meta">{{ directoryPicked.phone }}</div>
                      </div>
                    </div>
                  </div>

                  <hr class="dlg-divider" />

                  <div class="dlg-section">
                    <div class="dlg-section-title">
                      <i class="pi pi-users" /> {{ t('wizard.visitorType') }}
                    </div>
                    <div class="dlg-field">
                      <label class="dlg-label">{{ t('wizard.visitorType') }} <span class="req">*</span></label>
                      <PrimeSelect
                        v-model="directoryVisitorTypeId"
                        :options="visitorTypeOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="t('wizard.selectVisitorType')"
                        class="w-full"
                      />
                    </div>
                  </div>

                  <hr class="dlg-divider" />

                  <div class="dlg-section dlg-section-status">
                    <div class="dlg-status-row">
                      <div>
                        <div class="dlg-status-title">{{ t('bookings.capogruppo') }}</div>
                        <div class="dlg-status-desc">{{ t('bookings.capogruppoHelp') }}</div>
                      </div>
                      <PrimeCheckbox v-model="directoryIsGroupLeader" input-id="dirIsGroupLeader" binary />
                    </div>
                  </div>
                </div>

                <template #footer>
                  <button type="button" class="dialog-btn dialog-btn-cancel" @click="cancelDirectoryAdd">
                    <i class="pi pi-times" /> {{ t('common.cancel') }}
                  </button>
                  <button
                    type="button"
                    class="dialog-btn dialog-btn-save"
                    :disabled="!isDirectoryPickValid || !directoryVisitorTypeId"
                    @click="confirmDirectoryAdd"
                  >
                    <i class="pi pi-check" /> {{ t('common.add') }}
                  </button>
                </template>
              </AppDialog>

              <!-- ── Dialog "Aggiungi manualmente" / Modifica ─────────────── -->
              <AppDialog
                v-model:visible="showAddVisitorDialog"
                :header="editingVisitorIndex !== null ? t('wizard.editVisitor') : t('wizard.newVisitor')"
                :subtitle="(newVisitor.firstName || newVisitor.lastName) ? `${newVisitor.firstName} ${newVisitor.lastName}`.trim() : t('wizard.nominativeCompleteDesc')"
                :icon="editingVisitorIndex !== null ? 'pi pi-pencil' : 'pi pi-user-plus'"
                severity="primary"
                size="lg"
              >
              <div class="dlg-form">
                <!-- Sezione Tipologia Visitatore (obbligatoria, per partecipante) -->
                <div class="dlg-section">
                  <div class="dlg-field">
                    <label class="dlg-label">{{ t('wizard.visitorType') }} <span class="req">*</span></label>
                    <PrimeSelect
                      v-model="newVisitor.visitorTypeId"
                      :options="visitorTypeOptions"
                      option-label="label"
                      option-value="value"
                      :placeholder="t('wizard.selectVisitorType')"
                      class="w-full"
                    />
                    <small class="dlg-help">{{ t('wizard.visitorTypePerParticipantHint') }}</small>
                  </div>
                </div>

                <!-- Sezione Anagrafica -->
                <div class="dlg-section">
                  <div class="dlg-fields-2">
                    <div class="dlg-field">
                      <label class="dlg-label">{{ t('wizard.visitorFirstName') }} <span class="req">*</span></label>
                      <PrimeInputText v-model="newVisitor.firstName" :placeholder="t('wizard.visitorFirstNamePlaceholder')" class="w-full" />
                    </div>
                    <div class="dlg-field">
                      <label class="dlg-label">{{ t('wizard.visitorLastName') }} <span class="req">*</span></label>
                      <PrimeInputText v-model="newVisitor.lastName" :placeholder="t('wizard.visitorLastNamePlaceholder')" class="w-full" />
                    </div>
                    <div class="dlg-field">
                      <label class="dlg-label">{{ t('common.email') }} <span class="req">*</span></label>
                      <PrimeInputText v-model="newVisitor.email" type="email" placeholder="email@esempio.com" class="w-full" />
                    </div>
                    <div class="dlg-field">
                      <label class="dlg-label">{{ t('wizard.visitorPhone') }}</label>
                      <PrimeInputText v-model="newVisitor.phone" type="tel" placeholder="+39 …" class="w-full" />
                    </div>
                  </div>
                </div>

                <hr v-if="visitorTypeCustomFields.length > 0" class="dlg-divider" />
                <!-- Custom fields from visitor type -->
                <div v-if="visitorTypeCustomFields.length > 0" class="dlg-section">
                  <div class="dlg-fields-2">
                      <div
                          v-for="field in visitorTypeCustomFields"
                          :key="field.id"
                          class="custom-field-card"
                      >
                        <div class="custom-field-card-head">
                          <div class="field-card-title-wrap">
                            <label class="field-label field-label-card" :class="{ required: field.isRequired }">{{ field.label }}</label>
                          </div>

                        </div>

                        <PrimeInputText
                            v-if="['Text', 'Email', 'Phone'].includes(field.fieldType)"
                            v-model="(newVisitor.customFields as Record<string, any>)[getFieldValueKey(field)]"
                            :type="field.fieldType === 'Email' ? 'email' : field.fieldType === 'Phone' ? 'tel' : 'text'"
                            :placeholder="field.placeholder || t('wizard.enterTextPlaceholder')"
                            class="w-full"
                        />
                        <PrimeInputNumber
                            v-else-if="field.fieldType === 'Number'"
                            v-model="(newVisitor.customFields as Record<string, any>)[getFieldValueKey(field)]"
                            class="w-full"
                        />
                        <PrimeDatePicker
                            v-else-if="field.fieldType === 'Date'"
                            v-model="(newVisitor.customFields as Record<string, any>)[getFieldValueKey(field)]"
                            date-format="dd/mm/yy"
                            class="w-full"
                        />
                        <PrimeSelect
                            v-else-if="field.fieldType === 'Dropdown' || field.fieldType === 'SingleChoice'"
                            v-model="(newVisitor.customFields as Record<string, any>)[getFieldValueKey(field)]"
                            :options="getFieldOptions(field)"
                            option-label="label"
                            option-value="value"
                            :placeholder="t('wizard.selectValuePlaceholder')"
                            class="w-full"
                        />
                        <div v-else-if="field.fieldType === 'MultipleChoice'" class="multi-choice-list multi-choice-card">
                          <label
                              v-for="option in getFieldOptions(field)"
                              :key="`${field.id}-${option.value}`"
                              class="checkbox-row checkbox-chip"
                              :class="{ 'checkbox-chip-active': getMultipleChoiceValues(newVisitor.customFields, field).includes(option.value) }"
                          >
                            <input
                                type="checkbox"
                                :checked="getMultipleChoiceValues(newVisitor.customFields, field).includes(option.value)"
                                class="checkbox-input"
                                @change="setMultipleChoiceValue(newVisitor.customFields, field, option.value, ($event.target as HTMLInputElement).checked)"
                            />
                            <span>{{ option.label }}</span>
                          </label>
                        </div>
                        <label
                            v-else-if="field.fieldType === 'Boolean' || field.fieldType === 'Checkbox'"
                            class="checkbox-row checkbox-card"
                            :class="{ 'checkbox-card-active': !!(newVisitor.customFields as Record<string, any>)[getFieldValueKey(field)] }"
                        >
                          <input
                              type="checkbox"
                              v-model="(newVisitor.customFields as Record<string, any>)[getFieldValueKey(field)]"
                              class="checkbox-input"
                          />
                          <span>{{ field.label }}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                <hr class="dlg-divider" />
                <!-- ── Capogruppo (status row) ── -->
                <div class="dlg-section dlg-section-status">
                  <div class="dlg-status-row">
                    <div>
                      <div class="dlg-status-title">{{ t('bookings.capogruppo') }}</div>
                      <div class="dlg-status-desc">{{ t('bookings.capogruppoHelp') }}</div>
                    </div>
                    <PrimeCheckbox v-model="newVisitor.isGroupLeader" input-id="manualIsGroupLeader" binary />
                  </div>
                </div>

                <hr v-if="!newVisitor.contactId" class="dlg-divider" />
                <!-- ── Salva in rubrica (status row, solo se non già da rubrica) ── -->
                <div v-if="!newVisitor.contactId" class="dlg-section dlg-section-status">
                  <div class="dlg-status-row">
                    <div>
                      <div class="dlg-status-title">{{ t('wizard.saveToDirectory') }}</div>
                      <div class="dlg-status-desc">{{ t('wizard.saveToDirectoryHelp') }}</div>
                    </div>
                    <PrimeCheckbox v-model="newVisitor.saveToDirectory" input-id="manualSaveToDir" binary />
                  </div>
                </div>
              </div>

              <template #footer>
                <button type="button" class="dialog-btn dialog-btn-cancel" @click="cancelAddVisitor">
                  <i class="pi pi-times" /> {{ t('common.cancel') }}
                </button>
                <button type="button" class="dialog-btn dialog-btn-save" @click="confirmAddVisitor">
                  <i class="pi pi-check" /> {{ editingVisitorIndex !== null ? t('common.save') : t('common.add') }}
                </button>
              </template>
              </AppDialog>
            </div>
          </div>
        </div>

        <!-- --- STEP 7: Campi Personalizzati --- -->
        <div v-if="activeStep === 6" class="step-panel">
          <div class="step-header">
            <div class="step-header-icon"><i class="pi pi-list-check" /></div>
            <div>
              <h2>{{ t('wizard.step7Title') }}</h2>
              <p>{{ t('wizard.step7Desc') }}</p>
            </div>
          </div>

          <div class="step-body">
            <!-- Alert campi obbligatori mancanti -->
            <div v-if="showFieldErrors && hasMissingRequiredFields(bookingCustomFields, formData.customFieldValues)" class="required-fields-alert">
              <i class="pi pi-exclamation-triangle" />
              <span>{{ t('wizard.fillRequiredFirst') }}</span>
            </div>

            <div v-if="bookingCustomFields.length > 0" class="custom-fields-list">
              <div class="custom-fields-panel custom-fields-panel-booking">
                <div class="custom-fields-panel-head">
                  <div>
                    <p class="panel-kicker">{{ t('bookings.customFieldsKicker') }}</p>
                    <h5 class="panel-title">{{ t('wizard.bookingFieldsTitle') }}</h5>
                    <p class="panel-subtitle">{{ t('wizard.bookingFieldsSubtitle') }}</p>
                  </div>
                  <span class="panel-count">{{ bookingCustomFields.length }}</span>
                </div>

                <div class="custom-fields-grid">
                  <div
                      v-for="field in bookingCustomFields"
                      :key="field.id"
                      class="custom-field-card custom-field-card-booking"
                      :class="{ 'field-missing-card': isBookingFieldMissing(field) }"
                  >
                    <div class="custom-field-card-head">
                      <div class="field-card-title-wrap">
                        <label class="field-label field-label-card" :class="{ required: field.isRequired }">
                          {{ field.label }}
                        </label>
                      </div>
                    </div>

                    <PrimeInputText
                        v-if="field.fieldType === 'Text'"
                        v-model="(formData.customFieldValues as Record<string, any>)[getFieldValueKey(field)]"
                        :placeholder="field.placeholder || t('wizard.enterTextPlaceholder')"
                        :class="['w-full', { 'field-missing-error': isBookingFieldMissing(field) }]"
                    />
                    <PrimeInputNumber
                        v-else-if="field.fieldType === 'Number'"
                        v-model="(formData.customFieldValues as Record<string, any>)[getFieldValueKey(field)]"
                        class="w-full"
                        :inputClass="isBookingFieldMissing(field) ? 'field-missing-error' : undefined"
                    />
                    <PrimeInputText
                        v-else-if="field.fieldType === 'Email'"
                        v-model="(formData.customFieldValues as Record<string, any>)[getFieldValueKey(field)]"
                        type="email"
                        :class="['w-full', { 'field-missing-error': isBookingFieldMissing(field) }]"
                    />
                    <PrimeInputText
                        v-else-if="field.fieldType === 'Phone'"
                        v-model="(formData.customFieldValues as Record<string, any>)[getFieldValueKey(field)]"
                        type="tel"
                        :class="['w-full', { 'field-missing-error': isBookingFieldMissing(field) }]"
                    />
                    <PrimeDatePicker
                        v-else-if="field.fieldType === 'Date'"
                        v-model="(formData.customFieldValues as Record<string, any>)[getFieldValueKey(field)]"
                        date-format="dd/mm/yy"
                        :class="['w-full', { 'field-missing-error': isBookingFieldMissing(field) }]"
                    />
                    <PrimeSelect
                        v-else-if="field.fieldType === 'Dropdown' || field.fieldType === 'SingleChoice'"
                        v-model="(formData.customFieldValues as Record<string, any>)[getFieldValueKey(field)]"
                        :options="getFieldOptions(field)"
                        option-label="label"
                        option-value="value"
                        :placeholder="t('wizard.selectValuePlaceholder')"
                        :class="['w-full', { 'field-missing-error': isBookingFieldMissing(field) }]"
                    />
                    <div
                        v-else-if="field.fieldType === 'MultipleChoice'"
                        class="multi-choice-list multi-choice-card"
                        :class="{ 'field-missing-card': isBookingFieldMissing(field) }"
                    >
                      <label
                          v-for="option in getFieldOptions(field)"
                          :key="`${field.id}-${option.value}`"
                          class="checkbox-row checkbox-chip"
                          :class="{ 'checkbox-chip-active': getMultipleChoiceValues(formData.customFieldValues, field).includes(option.value) }"
                      >
                        <input
                            type="checkbox"
                            :checked="getMultipleChoiceValues(formData.customFieldValues, field).includes(option.value)"
                            class="checkbox-input"
                            @change="setMultipleChoiceValue(formData.customFieldValues, field, option.value, ($event.target as HTMLInputElement).checked)"
                        />
                        <span>{{ option.label }}</span>
                      </label>
                    </div>
                    <label
                        v-else-if="field.fieldType === 'Boolean' || field.fieldType === 'Checkbox'"
                        class="checkbox-row checkbox-card"
                        :class="{
                        'checkbox-card-active': !!(formData.customFieldValues as Record<string, any>)[getFieldValueKey(field)],
                        'field-missing-card': isBookingFieldMissing(field),
                      }"
                    >
                      <input
                          type="checkbox"
                          v-model="(formData.customFieldValues as Record<string, any>)[getFieldValueKey(field)]"
                          class="checkbox-input"
                      />
                      <span>{{ field.label }}</span>
                    </label>
                    <div v-if="isBookingFieldMissing(field)" class="field-error-msg">
                      <i class="pi pi-exclamation-circle" />
                      <span>{{ t('wizard.requiredFieldMissing') }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-hint">
              <div class="empty-hint-icon"><i class="pi pi-check-circle" /></div>
              <p>{{ t('wizard.noCustomFields') }}</p>
            </div>
          </div>
        </div>

        <!-- --- STEP 8: Conferma --- -->
        <div v-if="activeStep === 7" class="step-panel">
          <div class="step-header">
            <div class="step-header-icon"><i class="pi pi-check-circle" /></div>
            <div>
              <h2>{{ t('wizard.step8Title') }}</h2>
              <p>{{ t('wizard.step8Desc') }}</p>
            </div>
          </div>

          <div class="step-body">
            <div class="summary-grid">
              <!-- Sede & Risorse -->
              <div class="summary-section">
                <h3 class="summary-section-title">
                  <i class="pi pi-building" />
                  {{ t('wizard.summaryLocationResources') }}
                </h3>
                <div class="summary-row">
                  <span class="sr-label">{{ t('wizard.titleLabel') }}</span>
                  <span class="sr-value">{{ formData.title || t('wizard.titleAutoDate', { date: formatDate(formData.date) }) }}</span>
                </div>
                <div class="summary-row">
                  <span class="sr-label">{{ t('wizard.plantLabel') }}</span>
                  <span class="sr-value">{{ getPlantName(formData.plantId) }}</span>
                </div>
                <div
                    v-for="resourceId in selectedResourceIds"
                    :key="resourceId"
                    class="summary-row"
                >
                  <span class="sr-label">{{ getResourceName(resourceId) }}</span>
                  <span class="sr-value">
                    {{ formData.timeSlots[resourceId]?.startTime }} — {{ formData.timeSlots[resourceId]?.endTime }}
                  </span>
                </div>
              </div>

              <!-- Data & Ricorrenza -->
              <div class="summary-section">
                <h3 class="summary-section-title">
                  <i class="pi pi-calendar" />
                  {{ t('wizard.summaryDateRecurrence') }}
                </h3>
                <div class="summary-row">
                  <span class="sr-label">{{ t('wizard.dateLabel') }}</span>
                  <span class="sr-value">{{ formatDate(formData.date) }}</span>
                </div>
                <div class="summary-row">
                  <span class="sr-label">{{ t('wizard.recurrenceLabel') }}</span>
                  <span class="sr-value">
                    {{ formData.isRecurring ? recurrencePreviewText : t('wizard.singleBooking') }}
                  </span>
                </div>
              </div>

              <!-- Partecipanti -->
              <div class="summary-section">
                <h3 class="summary-section-title">
                  <i class="pi pi-users" />
                  {{ t('wizard.step4') }}
                </h3>
                <div class="summary-row">
                  <span class="sr-label">{{ t('wizard.internalParticipants') }}</span>
                  <span class="sr-value">{{ formData.participants.length }}</span>
                </div>
                <div class="summary-row">
                  <span class="sr-label">{{ t('wizard.inviteMode') }}</span>
                  <span class="sr-value">{{ getInviteModeName(formData.inviteMode) }}</span>
                </div>
                <!-- Modalit- 1 summary -->
                <div v-if="formData.inviteMode === InviteMode.GenericLink" class="summary-row">
                  <span class="sr-label">{{ t('wizard.maxVisitors') }}</span>
                  <span class="sr-value">{{ formData.maxVisitors || '–' }}</span>
                </div>
                <!-- Modalit- 2 summary -->
                <div v-if="formData.inviteMode === InviteMode.NominativeAutoComplete" class="summary-row">
                  <span class="sr-label">{{ t('wizard.emailsSent') }}</span>
                  <span class="sr-value">{{ formData.visitorEmails.length }}</span>
                </div>
                <!-- Modalit- 3 summary -->
                <div v-if="formData.inviteMode === InviteMode.NominativeComplete" class="summary-row">
                  <span class="sr-label">{{ t('wizard.visitorsRegistered') }}</span>
                  <span class="sr-value">{{ formData.visitors.length }}</span>
                </div>
              </div>
            </div>

            <!-- Submit error -->
            <div v-if="submitError" class="error-banner" style="margin-top: 1.5rem;">
              <i class="pi pi-exclamation-circle" />
              {{ submitError }}
            </div>
          </div>
        </div>

      </div><!-- /form-card -->

      <!-- ------ NAVIGATION ------------------------------------------------------------------------------------------ -->
      <div class="step-navigation">
        <button
            type="button"
            class="btn btn-ghost"
            :disabled="activeStep === 0"
            @click="previousStep"
        >
          <i class="pi pi-arrow-left" />
          {{ t('common.back') }}
        </button>

        <div class="nav-center">
          <span class="step-counter">{{ t('wizard.stepCounter', { current: activeStep + 1, total: steps.length }) }}</span>
        </div>

        <button
            v-if="activeStep < steps.length - 1"
            type="button"
            class="btn btn-primary"
            :disabled="!canProceed"
            @click="nextStep"
        >
          {{ t('common.next') }}
          <i class="pi pi-arrow-right" />
        </button>

        <div v-else class="nav-submit-group">
          <button
              type="button"
              class="btn btn-ghost btn-save-draft"
              :disabled="submitting || !canSubmit"
              :title="t('wizard.saveAsDraftDesc')"
              @click="submitBooking(true)"
          >
            <i v-if="submitting" class="pi pi-spin pi-spinner" />
            <i v-else class="pi pi-file-edit" />
            {{ t('wizard.saveAsDraft') }}
          </button>

          <button
              type="button"
              class="btn dialog-btn-save"
              :disabled="submitting || !canSubmit"
              @click="submitBooking(false)"
          >
            <i v-if="submitting" class="pi pi-spin pi-spinner" />
            <i v-else class="pi pi-check" />
            {{ submitting ? t('common.loading') : t('wizard.step8Title') }}
          </button>
        </div>
      </div>

    </div>

    <!-- Dialog: Vuoi salvare come bozza prima di uscire? -->
    <AppDialog
        v-model:visible="showDraftPromptOnLeave"
        :header="t('wizard.unsavedTitle')"
        icon="pi pi-exclamation-circle"
        severity="warning"
        size="md"
        :closable="false"
        class="unsaved-dialog"
    >
      <p class="unsaved-msg">{{ t('wizard.unsavedMsg') }}</p>

      <template #footer>
        <div class="unsaved-footer">
          <button type="button" class="u-btn u-btn-discard" @click="pendingNavigationResolve?.('discard')">
            <i class="pi pi-trash" />
            <span>{{ t('wizard.unsavedDiscard') }}</span>
          </button>
          <div class="unsaved-footer-right">
            <button type="button" class="u-btn u-btn-ghost" @click="pendingNavigationResolve?.('cancel')">
              {{ t('common.cancel') }}
            </button>
            <button type="button" class="u-btn u-btn-primary" @click="pendingNavigationResolve?.('draft')">
              <i class="pi pi-file-edit" />
              <span>{{ t('wizard.saveAsDraft') }}</span>
            </button>
          </div>
        </div>
      </template>
    </AppDialog>

    <!-- Dialog: email già censita in rubrica (duplicate check) -->
    <AppDialog
        v-model:visible="showDuplicateEmailDialog"
        :header="t('wizard.duplicateEmailTitle')"
        icon="pi pi-info-circle"
        severity="info"
        size="md"
        :closable="false"
    >
      <div class="duplicate-email-body">
        <p>{{ t('wizard.duplicateEmailIntro') }}</p>
        <ul class="duplicate-email-list">
          <li v-for="m in duplicateEmailMatches" :key="m.id">
            <strong>{{ `${m.firstName} ${m.lastName}`.trim() }}</strong>
            <span v-if="m.email"> — {{ m.email }}</span>
          </li>
        </ul>
        <p class="field-help">{{ t('wizard.duplicateEmailQuestion') }}</p>
      </div>
      <template #footer>
        <button type="button" class="dialog-btn dialog-btn-cancel" @click="resolveDuplicateEmail(false)">
          <i class="pi pi-times" />{{ t('wizard.duplicateEmailKeepExisting') }}
        </button>
        <button type="button" class="dialog-btn dialog-btn-save" @click="resolveDuplicateEmail(true)">
          <i class="pi pi-bookmark" />{{ t('wizard.duplicateEmailSaveAnyway') }}
        </button>
      </template>
    </AppDialog>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import PrimeSelect from 'primevue/select'
import PrimeDatePicker from 'primevue/datepicker'
import PrimeInputText from 'primevue/inputtext'
import PrimeInputNumber from 'primevue/inputnumber'
import PrimeAutoComplete from 'primevue/autocomplete'
import PrimeCheckbox from 'primevue/checkbox'
import AppDialog from '@/components/common/AppDialog.vue'
import { useToast } from 'primevue/usetoast'
import { useBookingsStore } from '@/stores/bookings.store'
import { useResourcesStore } from '@/stores/resources.store'
import { usePlantsStore } from '@/stores/plants.store'
import { useUnavailabilityStore } from '@/stores/unavailability.store'
import { useVisitorTypesStore } from '@/stores/visitor-types.store'
import { useAuthStore } from '@/stores/auth.store'
import { useUsersStore } from '@/stores/users.store'
import { bookingsApi } from '@/api/bookings.api'
import { customFieldsApi } from '@/api/custom-fields.api'
import { visitorsApi } from '@/api/visitors.api'
import type { VisitorSearchResult } from '@/types/visitor'
import type { CreateBookingDto, CreateBookingResourceDto, CreateBookingParticipantDto } from '@/types/booking'
import type { CustomField, Resource } from '@/types/resource'
import { ResourceStatus, InviteMode, BookingStatus } from '@/types/enums'
import type { FieldLinkResponse } from '@/types/custom-field'
import type { Holiday, UnavailabilityBlock } from '@/types/unavailability'

// ------ Stores & router ------------------------------------------------------------------------------------------------------------------------------------------------------
const { t, locale } = useI18n()
const translateCount = (key: string, count: number) =>
    (t as unknown as (path: string, plural: number, options: { count: number }) => string)(key, count, { count })
const toast = useToast()
const router = useRouter()
const route = useRoute()
const bookingsStore = useBookingsStore()
const resourcesStore = useResourcesStore()
const plantsStore = usePlantsStore()
const unavailabilityStore = useUnavailabilityStore()
const visitorTypesStore = useVisitorTypesStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()

// ------ Wizard state ---------------------------------------------------------------------------------------------------------------------------------------------------------------
const activeStep = ref(0)
const submitting = ref(false)
const loadedDraftId = ref<string | null>(null)
const isSubmittingNavigation = ref(false)
const autoSavingDraft = ref(false)
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
const lastSavedDraftSnapshot = ref('')
const submitError = ref<string | null>(null)
const showFieldErrors = ref(false)  // mostra errori campi obbligatori quando si tenta di avanzare
const showDraftPromptOnLeave = ref(false)  // dialog "salva bozza prima di uscire"
const pendingNavigationResolve = ref<((val: boolean | string) => void) | null>(null)
const participantSearch = ref('')
const visitorEmail = ref('')
const selectedResourceIds = ref<string[]>([])
const availabilityStatus = ref<Record<string, 'ok' | 'warning' | 'checking' | 'unknown'>>({})
const filteredUsers = ref<{ label: string; value: string; fullName: string; email: string; initials: string }[]>([])
const hasRecurrenceConflicts = ref(false)
const conflictCount = ref(0)
const showAddVisitorDialog = ref(false)
const showDirectoryDialog = ref(false)
const editingVisitorIndex = ref<number | null>(null)
const directoryPicked = ref<VisitorSearchResult | string | null>(null)
const directoryIsGroupLeader = ref(false)
const directoryVisitorTypeId = ref<string>('')

const isDirectoryPickValid = computed(() =>
  directoryPicked.value !== null && typeof directoryPicked.value !== 'string'
)

// Tipo del singolo visitatore esterno gestito dal wizard.
// firstName/lastName sostituiscono il vecchio campo "name" (decisione utente).
// contactId/saveToDirectory governano l'integrazione con la Rubrica visitatori.
type WizardVisitor = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  /** Tipologia visitatore di questo singolo partecipante (obbligatoria). */
  visitorTypeId: string
  customFields: Record<string, unknown>
  isGroupLeader: boolean
  contactId?: string         // id del contatto rubrica se selezionato dall'autocomplete
  saveToDirectory: boolean   // flag "Salva in rubrica" deciso dall'organizzatore
}

const emptyVisitor = (): WizardVisitor => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  visitorTypeId: '',
  customFields: {},
  isGroupLeader: false,
  contactId: undefined,
  saveToDirectory: false,
})

const newVisitor = ref<WizardVisitor>(emptyVisitor())

// ─── Rubrica visitatori (autocomplete + popup duplicato email) ────────────
const directorySuggestions = ref<VisitorSearchResult[]>([])
const directorySelected = ref<VisitorSearchResult | null>(null)
const directorySearchInput = ref('')
const showDuplicateEmailDialog = ref(false)
const duplicateEmailMatches = ref<VisitorSearchResult[]>([])

async function searchDirectory(event: { query: string }): Promise<void> {
  const q = (event.query ?? '').trim()
  if (q.length < 2) { directorySuggestions.value = []; return }
  try {
    directorySuggestions.value = await visitorsApi.search(q, 10)
  } catch (e) {
    console.error('Visitor directory search failed', e)
    directorySuggestions.value = []
  }
}

// Maps userId --- display label for internal participants
const internalParticipantLabels = ref<Record<string, string>>({})
const plantResources = ref<Resource[]>([])
const loadingPlantResources = ref(false)
const resourceNameFilter = ref('')
const resourceTypeFilter = ref('')
type WizardFieldOption = { label: string; value: string }
type WizardCustomField = {
  id: string
  label: string
  fieldType: string
  isRequired: boolean
  sortOrder: number
  placeholder?: string
  options: WizardFieldOption[]
  sourceTags: string[]
}

const visitorTypeCustomFields = ref<WizardCustomField[]>([])
const bookingCustomFields = ref<WizardCustomField[]>([])

// ------ Steps definition ---------------------------------------------------------------------------------------------------------------------------------------------------
const steps = computed(() => [
  { label: t('wizard.step1') },
  { label: t('wizard.step2') },
  { label: t('wizard.step3') },
  { label: t('wizard.step4') },
  { label: t('wizard.step5') },
  { label: t('wizard.step6') },
  { label: t('wizard.step7') },
  { label: t('wizard.step8') },
])

// ------ Invite modes ---------------------------------------------------------------------------------------------------------------------------------------------------------------
// Fase 1 (release 31/05/2026): - abilitata solo la "Modalit- 3 - Nominativa completa".
// Modalit- 1 e 2 restano nell'enum per compatibilit- ma non sono selezionabili
// dall'utente finch- non verranno rilasciate nelle fasi successive.
const PHASE_1_ONLY_MODE_3 = true

const inviteModes = computed(() => {
  const all = [
    {
      value: 'GenericLink',
      title: t('wizard.inviteGenericTitle'),
      description: t('wizard.inviteGenericDesc'),
      icon: 'pi pi-link',
    },
    {
      value: 'NominativeAutoComplete',
      title: t('wizard.inviteNominativeTitle'),
      description: t('wizard.inviteNominativeDesc'),
      icon: 'pi pi-envelope',
    },
    {
      value: 'NominativeComplete',
      title: t('wizard.inviteCompleteTitle'),
      description: t('wizard.inviteCompleteDesc'),
      icon: 'pi pi-user-plus',
    },
  ]
  return PHASE_1_ONLY_MODE_3
      ? all.filter((m) => m.value === 'NominativeComplete')
      : all
})

// ------ Frequency options ---------------------------------------------------------------------------------------------------------------------------------------------------
const frequencyOptions = computed(() => [
  { label: t('wizard.recurrencePeriodDays'),   value: 'DAILY' },
  { label: t('wizard.recurrencePeriodWeeks'),  value: 'WEEKLY' },
  { label: t('wizard.recurrencePeriodMonths'), value: 'MONTHLY' },
  { label: t('wizard.recurrencePeriodYears'),  value: 'YEARLY' },
])

const weekDays = computed(() => [
  { label: t('wizard.weekMon'), short: t('wizard.weekMonShort'), value: 'MO' },
  { label: t('wizard.weekTue'), short: t('wizard.weekTueShort'), value: 'TU' },
  { label: t('wizard.weekWed'), short: t('wizard.weekWedShort'), value: 'WE' },
  { label: t('wizard.weekThu'), short: t('wizard.weekThuShort'), value: 'TH' },
  { label: t('wizard.weekFri'), short: t('wizard.weekFriShort'), value: 'FR' },
  { label: t('wizard.weekSat'), short: t('wizard.weekSatShort'), value: 'SA' },
  { label: t('wizard.weekSun'), short: t('wizard.weekSunShort'), value: 'SU' },
])

const recurrencePreviewText = computed((): string => {
  if (!formData.value.isRecurring || !formData.value.recurrenceEndDate) return ''
  const interval = formData.value.recurrenceInterval ?? 1
  const freq = formData.value.frequency
  const until = formatDate(formData.value.recurrenceEndDate)
  const periodLabel = frequencyOptions.value.find((o) => o.value === freq)?.label?.toLowerCase() ?? freq.toLowerCase()
  let text = `${t('wizard.recurrenceEvery')} ${interval} ${periodLabel}`
  if (freq === 'WEEKLY' && formData.value.recurringDays.length > 0) {
    const dayLabels = formData.value.recurringDays
        .map((code) => weekDays.value.find((d) => d.value === code)?.label ?? code)
        .join(', ')
    text += ` — ${dayLabels}`
  }
  if (freq === 'DAILY' && !formData.value.dailyIncludeWeekends) {
    text += ` (${t('wizard.excludeWeekendsLabel')})`
  }
  text += ` ${t('wizard.recurrenceUntil')} ${until}`
  return text
})

const blockedBookingDates = computed(() => {
  if (!formData.value.plantId) {
    return []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const blocked: Date[] = []
  for (let offset = 0; offset < 366; offset += 1) {
    const candidate = new Date(today)
    candidate.setDate(today.getDate() + offset)
    if (isDateBlockedForBooking(candidate)) {
      blocked.push(candidate)
    }
  }

  return blocked
})

const isSelectedDateBlocked = computed(() =>
  !!formData.value.date && isDateBlockedForBooking(formData.value.date)
)

const selectedDateBlockedMessage = computed(() =>
  getBlockedDateMessage(formData.value.date)
)

// ------ Form data ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const formData = ref({
  title: '',
  plantId: '' as string,
  date: new Date() as Date,
  timeSlots: {} as Record<string, { startTime: string; endTime: string }>,
  isRecurring: false,
  frequency: 'WEEKLY',
  recurrenceInterval: 1,
  recurringDays: [] as string[],
  // Solo per ricorrenza DAILY: se false esclude SA/SU dalle occorrenze.
  // Mappato lato backend con daysOfWeek=['MO','TU','WE','TH','FR'].
  dailyIncludeWeekends: true,
  recurrenceEndDate: null as Date | null,
  participants: [] as CreateBookingParticipantDto[],
  inviteMode: InviteMode.NominativeComplete, // Fase 1: solo Modalit- 3 - abilitata
  maxVisitors: 0,
  linkExpiryDate: null as Date | null,
  visitorEmails: [] as string[],
  visitors: [] as WizardVisitor[],
  customFieldValues: {} as Record<string, unknown>,
})

// ------ Computed: options ---------------------------------------------------------------------------------------------------------------------------------------------------
const plantOptions = computed(() =>
    plantsStore.activePlants.map((plant) => ({
      label: plant.name,
      value: plant.id,
    }))
)

// Resources filtered by selected plant + esclude quelle il cui ResourceType è disattivo
// (regola globale: se "Cinema" è disattivo, "Cinema 1" non è prenotabile).
const availableResources = computed(() =>
  plantResources.value.filter((r) => {
    const rt = resourcesStore.resourceTypeById(r.resourceTypeId)
    return !rt || rt.isActive !== false
  })
)

const availableResourceTypes = computed(() => {
  const typeIds = new Set(availableResources.value.map((r) => r.resourceTypeId))
  return [...typeIds]
    .map((id) => ({ id, name: getResourceTypeName(id) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'it'))
})

const filteredResources = computed(() => {
  let list = availableResources.value
  if (resourceNameFilter.value.trim()) {
    const q = resourceNameFilter.value.toLowerCase()
    list = list.filter((r) => r.name.toLowerCase().includes(q))
  }
  if (resourceTypeFilter.value) {
    list = list.filter((r) => r.resourceTypeId === resourceTypeFilter.value)
  }
  return [...list].sort((a, b) => a.name.localeCompare(b.name, 'it'))
})

const groupedResources = computed(() => {
  const groups = new Map<string, { typeId: string; typeName: string; resources: typeof filteredResources.value }>()
  for (const resource of filteredResources.value) {
    const typeName = getResourceTypeName(resource.resourceTypeId)
    if (!groups.has(resource.resourceTypeId)) {
      groups.set(resource.resourceTypeId, { typeId: resource.resourceTypeId, typeName, resources: [] })
    }
    groups.get(resource.resourceTypeId)!.resources.push(resource)
  }
  return [...groups.values()].sort((a, b) => a.typeName.localeCompare(b.typeName, 'it'))
})

// Visitor types - from dedicated store
const visitorTypeOptions = computed(() =>
    visitorTypesStore.visitorTypes
        .filter((vt) => vt.isActive)
        .map((vt) => ({ label: vt.name, value: vt.id }))
)

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeFieldOptions(options?: Array<{ label?: string; value?: string }> | string[]): WizardFieldOption[] {
  if (!options || options.length === 0) return []

  if (typeof options[0] === 'string') {
    return (options as string[]).map((option) => ({ label: option, value: option }))
  }

  return (options as Array<{ label?: string; value?: string }>)
      .map((option) => ({
        label: option.label ?? option.value ?? '',
        value: option.value ?? option.label ?? '',
      }))
      .filter((option) => option.value.length > 0)
}

function normalizeLegacyField(field: CustomField): WizardCustomField {
  return {
    id: field.id,
    label: field.label,
    fieldType: field.fieldType,
    isRequired: field.isRequired,
    sortOrder: field.sortOrder ?? 0,
    placeholder: field.placeholder ?? undefined,
    options: normalizeFieldOptions(field.options),
    sourceTags: [],
  }
}

function normalizeLinkedField(field: FieldLinkResponse, sourceTag?: string): WizardCustomField {
  return {
    id: field.customFieldId || field.id,
    label: field.label,
    fieldType: field.fieldType,
    isRequired: field.isRequired,
    sortOrder: field.sortOrder ?? 0,
    options: normalizeFieldOptions(field.options),
    sourceTags: sourceTag ? [sourceTag] : [],
  }
}

function mergeWizardFields(fields: WizardCustomField[]): WizardCustomField[] {
  const merged = new Map<string, WizardCustomField>()

  for (const field of fields) {
    const existing = merged.get(field.id)
    if (!existing) {
      merged.set(field.id, {
        ...field,
        options: [...field.options],
        sourceTags: [...field.sourceTags],
      })
      continue
    }

    existing.isRequired = existing.isRequired || field.isRequired
    existing.sortOrder = Math.min(existing.sortOrder, field.sortOrder)
    existing.placeholder = existing.placeholder || field.placeholder
    existing.sourceTags = [...new Set([...existing.sourceTags, ...field.sourceTags])]

    if (existing.options.length === 0 && field.options.length > 0) {
      existing.options = [...field.options]
    }
  }

  return [...merged.values()].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder
    return left.label.localeCompare(right.label, 'it')
  })
}

function sanitizeCustomFieldValues(
    values: Record<string, unknown>,
    fields: WizardCustomField[]
): Record<string, unknown> {
  const allowedKeys = new Set(fields.map((field) => getFieldValueKey(field)))
  return Object.fromEntries(
      Object.entries(values).filter(([key]) => allowedKeys.has(key))
  )
}

function getFieldValueKey(field: { id: string }): string {
  return field.id
}

function parseRecord(value: unknown): Record<string, unknown> {
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

function getFieldOptions(field: WizardCustomField): WizardFieldOption[] {
  return field.options
}

function getMultipleChoiceValues(
    values: Record<string, unknown>,
    field: WizardCustomField
): string[] {
  const raw = values[getFieldValueKey(field)]
  return Array.isArray(raw) ? raw.map((value) => String(value)) : []
}

function setMultipleChoiceValue(
    values: Record<string, unknown>,
    field: WizardCustomField,
    optionValue: string,
    checked: boolean
): void {
  const currentValues = getMultipleChoiceValues(values, field)
  values[getFieldValueKey(field)] = checked
      ? [...new Set([...currentValues, optionValue])]
      : currentValues.filter((value) => value !== optionValue)
}

// Verifica se un singolo campo è compilato (usato per evidenziazione visiva)
function isFieldFilled(field: { id: string; fieldType: string; isRequired: boolean }, values: Record<string, unknown>): boolean {
  const key = getFieldValueKey(field)
  const val = values[key]
  if (val === null || val === undefined || val === '') return false
  if (typeof val === 'boolean') return true
  return true
}

function hasMissingRequiredFields(
    fields: WizardCustomField[],
    values: Record<string, unknown>
): boolean {
  return fields.some((field) => {
    if (!field.isRequired) return false

    const value = values[getFieldValueKey(field)]
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'boolean') return !value
    return value === null || value === undefined || String(value).trim().length === 0
  })
}

function isBookingFieldMissing(field: WizardCustomField): boolean {
  return showFieldErrors.value && field.isRequired && !isFieldFilled(field, formData.value.customFieldValues)
}

/**
 * Carica i custom fields del visitorTypeId del partecipante che sto inserendo nel modal
 * (newVisitor) — non più globale al booking. Triggerato dal watch su newVisitor.visitorTypeId.
 */
async function loadVisitorTypeCustomFields(): Promise<void> {
  const typeId = newVisitor.value.visitorTypeId
  if (!typeId) {
    visitorTypeCustomFields.value = []
    newVisitor.value.customFields = {}
    return
  }

  // Filtro: i "campi di sistema" (isSystem=true) sono storicamente seminati dal backend
  // ma corrispondono a info anagrafiche (nome, email, n. persone, data, capogruppo) che
  // il wizard gestisce nativamente. NON vanno mostrati come custom fields.
  const stripSystemFields = (fields: CustomField[]): CustomField[] =>
      fields.filter((f) => !(f as { isSystem?: boolean }).isSystem)

  try {
    const links = await customFieldsApi.getVisitorTypeLinks(typeId)
    if (links.length > 0) {
      const visitorTypeName = getVisitorTypeName(typeId)
      visitorTypeCustomFields.value = mergeWizardFields(links.map((field) => normalizeLinkedField(field, visitorTypeName)))
    } else {
      const visitorType = visitorTypesStore.visitorTypeById(typeId)
      const legacy = stripSystemFields(visitorType?.customFields ?? [])
      visitorTypeCustomFields.value = mergeWizardFields(legacy.map(normalizeLegacyField))
    }
  } catch (error) {
    console.error('Failed to load visitor type custom fields:', error)
    const visitorType = visitorTypesStore.visitorTypeById(typeId)
    const legacy = stripSystemFields(visitorType?.customFields ?? [])
    visitorTypeCustomFields.value = mergeWizardFields(legacy.map(normalizeLegacyField))
  }

  newVisitor.value.customFields = sanitizeCustomFieldValues(
      newVisitor.value.customFields,
      visitorTypeCustomFields.value
  )
}

async function loadBookingCustomFields(): Promise<void> {
  if (selectedResourceIds.value.length === 0) {
    bookingCustomFields.value = []
    formData.value.customFieldValues = {}
    return
  }

  const collectedFields: WizardCustomField[] = []

  for (const resourceId of selectedResourceIds.value) {
    const resourceName = getResourceName(resourceId)
    try {
      const resourceLinks = await customFieldsApi.getResourceLinks(resourceId)
      collectedFields.push(...resourceLinks.map((field) => normalizeLinkedField(field, resourceName)))
    } catch (error) {
      console.error(`Failed to load custom fields for resource ${resourceId}:`, error)
    }

    const resource = resourcesStore.resourceById(resourceId)
    if (!resource) continue

    // Stesso filtro applicato ai fields del tipo visitatore: i campi isSystem (anagrafici)
    // non devono finire tra i custom field, sono già coperti da campi nativi del wizard.
    const stripSystem = (arr: CustomField[]): CustomField[] =>
        arr.filter((f) => !(f as { isSystem?: boolean }).isSystem)

    try {
      const resourceTypeLinks = await customFieldsApi.getResourceTypeLinks(resource.resourceTypeId)
      const resourceTypeName = resourcesStore.resourceTypeById(resource.resourceTypeId)?.name || t('resourceTypes.title')
      if (resourceTypeLinks.length > 0) {
        collectedFields.push(...resourceTypeLinks.map((field) => normalizeLinkedField(field, resourceTypeName)))
      } else {
        const legacyFields = stripSystem(resourcesStore.resourceTypeById(resource.resourceTypeId)?.customFields ?? [])
        collectedFields.push(...legacyFields.map(normalizeLegacyField))
      }
    } catch (error) {
      console.error(`Failed to load custom fields for resource type ${resource.resourceTypeId}:`, error)
      const legacyFields = stripSystem(resourcesStore.resourceTypeById(resource.resourceTypeId)?.customFields ?? [])
      collectedFields.push(...legacyFields.map(normalizeLegacyField))
    }
  }

  bookingCustomFields.value = mergeWizardFields(collectedFields)
  formData.value.customFieldValues = sanitizeCustomFieldValues(
      formData.value.customFieldValues,
      bookingCustomFields.value
  )
}

// Validation guards
const canProceed = computed(() => {
  switch (activeStep.value) {
    case 0: return !!formData.value.plantId && selectedResourceIds.value.length > 0
    case 1: return !!formData.value.date && !isSelectedDateBlocked.value && selectedResourceIds.value.every(
        (id) => formData.value.timeSlots[id]?.startTime && formData.value.timeSlots[id]?.endTime
    )
    case 4: return !!formData.value.inviteMode
    case 6: return !hasMissingRequiredFields(bookingCustomFields.value, formData.value.customFieldValues)
    default: return true
  }
})

const canSubmit = computed(() =>
    !!formData.value.plantId &&
    selectedResourceIds.value.length > 0 &&
    !!formData.value.date &&
    !hasMissingRequiredFields(bookingCustomFields.value, formData.value.customFieldValues)
)

function goToStep(index: number): void {
  if (index < 0 || index >= steps.value.length) return
  if (index <= activeStep.value) {
    activeStep.value = index
    return
  }
  if (index === activeStep.value + 1 && canProceed.value) {
    activeStep.value = index
  }
}

// ------ Watch: plant change --- reload resources by plant ---------------------------------------------------------
watch(
    () => formData.value.plantId,
    async (newPlantId) => {
      plantResources.value = []
      if (newPlantId) {
        loadingPlantResources.value = true
        try {
          const result = await resourcesStore.fetchResourcesByPlant(newPlantId)
          plantResources.value = result ?? []
        } catch (e) {
          console.error('Error loading resources for plant:', e)
        } finally {
          loadingPlantResources.value = false
        }
      }
    }
)

watch(
    () => newVisitor.value.visitorTypeId,
    async () => {
      await loadVisitorTypeCustomFields()
    }
)

watch(
    () => [...selectedResourceIds.value],
    async () => {
      await loadBookingCustomFields()
    },
    { deep: true }
)

// ------ Helper functions ------------------------------------------------------------------------------------------------------------------------------------------------------
function getPlantName(plantId: string): string {
  return plantsStore.plantById(plantId)?.name ?? '–'
}

function getResourceName(resourceId: string): string {
  return resourcesStore.resourceById(resourceId)?.name ?? '–'
}

function getResourceTypeName(typeId: string): string {
  return resourcesStore.resourceTypeById(typeId)?.name ?? ''
}

function getVisitorTypeName(typeId: string): string {
  return visitorTypesStore.visitorTypeById(typeId)?.name ?? '–'
}

function getInviteModeName(mode: string): string {
  return inviteModes.value.find((m) => m.value === mode)?.title ?? mode
}

function formatDate(date: Date | null): string {
  if (!date) return '–'
  return date.toLocaleDateString(locale.value)
}

function isDateBlockedForBooking(date: Date | null): boolean {
  if (!date || !formData.value.plantId) {
    return false
  }

  if (isHolidayBlockingDate(date, formData.value.plantId)) {
    return true
  }

  const resourceIds = selectedResourceIds.value.length > 0
    ? selectedResourceIds.value
    : availableResources.value.map((resource) => resource.id)

  return resourceIds.some((resourceId) =>
    isAllDayBlockOnDateForResource(date, resourceId, formData.value.plantId)
  )
}

function getBlockedDateMessage(date: Date | null): string {
  if (!date || !formData.value.plantId) {
    return ''
  }

  if (isHolidayBlockingDate(date, formData.value.plantId)) {
    return t('wizard.blockedDateHoliday')
  }

  return t('wizard.blockedDateResource')
}

function isHolidayBlockingDate(date: Date, plantId: string): boolean {
  const targetDate = normalizeLocalDate(date)

  return unavailabilityStore.activeHolidays.some((holiday) =>
    doesHolidayApplyToPlant(holiday, plantId) && doesHolidayIncludeDate(holiday, targetDate)
  )
}

function isAllDayBlockOnDateForResource(date: Date, resourceId: string, plantId: string): boolean {
  const targetDate = normalizeLocalDate(date)

  return unavailabilityStore.activeUnavailabilityBlocks.some((block) =>
    block.isAllDay
    && doesBlockApplyToResource(block, resourceId, plantId)
    && doesBlockCoverDate(block, targetDate)
  )
}

function doesHolidayApplyToPlant(holiday: Holiday, plantId: string): boolean {
  return !holiday.plantId || holiday.plantId === plantId
}

function doesHolidayIncludeDate(holiday: Holiday, targetDate: Date): boolean {
  const startDate = normalizeLocalDate(new Date(holiday.startDate))

  if (holiday.holidayType === 'RecurringAnnual') {
    return startDate.getDate() === targetDate.getDate() && startDate.getMonth() === targetDate.getMonth()
  }

  const endDate = holiday.endDate
    ? normalizeLocalDate(new Date(holiday.endDate))
    : startDate

  return targetDate >= startDate && targetDate <= endDate
}

function doesBlockApplyToResource(block: UnavailabilityBlock, resourceId: string, plantId: string): boolean {
  if (block.resourceId) {
    return block.resourceId === resourceId
  }

  if (block.plantId) {
    return block.plantId === plantId
  }

  return false
}

function doesBlockCoverDate(block: UnavailabilityBlock, targetDate: Date): boolean {
  const startDate = normalizeLocalDate(new Date(block.startTime))
  const endDate = normalizeLocalDate(new Date(block.endTime))

  if (!block.isRecurring) {
    return targetDate >= startDate && targetDate <= endDate
  }

  const recurrence = parseUnavailabilityRecurrence(block.recurrenceRule, startDate)
  if (!recurrence || targetDate < startDate || targetDate > recurrence.endDate) {
    return false
  }

  switch (recurrence.frequency) {
    case 'DAILY':
      return true
    case 'WEEKLY':
      return recurrence.daysOfWeek.has(targetDate.getDay())
    case 'BIWEEKLY': {
      const seedWeekStart = getStartOfWeek(startDate)
      const targetWeekStart = getStartOfWeek(targetDate)
      const diffDays = Math.round((targetWeekStart.getTime() - seedWeekStart.getTime()) / 86400000)
      const diffWeeks = Math.floor(diffDays / 7)
      return diffWeeks >= 0 && diffWeeks % 2 === 0 && recurrence.daysOfWeek.has(targetDate.getDay())
    }
    case 'MONTHLY':
      return targetDate.getDate() === startDate.getDate()
    default:
      return false
  }
}

function parseUnavailabilityRecurrence(
  recurrenceRule: string | null | undefined,
  seedDate: Date
): {
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  endDate: Date
  daysOfWeek: Set<number>
} | null {
  if (!recurrenceRule) {
    return null
  }

  try {
    const parsed = JSON.parse(recurrenceRule) as {
      frequency?: string
      endDate?: string
      daysOfWeek?: string[]
    }

    const frequency = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'].includes(parsed.frequency ?? '')
      ? parsed.frequency as 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
      : 'DAILY'

    const endDate = parsed.endDate
      ? normalizeLocalDate(new Date(`${parsed.endDate}T00:00:00`))
      : normalizeLocalDate(new Date(seedDate.getFullYear() + 1, seedDate.getMonth(), seedDate.getDate()))

    const codeToDay: Record<string, number> = {
      SUN: 0,
      MON: 1,
      TUE: 2,
      WED: 3,
      THU: 4,
      FRI: 5,
      SAT: 6,
    }

    const daysOfWeek = new Set<number>(
      (parsed.daysOfWeek ?? [])
        .map((code) => codeToDay[code?.toUpperCase?.() ?? ''])
        .filter((day): day is number => typeof day === 'number')
    )

    if ((frequency === 'WEEKLY' || frequency === 'BIWEEKLY') && daysOfWeek.size === 0) {
      daysOfWeek.add(seedDate.getDay())
    }

    return {
      frequency,
      endDate,
      daysOfWeek,
    }
  } catch {
    return null
  }
}

function normalizeLocalDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getStartOfWeek(date: Date): Date {
  const normalized = normalizeLocalDate(date)
  const day = normalized.getDay()
  const diff = day === 0 ? -6 : 1 - day
  normalized.setDate(normalized.getDate() + diff)
  return normalized
}

// ------ Availability check ------------------------------------------------------------------------------------------------------------------------------------------------
let availabilityCheckTimeout: ReturnType<typeof setTimeout> | null = null

async function checkSlotAvailability(resourceId: string): Promise<void> {
  const startTime = formData.value.timeSlots[resourceId]?.startTime
  const endTime = formData.value.timeSlots[resourceId]?.endTime

  if (!startTime || !endTime || !formData.value.date) {
    availabilityStatus.value[resourceId] = 'unknown'
    return
  }

  // Debounce the check
  if (availabilityCheckTimeout) {
    clearTimeout(availabilityCheckTimeout)
  }

  availabilityStatus.value[resourceId] = 'checking'

  availabilityCheckTimeout = setTimeout(async () => {
    try {
      const dateStr = formData.value.date!.toISOString().split('T')[0]
      const checkDto = {
        resourceId,
        startTime: `${dateStr}T${startTime}:00`,
        endTime: `${dateStr}T${endTime}:00`,
      }

      const result = await bookingsStore.checkAvailability(checkDto)

      if (result.isAvailable) {
        availabilityStatus.value[resourceId] = 'ok'
      } else {
        availabilityStatus.value[resourceId] = 'warning'
      }
    } catch (err) {
      console.error('Failed to check availability:', err)
      availabilityStatus.value[resourceId] = 'unknown'
    }
  }, 500)
}

// ------ Resource toggle ---------------------------------------------------------------------------------------------------------------------------------------------------------
function toggleResource(resourceId: string): void {
  const idx = selectedResourceIds.value.indexOf(resourceId)
  if (idx > -1) {
    selectedResourceIds.value.splice(idx, 1)
    const slots = { ...formData.value.timeSlots }
    delete slots[resourceId]
    formData.value.timeSlots = slots
  } else {
    selectedResourceIds.value.push(resourceId)
    formData.value.timeSlots = {
      ...formData.value.timeSlots,
      [resourceId]: { startTime: '09:00', endTime: '17:00' },
    }
  }
}

// ------ Plant change ------------------------------------------------------------------------------------------------------------------------------------------------------------------
function onPlantChange(): void {
  selectedResourceIds.value = []
  formData.value.timeSlots = {}
  resourceNameFilter.value = ''
  resourceTypeFilter.value = ''
}

// ------ Recurrence ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function toggleDay(day: string): void {
  const idx = formData.value.recurringDays.indexOf(day)
  if (idx > -1) formData.value.recurringDays.splice(idx, 1)
  else formData.value.recurringDays.push(day)
}

// ------ Participants ------------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * Suggerimenti per l'autocomplete partecipanti interni (DRF §6.4 — selezione
 * dalla rubrica del tenant). Filtra usersStore.users in base a query digitata
 * (nome o email, case-insensitive) ed esclude:
 *   - utenti non attivi
 *   - utenti già aggiunti tra i partecipanti (no doppioni)
 *   - l'utente corrente, se è già il Booking.Owner
 *
 * Usa l'ID GUID reale dell'utente come <c>value</c>: questo era il bug
 * precedente — un placeholder hardcoded ritornava string non-UUID che
 * mandava in crash il parser JSON del backend (Guid format error).
 */
function onSearchUsers(event: { query?: string }): void {
  const query = (event?.query ?? '').trim().toLowerCase()
  const alreadyAddedIds = new Set(
    formData.value.participants
      .filter((p) => p.isInternal && p.userId)
      .map((p) => p.userId as string),
  )
  const currentUserId = authStore.user?.userId

  filteredUsers.value = usersStore.users
      .filter((u) => u.isActive)
      .filter((u) => !alreadyAddedIds.has(u.id))
      .filter((u) => u.id !== currentUserId) // l'organizzatore non si auto-invita
      .filter((u) => {
        if (!query) return true
        const name = (u.fullName || '').toLowerCase()
        const email = u.email.toLowerCase()
        return name.includes(query) || email.includes(query)
      })
      .map((u) => {
        const fullName = u.fullName?.trim() ?? ''
        return {
          label: fullName ? `${fullName} (${u.email})` : u.email,
          value: u.id,
          fullName,
          email: u.email,
          initials: (fullName || u.email).charAt(0).toUpperCase(),
        }
      })
      .slice(0, 20) // limita a 20 suggerimenti
}

function onUserSelect(event: any): void {
  const user = event.value
  if (user && !formData.value.participants.find((p) => p.userId === user.value)) {
    formData.value.participants.push({ userId: user.value, isInternal: true })
    internalParticipantLabels.value[user.value] = user.label
  }
  participantSearch.value = ''
}

function removeParticipant(idx: number): void {
  formData.value.participants.splice(idx, 1)
}

/**
 * Etichetta del partecipante interno mostrata nelle chip.
 * Risolve in cascata: cache locale (impostata al momento della selezione)
 * → lookup nello users store → fallback all'ID. Coerente con la regola
 * applicata nelle altre viste (DRF: organizzatore/partecipanti come nome
 * leggibile, mai come UUID grezzo).
 */
function getInternalParticipantLabel(userId?: string): string {
  if (!userId) return '–'
  const cached = internalParticipantLabels.value[userId]
  if (cached) return cached
  const user = usersStore.users.find((u) => u.id === userId)
  if (!user) return userId
  return user.fullName?.trim() || user.email || userId
}

// ------ Visitors ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function addVisitorEmail(): void {
  const email = visitorEmail.value.trim()
  if (email && email.includes('@') && !formData.value.visitorEmails.includes(email)) {
    formData.value.visitorEmails.push(email)
    visitorEmail.value = ''
  }
}

function removeVisitorEmail(idx: number): void {
  formData.value.visitorEmails.splice(idx, 1)
}

/** Pending action quando il popup duplicato email è aperto. */
const duplicateEmailResolver = ref<((saveAnyway: boolean) => void) | null>(null)

function resolveDuplicateEmail(saveAnyway: boolean): void {
  showDuplicateEmailDialog.value = false
  duplicateEmailResolver.value?.(saveAnyway)
  duplicateEmailResolver.value = null
}

/**
 * Aggiunge il visitatore corrente alla lista. Se l'utente ha attivato
 * "Salva in rubrica" e l'email è già censita per il tenant, mostra il
 * popup di conferma prima di procedere (decisione utente).
 */
async function confirmAddVisitor(): Promise<void> {
  if (!newVisitor.value.firstName || !newVisitor.value.lastName || !newVisitor.value.email) return
  // VisitorType è obbligatoria a livello di singolo partecipante.
  if (!newVisitor.value.visitorTypeId) return
  if (hasMissingRequiredFields(visitorTypeCustomFields.value, newVisitor.value.customFields)) return

  // Se l'utente vuole salvare in rubrica (e non sta riusando un contatto esistente),
  // verifica eventuali duplicati per email.
  if (newVisitor.value.saveToDirectory && !newVisitor.value.contactId) {
    try {
      const check = await visitorsApi.checkEmail(newVisitor.value.email.trim())
      if (check.hasMatches) {
        duplicateEmailMatches.value = check.existingMatches
        showDuplicateEmailDialog.value = true
        const keepSave = await new Promise<boolean>((resolve) => {
          duplicateEmailResolver.value = resolve
        })
        // Se l'utente sceglie "Tieni l'esistente", colleghiamo il contatto già in rubrica
        // (il primo match) e disattiviamo saveToDirectory per non duplicare.
        if (!keepSave && check.existingMatches.length > 0) {
          newVisitor.value.contactId = check.existingMatches[0].id
          newVisitor.value.saveToDirectory = false
        }
      }
    } catch (e) {
      console.warn('Visitor email duplicate check failed (non-blocking):', e)
    }
  }

  const visitorPayload: WizardVisitor = {
    firstName: newVisitor.value.firstName.trim(),
    lastName:  newVisitor.value.lastName.trim(),
    email:     newVisitor.value.email.trim(),
    phone:     newVisitor.value.phone?.trim() || undefined,
    visitorTypeId: newVisitor.value.visitorTypeId,
    customFields: { ...newVisitor.value.customFields },
    isGroupLeader: newVisitor.value.isGroupLeader,
    contactId: newVisitor.value.contactId,
    saveToDirectory: newVisitor.value.saveToDirectory,
  }

  // DRF §4.3: solo un visitatore alla volta può essere Capogruppo.
  if (visitorPayload.isGroupLeader) {
    formData.value.visitors = formData.value.visitors.map((v, i) =>
      // se siamo in edit mode, non azzerare il flag dell'item che stiamo editando
      i === editingVisitorIndex.value ? v : { ...v, isGroupLeader: false }
    )
  }

  if (editingVisitorIndex.value !== null) {
    formData.value.visitors.splice(editingVisitorIndex.value, 1, visitorPayload)
  } else {
    formData.value.visitors.push(visitorPayload)
  }

  newVisitor.value = emptyVisitor()
  directorySelected.value = null
  directorySearchInput.value = ''
  editingVisitorIndex.value = null
  showAddVisitorDialog.value = false
}

function cancelAddVisitor(): void {
  newVisitor.value = emptyVisitor()
  directorySelected.value = null
  directorySearchInput.value = ''
  editingVisitorIndex.value = null
  showAddVisitorDialog.value = false
}

function removeVisitor(idx: number): void {
  formData.value.visitors.splice(idx, 1)
}

function openManualDialog(): void {
  newVisitor.value = emptyVisitor()
  directorySelected.value = null
  directorySearchInput.value = ''
  editingVisitorIndex.value = null
  showAddVisitorDialog.value = true
}

function openDirectoryDialog(): void {
  directoryPicked.value = null
  directoryIsGroupLeader.value = false
  directoryVisitorTypeId.value = ''
  directorySuggestions.value = []
  showDirectoryDialog.value = true
}

function cancelDirectoryAdd(): void {
  directoryPicked.value = null
  directoryIsGroupLeader.value = false
  directoryVisitorTypeId.value = ''
  showDirectoryDialog.value = false
}

async function confirmDirectoryAdd(): Promise<void> {
  if (!directoryPicked.value || typeof directoryPicked.value === 'string') return
  if (!directoryVisitorTypeId.value) return

  const contact = directoryPicked.value
  const typeId = directoryVisitorTypeId.value

  // Carichiamo i custom fields del visitor type scelto per QUESTO partecipante,
  // in modo da sanitizzare correttamente i valori salvati nel contatto.
  newVisitor.value.visitorTypeId = typeId
  await loadVisitorTypeCustomFields()

  // Custom fields salvati sul contatto (JSON serializzato lato BE).
  // Copiamo SOLO i valori delle chiavi richieste dal visitor type del partecipante.
  const savedFromContact = parseRecord(contact.customFieldValues)
  const matchedCustomFields: Record<string, unknown> = {}
  for (const field of visitorTypeCustomFields.value) {
    const key = getFieldValueKey(field)
    if (key in savedFromContact) {
      matchedCustomFields[key] = savedFromContact[key]
    }
  }

  // Se mancano campi obbligatori non presenti in rubrica, deleghiamo al modal manuale
  // pre-popolato così l'utente compila solo le info mancanti.
  const stillMissingRequired = hasMissingRequiredFields(visitorTypeCustomFields.value, matchedCustomFields)

  const visitor: WizardVisitor = {
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    visitorTypeId: typeId,
    customFields: matchedCustomFields,
    isGroupLeader: directoryIsGroupLeader.value,
    contactId: contact.id,
    saveToDirectory: false,
  }

  if (stillMissingRequired) {
    // Apriamo il modal manuale come "completa i dati mancanti": il visitatore
    // NON viene ancora aggiunto alla lista — lo aggiungerà confirmAddVisitor.
    newVisitor.value = visitor
    editingVisitorIndex.value = null
    directoryPicked.value = null
    directoryIsGroupLeader.value = false
    directoryVisitorTypeId.value = ''
    showDirectoryDialog.value = false
    showAddVisitorDialog.value = true
    return
  }

  // DRF §4.3: solo un Capogruppo per prenotazione.
  if (visitor.isGroupLeader) {
    formData.value.visitors = formData.value.visitors.map((v) => ({ ...v, isGroupLeader: false }))
  }

  formData.value.visitors.push(visitor)

  directoryPicked.value = null
  directoryIsGroupLeader.value = false
  directoryVisitorTypeId.value = ''
  showDirectoryDialog.value = false
}

function openEditVisitor(idx: number): void {
  const v = formData.value.visitors[idx]
  if (!v) return
  newVisitor.value = {
    firstName: v.firstName,
    lastName: v.lastName,
    email: v.email,
    phone: v.phone ?? '',
    visitorTypeId: v.visitorTypeId,
    customFields: { ...(v.customFields ?? {}) },
    isGroupLeader: !!v.isGroupLeader,
    contactId: v.contactId,
    saveToDirectory: !!v.saveToDirectory,
  }
  directorySelected.value = null
  directorySearchInput.value = ''
  editingVisitorIndex.value = idx
  showAddVisitorDialog.value = true
}

// ------ Navigation ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function previousStep(): void {
  if (activeStep.value > 0) activeStep.value--
}

function nextStep(): void {
  if (!canProceed.value) {
    showFieldErrors.value = true
    requestAnimationFrame(() => {
      const target = document.querySelector('.field-missing-card, .field-missing-error')
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
    return
  }
  showFieldErrors.value = false
  if (activeStep.value < steps.value.length - 1) activeStep.value++
}

// ------ Submit ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function buildBookingDto(saveAsDraft: boolean): CreateBookingDto {
  // Usa la data locale per evitare sfasamenti UTC (toISOString convertirebbe in UTC)
  const d = formData.value.date
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const resources: CreateBookingResourceDto[] = selectedResourceIds.value.map((resourceId) => ({
    resourceId,
    plantId: formData.value.plantId,
    startTime: `${dateStr}T${formData.value.timeSlots[resourceId].startTime}:00`,
    endTime:   `${dateStr}T${formData.value.timeSlots[resourceId].endTime}:00`,
  }))

  const participants: CreateBookingParticipantDto[] = [
    ...formData.value.participants,
  ]

  if (formData.value.inviteMode === 'NominativeComplete') {
    formData.value.visitors.forEach((v) => {
      participants.push({
        isInternal: false,
        visitorFirstName: v.firstName,
        visitorLastName:  v.lastName,
        visitorEmail:     v.email,
        visitorTypeId:    v.visitorTypeId,
        visitorContactId: v.contactId,
        saveToDirectory:  v.saveToDirectory,
        customFieldValues: Object.keys(v.customFields).length > 0 ? v.customFields : undefined,
        // DRF §4.3 — Capogruppo (firmatario sicurezza/privacy)
        isGroupLeader: v.isGroupLeader === true,
      })
    })
  }

  if (formData.value.inviteMode === 'NominativeAutoComplete') {
    formData.value.visitorEmails.forEach((email) => {
      participants.push({
        isInternal: false,
        visitorEmail: email,
      })
    })
  }

  const dto: CreateBookingDto = {
    title:        formData.value.title || t('wizard.titleAutoDate', { date: formatDate(formData.value.date) }),
    organizerId:  authStore.user?.userId ?? '',
    inviteMode:   formData.value.inviteMode as any,
    isRecurring:  formData.value.isRecurring,
    resources,
    participants,
    resourceCustomFieldValues: formData.value.customFieldValues,
    saveAsDraft,
  }

  if (formData.value.isRecurring && formData.value.recurrenceEndDate) {
    const rd = formData.value.recurrenceEndDate
    const endDate = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(rd.getDate()).padStart(2, '0')}`
    const rule: Record<string, unknown> = {
      frequency: formData.value.frequency,
      interval: Math.max(1, formData.value.recurrenceInterval ?? 1),
      endDate,
    }
    if (formData.value.frequency === 'WEEKLY' && formData.value.recurringDays.length > 0) {
      rule.daysOfWeek = formData.value.recurringDays
    }
    // DAILY senza weekend → filtro lun-ven via daysOfWeek (gestito dal backend)
    if (formData.value.frequency === 'DAILY' && !formData.value.dailyIncludeWeekends) {
      rule.daysOfWeek = ['MO', 'TU', 'WE', 'TH', 'FR']
    }
    dto.recurrenceRule = JSON.stringify(rule)
  }

  return dto
}

async function updateDraftBooking(draftId: string, dto: CreateBookingDto): Promise<any> {
  const store = bookingsStore as any
  const payload = { ...dto, saveAsDraft: true }

  if (typeof store.updateBooking === 'function') {
    await store.updateBooking(draftId, payload)
  } else if (typeof store.updateDraft === 'function') {
    await store.updateDraft(draftId, payload)
  } else if (typeof store.updateBookingDraft === 'function') {
    await store.updateBookingDraft(draftId, payload)
  } else {
    throw new Error('Impossibile aggiornare la bozza: manca un metodo updateBooking/updateDraft nello store prenotazioni.')
  }

  if (typeof store.fetchBookingById === 'function') {
    const refreshed = await store.fetchBookingById(draftId)
    return refreshed ?? store.currentBooking ?? { ...payload, id: draftId, status: BookingStatus.Draft }
  }

  return store.currentBooking ?? { ...payload, id: draftId, status: BookingStatus.Draft }
}

/**
 * Conferma una bozza esistente trasformandola in una prenotazione attiva
 * (DRF §7.2 — transizione Draft → Confirmed o Draft → PendingApproval).
 *
 * Flusso:
 *   1) Aggiorna i dati della bozza con i valori attuali del wizard
 *      (riusa updateDraftBooking, ma forziamo saveAsDraft=false).
 *   2) Determina lo stato target in base alla policy di approvazione:
 *      - Se almeno una risorsa selezionata ha requiresApproval=true
 *        → PendingApproval (DRF §5.4)
 *      - Altrimenti → Confirmed
 *   3) Esegue ChangeStatus sulla bozza → l'evento di backend genera le
 *      notifiche, gli inviti e l'eventuale richiesta di approvazione.
 *
 * Restituisce la prenotazione aggiornata. In caso di fallimento dello
 * step 1 o 2, l'eccezione propaga al chiamante (submitBooking) che già
 * gestisce l'errore tramite submitError.value.
 */
async function submitDraftForApproval(draftId: string, dto: CreateBookingDto): Promise<any> {
  const store = bookingsStore as any

  // 1) Aggiorna i dati della bozza con i valori attuali del wizard.
  //    Il backend mantiene la bozza in stato Draft; lo stato cambierà
  //    solo nel passo 3 con ChangeStatus.
  const payload = { ...dto, saveAsDraft: false }
  if (typeof store.updateBooking === 'function') {
    await store.updateBooking(draftId, payload)
  } else if (typeof store.updateDraft === 'function') {
    await store.updateDraft(draftId, payload)
  } else if (typeof store.updateBookingDraft === 'function') {
    await store.updateBookingDraft(draftId, payload)
  } else {
    throw new Error('Impossibile aggiornare la bozza: manca un metodo updateBooking/updateDraft nello store prenotazioni.')
  }

  // 2) Calcola lo stato target. Se almeno una risorsa selezionata richiede
  //    approvazione, la bozza transita in PendingApproval; altrimenti in
  //    Confirmed. Replica la stessa logica di BookingService.CreateAsync
  //    lato backend (riga ~80-92).
  const requiresApproval = selectedResourceIds.value.some((resourceId) => {
    const resource = resourcesStore.resourceById(resourceId)
    return resource?.requiresApproval === true
  })
  const targetStatus = requiresApproval
    ? BookingStatus.PendingApproval
    : BookingStatus.Confirmed

  // 3) Cambia lo stato della bozza. Lo store aggiorna automaticamente
  //    bookings[] e currentBooking; il backend si occupa di:
  //      - emettere notifiche BookingConfirmed / BookingPendingApproval
  //      - inviare ICS METHOD:REQUEST ai partecipanti registrati
  //      - notificare gli approver se richiesto
  await bookingsStore.changeBookingStatus(draftId, {
    newStatus: targetStatus,
  })

  // Ritorna la prenotazione fresca dal backend (incluse partecipanti e risorse).
  if (typeof store.fetchBookingById === 'function') {
    const refreshed = await store.fetchBookingById(draftId)
    return refreshed ?? store.currentBooking ?? { ...payload, id: draftId, status: targetStatus }
  }

  return store.currentBooking ?? { ...payload, id: draftId, status: targetStatus }
}

async function saveDraftSilently(): Promise<void> {
  if (!hasUnsavedWork() || submitting.value || autoSavingDraft.value || isSubmittingNavigation.value) return

  const dto = buildBookingDto(true)
  const snapshot = JSON.stringify({ dto, selectedResourceIds: selectedResourceIds.value, activeStep: activeStep.value })
  if (snapshot === lastSavedDraftSnapshot.value) return

  try {
    autoSavingDraft.value = true
    const savedBooking = loadedDraftId.value
        ? await updateDraftBooking(loadedDraftId.value, dto)
        : await bookingsStore.createBooking(dto)
    const booking = savedBooking ?? bookingsStore.currentBooking

    if (booking?.id && UUID_REGEX.test(String(booking.id))) {
      loadedDraftId.value = String(booking.id)
      bookingsStore.setCurrentBooking(booking)
      lastSavedDraftSnapshot.value = snapshot
    }
  } catch (error) {
    console.error('Failed to auto-save booking draft:', error)
  } finally {
    autoSavingDraft.value = false
  }
}

function scheduleDraftAutosave(): void {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    void saveDraftSilently()
  }, 1000)
}

async function submitBooking(
    saveAsDraft = false,
    options: { redirectToDetail?: boolean } = {},
): Promise<void> {
  submitError.value = null
  try {
    submitting.value = true
    const redirectToDetail = options.redirectToDetail ?? true
    const dto = buildBookingDto(saveAsDraft)

    const savedBooking = loadedDraftId.value
        ? saveAsDraft
            ? await updateDraftBooking(loadedDraftId.value, dto)
            : await submitDraftForApproval(loadedDraftId.value, dto)
        : await bookingsStore.createBooking(dto)
    const booking = savedBooking ?? bookingsStore.currentBooking

    if (!booking?.id || !UUID_REGEX.test(String(booking.id))) {
      throw new Error('La prenotazione è stata salvata ma il dettaglio non può essere aperto perché l\'ID restituito non è valido.')
    }

    loadedDraftId.value = String(booking.id)
    bookingsStore.setCurrentBooking(booking)
    lastSavedDraftSnapshot.value = JSON.stringify({ dto, selectedResourceIds: selectedResourceIds.value, activeStep: activeStep.value })

    if (redirectToDetail) {
      isSubmittingNavigation.value = true
      await router.push({ name: 'BookingDetail', params: { id: booking.id } })
    }
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : t('wizard.submitError')
  } finally {
    submitting.value = false
  }
}

// ------ Beforeunload / route leave guard -------------------------------------------------------
// Verifica se i 4 criteri minimi sono soddisfatti per salvare come bozza automaticamente:
// 1. Titolo (o viene auto-generato dalla data)
// 2. Stabilimento selezionato
// 3. Almeno una risorsa selezionata
// 4. Data + almeno un time slot compilato
function hasUnsavedWork(): boolean {
  const hasPlant = !!formData.value.plantId
  const hasResources = selectedResourceIds.value.length > 0
  const hasDate = !!formData.value.date
  const hasTimeSlots = selectedResourceIds.value.some(
      (id) => !!formData.value.timeSlots[id]?.startTime && !!formData.value.timeSlots[id]?.endTime
  )
  return hasPlant && hasResources && hasDate && hasTimeSlots
}

function handleBeforeUnload(e: BeforeUnloadEvent): void {
  if (hasUnsavedWork()) {
    void saveDraftSilently()
    e.preventDefault()
    e.returnValue = ''
  }
}

function handlePageHide(): void {
  void saveDraftSilently()
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    void saveDraftSilently()
  }
}

onBeforeRouteLeave(() => {
  if (isSubmittingNavigation.value || !hasUnsavedWork()) return true

  return new Promise<boolean>((resolve) => {
    showDraftPromptOnLeave.value = true
    pendingNavigationResolve.value = async (choice) => {
      showDraftPromptOnLeave.value = false
      pendingNavigationResolve.value = null

      if (choice === 'cancel') {
        resolve(false)
        return
      }

      if (choice === 'draft') {
        try {
          await submitBooking(true, { redirectToDetail: false })
        } catch {
          resolve(false)
          return
        }
      }

      resolve(true)
    }
  })
})

watch(
    [formData, selectedResourceIds],
    () => {
      scheduleDraftAutosave()
    },
    { deep: true },
)

// ------ Init ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('pagehide', handlePageHide)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('pagehide', handlePageHide)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  try {
    await Promise.all([
      plantsStore.fetchAll(),
      resourcesStore.fetchAllResources(),
      resourcesStore.fetchAllResourceTypes(),
      unavailabilityStore.fetchAllUnavailabilityBlocks(),
      unavailabilityStore.fetchAllHolidays(),
      visitorTypesStore.fetchAllVisitorTypes(),
      // Carica gli utenti del tenant per l'autocomplete "Cerca partecipante"
      // (DRF §6.4 — selezione dalla rubrica). Senza questo, il dropdown
      // resta vuoto e l'utente ne vede l'inutilizzabilità.
      usersStore.users.length === 0 ? usersStore.fetchAll() : Promise.resolve(),
    ])

    // Pre-fill da bozza esistente (draftId in query param)
    const draftId = route.query.draftId as string | undefined
    if (draftId) {
      await prefillFromDraft(draftId)
      return
    }

    // Pre-fill from query parameters (quick-book from calendar)
    const startDateParam = route.query.startDate as string | undefined
    if (startDateParam) formData.value.date = new Date(startDateParam)

    const titleParam = route.query.title as string | undefined
    if (titleParam) formData.value.title = titleParam

    const resourceIdRaw = route.query.resourceId
    const resourceIdParams = Array.isArray(resourceIdRaw)
      ? (resourceIdRaw.filter(Boolean) as string[])
      : resourceIdRaw ? [resourceIdRaw as string] : []
    if (resourceIdParams.length > 0) {
      const firstResource = resourcesStore.resourceById(resourceIdParams[0])
      if (firstResource) formData.value.plantId = firstResource.plantId

      let startTime = '09:00'
      let endTime = '10:00'
      if (startDateParam) {
        const startDt = new Date(startDateParam)
        const endDt = new Date(startDt.getTime() + 60 * 60 * 1000)
        startTime = startDt.toTimeString().slice(0, 5)
        endTime = endDt.toTimeString().slice(0, 5)
      }

      for (const id of resourceIdParams) {
        const resource = resourcesStore.resourceById(id)
        if (!resource) continue
        if (!selectedResourceIds.value.includes(id)) selectedResourceIds.value.push(id)
        formData.value.timeSlots[id] = { startTime, endTime }
      }
    }
  } catch (e) {
    console.error('Failed to initialize wizard:', e)
  }
})

// Pre-riempie il wizard da una prenotazione esistente.
// Stati ammessi (DRF §7.3 — modifica consentita):
//   - Draft               → conferma diventerà Confirmed/PendingApproval
//   - PendingApproval     → modifica dei dati; lo stato resta tale
//   - Confirmed           → modifica dei dati; lo stato resta tale
// Le prenotazioni Completed/Cancelled/Rejected/InProgress non sono
// modificabili (il backend in BookingService.UpdateAsync le rifiuta
// con ValidationException).
async function prefillFromDraft(draftId: string): Promise<void> {
  try {
    const draft = await bookingsApi.getById(draftId)
    const editableStatuses = ['Draft', 'PendingApproval', 'Confirmed']
    if (!draft || !editableStatuses.includes(draft.status)) {
      console.warn('prefillFromDraft: booking non modificabile o non trovato', {
        draftId,
        status: draft?.status,
      })
      toast.add({
        severity: 'warn',
        summary: t('wizard.editNotAllowed'),
        detail: t('wizard.editNotAllowedDetail'),
        life: 5000,
      })
      return
    }

    // CRITICO: registra l'ID della bozza in carico così che submitBooking sappia
    // di fare UPDATE invece di CREATE. Senza questa riga, salvare una bozza
    // riaperta crea una NUOVA prenotazione (bug #1 di "Continua a compilare").
    loadedDraftId.value = draftId
    bookingsStore.setCurrentBooking(draft)

    formData.value.title = draft.title ?? ''
    formData.value.inviteMode = draft.inviteMode ?? InviteMode.NominativeComplete
    formData.value.isRecurring = !!draft.isRecurring
    formData.value.customFieldValues = parseRecord(draft.resourceCustomFieldValues)

    // Resources e participants possono essere null/undefined per bozze
    // appena create senza partecipanti né risorse selezionate. In quel caso
    // si applicano default vuoti, NON si esce dalla funzione: il prefill
    // dei campi base (titolo, tipo invito, ecc.) deve comunque avvenire.
    const draftResources    = draft.resources    ?? []
    const draftParticipants = draft.participants ?? []

    // Risorsa e stabilimento (dalla prima risorsa della bozza)
    const firstRes = draftResources[0]
    if (firstRes) {
      formData.value.plantId = firstRes.plantId

      // Carica le risorse dello stabilimento. Nota: il watch su plantId
      // (definito sopra) parte in parallelo e fa lo stesso fetch; ce lo
      // teniamo perché qui ci serve attenderlo prima di assegnare
      // selectedResourceIds, altrimenti la UI mostra "risorsa non trovata".
      const fetchedResources = await resourcesStore.fetchResourcesByPlant(firstRes.plantId)
      plantResources.value = fetchedResources ?? []

      selectedResourceIds.value = draftResources.map((r) => r.resourceId)

      // Data e fasce orarie
      const startDt = new Date(firstRes.startTime)
      formData.value.date = new Date(startDt.getFullYear(), startDt.getMonth(), startDt.getDate())

      for (const res of draftResources) {
        const st = new Date(res.startTime)
        const et = new Date(res.endTime)
        formData.value.timeSlots[res.resourceId] = {
          startTime: `${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`,
          endTime:   `${String(et.getHours()).padStart(2, '0')}:${String(et.getMinutes()).padStart(2, '0')}`,
        }
      }
    }

    // Vai allo step 2 (Ricorrenza) perché step 0 e 1 sono già compilati
    if (draft.recurrenceRule) {
      try {
        const recurrence = JSON.parse(draft.recurrenceRule) as {
          frequency?: string
          interval?: number
          endDate?: string
          daysOfWeek?: string[]
        }

        formData.value.frequency = recurrence.frequency ?? formData.value.frequency
        formData.value.recurrenceInterval = recurrence.interval ?? 1
        formData.value.recurringDays = Array.isArray(recurrence.daysOfWeek) ? recurrence.daysOfWeek : []
        formData.value.recurrenceEndDate = recurrence.endDate ? new Date(recurrence.endDate) : null
        // Per DAILY: se il rule ha daysOfWeek lun-ven significa "esclusi weekend".
        if (formData.value.frequency === 'DAILY') {
          const days = formData.value.recurringDays
          formData.value.dailyIncludeWeekends =
              days.length === 0 || days.includes('SA') || days.includes('SU')
          // Per DAILY non usiamo recurringDays come selezione utente.
          formData.value.recurringDays = []
        }
      } catch (error) {
        console.error('Failed to parse draft recurrence rule:', error)
      }
    }

    formData.value.participants = draftParticipants
        .filter((participant) => participant.isInternal && participant.userId)
        .map((participant) => ({
          userId: participant.userId,
          isInternal: true,
          isGroupLeader: participant.isGroupLeader,
        }))

    if (draft.inviteMode === InviteMode.NominativeAutoComplete) {
      formData.value.visitorEmails = draftParticipants
          .filter((participant) => !participant.isInternal && participant.visitorEmail)
          .map((participant) => participant.visitorEmail!)
      formData.value.visitors = []
    } else if (draft.inviteMode === InviteMode.NominativeComplete) {
      formData.value.visitors = draftParticipants
          .filter((participant) => !participant.isInternal)
          .map((participant): WizardVisitor => ({
            firstName: participant.visitorFirstName ?? '',
            lastName:  participant.visitorLastName ?? '',
            email:     participant.visitorEmail ?? '',
            phone:     '',
            visitorTypeId: participant.visitorTypeId ?? '',
            customFields: parseRecord(participant.customFieldValues),
            isGroupLeader: participant.isGroupLeader === true,
            // Se il partecipante era già linkato a un contatto rubrica, lo preserviamo
            contactId: participant.visitorContactId,
            // Già salvato a monte: nessun re-save automatico in modifica della bozza
            saveToDirectory: false,
          }))
      formData.value.visitorEmails = []
    } else {
      // GenericLink - niente da pre-compilare
    }

    // Sempre al primo step: l'utente vede tutti i campi pre-compilati e
    // può navigare avanti step by step per modificare ciò che vuole.
    activeStep.value = 0

    lastSavedDraftSnapshot.value = JSON.stringify({
      dto: buildBookingDto(true),
      selectedResourceIds: selectedResourceIds.value,
      activeStep: activeStep.value,
    })
  } catch (e) {
    console.error('Failed to prefill from draft:', e, { draftId })
    toast.add({
      severity: 'error',
      summary: t('wizard.prefillError'),
      detail: t('wizard.prefillErrorDetail'),
      life: 5000,
    })
  }
}
</script>

<style scoped src="./BookingWizardView.css"></style>

<style>
/* ==== Unsaved-changes dialog (premium, compact) ====
   Stili non-scoped: il contenuto del dialog viene teleportato fuori dal
   componente da PrimeVue, quindi lo scope CSS non si applicherebbe. */
.unsaved-msg {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: #334155;
}

.unsaved-footer {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.unsaved-footer-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.u-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.85rem;
  border-radius: 0.5rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s;
  min-height: 2.2rem;
  white-space: nowrap;
  font-family: inherit;
  line-height: 1;
}

.u-btn i { font-size: 0.85rem; }

.u-btn-discard {
  background: transparent;
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.25);
}
.u-btn-discard:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.45);
  color: #991b1b;
}

.u-btn-ghost {
  background: transparent;
  color: #475569;
}
.u-btn-ghost:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.u-btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  box-shadow: 0 4px 10px -3px rgba(79, 70, 229, 0.4);
}
.u-btn-primary:hover {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  transform: translateY(-1px);
  box-shadow: 0 6px 14px -4px rgba(79, 70, 229, 0.5);
}
.u-btn-primary:active {
  transform: translateY(0);
}

@media (max-width: 480px) {
  .unsaved-footer { flex-direction: column-reverse; align-items: stretch; }
  .unsaved-footer-right { width: 100%; flex-direction: column-reverse; }
  .u-btn { justify-content: center; width: 100%; }
}

/* Dark mode — unsaved-footer buttons */
.dark .u-btn-ghost {
  color: var(--text-secondary);
}

.dark .u-btn-ghost:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}
</style>
