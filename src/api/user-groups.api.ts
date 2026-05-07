import { apiClient } from './client'
import type {
  AddGroupMemberDto,
  AddGroupRelationDto,
  CreateUserGroupDto,
  UpdateUserGroupDto,
  UserGroup,
} from '@/types/user-group'

/**
 * User Groups API service
 */
export const userGroupsApi = {
  /**
   * Get all user groups
   */
  async getAll(): Promise<UserGroup[]> {
    const response = await apiClient.get<UserGroup[]>('/user-groups')
    return response.data.data!
  },

  /**
   * Get user group by ID
   */
  async getById(id: string): Promise<UserGroup> {
    const response = await apiClient.get<UserGroup>(`/user-groups/${id}`)
    return response.data.data!
  },

  /**
   * Create new user group
   */
  async create(dto: CreateUserGroupDto): Promise<UserGroup> {
    const response = await apiClient.post<UserGroup>('/user-groups', dto)
    return response.data.data!
  },

  /**
   * Update user group
   */
  async update(id: string, dto: UpdateUserGroupDto): Promise<UserGroup> {
    const response = await apiClient.put<UserGroup>(
      `/user-groups/${id}`,
      dto
    )
    return response.data.data!
  },

  /**
   * Delete user group
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/user-groups/${id}`)
  },

  /**
   * Add member to group
   */
  async addMember(groupId: string, dto: AddGroupMemberDto): Promise<void> {
    await apiClient.post(`/user-groups/${groupId}/members`, dto)
  },

  /**
   * Remove member from group
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/user-groups/${groupId}/members/${userId}`)
  },

  /**
   * Add a ReBAC relation to a group
   */
  async addRelation(groupId: string, dto: AddGroupRelationDto): Promise<void> {
    await apiClient.post(`/user-groups/${groupId}/relations`, dto)
  },

  /**
   * Remove a ReBAC relation from a group (by relation ID)
   */
  async removeRelation(relationId: string): Promise<void> {
    await apiClient.delete(`/user-groups/relations/${relationId}`)
  },
}
