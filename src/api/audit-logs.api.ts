import { apiClient } from './client'
import type { AuditLog } from '@/types/audit-log'
import type { PagedResponse } from '@/types/api'

/**
 * Audit Logs API service
 */
export const auditLogsApi = {
  /**
   * Get audit logs with pagination
   */
  async getAll(page: number = 1, pageSize: number = 20): Promise<PagedResponse<AuditLog>> {
    const response = await apiClient.get<AuditLog[]>('/audit-logs', {
      params: { page, pageSize },
    })
    return response.data as PagedResponse<AuditLog>
  },

  /**
   * Get audit logs for specific entity
   */
  async getByEntity(
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> {
    const response = await apiClient.get<AuditLog[]>(
      `/audit-logs/entity/${entityType}/${entityId}`
    )
    return response.data.data!
  },
}
