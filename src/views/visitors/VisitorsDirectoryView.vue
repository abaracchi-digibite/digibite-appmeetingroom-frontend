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
          <button type="button" class="list-btn-primary" @click="openCreateDialog">
            <i class="pi pi-plus" />
            <span>{{ t('visitors.create') }}</span>
          </button>
        </div>

        <div class="list-row-secondary">
          <div class="list-row-secondary-right">
            <span class="list-count-flat">{{ filteredVisitors.length }} {{ t('common.results') }}</span>
            <div class="list-view-flat">
              <button type="button" class="list-view-icon" :class="{ active: viewMode === 'table' }" :title="t('common.viewTable')" @click="setViewMode('table')">
                <i class="pi pi-list" />
              </button>
              <button type="button" class="list-view-icon" :class="{ active: viewMode === 'card' }" :title="t('common.viewCards')" @click="setViewMode('card')">
                <i class="pi pi-th-large" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Empty / Loading ───────────────────────────────────────── -->
      <div v-if="loading" class="list-loading">
        <i class="pi pi-spin pi-spinner" />
        <span>{{ t('common.loading') }}</span>
      </div>

      <div v-else-if="filteredVisitors.length === 0" class="list-empty">
        <i class="pi pi-inbox" />
        <p>{{ t('common.noData') }}</p>
      </div>

      <!-- ── Tabella ──────────────────────────────────────────────── -->
      <div v-else-if="viewMode === 'table'" class="list-table-wrapper">
        <PrimeDataTable :value="filteredVisitors" responsiveLayout="scroll" stripedRows class="list-table">
          <PrimeColumn field="lastName" :header="t('visitors.fullName')" :sortable="true">
            <template #body="{ data }">
              <span class="list-cell-strong">{{ data.firstName }} {{ data.lastName }}</span>
            </template>
          </PrimeColumn>

          <PrimeColumn field="email" :header="t('common.email')" :sortable="true">
            <template #body="{ data }">
              <span v-if="data.email" class="list-cell-muted">{{ data.email }}</span>
              <span v-else class="list-cell-muted">—</span>
            </template>
          </PrimeColumn>

          <PrimeColumn field="phone" :header="t('visitors.phone')" :sortable="true">
            <template #body="{ data }">
              <span v-if="data.phone" class="list-cell-muted">{{ data.phone }}</span>
              <span v-else class="list-cell-muted">—</span>
            </template>
          </PrimeColumn>

          <PrimeColumn field="lastUsedAt" :header="t('visitors.lastUsed')" :sortable="true">
            <template #body="{ data }">
              <span v-if="data.lastUsedAt" class="list-cell-muted">{{ formatDate(data.lastUsedAt) }}</span>
              <span v-else class="list-cell-muted">—</span>
            </template>
          </PrimeColumn>

          <PrimeColumn :header="t('common.actions')" :style="{ width: '110px' }" class="list-col-actions">
            <template #body="{ data }">
              <div class="list-row-actions">
                <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="openEditDialog(data)">
                  <i class="pi pi-pencil" />
                </button>
                <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="confirmDelete(data)">
                  <i class="pi pi-trash" />
                </button>
              </div>
            </template>
          </PrimeColumn>
        </PrimeDataTable>
      </div>

      <!-- ── Cards ────────────────────────────────────────────────── -->
      <div v-else class="list-cards-grid">
        <article v-for="v in filteredVisitors" :key="v.id" class="list-card">
          <div class="list-card-head">
            <h3 class="list-card-title">{{ v.firstName }} {{ v.lastName }}</h3>
          </div>
          <div class="list-card-info">
            <div v-if="v.email" class="list-card-info-row">
              <i class="pi pi-envelope" />
              <span>{{ v.email }}</span>
            </div>
            <div v-if="v.phone" class="list-card-info-row">
              <i class="pi pi-phone" />
              <span>{{ v.phone }}</span>
            </div>
            <div v-if="v.lastUsedAt" class="list-card-info-row">
              <i class="pi pi-clock" />
              <span>{{ formatDate(v.lastUsedAt) }}</span>
            </div>
          </div>
          <div class="list-card-actions">
            <button type="button" class="list-action-btn list-action-edit" :title="t('common.edit')" @click="openEditDialog(v)">
              <i class="pi pi-pencil" />
            </button>
            <button type="button" class="list-action-btn list-action-delete" :title="t('common.delete')" @click="confirmDelete(v)">
              <i class="pi pi-trash" />
            </button>
          </div>
        </article>
      </div>

      <!-- ── Create / Edit dialog ─────────────────────────────────── -->
      <AppDialog
        v-model:visible="showDialog"
        :header="isEditing ? t('visitors.edit') : t('visitors.create')"
        :icon="isEditing ? 'pi pi-pencil' : 'pi pi-id-card'"
        severity="primary"
        size="md"
      >
        <div class="dlg-form">
          <div class="dlg-section">
            <div class="dlg-fields-2">
              <div class="dlg-field">
                <label class="dlg-label">{{ t('wizard.visitorFirstName') }} *</label>
                <PrimeInputText v-model="formData.firstName" class="w-full" />
              </div>
              <div class="dlg-field">
                <label class="dlg-label">{{ t('wizard.visitorLastName') }} *</label>
                <PrimeInputText v-model="formData.lastName" class="w-full" />
              </div>
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('common.email') }}</label>
                <PrimeInputText v-model="formData.email" type="email" class="w-full" :placeholder="t('visitors.emailPlaceholder')" />
              </div>
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('wizard.visitorPhone') }}</label>
                <PrimeInputText v-model="formData.phone" type="tel" class="w-full" :placeholder="t('visitors.phonePlaceholder')" />
              </div>
              <div class="dlg-field dlg-field-full">
                <label class="dlg-label">{{ t('visitors.notes') }}</label>
                <PrimeTextarea v-model="formData.notes" rows="3" class="w-full" />
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="showDialog = false">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-save" :disabled="saving" @click="save">
            <i :class="saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'" />{{ t('common.save') }}
          </button>
        </template>
      </AppDialog>

      <!-- Delete confirmation -->
      <AppDialog
        v-model:visible="showDeleteDialog"
        :header="t('visitors.deleteTitle')"
        icon="pi pi-exclamation-triangle"
        severity="danger"
        size="sm"
      >
        <p>{{ t('visitors.deleteConfirm', { name: deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : '' }) }}</p>
        <template #footer>
          <button type="button" class="dialog-btn dialog-btn-cancel" @click="showDeleteDialog = false">
            <i class="pi pi-times" />{{ t('common.cancel') }}
          </button>
          <button type="button" class="dialog-btn dialog-btn-delete" :disabled="deleting" @click="performDelete">
            <i :class="deleting ? 'pi pi-spin pi-spinner' : 'pi pi-trash'" />{{ t('common.delete') }}
          </button>
        </template>
      </AppDialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import AppDialog from '@/components/common/AppDialog.vue'
import PrimeDataTable from 'primevue/datatable'
import PrimeColumn from 'primevue/column'
import PrimeInputText from 'primevue/inputtext'
import PrimeTextarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { visitorsApi } from '@/api/visitors.api'
import type { Visitor, CreateVisitorDto, UpdateVisitorDto } from '@/types/visitor'

const { t, locale } = useI18n()
const toast = useToast()

const visitors = ref<Visitor[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')
const viewMode = ref<'card' | 'table'>(
  (localStorage.getItem('visitors_view_mode') as 'card' | 'table') ?? 'table'
)

const showDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formData = ref<{ firstName: string; lastName: string; email: string; phone: string; notes: string }>({
  firstName: '', lastName: '', email: '', phone: '', notes: '',
})

const showDeleteDialog = ref(false)
const deleteTarget = ref<Visitor | null>(null)

const filteredVisitors = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return visitors.value
  return visitors.value.filter((v) =>
    v.firstName.toLowerCase().includes(q)
    || v.lastName.toLowerCase().includes(q)
    || (v.email ?? '').toLowerCase().includes(q)
    || (v.phone ?? '').toLowerCase().includes(q),
  )
})

const setViewMode = (mode: 'card' | 'table') => {
  viewMode.value = mode
  localStorage.setItem('visitors_view_mode', mode)
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale.value, { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}

async function fetchAll(): Promise<void> {
  loading.value = true
  try {
    visitors.value = await visitorsApi.getAll()
  } catch (e) {
    console.error(e)
    toast.add({ severity: 'error', summary: t('common.errorLoading'), life: 3500 })
  } finally {
    loading.value = false
  }
}

function resetForm(): void {
  formData.value = { firstName: '', lastName: '', email: '', phone: '', notes: '' }
  editingId.value = null
}

function openCreateDialog(): void {
  resetForm()
  isEditing.value = false
  showDialog.value = true
}

function openEditDialog(v: Visitor): void {
  formData.value = {
    firstName: v.firstName,
    lastName:  v.lastName,
    email:     v.email ?? '',
    phone:     v.phone ?? '',
    notes:     v.notes ?? '',
  }
  editingId.value = v.id
  isEditing.value = true
  showDialog.value = true
}

async function save(): Promise<void> {
  if (!formData.value.firstName.trim() || !formData.value.lastName.trim()) {
    toast.add({ severity: 'warn', summary: t('visitors.requiredNames'), life: 3000 })
    return
  }
  saving.value = true
  try {
    if (isEditing.value && editingId.value) {
      const dto: UpdateVisitorDto = {
        firstName: formData.value.firstName.trim(),
        lastName:  formData.value.lastName.trim(),
        email:     formData.value.email.trim() || null,
        phone:     formData.value.phone.trim() || null,
        notes:     formData.value.notes.trim() || null,
      }
      await visitorsApi.update(editingId.value, dto)
      toast.add({ severity: 'success', summary: t('visitors.updated'), life: 2500 })
    } else {
      const dto: CreateVisitorDto = {
        firstName: formData.value.firstName.trim(),
        lastName:  formData.value.lastName.trim(),
        email:     formData.value.email.trim() || null,
        phone:     formData.value.phone.trim() || null,
        notes:     formData.value.notes.trim() || null,
      }
      await visitorsApi.create(dto)
      toast.add({ severity: 'success', summary: t('visitors.created'), life: 2500 })
    }
    showDialog.value = false
    await fetchAll()
  } catch (e) {
    console.error(e)
    toast.add({ severity: 'error', summary: t('common.errorSaving'), life: 3500 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(v: Visitor): void {
  deleteTarget.value = v
  showDeleteDialog.value = true
}

async function performDelete(): Promise<void> {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await visitorsApi.delete(deleteTarget.value.id)
    toast.add({ severity: 'success', summary: t('visitors.deleted'), life: 2500 })
    showDeleteDialog.value = false
    deleteTarget.value = null
    await fetchAll()
  } catch (e) {
    console.error(e)
    toast.add({ severity: 'error', summary: t('common.errorDeleting'), life: 3500 })
  } finally {
    deleting.value = false
  }
}

onMounted(() => { void fetchAll() })
</script>

<style scoped>
@import '@/assets/styles/list-page.css';

.list-row-secondary-right { margin-left: auto; }
</style>
