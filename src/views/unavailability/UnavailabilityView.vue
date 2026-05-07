<template>
  <MainLayout>
    <div class="resources-container unavailability-page">
      <!-- Toolbar -->
      <div class="toolbar-section mb-4 p-4 rounded-lg" style="background-color: var(--bg-card);">
        <div class="flex flex-col gap-4">
          <div class="flex gap-3 flex-wrap items-center">
            <Button
                :label="t('unavailability.createBlock')"
                icon="pi pi-plus"
                severity="primary"
                size="small"
                class="btn-new"
                @click="openBlockDialog()"
            />
            <Button
                :label="t('unavailability.createHoliday')"
                icon="pi pi-calendar-plus"
                size="small"
                severity="secondary"
                class="secondary-new-btn"
                @click="openHolidayDialog()"
            />

            <div class="ml-auto active-filter">
              <Checkbox
                  v-model="activeOnly"
                  inputId="activeOnly"
                  binary
              />
              <label for="activeOnly">{{ t('unavailability.activeOnly') }}</label>
            </div>
          </div>

          <div class="flex gap-3 flex-wrap items-center compact-stats">
            <span class="badge-stat">
              <i class="pi pi-ban"></i>
              {{ visibleBlocks.length }} {{ t('unavailability.blocksTab') }}
            </span>
            <span class="badge-stat holiday-stat">
              <i class="pi pi-calendar"></i>
              {{ visibleHolidays.length }} {{ t('unavailability.holidaysTab') }}
            </span>
<!--            <span class="text-sm text-slate-600">-->
<!--              {{ t('common.status') }}: {{ activeOnly ? t('unavailability.statusActive') : t('common.all') }}-->
<!--            </span>-->
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="initialLoading" class="flex justify-center items-center h-96">
        <div class="text-center">
          <PrimeProgressSpinner class="mb-4" />
          <p class="text-slate-600">{{ t('common.loading') }}</p>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="content-shell">
        <TabView class="tabs-shell">
          <TabPanel :header="t('unavailability.blocksTab')">
            <DataTable
                :value="visibleBlocks"
                responsiveLayout="scroll"
                stripedRows
                class="unavailability-table"
            >
              <template #empty>
                <div class="empty-state">
                  <i class="pi pi-ban" />
                  <strong>{{ t('unavailability.noBlocks') }}</strong>
                  <p>{{ t('unavailability.noBlocksDescription') }}</p>
                </div>
              </template>

              <Column :header="t('unavailability.scope')" style="width: 22rem">
                <template #body="{ data }">
                  <div class="cell-stack">
                    <Tag
                        :value="getBlockScopeLabel(data)"
                        :severity="data.resourceId ? 'info' : 'secondary'"
                    />
                    <strong>{{ getBlockScopeName(data) }}</strong>
                    <span class="cell-muted">{{ getBlockImpactLabel(data) }}</span>
                  </div>
                </template>
              </Column>

              <Column :header="t('unavailability.typeOptionsLabel')" style="width: 16rem">
                <template #body="{ data }">
                  <div class="cell-stack">
                    <Tag
                        :value="getBlockTypeLabel(data.blockType)"
                        :severity="getBlockTypeSeverity(data.blockType)"
                    />
                    <span v-if="data.customTypeLabel" class="cell-muted">
                      {{ data.customTypeLabel }}
                    </span>
                  </div>
                </template>
              </Column>

              <Column :header="t('unavailability.blockWindow')" style="width: 20rem">
                <template #body="{ data }">
                  <div class="cell-stack">
                    <strong>{{ formatBlockStart(data) }}</strong>
                    <span class="cell-muted">{{ formatBlockEnd(data) }}</span>
                  </div>
                </template>
              </Column>

              <Column :header="t('common.status')" style="width: 14rem">
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
                    <Tag
                        v-if="data.isAllDay"
                        :value="t('unavailability.allDay')"
                        severity="secondary"
                    />
                  </div>
                </template>
              </Column>

              <Column :header="t('unavailability.notes')" style="min-width: 18rem">
                <template #body="{ data }">
                    <p class="notes-preview">
                    {{ data.notes || t('emptyDash') }}
                  </p>
                </template>
              </Column>

              <Column :header="t('common.actions')" style="width: 10rem">
                <template #body="{ data }">
                  <div class="actions-row">
                    <Button
                        icon="pi pi-pencil"
                        text
                        rounded
                        severity="info"
                        class="action-btn"
                        :aria-label="t('common.edit')"
                        @click="openBlockDialog(data)"
                    />
                    <Button
                        icon="pi pi-trash"
                        text
                        rounded
                        severity="danger"
                        class="action-btn"
                        :aria-label="t('common.delete')"
                        @click="deleteBlock(data.id)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <TabPanel :header="t('unavailability.holidaysTab')">
            <DataTable
                :value="visibleHolidays"
                responsiveLayout="scroll"
                stripedRows
                class="unavailability-table"
            >
              <template #empty>
                <div class="empty-state">
                  <i class="pi pi-calendar" />
                  <strong>{{ t('unavailability.noHolidays') }}</strong>
                  <p>{{ t('unavailability.noHolidaysDescription') }}</p>
                </div>
              </template>

              <Column :header="t('unavailability.name')" style="width: 21rem">
                <template #body="{ data }">
                  <div class="cell-stack">
                    <strong>{{ data.name }}</strong>
                    <span class="cell-muted">{{ getHolidayTypeLabel(data.holidayType) }}</span>
                  </div>
                </template>
              </Column>

              <Column :header="t('unavailability.holidayWindow')" style="width: 18rem">
                <template #body="{ data }">
                  <div class="cell-stack">
                    <strong>{{ formatHolidayStart(data) }}</strong>
                    <span class="cell-muted">{{ formatHolidayEnd(data) }}</span>
                  </div>
                </template>
              </Column>

              <Column :header="t('unavailability.scope')" style="width: 20rem">
                <template #body="{ data }">
                  <div class="cell-stack">
                    <Tag
                        :value="data.plantId ? t('unavailability.scopePlant') : t('unavailability.allPlantsScope')"
                        :severity="data.plantId ? 'info' : 'secondary'"
                    />
                    <strong>{{ getHolidayPlantLabel(data.plantId) }}</strong>
                  </div>
                </template>
              </Column>

              <Column :header="t('common.status')" style="width: 14rem">
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

              <Column :header="t('common.actions')" style="width: 10rem">
                <template #body="{ data }">
                  <div class="actions-row">
                    <Button
                        icon="pi pi-pencil"
                        text
                        rounded
                        severity="info"
                        class="action-btn"
                        :aria-label="t('common.edit')"
                        @click="openHolidayDialog(data)"
                    />
                    <Button
                        icon="pi pi-trash"
                        text
                        rounded
                        severity="danger"
                        class="action-btn"
                        :aria-label="t('common.delete')"
                        @click="deleteHoliday(data.id)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      <Dialog
          v-model:visible="showBlockDialog"
          modal
          :header="editingBlockId ? t('unavailability.editBlock') : t('unavailability.createBlock')"
          :style="{ width: 'min(52rem, calc(100vw - 2rem))' }"
          class="unav-dialog"
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

          <!-- ── Azioni ────────────────────────────────────────────── -->
          <div class="unav-actions">
            <button type="button" class="btn-secondary" @click="showBlockDialog = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn-primary" :disabled="submitLoading">
              <i v-if="submitLoading" class="pi pi-spin pi-spinner" />
              <span>{{ t('common.save') }}</span>
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
          v-model:visible="showHolidayDialog"
          modal
          :header="editingHolidayId ? t('unavailability.editHoliday') : t('unavailability.createHoliday')"
          :style="{ width: 'min(42rem, calc(100vw - 2rem))' }"
          class="unav-dialog"
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

          <!-- ── Azioni ────────────────────────────────────────────── -->
          <div class="unav-actions">
            <button type="button" class="btn-secondary" @click="showHolidayDialog = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn-primary" :disabled="submitLoading">
              <i v-if="submitLoading" class="pi pi-spin pi-spinner" />
              <span>{{ t('common.save') }}</span>
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import MainLayout from '@/layouts/MainLayout.vue'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import PrimeMultiSelect from 'primevue/multiselect'
import PrimeProgressSpinner from 'primevue/progressspinner'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
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

const { t } = useI18n()
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
const activeOnly = ref(true)

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

const visibleBlocks = computed(() =>
    [...unavailabilityStore.unavailabilityBlocks]
        .filter((block) => (activeOnly.value ? block.isActive : true))
        .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())
)

const visibleHolidays = computed(() =>
    [...unavailabilityStore.holidays]
        .filter((holiday) => (activeOnly.value ? holiday.isActive : true))
        .sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime())
)

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
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('it-IT', {
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
