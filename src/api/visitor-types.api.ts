import { apiClient } from './client'
import type {
  CustomField,
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
} from '@/types/resource'
import type {
  CreateVisitorTypeDto,
  UpdateVisitorTypeDto,
  VisitorType,
} from '@/types/visitor-type'

/**
 * Visitor Types API service
 */
export const visitorTypesApi = {
  /**
   * Get all visitor types
   */
  async getAll(): Promise<VisitorType[]> {
    const response = await apiClient.get<VisitorType[]>(
      '/visitor-types'
    )
    return response.data.data!
  },

  /**
   * Get visitor type by ID
   */
  async getById(id: string): Promise<VisitorType> {
    const response = await apiClient.get<VisitorType>(
      `/visitor-types/${id}`
    )
    return response.data.data!
  },

  /**
   * Create new visitor type
   */
  async create(dto: CreateVisitorTypeDto): Promise<VisitorType> {
    const response = await apiClient.post<VisitorType>(
      '/visitor-types',
      dto
    )
    return response.data.data!
  },

  /**
   * Update visitor type
   */
  async update(
    id: string,
    dto: UpdateVisitorTypeDto
  ): Promise<VisitorType> {
    const response = await apiClient.put<VisitorType>(
      `/visitor-types/${id}`,
      dto
    )
    return response.data.data!
  },

  /**
   * Delete visitor type
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/visitor-types/${id}`)
  },

  /**
   * Add custom field to visitor type
   */
  async addCustomField(
    typeId: string,
    dto: CreateCustomFieldDto
  ): Promise<CustomField> {
    const response = await apiClient.post<CustomField>(
      `/visitor-types/${typeId}/custom-fields`,
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
