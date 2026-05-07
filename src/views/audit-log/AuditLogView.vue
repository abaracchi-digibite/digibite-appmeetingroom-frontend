<template>
  <MainLayout>
    <div class="audit-log-container">
      <!-- Toolbar -->
      <div class="flex flex-col gap-4 mb-3">
        <!-- Search and Actions -->
        <div class="flex gap-4 flex-wrap">
          <span class="flex-1 min-w-64 flex items-center gap-2 px-4 py-2 rounded-lg" style="background: white; border: 1px solid #e4e9f4;">
            <i class="pi pi-search" style="color: #8898b8;"></i>
            <input
              v-model="searchUserEmail"
              :placeholder="t('auditLog.searchByUser')"
              class="bg-transparent outline-none flex-1 text-sm"
              style="color: #0f172a;"
              @input="onFilterChange"
            />
          </span>
          <button
            @click="refreshLogs"
            class="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all hover:opacity-90"
            style="background: #e4e9f4; color: #0f172a;"
          >
            <i class="pi pi-refresh"></i>
            {{ t('common.refresh') }}
          </button>
          <button
            @click="exportLogs"
            class="px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all hover:opacity-90"
            style="background: #dbeafe; color: #1e40af;"
          >
            <i class="pi pi-download"></i>
            {{ t('auditLog.export') }}
          </button>
        </div>

        <!-- Filters -->
        <div class="flex gap-4 flex-wrap items-center">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium" style="color: #0f172a;">{{ t('auditLog.dateRange') }}:</label>
            <input
              v-model="dateRangeStart"
              type="date"
              class="px-3 py-2 rounded-lg border text-sm"
              style="border-color: #e4e9f4; background: white; color: #0f172a;"
              @change="onFilterChange"
            />
            <span style="color: #8898b8;">-</span>
            <input
              v-model="dateRangeEnd"
              type="date"
              class="px-3 py-2 rounded-lg border text-sm"
              style="border-color: #e4e9f4; background: white; color: #0f172a;"
              @change="onFilterChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm font-medium" style="color: #0f172a;">{{ t('auditLog.entityType') }}:</label>
            <select
              v-model="entityTypeFilter"
              class="px-3 py-2 rounded-lg border text-sm w-48"
              style="border-color: #e4e9f4; background: white; color: #0f172a;"
              @change="onFilterChange"
            >
              <option value="">{{ t('auditLog.allEntityTypes') }}</option>
              <option value="Tenant">{{ t('auditLog.entityTenant') }}</option>
              <option value="Site">{{ t('auditLog.entitySite') }}</option>
              <option value="Resource">{{ t('auditLog.entityResource') }}</option>
              <option value="Booking">{{ t('auditLog.entityBooking') }}</option>
              <option value="User">{{ t('auditLog.entityUser') }}</option>
              <option value="UserGroup">{{ t('auditLog.entityUserGroup') }}</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="autoRefresh" id="autoRefresh" class="w-5 h-5 rounded" />
            <label for="autoRefresh" class="text-sm font-medium" style="color: #0f172a;">
              {{ t('auditLog.autoRefresh') }}
            </label>
          </div>
        </div>
      </div>

      <!-- Timeline Lista -->
      <div class="space-y-4">
        <div
          v-for="(log, index) in paginatedLogs"
          :key="log.id"
          class="relative"
        >
          <!-- Timeline line -->
<!--          <div-->
<!--            v-if="index < paginatedLogs.length - 1"-->
<!--            class="absolute left-6 top-12 w-0.5 h-8"-->
<!--            style="background: #e4e9f4;"-->
<!--          ></div>-->

          <!-- Log item -->
          <div class="flex gap-4">
            <!-- Timeline dot -->
<!--            <div class="flex flex-col items-center flex-shrink-0 pt-2">-->
<!--              <div-->
<!--                class="w-4 h-4 rounded-full border-4"-->
<!--                :style="{-->
<!--                  background: getActionColor(log.action),-->
<!--                  borderColor: '#f0f4ff'-->
<!--                }"-->
<!--              ></div>-->
<!--            </div>-->

            <!-- Card -->
            <div
              class="flex-1 rounded-2xl overflow-hidden transition-all hover:shadow-lg mb-4"
              style="background: white; border: 1px solid #e4e9f4; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
            >
              <div class="px-3 py-2">
                <!-- Header row -->
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <!-- Timestamp -->
                    <p class="text-sm font-medium" style="color: #8898b8;">
                      {{ formatDateTime(log.createdAt) }}
                    </p>
                    <!-- User -->
                    <p class="text-base font-semibold mt-1" style="color: #0f172a;">
                      {{ log.userEmail }}
                    </p>
                  </div>

                  <!-- Action badge -->
                  <span
                    class="px-3 py-1 rounded-full text-xs font-medium"
                    :style="{
                      background: getActionBgLight(log.action),
                      color: getActionColorDark(log.action)
                    }"
                  >
                    {{ log.action }}
                  </span>
                </div>

                <!-- Entity info -->
                <div class="flex items-center gap-3 mb-4 text-sm" style="color: #3d4f6e;">
                  <i class="pi pi-box" style="color: #2563EB;"></i>
                  <span class="font-medium">{{ log.entityType }}</span>
                  <span style="color: #8898b8;">•</span>
                  <code class="text-xs" style="background: #f8fafc; padding: 2px 6px; border-radius: 4px; color: #0f172a;">
                    {{ truncateId(log.entityId) }}
                  </code>
                </div>

                <!-- Details expandable -->
                <button
                  v-if="log.oldValues || log.newValues"
                  @click="toggleExpanded(log.id)"
                  class="flex items-center gap-2 text-sm font-medium transition-colors"
                  :style="{ color: expandedLogs.includes(log.id) ? '#0D9488' : '#8898b8' }"
                >
                  <i :class="expandedLogs.includes(log.id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
                  {{ expandedLogs.includes(log.id) ? t('common.hide') : t('common.show') }} Details
                </button>

                <!-- Expandable content -->
                <div v-if="expandedLogs.includes(log.id) && (log.oldValues || log.newValues)" class="mt-4 pt-4 border-t" style="border-color: #e4e9f4;">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-if="log.oldValues">
                      <h4 class="font-semibold text-sm mb-2" style="color: #0f172a;">{{ t('auditLog.oldValues') }}</h4>
                      <pre class="text-xs p-3 rounded" style="background: #f8fafc; border: 1px solid #e4e9f4; color: #0f172a; overflow: auto; max-height: 200px;">{{ formatJson(log.oldValues) }}</pre>
                    </div>
                    <div v-if="log.newValues">
                      <h4 class="font-semibold text-sm mb-2" style="color: #0f172a;">{{ t('auditLog.newValues') }}</h4>
                      <pre class="text-xs p-3 rounded" style="background: #f8fafc; border: 1px solid #e4e9f4; color: #0f172a; overflow: auto; max-height: 200px;">{{ formatJson(log.newValues) }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="filteredLogs.length === 0" class="text-center py-12">
          <i class="pi pi-inbox text-5xl mb-4" style="color: #cbd5e1;"></i>
          <p class="text-lg" style="color: #64748b;">{{ t('common.noData') }}</p>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredLogs.length > 0" class="flex items-center justify-between mt-8 pt-6 border-t" style="border-color: #e4e9f4;">
        <p class="text-sm" style="color: #3d4f6e;">
          Showing {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredLogs.length) }} of {{ filteredLogs.length }}
        </p>
        <div class="flex gap-2">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            class="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
            style="background: #e4e9f4; color: #0f172a;"
          >
            {{ t('common.previous') }}
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage >= totalPages"
            class="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
            style="background: #e4e9f4; color: #0f172a;"
          >
            {{ t('common.next') }}
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

const { t } = useI18n()
const auditLogsStore = useAuditLogsStore()

const searchUserEmail = ref('')
const dateRangeStart = ref('')
const dateRangeEnd = ref('')
const entityTypeFilter = ref('')
const autoRefresh = ref(false)
const currentPage = ref(1)
const pageSize = 10
const expandedLogs = ref<string[]>([])
let autoRefreshInterval: ReturnType<typeof setInterval> | null = null

const filteredLogs = computed(() => {
  let result = auditLogsStore.auditLogs

  if (searchUserEmail.value) {
    const query = searchUserEmail.value.toLowerCase()
    result = result.filter((log) =>
      log.userEmail?.toLowerCase().includes(query) ?? false
    )
  }

  if (entityTypeFilter.value) {
    result = result.filter((log) => log.entityType === entityTypeFilter.value)
  }

  if (dateRangeStart.value) {
    const startTime = new Date(dateRangeStart.value).getTime()
    result = result.filter((log) => new Date(log.createdAt).getTime() >= startTime)
  }

  if (dateRangeEnd.value) {
    const endDate = new Date(dateRangeEnd.value)
    endDate.setHours(23, 59, 59, 999)
    const endTime = endDate.getTime()
    result = result.filter((log) => new Date(log.createdAt).getTime() <= endTime)
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / pageSize))

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredLogs.value.slice(start, start + pageSize)
})

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

const formatJson = (value: string | Record<string, unknown> | null | undefined): string => {
  if (value == null) return ''
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }
  return JSON.stringify(value, null, 2)
}

const truncateId = (id: string): string => {
  return id.length > 16 ? `${id.substring(0, 13)}...` : id
}

const getActionColor = (action: string): string => {
  switch (action.toLowerCase()) {
    case 'create':
    case 'created':
      return '#0D9488'
    case 'delete':
    case 'deleted':
      return '#DC2626'
    case 'update':
    case 'updated':
      return '#2563EB'
    default:
      return '#8898b8'
  }
}

const getActionBgLight = (action: string): string => {
  switch (action.toLowerCase()) {
    case 'create':
    case 'created':
      return '#d1fae5'
    case 'delete':
    case 'deleted':
      return '#fee2e2'
    case 'update':
    case 'updated':
      return '#dbeafe'
    default:
      return '#f3f4f6'
  }
}

const getActionColorDark = (action: string): string => {
  switch (action.toLowerCase()) {
    case 'create':
    case 'created':
      return '#065f46'
    case 'delete':
    case 'deleted':
      return '#991b1b'
    case 'update':
    case 'updated':
      return '#1e40af'
    default:
      return '#374151'
  }
}

const toggleExpanded = (logId: string) => {
  const index = expandedLogs.value.indexOf(logId)
  if (index > -1) {
    expandedLogs.value.splice(index, 1)
  } else {
    expandedLogs.value.push(logId)
  }
}

const onFilterChange = () => {
  currentPage.value = 1
  loadLogs()
}

const loadLogs = async () => {
  try {
    await auditLogsStore.fetchAuditLogs(currentPage.value, pageSize)
  } catch (error) {
    console.error('Error loading audit logs:', error)
  }
}

const refreshLogs = async () => {
  currentPage.value = 1
  await loadLogs()
}

const exportLogs = () => {
  try {
    const csv = convertToCSV(filteredLogs.value)
    downloadCSV(csv, 'audit-logs.csv')
  } catch (error) {
    console.error('Error exporting logs:', error)
  }
}

const convertToCSV = (logs: any[]): string => {
  const headers = [
    'Timestamp',
    'User Email',
    'Action',
    'Entity Type',
    'Entity ID',
  ]
  const rows = logs.map((log) => [
    log.createdAt,
    log.userEmail,
    log.action,
    log.entityType,
    log.entityId,
  ])

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return csv
}

const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadLogs()
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadLogs()
  }
}

onMounted(async () => {
  try {
    await loadLogs()

    if (autoRefresh.value) {
      autoRefreshInterval = setInterval(refreshLogs, 30000)
    }
  } catch (error) {
    console.error('Error loading audit logs:', error)
  }
})

onBeforeUnmount(() => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
})

watch(autoRefresh, (newValue: boolean) => {
  if (newValue && !autoRefreshInterval) {
    autoRefreshInterval = setInterval(refreshLogs, 30000)
  } else if (!newValue && autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }
})
</script>

<style scoped src="./AuditLogView.css"></style>