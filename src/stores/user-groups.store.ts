import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userGroupsApi } from '@/api'
import type {
  AddGroupMemberDto,
  AddGroupRelationDto,
  CreateUserGroupDto,
  UpdateUserGroupDto,
  UserGroup,
} from '@/types/user-group'

export const useUserGroupsStore = defineStore('userGroups', () => {
  // State
  const userGroups = ref<UserGroup[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const userGroupById = computed(
    () => (id: string) => userGroups.value.find((ug) => ug.id === id)
  )

  // Actions
  const fetchAllUserGroups = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      userGroups.value = await userGroupsApi.getAll()
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch user groups'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchUserGroupById = async (id: string): Promise<UserGroup> => {
    try {
      loading.value = true
      error.value = null
      const userGroup = await userGroupsApi.getById(id)

      const index = userGroups.value.findIndex((ug) => ug.id === id)
      if (index !== -1) {
        userGroups.value[index] = userGroup
      } else {
        userGroups.value.push(userGroup)
      }

      return userGroup
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch user group'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createUserGroup = async (
    dto: CreateUserGroupDto
  ): Promise<UserGroup> => {
    try {
      loading.value = true
      error.value = null
      const userGroup = await userGroupsApi.create(dto)
      userGroups.value.push(userGroup)
      return userGroup
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create user group'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateUserGroup = async (
    id: string,
    dto: UpdateUserGroupDto
  ): Promise<UserGroup> => {
    try {
      loading.value = true
      error.value = null
      const userGroup = await userGroupsApi.update(id, dto)

      const index = userGroups.value.findIndex((ug) => ug.id === id)
      if (index !== -1) {
        userGroups.value[index] = userGroup
      }

      return userGroup
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update user group'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeUserGroup = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await userGroupsApi.remove(id)
      userGroups.value = userGroups.value.filter((ug) => ug.id !== id)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete user group'
      throw err
    } finally {
      loading.value = false
    }
  }

  const addGroupMember = async (
    groupId: string,
    dto: AddGroupMemberDto
  ): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await userGroupsApi.addMember(groupId, dto)

      // Refresh the group
      await fetchUserGroupById(groupId)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to add group member'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeGroupMember = async (
    groupId: string,
    userId: string
  ): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await userGroupsApi.removeMember(groupId, userId)

      // Refresh the group
      await fetchUserGroupById(groupId)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to remove group member'
      throw err
    } finally {
      loading.value = false
    }
  }

  const addGroupRelation = async (
    groupId: string,
    dto: AddGroupRelationDto
  ): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await userGroupsApi.addRelation(groupId, dto)

      // Refresh the group
      await fetchUserGroupById(groupId)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to add group relation'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeGroupRelation = async (
    groupId: string,
    relationId: string
  ): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await userGroupsApi.removeRelation(relationId)

      // Refresh the group
      await fetchUserGroupById(groupId)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to remove group relation'
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
    userGroups,
    loading,
    error,

    // Getters
    userGroupById,

    // Actions
    fetchAllUserGroups,
    fetchUserGroupById,
    createUserGroup,
    updateUserGroup,
    removeUserGroup,
    addGroupMember,
    removeGroupMember,
    addGroupRelation,
    removeGroupRelation,
    setError,
  }
})
