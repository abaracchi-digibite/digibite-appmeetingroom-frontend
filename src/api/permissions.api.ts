import { apiClient } from './client'

export interface RelationDto {
  userId: string
  relation: string
  objectType: string
  objectId?: string | null
}

export interface CheckRelationRequest {
  userId: string
  relation: string
  objectType: string
  objectId?: string | null
}

export interface CheckRelationResponse {
  allowed: boolean
  inheritedFrom?: string | null
}

export interface UserRelationResponse {
  id: string
  userId: string
  relation: string
  objectType: string
  objectId?: string | null
  createdAt: string
}

/**
 * Permissions API service for ReBAC relationship management
 */
export const permissionsApi = {
  async listAll(): Promise<UserRelationResponse[]> {
    const response = await apiClient.get<UserRelationResponse[]>('/relations')
    return response.data.data!
  },

  /**
   * Assign a new relation to a user
   */
  async assign(dto: RelationDto): Promise<void> {
    await apiClient.post('/relations', dto)
  },

  /**
   * Remove a relation from a user
   */
  async remove(dto: RelationDto): Promise<void> {
    await apiClient.delete('/relations', { data: dto })
  },

  /**
   * Check if a user has a specific relation
   */
  async check(dto: CheckRelationRequest): Promise<CheckRelationResponse> {
    const response = await apiClient.post<CheckRelationResponse>('/relations/check', dto)
    return response.data.data!
  },

  /**
   * List all relations for a user in the current tenant
   */
  async listByUser(userId: string): Promise<UserRelationResponse[]> {
    const response = await apiClient.get<UserRelationResponse[]>(`/relations/user/${userId}`)
    return response.data.data!
  },

  /**
   * List all users who have relations on an object
   */
  async listByObject(objectType: string, objectId: string): Promise<UserRelationResponse[]> {
    const response = await apiClient.get<UserRelationResponse[]>(`/relations/object/${objectType}/${objectId}`)
    return response.data.data!
  },
}
