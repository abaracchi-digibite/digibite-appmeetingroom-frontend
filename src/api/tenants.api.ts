import { apiClient } from './client'
import type { CreateTenantDto, Tenant, UpdateTenantDto } from '@/types/tenant'

/**
 * Tenants API service (SuperAdmin endpoints)
 * Base path: /api/superadmin/tenants
 */
export const tenantsApi = {
  /**
   * Get all tenants (superadmin only)
   */
  async getAll(): Promise<Tenant[]> {
    const response = await apiClient.get<Tenant[]>('/superadmin/tenants')
    return response.data.data!
  },

  /**
   * Get tenant by ID (superadmin only)
   */
  async getById(id: string): Promise<Tenant> {
    const response = await apiClient.get<Tenant>(`/superadmin/tenants/${id}`)
    return response.data.data!
  },

  /**
   * Create new tenant (superadmin only)
   */
  async create(dto: CreateTenantDto): Promise<Tenant> {
    const response = await apiClient.post<Tenant>('/superadmin/tenants', dto)
    return response.data.data!
  },

  /**
   * Update tenant (superadmin only)
   */
  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const response = await apiClient.put<Tenant>(
      `/superadmin/tenants/${id}`,
      dto
    )
    return response.data.data!
  },

  /**
   * Suspend tenant (superadmin only)
   */
  async suspend(id: string): Promise<void> {
    await apiClient.post(`/superadmin/tenants/${id}/suspend`, {})
  },

  /**
   * Activate tenant (superadmin only)
   */
  async activate(id: string): Promise<void> {
    await apiClient.post(`/superadmin/tenants/${id}/activate`, {})
  },

  /**
   * Delete tenant (superadmin only)
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/superadmin/tenants/${id}`)
  },

  /**
   * Upload tenant logo (multipart/form-data)
   * Returns the updated tenant with the new logo URL
   */
  async uploadLogo(id: string, file: File): Promise<Tenant> {
    const formData = new FormData()
    formData.append('logo', file)
    const response = await apiClient.post<Tenant>(
      `/superadmin/tenants/${id}/logo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data!
  },

  async uploadCompactLogo(id: string, file: File): Promise<Tenant> {
    const formData = new FormData()
    formData.append('logo', file)
    const response = await apiClient.post<Tenant>(
      `/superadmin/tenants/${id}/logo-compact`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data!
  },

  // -- Self-service endpoints (Tenant.Owner / Tenant.Contributor) --

  /**
   * Get current tenant (accessible to all authenticated users)
   */
  async getCurrentTenant(): Promise<Tenant> {
    const response = await apiClient.get<Tenant>('/tenant/me')
    return response.data.data!
  },

  /**
   * Update current tenant settings (Tenant.Owner only)
   */
  async updateCurrentTenantSettings(dto: UpdateTenantDto): Promise<Tenant> {
    const response = await apiClient.put<Tenant>('/tenant/me/settings', dto)
    return response.data.data!
  },

  async uploadCurrentTenantLogo(file: File): Promise<Tenant> {
    const formData = new FormData()
    formData.append('logo', file)
    const response = await apiClient.post<Tenant>(
      '/tenant/me/logo',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data!
  },

  async uploadCurrentTenantCompactLogo(file: File): Promise<Tenant> {
    const formData = new FormData()
    formData.append('logo', file)
    const response = await apiClient.post<Tenant>(
      '/tenant/me/logo-compact',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data!
  },
}
