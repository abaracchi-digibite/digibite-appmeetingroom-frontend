import { apiClient } from './client'
import type {
  CreateHolidayDto,
  CreateUnavailabilityBlockDto,
  Holiday,
  UnavailabilityBlock,
  UpdateHolidayDto,
  UpdateUnavailabilityBlockDto,
} from '@/types/unavailability'

export const unavailabilityApi = {
  async getAll(params?: {
    resourceId?: string
    plantId?: string
    activeOnly?: boolean
  }): Promise<UnavailabilityBlock[]> {
    const response = await apiClient.get<UnavailabilityBlock[]>('/unavailability-blocks', { params })
    return response.data.data!
  },

  async getById(id: string): Promise<UnavailabilityBlock> {
    const response = await apiClient.get<UnavailabilityBlock>(`/unavailability-blocks/${id}`)
    return response.data.data!
  },

  async create(dto: CreateUnavailabilityBlockDto): Promise<UnavailabilityBlock> {
    const response = await apiClient.post<UnavailabilityBlock>('/unavailability-blocks', dto)
    return response.data.data!
  },

  async update(id: string, dto: UpdateUnavailabilityBlockDto): Promise<UnavailabilityBlock> {
    const response = await apiClient.put<UnavailabilityBlock>(`/unavailability-blocks/${id}`, dto)
    return response.data.data!
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/unavailability-blocks/${id}`)
  },
}

export const holidaysApi = {
  async getAll(params?: { plantId?: string }): Promise<Holiday[]> {
    const response = await apiClient.get<Holiday[]>('/holidays', { params })
    return response.data.data!
  },

  async getById(id: string): Promise<Holiday> {
    const response = await apiClient.get<Holiday>(`/holidays/${id}`)
    return response.data.data!
  },

  async create(dto: CreateHolidayDto): Promise<Holiday> {
    const response = await apiClient.post<Holiday>('/holidays', dto)
    return response.data.data!
  },

  async update(id: string, dto: UpdateHolidayDto): Promise<Holiday> {
    const response = await apiClient.put<Holiday>(`/holidays/${id}`, dto)
    return response.data.data!
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/holidays/${id}`)
  },
}
