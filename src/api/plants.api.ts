import { apiClient } from './client'
import type { CreatePlantDto, Plant, UpdatePlantDto } from '@/types/plant'

/**
 * Plants API service
 */
export const plantsApi = {
  /**
   * Get all plants for current tenant
   */
  async getAll(): Promise<Plant[]> {
    const response = await apiClient.get<Plant[]>('/plants')
    return response.data.data!
  },

  /**
   * Get plant by ID
   */
  async getById(id: string): Promise<Plant> {
    const response = await apiClient.get<Plant>(`/plants/${id}`)
    return response.data.data!
  },

  /**
   * Create new plant
   */
  async create(dto: CreatePlantDto): Promise<Plant> {
    const response = await apiClient.post<Plant>('/plants', dto)
    return response.data.data!
  },

  /**
   * Update plant
   */
  async update(id: string, dto: UpdatePlantDto): Promise<Plant> {
    const response = await apiClient.put<Plant>(`/plants/${id}`, dto)
    return response.data.data!
  },

  /**
   * Delete plant
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/plants/${id}`)
  },

  /**
   * Get all plants for a specific tenant
   */
  async getAllByTenant(tenantId: string): Promise<Plant[]> {
    const response = await apiClient.get<Plant[]>(`/plants/by-tenant?tenantId=${tenantId}`)
    return response.data.data!
  },
}
