import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationRulesApi } from '@/api'
import type {
  CreateNotificationRuleDto,
  NotificationRule,
  UpdateNotificationRuleDto,
} from '@/types/notification'

export const useNotificationRulesStore = defineStore('notificationRules', () => {
  // State
  const notificationRules = ref<NotificationRule[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const notificationRuleById = computed(
    () => (id: string) => notificationRules.value.find((nr) => nr.id === id)
  )

  const rulesByResourceType = computed(
    () => (resourceTypeId: string) =>
      notificationRules.value.filter((nr) => nr.resourceTypeId === resourceTypeId)
  )

  const rulesByResource = computed(
    () => (resourceId: string) =>
      notificationRules.value.filter((nr) => nr.resourceId === resourceId)
  )

  // Actions
  const fetchAll = async (): Promise<NotificationRule[]> => {
    try {
      loading.value = true
      error.value = null
      const rules = await notificationRulesApi.getAll()
      notificationRules.value = rules
      return rules
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to fetch notification rules'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchByResourceType = async (
    resourceTypeId: string
  ): Promise<NotificationRule[]> => {
    try {
      loading.value = true
      error.value = null
      const rules = await notificationRulesApi.getByResourceType(resourceTypeId)

      // Merge with existing rules
      rules.forEach((rule) => {
        const index = notificationRules.value.findIndex((nr) => nr.id === rule.id)
        if (index !== -1) {
          notificationRules.value[index] = rule
        } else {
          notificationRules.value.push(rule)
        }
      })

      return rules
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to fetch notification rules for resource type'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchByResource = async (
    resourceId: string
  ): Promise<NotificationRule[]> => {
    try {
      loading.value = true
      error.value = null
      const rules = await notificationRulesApi.getByResource(resourceId)

      rules.forEach((rule) => {
        const index = notificationRules.value.findIndex((nr) => nr.id === rule.id)
        if (index !== -1) {
          notificationRules.value[index] = rule
        } else {
          notificationRules.value.push(rule)
        }
      })

      return rules
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to fetch notification rules for resource'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchEffectiveRules = async (
    resourceId: string,
    resourceTypeId: string
  ): Promise<NotificationRule[]> => {
    try {
      loading.value = true
      error.value = null
      return await notificationRulesApi.getEffective(resourceId, resourceTypeId)
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to fetch effective notification rules'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createNotificationRule = async (
    dto: CreateNotificationRuleDto
  ): Promise<NotificationRule> => {
    try {
      loading.value = true
      error.value = null
      const rule = await notificationRulesApi.create(dto)
      notificationRules.value.push(rule)
      return rule
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create notification rule'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateNotificationRule = async (
    id: string,
    dto: UpdateNotificationRuleDto
  ): Promise<NotificationRule> => {
    try {
      loading.value = true
      error.value = null
      const rule = await notificationRulesApi.update(id, dto)

      const index = notificationRules.value.findIndex((nr) => nr.id === id)
      if (index !== -1) {
        notificationRules.value[index] = rule
      }

      return rule
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update notification rule'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeNotificationRule = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await notificationRulesApi.remove(id)
      notificationRules.value = notificationRules.value.filter((nr) => nr.id !== id)
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to delete notification rule'
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
    notificationRules,
    loading,
    error,

    // Getters
    notificationRuleById,
    rulesByResourceType,
    rulesByResource,

    // Actions
    fetchAll,
    fetchByResourceType,
    fetchByResource,
    fetchEffectiveRules,
    createNotificationRule,
    updateNotificationRule,
    removeNotificationRule,
    setError,
  }
})
