<template>
  <MainLayout>
    <div class="audit-log-container">

      <!-- ── Toolbar ──────────────────────────────────────────────────────── -->
      <div class="al-toolbar">
        <!-- Riga 1: ricerca + azioni -->
        <div class="al-toolbar-row">
          <span class="al-search-bar">
            <i class="pi pi-search al-search-icon"></i>
            <input
              v-model="searchUserEmail"
              :placeholder="t('auditLog.searchByUser')"
              class="al-search-input"
              @input="onFilterChange"
            />
          </span>

          <div class="al-toolbar-actions">
            <button @click="refreshLogs" class="al-btn al-btn-refresh">
              <i class="pi pi-refresh"></i>
              {{ t('common.refresh') }}
            </button>
            <button @click="exportLogs" class="al-btn al-btn-export">
              <i class="pi pi-download"></i>
              {{ t('auditLog.export') }}
            </button>
          </div>
        </div>

        <!-- Riga 2: filtri -->
        <div class="al-filters-row">
          <div class="al-filter-group">
            <label class="al-filter-label">{{ t('auditLog.dateRange') }}</label>
            <div class="al-date-range">
              <input v-model="dateRangeStart" type="date" class="al-filter-input" @change="onFilterChange" />
              <span class="al-muted-text">→</span>
              <input v-model="dateRangeEnd"   type="date" class="al-filter-input" @change="onFilterChange" />
            </div>
          </div>

          <div class="al-filter-group">
            <label class="al-filter-label">{{ t('auditLog.entityType') }}</label>
            <select v-model="entityTypeFilter" class="al-filter-input al-filter-select" @change="onFilterChange">
              <option value="">{{ t('auditLog.allEntityTypes') }}</option>
              <option value="Auth">{{ t('auditLog.entityAuth') }}</option>
              <option value="Booking">{{ t('auditLog.entityBooking') }}</option>
              <option value="Plant">{{ t('auditLog.entitySite') }}</option>
              <option value="Resource">{{ t('auditLog.entityResource') }}</option>
              <option value="ResourceType">{{ t('auditLog.entityResourceType') }}</option>
              <option value="Tenant">{{ t('auditLog.entityTenant') }}</option>
              <option value="User">{{ t('auditLog.entityUser') }}</option>
              <option value="UserGroup">{{ t('auditLog.entityUserGroup') }}</option>
              <option value="VisitorType">{{ t('auditLog.entityVisitorType') }}</option>
            </select>
          </div>

          <div class="al-filter-group al-filter-autorefresh">
            <PrimeToggleSwitch v-model="autoRefresh" inputId="autoRefresh" />
            <label for="autoRefresh" class="al-filter-label">{{ t('auditLog.autoRefresh') }}</label>
          </div>
        </div>
      </div>

      <!-- ── Tabella ─────────────────────────────────────────────────────── -->
      <div class="al-table-wrapper">
        <!-- Loading overlay -->
        <div v-if="auditLogsStore.loading" class="al-loading">
          <i class="pi pi-spin pi-spinner"></i>
          <span>{{ t('common.loading') }}</span>
        </div>

        <table v-else class="al-table">
          <thead>
            <tr class="al-thead-row">
              <th class="al-th al-th-time">{{ t('auditLog.timestamp') }}</th>
              <th class="al-th al-th-user">{{ t('auditLog.user') }}</th>
              <th class="al-th al-th-action">{{ t('auditLog.action') }}</th>
              <th class="al-th al-th-entity">{{ t('auditLog.entity') }}</th>
              <th class="al-th al-th-id">{{ t('auditLog.entityIdHeader') }}</th>
              <th class="al-th al-th-ip">IP</th>
              <th class="al-th al-th-detail"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="log in auditLogsStore.auditLogs" :key="log.id">
              <!-- Riga principale -->
              <tr
                class="al-row"
                :class="{ 'al-row--expanded': expandedLogs.includes(log.id) }"
                @click="(log.oldValues || log.newValues) && toggleExpanded(log.id)"
                :style="(log.oldValues || log.newValues) ? 'cursor:pointer' : ''"
              >
                <td class="al-td al-td-time">
                  <span class="al-date">{{ formatDate(log.createdAt) }}</span>
                  <span class="al-time">{{ formatTime(log.createdAt) }}</span>
                </td>
                <td class="al-td al-td-user">
                  <span v-if="log.userEmail" class="al-user-email">{{ log.userEmail }}</span>
                  <span v-else class="al-muted-text al-no-user">—</span>
                </td>
                <td class="al-td al-td-action">
                  <span class="al-badge" :class="getActionClass(log.action)">
                    {{ formatAction(log.action) }}
                  </span>
                </td>
                <td class="al-td al-td-entity">
                  <span class="al-entity-chip">
                    <i :class="getEntityIcon(log.entityType)" class="al-entity-icon"></i>
                    {{ log.entityType }}
                  </span>
                </td>
                <td class="al-td al-td-id">
                  <code class="al-entity-id">{{ truncateId(log.entityId) }}</code>
                </td>
                <td class="al-td al-td-ip">
                  <span v-if="log.ipAddress" class="al-ip">{{ log.ipAddress }}</span>
                  <span v-else class="al-muted-text">—</span>
                </td>
                <td class="al-td al-td-detail">
                  <button
                    v-if="log.oldValues || log.newValues"
                    @click.stop="toggleExpanded(log.id)"
                    class="al-expand-btn"
                    :class="{ 'al-expand-btn--open': expandedLogs.includes(log.id) }"
                    :title="expandedLogs.includes(log.id) ? t('common.hide') : t('common.show')"
                  >
                    <i :class="expandedLogs.includes(log.id) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                  </button>
                </td>
              </tr>

              <!-- Riga espansa con diff old/new -->
              <tr v-if="expandedLogs.includes(log.id)" class="al-detail-row">
                <td colspan="7" class="al-detail-td">
                  <div class="al-detail-content">
                    <!-- Meta aggiuntiva -->
                    <div v-if="log.userAgent" class="al-detail-meta">
                      <i class="pi pi-desktop"></i>
                      <span class="al-detail-meta-text">{{ log.userAgent }}</span>
                    </div>

                    <!-- Diff old / new -->
                    <div class="al-diff-grid">
                      <div v-if="log.oldValues" class="al-diff-panel al-diff-old">
                        <div class="al-diff-header">
                          <i class="pi pi-minus-circle"></i>
                          {{ t('auditLog.oldValues') }}
                        </div>
                        <pre class="al-pre-block">{{ formatJson(log.oldValues) }}</pre>
                      </div>
                      <div v-if="log.newValues" class="al-diff-panel al-diff-new">
                        <div class="al-diff-header">
                          <i class="pi pi-plus-circle"></i>
                          {{ t('auditLog.newValues') }}
                        </div>
                        <pre class="al-pre-block">{{ formatJson(log.newValues) }}</pre>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-if="!auditLogsStore.loading && auditLogsStore.auditLogs.length === 0">
              <td colspan="7" class="al-empty-cell">
                <i class="pi pi-inbox al-empty-icon"></i>
                <p class="al-empty-text">{{ t('common.noData') }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Paginazione ─────────────────────────────────────────────────── -->
      <div v-if="auditLogsStore.pagination.totalCount > 0" class="al-pagination">
        <span class="al-pagination-text">
          {{ rangeStart }}–{{ rangeEnd }} / {{ auditLogsStore.pagination.totalCount }} {{ t('auditLog.logUnit') }}
        </span>
        <div class="al-pagination-controls">
          <button
            @click="previousPage"
            :disabled="auditLogsStore.pagination.page <= 1"
            class="al-btn al-btn-page"
          >
            <i class="pi pi-chevron-left"></i>
            {{ t('common.previous') }}
          </button>
          <span class="al-page-indicator">
            {{ t('auditLog.page') }} {{ auditLogsStore.pagination.page }} / {{ auditLogsStore.pagination.totalPages }}
          </span>
          <button
            @click="nextPage"
            :disabled="auditLogsStore.pagination.page >= auditLogsStore.pagination.totalPages"
            class="al-btn al-btn-page"
          >
            {{ t('common.next') }}
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuditLogsStore } from '@/stores/audit-logs.store'
import MainLayout from '@/layouts/MainLayout.vue'
import PrimeToggleSwitch from 'primevue/toggleswitch'

const { t } = useI18n()
const auditLogsStore = useAuditLogsStore()

// ── Filtri ────────────────────────────────────────────────────────────────────
const searchUserEmail  = ref('')
const dateRangeStart   = ref('')
const dateRangeEnd     = ref('')
const entityTypeFilter = ref('')
const autoRefresh      = ref(false)
const expandedLogs     = ref<string[]>([])
let   autoRefreshInterval: ReturnType<typeof setInterval> | null = null

// ── Paginazione ───────────────────────────────────────────────────────────────
const rangeStart = computed(() =>
  (auditLogsStore.pagination.page - 1) * auditLogsStore.pagination.pageSize + 1
)
const rangeEnd = computed(() =>
  Math.min(
    auditLogsStore.pagination.page * auditLogsStore.pagination.pageSize,
    auditLogsStore.pagination.totalCount
  )
)

// ── Caricamento ───────────────────────────────────────────────────────────────
const buildParams = (page: number) => ({
  page,
  pageSize:   auditLogsStore.pagination.pageSize,
  userEmail:  searchUserEmail.value  || undefined,
  entityType: entityTypeFilter.value || undefined,
  dateFrom:   dateRangeStart.value   || undefined,
  dateTo:     dateRangeEnd.value     || undefined,
})

const loadLogs     = async (page = 1) => { try { await auditLogsStore.fetchAuditLogs(buildParams(page)) } catch { /* in store.error */ } }
const onFilterChange = () => loadLogs(1)
const refreshLogs    = () => loadLogs(1)
const nextPage       = () => { const { page, totalPages } = auditLogsStore.pagination; if (page < totalPages) loadLogs(page + 1) }
const previousPage   = () => { const { page } = auditLogsStore.pagination; if (page > 1) loadLogs(page - 1) }

// ── Formato data/ora ──────────────────────────────────────────────────────────
const formatDate = (s: string) => new Date(s).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })
const formatTime = (s: string) => new Date(s).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })

const formatJson = (value: string | Record<string, unknown> | null | undefined): string => {
  if (value == null) return ''
  if (typeof value === 'string') { try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value } }
  return JSON.stringify(value, null, 2)
}

const truncateId = (id: string) => id.length > 12 ? `${id.substring(0, 8)}…` : id

// ── Badge azione ──────────────────────────────────────────────────────────────
const ACTION_KEY_MAP: Record<string, string> = {
  create:        'auditLog.actionCreate',
  created:       'auditLog.actionCreate',
  update:        'auditLog.actionUpdate',
  updated:       'auditLog.actionUpdate',
  delete:        'auditLog.actionDelete',
  deleted:       'auditLog.actionDelete',
  login:         'auditLog.actionLogin',
  loginfailed:   'auditLog.actionLoginFailed',
  acceptinvite:  'auditLog.actionAcceptInvite',
  addmember:     'auditLog.actionAddMember',
  removemember:  'auditLog.actionRemoveMember',
  statuschange:  'auditLog.actionStatusChange',
  cancel:        'auditLog.actionCancel',
}

const formatAction = (action: string) => {
  const key = ACTION_KEY_MAP[action.toLowerCase()]
  return key ? t(key) : action
}

const getActionClass = (action: string): string => {
  switch (action.toLowerCase()) {
    case 'create': case 'created': case 'acceptinvite': case 'addmember': return 'al-badge-create'
    case 'delete': case 'deleted': case 'loginfailed':  case 'removemember': case 'cancel': return 'al-badge-delete'
    case 'update': case 'updated': case 'login': case 'statuschange': return 'al-badge-update'
    default: return 'al-badge-default'
  }
}

// ── Icona entità ──────────────────────────────────────────────────────────────
const getEntityIcon = (entityType: string): string => {
  switch (entityType) {
    case 'Booking':      return 'pi pi-calendar'
    case 'Resource':     return 'pi pi-box'
    case 'ResourceType': return 'pi pi-tag'
    case 'Plant':        return 'pi pi-building'
    case 'User':         return 'pi pi-user'
    case 'UserGroup':    return 'pi pi-users'
    case 'Tenant':       return 'pi pi-briefcase'
    case 'VisitorType':  return 'pi pi-id-card'
    case 'Auth':         return 'pi pi-lock'
    default:             return 'pi pi-file'
  }
}

// ── Expand ────────────────────────────────────────────────────────────────────
const toggleExpanded = (logId: string) => {
  const i = expandedLogs.value.indexOf(logId)
  if (i > -1) expandedLogs.value.splice(i, 1)
  else        expandedLogs.value.push(logId)
}

// ── Export CSV ────────────────────────────────────────────────────────────────
const exportLogs = () => {
  const headers = [t('auditLog.timestamp'), t('auditLog.user'), t('auditLog.action'), t('auditLog.entity'), t('auditLog.entityIdHeader'), 'IP', 'User Agent', t('auditLog.oldValues'), t('auditLog.newValues')]
  const rows = auditLogsStore.auditLogs.map((log) => [
    `${formatDate(log.createdAt)} ${formatTime(log.createdAt)}`,
    log.userEmail  ?? '',
    log.action,
    log.entityType,
    log.entityId,
    log.ipAddress  ?? '',
    log.userAgent  ?? '',
    typeof log.oldValues === 'string' ? log.oldValues : JSON.stringify(log.oldValues ?? ''),
    typeof log.newValues === 'string' ? log.newValues : JSON.stringify(log.newValues ?? ''),
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'audit-logs.csv' })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  await loadLogs(1)
  if (autoRefresh.value) autoRefreshInterval = setInterval(refreshLogs, 30000)
})
onBeforeUnmount(() => { if (autoRefreshInterval) clearInterval(autoRefreshInterval) })
watch(autoRefresh, (on: boolean) => {
  if (on && !autoRefreshInterval)       autoRefreshInterval = setInterval(refreshLogs, 30000)
  else if (!on && autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null }
})
</script>

<style scoped src="./AuditLogView.css"></style>
