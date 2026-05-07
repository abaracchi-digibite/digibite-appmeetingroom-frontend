<template>
  <MainLayout>
    <div class="visitors-directory">
      <PrimeButton
          icon="pi pi-plus"
          :label="t('visitors.create')"
          severity="success"
          size="small"
          @click="openCreateDialog"
      />

      <!-- Search bar -->
      <div class="directory-search">
        <PrimeIconField class="flex-1">
          <PrimeInputIcon class="pi pi-search" />
          <PrimeInputText v-model="searchQuery" :placeholder="t('common.search')" class="w-full" />
        </PrimeIconField>
      </div>

      <!-- Table -->
      <PrimeDataTable
        :value="filteredVisitors"
        :loading="loading"
        responsiveLayout="scroll"
        stripedRows
        showGridlines
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-inbox" />
            <p>{{ t('common.noData') }}</p>
          </div>
        </template>
        <template #loading>
          <div class="empty-state"><i class="pi pi-spin pi-spinner" /></div>
        </template>

        <PrimeColumn :header="t('visitors.fullName')" field="fullName">
          <template #body="{ data }">
            <strong>{{ data.firstName }} {{ data.lastName }}</strong>
          </template>
        </PrimeColumn>

        <PrimeColumn field="email" :header="t('common.email')">
          <template #body="{ data }">
            <span v-if="data.email">{{ data.email }}</span>
            <span v-else class="muted">—</span>
          </template>
        </PrimeColumn>

        <PrimeColumn field="phone" :header="t('visitors.phone')">
          <template #body="{ data }">
            <span v-if="data.phone">{{ data.phone }}</span>
            <span v-else class="muted">—</span>
          </template>
        </PrimeColumn>

        <PrimeColumn field="lastUsedAt" :header="t('visitors.lastUsed')">
          <template #body="{ data }">
            <span v-if="data.lastUsedAt">{{ formatDate(data.lastUsedAt) }}</span>
            <span v-else class="muted">—</span>
          </template>
        </PrimeColumn>

        <PrimeColumn :header="t('common.actions')" :style="{ width: '140px' }">
          <template #body="{ data }">
            <div class="row-actions">
              <PrimeButton icon="pi pi-pencil" outlined severity="warning" size="small" @click="openEditDialog(data)" />
              <PrimeButton icon="pi pi-trash" outlined severity="danger" size="small" @click="confirmDelete(data)" />
            </div>
          </template>
        </PrimeColumn>
      </PrimeDataTable>

      <!-- Create / Edit dialog -->
      <PrimeDialog
        v-model:visible="showDialog"
        :header="isEditing ? t('visitors.edit') : t('visitors.create')"
        modal
        :style="{ width: '520px' }"
      >
        <div class="dlg-form">
          <div class="dlg-grid">
            <div class="dlg-field">
              <label class="dlg-label required">{{ t('wizard.visitorFirstName') }}</label>
              <PrimeInputText v-model="formData.firstName" class="w-full" />
            </div>
            <div class="dlg-field">
              <label class="dlg-label required">{{ t('wizard.visitorLastName') }}</label>
              <PrimeInputText v-model="formData.lastName" class="w-full" />
            </div>
            <div class="dlg-field dlg-field-full">
              <label class="dlg-label">{{ t('common.email') }}</label>
              <PrimeInputText v-model="formData.email" type="email" class="w-full" placeholder="email@esempio.com" />
            </div>
            <div class="dlg-field dlg-field-full">
              <label class="dlg-label">{{ t('wizard.visitorPhone') }}</label>
              <PrimeInputText v-model="formData.phone" type="tel" class="w-full" placeholder="+39 …" />
            </div>
            <div class="dlg-field dlg-field-full">
              <label class="dlg-label">{{ t('visitors.notes') }}</label>
              <PrimeTextarea v-model="formData.notes" rows="3" class="w-full" />
            </div>
          </div>
        </div>
        <template #footer>
          <PrimeButton :label="t('common.cancel')" severity="secondary" outlined @click="showDialog = false" />
          <PrimeButton :label="t('common.save')" icon="pi pi-check" :loading="saving" @click="save" />
        </template>
      </PrimeDialog>

      <!-- Delete confirmation -->
      <PrimeDialog
        v-model:visible="showDeleteDialog"
        :header="t('visitors.deleteTitle')"
        modal
        :style="{ width: '420px' }"
      >
        <p>{{ t('visitors.deleteConfirm', { name: deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : '' }) }}</p>
        <template #footer>
          <PrimeButton :label="t('common.cancel')" severity="secondary" outlined @click="showDeleteDialog = false" />
          <PrimeButton :label="t('common.delete')" icon="pi pi-trash" severity="danger" :loading="deleting" @click="performDelete" />
        </template>
      </PrimeDialog>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/layouts/MainLayout.vue'
import PrimeButton from 'primevue/button'
import PrimeDataTable from 'primevue/datatable'
import PrimeColumn from 'primevue/column'
import PrimeInputText from 'primevue/inputtext'
import PrimeIconField from 'primevue/iconfield'
import PrimeInputIcon from 'primevue/inputicon'
import PrimeDialog from 'primevue/dialog'
import PrimeTextarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { visitorsApi } from '@/api/visitors.api'
import type { Visitor, CreateVisitorDto, UpdateVisitorDto } from '@/types/visitor'

const { t } = useI18n()
const toast = useToast()

const visitors = ref<Visitor[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')

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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
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
.visitors-directory {
  margin: 0 auto;
  padding-bottom: 2rem;
}

.directory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.directory-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.directory-title h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.directory-title p {
  margin: 0.2rem 0 0;
  color: var(--text-secondary, #64748b);
  font-size: 0.875rem;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(37,99,235,0.1), rgba(13,148,136,0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #2563eb;
}

.directory-search {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.75rem;
}

.flex-1 { flex: 1; }
.w-full { width: 100%; }

.row-actions {
  display: flex;
  gap: 0.4rem;
}

.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--text-secondary, #64748b);
}

.empty-state i {
  font-size: 2.5rem;
  color: #cbd5e1;
  display: block;
  margin-bottom: 0.5rem;
}

.muted {
  color: #94a3b8;
}

.dlg-form {
  padding: 0.5rem 0;
}

.dlg-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem 1rem;
}

.dlg-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.dlg-field-full { grid-column: 1 / -1; }

.dlg-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-primary, #0f172a);
}

.dlg-label.required::after {
  content: ' *';
  color: #ef4444;
}
</style>
