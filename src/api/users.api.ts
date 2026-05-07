import { apiClient } from './client'

export interface UserResponse {
  id: string
  email: string
  fullName: string | null
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface InviteUserDto {
  email: string
  fullName?: string
  role: string
}

export interface CreateUserDto {
  email: string
  password: string
  fullName?: string
  role: string
  isActive?: boolean
}

export interface UpdateUserDto {
  fullName?: string
  role?: string
  isActive?: boolean
}

/**
 * Users API service
 */
export const usersApi = {
  /**
   * Get all users
   */
  async getAll(): Promise<UserResponse[]> {
    const response = await apiClient.get<UserResponse[]>('/users')
    return response.data.data!
  },

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>(`/users/${id}`)
    return response.data.data!
  },

  /**
   * Invite a new user
   */
  async invite(dto: InviteUserDto): Promise<UserResponse> {
    const response = await apiClient.post<UserResponse>('/users/invite', dto)
    return response.data.data!
  },

  /**
   * Create a new user directly (email + password + role)
   */
  async create(dto: CreateUserDto): Promise<UserResponse> {
    const response = await apiClient.post<UserResponse>('/users', dto)
    return response.data.data!
  },

  /**
   * Update user
   */
  async update(id: string, dto: UpdateUserDto): Promise<UserResponse> {
    const response = await apiClient.put<UserResponse>(`/users/${id}`, dto)
    return response.data.data!
  },

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },
}
