import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { resourcesApi, resourceTypesApi } from '@/api'
import { useStoreAction } from '@/composables/useStoreAction'
import type {
  CreateResourceDto,
  CreateResourceTypeDto,
  CustomField,
  CreateCustomFieldDto,
  Resource,
  ResourceType,
  UpdateResourceDto,
  UpdateResourceTypeDto,
  UpdateCustomFieldDto,
} from '@/types/resource'

export const useResourcesStore = defineStore('resources', () => {
  // State
  const resources = ref<Resource[]>([])
  const resourceTypes = ref<ResourceType[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const resourceById = computed(
    () => (id: string) => resources.value.find((r) => r.id === id)
  )

  const resourceTypeById = computed(
    () => (id: string) => resourceTypes.value.find((rt) => rt.id === id)
  )

  const resourcesByPlant = computed(
    () => (plantId: string) =>
      resources.value.filter((r) => r.plantId === plantId)
  )

  const resourcesByType = computed(
    () => (typeId: string) =>
      resources.value.filter((r) => r.resourceTypeId === typeId)
  )

  // Resource Actions
  const fetchAllResources = useStoreAction(
    loading,
    error,
    async (): Promise<void> => {
      resources.value = await resourcesApi.getAll()
    },
    'Failed to fetch resources'
  )

  const fetchResourceById = useStoreAction(
    loading,
    error,
    async (id: string): Promise<Resource> => {
      const resource = await resourcesApi.getById(id)

      const index = resources.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        resources.value[index] = resource
      } else {
        resources.value.push(resource)
      }

      return resource
    },
    'Failed to fetch resource'
  )

  const fetchResourcesByPlant = useStoreAction(
    loading,
    error,
    async (plantId: string): Promise<Resource[]> => {
      const plantResources = await resourcesApi.getByPlant(plantId)

      // Merge with existing resources
      plantResources.forEach((newResource) => {
        const index = resources.value.findIndex((r) => r.id === newResource.id)
        if (index !== -1) {
          resources.value[index] = newResource
        } else {
          resources.value.push(newResource)
        }
      })

      return plantResources
    },
    'Failed to fetch plant resources'
  )

  const fetchAvailableResourcesByPlant = useStoreAction(
    loading,
    error,
    async (plantId: string): Promise<Resource[]> => {
      return await resourcesApi.getAvailableByPlant(plantId)
    },
    'Failed to fetch available resources'
  )

  const createResource = useStoreAction(
    loading,
    error,
    async (dto: CreateResourceDto): Promise<Resource> => {
      const resource = await resourcesApi.create(dto)
      resources.value.push(resource)
      return resource
    },
    'Failed to create resource'
  )

  const updateResource = useStoreAction(
    loading,
    error,
    async (id: string, dto: UpdateResourceDto): Promise<Resource> => {
      const resource = await resourcesApi.update(id, dto)

      const index = resources.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        resources.value[index] = resource
      }

      return resource
    },
    'Failed to update resource'
  )

  const removeResource = useStoreAction(
    loading,
    error,
    async (id: string): Promise<void> => {
      await resourcesApi.remove(id)
      resources.value = resources.value.filter((r) => r.id !== id)
    },
    'Failed to delete resource'
  )

  // Resource Type Actions
  const fetchAllResourceTypes = useStoreAction(
    loading,
    error,
    async (): Promise<void> => {
      resourceTypes.value = await resourceTypesApi.getAll()
    },
    'Failed to fetch resource types'
  )

  const fetchResourceTypeById = useStoreAction(
    loading,
    error,
    async (id: string): Promise<ResourceType> => {
      const resourceType = await resourceTypesApi.getById(id)

      const index = resourceTypes.value.findIndex((rt) => rt.id === id)
      if (index !== -1) {
        resourceTypes.value[index] = resourceType
      } else {
        resourceTypes.value.push(resourceType)
      }

      return resourceType
    },
    'Failed to fetch resource type'
  )

  const createResourceType = useStoreAction(
    loading,
    error,
    async (dto: CreateResourceTypeDto): Promise<ResourceType> => {
      const resourceType = await resourceTypesApi.create(dto)
      resourceTypes.value.push(resourceType)
      return resourceType
    },
    'Failed to create resource type'
  )

  const updateResourceType = useStoreAction(
    loading,
    error,
    async (id: string, dto: UpdateResourceTypeDto): Promise<ResourceType> => {
      const resourceType = await resourceTypesApi.update(id, dto)

      const index = resourceTypes.value.findIndex((rt) => rt.id === id)
      if (index !== -1) {
        resourceTypes.value[index] = resourceType
      }

      return resourceType
    },
    'Failed to update resource type'
  )

  const removeResourceType = useStoreAction(
    loading,
    error,
    async (id: string): Promise<void> => {
      await resourceTypesApi.remove(id)
      resourceTypes.value = resourceTypes.value.filter((rt) => rt.id !== id)
    },
    'Failed to delete resource type'
  )

  // Custom Field Actions
  const addCustomField = useStoreAction(
    loading,
    error,
    async (typeId: string, dto: CreateCustomFieldDto): Promise<CustomField> => {
      const field = await resourceTypesApi.addCustomField(typeId, dto)

      // Update resource type in store
      const typeIndex = resourceTypes.value.findIndex((rt) => rt.id === typeId)
      if (typeIndex !== -1) {
        resourceTypes.value[typeIndex].customFields?.push(field)
      }

      return field
    },
    'Failed to add custom field'
  )

  const updateCustomField = useStoreAction(
    loading,
    error,
    async (fieldId: string, dto: UpdateCustomFieldDto): Promise<CustomField> => {
      const field = await resourceTypesApi.updateCustomField(fieldId, dto)

      // Update in resource types
      resourceTypes.value.forEach((rt) => {
        const fieldIndex = rt.customFields?.findIndex((f) => f.id === fieldId) ?? -1
        if (fieldIndex !== -1) {
          rt.customFields![fieldIndex] = field
        }
      })

      return field
    },
    'Failed to update custom field'
  )

  const removeCustomField = useStoreAction(
    loading,
    error,
    async (fieldId: string): Promise<void> => {
      await resourceTypesApi.removeCustomField(fieldId)

      // Remove from resource types
      resourceTypes.value.forEach((rt) => {
        rt.customFields = rt.customFields?.filter((f) => f.id !== fieldId) ?? []
      })
    },
    'Failed to delete custom field'
  )

  const setError = (message: string | null): void => {
    error.value = message
  }

  // Fetch all resources for a specific tenant
  const fetchAllResourcesByTenant = useStoreAction(
    loading,
    error,
    async (tenantId: string): Promise<void> => {
      resources.value = await resourcesApi.getAllByTenant(tenantId)
    },
    'Failed to fetch resources by tenant'
  )

  // Fetch all resource types for a specific tenant
  const fetchAllResourceTypesByTenant = useStoreAction(
    loading,
    error,
    async (tenantId: string): Promise<void> => {
      resourceTypes.value = await resourceTypesApi.getAllByTenant(tenantId)
    },
    'Failed to fetch resource types by tenant'
  )

  return {
    // State
    resources,
    resourceTypes,
    loading,
    error,

    // Getters
    resourceById,
    resourceTypeById,
    resourcesByPlant,
    resourcesByType,

    // Resource Actions
    fetchAllResources,
    fetchResourceById,
    fetchResourcesByPlant,
    fetchAvailableResourcesByPlant,
    createResource,
    updateResource,
    removeResource,

    // Resource Type Actions
    fetchAllResourceTypes,
    fetchResourceTypeById,
    createResourceType,
    updateResourceType,
    removeResourceType,

    // Custom Field Actions
    addCustomField,
    updateCustomField,
    removeCustomField,

    // Utilities
    setError,

    // Tenant filtered actions
    fetchAllResourcesByTenant,
    fetchAllResourceTypesByTenant,
  }
})
