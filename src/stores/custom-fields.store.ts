import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { customFieldsApi } from '@/api/custom-fields.api'
import type {
  CustomFieldDef,
  CreateCustomFieldDefDto,
  UpdateCustomFieldDefDto,
  CreateCustomFieldOptionDto,
  UpdateCustomFieldOptionDto,
} from '@/types/custom-field'

export const useCustomFieldsStore = defineStore('customFields', () => {
  // -- State --------------------------------------------------------------------
  const fields = ref<CustomFieldDef[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // -- Getters ------------------------------------------------------------------
  const fieldById = computed(
    () => (id: string) => fields.value.find((f) => f.id === id)
  )

  // -- Actions ------------------------------------------------------------------

  const fetchAll = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      fields.value = await customFieldsApi.getAll()
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch custom fields'
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (dto: CreateCustomFieldDefDto): Promise<CustomFieldDef> => {
    try {
      loading.value = true
      error.value = null
      const field = await customFieldsApi.create(dto)
      fields.value.push(field)
      return field
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create custom field'
      throw err
    } finally {
      loading.value = false
    }
  }

  const update = async (id: string, dto: UpdateCustomFieldDefDto): Promise<CustomFieldDef> => {
    try {
      loading.value = true
      error.value = null
      const updated = await customFieldsApi.update(id, dto)
      const index = fields.value.findIndex((f) => f.id === id)
      if (index !== -1) {
        fields.value[index] = updated
      }
      return updated
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update custom field'
      throw err
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await customFieldsApi.remove(id)
      fields.value = fields.value.filter((f) => f.id !== id)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete custom field'
      throw err
    } finally {
      loading.value = false
    }
  }

  const addOption = async (fieldId: string, dto: CreateCustomFieldOptionDto): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      const option = await customFieldsApi.addOption(fieldId, dto)
      const index = fields.value.findIndex((f) => f.id === fieldId)
      if (index !== -1) {
        fields.value[index].options = [...fields.value[index].options, option]
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to add option'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateOption = async (
    fieldId: string,
    optionId: string,
    dto: UpdateCustomFieldOptionDto
  ): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      const updated = await customFieldsApi.updateOption(optionId, dto)
      const fieldIndex = fields.value.findIndex((f) => f.id === fieldId)
      if (fieldIndex !== -1) {
        const optionIndex = fields.value[fieldIndex].options.findIndex((o) => o.id === optionId)
        if (optionIndex !== -1) {
          fields.value[fieldIndex].options[optionIndex] = updated
        }
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update option'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeOption = async (fieldId: string, optionId: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await customFieldsApi.removeOption(optionId)
      const fieldIndex = fields.value.findIndex((f) => f.id === fieldId)
      if (fieldIndex !== -1) {
        fields.value[fieldIndex].options = fields.value[fieldIndex].options.filter(
          (o) => o.id !== optionId
        )
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to remove option'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    fields,
    loading,
    error,

    // Getters
    fieldById,

    // Actions
    fetchAll,
    create,
    update,
    remove,
    addOption,
    updateOption,
    removeOption,
  }
})
