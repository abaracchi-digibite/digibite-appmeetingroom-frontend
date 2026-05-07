import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { visitorTypesApi } from '@/api'
import type {
  CreateVisitorTypeDto,
  UpdateVisitorTypeDto,
  VisitorType,
} from '@/types/visitor-type'
import type {
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
  CustomField,
} from '@/types/resource'

export const useVisitorTypesStore = defineStore('visitorTypes', () => {
  // State
  const visitorTypes = ref<VisitorType[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const visitorTypeById = computed(
    () => (id: string) => visitorTypes.value.find((vt) => vt.id === id)
  )

  // Actions
  const fetchAllVisitorTypes = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      visitorTypes.value = await visitorTypesApi.getAll()
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch visitor types'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchVisitorTypeById = async (id: string): Promise<VisitorType> => {
    try {
      loading.value = true
      error.value = null
      const visitorType = await visitorTypesApi.getById(id)

      const index = visitorTypes.value.findIndex((vt) => vt.id === id)
      if (index !== -1) {
        visitorTypes.value[index] = visitorType
      } else {
        visitorTypes.value.push(visitorType)
      }

      return visitorType
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch visitor type'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createVisitorType = async (
    dto: CreateVisitorTypeDto
  ): Promise<VisitorType> => {
    try {
      loading.value = true
      error.value = null
      const visitorType = await visitorTypesApi.create(dto)
      visitorTypes.value.push(visitorType)
      return visitorType
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create visitor type'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateVisitorType = async (
    id: string,
    dto: UpdateVisitorTypeDto
  ): Promise<VisitorType> => {
    try {
      loading.value = true
      error.value = null
      const visitorType = await visitorTypesApi.update(id, dto)

      const index = visitorTypes.value.findIndex((vt) => vt.id === id)
      if (index !== -1) {
        visitorTypes.value[index] = visitorType
      }

      return visitorType
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update visitor type'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeVisitorType = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await visitorTypesApi.remove(id)
      visitorTypes.value = visitorTypes.value.filter((vt) => vt.id !== id)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete visitor type'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Custom Fields
  const addCustomField = async (
    typeId: string,
    dto: CreateCustomFieldDto
  ): Promise<CustomField> => {
    try {
      loading.value = true
      error.value = null
      const field = await visitorTypesApi.addCustomField(typeId, dto)

      const typeIndex = visitorTypes.value.findIndex((vt) => vt.id === typeId)
      if (typeIndex !== -1) {
        visitorTypes.value[typeIndex].customFields?.push(field)
      }

      return field
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to add custom field'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCustomField = async (
    fieldId: string,
    dto: UpdateCustomFieldDto
  ): Promise<CustomField> => {
    try {
      loading.value = true
      error.value = null
      const field = await visitorTypesApi.updateCustomField(fieldId, dto)

      visitorTypes.value.forEach((vt) => {
        const fieldIndex = vt.customFields?.findIndex((f) => f.id === fieldId) ?? -1
        if (fieldIndex !== -1) {
          vt.customFields![fieldIndex] = field
        }
      })

      return field
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update custom field'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeCustomField = async (fieldId: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await visitorTypesApi.removeCustomField(fieldId)

      visitorTypes.value.forEach((vt) => {
        vt.customFields = vt.customFields?.filter((f) => f.id !== fieldId) ?? []
      })
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete custom field'
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
    visitorTypes,
    loading,
    error,

    // Getters
    visitorTypeById,

    // Actions
    fetchAllVisitorTypes,
    fetchVisitorTypeById,
    createVisitorType,
    updateVisitorType,
    removeVisitorType,
    addCustomField,
    updateCustomField,
    removeCustomField,
    setError,
  }
})
