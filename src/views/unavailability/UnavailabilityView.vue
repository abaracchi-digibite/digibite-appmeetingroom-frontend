<template>
  <MainLayout>
    <div class="list-page">

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
          <button type="button" class="list-btn-secondary" @click="openHolidayDialog()">
            <i class="pi pi-calendar-plus" />
            <span>{{ t('unavailability.createHoliday') }}</span>
          </button>
          <button type="button" class="list-btn-primary" @click="openBlockDialog()">
            <i class="pi pi-plus" />
            <span>{{ t('unavailability.createBlock') }}</span>
          </button>
        </div>

        <div class="list-row-secondary">
          <div class="list-filters-group">
            <div class="list-filter-inline">
              <label class="list-filter-label-inline">{{ t('common.status') }}</label>
              <PrimeMultiSelect
                v-model="statusFilter"
                :options="statusFilterOptions"
                option-label="label"
                option-value="value"
                :placeholder="t('common.all')"
                display="chip"
                :max-selected-labels="1"
                :selected-items-label="`{0} ${t('common.selected')}`"
                class="list-filter-select"
              />
            </div>
          </div>

          <div class="list-row-secondary-right">
            <div class="list-tab-segments" role="group" :aria-label="t('common.viewTable')">
              <button
                type="button"
                class="list-tab-segment"
                :class="{ active: activeTab === 'blocks' }"
                @click="activeTab = 'blocks'"
              >
                <i class="pi pi-ban" />
                {{ t('unavailability.blocksTab') }}
                <span class="list-tab-count">{{ visibleBlocks.length }}</span>
              </button>
              <button
                type="button"
                class="list-tab-segment"
                :class="{ active: activeTab === 'holidays' }"
                @click="activeTab = 'holidays'"
              >
                <i class="pi pi-calendar" />
                {{ t('unavailability.holidaysTab') }}
                <span class="list-tab-count">{{ visibleHolidays.length }}</span>
              </button>
            </div>

            <div class="list-view-flat">
              <button
                type="button"
                class="list-view-icon"
                :class="{ active: viewMode === 'table' }"
                :title="t('common.viewTable')"
                @click="setViewMode('table')"
              >
                <i class="pi pi-list" />
              </button>
              <button
                type="button"
                class="list-view-icon"
                :class="{ active: viewMode === 'card' }"
                :title="t('common.viewCards')"
                @click="setViewMode('card')"
              >
                <i class="pi pi-th-large" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Loading ──────────────────────────────────────────────── -->
      <div v-if="initialLoading" class="list-loading">
        <i class="pi pi-spin pi-spinner" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <!-- ── BLOCKS ───────────────────────────────────────────────── -->
      <template v-else-if="activeTab === 'blocks'">
        <div v-if="visibleBlocks.length === 0" class="list-empty">
          <i class="pi pi-ban" />
          <p>{{ t('unavailability.noBlocks') }}</p>
        </div>

        <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
          <DataTable :value="visibleBlocks" responsiveLayout="scroll" stripedRows class="list-table">
            <Column :header="t('unavailability.scope')" :sortable="true" sort-field="scopeName" style="width: 22%">
              <template #body="{ data }">
                <div>
                  <Tag :value="getBlockScopeLabel(data)" :severity="data.resourceId ? 'info' : 'secondary'" />
                  <div class="list-cell-strong" style="margin-top:0.25rem;">{{ getBlockScopeName(data) }}</div>
                  <small class="list-cell-muted">{{ getBlockImpactLabel(data) }}</small>
                </div>
              </template>
            </Column>

            <Column field="blockType" :header="t('unavailability.typeOptionsLabel')" :sortable="true" style="width: 14%">
              <template #body="{ data }">
                <Tag :value="getBlockTypeLabel(data.blockType)" :severity="getBlockTypeSeverity(data.blockType)" />
                <small v-if="data.customTypeLabel" class="list-cell-muted" style="display:block; margin-top:0.25rem;">
                  {{ data.customTypeLabel }}
                </small>
              </template>
            </Column>

            <Column field="startTime" :header="t('unavailability.blockWindow')" :sortable="true" style="width: 20%">
              <template #body="{ data }">
                <div class="list-cell-strong">{{ formatBlockStart(data) }}</div>
                <small class="list-cell-muted">{{ formatBlockEnd(data) }}</small>
              </template>
            </Column>

            <Column field="isActive" :header="t('common.status')" :sortable="true" style="width: 18%">
              <template #body="{ data }">
                <div class="status-stack">
                  <Tag
                    :value="data.isActive ? t('unavailability.statusActive') : t('unavailability.statusInactive')"
                    :severity="data.isActive ? 'success' : 'danger'"
                  />
                  <Tag
                    :value="data.isRecurring ? t('unavailability.recurringBadge') : t('unavailability.singleBadge')"
                    :severity="data.isRecurring ? 'warning' : 'contrast'"
                  />
                  <Tag v-if="data.isAllDay" :value="t('unavailability.allDay')" severity="secondary" />
                </div>
              </template>
            </Column>

            <Column :header="t('unavailability.notes')" style="min-width: 14%">
              <template #body="{ data }">
                <span class="list-cell-muted">{{ data.notes || '—' }}</span>
              </template>
            </Column>

            <Column :header="t('common.actions')" style="width: 90px" class="list-col-actions">
              <template #body="{ data }">
                <div class="list-row-actions">
                  <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="openBlockDialog(data)">
                    <i class="pi pi-pencil" />
                  </button>
                  <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteBlock(data.id)">
                    <i class="pi pi-trash" />
                  </button>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <div v-else class="list-cards-grid">
          <article v-for="block in visibleBlocks" :key="block.id" class="list-card">
            <div class="list-card-head">
              <h3 class="list-card-title">{{ getBlockScopeName(block) }}</h3>
              <Tag
                :value="block.isActive ? t('unavailability.statusActive') : t('unavailability.statusInactive')"
                :severity="block.isActive ? 'success' : 'danger'"
              />
            </div>
            <p class="list-card-subtitle">{{ getBlockImpactLabel(block) }}</p>
            <div class="list-card-info">
              <div class="list-card-info-row">
                <i :class="block.resourceId ? 'pi pi-box' : 'pi pi-building'" />
                <Tag :value="getBlockScopeLabel(block)" :severity="block.resourceId ? 'info' : 'secondary'" />
              </div>
              <div class="list-card-info-row">
                <i class="pi pi-tag" />
                <Tag :value="getBlockTypeLabel(block.blockType)" :severity="getBlockTypeSeverity(block.blockType)" />
              </div>
              <div class="list-card-info-row">
                <i class="pi pi-calendar" />
                <span>{{ formatBlockStart(block) }} → {{ formatBlockEnd(block) }}</span>
              </div>
              <div v-if="block.isRecurring || block.isAllDay" class="list-card-info-row">
                <i class="pi pi-sync" />
                <Tag v-if="block.isRecurring" :value="t('unavailability.recurringBadge')" severity="warning" />
                <Tag v-if="block.isAllDay" :value="t('unavailability.allDay')" severity="secondary" />
              </div>
              <div v-if="block.notes" class="list-card-info-row">
                <i class="pi pi-align-left" />
                <span>{{ block.notes }}</span>
              </div>
            </div>
            <div class="list-card-actions">
              <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="openBlockDialog(block)">
                <i class="pi pi-pencil" />
              </button>
              <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteBlock(block.id)">
                <i class="pi pi-trash" />
              </button>
            </div>
          </article>
        </div>
      </template>

      <!-- ── HOLIDAYS ─────────────────────────────────────────────── -->
      <template v-else>
        <div v-if="visibleHolidays.length === 0" class="list-empty">
          <i class="pi pi-calendar" />
          <p>{{ t('unavailability.noHolidays') }}</p>
        </div>

        <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
          <DataTable :value="visibleHolidays" responsiveLayout="scroll" stripedRows class="list-table">
            <Column field="name" :header="t('unavailability.name')" :sortable="true" style="width: 22%">
              <template #body="{ data }">
                <div class="list-cell-strong">{{ data.name }}</div>
                <small class="list-cell-muted">{{ getHolidayTypeLabel(data.holidayType) }}</small>
              </template>
            </Column>

            <Column field="startDate" :header="t('unavailability.holidayWindow')" :sortable="true" style="width: 22%">
              <template #body="{ data }">
                <div class="list-cell-strong">{{ formatHolidayStart(data) }}</div>
                <small class="list-cell-muted">{{ formatHolidayEnd(data) }}</small>
              </template>
            </Column>

            <Column :header="t('unavailability.scope')" style="width: 22%">
              <template #body="{ data }">
                <Tag
                  :value="data.plantId ? t('unavailability.scopePlant') : t('unavailability.allPlantsScope')"
                  :severity="data.plantId ? 'info' : 'secondary'"
                />
                <div class="list-cell-strong" style="margin-top:0.25rem;">{{ getHolidayPlantLabel(data.plantId) }}</div>
              </template>
            </Column>

            <Column field="isActive" :header="t('common.status')" :sortable="true" style="width: 18%">
              <template #body="{ data }">
                <div class="status-stack">
                  <Tag
                    :value="data.isActive ? t('unavailability.statusActive') : t('unavailability.statusInactive')"
                    :severity="data.isActive ? 'success' : 'danger'"
                  />
                  <Tag
                    :value="data.holidayType === HolidayType.RecurringAnnual ? t('unavailability.recurringBadge') : t('unavailability.singleBadge')"
                    :severity="data.holidayType === HolidayType.RecurringAnnual ? 'warning' : 'contrast'"
                  />
                </div>
              </template>
            </Column>

            <Column :header="t('common.actions')" style="width: 90px" class="list-col-actions">
              <template #body="{ data }">
                <div class="list-row-actions">
                  <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="openHolidayDialog(data)">
                    <i class="pi pi-pencil" />
                  </button>
                  <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteHoliday(data.id)">
                    <i class="pi pi-trash" />
                  </button>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <div v-else class="list-cards-grid">
          <article v-for="holiday in visibleHolidays" :key="holiday.id" class="list-card">
            <div class="list-card-head">
              <h3 class="list-card-title">{{ holiday.name }}</h3>
              <Tag
                :value="holiday.isActive ? t('unavailability.statusActive') : t('unavailability.statusInactive')"
                :severity="holiday.isActive ? 'success' : 'danger'"
              />
            </div>
            <p class="list-card-subtitle">{{ getHolidayTypeLabel(holiday.holidayType) }}</p>
            <div class="list-card-info">
              <div class="list-card-info-row">
                <i class="pi pi-calendar" />
                <span>{{ formatHolidayStart(holiday) }} → {{ formatHolidayEnd(holiday) }}</span>
              </div>
              <div class="list-card-info-row">
                <i :class="holiday.plantId ? 'pi pi-building' : 'pi pi-globe'" />
                <span>{{ getHolidayPlantLabel(holiday.plantId) }}</span>
              </div>
              <div v-if="holiday.holidayType === HolidayType.RecurringAnnual" class="list-card-info-row">
                <i class="pi pi-sync" />
                <Tag :value="t('unavailability.recurringBadge')" severity="warning" />
              </div>
            </div>
            <div class="list-card-actions">
              <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="openHolidayDialog(holiday)">
                <i class="pi pi-pencil" />
              </button>
              <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="deleteHoliday(holiday.id)">
                <i class="pi pi-trash" />
              </button>
            </div>
          </article>
        </div>
      </template>

      <AppDialog
          v-model:visible="showBlockDialog"
          :header="editingBlockId ? t('unavailability.editBlock') : t('unavailability.createBlock')"
          :icon="editingBlockId ? 'pi pi-pencil' : 'pi pi-ban'"
          severity="warning"
          size="lg"
      >
        <form class="unav-form" @submit.prevent="saveBlock">

          <!-- ── Sezione 1: Ambito ─────────────────────────────────── -->
          <div class="unav-section">
            <div class="unav-section-header">
              <span class="unav-section-icon"><i class="pi pi-map-marker" /></span>
              <span class="unav-section-title">{{ t('unavailability.sectionScope') }}</span>
            </div>
            <div class="unav-fields-row">
              <div class="unav-field">
                <label for="blockScope">{{ t('unavailability.scope') }}</label>
                <Dropdown id="blockScope" v-model="blockForm.scopeType" :options="scopeOptions" optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div class="unav-field">
                <template v-if="blockForm.scopeType === 'resource'">
                  <label for="blockResource">{{ t('unavailability.resource') }}</label>
                  <PrimeMultiSelect
                    id="blockResource"
                    v-model="blockForm.resourceIds"
                    :options="resourceOptions"
                    optionLabel="label"
                    optionValue="value"
                    filter
                    display="chip"
                    class="w-full"
                    :maxSelectedLabels="3"
                    :selectionLimit="editingBlockId ? 1 : undefined"
                    :placeholder="t('unavailability.selectResources')"
                  />
                  <small>{{ editingBlockId ? t('unavailability.editSingleResourceHint') : t('unavailability.multiResourceHint') }}</small>
                </template>
                <template v-else>
                  <label for="blockPlant">{{ t('unavailability.plant') }}</label>
                  <Dropdown id="blockPlant" v-model="blockForm.plantId" :options="plantOptions" optionLabel="label" optionValue="value" filter class="w-full" :placeholder="t('unavailability.selectPlant')" />
                </template>
              </div>
            </div>
          </div>

          <!-- ── Sezione 2: Tipologia ──────────────────────────────── -->
          <div class="unav-section">
            <div class="unav-section-header">
              <span class="unav-section-icon"><i class="pi pi-tag" /></span>
              <span class="unav-section-title">{{ t('unavailability.sectionType') }}</span>
            </div>
            <div class="unav-fields-row">
              <div class="unav-field">
                <label for="blockType">{{ t('unavailability.typeOptionsLabel') }}</label>
                <Dropdown id="blockType" v-model="blockForm.blockType" :options="blockTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div v-if="blockForm.blockType === UnavailabilityType.Other" class="unav-field">
                <label for="customType">{{ t('unavailability.customTypeLabel') }}</label>
                <InputText id="customType" v-model.trim="blockForm.customTypeLabel" class="w-full" :placeholder="t('unavailability.customTypeLabelPlaceholder')" />
              </div>
            </div>
          </div>

          <!-- ── Sezione 3: Periodo ────────────────────────────────── -->
          <div class="unav-section">
            <div class="unav-section-header">
              <span class="unav-section-icon"><i class="pi pi-calendar" /></span>
              <span class="unav-section-title">{{ t('unavailability.sectionPeriod') }}</span>
            </div>

            <!-- Toggle pills -->
            <div class="unav-toggles">
              <label class="unav-toggle-pill" :class="{ active: blockForm.isAllDay }" for="allDayBlock">
                <Checkbox v-model="blockForm.isAllDay" inputId="allDayBlock" binary />
                <i class="pi pi-sun" />
                <span>{{ t('unavailability.allDay') }}</span>
              </label>
              <label class="unav-toggle-pill" :class="{ active: blockForm.isRecurring }" for="recurringBlock">
                <Checkbox v-model="blockForm.isRecurring" inputId="recurringBlock" binary />
                <i class="pi pi-sync" />
                <span>{{ t('unavailability.recurringLabel') }}</span>
              </label>
            </div>

            <!-- Date / datetime inputs -->
            <div class="unav-fields-row">
              <div class="unav-field">
                <label for="blockStart">{{ t('unavailability.startTime') }}</label>
                <div class="unav-input-wrap">
                  <i class="pi pi-calendar unav-input-icon" />
                  <input id="blockStart" v-model="blockForm.startValue" class="input-native unav-date-input" :type="blockForm.isAllDay ? 'date' : 'datetime-local'" required />
                </div>
              </div>
              <div class="unav-field">
                <label for="blockEnd">{{ t('unavailability.endTime') }}</label>
                <div class="unav-input-wrap">
                  <i class="pi pi-calendar unav-input-icon" />
                  <input id="blockEnd" v-model="blockForm.endValue" class="input-native unav-date-input" :type="blockForm.isAllDay ? 'date' : 'datetime-local'" required />
                </div>
              </div>
            </div>

            <!-- Recurrence builder -->
            <div v-if="blockForm.isRecurring" class="unav-recurrence">
              <div class="unav-fields-row">
                <div class="unav-field">
                  <label for="recurrenceFrequency">{{ t('unavailability.recurrenceFrequency') }}</label>
                  <Dropdown id="recurrenceFrequency" v-model="blockForm.recurrenceFrequency" :options="recurrenceFrequencyOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>
                <div class="unav-field">
                  <label for="recurrenceEndDate">{{ t('unavailability.recurrenceEndDate') }}</label>
                  <div class="unav-input-wrap">
                    <i class="pi pi-calendar-times unav-input-icon" />
                    <input id="recurrenceEndDate" v-model="blockForm.recurrenceEndDate" class="input-native unav-date-input" type="date" :min="blockStartDateValue" required />
                  </div>
                </div>
              </div>
              <div v-if="blockForm.recurrenceFrequency === 'WEEKLY' || blockForm.recurrenceFrequency === 'BIWEEKLY'" class="unav-field">
                <label>{{ t('unavailability.recurrenceDays') }}</label>
                <div class="days-row">
                  <button
                    v-for="day in recurrenceWeekDays"
                    :key="day.value"
                    type="button"
                    class="day-btn"
                    :class="{ selected: blockForm.recurrenceDaysOfWeek.includes(day.value) }"
                    :aria-pressed="blockForm.recurrenceDaysOfWeek.includes(day.value)"
                    :title="day.label"
                    @click="toggleRecurrenceDay(day.value)"
                  >{{ day.short }}</button>
                </div>
                <small>{{ t('unavailability.recurrenceDaysHelp') }}</small>
              </div>
              <div class="unav-recurrence-preview">
                <i class="pi pi-info-circle" />
                <span>{{ recurrencePreviewText }}</span>
              </div>
            </div>
          </div>

          <!-- ── Sezione 4: Note e stato ───────────────────────────── -->
          <div class="unav-section unav-section-last">
            <div class="unav-section-header">
              <span class="unav-section-icon"><i class="pi pi-align-left" /></span>
              <span class="unav-section-title">{{ t('unavailability.sectionNotes') }}</span>
              <label class="unav-toggle-pill unav-active-pill" :class="{ active: blockForm.isActive }" for="activeBlock" style="margin-left: auto;">
                <Checkbox v-model="blockForm.isActive" inputId="activeBlock" binary />
                <i class="pi pi-check-circle" />
                <span>{{ t('unavailability.activeBlock') }}</span>
              </label>
            </div>
            <Textarea id="blockNotes" v-model.trim="blockForm.notes" rows="3" autoResize class="w-full" :placeholder="t('unavailability.notesPlaceholder')" />
          </div>

        </form>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="showBlockDialog = false">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="submitLoading" @click="saveBlock">
            <i :class="submitLoading ? 'pi pi-spin pi-spinner' : 'pi pi-check'" />{{ t('common.save') }}
          </button>
        </template>
      </AppDialog>

      <AppDialog
          v-model:visible="showHolidayDialog"
          :header="editingHolidayId ? t('unavailability.editHoliday') : t('unavailability.createHoliday')"
          :icon="editingHolidayId ? 'pi pi-pencil' : 'pi pi-star'"
          severity="primary"
          size="md"
      >
        <form class="unav-form" @submit.prevent="saveHoliday">

          <!-- ── Sezione 1: Festività ──────────────────────────────── -->
          <div class="unav-section">
            <div class="unav-section-header">
              <span class="unav-section-icon"><i class="pi pi-star" /></span>
              <span class="unav-section-title">{{ t('unavailability.sectionHolidayInfo') }}</span>
            </div>
            <div class="unav-field">
              <label for="holidayName">{{ t('unavailability.name') }}</label>
              <InputText id="holidayName" v-model.trim="holidayForm.name" class="w-full" required />
            </div>
            <div class="unav-fields-row" style="margin-top: 0.75rem;">
              <div class="unav-field">
                <label for="holidayType">{{ t('unavailability.holidayType') }}</label>
                <Dropdown id="holidayType" v-model="holidayForm.holidayType" :options="holidayTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div class="unav-field">
                <label for="holidayStart">{{ t('unavailability.startDate') }}</label>
                <div class="unav-input-wrap">
                  <i class="pi pi-calendar unav-input-icon" />
                  <input id="holidayStart" v-model="holidayForm.startDate" class="input-native unav-date-input" type="date" required />
                </div>
              </div>
            </div>
            <div v-if="holidayForm.holidayType === HolidayType.OneOff" class="unav-field" style="margin-top: 0.75rem;">
              <label for="holidayEnd">{{ t('unavailability.endDate') }}</label>
              <div class="unav-input-wrap">
                <i class="pi pi-calendar unav-input-icon" />
                <input id="holidayEnd" v-model="holidayForm.endDate" class="input-native unav-date-input" type="date" />
              </div>
            </div>
          </div>

          <!-- ── Sezione 2: Applicazione e stato ──────────────────── -->
          <div class="unav-section unav-section-last">
            <div class="unav-section-header">
              <span class="unav-section-icon"><i class="pi pi-building" /></span>
              <span class="unav-section-title">{{ t('unavailability.sectionApply') }}</span>
              <label class="unav-toggle-pill unav-active-pill" :class="{ active: holidayForm.isActive }" for="activeHoliday" style="margin-left: auto;">
                <Checkbox v-model="holidayForm.isActive" inputId="activeHoliday" binary />
                <i class="pi pi-check-circle" />
                <span>{{ t('unavailability.activeHoliday') }}</span>
              </label>
            </div>
            <label class="unav-toggle-pill" :class="{ active: holidayForm.applyToAllPlants }" for="allPlantsHoliday">
              <Checkbox v-model="holidayForm.applyToAllPlants" inputId="allPlantsHoliday" binary />
              <i class="pi pi-globe" />
              <span>{{ t('unavailability.applyToAllPlants') }}</span>
            </label>
            <div v-if="!holidayForm.applyToAllPlants" class="unav-field" style="margin-top: 0.75rem;">
              <label for="holidayPlant">{{ t('unavailability.plant') }}</label>
              <Dropdown id="holidayPlant" v-model="holidayForm.plantId" :options="plantOptions" optionLabel="label" optionValue="value" filter class="w-full" :placeholder="t('unavailability.selectPlant')" />
            </div>
          </div>

        </form>

        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="showHolidayDialog = false">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="submitLoading" @click="saveHoliday">
            <i :class="submitLoading ? 'pi pi-spin pi-spinner' : 'pi pi-check'" />{{ t('common.save') }}
          </button>
        </template>
      </AppDialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import MainLayout from '@/layouts/MainLayout.vue'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import AppDialog from '@/components/common/AppDialog.vue'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import PrimeMultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import { usePlantsStore } from '@/stores/plants.store'
import { useResourcesStore } from '@/stores/resources.store'
import { useUnavailabilityStore } from '@/stores/unavailability.store'
import { HolidayType, UnavailabilityType } from '@/types/enums'
import type {
  CreateHolidayDto,
  CreateUnavailabilityBlockDto,
  Holiday,
  UnavailabilityBlock,
  UpdateHolidayDto,
  UpdateUnavailabilityBlockDto,
} from '@/types/unavailability'

type BlockScopeType = 'resource' | 'plant'
type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
type RecurrenceDayCode = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

interface BlockFormState {
  scopeType: BlockScopeType
  resourceIds: string[]
  plantId: string
  blockType: UnavailabilityType
  customTypeLabel: string
  startValue: string
  endValue: string
  isAllDay: boolean
  notes: string
  isActive: boolean
  isRecurring: boolean
  recurrenceFrequency: RecurrenceFrequency
  recurrenceEndDate: string
  recurrenceDaysOfWeek: RecurrenceDayCode[]
}

interface HolidayFormState {
  name: string
  holidayType: HolidayType
  startDate: string
  endDate: string
  plantId: string
  applyToAllPlants: boolean
  isActive: boolean
}

const { t, locale } = useI18n()
const toast = useToast()
const unavailabilityStore = useUnavailabilityStore()
const resourcesStore = useResourcesStore()
const plantsStore = usePlantsStore()

const showBlockDialog = ref(false)
const showHolidayDialog = ref(false)
const editingBlockId = ref<string | null>(null)
const editingHolidayId = ref<string | null>(null)
const initialLoading = ref(true)
const submitLoading = ref(false)

// View / filter state
const searchQuery = ref('')
const statusFilter = ref<boolean[]>([]) // allineato alle altre list page: vuoto = mostra tutti
const activeTab = ref<'blocks' | 'holidays'>(
  (localStorage.getItem('unavailability_active_tab') as 'blocks' | 'holidays') ?? 'blocks'
)
const viewMode = ref<'card' | 'table'>(
  (localStorage.getItem('unavailability_view_mode') as 'card' | 'table') ?? 'table'
)

const setViewMode = (mode: 'card' | 'table') => {
  viewMode.value = mode
  localStorage.setItem('unavailability_view_mode', mode)
}

watch(activeTab, (val) => {
  localStorage.setItem('unavailability_active_tab', val)
})

const statusFilterOptions = computed(() => [
  { label: t('common.active'),   value: true },
  { label: t('common.inactive'), value: false },
])

const blockForm = reactive<BlockFormState>(createDefaultBlockForm())
const holidayForm = reactive<HolidayFormState>(createDefaultHolidayForm())

const scopeOptions = computed(() => [
  { label: t('unavailability.scopeResource'), value: 'resource' },
  { label: t('unavailability.scopePlant'), value: 'plant' },
])

const blockTypeOptions = computed(() => [
  { label: t('unavailability.typeOptions.maintenance'), value: UnavailabilityType.Maintenance },
  { label: t('unavailability.typeOptions.closure'), value: UnavailabilityType.Closure },
  { label: t('unavailability.typeOptions.other'), value: UnavailabilityType.Other },
])

const holidayTypeOptions = computed(() => [
  { label: t('unavailability.holidayTypeOptions.oneOff'), value: HolidayType.OneOff },
  { label: t('unavailability.holidayTypeOptions.recurringAnnual'), value: HolidayType.RecurringAnnual },
])

const recurrenceFrequencyOptions = computed(() => [
  { label: t('unavailability.recurrenceFrequencyOptions.daily'), value: 'DAILY' },
  { label: t('unavailability.recurrenceFrequencyOptions.weekly'), value: 'WEEKLY' },
  { label: t('unavailability.recurrenceFrequencyOptions.biweekly'), value: 'BIWEEKLY' },
  { label: t('unavailability.recurrenceFrequencyOptions.monthly'), value: 'MONTHLY' },
])

const recurrenceWeekDays = computed(() => [
  { label: t('wizard.weekMon'), short: t('wizard.weekMonShort'), value: 'MON' as const },
  { label: t('wizard.weekTue'), short: t('wizard.weekTueShort'), value: 'TUE' as const },
  { label: t('wizard.weekWed'), short: t('wizard.weekWedShort'), value: 'WED' as const },
  { label: t('wizard.weekThu'), short: t('wizard.weekThuShort'), value: 'THU' as const },
  { label: t('wizard.weekFri'), short: t('wizard.weekFriShort'), value: 'FRI' as const },
  { label: t('wizard.weekSat'), short: t('wizard.weekSatShort'), value: 'SAT' as const },
  { label: t('wizard.weekSun'), short: t('wizard.weekSunShort'), value: 'SUN' as const },
])

const resourceOptions = computed(() =>
    [...resourcesStore.resources]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((resource) => ({
          label: `${resource.name} - ${getPlantName(resource.plantId)}`,
          value: resource.id,
        }))
)

const plantOptions = computed(() =>
    [...plantsStore.plants]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((plant) => ({
          label: plant.name,
          value: plant.id,
        }))
)

const visibleBlocks = computed(() => {
  let list = [...unavailabilityStore.unavailabilityBlocks]
    .map((b) => ({
      ...b,
      scopeName: getBlockScopeName(b),
    }))

  if (statusFilter.value.length > 0) {
    list = list.filter((b) => statusFilter.value.includes(b.isActive))
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((b) =>
      getBlockScopeName(b).toLowerCase().includes(q)
      || (b.notes ?? '').toLowerCase().includes(q)
      || (b.customTypeLabel ?? '').toLowerCase().includes(q)
    )
  }

  return list.sort((l, r) => new Date(l.startTime).getTime() - new Date(r.startTime).getTime())
})

const visibleHolidays = computed(() => {
  let list = [...unavailabilityStore.holidays]

  if (statusFilter.value.length > 0) {
    list = list.filter((h) => statusFilter.value.includes(h.isActive))
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((h) =>
      h.name.toLowerCase().includes(q)
      || getHolidayPlantLabel(h.plantId).toLowerCase().includes(q)
    )
  }

  return list.sort((l, r) => new Date(l.startDate).getTime() - new Date(r.startDate).getTime())
})

const blockStartDateValue = computed(() => extractDatePortion(blockForm.startValue))

const recurrencePreviewText = computed(() => {
  if (!blockForm.recurrenceEndDate) {
    return t('unavailability.recurrencePreviewIncomplete')
  }

  const frequencyLabel =
    recurrenceFrequencyOptions.value.find((option) => option.value === blockForm.recurrenceFrequency)?.label
    ?? blockForm.recurrenceFrequency
  const endLabel = formatDate(toApiDateValue(blockForm.recurrenceEndDate))

  if (
    (blockForm.recurrenceFrequency === 'WEEKLY' || blockForm.recurrenceFrequency === 'BIWEEKLY')
    && blockForm.recurrenceDaysOfWeek.length > 0
  ) {
    const dayLabels = blockForm.recurrenceDaysOfWeek
      .map((code) => recurrenceWeekDays.value.find((day) => day.value === code)?.label ?? code)
      .join(', ')

    return t('unavailability.recurrencePreviewWithDays', {
      frequency: frequencyLabel,
      days: dayLabels,
      endDate: endLabel,
    })
  }

  return t('unavailability.recurrencePreview', {
    frequency: frequencyLabel,
    endDate: endLabel,
  })
})

onMounted(async () => {
  try {
    await Promise.all([
      unavailabilityStore.fetchAllUnavailabilityBlocks(),
      unavailabilityStore.fetchAllHolidays(),
      resourcesStore.fetchAllResources(),
      plantsStore.fetchAll(),
    ])
  } catch (error) {
    showErrorToast(error)
  } finally {
    initialLoading.value = false
  }
})

function createDefaultBlockForm(): BlockFormState {
  const now = new Date()
  const later = new Date(now.getTime() + 60 * 60 * 1000)

  return {
    scopeType: 'resource',
    resourceIds: [],
    plantId: '',
    blockType: UnavailabilityType.Maintenance,
    customTypeLabel: '',
    startValue: toLocalDateTimeInput(now.toISOString()),
    endValue: toLocalDateTimeInput(later.toISOString()),
    isAllDay: false,
    notes: '',
    isActive: true,
    isRecurring: false,
    recurrenceFrequency: 'WEEKLY',
    recurrenceEndDate: toLocalDateInput(now.toISOString()),
    recurrenceDaysOfWeek: [getDayCodeFromIsoValue(now.toISOString())],
  }
}

function createDefaultHolidayForm(): HolidayFormState {
  const today = toLocalDateInput(new Date().toISOString())

  return {
    name: '',
    holidayType: HolidayType.OneOff,
    startDate: today,
    endDate: '',
    plantId: '',
    applyToAllPlants: true,
    isActive: true,
  }
}

function resetBlockForm(): void {
  Object.assign(blockForm, createDefaultBlockForm())
}

function resetHolidayForm(): void {
  Object.assign(holidayForm, createDefaultHolidayForm())
}

function openBlockDialog(block?: UnavailabilityBlock): void {
  editingBlockId.value = block?.id ?? null

  if (!block) {
    resetBlockForm()
    showBlockDialog.value = true
    return
  }

  const parsedRecurrence = parseRecurrenceRule(block?.recurrenceRule, block?.startTime)

  Object.assign(blockForm, {
    scopeType: block.resourceId ? 'resource' : 'plant',
    resourceIds: block.resourceId ? [block.resourceId] : [],
    plantId: block.plantId ?? '',
    blockType: block.blockType,
    customTypeLabel: block.customTypeLabel ?? '',
    startValue: block.isAllDay ? toLocalDateInput(block.startTime) : toLocalDateTimeInput(block.startTime),
    endValue: block.isAllDay ? toLocalDateInput(block.endTime) : toLocalDateTimeInput(block.endTime),
    isAllDay: block.isAllDay,
    notes: block.notes ?? '',
    isActive: block.isActive,
    isRecurring: block.isRecurring,
    recurrenceFrequency: parsedRecurrence.frequency,
    recurrenceEndDate: parsedRecurrence.endDate,
    recurrenceDaysOfWeek: parsedRecurrence.daysOfWeek,
  })

  showBlockDialog.value = true
}

function openHolidayDialog(holiday?: Holiday): void {
  editingHolidayId.value = holiday?.id ?? null

  if (!holiday) {
    resetHolidayForm()
    showHolidayDialog.value = true
    return
  }

  Object.assign(holidayForm, {
    name: holiday.name,
    holidayType: holiday.holidayType,
    startDate: toLocalDateInput(holiday.startDate),
    endDate: holiday.endDate ? toLocalDateInput(holiday.endDate) : '',
    plantId: holiday.plantId ?? '',
    applyToAllPlants: !holiday.plantId,
    isActive: holiday.isActive,
  })

  showHolidayDialog.value = true
}

async function saveBlock(): Promise<void> {
  const validationMessage = validateBlockForm()
  if (validationMessage) {
    showSimpleToast('error', t('common.error'), validationMessage)
    return
  }

  const dto = buildBlockDto()

  submitLoading.value = true
  try {
    if (editingBlockId.value) {
      const updateDto: UpdateUnavailabilityBlockDto = {
        ...dto,
        resourceId: blockForm.scopeType === 'resource' ? blockForm.resourceIds[0] : null,
        plantId: blockForm.scopeType === 'plant' ? blockForm.plantId : null,
        isActive: blockForm.isActive,
      }
      await unavailabilityStore.updateUnavailabilityBlock(editingBlockId.value, updateDto)
    } else {
      const createDtos = buildCreateBlockDtos(dto)
      for (const createDto of createDtos) {
        await unavailabilityStore.createUnavailabilityBlock(createDto)
      }
    }

    showSimpleToast(
      'success',
      t('common.success'),
      !editingBlockId.value && blockForm.scopeType === 'resource' && blockForm.resourceIds.length > 1
        ? t('unavailability.blocksSaved', { count: blockForm.resourceIds.length })
        : t('unavailability.blockSaved'),
    )
    showBlockDialog.value = false
    editingBlockId.value = null
    resetBlockForm()
  } catch (error) {
    showErrorToast(error)
  } finally {
    submitLoading.value = false
  }
}

async function saveHoliday(): Promise<void> {
  const validationMessage = validateHolidayForm()
  if (validationMessage) {
    showSimpleToast('error', t('common.error'), validationMessage)
    return
  }

  const dto = buildHolidayDto()

  submitLoading.value = true
  try {
    if (editingHolidayId.value) {
      const updateDto: UpdateHolidayDto = {
        ...dto,
        isActive: holidayForm.isActive,
        applyToAllPlants: holidayForm.applyToAllPlants,
      }
      await unavailabilityStore.updateHoliday(editingHolidayId.value, updateDto)
    } else {
      const createDto: CreateHolidayDto = dto
      await unavailabilityStore.createHoliday(createDto)
    }

    showSimpleToast('success', t('common.success'), t('unavailability.holidaySaved'))
    showHolidayDialog.value = false
    editingHolidayId.value = null
    resetHolidayForm()
  } catch (error) {
    showErrorToast(error)
  } finally {
    submitLoading.value = false
  }
}

async function deleteBlock(id: string): Promise<void> {
  if (!window.confirm(t('unavailability.deleteBlockConfirm'))) {
    return
  }

  try {
    await unavailabilityStore.removeUnavailabilityBlock(id)
    showSimpleToast('success', t('common.success'), t('unavailability.blockDeleteSuccess'))
  } catch (error) {
    showErrorToast(error)
  }
}

async function deleteHoliday(id: string): Promise<void> {
  if (!window.confirm(t('unavailability.deleteHolidayConfirm'))) {
    return
  }

  try {
    await unavailabilityStore.removeHoliday(id)
    showSimpleToast('success', t('common.success'), t('unavailability.holidayDeleteSuccess'))
  } catch (error) {
    showErrorToast(error)
  }
}

function validateBlockForm(): string | null {
  if (blockForm.scopeType === 'resource' && blockForm.resourceIds.length === 0) {
    return t('unavailability.resourceRequired')
  }

  if (editingBlockId.value && blockForm.scopeType === 'resource' && blockForm.resourceIds.length !== 1) {
    return t('unavailability.singleResourceEditOnly')
  }

  if (blockForm.scopeType === 'plant' && !blockForm.plantId) {
    return t('unavailability.plantRequired')
  }

  if (blockForm.blockType === UnavailabilityType.Other && !blockForm.customTypeLabel.trim()) {
    return t('unavailability.customTypeRequired')
  }

  if (blockForm.isRecurring && !blockForm.recurrenceEndDate) {
    return t('unavailability.recurrenceEndDateRequired')
  }

  if (
    blockForm.isRecurring &&
    (blockForm.recurrenceFrequency === 'WEEKLY' || blockForm.recurrenceFrequency === 'BIWEEKLY') &&
    blockForm.recurrenceDaysOfWeek.length === 0
  ) {
    return t('unavailability.recurrenceDaysRequired')
  }

  const start = buildBlockStartValue()
  const end = buildBlockEndValue()
  if (new Date(end).getTime() <= new Date(start).getTime()) {
    return t('unavailability.endBeforeStart')
  }

  if (
    blockForm.isRecurring &&
    new Date(toApiDateValue(blockForm.recurrenceEndDate)).getTime() < new Date(start).getTime()
  ) {
    return t('unavailability.recurrenceEndBeforeStart')
  }

  return null
}

function validateHolidayForm(): string | null {
  if (!holidayForm.name.trim()) {
    return t('unavailability.holidayNameRequired')
  }

  if (!holidayForm.applyToAllPlants && !holidayForm.plantId) {
    return t('unavailability.plantRequired')
  }

  if (
      holidayForm.holidayType === HolidayType.OneOff &&
      holidayForm.endDate &&
      new Date(toApiDateValue(holidayForm.endDate)).getTime() < new Date(toApiDateValue(holidayForm.startDate)).getTime()
  ) {
    return t('unavailability.endBeforeStart')
  }

  return null
}

function buildBlockDto(): Omit<CreateUnavailabilityBlockDto, 'resourceId' | 'plantId'> {
  return {
    blockType: blockForm.blockType,
    customTypeLabel: blockForm.blockType === UnavailabilityType.Other ? blockForm.customTypeLabel.trim() : null,
    startTime: buildBlockStartValue(),
    endTime: buildBlockEndValue(),
    isAllDay: blockForm.isAllDay,
    notes: blockForm.notes.trim() || null,
    isRecurring: blockForm.isRecurring,
    recurrenceRule: blockForm.isRecurring ? buildRecurrenceRule() : null,
  }
}

function buildCreateBlockDtos(
  dto: Omit<CreateUnavailabilityBlockDto, 'resourceId' | 'plantId'>
): CreateUnavailabilityBlockDto[] {
  if (blockForm.scopeType === 'plant') {
    return [{ ...dto, resourceId: null, plantId: blockForm.plantId }]
  }

  return blockForm.resourceIds.map((resourceId) => ({
    ...dto,
    resourceId,
    plantId: null,
  }))
}

function buildHolidayDto(): CreateHolidayDto {
  return {
    name: holidayForm.name.trim(),
    holidayType: holidayForm.holidayType,
    startDate: toApiDateValue(holidayForm.startDate),
    endDate: holidayForm.holidayType === HolidayType.OneOff && holidayForm.endDate
        ? toApiDateValue(holidayForm.endDate)
        : null,
    recurringMonth: null,
    recurringDay: null,
    plantId: holidayForm.applyToAllPlants ? null : holidayForm.plantId,
  }
}

function buildBlockStartValue(): string {
  return blockForm.isAllDay
      ? `${blockForm.startValue}T00:00:00`
      : `${blockForm.startValue}:00`
}

function buildBlockEndValue(): string {
  return blockForm.isAllDay
      ? `${blockForm.endValue}T23:59:59`
      : `${blockForm.endValue}:00`
}

function buildRecurrenceRule(): string {
  const payload: {
    frequency: RecurrenceFrequency
    endDate: string
    daysOfWeek?: RecurrenceDayCode[]
  } = {
    frequency: blockForm.recurrenceFrequency,
    endDate: blockForm.recurrenceEndDate,
  }

  if (blockForm.recurrenceFrequency === 'WEEKLY' || blockForm.recurrenceFrequency === 'BIWEEKLY') {
    payload.daysOfWeek = [...blockForm.recurrenceDaysOfWeek]
  }

  return JSON.stringify(payload)
}

function toApiDateValue(value: string): string {
  return `${value}T00:00:00`
}

function toLocalDateInput(value: string | null | undefined): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function toLocalDateTimeInput(value: string | null | undefined): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  return `${toLocalDateInput(value)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function extractDatePortion(value: string): string {
  return value.includes('T') ? value.split('T')[0] : value
}

function getDayCodeFromIsoValue(value: string): RecurrenceDayCode {
  const date = new Date(value)
  const map: RecurrenceDayCode[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return map[date.getDay()]
}

function parseRecurrenceRule(
  recurrenceRule: string | null | undefined,
  fallbackStartTime: string | null | undefined
): {
  frequency: RecurrenceFrequency
  endDate: string
  daysOfWeek: RecurrenceDayCode[]
} {
  const fallbackSource = fallbackStartTime ?? new Date().toISOString()
  const defaults = {
    frequency: 'WEEKLY' as RecurrenceFrequency,
    endDate: toLocalDateInput(fallbackSource),
    daysOfWeek: [getDayCodeFromIsoValue(fallbackSource)] as RecurrenceDayCode[],
  }

  if (!recurrenceRule) {
    return defaults
  }

  try {
    const parsed = JSON.parse(recurrenceRule) as {
      frequency?: string
      endDate?: string
      daysOfWeek?: string[]
    }

    const supportedFrequencies: RecurrenceFrequency[] = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']
    const frequency = supportedFrequencies.includes(parsed.frequency as RecurrenceFrequency)
      ? parsed.frequency as RecurrenceFrequency
      : defaults.frequency

    const daysOfWeek = Array.isArray(parsed.daysOfWeek)
      ? parsed.daysOfWeek.filter((day): day is RecurrenceDayCode =>
        ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].includes(day))
      : defaults.daysOfWeek

    return {
      frequency,
      endDate: parsed.endDate ? toLocalDateInput(`${parsed.endDate}T00:00:00`) : defaults.endDate,
      daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : defaults.daysOfWeek,
    }
  } catch {
    return defaults
  }
}

function toggleRecurrenceDay(day: RecurrenceDayCode): void {
  const index = blockForm.recurrenceDaysOfWeek.indexOf(day)
  if (index >= 0) {
    blockForm.recurrenceDaysOfWeek.splice(index, 1)
  } else {
    blockForm.recurrenceDaysOfWeek.push(day)
  }
}

function ensureRecurringDaysSelection(): void {
  if (
    (blockForm.recurrenceFrequency !== 'WEEKLY' && blockForm.recurrenceFrequency !== 'BIWEEKLY')
    || blockForm.recurrenceDaysOfWeek.length > 0
  ) {
    return
  }

  blockForm.recurrenceDaysOfWeek = [getDayCodeFromIsoValue(buildBlockStartValue())]
}

function getPlantName(plantId: string | null | undefined): string {
  if (!plantId) {
    return t('unavailability.allPlantsScope')
  }

  return plantsStore.plantById(plantId)?.name ?? plantId
}

function getResourceName(resourceId: string | null | undefined): string {
  if (!resourceId) {
    return '–'
  }

  return resourcesStore.resourceById(resourceId)?.name ?? resourceId
}

function getBlockScopeLabel(block: UnavailabilityBlock): string {
  return block.resourceId ? t('unavailability.scopeResource') : t('unavailability.scopePlant')
}

function getBlockScopeName(block: UnavailabilityBlock): string {
  return block.resourceId ? getResourceName(block.resourceId) : getPlantName(block.plantId)
}

function getBlockImpactLabel(block: UnavailabilityBlock): string {
  if (block.resourceId) {
    const resource = resourcesStore.resourceById(block.resourceId)
    return resource ? `${t('unavailability.plant')}: ${getPlantName(resource.plantId)}` : t('unavailability.resource')
  }

  return `${t('unavailability.plant')}: ${getPlantName(block.plantId)}`
}

function getHolidayPlantLabel(plantId: string | null | undefined): string {
  return plantId ? getPlantName(plantId) : t('unavailability.allPlantsScope')
}

function getBlockTypeLabel(type: UnavailabilityType): string {
  switch (type) {
    case UnavailabilityType.Maintenance:
      return t('unavailability.typeOptions.maintenance')
    case UnavailabilityType.Closure:
      return t('unavailability.typeOptions.closure')
    default:
      return t('unavailability.typeOptions.other')
  }
}

function getHolidayTypeLabel(type: HolidayType): string {
  return type === HolidayType.RecurringAnnual
      ? t('unavailability.holidayTypeOptions.recurringAnnual')
      : t('unavailability.holidayTypeOptions.oneOff')
}

function getBlockTypeSeverity(type: UnavailabilityType): 'warning' | 'danger' | 'secondary' {
  switch (type) {
    case UnavailabilityType.Maintenance:
      return 'warning'
    case UnavailabilityType.Closure:
      return 'danger'
    default:
      return 'secondary'
  }
}

function formatBlockStart(block: UnavailabilityBlock): string {
  return block.isAllDay ? formatDate(block.startTime) : formatDateTime(block.startTime)
}

function formatBlockEnd(block: UnavailabilityBlock): string {
  return block.isAllDay ? formatDate(block.endTime) : formatDateTime(block.endTime)
}

function formatHolidayStart(holiday: Holiday): string {
  return formatDate(holiday.startDate)
}

function formatHolidayEnd(holiday: Holiday): string {
  if (holiday.holidayType === HolidayType.RecurringAnnual) {
    return t('unavailability.recurringAnnual')
  }

  return holiday.endDate ? formatDate(holiday.endDate) : t('unavailability.oneOff')
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function showErrorToast(error: unknown): void {
  const detail = error instanceof Error ? error.message : t('common.error')
  showSimpleToast('error', t('common.error'), detail)
}

function showSimpleToast(
    severity: 'success' | 'error',
    summary: string,
    detail: string
): void {
  toast.add({
    severity,
    summary,
    detail,
    life: 3500,
  })
}

watch(
  () => [blockForm.isRecurring, blockForm.recurrenceFrequency, blockForm.startValue, blockForm.isAllDay],
  () => {
    if (!blockForm.isRecurring) {
      return
    }

    ensureRecurringDaysSelection()
    if (!blockForm.recurrenceEndDate) {
      blockForm.recurrenceEndDate = extractDatePortion(blockForm.endValue || blockForm.startValue)
    }
  },
)
</script>

<style scoped src="./UnavailabilityView.css"></style>
