import { apiClient } from './client'
import type {
  Visitor,
  CreateVisitorDto,
  UpdateVisitorDto,
  VisitorSearchResult,
  VisitorEmailCheck,
} from '@/types/visitor'

/**
 * Visitors (rubrica) API service.
 * Backend: /api/visitors — vedi Visitor/VisitorEndpoints.cs
 */
export const visitorsApi = {
  async getAll(): Promise<Visitor[]> {
    const response = await apiClient.get<Visitor[]>('/visitors')
    return response.data.data ?? []
  },

  async getById(id: string): Promise<Visitor> {
    const response = await apiClient.get<Visitor>(`/visitors/${id}`)
    return response.data.data!
  },

  /** Autocomplete rubrica (min 2 char, max 50 risultati). */
  async search(q: string, limit = 10): Promise<VisitorSearchResult[]> {
    const response = await apiClient.get<VisitorSearchResult[]>('/visitors/search', {
      params: { q, limit },
    })
    return response.data.data ?? []
  },

  /**
   * Verifica se l'email è già censita in rubrica. Usata dal wizard per mostrare il
   * popup "Email già censita con questo nome e cognome. Salvare lo stesso?"
   */
  async checkEmail(email: string): Promise<VisitorEmailCheck> {
    const response = await apiClient.get<VisitorEmailCheck>('/visitors/check-email', {
      params: { email },
    })
    return response.data.data!
  },

  async create(dto: CreateVisitorDto): Promise<Visitor> {
    const response = await apiClient.post<Visitor>('/visitors', dto)
    return response.data.data!
  },

  async update(id: string, dto: UpdateVisitorDto): Promise<Visitor> {
    const response = await apiClient.put<Visitor>(`/visitors/${id}`, dto)
    return response.data.data!
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/visitors/${id}`)
  },
}
