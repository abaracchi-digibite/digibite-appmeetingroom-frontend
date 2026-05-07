import { apiClient } from './client'
import type {
  CreateResourceDto,
  Resource,
  UpdateResourceDto,
  ResourceType,
  CreateResourceTypeDto,
  UpdateResourceTypeDto,
  CustomField,
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
} from '@/types/resource'

/**
 * Resources API service
 */
export const resourcesApi = {
      /**
       * Get all resources for a specific tenant
       */
      async getAllByTenant(tenantId: string): Promise<Resource[]> {
        const response = await apiClient.get<Resource[]>(`/resources/by-tenant?tenantId=${tenantId}`)
        return response.data.data!
      },
  /**
   * Get all resources for current tenant
   */
  async getAll(): Promise<Resource[]> {
    const response = await apiClient.get<Resource[]>('/resources')
    return response.data.data!
  },

  /**
   * Get resource by ID
   */
  async getById(id: string): Promise<Resource> {
    const response = await apiClient.get<Resource>(`/resources/${id}`)
    return response.data.data!
  },

  /**
   * Get all resources for a specific plant
   */
  async getByPlant(plantId: string): Promise<Resource[]> {
    const response = await apiClient.get<Resource[]>(
      `/resources/by-plant/${plantId}`
    )
    return response.data.data!
  },

  /**
   * Get available resources for a specific plant
   */
  async getAvailableByPlant(plantId: string): Promise<Resource[]> {
    const response = await apiClient.get<Resource[]>(
      `/resources/available/${plantId}`
    )
    return response.data.data!
  },

  /**
   * Create new resource
   */
  async create(dto: CreateResourceDto): Promise<Resource> {
    const response = await apiClient.post<Resource>('/resources', dto)
    return response.data.data!
  },

  /**
   * Update resource
   */
  async update(id: string, dto: UpdateResourceDto): Promise<Resource> {
    const response = await apiClient.put<Resource>(`/resources/${id}`, dto)
    return response.data.data!
  },

  /**
   * Delete resource
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/resources/${id}`)
  },
}

/**
 * Resource Types API service
 */
export const resourceTypesApi = {
      /**
       * Get all resource types for a specific tenant
       */
      async getAllByTenant(tenantId: string): Promise<ResourceType[]> {
        const response = await apiClient.get<ResourceType[]>(`/resource-types/by-tenant?tenantId=${tenantId}`)
        return response.data.data!
      },
  /**
   * Get all resource types
   */
  async getAll(): Promise<ResourceType[]> {
    const response = await apiClient.get<ResourceType[]>(
      '/resource-types'
    )
    return response.data.data!
  },

  /**
   * Get resource type by ID
   */
  async getById(id: string): Promise<ResourceType> {
    const response = await apiClient.get<ResourceType>(
      `/resource-types/${id}`
    )
    return response.data.data!
  },

  /**
   * Create new resource type
   */
  async create(dto: CreateResourceTypeDto): Promise<ResourceType> {
    const response = await apiClient.post<ResourceType>(
      '/resource-types',
      dto
    )
    return response.data.data!
  },

  /**
   * Update resource type
   */
  async update(
    id: string,
    dto: UpdateResourceTypeDto
  ): Promise<ResourceType> {
    const response = await apiClient.put<ResourceType>(
      `/resource-types/${id}`,
      dto
    )
    return response.data.data!
  },

  /**
   * Delete resource type
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/resource-types/${id}`)
  },

  /**
   * Add custom field to resource type
   */
  async addCustomField(
    typeId: string,
    dto: CreateCustomFieldDto
  ): Promise<CustomField> {
    const response = await apiClient.post<CustomField>(
      `/resource-types/${typeId}/custom-fields`,
      dto
    )
    return response.data.data!
  },

  /**
   * Update custom field
   */
  async updateCustomField(
    fieldId: string,
    dto: UpdateCustomFieldDto
  ): Promise<CustomField> {
    const response = await apiClient.put<CustomField>(
      `/custom-fields/${fieldId}`,
      dto
    )
    return response.data.data!
  },

  /**
   * Remove custom field
   */
  async removeCustomField(fieldId: string): Promise<void> {
    await apiClient.delete(`/custom-fields/${fieldId}`)
  },
}
