import { apiClient } from './client'
import type {
  CustomFieldDef,
  CreateCustomFieldDefDto,
  UpdateCustomFieldDefDto,
  CustomFieldOption,
  CreateCustomFieldOptionDto,
  UpdateCustomFieldOptionDto,
  FieldLinkResponse,
  CreateFieldLinkDto,
  UpdateFieldLinkDto,
} from '@/types/custom-field'

export const customFieldsApi = {
  // -- Catalog -----------------------------------------------------------------

  async getAll(): Promise<CustomFieldDef[]> {
    const response = await apiClient.get<CustomFieldDef[]>('/custom-fields')
    return response.data.data ?? []
  },

  async getById(id: string): Promise<CustomFieldDef> {
    const response = await apiClient.get<CustomFieldDef>(`/custom-fields/${id}`)
    return response.data.data!
  },

  async create(dto: CreateCustomFieldDefDto): Promise<CustomFieldDef> {
    const response = await apiClient.post<CustomFieldDef>('/custom-fields', dto)
    return response.data.data!
  },

  async update(id: string, dto: UpdateCustomFieldDefDto): Promise<CustomFieldDef> {
    const response = await apiClient.put<CustomFieldDef>(`/custom-fields/${id}`, dto)
    return response.data.data!
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/custom-fields/${id}`)
  },

  // -- Options ------------------------------------------------------------------

  async getOptions(fieldId: string): Promise<CustomFieldOption[]> {
    const response = await apiClient.get<CustomFieldOption[]>(`/custom-fields/${fieldId}/options`)
    return response.data.data ?? []
  },

  async addOption(fieldId: string, dto: CreateCustomFieldOptionDto): Promise<CustomFieldOption> {
    const response = await apiClient.post<CustomFieldOption>(`/custom-fields/${fieldId}/options`, dto)
    return response.data.data!
  },

  async updateOption(optionId: string, dto: UpdateCustomFieldOptionDto): Promise<CustomFieldOption> {
    const response = await apiClient.put<CustomFieldOption>(`/custom-fields/options/${optionId}`, dto)
    return response.data.data!
  },

  async removeOption(optionId: string): Promise<void> {
    await apiClient.delete(`/custom-fields/options/${optionId}`)
  },

  // -- ResourceType links -------------------------------------------------------

  async getResourceTypeLinks(resourceTypeId: string): Promise<FieldLinkResponse[]> {
    const response = await apiClient.get<FieldLinkResponse[]>(
      `/custom-fields/links/resource-type/${resourceTypeId}`
    )
    return response.data.data ?? []
  },

  async addResourceTypeLink(dto: CreateFieldLinkDto): Promise<FieldLinkResponse> {
    const response = await apiClient.post<FieldLinkResponse>('/custom-fields/links/resource-type', dto)
    return response.data.data!
  },

  async updateResourceTypeLink(linkId: string, dto: UpdateFieldLinkDto): Promise<FieldLinkResponse> {
    const response = await apiClient.put<FieldLinkResponse>(
      `/custom-fields/links/resource-type/${linkId}`,
      dto
    )
    return response.data.data!
  },

  async removeResourceTypeLink(linkId: string): Promise<void> {
    await apiClient.delete(`/custom-fields/links/resource-type/${linkId}`)
  },

  // -- VisitorType links --------------------------------------------------------

  async getVisitorTypeLinks(visitorTypeId: string): Promise<FieldLinkResponse[]> {
    const response = await apiClient.get<FieldLinkResponse[]>(
      `/custom-fields/links/visitor-type/${visitorTypeId}`
    )
    return response.data.data ?? []
  },

  async addVisitorTypeLink(dto: CreateFieldLinkDto): Promise<FieldLinkResponse> {
    const response = await apiClient.post<FieldLinkResponse>('/custom-fields/links/visitor-type', dto)
    return response.data.data!
  },

  async updateVisitorTypeLink(linkId: string, dto: UpdateFieldLinkDto): Promise<FieldLinkResponse> {
    const response = await apiClient.put<FieldLinkResponse>(
      `/custom-fields/links/visitor-type/${linkId}`,
      dto
    )
    return response.data.data!
  },

  async removeVisitorTypeLink(linkId: string): Promise<void> {
    await apiClient.delete(`/custom-fields/links/visitor-type/${linkId}`)
  },

  async getResourceLinks(resourceId: string): Promise<FieldLinkResponse[]> {
    const response = await apiClient.get<FieldLinkResponse[]>(
      `/custom-fields/links/resource/${resourceId}`
    )
    return response.data.data ?? []
  },

  async addResourceLink(dto: CreateFieldLinkDto): Promise<FieldLinkResponse> {
    const response = await apiClient.post<FieldLinkResponse>('/custom-fields/links/resource', dto)
    return response.data.data!
  },

  async updateResourceLink(linkId: string, dto: UpdateFieldLinkDto): Promise<FieldLinkResponse> {
    const response = await apiClient.put<FieldLinkResponse>(
      `/custom-fields/links/resource/${linkId}`,
      dto
    )
    return response.data.data!
  },

  async removeResourceLink(linkId: string): Promise<void> {
    await apiClient.delete(`/custom-fields/links/resource/${linkId}`)
  },
}
