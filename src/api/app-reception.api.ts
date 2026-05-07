import { apiClient } from './client'
import type { AppReceptionConfigInput, AppReceptionConfigResponse } from '@/types/app-reception'

/**
 * Configurazione AppReception per-tenant.
 * Backend: /api/admin/app-reception
 */
export const appReceptionApi = {
  async get(): Promise<AppReceptionConfigResponse | null> {
    const response = await apiClient.get<AppReceptionConfigResponse | null>('/admin/app-reception')
    return response.data.data ?? null
  },

  async upsert(dto: AppReceptionConfigInput): Promise<AppReceptionConfigResponse> {
    const response = await apiClient.put<AppReceptionConfigResponse>('/admin/app-reception', dto)
    return response.data.data!
  },

  async delete(): Promise<void> {
    await apiClient.delete('/admin/app-reception')
  },
}
