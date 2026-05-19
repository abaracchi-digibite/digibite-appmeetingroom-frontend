import { apiClient } from './client'
import type { AuditLog } from '@/types/audit-log'
import type { PagedResponse } from '@/types/api'

export interface AuditLogQueryParams {
  page?:        number
  pageSize?:    number
  entityType?:  string
  userEmail?:   string
  dateFrom?:    string   // ISO date string (YYYY-MM-DD)
  dateTo?:      string   // ISO date string (YYYY-MM-DD)
}

/**
 * Audit Logs API service
 */
export const auditLogsApi = {
  /**
   * Recupera i log con paginazione e filtri server-side.
   */
  async getAll(params: AuditLogQueryParams = {}): Promise<PagedResponse<AuditLog>> {
    const query: Record<string, unknown> = {
      page:     params.page     ?? 1,
      pageSize: params.pageSize ?? 20,
    }
    if (params.entityType) query.entityType = params.entityType
    if (params.userEmail)  query.userEmail  = params.userEmail
    if (params.dateFrom)   query.dateFrom   = params.dateFrom
    if (params.dateTo)     query.dateTo     = params.dateTo

    const response = await apiClient.get<AuditLog[]>('/audit-logs', { params: query })
    return response.data as PagedResponse<AuditLog>
  },

  /**
   * Audit log per una specifica entità.
   */
  async getByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    const response = await apiClient.get<AuditLog[]>(
      `/audit-logs/entity/${entityType}/${entityId}`
    )
    return response.data.data!
  },
}
