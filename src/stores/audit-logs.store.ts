import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auditLogsApi } from '@/api'
import type { AuditLog } from '@/types/audit-log'

export interface AuditLogsPaginationState {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export const useAuditLogsStore = defineStore('auditLogs', () => {
  // State
  const auditLogs = ref<AuditLog[]>([])
  const pagination = ref<AuditLogsPaginationState>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const auditLogById = computed(
    () => (id: string) => auditLogs.value.find((al) => al.id === id)
  )

  const logsByUser = computed(
    () => (userId: string) =>
      auditLogs.value.filter((al) => al.userId === userId)
  )

  const logsByEntity = computed(
    () => (entityType: string, entityId: string) =>
      auditLogs.value.filter(
        (al) => al.entityType === entityType && al.entityId === entityId
      )
  )

  // Actions
  const fetchAuditLogs = async (
    page: number = 1,
    pageSize: number = 20
  ): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const response = await auditLogsApi.getAll(page, pageSize)

      auditLogs.value = response.data
      pagination.value = {
        page: response.page,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages,
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch audit logs'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchLogsByEntity = async (
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> => {
    try {
      loading.value = true
      error.value = null
      const logs = await auditLogsApi.getByEntity(entityType, entityId)

      // Merge with existing logs
      logs.forEach((log) => {
        const index = auditLogs.value.findIndex((al) => al.id === log.id)
        if (index === -1) {
          auditLogs.value.push(log)
        }
      })

      return logs
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch entity logs'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearAuditLogs = (): void => {
    auditLogs.value = []
    pagination.value = {
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
    }
  }

  const setError = (message: string | null): void => {
    error.value = message
  }

  return {
    // State
    auditLogs,
    pagination,
    loading,
    error,

    // Getters
    auditLogById,
    logsByUser,
    logsByEntity,

    // Actions
    fetchAuditLogs,
    fetchLogsByEntity,
    clearAuditLogs,
    setError,
  }
})
