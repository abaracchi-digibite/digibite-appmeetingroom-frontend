import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { plantsApi } from '@/api'
import { useStoreAction } from '@/composables/useStoreAction'
import type { CreatePlantDto, Plant, UpdatePlantDto } from '@/types/plant'

export const usePlantsStore = defineStore('plants', () => {
  // State
  const plants = ref<Plant[]>([])
  const currentPlant = ref<Plant | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activePlants = computed(() =>
    plants.value.filter((plant) => plant.isActive)
  )

  const plantById = computed(
    () => (id: string) => plants.value.find((plant) => plant.id === id)
  )

  // Actions
  const fetchAll = useStoreAction(
    loading,
    error,
    async (): Promise<void> => {
      plants.value = await plantsApi.getAll()
    },
    'Failed to fetch plants'
  )

  const fetchById = useStoreAction(
    loading,
    error,
    async (id: string): Promise<Plant> => {
      const plant = await plantsApi.getById(id)
      currentPlant.value = plant

      // Update in list if exists
      const index = plants.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        plants.value[index] = plant
      } else {
        plants.value.push(plant)
      }

      return plant
    },
    'Failed to fetch plant'
  )

  const create = useStoreAction(
    loading,
    error,
    async (dto: CreatePlantDto): Promise<Plant> => {
      const plant = await plantsApi.create(dto)
      plants.value.push(plant)
      return plant
    },
    'Failed to create plant'
  )

  const update = useStoreAction(
    loading,
    error,
    async (id: string, dto: UpdatePlantDto): Promise<Plant> => {
      const plant = await plantsApi.update(id, dto)

      const index = plants.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        plants.value[index] = plant
      }

      if (currentPlant.value?.id === id) {
        currentPlant.value = plant
      }

      return plant
    },
    'Failed to update plant'
  )

  const remove = useStoreAction(
    loading,
    error,
    async (id: string): Promise<void> => {
      await plantsApi.remove(id)

      plants.value = plants.value.filter((p) => p.id !== id)

      if (currentPlant.value?.id === id) {
        currentPlant.value = null
      }
    },
    'Failed to delete plant'
  )

  // Fetch all plants for a specific tenant
  const fetchAllByTenant = useStoreAction(
    loading,
    error,
    async (tenantId: string): Promise<void> => {
      plants.value = await plantsApi.getAllByTenant(tenantId)
    },
    'Failed to fetch plants by tenant'
  )

  const setCurrentPlant = (plant: Plant | null): void => {
    currentPlant.value = plant
  }

  const setError = (message: string | null): void => {
    error.value = message
  }

  return {
    // State
    plants,
    currentPlant,
    loading,
    error,

    // Getters
    activePlants,
    plantById,

    // Actions
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    setCurrentPlant,
    setError,
    fetchAllByTenant,
  }
})
