import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { unavailabilityApi, holidaysApi } from '@/api'
import type {
  CreateHolidayDto,
  CreateUnavailabilityBlockDto,
  Holiday,
  UnavailabilityBlock,
  UpdateHolidayDto,
  UpdateUnavailabilityBlockDto,
} from '@/types/unavailability'

export const useUnavailabilityStore = defineStore('unavailability', () => {
  // State
  const unavailabilityBlocks = ref<UnavailabilityBlock[]>([])
  const holidays = ref<Holiday[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const unavailabilityBlockById = computed(
    () => (id: string) =>
      unavailabilityBlocks.value.find((ub) => ub.id === id)
  )

  const blocksByResource = computed(
    () => (resourceId: string) =>
      unavailabilityBlocks.value.filter((ub) => ub.resourceId === resourceId)
  )

  const activeUnavailabilityBlocks = computed(() =>
    unavailabilityBlocks.value.filter((ub) => ub.isActive)
  )

  const holidayById = computed(
    () => (id: string) => holidays.value.find((h) => h.id === id)
  )

  const activeHolidays = computed(() =>
    holidays.value.filter((h) => h.isActive)
  )

  // Unavailability Block Actions
  const fetchAllUnavailabilityBlocks = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      unavailabilityBlocks.value = await unavailabilityApi.getAll()
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to fetch unavailability blocks'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchUnavailabilityBlockById = async (
    id: string
  ): Promise<UnavailabilityBlock> => {
    try {
      loading.value = true
      error.value = null
      const block = await unavailabilityApi.getById(id)

      const index = unavailabilityBlocks.value.findIndex((ub) => ub.id === id)
      if (index !== -1) {
        unavailabilityBlocks.value[index] = block
      } else {
        unavailabilityBlocks.value.push(block)
      }

      return block
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to fetch unavailability block'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createUnavailabilityBlock = async (
    dto: CreateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlock> => {
    try {
      loading.value = true
      error.value = null
      const block = await unavailabilityApi.create(dto)
      unavailabilityBlocks.value.push(block)
      return block
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to create unavailability block'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateUnavailabilityBlock = async (
    id: string,
    dto: UpdateUnavailabilityBlockDto
  ): Promise<UnavailabilityBlock> => {
    try {
      loading.value = true
      error.value = null
      const block = await unavailabilityApi.update(id, dto)

      const index = unavailabilityBlocks.value.findIndex((ub) => ub.id === id)
      if (index !== -1) {
        unavailabilityBlocks.value[index] = block
      }

      return block
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to update unavailability block'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeUnavailabilityBlock = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await unavailabilityApi.remove(id)
      unavailabilityBlocks.value = unavailabilityBlocks.value.filter(
        (ub) => ub.id !== id
      )
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'Failed to delete unavailability block'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Holiday Actions
  const fetchAllHolidays = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      holidays.value = await holidaysApi.getAll()
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch holidays'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchHolidayById = async (id: string): Promise<Holiday> => {
    try {
      loading.value = true
      error.value = null
      const holiday = await holidaysApi.getById(id)

      const index = holidays.value.findIndex((h) => h.id === id)
      if (index !== -1) {
        holidays.value[index] = holiday
      } else {
        holidays.value.push(holiday)
      }

      return holiday
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to fetch holiday'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createHoliday = async (dto: CreateHolidayDto): Promise<Holiday> => {
    try {
      loading.value = true
      error.value = null
      const holiday = await holidaysApi.create(dto)
      holidays.value.push(holiday)
      return holiday
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to create holiday'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateHoliday = async (
    id: string,
    dto: UpdateHolidayDto
  ): Promise<Holiday> => {
    try {
      loading.value = true
      error.value = null
      const holiday = await holidaysApi.update(id, dto)

      const index = holidays.value.findIndex((h) => h.id === id)
      if (index !== -1) {
        holidays.value[index] = holiday
      }

      return holiday
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to update holiday'
      throw err
    } finally {
      loading.value = false
    }
  }

  const removeHoliday = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      await holidaysApi.remove(id)
      holidays.value = holidays.value.filter((h) => h.id !== id)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to delete holiday'
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
    unavailabilityBlocks,
    holidays,
    loading,
    error,

    // Getters
    unavailabilityBlockById,
    blocksByResource,
    activeUnavailabilityBlocks,
    holidayById,
    activeHolidays,

    // Unavailability Block Actions
    fetchAllUnavailabilityBlocks,
    fetchUnavailabilityBlockById,
    createUnavailabilityBlock,
    updateUnavailabilityBlock,
    removeUnavailabilityBlock,

    // Holiday Actions
    fetchAllHolidays,
    fetchHolidayById,
    createHoliday,
    updateHoliday,
    removeHoliday,

    // Utilities
    setError,
  }
})
