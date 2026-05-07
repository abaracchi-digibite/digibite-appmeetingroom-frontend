import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usersApi, type UserResponse, type InviteUserDto, type CreateUserDto, type UpdateUserDto } from '@/api/users.api'

export const useUsersStore = defineStore('users', () => {
  // State
  const users = ref<UserResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  const fetchAll = async (): Promise<UserResponse[]> => {
    try {
      loading.value = true
      error.value = null
      const userList = await usersApi.getAll()
      users.value = userList
      return userList
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to fetch users'
      throw err
    } finally {
      loading.value = false
    }
  }

  const inviteUser = async (dto: InviteUserDto): Promise<UserResponse> => {
    try {
      loading.value = true
      error.value = null
      const user = await usersApi.invite(dto)
      users.value.unshift(user)
      return user
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to invite user'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createUser = async (dto: CreateUserDto): Promise<UserResponse> => {
    try {
      loading.value = true
      error.value = null
      const user = await usersApi.create(dto)
      users.value.unshift(user)
      return user
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create user'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (id: string, dto: UpdateUserDto): Promise<UserResponse> => {
    try {
      loading.value = true
      error.value = null
      const user = await usersApi.update(id, dto)

      const index = users.value.findIndex((u) => u.id === id)
      if (index !== -1) {
        users.value[index] = user
      }

      return user
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update user'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeUser = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await usersApi.delete(id)
      users.value = users.value.filter((u) => u.id !== id)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete user'
      throw err
    } finally {
      loading.value = false
    }
  }

  const setError = (message: string | null): void => {
    error.value = message
  }

  return {
    // State
    users,
    loading,
    error,

    // Actions
    fetchAll,
    inviteUser,
    createUser,
    updateUser,
    removeUser,
    setError,
  }
})
